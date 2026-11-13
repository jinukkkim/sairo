import test from 'node:test';
import assert from 'node:assert/strict';
import {Workspace, confirmationStatus} from '../web/state.mjs';
import {conversations, sampleInbox} from '../web/demo.mjs';

const candidate = {profile_ids: ['manager', 'frontend'], choices: ['All screens', 'Payment only']};

test('only different explicit answers confirm the common question', () => {
  assert.equal(confirmationStatus(candidate, {}), 'pending');
  assert.equal(confirmationStatus(candidate, {manager: 0}), 'pending');
  assert.equal(confirmationStatus(candidate, {manager: 0, frontend: 'unsure'}), 'unresolved');
  assert.equal(confirmationStatus(candidate, {manager: 0, frontend: 1}), 'confirmed');
  assert.equal(confirmationStatus(candidate, {manager: 1, frontend: 1}), 'aligned');
  assert.equal(confirmationStatus(candidate, {manager: 0, frontend: 9}), 'unresolved');
});

test('edits, mode, conversation and viewer invalidate stale success and error callbacks', () => {
  const changes = [s => s.editDraft('Changed'), s => s.setMode('B'),
    s => s.selectConversation('design'), s => s.setViewer('frontend'),
    s => s.editThread([{id: 'm1', profile_id: 'manager', text: 'Changed'}])];
  for (const change of changes) {
    const s = new Workspace(conversations, sampleInbox);
    const token = s.begin('translate');
    s.setAnswer({...candidate, id: 'c1'}, 'manager', '0');
    s.setAnswer({...candidate, id: 'c1'}, 'frontend', '1');
    change(s);
    assert.equal(s.finish(token, {translations: []}), false);
    assert.equal(s.fail(token, 'Old error'), false);
    assert.equal(s.result, null);
    assert.equal(s.confirmations.size, 0);
    assert.equal(s.busy, false);
  }
});

test('improvement requires explicit apply and retains an independent original for restore', () => {
  const s = new Workspace(conversations, sampleInbox);
  s.setMode('A');
  s.editDraft('Original [facts].');
  s.finish(s.begin('review'), {reviews: []});
  const token = s.begin('improve');
  s.finish(token, {revised_draft: 'Proposed [deadline?]', unresolved_information: ['Deadline?']});
  assert.equal(s.draft, 'Original [facts].');
  assert.equal(s.proposal.revised_draft, 'Proposed [deadline?]');
  assert.deepEqual(s.inbox[0].snapshot.review, {reviews: []});
  s.applyProposal();
  assert.equal(s.draft, 'Proposed [deadline?]');
  s.restoreDraft();
  assert.equal(s.draft, 'Original [facts].');
  assert.equal(s.proposal, null);
});

test('demo inbox retains immutable source snapshot while seeded entries remain marked sample', () => {
  const s = new Workspace(conversations, sampleInbox);
  const original = s.draft;
  const token = s.begin('translate');
  s.finish(token, {translations: []});
  s.editDraft('Later text');
  const entry = s.inbox[0];
  assert.equal(entry.provenance, 'demo');
  assert.equal(entry.snapshot.message, original);
  assert.ok(s.inbox.some(item => item.provenance === 'sample'));
  s.loadInbox(entry);
  assert.equal(s.draft, original);
  assert.equal(s.result, null);
});

test('loading a draft analysis source preserves the shared chat and its later activity', () => {
  for (const kind of ['translate', 'review', 'improve']) {
    const s = new Workspace(conversations, sampleInbox);
    s.setMode('A');
    s.finish(s.begin(kind), {});
    const entry = s.inbox[0];
    s.replyLocal('m1', 'frontend', 'A later reply');
    s.toggleSaved('m1');
    s.toggleReaction('m1', '👍', 'frontend');
    s.sendLocal('frontend', 'A later message');
    const chat = structuredClone(s.thread);
    s.selectConversation('design');
    s.loadInbox(entry);
    assert.deepEqual(s.thread, chat, kind);
    assert.equal(s.draft, entry.snapshot.message);
    assert.equal(s.mode, 'A');
  }
});

test('loading a thread source restores its messages while retaining matching chat metadata', () => {
  const s = new Workspace(conversations, sampleInbox);
  s.setMode('B');
  s.thread[0].time = '2026-11-13T09:41:00+09:00';
  s.replyLocal('m1', 'frontend', 'Keep this reply');
  s.toggleSaved('m1');
  s.toggleReaction('m1', '👍', 'frontend');
  const original = structuredClone(s.thread);
  s.finish(s.begin('thread-check'), {});
  const entry = s.inbox[0];
  s.sendLocal('frontend', 'Outside the original source');
  s.loadInbox(entry);
  assert.deepEqual(s.thread, original);
  s.thread[0].text = 'A different message with the same ID';
  s.loadInbox(entry);
  assert.equal(s.thread[0].text, original[0].text);
  assert.equal(s.thread[0].replies, undefined);
  assert.equal(s.thread[0].saved, undefined);
});

test('reanalysis clears simulation answers and a newer request owns loading state', () => {
  const s = new Workspace(conversations, sampleInbox);
  s.setAnswer({...candidate, id: 'c1'}, 'manager', '0');
  const old = s.begin('thread-check');
  const current = s.begin('thread-check');
  assert.equal(s.confirmations.size, 0);
  assert.equal(s.finish(old, {}), false);
  assert.equal(s.busy, true);
  assert.equal(s.finish(current, {interpretations: [], disagreements: []}), true);
  assert.equal(s.busy, false);
});

test('local send appends only to selected in-memory conversation and clears analysis', () => {
  const s = new Workspace(conversations, sampleInbox);
  const before = s.thread.length;
  s.sendLocal('manager', 'A local message');
  assert.equal(s.thread.length, before + 1);
  assert.equal(s.thread.at(-1).text, 'A local message');
  s.selectConversation('design');
  assert.ok(!s.thread.some(m => m.text === 'A local message'));
  s.selectConversation('checkout');
  assert.equal(s.thread.at(-1).text, 'A local message');
  const fresh = new Workspace(conversations, sampleInbox);
  assert.equal(fresh.thread.length, before);
});

test('local send rejects unknown authors and thread limits without changing source', () => {
  const s = new Workspace(conversations, sampleInbox);
  const original = structuredClone(s.thread);
  assert.equal(s.sendLocal('', 'No known author'), false);
  assert.deepEqual(s.thread, original);
  s.editThread(Array.from({length: 20}, (_, index) => ({id: `x${index}`, profile_id: 'manager', text: 'Text'})));
  assert.equal(s.sendLocal('manager', 'Too many messages'), false);
  s.editThread([{id: 'm1', profile_id: 'manager', text: 'x'.repeat(6000)}, {id: 'm2', profile_id: 'frontend', text: 'x'.repeat(6000)}]);
  assert.equal(s.sendLocal('manager', 'Too many characters'), false);
});

test('confirmation ignores inherited participant properties', () => {
  const inherited = Object.create({manager: 0, frontend: 1});
  assert.equal(confirmationStatus(candidate, inherited), 'pending');
});

test('real answer updates isolate arbitrary candidate and participant keys across reanalysis', () => {
  const s = new Workspace(conversations, sampleInbox);
  const ordinaryPrototype = Object.getOwnPropertyDescriptors(Object.prototype);
  for (const id of ['__proto__', 'constructor', 'toString']) {
    const unusual = {...candidate, id, profile_ids: ['__proto__', 'constructor', 'toString']};
    s.setAnswer(unusual, '__proto__', '0');
    s.setAnswer(unusual, 'constructor', '1');
    s.setAnswer(unusual, 'toString', '0');
    assert.equal(confirmationStatus(unusual, s.confirmations.get(id)), 'confirmed');
    s.editDraft('Changed source');
    s.finish(s.begin('thread-check'), {interpretations: [], disagreements: [unusual]});
    assert.equal(confirmationStatus(unusual, s.confirmations.get(id)), 'pending');
    assert.equal(s.getAnswer(id, '__proto__'), undefined);
    assert.equal(confirmationStatus(candidate, s.confirmations.get('fresh')), 'pending');
  }
  assert.deepEqual(Object.getOwnPropertyDescriptors(Object.prototype), ordinaryPrototype);
  assert.equal(Object.hasOwn({}, 'manager'), false);
});

test('generated unresolved labels never count as explicit answers through real updates', async () => {
  const {answerOptions} = await import('../web/state.mjs');
  for (const label of ['Unsure / need more context', '  uNsUrE /  need more context  ', 'Unsure', 'Pending', ' pEnDiNg ', 'Pending — no answer']) {
    const generated = {...candidate, id: 'c1', choices: ['Payment only', label]};
    const s = new Workspace(conversations, sampleInbox);
    const displayed = answerOptions(generated.choices);
    const reservedOption = displayed.find(option => option.label === label);
    assert.ok(reservedOption.value === '' || reservedOption.value === 'unsure');
    s.setAnswer(generated, 'manager', '0');
    s.setAnswer(generated, 'frontend', reservedOption.value);
    assert.ok(['pending', 'unresolved'].includes(confirmationStatus(generated, s.confirmations.get('c1'))));
    // Defensive classification also covers a numeric value from an obsolete/malformed select.
    s.setAnswer(generated, 'frontend', '1');
    assert.ok(['pending', 'unresolved'].includes(confirmationStatus(generated, s.confirmations.get('c1'))));
    assert.ok(['pending', 'unresolved'].includes(confirmationStatus(generated, {manager: 0, frontend: 1})));
    s.setAnswer(generated, 'manager', '1');
    assert.ok(['pending', 'unresolved'].includes(confirmationStatus(generated, s.confirmations.get('c1'))));
  }
  const substantive = {...candidate, id: 'good'};
  const s = new Workspace(conversations, sampleInbox);
  s.setAnswer(substantive, 'manager', '0');
  s.setAnswer(substantive, 'frontend', '1');
  assert.equal(confirmationStatus(substantive, s.confirmations.get('good')), 'confirmed');
});

test('replies, reactions and saved messages stay with their conversation', () => {
  const s = new Workspace(conversations, sampleInbox);
  assert.equal(s.replyLocal('m1', 'frontend', 'Which release?'), true);
  assert.equal(s.thread[0].replies[0].text, 'Which release?');
  assert.equal(s.toggleReaction('m1', '👍', 'frontend'), true);
  assert.deepEqual(s.thread[0].reactions['👍'], ['frontend']);
  s.toggleReaction('m1', '👍', 'frontend');
  assert.deepEqual(s.thread[0].reactions['👍'], []);
  s.toggleSaved('m1');
  assert.equal(s.thread[0].saved, true);
  s.selectConversation('design');
  assert.ok(!s.thread.some(m => m.saved));
  s.selectConversation('checkout');
  assert.equal(s.thread[0].replies.length, 1);
  assert.equal(s.thread[0].saved, true);
});

test('invalid or oversized replies do not mutate the conversation', () => {
  const s = new Workspace(conversations, sampleInbox);
  const original = structuredClone(s.thread);
  for (const [id, author, text] of [['missing', 'manager', 'Hi'], ['m1', 'unknown', 'Hi'], ['m1', 'manager', '   '], ['m1', 'manager', 'x'.repeat(6001)]]) {
    assert.equal(s.replyLocal(id, author, text), false);
  }
  assert.equal(s.toggleReaction('missing', '👍', 'manager'), false);
  assert.equal(s.toggleReaction('m1', '__proto__', 'manager'), false);
  assert.equal(s.toggleReaction('m1', '👍', 'unknown'), false);
  assert.equal(s.toggleSaved('missing'), false);
  assert.deepEqual(s.thread, original);
});

test('message explanations bind source, viewer and language and reject obsolete responses', () => {
  const s = new Workspace(conversations, sampleInbox);
  const token = s.beginExplanation('m1', 'frontend', 'ko');
  assert.equal(s.finishExplanation(token, {message: 'Clear version'}), true);
  assert.equal(s.explanationFor('m1', 'frontend', 'ko').message, 'Clear version');
  assert.equal(s.explanationFor('m1', 'designer', 'ko'), undefined);
  assert.equal(s.explanationFor('m1', 'frontend', 'en'), undefined);
  const stale = s.beginExplanation('m1', 'frontend', 'en');
  s.editThread(s.thread.map(m => m.id === 'm1' ? {...m, text: 'Edited source'} : m));
  assert.equal(s.finishExplanation(stale, {message: 'Obsolete'}), false);
  assert.equal(s.explanationFor('m1', 'frontend', 'ko'), undefined);
  const another = s.beginExplanation('m1', 'frontend', 'en');
  s.selectConversation('design');
  assert.equal(s.finishExplanation(another, {message: 'Wrong room'}), false);
  assert.equal(s.beginExplanation('missing', 'frontend', 'en'), null);
});

test('local chat drafts and submitted text remain independent from AI tool drafts', () => {
  const s = new Workspace(conversations, sampleInbox);
  const aiDraft = s.draft;
  s.editChatDraft('Unsent message');
  s.selectConversation('design');
  assert.equal(s.chatDraft, '');
  s.selectConversation('checkout');
  assert.equal(s.chatDraft, 'Unsent message');
  assert.equal(s.draft, aiDraft);
  assert.equal(s.sendLocal('frontend', s.chatDraft), true);
  assert.equal(s.chatDraft, '');
});

test('AI thread snapshots exclude local chat presentation metadata', () => {
  const s = new Workspace(conversations, sampleInbox);
  s.sendLocal('frontend', 'Keep the values.');
  s.replyLocal('m1', 'designer', 'Agreed.');
  s.toggleReaction('m1', '👍', 'frontend');
  s.toggleSaved('m1');
  for (const message of s.snapshot().messages) {
    assert.deepEqual(Object.keys(message).sort(), ['id', 'profile_id', 'text']);
  }
  assert.equal(s.thread[0].saved, true);
  assert.equal(s.thread[0].replies.length, 1);
});

test('deleting and restoring a source never revives obsolete explanation requests or caches', () => {
  const s = new Workspace(conversations, sampleInbox);
  const old = s.beginExplanation('m1', 'frontend', 'en');
  const cached = s.beginExplanation('m3', 'frontend', 'en');
  s.finishExplanation(cached, {message: 'Previously cached'});
  s.editThread(s.thread.filter(m => m.id !== 'm1'));
  s.editThread(conversations.checkout.messages);
  assert.equal(s.finishExplanation(old, {message: 'Obsolete'}), false);
  assert.equal(s.explanationFor('m3', 'frontend', 'en'), undefined);
  const away = s.beginExplanation('m1', 'frontend', 'en');
  s.selectConversation('design'); s.selectConversation('checkout');
  assert.equal(s.finishExplanation(away, {message: 'Obsolete navigation'}), false);
});

test('thread replies support the same viewer-bound explanations as channel messages', () => {
  const s = new Workspace(conversations, sampleInbox);
  s.replyLocal('m1', 'frontend', 'Keep the API contract.');
  const reply = s.thread[0].replies[0];
  const token = s.beginExplanation(reply.id, 'designer', 'en');
  assert.ok(token);
  assert.equal(token.source, reply.text);
  assert.equal(s.finishExplanation(token, {message: 'Use the existing connection to the server.'}), true);
  assert.equal(s.explanationFor(reply.id, 'designer', 'en').message, 'Use the existing connection to the server.');
});

test('unknown message explanation lookup returns no result', () => {
  const s = new Workspace(conversations, sampleInbox);
  assert.equal(s.explanationFor('missing', 'frontend', 'en'), undefined);
});

test('three participants share one room with fixed English, Korean, English preferences', () => {
  const s = new Workspace(conversations, sampleInbox);
  const messages = structuredClone(s.thread);
  assert.equal(s.viewer, 'manager');
  assert.deepEqual(s.languages, {manager: 'en', frontend: 'ko', designer: 'en'});
  for (const [viewer, language] of [['frontend', 'ko'], ['designer', 'en'], ['manager', 'en']]) {
    assert.equal(s.setViewer(viewer), true);
    assert.equal(s.viewerLanguage, language);
    assert.equal(s.conversation, 'checkout');
    assert.deepEqual(s.thread, messages);
    const token = s.beginExplanation(viewer === 'manager' ? 'm2' : 'm1');
    assert.equal(token.profileId, viewer);
    assert.equal(token.language, language);
  }
  assert.equal(s.setViewer('unknown'), false);
  assert.equal(s.setViewer('__proto__'), false);
  assert.equal(s.viewer, 'manager');
});

test('participant switches isolate unsent drafts while sent messages remain shared', () => {
  const s = new Workspace(conversations, sampleInbox);
  s.editChatDraft('Alex draft');
  s.setViewer('frontend');
  assert.equal(s.chatDraft, '');
  s.editChatDraft('Jamie draft');
  s.setViewer('manager');
  assert.equal(s.chatDraft, 'Alex draft');
  s.setViewer('frontend');
  assert.equal(s.chatDraft, 'Jamie draft');
  s.sendLocal(s.viewer, s.chatDraft);
  assert.equal(s.chatDraft, '');
  s.setViewer('designer');
  assert.equal(s.thread.at(-1).profile_id, 'frontend');
  assert.equal(s.thread.at(-1).text, 'Jamie draft');
  s.setViewer('manager');
  assert.equal(s.chatDraft, 'Alex draft');
});

test('all tool snapshots keep fixed participant languages after loading an older inbox item', () => {
  const s = new Workspace(conversations, sampleInbox);
  const languages = {manager: 'en', frontend: 'ko', designer: 'en'};
  for (const mode of ['E', 'D']) {
    s.setMode(mode);
    assert.deepEqual(s.snapshot().target_languages, languages);
  }
  const entry = structuredClone(sampleInbox[0]);
  entry.snapshot.target_languages = {manager: 'zh', frontend: 'en', designer: 'ko'};
  s.loadInbox(entry);
  assert.deepEqual(s.languages, languages);
  assert.deepEqual(s.snapshot().target_languages, languages);
});

test('late explanations stay in their participant cache after a quick view switch', () => {
  const s = new Workspace(conversations, sampleInbox);
  const alex = s.beginExplanation('m3');
  s.setViewer('frontend');
  const jamie = s.beginExplanation('m3');
  s.finishExplanation(alex, {message: 'English for Alex'});
  assert.equal(s.explanationFor('m3'), undefined);
  s.finishExplanation(jamie, {message: 'Jamie의 한국어 설명'});
  assert.equal(s.explanationFor('m3').message, 'Jamie의 한국어 설명');
  s.setViewer('designer');
  assert.equal(s.explanationFor('m3'), undefined);
  s.setViewer('manager');
  assert.equal(s.explanationFor('m3').message, 'English for Alex');
});

test('only another participant’s messages and replies can be converted', () => {
  const s = new Workspace(conversations, sampleInbox);
  assert.equal(s.canExplain('m1'), false);
  assert.equal(s.canExplain('m2'), true);
  assert.equal(s.beginExplanation('m1'), null);
  s.replyLocal('m2', 'manager', 'My reply');
  const reply = s.thread.find(message => message.id === 'm2').replies[0];
  assert.equal(s.canExplain(reply.id), false);
  assert.equal(s.beginExplanation(reply.id), null);
  s.setViewer('frontend');
  assert.equal(s.canExplain('m2'), false);
  assert.equal(s.canExplain('m1'), true);
  assert.equal(s.canExplain(reply.id), true);
  assert.equal(s.canExplain('missing'), false);
  assert.equal(s.canExplain('m1', '__proto__'), false);
});
