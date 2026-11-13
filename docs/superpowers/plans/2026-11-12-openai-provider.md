# OpenAI Provider Implementation Plan

> Implement inline using executing-plans and test-driven-development; independent final review.

**Goal:** Replace Anthropic inference with OpenAI Responses using gpt-6-luna.
**Architecture:** Existing httpx/Pydantic boundary; unchanged frontend/API contracts.
**Tech Stack:** Python, httpx, FastAPI, pytest, native JS state tests.
**Spec:** docs/superpowers/specs/2026-11-12-openai-provider-design.md

## Global Constraints
Default gpt-6-luna, reasoning low, strict JSON output, store=false. No new dependency,
provider router or fallback. Existing prompts and semantic validations preserved.
Keys remain in ignored .env. No push/PR. Commit core and server changes separately.

## Review Focus
- Reasoning output must not hide a refusal or ambiguous assistant output.
- Pydantic defaults must not leave strict schema fields optional.
- API failures must never expose credentials or raw provider errors.
- Every route must use OpenAI key/model settings without Anthropic fallback.
- Missing key must not make any provider request.

## Task 1: OpenAI transport
Files: core/ai.py, core/translation.py, tests/test_translation.py,
tests/test_features.py, tests/test_openai.py.
- [x] Migrate mocked envelopes and transport assertions; add strict schema and
      reasoning/refusal/malformed response tests. Observe failures before code.
- [x] Implement Responses transport, schema normalization and safe parsing;
      share DEFAULT_MODEL across feature functions. Run core tests and commit feat(core).

## Task 2: Server configuration
Files: server/app.py, tests/test_server.py, .env.example.
- [x] Add failing tests that all routes read OPENAI_API_KEY and OPENAI_MODEL,
      with default/empty model fallback and actionable missing key.
- [x] Update configuration, run full pytest and JS checks, commit feat(server).

## Task 3: Setup documentation and review
Files: README.md and this plan/spec.
- [x] Update active setup/data-destination/model docs; retain historical design docs.
- [x] Independent review; resolve material findings with regression tests.
- [x] Record final verification and actual live-call limitation; commit docs.

## Verification record
- Baseline: 82 Python and 18 native JS tests passed.
- Task 1 RED: 13 failures after migrating provider fixtures and asserting OpenAI
  transport/strict schema/defaults. GREEN: 84 core/provider tests passed.
- Task 1 commit: 321b7ed (core and core tests only).
- Task 2 RED: 17 failures for OpenAI credential/model routing and refusing legacy
  credential fallback. GREEN: complete pytest suite 126 passed; native JS 18 passed.
- Task 2 commit: e1eb660 (server, server tests and .env.example only).
- Independent review: no material findings; focused Python suites 122 passed.
- Preserved httpx rather than adding a new SDK dependency. OPENAI_MODEL overrides
  must support Responses, Structured Outputs and low reasoning; no automatic model
  escalation or provider fallback. A wrong model selection requires configuration
  correction; factual/language quality is still subject to live evaluation.
- Created an ignored, mode-600 .env with an empty OPENAI_API_KEY and default model;
  no credential was retrieved, displayed or committed.
- Restarted the existing localhost server. Observed HTTP 200 for the chat and an
  actionable missing-OPENAI_API_KEY HTTP 502 with no-store for /api/translate.
  No external provider request occurred in this check.
- Live generation, account/model access and English/Korean/Chinese quality remain
  unverified because no OpenAI key is configured. This is not live success evidence.
- Final verification: 126 pytest and 18 native JS tests passed; four JS syntax
  checks and git diff --check passed. No push or PR.
