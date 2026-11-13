import {participantLanguages} from './demo.mjs';

const copy = value => structuredClone(value);

function reservedChoice(label) {
  const match = /^(pending|unsure)\b/i.exec(label.trim());
  return match ? (match[1].toLowerCase() === 'pending' ? '' : 'unsure') : null;
}

function answerValue(choices, value) {
  if (value === undefined || value === '') return undefined;
  if (value === 'unsure') return 'unsure';
  const index = typeof value === 'number' ? value : /^\d+$/.test(value) ? Number(value) : NaN;
  if (!Number.isInteger(index) || index < 0 || index >= choices.length) return 'unsure';
  const reserved = reservedChoice(choices[index]);
  return reserved === null ? index : reserved === '' ? undefined : 'unsure';
}

export function answerOptions(choices) {
  return [
    {label: 'Pending — no answer', value: ''},
    ...choices.map((label, index) => ({label, value: reservedChoice(label) ?? String(index)})),
    {label: 'Unsure / need more context', value: 'unsure'},
  ];
}

export function confirmationStatus(candidate, answers = {}) {
  const values = candidate.profile_ids.map(id => answerValue(candidate.choices,
    answers instanceof Map ? answers.get(id) : Object.hasOwn(answers, id) ? answers[id] : undefined));
  if (values.some(value => value === undefined)) return 'pending';
  if (values.some(value => value === 'unsure')) return 'unresolved';
  return new Set(values).size > 1 ? 'confirmed' : 'aligned';
}

export class Workspace {
  constructor(conversations, inbox) {
    this.conversations = copy(conversations);
    this.inbox = copy(inbox);
    this.mode = 'E';
    this.viewer = 'manager';
    this.revision = 0;
    this.sequence = 0;
    this.chatDrafts = new Map();
    this.explanations = new Map();
    this.explanationRequests = new Map();
    this.selectConversation('checkout');
  }
  invalidate() {
    this.revision++;
    this.busy = false;
    this.result = null;
    this.proposal = null;
    this.confirmations = new Map();
    this.error = '';
  }
  saveConversation() {
    if (this.conversation) this.conversations[this.conversation] = {
      ...this.conversations[this.conversation], draft: this.draft, messages: copy(this.thread)};
  }
  selectConversation(id) {
    this.explanationRequests.clear();
    this.saveConversation();
    const conversation = this.conversations[id];
    this.conversation = id;
    this.draft = conversation.draft;
    this.thread = copy(conversation.messages);
    this.restoreOriginal = null;
    this.invalidate();
  }
  editDraft(value) { this.draft = value; this.invalidate(); }
  editThread(messages) {
    this.thread = copy(messages);
    this.explanations.clear();
    this.explanationRequests.clear();
    this.invalidate();
  }
  setMode(mode) { this.mode = mode; this.invalidate(); }
  get languages() { return participantLanguages; }
  get viewerLanguage() { return this.languages[this.viewer]; }
  setViewer(id) {
    if (!Object.hasOwn(this.languages, id) || id === this.viewer) return false;
    this.viewer = id;
    this.invalidate();
    return true;
  }
  snapshot() {
    return copy({mode: this.mode, conversation: this.conversation, message: this.draft.trim(),
      messages: this.thread.map(({id, profile_id, text}) => ({id, profile_id, text})),
      target_languages: this.languages});
  }
  begin(kind) {
    this.revision++;
    this.busy = true;
    if (kind !== 'improve') this.result = null;
    this.proposal = null;
    this.error = '';
    this.confirmations = new Map();
    const snapshot = this.snapshot();
    if (kind === 'improve') snapshot.review = copy(this.result);
    return {revision: this.revision, kind, snapshot};
  }
  getAnswer(candidateId, profileId) {
    return this.confirmations.get(candidateId)?.get(profileId);
  }
  setAnswer(candidate, profileId, value) {
    if (!this.confirmations.has(candidate.id)) this.confirmations.set(candidate.id, new Map());
    this.confirmations.get(candidate.id).set(profileId, answerValue(candidate.choices, value));
  }
  isCurrent(token) { return token.revision === this.revision; }
  finish(token, data) {
    if (!this.isCurrent(token)) return false;
    this.busy = false;
    if (token.kind === 'improve') this.proposal = copy(data);
    else this.result = copy(data);
    this.inbox.unshift({id: `demo-${++this.sequence}`, title: `${token.kind === 'thread-check' ? 'Thread check' : token.kind === 'translate' ? 'Tailored translation' : token.kind === 'review' ? 'Draft review' : 'Draft improvement'} in this session`,
      provenance: 'demo', kind: token.kind, snapshot: copy(token.snapshot), data: copy(data)});
    return true;
  }
  fail(token, message) {
    if (!this.isCurrent(token)) return false;
    this.busy = false;
    this.error = message;
    return true;
  }
  applyProposal() {
    if (!this.proposal || this.busy) return;
    this.restoreOriginal = this.draft;
    this.draft = this.proposal.revised_draft;
    this.invalidate();
  }
  restoreDraft() {
    if (this.restoreOriginal === null) return;
    this.draft = this.restoreOriginal;
    this.restoreOriginal = null;
    this.invalidate();
  }
  loadInbox(entry) {
    this.selectConversation(entry.snapshot.conversation);
    this.mode = entry.snapshot.mode;
    if (entry.snapshot.message !== undefined) this.draft = entry.snapshot.message;
    if (entry.kind === 'thread-check' && entry.snapshot.messages) {
      const current = new Map(this.thread.map(message => [message.id, message]));
      this.thread = entry.snapshot.messages.map(message => {
        const existing = current.get(message.id);
        return copy(existing?.profile_id === message.profile_id && existing.text === message.text ? existing : message);
      });
    }
    this.invalidate();
  }
  get chatDraft() { return this.chatDrafts.get(JSON.stringify([this.conversation, this.viewer])) || ''; }
  editChatDraft(text) { this.chatDrafts.set(JSON.stringify([this.conversation, this.viewer]), text); }
  replyLocal(messageId, profileId, text) {
    const message = this.thread.find(m => m.id === messageId);
    if (!message || !Object.hasOwn(this.languages, profileId) || !text.trim() || text.length > 6000) return false;
    if ((message.replies?.length || 0) >= 20) return false;
    message.replies ??= [];
    message.replies.push({id: `reply-${++this.sequence}`, profile_id: profileId, text: text.trim(), time: new Date().toISOString()});
    return true;
  }
  toggleReaction(messageId, emoji, profileId) {
    const message = this.thread.find(m => m.id === messageId);
    if (!message || !['👍', '👀', '✅', '💡'].includes(emoji) || !Object.hasOwn(this.languages, profileId)) return false;
    message.reactions ??= {};
    const authors = message.reactions[emoji] || [];
    message.reactions[emoji] = authors.includes(profileId) ? authors.filter(id => id !== profileId) : [...authors, profileId];
    return true;
  }
  toggleSaved(messageId) {
    const message = this.thread.find(m => m.id === messageId);
    if (!message) return false;
    message.saved = !message.saved;
    return true;
  }
  explanationKey(messageId, profileId, language) {
    return JSON.stringify([this.conversation, messageId, profileId, language]);
  }
  findMessage(messageId) {
    for (const message of this.thread) {
      if (message.id === messageId) return message;
      const reply = message.replies?.find(item => item.id === messageId);
      if (reply) return reply;
    }
  }
  canExplain(messageId, profileId = this.viewer) {
    const message = this.findMessage(messageId);
    return !!message && Object.hasOwn(this.languages, profileId) && message.profile_id !== profileId;
  }
  explanationFor(messageId, profileId = this.viewer, language = this.languages[profileId]) {
    if (!this.canExplain(messageId, profileId)) return undefined;
    const entry = this.explanations.get(this.explanationKey(messageId, profileId, language));
    return entry && entry.source === this.findMessage(messageId)?.text ? entry.data : undefined;
  }
  beginExplanation(messageId, profileId = this.viewer, language = this.languages[profileId]) {
    const message = this.findMessage(messageId);
    if (!this.canExplain(messageId, profileId) || !['en', 'ko', 'zh'].includes(language)) return null;
    const token = {key: this.explanationKey(messageId, profileId, language), conversation: this.conversation,
      id: messageId, source: message.text, profileId, language, sequence: ++this.sequence};
    this.explanationRequests.set(token.key, token.sequence);
    return token;
  }
  finishExplanation(token, data) {
    if (!token || this.explanationRequests.get(token.key) !== token.sequence || token.conversation !== this.conversation
      || this.findMessage(token.id)?.text !== token.source) return false;
    this.explanationRequests.delete(token.key);
    this.explanations.set(token.key, {source: token.source, data: copy(data)});
    return true;
  }
  sendLocal(profileId, text) {
    if (!Object.hasOwn(this.languages, profileId) || !text.trim() || text.length > 6000 || this.thread.length >= 20) return false;
    if (this.thread.reduce((total, message) => total + message.text.length, 0) + text.trim().length > 12000) return false;
    this.thread.push({id: `local-${++this.sequence}`, profile_id: profileId, text: text.trim(), time: new Date().toISOString()});
    this.editChatDraft('');
    this.invalidate();
    return true;
  }
}
