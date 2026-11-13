# Scripted Demo Implementation Plan

> Implement inline with test-driven-development; independent review before completion.

**Goal:** Demonstrate all existing AI interactions using prepared local results only.
**Architecture:** Fixed JSON fixtures, server demo adapter and existing UI loading.
**Tech Stack:** Existing Python/FastAPI, vanilla JS, pytest, native Node tests.
**Spec:** docs/superpowers/specs/2026-11-12-scripted-demo-design.md

## Constraints and Review Focus
- No provider dispatch even when API keys are configured; no new dependencies.
- Prepared results bind exact source, profile and language; edited input cannot
  acquire unrelated findings or false no-gaps claims.
- Candidate evidence must refer to supplied messages; aligned examples stay aligned.
- Preserve cancellation, stale callback handling and explicit apply/restore.
- Every visible result and Inbox item must distinguish prepared content from live AI.

## Task 1: Local prepared responses
Files: server/demo.py, server/app.py, server/demo-results.json, tests/test_server.py.
- [x] Write route tests blocking external HTTP and checking fixture/source binding,
      multilingual outputs, review/improvement/thread cases and simulated delay; see RED.
- [x] Implement fixed data/adapter and route dispatch without provider imports; run
      Python suite, inspect and commit feat(server).

## Task 2: Demonstration UX and documentation
Files: web/app.js, web/chat.mjs, web/index.html, web/state.mjs, tests/test_state.mjs,
tests/test_web.py, CLAUDE.md, README.md, .env.example and plan/spec.
- [x] Add failing demo provenance and complete seeded fixture coverage checks.
- [x] Update UI copy/provenance and active project instructions; no layout overhaul.
- [x] Run Python/Node tests and syntax checks, inspect browser flows, independent
      review and fixes, then scoped web and documentation commits. No push or PR.

## Execution and verification
- User instruction explicitly supersedes the earlier real-AI requirement.
- RED: demo routes/data had 14 failures against live dispatch; demo provenance
  and visible-copy checks failed before updates. GREEN: prepared route responses,
  delayed loading, source/viewer/language binding and demo labels pass.
- Fixed fixtures cover 16 source texts, 3 roles and 3 languages, 2 drafts and 4
  attributed threads. Node checks cover every seeded source and fixture evidence.
- Server tests reject all external HTTP, including when fake credentials are set.
  API request validation and no-store responses remain covered.
- Independent review: remaining “with AI”/“run AI” action labels were corrected to
  Review draft / Check thread / Improve draft / Load this source to preview.
  No material provider, fixture-matching or stale-state issues were reported.
- Native Chrome observed: English and Korean inline explanations, prepared draft
  review, proposal comparison, explicit apply and restore, thread interpretations
  and candidate evidence. Keyboard focus stays on the explanation control.
- Desktop and 400px responsive screenshots reviewed; main chat, composer and Korean
  explanation fit. Device emulation and DevTools were closed afterward.
- Restarted localhost server with prepared-response routes. API keys are not loaded
  or used; retained OpenAI core has no route from the current application.
- Final: 117 Python tests, 20 native Node tests, four JS syntax checks and
  git diff --check passed. No actual AI requests, push or PR.
