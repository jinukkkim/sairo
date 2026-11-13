# Chat Workspace Implementation Plan

> Implement inline using executing-plans and test-driven-development; use an independent final reviewer.

**Goal:** A chat-first workspace with per-message understandable rewrites.
**Architecture:** Retain FastAPI and vanilla JS. Extend in-memory Workspace state;
render chat interactions in a focused chat module, reuse existing AI tools.
**Tech Stack:** Python, HTML/CSS, native JavaScript, pytest, node:test.
**Spec:** docs/superpowers/specs/2026-11-12-chat-workspace-design.md

## Global Constraints
English UI. No reference service name in UI. Real AI, local messages, refresh reset.
No dependencies, auth, DB or remote delivery. Retain original text and AI provenance.

## Review Focus
- Replies, reactions and saves must remain isolated per conversation.
- Edited/deleted messages must reject stale translation responses.
- IME composition must not send a message on Enter.
- Empty/oversized messages and replies must preserve existing data.
- Empty search/saved views must explain how to return to the conversation.

## Task 1: Integrated chat workspace
**Files:** web/state.mjs, web/demo.mjs, web/index.html, web/styles.css,
web/app.js, new web/chat.mjs, tests/test_state.mjs, tests/test_web.py, README.md.
**Interfaces:** Workspace adds replyLocal, toggleReaction, toggleSaved,
beginExplanation and finishExplanation; existing AI APIs remain unchanged.
- [x] Add state tests for reply isolation, limits, toggle behavior, explanation
      source/viewer/language binding and stale rejection; observe failures.
- [x] Implement state, chat-first shell, contextual explanations and optional AI tools.
- [x] Run pytest, native Node tests, syntax checks and desktop browser checks.
      Mobile browser review is unverified because browser use was interrupted.
- [x] Review diff, document actual limitations and commit feat(web).

## Verification record
- Baseline: 81 pytest and 10 Node tests passed.
- RED→GREEN: replies/reactions/saves, independent chat drafts, message/viewer/language
  explanation binding, deleted/restored source invalidation, reply explanations,
  missing-source lookup, and API snapshots excluding local message metadata.
- Native Chrome observed: empty default composer, Enter send, thread reply, save
  and saved filtering, search with two matching messages. Desktop layout reviewed.
- Independent review: fixed metadata rejection, stale explanation resurrection,
  missing explanation action on replies, and DOM refresh focus preservation.
  Focus restoration is implemented; final keyboard/browser recheck is unverified.
- Browser access was interrupted by user activity; mobile layout is implemented
  but a mobile browser review remains unverified.
- Automatic approval review rejected the live explanation click because it could
  send chat text to an external AI provider. No bypass was attempted. A subsequent
  read-only check confirmed the local API key is not configured. Real AI output
  and language quality remain unverified. No canned result fallback was added.

- Final checks: 82 pytest passed, 18 Node tests passed, four JS syntax checks and
  git diff --check passed. No push or PR.
