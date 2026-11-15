import json

import httpx
import pytest
from pydantic import ValidationError

from core import translation as tr


async def invoke(function, data, *args, status=200, inspect=None, **kwargs):
    def handle(request):
        if inspect:
            inspect(json.loads(request.content))
        return httpx.Response(status, json={"status": "completed", "output": [{"type": "message", "role": "assistant",
            "status": "completed", "content": [{"type": "output_text", "text": json.dumps(data)}]}]})
    async with httpx.AsyncClient(transport=httpx.MockTransport(handle)) as client:
        return await function(*args, api_key="test-key", client=client, **kwargs)


def review_data():
    return {"reviews": [{"profile_id": id, "likely_questions": [], "missing_information": []}
                        for id in ("manager", "frontend", "designer")]}


def thread_data():
    return {"interpretations": [
        {"profile_id": "manager", "understanding": "Scope includes all checkout screens.",
         "insufficient_evidence": False, "source_message_ids": ["m1"]},
        {"profile_id": "frontend", "understanding": "Only payment screen is included.",
         "insufficient_evidence": False, "source_message_ids": ["m2"]}],
        "disagreements": []}


MESSAGES = [{"id": "m1", "profile_id": "manager", "text": "Update all checkout screens."},
            {"id": "m2", "profile_id": "frontend", "text": "I will update payment only."}]


async def test_language_defaults_and_explicit_recipient_binding():
    data = {"translations": [{"profile_id": id, "message": "Example", "missing_information": [],
                               "target_language": lang}
                              for id, lang in [("manager", "en"), ("frontend", "ko"), ("designer", "zh")]]}
    def inspect(payload):
        user = json.loads(payload["input"][0]["content"])
        assert user["target_languages"] == {"manager": "en", "frontend": "ko", "designer": "zh"}
        assert "clarification" in payload["instructions"]
    result = await invoke(tr.translate, data, "Hello", target_languages={"frontend": "ko", "designer": "zh"}, inspect=inspect)
    assert result.translations[1].target_language == "ko"
    data["translations"][1]["target_language"] = "en"
    with pytest.raises(tr.TranslationError, match="invalid response"):
        await invoke(tr.translate, data, "Hello", target_languages={"frontend": "ko", "designer": "zh"})


@pytest.mark.parametrize("settings", [{"unknown": "en"}, {"manager": "fr"}])
async def test_invalid_language_settings_rejected_before_provider(settings):
    with pytest.raises(ValidationError):
        await invoke(tr.translate, {}, "Hello", target_languages=settings)


async def test_review_accepts_empty_findings_and_requires_all_recipients():
    result = await invoke(tr.review, review_data(), "Everything is specified.")
    assert len(result.reviews) == 3 and not result.reviews[0].missing_information
    for ids in [["manager"], ["manager"] * 3, ["manager", "frontend", "unknown"]]:
        data = {"reviews": [{"profile_id": id, "likely_questions": [], "missing_information": []} for id in ids]}
        with pytest.raises(tr.TranslationError, match="invalid response"):
            await invoke(tr.review, data, "Hello")


def test_review_supports_owner_and_completion_criteria_gaps():
    data = {'reviews': [{'profile_id': id, 'likely_questions': [], 'missing_information': [
        {'category': 'owner', 'question': 'Who owns this?'} if id == 'manager' else
        {'category': 'completion_criteria', 'question': 'What counts as complete?'}
    ]} for id in ('manager', 'frontend', 'designer')]}
    result = tr.ReviewBatch.model_validate(data)
    assert result.reviews[0].missing_information[0].category == 'owner'
    assert result.reviews[1].missing_information[0].category == 'completion_criteria'


def test_review_recipient_count_follows_the_configured_profiles(monkeypatch):
    monkeypatch.setattr(tr, 'PROFILES', tr.PROFILES[:2])
    data = {'reviews': [{'profile_id': id, 'likely_questions': [], 'missing_information': []}
                        for id in ['manager', 'frontend']]}
    result = tr.ReviewBatch.model_validate(data)
    assert [review.profile_id for review in result.reviews] == ['manager', 'frontend']


async def test_improvement_preserves_source_and_explicit_unresolved_information():
    data = {"revised_draft": "Please confirm [deadline?].", "unresolved_information": ["What is the deadline?"]}
    def inspect(payload):
        user = json.loads(payload["input"][0]["content"])
        assert user["source_message"] == "We need checkout soon."
        assert user["review"] == review_data()
        assert "Do not invent" in payload["instructions"]
    result = await invoke(tr.improve, data, "We need checkout soon.", tr.ReviewBatch(**review_data()), inspect=inspect)
    assert result.revised_draft == data["revised_draft"]
    with pytest.raises(tr.TranslationError, match="invalid response"):
        await invoke(tr.improve, {**data, "revised_draft": " "}, "Hello", tr.ReviewBatch(**review_data()))


@pytest.mark.parametrize("messages", [MESSAGES[:1], MESSAGES * 11,
    [MESSAGES[0], MESSAGES[0]], [MESSAGES[0], {**MESSAGES[1], "profile_id": "unknown"}],
    [{**MESSAGES[0], "text": "x" * 6000}, {**MESSAGES[1], "text": "x" * 6000}, {"id": "m3", "profile_id": "manager", "text": "x"}]])
def test_thread_input_limits_and_ids(messages):
    with pytest.raises(ValidationError):
        tr.ThreadInput(messages=messages)


async def test_thread_accepts_no_conflict_and_validates_evidence():
    result = await invoke(tr.thread_check, thread_data(), MESSAGES)
    assert result.disagreements == []
    for bad in ["unknown", "m2"]:
        data = thread_data()
        data["interpretations"][0]["source_message_ids"] = [bad]
        with pytest.raises(tr.TranslationError, match="invalid response"):
            await invoke(tr.thread_check, data, MESSAGES)


async def test_thread_candidate_references_real_participants_and_messages():
    candidate = {"id": "c1", "topic": "Scope", "profile_ids": ["manager", "frontend"],
                 "source_message_ids": ["m1", "m2"], "question": "Which screens are included?",
                 "choices": ["All checkout screens", "Payment only"]}
    data = {**thread_data(), "disagreements": [candidate]}
    result = await invoke(tr.thread_check, data, MESSAGES)
    assert result.disagreements[0].question == candidate["question"]
    for change in [{"profile_ids": ["manager", "unknown"]}, {"source_message_ids": ["m1"]},
                   {"choices": ["Same", "Same"]}, {"source_message_ids": ["invented"]}]:
        with pytest.raises(tr.TranslationError, match="invalid response"):
            await invoke(tr.thread_check, {**data, "disagreements": [{**candidate, **change}]}, MESSAGES)


@pytest.mark.parametrize("feature", ["review", "improve", "thread_check"])
async def test_new_features_share_safe_provider_failures(feature):
    args = (MESSAGES,) if feature == "thread_check" else ("Hello",)
    if feature == "improve":
        args += (tr.ReviewBatch(**review_data()),)
    with pytest.raises(tr.TranslationError) as error:
        await invoke(getattr(tr, feature), {}, *args, status=401)
    assert "test-key" not in str(error.value)


async def test_insufficient_evidence_cannot_support_candidate_disagreement():
    data = thread_data()
    data['interpretations'][0]['insufficient_evidence'] = True
    data['disagreements'] = [{"id": "c1", "topic": "Scope", "profile_ids": ["manager", "frontend"],
        "source_message_ids": ["m1", "m2"], "question": "Which screens?", "choices": ["All", "Payment"]}]
    with pytest.raises(tr.TranslationError, match="invalid response"):
        await invoke(tr.thread_check, data, MESSAGES)


@pytest.mark.parametrize("feature", ["review", "improve", "thread_check"])
@pytest.mark.parametrize("change", [{"status": "failed"}, {"status": "incomplete"},
                                    {"output": []}, {"output": [{"type": "message", "role": "assistant", "status": "completed", "content": [{"type": "refusal", "refusal": "No"}]}]}])
async def test_features_reject_incomplete_or_malformed_provider_output(feature, change):
    args = (MESSAGES,) if feature == 'thread_check' else ('Hello',)
    if feature == 'improve':
        args += (tr.ReviewBatch(**review_data()),)
    def handle(request):
        return httpx.Response(200, json={"status": "completed", "output": [{"type": "message", "role": "assistant", "status": "completed", "content": [{"type": "output_text", "text": "{}"}]}], **change})
    async with httpx.AsyncClient(transport=httpx.MockTransport(handle)) as client:
        with pytest.raises(tr.TranslationError, match="invalid response"):
            await getattr(tr, feature)(*args, api_key='test-key', client=client)


async def test_provider_schema_omits_unsupported_constraints_but_response_stays_validated():
    def inspect(payload):
        def check(node):
            if isinstance(node, dict):
                assert not {'minLength', 'maxLength', 'minItems', 'maxItems', 'pattern'}.intersection(node)
                for value in node.values():
                    check(value)
            elif isinstance(node, list):
                for value in node:
                    check(value)
        check(payload['text']['format']['schema'])
    data = {'revised_draft': 'x' * 6001, 'unresolved_information': []}
    with pytest.raises(tr.TranslationError, match='invalid response'):
        await invoke(tr.improve, data, 'Hello', tr.ReviewBatch(**review_data()), inspect=inspect)


@pytest.mark.parametrize('reserved', [
    'Unsure / need more context', '  uNsUrE /  need more context  ',
    'Unsure', 'Pending', '  pEnDiNg  ', 'Pending — no answer',
])
async def test_thread_rejects_reserved_unresolved_answer_choices(reserved):
    data = thread_data()
    data['disagreements'] = [{
        'id': 'c1', 'topic': 'Scope', 'profile_ids': ['manager', 'frontend'],
        'source_message_ids': ['m1', 'm2'], 'question': 'Which screens?',
        'choices': ['Payment only', reserved],
    }]
    with pytest.raises(tr.TranslationError, match='invalid response'):
        await invoke(tr.thread_check, data, MESSAGES)

