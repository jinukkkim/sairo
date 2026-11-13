import asyncio
import json
from pathlib import Path

import httpx
import pytest

from core.translation import PROFILES
from server.app import app


@pytest.fixture(autouse=True)
def no_external_http(monkeypatch):
    original = httpx.AsyncClient.send
    async def send(client, request, **kwargs):
        assert request.url.host == 'test', 'Demo must never contact an external provider'
        return await original(client, request, **kwargs)
    monkeypatch.setattr(httpx.AsyncClient, 'send', send)


@pytest.fixture
async def client():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url='http://test') as client:
        yield client


@pytest.fixture(autouse=True)
def delays(monkeypatch):
    calls = []
    async def sleep(seconds):
        calls.append(seconds)
    monkeypatch.setattr(asyncio, 'sleep', sleep)
    return calls


def fixtures():
    return json.loads((Path(__file__).parents[1] / 'server/demo-results.json').read_text())


def review_body():
    return {'reviews': [{'profile_id': p.id, 'likely_questions': [], 'missing_information': []} for p in PROFILES]}


async def test_lists_fixed_profiles(client):
    assert (await client.get('/api/profiles')).json() == [p.model_dump() for p in PROFILES]


@pytest.mark.parametrize('data', [{}, {'message': ''}, {'message': '  '},
    {'message': 'x' * 6001}, {'message': 42}, {'message': 'Hello', 'api_key': 'ignored'}])
async def test_rejects_invalid_requests(client, data):
    assert (await client.post('/api/translate', json=data)).status_code == 422


@pytest.mark.parametrize('configured', [False, True])
@pytest.mark.parametrize('endpoint,payload', [
    ('translate', {'message': 'A newly typed message'}),
    ('review', {'message': 'A newly typed message'}),
    ('improve', {'message': 'A newly typed message', 'review': review_body()}),
    ('thread-check', {'messages': [{'id': 'm1', 'profile_id': 'manager', 'text': 'One'},
                                  {'id': 'm2', 'profile_id': 'frontend', 'text': 'Two'}]}),
])
async def test_demo_routes_never_use_provider_or_require_credentials(client, monkeypatch, endpoint, payload, configured, delays):
    for name in ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY']:
        if configured:
            monkeypatch.setenv(name, 'unused-test-secret')
        else:
            monkeypatch.delenv(name, raising=False)
    monkeypatch.setenv('OPENAI_MODEL', 'unused-model')
    response = await client.post('/api/' + endpoint, json=payload)
    assert response.status_code == 200
    assert response.headers['cache-control'] == 'no-store'
    assert 'unused-test-secret' not in response.text
    assert any(0.5 <= delay <= 1.5 for delay in delays)


async def test_prepared_translation_keeps_recipient_language_bindings(client):
    source = next(iter(fixtures()['translations']))
    response = await client.post('/api/translate', json={'message': source,
        'target_languages': {'manager': 'en', 'frontend': 'ko', 'designer': 'zh'}})
    assert response.status_code == 200
    data = response.json()['translations']
    assert [(item['profile_id'], item['target_language']) for item in data] == [
        ('manager', 'en'), ('frontend', 'ko'), ('designer', 'zh')]
    assert all(item['message'].strip() and item['message'] != source for item in data)
    assert any('\uac00' <= c <= '\ud7a3' for c in data[1]['message'])
    assert any('\u4e00' <= c <= '\u9fff' for c in data[2]['message'])


async def test_unknown_text_gets_demo_notice_not_someone_elses_explanation(client):
    response = await client.post('/api/translate', json={'message': 'My unrelated new draft'})
    assert response.status_code == 200
    assert all('demo' in item['message'].lower() and 'not' in item['message'].lower()
               for item in response.json()['translations'])


async def test_draft_review_and_improvement_use_prepared_matching_sources(client):
    source, fixture = next(iter(fixtures()['drafts'].items()))
    response = await client.post('/api/review', json={'message': source})
    assert response.status_code == 200
    reviews = response.json()
    assert len(reviews['reviews']) == 3
    assert any(item['missing_information'] for item in reviews['reviews'])
    response = await client.post('/api/improve', json={'message': source, 'review': reviews})
    assert response.status_code == 200
    assert response.json()['revised_draft'] != source
    assert response.json()['unresolved_information']
    assert fixture['improvement']['revised_draft'] == response.json()['revised_draft']


async def test_unknown_draft_never_appears_reviewed_or_silently_improved(client):
    source = 'Unscripted release note'
    reviews = (await client.post('/api/review', json={'message': source})).json()['reviews']
    assert all(any('not reviewed' in question.lower() for question in item['likely_questions']) for item in reviews)
    response = await client.post('/api/improve', json={'message': source, 'review': {'reviews': reviews}})
    assert response.json()['revised_draft'] == source
    assert response.json()['unresolved_information']


async def test_prepared_thread_candidates_reference_actual_messages_and_aligned_stays_empty(client):
    for fixture in fixtures()['threads']:
        messages = fixture['messages']
        response = await client.post('/api/thread-check', json={'messages': messages})
        assert response.status_code == 200
        data = response.json()
        assert len(data['disagreements']) == len(fixture['result']['disagreements'])
        assert {item['profile_id'] for item in data['interpretations']} == {m['profile_id'] for m in messages}
        ids = {m['id'] for m in messages}
        for item in [*data['interpretations'], *data['disagreements']]:
            assert set(item['source_message_ids']) <= ids


async def test_edited_thread_discards_prepared_candidate_evidence(client):
    source = fixtures()['threads'][0]['messages']
    changed = [{**item, 'text': 'New text'} for item in source]
    response = await client.post('/api/thread-check', json={'messages': changed})
    data = response.json()
    assert not data['disagreements']
    assert all(item['insufficient_evidence'] and not item['source_message_ids'] for item in data['interpretations'])


@pytest.mark.parametrize('endpoint,payload', [
    ('translate', {'message': 'Hi', 'target_languages': {'manager': 'fr'}}),
    ('translate', {'message': 'Hi', 'target_languages': {'unknown': 'en'}}),
    ('review', {'message': 'x' * 6001}), ('review', {'message': 'Hi', 'api_key': 'ignored'}),
    ('improve', {'message': 'Hi', 'review': {'reviews': []}}),
    ('thread-check', {'messages': [{'id': 'm1', 'profile_id': 'manager', 'text': 'Hi'}]}),
    ('thread-check', {'messages': [{'id': 'm1', 'profile_id': 'manager', 'text': 'Hi'}] * 2}),
])
async def test_all_analysis_validation_errors_are_uncached(client, endpoint, payload):
    response = await client.post('/api/' + endpoint, json=payload)
    assert response.status_code == 422
    assert response.headers['cache-control'] == 'no-store'
