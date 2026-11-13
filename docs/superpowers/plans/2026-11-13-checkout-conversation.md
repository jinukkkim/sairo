# Checkout Conversation Implementation Plan

> Execute inline; the user delegated implementation after approving the scenario.

**Goal:** Seed `team-checkout` with the approved conversation in English and matching prepared rewrites.

**Architecture:** Keep the existing JavaScript seeds and source-keyed JSON results. Separate the old conflicting sample from the active room; no runtime logic or provider changes.

**Spec:** `docs/superpowers/specs/2026-11-13-checkout-conversation-design.md`

## Tasks

- [x] Update fixture consistency checks to include the explicit conflicting sample and matching Inbox results; observe the missing sample fail.
- [x] Replace `web/demo.mjs` checkout messages with 13 English messages, retain the old thread as `conflictingThread`, and update its sample handler in `web/app.js`.
- [x] Add direct, ordered prepared rewrites to `server/demo-results.json`; add the new aligned thread and match the Inbox result to it.
- [x] Adjust the existing direct-speech example test to the new dialogue; preserve other state tests through stable author IDs.
- [x] Run the full Python/Node suites, syntax checks, diff checks and local API smoke checks; inspect browser behavior when available.
- [x] Update README scenario/fixture documentation and commit verified server, web and documentation units separately.

## Review focus

Missing source fixtures must not fall through to unknown-text notices. The new
conversation must not inherit old scope-conflict evidence. The explicit conflicting
sample must still have grounded candidates. Switching viewers must keep en/ko/en
bindings, with no conversion on own messages. All text remains prepared locally.

## Verification

- `.venv/bin/python -m pytest -q`: 118 passed.
- `node --test tests/test_state.mjs tests/test_demo.mjs`: 28 passed.
- All four JavaScript syntax checks and `git diff --check`: passed.
- Running localhost server: all 13 message sources returned 39 en/ko/en results;
  the active room returned no disagreements and the preserved conflicting sample
  returned its original grounded candidate.
- Existing prepared translations, drafts and sample thread results are unchanged.
- Independent review: no actionable findings.
- Browser host unavailable; no visual browser verification.
