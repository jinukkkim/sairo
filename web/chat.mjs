const $ = selector => document.querySelector(selector);
const initials = {manager: 'AM', frontend: 'JC', designer: 'SR'};
const shortRoles = {manager: 'Product manager', frontend: 'Frontend developer', designer: 'Designer'};
function el(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function icon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('icon'); svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `#i-${name}`); svg.append(use); return svg;
}
function button(label, className, action, iconName) {
  const node = el('button', undefined, className); node.type = 'button';
  if (iconName) node.append(icon(iconName));
  node.dataset.focusKey = label;
  node.append(document.createTextNode(label)); node.addEventListener('click', action); return node;
}

export function formatMessageTime(message, index) {
  const date = message.time ? new Date(message.time) : new Date(2000, 0, 1, 9, 41 + index * 2);
  return new Intl.DateTimeFormat('en', {hour: 'numeric', minute: '2-digit'}).format(date);
}

export function createChat({state, getProfiles, onConversationChange, onSourceChange, onReviewDraft, onExplanationSaved}) {
  let viewer = state.viewer;
  let language = state.viewerLanguage;
  let savedOnly = false;
  let selectedThread = null;
  const expanded = new Set();
  const requests = new Map();
  const errors = new Map();
  const replyDrafts = new Map();
  const replyKey = () => JSON.stringify([state.conversation, selectedThread, viewer]);
  const name = id => getProfiles().find(p => p.id === id)?.name || {manager: 'Alex', frontend: 'Jamie', designer: 'Sam'}[id] || id;
  const avatar = id => el('span', initials[id] || '?', `avatar ${id}`);
  const keyFor = message => state.explanationKey(message.id, viewer, language);
  const expansionKey = message => JSON.stringify([state.conversation, message.id]);
  const currentConversation = () => state.conversations[state.conversation];
  const channelName = () => currentConversation().channel || currentConversation().title;

  function switchViewer(id) {
    if (id === viewer) return;
    const openMessages = state.thread.flatMap(message => [message, ...(message.replies || [])])
      .filter(message => expanded.has(expansionKey(message)));
    if (selectedThread) replyDrafts.set(replyKey(), $('#reply-message').value);
    if (!state.setViewer(id)) return;
    viewer = state.viewer; language = state.viewerLanguage;
    onSourceChange();
    if (selectedThread) $('#reply-message').value = replyDrafts.get(replyKey()) || '';
    $('#reply-status').textContent = '';
    for (const message of openMessages) {
      if (state.canExplain(message.id)) explain(message, {open: true});
    }
    announce();
  }
  function syncViewerControls() {
    $('#viewer').value = viewer; $('#chat-author').value = viewer;
    $('#viewer-avatar').textContent = initials[viewer]; $('#viewer-avatar').className = `avatar ${viewer}`;
    const description = language === 'ko' ? '쉬운 한국어 · 번역 포함' : 'Simplified English';
    if ($('#viewer-language').textContent !== description) $('#viewer-language').textContent = description;
  }
  function announce(text = '') { $('#chat-status').textContent = text; }
  function openTools() {
    $('#thread-panel').hidden = true; $('#tools-panel').hidden = false;
    $('#open-tools').setAttribute('aria-expanded', 'true');
    $('#sidebar').classList.remove('open'); $('#mobile-nav').setAttribute('aria-expanded', 'false');
  }
  function closePanels() {
    $('#thread-panel').hidden = true; $('#tools-panel').hidden = true;
    $('#open-tools').setAttribute('aria-expanded', 'false'); selectedThread = null;
  }
  function showDialog(section, title) {
    $('#workspace-dialog-title').textContent = title;
    for (const id of ['inbox', 'profiles', 'help']) $(`#${id}-section`).hidden = id !== section;
    $('#workspace-dialog').showModal();
  }
  function selectConversation(id) {
    for (const entry of requests.values()) entry.controller.abort();
    requests.clear(); errors.clear();
    selectedThread = null; savedOnly = false; $('#chat-search').value = '';
    $('#sidebar').classList.remove('open'); $('#mobile-nav').setAttribute('aria-expanded', 'false');
    closePanels(); announce(); onConversationChange(id); scrollToEnd();
  }
  function renderNavigation() {
    $('#channel-list').replaceChildren(); $('#direct-list').replaceChildren(); $('#conversation').replaceChildren();
    for (const [id, conversation] of Object.entries(state.conversations)) {
      const dm = conversation.kind === '1:1 demo';
      const node = button('', `conversation-link${id === state.conversation ? ' selected' : ''}`, () => selectConversation(id));
      node.setAttribute('aria-current', id === state.conversation ? 'page' : 'false');
      if (dm) { const a = avatar('designer'); a.classList.add('small-avatar'); node.append(a); }
      else node.append(el('span', '#', 'hash'));
      node.append(el('span', conversation.channel || conversation.title));
      if (id === state.conversation && !dm) node.append(el('span', String(state.thread.length), 'unread-count'));
      $(dm ? '#direct-list' : '#channel-list').append(node);
      const option = el('option', conversation.title); option.value = id; $('#conversation').append(option);
    }
    $('#conversation').value = state.conversation;
  }
  function messageContent(message, index) {
    const row = el('article', undefined, 'chat-message'); row.dataset.messageId = message.id;
    row.append(avatar(message.profile_id));
    const body = el('div', undefined, 'message-body');
    const meta = el('div', undefined, 'message-meta');
    meta.append(el('strong', name(message.profile_id), 'message-author'), el('span', shortRoles[message.profile_id], 'message-role'), el('time', formatMessageTime(message, index), 'message-time'));
    if (message.profile_id === viewer) meta.append(el('span', 'you', 'message-time'));
    body.append(meta, el('p', message.text, 'message-text')); row.append(body);
    return {row, body};
  }
  function renderExplanation(message, body) {
    if (!state.canExplain(message.id)) return;
    const key = keyFor(message);
    const context = expansionKey(message);
    if (!expanded.has(context)) return;
    const result = state.explanationFor(message.id, viewer, language);
    const storedError = errors.get(key);
    const error = storedError?.sequence === state.explanationRequests.get(key) ? storedError : undefined;
    const box = el('section', undefined, `inline-explanation${error ? ' error' : ''}`);
    box.setAttribute('aria-label', 'Role-adapted explanation'); box.setAttribute('aria-live', 'polite');
    if (requests.has(key)) box.append(el('p', language === 'ko' ? 'Simplifying and translating to Korean…' : 'Finding a clearer way to put it…', 'generated-text'));
    else if (error?.source === message.text) {
      box.append(el('p', error.message, 'generated-text'), button('Try again', 'text-button', () => explain(message, {retry: true})));
    } else if (result) {
      const text = el('p', result.message, 'generated-text'); text.lang = language; box.append(text);
      if (result.missing_information?.length) {
        const details = el('details', undefined, 'explanation-questions'); details.append(el('summary', 'What the original leaves open'));
        const list = el('ul'); list.lang = language; result.missing_information.forEach(item => list.append(el('li', item))); details.append(list); box.append(details);
      }
    } else { expanded.delete(context); return; }
    body.append(box);
  }
  async function explain(message, {retry = false, open = false} = {}) {
    if (!state.canExplain(message.id)) return;
    const key = keyFor(message);
    const context = expansionKey(message);
    if (!open && !retry && expanded.has(context)) { expanded.delete(context); renderMessages(); renderThread(); return; }
    expanded.add(context); errors.delete(key);
    if (!retry && state.explanationFor(message.id, viewer, language)) { renderMessages(); renderThread(); return; }
    if (requests.has(key)) { renderMessages(); renderThread(); return; }
    const token = state.beginExplanation(message.id);
    if (!token) return;
    const controller = new AbortController(); requests.set(key, {controller, token}); renderMessages(); renderThread();
    const targets = {...state.languages};
    try {
      const response = await fetch('/api/translate', {method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({message: token.source, target_languages: targets}),
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(70000)])});
      const data = await response.json();
      if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'Could not explain this message. Please try again.');
      const result = data.translations?.find(item => item.profile_id === token.profileId && item.target_language === token.language);
      if (!result || typeof result.message !== 'string') throw new Error('The explanation was incomplete. Please try again.');
      if (state.finishExplanation(token, result)) onExplanationSaved({id: `explanation-${token.sequence}`, title: `Demo explanation for ${name(token.profileId)}`,
        provenance: 'demo', kind: 'translate', snapshot: {mode: 'D', conversation: token.conversation, message: token.source, target_languages: targets}, data});
    } catch (error) {
      if (error.name !== 'AbortError' && state.conversation === token.conversation && state.findMessage(token.id)?.text === token.source && state.explanationRequests.get(key) === token.sequence) {
        errors.set(key, {source: token.source, sequence: token.sequence, message: error.name === 'TimeoutError' ? 'This took too long. Try again.' : error instanceof TypeError ? 'Cannot reach the server. Check your connection and try again.' : error.message});
      }
    } finally {
      if (requests.get(key)?.token === token) requests.delete(key);
      renderMessages(); renderThread();
    }
  }
  function captureFocus(container) {
    const active = document.activeElement;
    const row = active?.closest('[data-message-id]');
    return container.contains(active) && row && active.dataset.focusKey !== undefined
      ? {message: row.dataset.messageId, action: active.dataset.focusKey} : null;
  }
  function restoreFocus(container, focus) {
    if (!focus) return;
    const row = [...container.querySelectorAll('[data-message-id]')].find(node => node.dataset.messageId === focus.message);
    const control = row && [...row.querySelectorAll('button')].find(node => node.dataset.focusKey === focus.action);
    (control || $('#messages-tab')).focus({preventScroll: true});
  }
  function explanationAction(message) {
    if (!state.canExplain(message.id)) return null;
    const key = keyFor(message);
    const context = expansionKey(message);
    const control = button(requests.has(key) ? (language === 'ko' ? 'Translating…' : 'Simplifying…') : expanded.has(context) ? 'Hide explanation' : language === 'ko' ? 'Simplify + translate' : 'Simplify for me', 'understand-button', () => explain(message), 'spark');
    control.dataset.focusKey = 'understand';
    control.setAttribute('aria-expanded', String(expanded.has(context)));
    control.setAttribute('aria-busy', String(requests.has(key)));
    control.disabled = getProfiles().length !== 3;
    return control;
  }
  function renderMessages() {
    for (const [key, entry] of requests) {
      if (state.explanationRequests.get(key) !== entry.token.sequence) {
        entry.controller.abort(); requests.delete(key); errors.delete(key);
        expanded.delete(JSON.stringify([entry.token.conversation, entry.token.id]));
      }
    }
    const log = $('#chat-log'); const focus = captureFocus(log); log.replaceChildren();
    const query = $('#chat-search').value.trim().toLocaleLowerCase();
    let shown = 0;
    state.thread.forEach((message, index) => {
      if ((savedOnly && !message.saved) || (query && !`${message.text} ${name(message.profile_id)}`.toLocaleLowerCase().includes(query))) return;
      shown++;
      const {row, body} = messageContent(message, index);
      const reactions = el('div', undefined, 'reactions');
      for (const [emoji, authors] of Object.entries(message.reactions || {})) {
        if (!authors.length) continue;
        const reaction = button(`${emoji} ${authors.length}`, `reaction${authors.includes(viewer) ? ' mine' : ''}`, () => { state.toggleReaction(message.id, emoji, viewer); renderMessages(); });
        reaction.dataset.focusKey = `reaction-${emoji}`; reaction.setAttribute('aria-label', `${emoji}: ${authors.map(name).join(', ')}`); reaction.setAttribute('aria-pressed', String(authors.includes(viewer))); reactions.append(reaction);
      }
      if (reactions.childElementCount) body.append(reactions);
      const actions = el('div', undefined, 'message-actions');
      const reply = button(message.replies?.length ? `${message.replies.length} ${message.replies.length === 1 ? 'reply' : 'replies'}` : 'Reply', 'reply-button', () => openThread(message.id), 'chat');
      reply.dataset.focusKey = 'reply';
      const conversion = explanationAction(message); if (conversion) actions.append(conversion);
      actions.append(reply);
      body.append(actions);
      const tools = el('div', undefined, 'message-hover-tools');
      for (const emoji of ['👍', '👀', '✅', '💡']) { const react = button(emoji, 'icon-button', () => { state.toggleReaction(message.id, emoji, viewer); renderMessages(); }); react.setAttribute('aria-label', `React ${emoji} to ${name(message.profile_id)}’s message`); tools.append(react); }
      const save = button('', `icon-button${message.saved ? ' is-saved' : ''}`, () => { state.toggleSaved(message.id); renderMessages(); }, 'bookmark');
      save.dataset.focusKey = 'save'; save.setAttribute('aria-label', message.saved ? 'Unsave message' : 'Save message'); save.setAttribute('aria-pressed', String(!!message.saved)); tools.append(save);
      body.append(tools); renderExplanation(message, body); log.append(row);
    });
    $('#search-summary').hidden = !query;
    if (query) { $('#search-summary').replaceChildren(el('span', `${shown} ${shown === 1 ? 'message' : 'messages'} found`), button('Clear search', 'text-button', () => { $('#chat-search').value = ''; renderMessages(); })); }
    if (!shown) {
      const empty = el('div', undefined, 'empty-chat'); empty.append(el('h3', query ? 'No messages found' : 'Nothing saved here yet'), el('p', query ? 'Try another word, or return to all messages.' : 'Save a message to keep it close at hand.'));
      empty.append(button('Show all messages', 'secondary', () => { savedOnly = false; $('#chat-search').value = ''; render(); })); log.append(empty);
    }
    restoreFocus(log, focus);
    $('#saved-toggle').setAttribute('aria-pressed', String(savedOnly)); $('#saved-toggle').classList.toggle('selected', savedOnly);
    $('#messages-tab').classList.toggle('selected', !savedOnly); $('#rail-saved').classList.toggle('active', savedOnly); $('#rail-chat').classList.toggle('active', !savedOnly);
  }
  function openThread(id) {
    selectedThread = id; $('#tools-panel').hidden = true; $('#thread-panel').hidden = false;
    $('#reply-message').value = replyDrafts.get(replyKey()) || ''; $('#reply-status').textContent = ''; renderThread(); $('#reply-message').focus();
  }
  function renderThread() {
    if (!selectedThread) return;
    const message = state.thread.find(m => m.id === selectedThread);
    if (!message) { closePanels(); return; }
    const container = $('#thread-messages'); const focus = captureFocus(container); container.replaceChildren();
    function appendMessage(item, index) {
      const {row, body} = messageContent(item, index);
      const conversion = explanationAction(item);
      if (conversion) { const actions = el('div', undefined, 'message-actions'); actions.append(conversion); body.append(actions); }
      renderExplanation(item, body); container.append(row);
    }
    appendMessage(message, state.thread.indexOf(message));
    const replies = message.replies || []; container.append(el('p', `${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}`, 'reply-divider'));
    replies.forEach(appendMessage); restoreFocus(container, focus);
  }
  function scrollToEnd() { requestAnimationFrame(() => { $('#chat-scroll').scrollTop = $('#chat-scroll').scrollHeight; }); }
  function syncComposer() {
    const text = $('#chat-message').value; state.editChatDraft(text);
    $('#composer-count').textContent = `${text.length.toLocaleString()} / 6,000`;
    $('#chat-send').disabled = !text.trim() || getProfiles().length !== 3;
    $('#review-composer').disabled = !text.trim();
    $('#chat-message').style.height = 'auto'; $('#chat-message').style.height = `${Math.min(160, Math.max(65, $('#chat-message').scrollHeight))}px`;
  }
  function render() {
    renderNavigation(); syncViewerControls();
    const conversation = currentConversation(); const dm = conversation.kind === '1:1 demo';
    $('#chat-title').textContent = channelName(); $('#channel-symbol').textContent = dm ? '↔' : '#'; $('#channel-emblem').textContent = dm ? '↔' : '#';
    $('#channel-topic').textContent = conversation.topic || 'Scope, screens, and all the small details in between.';
    $('#conversation-heading').textContent = channelName();
    $('#conversation-description').textContent = dm ? 'A conversation between Alex and Sam.' : conversation.description || 'The place to bring our checkout experience together.';
    $('#chat-message').placeholder = dm ? 'Message Alex + Sam' : `Message #${channelName()}`;
    $('#chat-message').value = state.chatDraft; syncComposer(); renderMessages(); renderThread();
  }
  function populateProfiles() {
    $('#viewer').replaceChildren();
    for (const profile of getProfiles()) {
      const languageLabel = state.languages[profile.id] === 'ko' ? '한국어' : 'English';
      const option = el('option', `${profile.name} · ${languageLabel}`); option.value = profile.id; $('#viewer').append(option);

    }
    syncViewerControls();
  }
  $('#chat-message').addEventListener('input', () => { announce(); syncComposer(); });
  $('#chat-form').addEventListener('submit', event => {
    event.preventDefault();
    if (!state.sendLocal(viewer, $('#chat-message').value)) { announce('Could not send. Use 1–6,000 characters; a conversation holds up to 20 messages and 12,000 characters.'); return; }
    savedOnly = false; $('#chat-search').value = ''; announce(); onSourceChange(); render(); scrollToEnd(); $('#chat-message').focus();
  });
  for (const [input, form] of [['#chat-message', '#chat-form'], ['#reply-message', '#reply-form']]) {
    $(input).addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey && !event.isComposing && event.keyCode !== 229) { event.preventDefault(); $(form).requestSubmit(); } });
  }
  $('#reply-form').addEventListener('submit', event => {
    event.preventDefault();
    if (!state.replyLocal(selectedThread, viewer, $('#reply-message').value)) { $('#reply-status').textContent = 'Use 1–6,000 characters. Each thread holds up to 20 replies.'; return; }
    replyDrafts.delete(replyKey());
    $('#reply-message').value = ''; $('#reply-status').textContent = ''; renderMessages(); renderThread();
    $('#thread-messages').scrollTop = $('#thread-messages').scrollHeight;
  });
  $('#viewer').addEventListener('change', () => switchViewer($('#viewer').value));
  $('#reply-message').addEventListener('input', () => { if (selectedThread) replyDrafts.set(replyKey(), $('#reply-message').value); });
  $('#chat-search').addEventListener('input', renderMessages);
  $('#saved-toggle').addEventListener('click', () => { savedOnly = !savedOnly; renderMessages(); });
  $('#messages-tab').addEventListener('click', () => { savedOnly = false; $('#chat-search').value = ''; renderMessages(); });
  $('#rail-saved').addEventListener('click', () => { savedOnly = true; renderMessages(); });
  $('#rail-chat').addEventListener('click', () => { savedOnly = false; $('#chat-search').value = ''; closePanels(); render(); });
  $('#open-tools').addEventListener('click', openTools);
  $('#close-tools').addEventListener('click', () => { closePanels(); $('#open-tools').focus(); });
  $('#close-thread').addEventListener('click', () => { const id = selectedThread; closePanels(); [...document.querySelectorAll('#chat-log .chat-message')].find(row => row.dataset.messageId === id)?.querySelector('.reply-button')?.focus(); });
  $('#show-members').addEventListener('click', () => showDialog('profiles', 'Checkout profiles'));
  $('#rail-inbox').addEventListener('click', () => showDialog('inbox', 'Clarity Inbox'));
  $('#workspace-help').addEventListener('click', () => showDialog('help', 'About this workspace'));
  $('#close-workspace-dialog').addEventListener('click', () => $('#workspace-dialog').close());
  $('#mobile-nav').addEventListener('click', () => { const open = $('#sidebar').classList.toggle('open'); $('#mobile-nav').setAttribute('aria-expanded', String(open)); });
  $('#review-composer').addEventListener('click', () => { onReviewDraft(state.chatDraft); openTools(); });
  $('#use-tool-draft').addEventListener('click', () => { state.editChatDraft(state.draft); render(); closePanels(); $('#chat-message').focus(); });
  $('#insert-emoji').addEventListener('click', () => insertText(' 🙂'));
  $('#insert-mention').addEventListener('click', () => insertText('@Alex '));
  function insertText(text) { const input = $('#chat-message'); input.setRangeText(text, input.selectionStart, input.selectionEnd, 'end'); input.focus(); syncComposer(); }
  document.addEventListener('keydown', event => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); $('#chat-search').focus(); }
    if (event.key === 'Escape' && !document.querySelector('dialog[open]')) { closePanels(); $('#sidebar').classList.remove('open'); $('#mobile-nav').setAttribute('aria-expanded', 'false'); }
  });
  return {render, populateProfiles, openTools, closePanels, showDialog};
}
