import json

import httpx
import pytest

from core import ai, translation as tr


DATA = {'revised_draft': 'Please confirm the release date.', 'unresolved_information': []}


def message(data=None, **changes):
    return {'type': 'message', 'role': 'assistant', 'status': 'completed',
            'content': [{'type': 'output_text', 'text': json.dumps(DATA if data is None else data)}], **changes}


async def generate(payload):
    async with httpx.AsyncClient(transport=httpx.MockTransport(
        lambda request: httpx.Response(200, json=payload)
    )) as client:
        return await ai.generate(tr.Improvement, 'System rules', 'Source',
                                 api_key='test-key', client=client, model='gpt-6-luna')


async def test_openai_request_uses_stateless_strict_responses_and_shared_default():
    def handle(request):
        assert request.url == 'https://api.openai.com/v1/responses'
        assert request.headers['authorization'] == 'Bearer test-key'
        assert 'x-api-key' not in request.headers
        body = json.loads(request.content)
        assert body['model'] == ai.DEFAULT_MODEL == 'gpt-6-luna'
        assert body['store'] is False
        assert body['reasoning'] == {'effort': 'low'}
        assert body['max_output_tokens'] == 6000
        assert 'temperature' not in body
        assert 'untrusted data' in body['instructions']
        assert json.loads(body['input'][0]['content'])['source_message'] == 'Hello'
        format = body['text']['format']
        assert format['type'] == 'json_schema'
        assert format['strict'] is True
        assert format['name'] == 'TranslationBatch'
        schema = format['schema']['$defs']['Translation']
        assert set(schema['required']) == set(schema['properties'])
        assert 'target_language' in schema['required']
        assert schema['additionalProperties'] is False
        assert 'default' not in schema['properties']['target_language']
        data = {'translations': [{'profile_id': p.id, 'target_language': 'en', 'message': 'Hello', 'missing_information': []} for p in tr.PROFILES]}
        return httpx.Response(200, json={'status': 'completed', 'output': [message(data)]})
    async with httpx.AsyncClient(transport=httpx.MockTransport(handle)) as client:
        result = await tr.translate('Hello', api_key='test-key', client=client)
    assert len(result.translations) == 3


@pytest.mark.parametrize('result_type', [tr.TranslationBatch, tr.ReviewBatch, tr.Improvement, tr.ThreadResult])
def test_every_result_schema_is_strict_without_changing_local_schema(result_type):
    original = result_type.model_json_schema()
    schema = ai.provider_schema(original)
    def check(node):
        if isinstance(node, dict):
            assert 'default' not in node
            if node.get('type') == 'object':
                assert node['additionalProperties'] is False
                assert set(node['required']) == set(node['properties'])
            for item in node.values():
                check(item)
        elif isinstance(node, list):
            for item in node:
                check(item)
    check(schema)
    assert result_type.model_json_schema() == original


async def test_reasoning_items_can_precede_the_completed_structured_message():
    result = await generate({'status': 'completed', 'output': [
        {'type': 'reasoning', 'summary': []}, message()]})
    assert result.model_dump() == DATA


@pytest.mark.parametrize('payload', [
    None, [], {}, {'status': 'completed', 'output': None},
    {'status': 'completed', 'output': [None]},
    {'status': 'completed', 'output': [{'type': 'reasoning'}]},
    {'status': 'completed', 'output': [message(), message()]},
    {'status': 'completed', 'output': [message(status='incomplete')]},
    {'status': 'completed', 'output': [message(role='user')]},
    {'status': 'completed', 'output': [message(content=[])]},
    {'status': 'completed', 'output': [message(content=[{'type': 'refusal', 'refusal': 'No'}])]},
    {'status': 'completed', 'output': [message(content=[{'type': 'output_text', 'text': json.dumps(DATA)}, {'type': 'refusal', 'refusal': 'No'}])]},
    {'status': 'completed', 'output': [message(), {'type': 'function_call', 'name': 'unexpected'}]},
    {'status': 'incomplete', 'output': [message()]},
    {'status': 'failed', 'output': [message()]},
])
async def test_malformed_refused_partial_or_ambiguous_output_is_rejected(payload):
    with pytest.raises(ai.TranslationError, match='invalid response'):
        await generate(payload)


async def test_custom_model_reaches_the_provider():
    def handle(request):
        assert json.loads(request.content)['model'] == 'gpt-6.1-sol'
        return httpx.Response(200, json={'status': 'completed', 'output': [message()]})
    async with httpx.AsyncClient(transport=httpx.MockTransport(handle)) as client:
        await tr.improve('Hello', tr.ReviewBatch(reviews=[{'profile_id': p.id,
            'likely_questions': [], 'missing_information': []} for p in tr.PROFILES]),
            api_key='test-key', client=client, model='gpt-6.1-sol')


async def test_unavailable_model_has_actionable_safe_error():
    async with httpx.AsyncClient(transport=httpx.MockTransport(
        lambda request: httpx.Response(404, json={'error': 'secret test-key'})
    )) as client:
        with pytest.raises(ai.TranslationError, match='OPENAI_MODEL') as error:
            await tr.translate('Hello', api_key='test-key', client=client)
    assert 'secret' not in str(error.value)
    assert 'test-key' not in str(error.value)
