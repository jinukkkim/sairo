# Four Feature Demo Implementation Plan

> **For agentic workers:** Use executing-plans to implement this integrated task; no nested delegation. The controller supplies the independent final review.

**Goal:** Demonstrate E/A/B/D using real AI plus a lightweight English chat, fixed profiles and sample Clarity Inbox.
**Architecture:** Extend independent Python core and FastAPI, with plain JavaScript UI. Keep local demo data explicit; no authentication, persistence or realtime infrastructure.
**Tech Stack:** Existing Python 3.12+, Pydantic/httpx/FastAPI, vanilla JS, pytest.
**Spec:** docs/superpowers/specs/2026-11-12-four-feature-demo-design.md

## Global Constraints
- English UI/default examples. D supports English, Korean and Chinese recipient outputs.
- Real AI for E/A/B/D; seeded chat/Inbox must be marked demo/sample data.
- core never imports server/web. Secrets remain in ignored .env. No credential output.
- No auth, DB, Supabase, real remote messaging, automatic ending detection or C/F/G.
- Commit each complete unit separately by scope (core/server/web), no AI attribution; never push or open PR.
- Existing feature branch is already based on main; continue it without modifying main.

## Review Focus
- Unknown/duplicate recipients and evidence references must not become credible results.
- Candidate disagreements only become confirmed after differing explicit answers to a common question; pending/unsure is unresolved.
- Edits, mode/conversation/language changes and async responses cannot display stale results.
- Improvement never invents facts, is explicit to apply and can be restored.
- Sample Inbox entries cannot be mistaken for live AI analysis or real user responses.

## Task 1: Integrated E A B D demo

**Files:**
- Modify core/translation.py; add focused core modules for reusable AI calls, review and thread analysis as needed.
- Modify server/app.py; preserve POST /api/translate and GET /api/profiles.
- Modify web/index.html, web/styles.css, web/app.js; add small JS helper modules if testability benefits.
- Add/extend tests/test_translation.py, tests/test_server.py, tests/test_web.py and focused review/thread tests.
- Modify README.md and .env.example only if actual setup changes.

**Interfaces:**
- Preserve existing translate(message, *, api_key, client, model) and existing calls/tests; extend with optional recipient-language settings defaulting to English.
- Add POST /api/review for draft review, POST /api/improve for optional improved draft, POST /api/thread-check for attributed conversation analysis.
- Fixed profile IDs remain manager/frontend/designer. Supported target language codes: en/ko/zh.
- Draft limit stays 6,000 characters. Threads: 2–20 messages, at most 12,000 total characters, unique message IDs, known profile IDs.
- Typed review result: per-recipient likely questions and categorized missing-information items (scope/conditions/deadline/priority), empty findings permitted.
- Typed improvement result: revised draft and explicit unresolved information. Do not overwrite the source until Apply; provide Restore.
- Typed thread result: per-participant interpretation/insufficient-evidence indicator, source message IDs, candidate disagreements and common confirmation question/choices. Validate references against input. Empty disagreements permitted.
- UI participant confirmation simulation must be visibly labeled; confirmed discrepancy requires different explicit answers and clears on edits/reanalysis.
- Seeded/local chat and author Inbox are browser-memory only. Generated results enter session Inbox with their original input snapshots.

- [x] Write failing pytest cases before implementation: language defaults/binding, review complete recipients/empty findings, improvement input/output handling, thread length/IDs/evidence validation, no-conflict result, provider failures. Observe missing functionality failures.
- [x] Implement the core with explicit schemas, grounded feature prompts, shared safe provider handling; run full pytest and commit feat(core).
- [x] Write failing route tests for new endpoints and input validation. Implement API routes, no-store responses and safe errors; run full pytest and commit feat(server).
- [x] Add failing smoke/client-state tests for four-mode UI, seeded/live distinctions, confirmation logic and draft/stale-state helpers. Implement accessible responsive UI including demo chat/profile/Inbox shell. Prefer reusable pure JS helpers and native node --test if needed, no new frontend framework.
- [x] Update English README with actual behavior, AI setup, sample-data limits and verification commands. Run full pytest, client tests and node syntax checks. Commit feat(web) with docs.
- [x] Report tests, commits and limitations. Live AI and browser checks only if available; absent API key/browser is an explicit unverified condition, not a success claim.

## Execution notes
User requested GPT-6.1 Sol with high reasoning for implementation. Controller delegates this integrated task accordingly and performs a separate independent review after the implementation report. No further approval pauses for reversible implementation choices.

### Core execution evidence
- RED: 15 new feature tests failed because languages/review/improve/thread-check were absent. Additional insufficient-evidence regression failed before validation was added.
- GREEN: `.venv/bin/python -m pytest -q`: 62 passed. Shared structured-output boundary retains safe provider errors and validates generated recipient/language/evidence bindings.
- Ruling: `target_languages` accepts a partial recipient mapping and fills unspecified recipients with English — preserves existing translate callers and permits incremental D selection — clients needing every selection explicit can still supply all three.
- Ruling: thread interpretations cover only profiles present in the input; insufficient evidence cannot support a candidate — absent teammates must not acquire invented beliefs — silent absent profiles are omitted.

### API execution evidence
- RED: 11 new route tests failed on absent routes, rejected language mappings and missing no-store validation headers.
- GREEN: `.venv/bin/python -m pytest -q`: 73 passed. New review/improve/thread-check routes use typed inputs/outputs, shared safe AI errors and no-store on successful, failed and invalid API requests. Existing translate/profiles behavior remains covered.

### Provider compatibility correction
- Controller identified that Claude structured outputs reject Pydantic length/array constraints. RED: transport schema test failed on minLength/maxLength. GREEN: provider schema recursively omits unsupported constraints while local Pydantic validation still rejects oversized output; full pytest: 74 passed.

### Web execution evidence
- Design: retained the approved blue/white palette (`#182c4b` ink, `#53657d` muted, `#2556ca` action, `#dce3ef` borders, `#f3f6fc` canvas, `#236e67` live-result accent) and system sans typography. Left-aligned workspace navigation, chat and source above analyses keep original evidence connected to the results. Sample provenance uses amber; live analyses use teal. Mobile stacks the same controls and preserves expandable profiles. Reviewed against the brief before implementation; avoided a separate marketing hero or new framework.
- RED: four-mode static smoke failed against the original E-only page; Node state suite initially failed because the workspace modules did not exist. Additional regressions failed for missing improvement-review snapshot retention and accepting an unknown local author.
- GREEN: `.venv/bin/python -m pytest -q`: 75 passed. `node --test tests/test_state.mjs`: 7 passed. `node --check web/app.js`, `web/state.mjs`, `web/demo.mjs`: exit 0.
- Covered: draft apply/restore, pending/unsure/matching/differing explicit simulation answers, reanalysis clearing answers, input/mode/conversation/language invalidation, late success/error rejection, immutable source snapshots and memory-only local chat.
- Ruling: both seeded and locally appended messages share the editable thread; conversation selection preserves each conversation only in browser memory — one source of truth avoids chat/thread mismatches — refresh intentionally resets all demo state.
- Ruling: Inbox details are immutable snapshots opened separately; loading their source clears current analysis and requires a fresh explicit AI run — samples never acquire live provenance — viewing a sample alone cannot simulate confirmation.
- Real AI semantic/language checks remain unverified without configured credentials. Controller owns the independent native Chrome desktop/mobile review; its results will be recorded separately. No browser or live-AI success is claimed by the implementer.

### Implementation handoff
- Implementation report written to ignored `.superpowers/eabd-implementation-report.md`, with commit IDs, observed RED/GREEN results, rulings and unverified live AI/browser limits. Controller owns independent final review. No push or PR.

### Controller browser evidence
- Native Chrome desktop and DevTools Responsive 400px screenshots reviewed: no blocking layout issues observed; thread controls readable and run button fits.
- Observed: E missing-key error; D recipient languages visible/changeable; sample B Inbox displays sample provenance, original input and matching evidence; loading snapshot switches to B with no stale result; Send locally appends the same message to chat and thread editor.
- Unverified: real generated-result UI, improvement apply/restore and live confirmation controls in a browser, because no API key was configured. State transitions are covered by automated tests; live E/A/B/D prose and en/ko/zh quality remain unverified. Controller closed DevTools and left desktop E.

### Independent review fix wave (FIX_BASE=98fd8de)
- Final: fixed generated unresolved choices being treated as explicit answers — `tests/test_features.py::test_thread_rejects_reserved_unresolved_answer_choices` RED: six cases were accepted; GREEN: output validation rejects leading Unsure/Pending labels, case-insensitively with stripped whitespace. Core covering file: 35 passed.
- Final: fixed candidate/participant inherited-property reuse and prototype pollution — `tests/test_state.mjs` RED: inherited participant answers falsely confirmed; real safe update/mapping helpers were absent. GREEN: actual app answer updates use nested Maps, object answer reads require own keys, arbitrary `__proto__`/`constructor`/`toString` keys cannot mutate Object.prototype, and edited/reanalyzed candidates remain pending.
- Final: browser choice rendering, selection updates and confirmation status share unresolved-choice classification. Exact UI Unsure label, casing/whitespace variants and Pending cannot confirm or align, even through stale numeric selections; distinct substantive choices still confirm. Node covering suite: 10 passed.
- Final verification after both fixes settled: `.venv/bin/python -m pytest -q`: 81 passed in 0.25s; `node --test tests/test_state.mjs`: 10 passed; all three JS syntax checks and `git diff --check`: exit 0. No live AI/browser success checks added; previous limitations remain. Controller owns scoped re-review.
