# Sairo

Sairo demonstrates how a Checkout team can compare perspectives before a message
becomes rework. All AI interactions in this version use prepared local results
with a short simulated loading state. No API key, model access or external AI
request is needed, even if credentials are present in your environment.
The workspace opens as a chat: choose a channel or direct conversation, type a
message, and press Enter to send (Shift + Enter inserts a new line). Messages,
thread replies, reactions, saved messages and search work locally.

Use **Current viewer** at the bottom of the sidebar to switch among the three people in the same room:
Alex and Sam receive simplified English; Jamie receives simplified text translated
into Korean. Language follows the participant automatically. Click **Simplify for
me** in an English view or **Simplify + translate** in Jamie's view to show the
prepared version below the original English message. Your own messages and
replies have no conversion button.

Rewrites keep the original speaker’s voice, questions and intent. They use simpler
words or a natural translation, with no role preface, reviewer narration or added
advice. Switching preserves the conversation and expanded-message context,
including when passing through the author’s original-only view. Unsent chat messages and thread
replies are kept separately for each person. Results stay bound to their original
source, person and language; edits discard old explanations. New or edited text
gets a demo notice rather than an unrelated explanation. The original is never
overwritten.

**Clarity tools** opens the four prepared demonstration workflows in a side panel.
**Check before sending** copies the current composer text into the draft review;
**Use draft in composer** explicitly brings an edited draft back without sending.
The workspace uses three fixed recipient profiles:
Alex (senior product manager), Jamie (junior frontend developer), and Sam (mid-level
designer). Expand each profile to see seniority, team and cross-discipline knowledge.

- **Tailored translation (E):** preview a prepared rewrite for each recipient's
  role and knowledge, using the fixed participant languages.
- **Before sending (A):** preview prepared questions and relevant gaps in screen/scope,
  conditions, deadline and priority. Complete drafts can have no findings. Optionally
  choose **Improve draft**, compare the proposal with the original, then
  explicitly **Apply draft** or **Restore original draft**. Applying never sends it.
- **Thread check (B):** inspect prepared results for an attributed sample. Possible
  interpretations and candidate disagreements link to source message IDs. Try the
  conflicting and aligned samples; no disagreements is a valid result. The labeled
  **local participant-response simulation** accepts presenter inputs to a common
  question. Only different explicit answers confirm a discrepancy in the simulation;
  matching answers indicate alignment on that question, and pending/unsure stay
  unresolved. These are never real teammate responses.
- **Role + language (D):** preview prepared role and language versions together.
  Alex and Sam use English; Jamie uses Korean. These are fixed bindings, also
  preserved when loading an Inbox source. Prepared source messages are English.

## Run locally

Requires Python 3.12+ and [uv](https://docs.astral.sh/uv/).

```sh
uv sync
```

Start the local demo server. No `.env` setup is required:

```sh
uv run uvicorn server.app:app --host 127.0.0.1 --port 8000 --reload
```

Open [localhost:8000](http://localhost:8000). Chat normally, switch **Current viewer**, then
use a message's simplify button, or open **Clarity tools** to review a draft or thread.
Edits, conversation/mode changes and participant switches invalidate earlier
results and clear simulated confirmations. Late responses cannot replace current
results. Each successful AI run enters the session Clarity Inbox with its original
input snapshot; opening an Inbox item does not automatically preview a result or apply text.

The local analysis endpoints return prepared results after a 0.7 second delay.
Use the seeded messages, **Use example**, **Conflicting sample** and **Aligned
sample** for the complete demonstration. Prepared results cover 16 source texts,
three viewer roles with English/Korean output, two drafts and four threads.

Prepared findings bind to exact source text or thread snapshots. New/edited
messages get a localized demo notice; unknown drafts are explicitly not reviewed,
and their improvement keeps the original unchanged. Edited threads show an
insufficient-evidence notice and no prepared candidates. This version does not
analyze arbitrary content. Loading, cancellation, source invalidation, optional
apply/restore and local participant-answer simulation still work.

The running server does not dispatch to the OpenAI provider boundary and
does not load `.env`. `core/ai.py` and its provider tests are retained for a future
live integration, which requires a new explicit request. `OPENAI_API_KEY` and
`OPENAI_MODEL` in `.env.example` are inactive placeholders for that future work.

## Demo data and limits

The group and 1:1 conversations, profiles and seeded Inbox entries are fixed English
demo data. **Send message** appends only in browser memory; no teammate receives
anything. Sample Inbox findings are clearly labeled **Sample data**, separate from
**Demo result** entries opened during the current session; neither is live AI. The Inbox is an author-workflow
demonstration with no access-control claim. Refresh resets conversations, replies,
reactions, saved messages, drafts,
Inbox results, explanations and simulation answers. Thread checks match prepared top-level message snapshots; reply explanations
only work for prepared source text.
Local chat has a 20-message / 12,000-character limit per conversation; each message
and reply supports up to 6,000 characters and each thread holds up to 20 replies.

Drafts are limited to 6,000 characters. Thread analysis accepts 2–20 attributed
messages with unique IDs, known profiles, at most 6,000 characters per message and
12,000 in total. API inputs and AI outputs are validated, including recipient/language
pairings and evidence references. Generated text is rendered as text. No-store
headers cover API responses, including validation errors.

There is no authentication, database, persistent messaging, realtime infrastructure,
Supabase, Slack connection, automatic thread-ending detection or automatic agreement
claim. Keep the server on localhost. AI may still misunderstand or invent information;
compare results with their originals. Human review is needed for language quality.

## Verify

```sh
uv run pytest -q
node --test tests/*.mjs
node --check web/app.js
node --check web/state.mjs
node --check web/demo.mjs
node --check web/chat.mjs
```

Core tests stub the retained provider; demo-route tests forbid external HTTP
with and without credentials. Tests cover input limits, prompt context, complete recipient
results, language bindings, empty findings, evidence validation, malformed/refused/
truncated responses, safe provider errors, uncached API responses, four-mode assets,
draft apply/restore, stale callbacks, per-message explanation binding and
invalidation, local reply/reaction/save isolation, chat draft isolation, metadata
exclusion from API inputs and local confirmation logic. Fixture coverage checks keep every seeded message/draft and thread aligned with
the prepared data. These tests do not establish the quality of a future live model.

## Structure

- `core/ai.py`: shared provider call, compatible structured schema and safe errors.
- `core/translation.py`: fixed profiles, typed feature inputs/results, grounded prompts
  and recipient/language/evidence validation; independent of server and web.
- `server/demo.py` and `server/demo-results.json`: prepared results and simulated loading.
- `server/app.py`: local-only FastAPI routes (`/api/profiles`, `/api/translate`, `/api/review`,
  `/api/improve`, `/api/thread-check`) without provider dispatch.
- `web/`: English interface, fixed demo content and in-memory session state.
- `tests/`: pytest and native Node tests without external AI calls.
