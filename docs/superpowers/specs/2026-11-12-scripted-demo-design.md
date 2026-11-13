# Scripted demonstration mode

The user explicitly superseded the real-AI requirement: do not make actual AI
requests; show prepared results after a short loading state. No API key required.

## Approach
Keep existing local HTTP endpoints and their response schemas, replace server
inference dispatch with deterministic fixtures, and await a 0.7 second delay.
This reuses the existing loading, cancellation, stale-source and rendering code.
A browser-only mock would leave live endpoints callable; a runtime provider toggle
is unnecessary for the requested demo. Current server routes must never dispatch
to the retained OpenAI core, regardless of environment variables.

Store prepared translations, reviews, improvements and attributed thread results
in server/demo-results.json, read by a small server/demo.py adapter. Include every
seeded message, draft and aligned example, with English/Korean/Chinese output and
role-specific versions. Fixture matching uses exact source text and exact thread
ID/author/text snapshots. Never apply an unrelated prepared finding to edited text.
Unknown text gets a localized prepared-demo notice; edited/unknown threads get
insufficient-evidence interpretations and no candidate disagreements. Unknown draft
improvement returns the original unchanged plus a notice to load an example.

Keep main chat, replies, reactions, save/search and explicit apply/restore unchanged.
Use one visible Demo mode notice, label explanations/results/Inbox as prepared demo
content and remove live-AI provenance. No automatic model calls, fallback or key UI.
The user instruction overrides the older repository rule that calls must be real;
update that active rule and README, preserving historical design records.

## Verification
Guard server tests against all external HTTP requests, even with credentials set.
Check all four route shapes, multilingual bindings, original preservation, sample
and aligned/candidate evidence, unknown/edited sources and awaited delay. Verify
fixture coverage against JS seeded content and preserve stale-state tests. Review
normal explanation, tool results and mobile/desktop loading states if UI available.
