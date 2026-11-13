# Participant Views Implementation Plan

> Implement inline with test-driven-development; request independent final review.

**Goal:** Three views of one room: Alex/Sam simplified English, Jamie simplified Korean.
**Architecture:** Existing shared Workspace; fixed participant language map and UI switcher.
**Tech Stack:** Existing vanilla JS/HTML/CSS, native Node tests and pytest.
**Spec:** docs/superpowers/specs/2026-11-13-participant-views-design.md

## Constraints and review focus
- No external AI calls, separate rooms, manual language override or new dependencies.
- Switching preserves conversation and open-message context; response caches bind person/language.
- Unsent text and send author must not cross participant views.
- Inbox loading must not override fixed languages; mobile controls stay accessible.

## Task 1: Shared-room views
Files: web/demo.mjs, web/state.mjs, web/chat.mjs, web/app.js, web/index.html,
web/styles.css, tests/test_state.mjs, tests/test_demo.mjs, tests/test_web.py, README.md.
- [x] Add failing tests for en/ko/en defaults, switching in one room, derived
      explanation targets, per-view drafts and snapshot policy; observe RED.
- [x] Add visible participant buttons and fixed treatment labels; sync sidebar,
      composer and expanded explanations; retain prepared-result requests.
- [x] Run Python/Node checks, desktop/mobile browser flows and independent review;
      fix material issues and record limits. Commit web changes and documentation.

## Verification record
- Baseline: 117 Python and 20 native Node tests passed in the prior scripted demo.
- RED: new viewer/default-language, per-person draft and snapshot policy tests failed;
  visible switcher/read-only language HTML check failed before implementation.
- GREEN: fixed language bindings en/ko/en, three derived explanation identities,
  same-room preservation, shared sends, per-person chat drafts, Inbox language policy
  and delayed cross-view result isolation pass. Retained prepared fixture coverage
  and no-external-provider tests remain green.
- Independent review reported no material correctness findings; it traced main/reply
  drafts, shared sends, async cache isolation, fixed tool languages and Inbox loading.
- Native browser verification was attempted but unavailable: native pipe startup
  failed and the browser access host was unavailable. The new switcher's final
  desktop/mobile visual and accessibility review is therefore unverified.
- No backend changes or actual AI calls. Existing prepared responses are reused.
- Final verification: 118 Python tests, 24 native Node tests, four JS syntax checks
  and git diff --check passed. Local web/documentation commits only; no push or PR.
