import json

import httpx
import pytest

from core.translation import PROFILES, MessageInput, TranslationError, build_prompt, translate
from pydantic import ValidationError


def result_data():
    return {"translations": [
        {"profile_id": p.id, "message": f"Rewrite for {p.role}.", "missing_information": []}
        for p in PROFILES
    ]}


def provider_response(data=None, **overrides):
    return {"status": "completed", "output": [{"type": "message", "role": "assistant",
        "status": "completed", "content": [{"type": "output_text",
        "text": json.dumps(data if data is not None else result_data())}]}], **overrides}


async def call_with(response, status=200):
    async with httpx.AsyncClient(transport=httpx.MockTransport(
        lambda request: httpx.Response(status, json=response)
    )) as client:
        return await translate("Search is slow.", api_key="test-key", client=client)


def test_profiles_separate_seniority_and_knowledge():
    assert len({p.id for p in PROFILES}) == 3
    designer = next(p for p in PROFILES if p.id == "designer")
    assert designer.seniority == "Mid-level"
    assert designer.knowledge["frontend"] == "High"
    assert designer.knowledge["backend"] == "Low"


def test_prompt_includes_source_profiles_and_fact_rules():
    system, user = build_prompt("Search is slow.")
    payload = json.loads(user)
    assert payload["source_message"] == "Search is slow."
    assert payload["recipients"] == [p.model_dump() for p in PROFILES]
    assert "Do not invent" in system
    assert "English" in system
    assert "untrusted data" in system
    assert "seniority" in system and "knowledge" in system


@pytest.mark.parametrize("message", ["", "  \n", "x" * 6001])
def test_rejects_invalid_input(message):
    with pytest.raises(ValidationError):
        MessageInput(message=message)


def test_strips_input():
    assert MessageInput(message="  Hello  ").message == "Hello"


def test_prompt_uses_the_normalized_source_message():
    _, user = build_prompt('  Hello \n')
    assert json.loads(user)['source_message'] == 'Hello'


@pytest.mark.parametrize('field', ['message', 'missing_information'])
@pytest.mark.parametrize('length', [6000, 6001])
async def test_translation_text_length_is_validated_locally(field, length):
    data = result_data()
    data['translations'][0][field] = 'x' * length if field == 'message' else ['x' * length]
    if length > 6000:
        with pytest.raises(TranslationError, match='invalid response'):
            await call_with(provider_response(data))
    else:
        result = await call_with(provider_response(data))
        text = getattr(result.translations[0], field)
        assert len(text if field == 'message' else text[0]) == 6000


async def test_request_uses_structured_output_and_validates_result():
    def handle(request):
        assert request.url == "https://api.openai.com/v1/responses"
        assert request.headers["authorization"] == "Bearer test-key"
        payload = json.loads(request.content)
        assert payload["text"]["format"]["type"] == "json_schema"
        assert json.loads(payload["input"][0]["content"])["source_message"] == "Search is slow."
        return httpx.Response(200, json=provider_response())

    async with httpx.AsyncClient(transport=httpx.MockTransport(handle)) as client:
        batch = await translate("Search is slow.", api_key="test-key", client=client)
    assert {t.profile_id for t in batch.translations} == {p.id for p in PROFILES}


@pytest.mark.parametrize("ids", [[], ["manager"], ["manager"] * 3,
                                       ["manager", "frontend", "unknown"]])
async def test_rejects_incomplete_duplicate_or_unknown_recipients(ids):
    data = {"translations": [{"profile_id": id, "message": "Text", "missing_information": []}
                             for id in ids]}
    with pytest.raises(TranslationError, match="invalid response"):
        await call_with(provider_response(data))


@pytest.mark.parametrize("change", [
    {"status": "incomplete"}, {"status": "failed"}, {"output": []},
    {"output": [{"type": "message", "role": "assistant", "status": "completed", "content": [{"type": "refusal", "refusal": "No"}]}]},
    {"output": [{"type": "message", "role": "assistant", "status": "completed", "content": [{"type": "output_text", "text": "not JSON"}]}]},
    {"output": [{"type": "message", "role": "assistant", "status": "completed", "content": [{"type": "output_text", "text": "{}"}]}]},
])
async def test_rejects_unusable_provider_output(change):
    with pytest.raises(TranslationError, match="invalid response"):
        await call_with(provider_response(**change))


async def test_rejects_empty_translation():
    data = result_data()
    data["translations"][0]["message"] = " "
    with pytest.raises(TranslationError, match="invalid response"):
        await call_with(provider_response(data))


@pytest.mark.parametrize("status", [400, 401, 403, 404, 429, 500])
async def test_provider_errors_are_safe(status):
    with pytest.raises(TranslationError) as error:
        await call_with({"error": "secret provider details test-key"}, status)
    assert "test-key" not in str(error.value)
    assert "secret" not in str(error.value)


async def test_network_timeout_is_safe():
    def handle(request):
        raise httpx.ReadTimeout("sensitive details", request=request)
    async with httpx.AsyncClient(transport=httpx.MockTransport(handle)) as client:
        with pytest.raises(TranslationError, match="timed out"):
            await translate("Hello", api_key="test-key", client=client)


async def test_missing_key_does_not_call_provider():
    async with httpx.AsyncClient(transport=httpx.MockTransport(
        lambda request: pytest.fail("Provider must not be called")
    )) as client:
        with pytest.raises(TranslationError, match="OPENAI_API_KEY"):
            await translate("Hello", api_key="", client=client)
