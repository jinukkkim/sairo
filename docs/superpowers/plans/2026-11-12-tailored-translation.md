# Tailored Translation Implementation Plan

> **For agentic workers:** Use executing-plans to implement task by task.

**Goal:** An English-first demo that rewrites one message for three fixed recipients.
**Architecture:** Independent core, FastAPI endpoint, static browser interface.
**Tech Stack:** Python 3.12+, httpx, Pydantic, FastAPI, pytest, plain JavaScript.
**Spec:** docs/superpowers/specs/2026-11-12-tailored-translation-design.md

## Global constraints
- English UI, examples and generated output; real AI calls only.
- core never imports server or web; keys belong in ignored .env files.
- No persistence or extra features; separate commits by scope, no push.

## Review focus
- Blank/oversized messages rejected before spending API tokens.
- Missing, repeated or foreign recipient IDs rejected.
- Truncated/refused/malformed provider output never presented as success.
- Secrets and provider responses excluded from user-facing failures.
- Message edits cannot leave results mislabeled as the new message.

## Task 1: Translation core
Files: core/translation.py, tests/test_translation.py, pyproject.toml, .env.example.
Interface: async translate(message, *, api_key, model, client) -> TranslationBatch;
PROFILES holds three fixed Profile values; TranslationError exposes safe errors.
- [x] Write tests for grounded prompts, valid results, input limits, invalid recipient
  IDs, invalid text, missing keys, provider errors and malformed/truncated output.
- [x] Run pytest and observe missing implementation failure.
- [x] Implement models, profiles, prompt and structured Claude API request.
- [x] Run pytest; commit feat(core).

## Task 2: Local API
Files: server/app.py, tests/test_server.py.
Interface: GET /api/profiles, POST /api/translate {message}; returns TranslationBatch JSON.
- [x] Write tests for profiles, input validation, translated output and safe errors.
- [x] Run tests and observe missing server failure.
- [x] Implement FastAPI, environment loading, fixed static asset routes.
- [x] Run pytest; commit feat(server).

## Task 3: English demo interface
Files: web/index.html, web/styles.css, web/app.js, README.md, tests/test_web.py.
- [x] Add smoke tests for served document/assets and run before implementation.
- [x] Build editable English source, three profile views, loading/error/success states.
- [x] Clear stale results on edits; safely render generated text; responsive layout.
- [x] Run full pytest and browser checks where available; document setup and limits.
- [x] Commit feat(web); retain local branch without pushing.

## Execution evidence

- Core: 22 tests passed before its commit.
- API: full suite of 32 tests passed before its commit.
- UI/assets: full suite of 34 tests passed; JavaScript syntax check passed.
- Local HTTP: page returned 200; missing key returned the documented setup error.
- Browser host unavailable: visual/mobile review remains unverified.
- No API key configured: live generation and translation quality remain unverified.
