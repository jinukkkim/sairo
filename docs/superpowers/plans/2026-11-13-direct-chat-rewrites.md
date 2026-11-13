# Direct Chat Rewrites Plan

> Implement inline with test-driven-development and independent final review.

**Goal:** Natural direct-speech rewrites, no self-conversion, sidebar-only viewer.
**Spec:** docs/superpowers/specs/2026-11-13-direct-chat-rewrites-design.md
**Stack:** Existing vanilla JS, static JSON fixtures, pytest and native Node tests.
**Constraints:** No real AI, new dependencies, invented advice or extra language choices.

- [x] Add failing owner-eligibility, direct-voice fixture and updated markup checks.
- [x] Rewrite prepared wording; gate conversion in main/thread views and state;
      remove duplicate viewer UI/footer, preserving shared expanded context.
- [x] Verify tests/syntax, review connected code, record browser limits and commit
      server data, web behavior and docs separately. No push or PR.

## Verification record
- RED: owner eligibility and direct-voice fixture checks failed before changes;
  the former top-switcher HTML assertion was replaced with sidebar-only behavior
  and observed failing against the old markup.
- All 16 prepared sources in all role/language variants now use direct speaker
  voice. Removed role prefixes from thread fixture text too. m4 stays a question
  addressed to Jamie; m2 stays first-person, with no invented scope advice.
- Self-conversion is gated centrally and in both message/reply rendering. Shared
  expansion context survives the author view without displaying converted text.
  Response and cache keys remain specific to source/person/language.
- Independent review reported no material findings. Its local checks passed:
  27 Node tests and 34 web/server Python tests.
- Restarted the local prepared-data server. Observed HTTP 200, sidebar-only viewer
  markup, and m4 returned as a direct Korean question without narrator phrasing.
- Native browser check remains unavailable (Sky native pipe startup failed). No
  new desktop/mobile visual claim. No actual AI calls, new dependencies or push/PR.
- Final checks: 118 pytest tests, 27 Node tests, four JS syntax checks and
  git diff --check passed. Server fixture, web behavior and docs committed separately.
