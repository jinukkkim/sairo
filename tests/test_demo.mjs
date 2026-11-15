import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {conversations, alignedThread, conflictingThread, fridayThread, exampleDraft, sampleInbox} from '../web/demo.mjs';

const fixtures = JSON.parse(await readFile(new URL('../server/demo-results.json', import.meta.url), 'utf8'));
const profiles = ['manager', 'frontend', 'designer'];

test('every seeded message and draft has prepared wording for all roles and languages', () => {
  const sources = [exampleDraft, ...alignedThread.map(m => m.text), ...conflictingThread.map(m => m.text), ...sampleInbox.filter(item => item.snapshot.message).map(item => item.snapshot.message)];
  for (const conversation of Object.values(conversations)) {
    sources.push(conversation.draft, ...conversation.messages.flatMap(m => [m.text, ...(m.replies || []).map(reply => reply.text)]));
  }
  for (const source of sources) {
    const prepared = fixtures.translations[source];
    assert.ok(prepared, `Missing prepared source: ${source}`);
    for (const language of ['en', 'ko', 'zh']) {
      assert.deepEqual(Object.keys(prepared[language]), profiles);
      for (const profile of profiles) {
        assert.ok(prepared[language][profile].message.trim());
        assert.ok(Array.isArray(prepared[language][profile].missing_information));
      }
    }
  }
});

test('every seeded thread has a matching prepared snapshot with grounded evidence', () => {
  const clean = messages => messages.map(({id, profile_id, text}) => ({id, profile_id, text}));
  for (const messages of [...Object.values(conversations).map(c => c.messages), alignedThread, conflictingThread]) {
    const fixture = fixtures.threads.find(item => JSON.stringify(item.messages) === JSON.stringify(clean(messages)));
    assert.ok(fixture, 'Missing prepared thread');
    const authors = new Map(messages.map(m => [m.id, m.profile_id]));
    for (const interpretation of fixture.result.interpretations) {
      for (const id of interpretation.source_message_ids) assert.equal(authors.get(id), interpretation.profile_id);
    }
    for (const candidate of fixture.result.disagreements) {
      const evidenceAuthors = candidate.source_message_ids.map(id => { assert.ok(authors.has(id)); return authors.get(id); });
      assert.ok(candidate.profile_ids.every(id => evidenceAuthors.includes(id)));
    }
  }
});

test('Friday payment scenario keeps the three meanings separate and evidence-linked', () => {
  const fixture = fixtures.threads.find(item => JSON.stringify(item.messages) === JSON.stringify(fridayThread));
  assert.ok(fixture);
  assert.match(conversations.friday.draft, /payment feature done by Friday/i);
  assert.deepEqual(fixture.result.disagreements[0].profile_ids, profiles);
  assert.deepEqual(fixture.result.disagreements[0].source_message_ids, ['f1', 'f2', 'f3']);
  assert.match(fixture.result.interpretations[0].understanding, /available to users/);
  assert.match(fixture.result.interpretations[1].understanding, /code work/);
  assert.match(fixture.result.interpretations[2].understanding, /screen design/);
  assert.ok(sampleInbox.some(item => item.id === 'sample-friday' && item.data.disagreements.length === 1));
});

test('prepared wording has no role-preface or third-person retelling', () => {
  const commentary = /For the product decision:|For implementation:|For the user experience:|관점에서는:|从产品决策的角度看：|从前端实现的角度看：|从用户体验与设计的角度看：|\b(?:Alex|Jamie|Sam) (?:is asking|plans|wants|suggests|agrees|confirms|has designs|has prepared|will start|intends)|(?:Alex|Jamie|Sam)[은는이가] /;
  for (const languages of Object.values(fixtures.translations)) {
    for (const recipients of Object.values(languages)) {
      for (const {message} of Object.values(recipients)) assert.doesNotMatch(message, commentary);
    }
  }
});

test('the payment question stays direct and implementation plan stays first-person', () => {
  const question = conversations.checkout.messages.find(m => m.id === 'm4').text;
  const korean = fixtures.translations[question].ko.frontend.message;
  assert.match(korean, /\?/);
  assert.doesNotMatch(korean, /(?:물어보고|묻고|요청했|뜻입니다|확인하세요)/);
  const plan = conversations.checkout.messages.find(m => m.id === 'm2').text;
  assert.match(fixtures.translations[plan].en.manager.message, /\bI(?:’|')(?:m|ll) /);
  assert.doesNotMatch(fixtures.translations[plan].ko.frontend.message, /확인하세요|Jamie/);
});

test('the active room, separate conflicting sample and Inbox use their own prepared findings', () => {
  assert.ok(Array.isArray(conflictingThread), 'Keep the scope-conflict demonstration separate from the active room');
  const clean = messages => messages.map(({id, profile_id, text}) => ({id, profile_id, text}));
  const preparedFor = messages => fixtures.threads.find(item => JSON.stringify(item.messages) === JSON.stringify(clean(messages)));
  assert.ok(preparedFor(conflictingThread)?.result.disagreements.length);
  assert.deepEqual(preparedFor(conversations.checkout.messages)?.result.disagreements, []);
  for (const entry of sampleInbox.filter(item => item.kind === 'thread-check')) {
    assert.deepEqual(entry.data, preparedFor(entry.snapshot.messages)?.result);
  }
});

