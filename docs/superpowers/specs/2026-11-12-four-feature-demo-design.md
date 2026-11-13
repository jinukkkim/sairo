# Sairo E A B D demo design

## Status and authority
Implementation design for the user-approved expanded demo scope, 2026-11-12.
The user requested starting implementation of E, A, B and D plus lightweight demo
chat, fixed profiles and Clarity Inbox, explicitly excluding real email login,
database and realtime infrastructure. Interaction choices below are builder
decisions within that authorization. This supersedes the earlier E-only scope.
Product references: docs/planning/00_사이로(1).docx and
Sairo_사업계획서_별첨.pdf, especially PDF pages 3, 4, 5 and 11.
The documents' claims about an existing OpenAI/Supabase product do not describe
this repository. This design extends the local Python/FastAPI/Claude demo.

## Intent
Show how Sairo prevents and reveals misunderstandings across roles and languages.
All four advertised demo features execute real AI calls. The interface, default
examples and analysis are English. Original text is always available for comparison.
The same three fixed Checkout profiles demonstrate team context, role, seniority,
and cross-discipline knowledge without requiring account setup.

## Approaches
1. Extend the existing local web demo with four explicit modes. Reuses core and
   UI, makes each feature independently repeatable, requires no external workspace.
   Recommended builder choice for the competition demo.
2. Build a full messenger with accounts, database and live participant responses.
   Adds operational setup without being needed to show the four AI features;
   defer until product planning and customer requirements justify it.
3. Build a Slack app. Requires installation, permissions and platform-specific UI;
   defer because the first integration platform is still undecided.

## Shared screen and presentation
Four labeled navigation controls: Tailored translation (E), Before sending (A),
Thread check (B), Role + language (D). Keep the current readable blue/white UI,
keyboard accessibility and responsive layout. Provide a clearly labeled demo chat workspace: fixed 1:1/group conversations,
local message insertion, profile details and a Clarity Inbox. Never imply actual
remote delivery or online participants. No sign-in screens are needed.

  [Tailored translation] [Before sending] [Thread check] [Role + language]
  Source message or editable conversation         [Run selected feature]
  Original evidence and relevant recipient profiles
  Feature-specific AI results, clearly labeled

Use a coherent Checkout scenario to show the same team throughout. E, A and D
can reuse an editable draft. B starts from a clearly labeled, editable sample
conversation; it is not an actual conversation sent through the app. Switching
modes must not present old outputs as the result of a new input or language.
A sample-conversation button restores the example without fabricating AI results.

## Lightweight messenger and Clarity Inbox
Use fixed English conversations and profiles. A local Send action appends a message
to the visible demo conversation without contacting other people. Conversation
selection supplies appropriate draft/thread context to the AI modes; no real sync.
Clarity Inbox provides a seeded list of examples plus results from the current
browser session. Seeded results are conspicuously labeled sample data. Selecting
an item opens its source and review/thread details or lets the user run real AI.
Actual analyses and sample cards must remain distinguishable. Inbox is an author
workflow demonstration, not an access-control claim. Keep state only in memory;
refresh resets it. Do not add accounts, persistence or Supabase.

## E Tailored translation
Keep current rewriting for a senior product manager, junior frontend developer
and mid-level designer. Strengthen fixed team context with project purpose,
relevant technology and terminology where useful. Separate seniority from
knowledge of other disciplines. Output concise role-specific rewrites and
questions about missing source information. All output defaults to English.

Acceptance: an edited source produces one validated result per recipient;
profiles and original are visible; missing facts are not invented as commitments.

## A Before sending
The user explicitly runs a review on the draft for the same three recipients.
Show recipient-specific likely questions and missing-information items, grouped
by screen/scope, conditions, deadline and priority when relevant. Categories may
have no missing items; do not force warnings for complete drafts.
Then offer a separate Improve draft action using the source and review. It must
retain known facts and leave unresolved information as clearly marked questions
or placeholders. Show the proposed draft alongside the original. Apply draft is
an explicit user action; never auto-send, auto-accept or invent missing facts.
Provide a way to restore the original draft. This is a local editing interaction,
not a real messaging integration.

Acceptance: an ambiguous sample reveals role-specific questions; a complete
sample can have no missing items; improvement is optional and reversible;
original and unresolved information remain distinguishable.

## B Thread check
Render and allow editing of a short sample conversation, with each message
attributed to one of the three fixed profile IDs and a stable message ID.
AI returns each participant's possible understanding, evidence message IDs,
possible disagreements and neutral confirmation questions. An absence of
conflict is a valid result. Cite actual supplied messages, and reject unknown
message/profile references. Missing evidence is not itself proof of disagreement.
A participant with insufficient statements may be labeled as having insufficient
evidence; role alone must not be treated as proof of their beliefs.

Label every AI disagreement as a candidate pending confirmation. For the demo,
provide a clearly marked local participant-response simulation: the presenter
selects an answer for each concerned profile to the same clarification question.
Questions offer neutral shared answer choices plus an unresolved/unsure state.
Only differing explicit answers to the same question confirm disagreement.
Pending or unsure responses never confirm it. Matching explicit answers indicate
alignment on that question only. These are demonstration inputs, not real DM
responses. Reanalysis or conversation edits clear prior confirmations. No automatic
thread-ending detection is included.

Acceptance: show a conflicting and an aligned sample; evidence links point to
real input messages; candidate and confirmed disagreement remain distinct;
editing source or answers cannot leave obsolete confirmation status visible.

## D Role and language together
Reuse E's profile-aware translation engine with an explicit output-language
selection for each recipient. Supported demo choices: English (default), Korean
and Chinese. Source can be in any of these languages; no separate source-language
selector is necessary. Translate perspective and language in the same generation.
Each result and its clarification questions use the selected recipient language;
navigation, errors and controls remain English. Show the target language on each
result so a plain language translation cannot be mistaken for role adaptation.
The translation request and response retain an explicit recipient/language pairing.

Acceptance: the same source can produce role-specific English, Korean and Chinese
results; selected language reaches the AI prompt and is bound to the validated
recipient result; changing a target language invalidates its previous output.
Human review is still required to establish semantic and language quality.

## Architecture and limits
Retain Python 3.12+, FastAPI, plain JavaScript and Claude's structured-output API.
Keep reusable provider request/error handling independent of server/web. Keep
feature-specific prompts and result schemas explicit rather than one loose prompt
that changes shape. Retain the existing /api/translate behavior for E; D extends
it with validated per-recipient language settings defaulting to English. Add
explicit review, draft-improvement and thread-analysis endpoints.
Input lengths, conversation size, profile IDs, language codes and evidence IDs
are validated before showing results. Keep the existing 6,000-character message
limit; limit the demo thread to 20 messages and 12,000 total characters. New draft
and thread flows must use safe errors and timeouts just like translation.
Render generated content as text. Never expose credentials/provider payloads or
log message bodies. No database, authentication, remote participant messaging,
Slack connection, C/F/G features, feedback learning or automatic trigger detection.
No automatic claims that a user agrees, understands or intends something.

## Verification and completion
Automated tests stub AI calls and assert prompt context, complete profiles,
language bindings, empty findings, source evidence validation, refusal/truncation,
invalid payloads, size limits, API errors and confirmation-state logic. Do not
assert exact model prose. Check draft apply/restore, mode changes, input edits,
disabled/loading controls, stale responses and safe text rendering in the UI.
Real AI runs must exercise all four features and the supported target languages
before claiming the demo is ready to present. Browser review must cover desktop
and mobile, success and error states. Existing absent-key and unavailable-browser
limitations are unresolved prerequisites for those checks, not passing evidence.

The feature is complete when E/A/B/D are all runnable, their acceptance conditions
above are verified, and observed limits are reported. Performance/accuracy claims,
enterprise readiness and security certification remain outside this demo.
