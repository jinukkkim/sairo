import {Workspace, answerOptions, confirmationStatus} from './state.mjs';
import {createChat} from './chat.mjs';
import {conversations, sampleInbox, exampleDraft, alignedThread} from './demo.mjs';

const $ = selector => document.querySelector(selector);
const state = new Workspace(conversations, sampleInbox);
const modes = {
  E: {title: 'Through their lens', action: 'Translate for the team', description: 'Adapt the same facts for each role, seniority and knowledge profile. Alex and Sam receive simplified English; Jamie also receives a Korean translation.', endpoint: 'translate'},
  A: {title: 'Before you send', action: 'Review draft', description: 'Find recipient-specific questions and relevant gaps in scope, conditions, deadline or priority. An empty finding is valid.', endpoint: 'review'},
  B: {title: 'Possible understanding', action: 'Check thread', description: 'Compare statements, inspect the evidence, then test a common question with a clearly labeled local answer simulation.', endpoint: 'thread-check'},
  D: {title: 'Role and language together', action: 'Translate role + language', description: 'Adapt perspective and language in one generation. Alex and Sam use English; Jamie uses Korean.', endpoint: 'translate'},
};
const languageNames = {en: 'English', ko: 'Korean', zh: 'Chinese'};
let profiles = [];
let controller;
let selectedInbox;

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function name(id) { return profiles.find(p => p.id === id)?.name || id; }
function list(items) {
  const node = element('ul');
  items.forEach(text => node.append(element('li', text)));
  return node;
}
function status(text, error = false) {
  $('#status').textContent = text;
  $('#status').classList.toggle('error', error);
}
function invalidate(action, text = 'Source changed. Preview the prepared result again.') {
  controller?.abort();
  action();
  renderOutputs();
  syncControls();
  status(text);
}
function validInput() {
  if (state.mode !== 'B') return state.draft.trim().length > 0 && state.draft.trim().length <= 6000;
  return state.thread.length >= 2 && state.thread.length <= 20 && state.thread.every(m => m.text.trim().length && m.text.length <= 6000)
    && state.thread.reduce((sum, m) => sum + m.text.trim().length, 0) <= 12000;
}
function syncControls() {
  $('#chat-send').disabled = profiles.length !== 3 || !$('#chat-message').value.trim();
  $('#translate').disabled = state.busy || profiles.length !== 3 || !validInput();
  $('#translate').textContent = state.busy ? 'Preparing…' : modes[state.mode].action;
  $('#improve').disabled = state.busy || !state.result?.reviews;
  $('#apply').disabled = state.busy;
  $('#restore').disabled = state.busy;
  $('#results-section').setAttribute('aria-busy', String(state.busy));
  $('#message-hint').textContent = state.mode === 'B'
    ? `${state.thread.length}/20 messages · ${state.thread.reduce((sum, m) => sum + m.text.trim().length, 0).toLocaleString()}/12,000 characters · 2 messages minimum`
    : `${state.draft.length.toLocaleString()}/6,000 characters · Nothing is sent automatically`;
}
function renderProfiles() {
  $('#profiles').replaceChildren();
  $('#chat-author').replaceChildren();
  $('#language-controls').replaceChildren();
  for (const profile of profiles) {
    const details = element('details', undefined, 'profile');
    details.append(element('summary', `${profile.name} · ${profile.role}`), element('p', `${profile.seniority} · ${profile.team} team`));
    const knowledge = element('dl');
    for (const [discipline, level] of Object.entries(profile.knowledge)) {
      const row = element('div'); row.append(element('dt', `${discipline} knowledge`), element('dd', level)); knowledge.append(row);
    }
    details.append(knowledge, element('p', profile.focus));
    $('#profiles').append(details);
    const author = element('option', profile.name); author.value = profile.id; $('#chat-author').append(author);
    const row = element('div', undefined, 'fixed-language');
    row.append(element('span', profile.name), element('span', languageNames[state.languages[profile.id]], 'badge live'));
    $('#language-controls').append(row);
  }
}
function renderChat() { chat.render(); }
function renderThreadEditor() {
  $('#thread-editor').replaceChildren();
  state.thread.forEach((message, index) => {
    const row = element('div', undefined, 'thread-row'); row.id = `source-${message.id}`;
    const label = element('label', `Message ${message.id}`);
    const author = element('select'); author.setAttribute('aria-label', `Author of ${message.id}`);
    profiles.forEach(profile => { const option = element('option', profile.name); option.value = profile.id; author.append(option); });
    author.value = message.profile_id;
    const text = element('textarea'); text.value = message.text; text.maxLength = 6000; text.rows = 2;
    text.setAttribute('aria-label', `Text of ${message.id}`);
    const update = () => {
      const next = structuredClone(state.thread); next[index] = {...next[index], profile_id: author.value, text: text.value};
      invalidate(() => state.editThread(next)); renderChat();
    };
    author.addEventListener('change', update); text.addEventListener('input', update);
    const remove = element('button', 'Remove', 'text-button'); remove.type = 'button'; remove.setAttribute('aria-label', `Remove message ${message.id}`);
    remove.addEventListener('click', () => { invalidate(() => state.editThread(state.thread.filter((_, i) => i !== index))); renderThreadEditor(); renderChat(); });
    label.append(author); row.append(label, text, remove); $('#thread-editor').append(row);
  });
}
function evidence(ids, prefix) {
  const row = element('p', 'Evidence: ', 'evidence');
  for (const id of ids) { const link = element('a', id); link.href = `#${prefix}${id}`; row.append(link, document.createTextNode(' ')); }
  if (!ids.length) row.append(document.createTextNode('Insufficient statements'));
  return row;
}
function resultCard(id) {
  const card = element('article', undefined, 'recipient');
  card.append(element('h3', name(id)), element('p', profiles.find(p => p.id === id)?.role || '', 'small'));
  return card;
}
function renderAnalysis(data, kind, container, {simulation = false, prefix = 'source-'} = {}) {
  container.replaceChildren();
  if (kind === 'translate') {
    container.className = 'recipients';
    for (const result of data.translations) {
      const card = resultCard(result.profile_id);
      card.append(element('span', languageNames[result.target_language || 'en'], 'badge live'));
      const message = element('p', result.message, 'generated-text'); message.lang = result.target_language || 'en'; card.append(message);
      if (result.missing_information.length) { card.append(element('h4', 'Not specified in the original')); const questions = list(result.missing_information); questions.lang = result.target_language || 'en'; card.append(questions); }
      container.append(card);
    }
  } else if (kind === 'review') {
    container.className = 'recipients';
    for (const review of data.reviews) {
      const card = resultCard(review.profile_id);
      if (review.likely_questions.length) card.append(element('h4', 'Likely questions'), list(review.likely_questions));
      if (!review.likely_questions.length && !review.missing_information.length) card.append(element('p', 'No relevant gaps found. Compare with the original.', 'small'));
      for (const category of ['scope', 'conditions', 'deadline', 'priority']) {
        const items = review.missing_information.filter(item => item.category === category);
        if (items.length) card.append(element('h4', category === 'scope' ? 'Screen / scope' : category[0].toUpperCase() + category.slice(1)), list(items.map(item => item.question)));
      }
      container.append(card);
    }
  } else if (kind === 'thread-check') {
    container.className = 'thread-results';
    const grid = element('div', undefined, 'recipients');
    for (const interpretation of data.interpretations) {
      const card = resultCard(interpretation.profile_id);
      card.append(element('span', interpretation.insufficient_evidence ? 'Insufficient evidence' : 'Possible interpretation', 'badge sample'), element('p', interpretation.understanding, 'generated-text'), evidence(interpretation.source_message_ids, prefix)); grid.append(card);
    }
    container.append(grid);
    if (!data.disagreements.length) container.append(element('p', 'No prepared candidate disagreements for this conversation.', 'notice'));
    for (const candidate of data.disagreements) {
      const card = element('article', undefined, 'candidate');
      card.append(element('h3', `Candidate: ${candidate.topic}`), element('p', 'Prepared candidate, pending confirmation in the local simulation.', 'small'), evidence(candidate.source_message_ids, prefix), element('h4', candidate.question));
      if (simulation) {
        card.append(element('p', 'Local participant-response simulation — presenter inputs, not real teammate replies.', 'simulation-label'));
        const answerState = element('p', undefined, 'confirmation-status'); answerState.setAttribute('role', 'status');
        const update = () => {
          const outcome = confirmationStatus(candidate, state.confirmations.get(candidate.id));
          const messages = {pending: 'Pending: explicit answers from every concerned participant are required.', unresolved: 'Unresolved: an unsure or invalid answer cannot confirm disagreement.', confirmed: 'Confirmed discrepancy in local simulation: explicit answers differ on this question.', aligned: 'Aligned on this question in local simulation: explicit answers match.'};
          answerState.textContent = messages[outcome]; answerState.dataset.outcome = outcome;
        };
        for (const id of candidate.profile_ids) {
          const label = element('label', name(id)); const select = element('select'); select.setAttribute('aria-label', `Simulated answer by ${name(id)}: ${candidate.question}`);
          for (const {label: text, value} of answerOptions(candidate.choices)) {
            const option = element('option', text); option.value = value; select.append(option);
          }
          const previous = state.getAnswer(candidate.id, id); select.value = previous === undefined ? '' : String(previous);
          select.addEventListener('change', () => { state.setAnswer(candidate, id, select.value); update(); });
          label.append(select); card.append(label);
        }
        update(); card.append(answerState);
      } else card.append(list(candidate.choices), element('p', 'Prepared candidate. Load its source and preview the result to try the local answer simulation.', 'small'));
      container.append(card);
    }
  } else if (kind === 'improve') {
    container.className = '';
    container.append(element('h3', 'Proposed draft'), element('p', data.revised_draft, 'generated-text'), element('h4', 'Unresolved information'));
    container.append(data.unresolved_information.length ? list(data.unresolved_information) : element('p', 'No unresolved information listed. Check against the original.', 'small'));
  }
}
function renderOutputs() {
  $('#results-heading').textContent = modes[state.mode].title;
  $('#result-origin').textContent = state.result ? 'Prepared demo result · this session' : 'Choose a feature to preview';
  const output = $('#results');
  if (state.result) renderAnalysis(state.result, modes[state.mode].endpoint, output, {simulation: state.mode === 'B'});
  else { output.className = ''; output.replaceChildren(element('p', 'Choose a feature and run it with your current draft or thread.', 'empty-state')); }
  $('#improvement-section').hidden = state.mode !== 'A' || (!state.result?.reviews && state.restoreOriginal === null);
  $('#improve').hidden = !state.result?.reviews;
  $('#apply').hidden = !state.proposal;
  $('#restore').hidden = state.restoreOriginal === null;
  const proposal = $('#proposal'); proposal.replaceChildren();
  if (state.proposal) {
    const comparison = element('div', undefined, 'draft-comparison');
    const original = element('section'); original.append(element('h3', 'Original draft'), element('p', state.draft, 'generated-text'));
    const revised = element('section'); renderAnalysis(state.proposal, 'improve', revised);
    comparison.append(original, revised); proposal.append(comparison);
  }
}
function renderInbox() {
  $('#inbox-list').replaceChildren();
  for (const item of state.inbox) {
    const button = element('button', undefined, 'inbox-item'); button.type = 'button';
    button.append(element('span', item.provenance === 'sample' ? 'Prepared sample' : 'Demo result · this session', `badge ${item.provenance === 'sample' ? 'sample' : 'live'}`), element('span', item.title));
    button.addEventListener('click', () => openInbox(item)); $('#inbox-list').append(button);
  }
}
function openInbox(item) {
  selectedInbox = item;
  $('#inbox-item-title').textContent = item.title;
  $('#inbox-provenance').textContent = item.provenance === 'sample' ? 'Prepared sample scenario. Findings and participant responses are illustrative.' : 'Prepared demo result shown in this browser session. Original input snapshot below; no AI service was contacted.';
  $('#inbox-provenance').className = `notice ${item.provenance === 'sample' ? 'sample' : 'live'}`;
  const source = $('#inbox-source'); source.replaceChildren(element('h3', 'Original input snapshot'));
  if (item.kind === 'thread-check') {
    for (const message of item.snapshot.messages) { const row = element('article', undefined, 'snapshot-message'); row.id = `inbox-${message.id}`; row.append(element('strong', `${name(message.profile_id)} · ${message.id}`), element('p', message.text, 'generated-text')); source.append(row); }
  } else {
    source.append(element('p', item.snapshot.message, 'generated-text'));
    if (item.snapshot.review) {
      const details = element('details'); details.append(element('summary', 'Review supplied to draft improvement'));
      const review = element('div'); renderAnalysis(item.snapshot.review, 'review', review); details.append(review); source.append(details);
    }
  }
  renderAnalysis(item.data, item.kind, $('#inbox-analysis'), {prefix: 'inbox-'});
  $('#workspace-dialog').close();
  $('#inbox-detail').showModal();
}
function renderWorkspace() {
  $('#conversation').value = state.conversation;
  $('#message').value = state.draft;
  $('#message').required = state.mode !== 'B';
  $('#draft-input').hidden = state.mode === 'B'; $('#thread-input').hidden = state.mode !== 'B';
  $('#source-label').textContent = state.mode === 'B' ? 'Original attributed thread' : 'Your original draft';
  $('#source-label').htmlFor = state.mode === 'B' ? '' : 'message';
  $('#example').hidden = state.mode === 'B'; $('#languages').hidden = state.mode !== 'D';
  $('#mode-description').textContent = modes[state.mode].description;
  document.querySelectorAll('[data-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === state.mode)));
  renderChat(); renderThreadEditor(); renderOutputs(); syncControls();
}
async function run(kind) {
  if (state.busy || profiles.length !== 3 || !validInput()) return;
  const reviewed = state.result;
  if (kind === 'improve' && !reviewed?.reviews) return;
  controller?.abort(); controller = new AbortController();
  const token = state.begin(kind);
  const snapshot = token.snapshot;
  const body = kind === 'thread-check' ? {messages: snapshot.messages}
    : kind === 'improve' ? {message: snapshot.message, review: reviewed}
    : kind === 'translate' ? {message: snapshot.message, target_languages: snapshot.target_languages} : {message: snapshot.message};
  renderOutputs(); syncControls(); status('Preparing result… You can edit or switch modes to cancel.');
  try {
    const response = await fetch(`/api/${kind}`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body), signal: AbortSignal.any([controller.signal, AbortSignal.timeout(70000)])});
    const data = await response.json();
    if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'Check the draft or thread limits and try again.');
    if (state.finish(token, data)) { renderOutputs(); renderInbox(); status(kind === 'improve' ? 'Proposal ready. Review it, then choose Apply draft if you want to use it.' : 'Prepared demo result ready. Compare it with the original source.'); }
  } catch (error) {
    const message = error.name === 'TimeoutError' ? 'The demo request timed out. Please try again.' : error instanceof TypeError ? 'Cannot reach the server. Check that it is running and try again.' : error.name === 'AbortError' ? 'Request canceled.' : error.message;
    if (state.fail(token, message)) { renderOutputs(); status(message, true); }
  } finally { if (state.isCurrent(token)) syncControls(); }
}
$('#message').addEventListener('input', event => invalidate(() => state.editDraft(event.target.value)));
$('#example').addEventListener('click', () => { invalidate(() => state.editDraft(exampleDraft)); renderWorkspace(); $('#message').focus(); });
$('#conversation').addEventListener('change', event => { invalidate(() => state.selectConversation(event.target.value), 'Conversation selected. Preview its prepared results.'); renderWorkspace(); });
for (const button of document.querySelectorAll('[data-mode]')) button.addEventListener('click', () => { invalidate(() => state.setMode(button.dataset.mode), 'Feature selected. Preview the prepared result.'); renderWorkspace(); });
$('#translate-form').addEventListener('submit', event => { event.preventDefault(); run(modes[state.mode].endpoint); });
$('#improve').addEventListener('click', () => run('improve'));
$('#apply').addEventListener('click', () => { invalidate(() => state.applyProposal(), 'Proposed draft applied locally. Restore original draft is available.'); renderWorkspace(); });
$('#restore').addEventListener('click', () => { invalidate(() => state.restoreDraft(), 'Original draft restored.'); renderWorkspace(); });
$('#conflicting').addEventListener('click', () => { invalidate(() => state.editThread(conversations.checkout.messages), 'Conflicting sample restored. Preview its prepared thread check.'); renderWorkspace(); });
$('#aligned').addEventListener('click', () => { invalidate(() => state.editThread(alignedThread), 'Aligned sample loaded. Its prepared result has no candidate disagreements.'); renderWorkspace(); });
$('#close-inbox').addEventListener('click', () => $('#inbox-detail').close());
$('#load-inbox').addEventListener('click', () => { invalidate(() => state.loadInbox(selectedInbox), 'Original snapshot loaded. Preview its prepared result.'); renderWorkspace(); $('#inbox-detail').close(); chat.openTools(); $('#translate').focus(); });

async function initialize() {
  renderInbox(); renderWorkspace(); status('Loading the fixed team profiles…');
  try {
    const response = await fetch('/api/profiles'); if (!response.ok) throw new Error();
    profiles = await response.json();
    renderProfiles(); chat.populateProfiles(); renderWorkspace(); status('Demo mode: choose a feature to preview prepared results. No API key or external AI calls.');
  } catch { status('Profiles could not load. Refresh the page to try again.', true); $('#chat-status').textContent = 'Team profiles could not load. Refresh the page to try again.'; }
}
const chat = createChat({
  state, getProfiles: () => profiles,
  onConversationChange: id => { invalidate(() => state.selectConversation(id)); renderWorkspace(); },
  onSourceChange: () => { controller?.abort(); renderWorkspace(); },
  onReviewDraft: text => { invalidate(() => { state.setMode('A'); state.editDraft(text); }); renderWorkspace(); },
  onExplanationSaved: entry => { state.inbox.unshift(entry); renderInbox(); },
});
initialize();
