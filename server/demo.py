"""Prepared local demonstration results. No model, credentials or external I/O."""

import asyncio
import json
from copy import deepcopy
from pathlib import Path

from core.translation import PROFILES

FIXTURES = json.loads((Path(__file__).with_name('demo-results.json')).read_text())


async def demo_response(kind, body):
    await asyncio.sleep(0.7)
    if kind == 'translate':
        prepared = FIXTURES['translations'].get(body.message)
        return {'translations': [
            {'profile_id': profile.id, 'target_language': language,
             **(deepcopy(prepared[language][profile.id]) if prepared else
                {'message': FIXTURES['unknown_translation'][language], 'missing_information': []})}
            for profile in PROFILES for language in [body.target_languages[profile.id]]
        ]}
    if kind == 'review':
        prepared = FIXTURES['drafts'].get(body.message)
        if prepared:
            return deepcopy(prepared['review'])
        return {'reviews': [{'profile_id': p.id, 'likely_questions': [
            'Prepared demo only: this edited draft is not reviewed. Use the example draft to see the prepared review.'],
            'missing_information': []} for p in PROFILES]}
    if kind == 'improve':
        prepared = FIXTURES['drafts'].get(body.message)
        if prepared:
            return deepcopy(prepared['improvement'])
        return {'revised_draft': body.message, 'unresolved_information': [
            'No prepared improvement for this draft. Your text is unchanged; use the example draft to try the proposal.']}
    if kind == 'thread-check':
        messages = [message.model_dump() for message in body.messages]
        for prepared in FIXTURES['threads']:
            if messages == prepared['messages']:
                return deepcopy(prepared['result'])
        participants = dict.fromkeys(message['profile_id'] for message in messages)
        return {'interpretations': [{'profile_id': id,
            'understanding': 'Prepared demo only: this edited conversation has not been analyzed. Restore a sample to see its prepared result.',
            'insufficient_evidence': True, 'source_message_ids': []} for id in participants], 'disagreements': []}
    raise ValueError('Unknown demonstration feature')
