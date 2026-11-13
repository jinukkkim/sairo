# Tailored translation demo

## Intent and scope
Implement the agreed demo: one English message rewritten for three fixed recipients,
using their team, role, seniority and knowledge of other disciplines. English is the
default for the UI, examples and generated results. Only tailored translation is included.

## Approach
Use Python 3.12+, FastAPI and plain HTML/CSS/JavaScript. A standalone Python core
calls Claude's Messages API with structured JSON output. This keeps the demo small
and allows later planning to change the UI without coupling translation to it.
A Slack integration would require setup unrelated to proving translation; a full
frontend framework adds machinery before the detailed specification arrives.
These implementation choices are builder decisions; the feature scope was agreed
in conversation before the user requested implementation.

## Behavior
One editable message is translated in one API call for a senior product manager,
a junior frontend developer and a mid-level designer. Profiles explicitly separate
seniority from cross-discipline knowledge. Each result has a rewrite and a list of
information not supplied by the original. The AI must preserve facts, uncertainty,
dates and intent and must not invent commitments, estimates or tasks.
Original text remains visible alongside the results. Generated content renders as
plain text. Input is trimmed and limited to 6,000 characters; blank input is rejected.
Failures display actionable English errors without provider payloads or secrets.

## Boundaries
Real AI calls, hardcoded profiles, no authentication, database, persistence, Slack,
thread analysis, pre-send review, feedback learning or language selector. Bind locally.
The prompt discourages invention; this is not a factual guarantee.

## UI direction
A quiet blue and white communication workspace, navy text, blue actions and teal
recipient markers. System sans-serif typography; a wide source editor followed by
three readable recipient columns, stacking on mobile. No external font or asset calls.

## Verification
pytest covers profiles, prompt grounding, JSON validation, recipient completeness,
provider failures, input validation and API behavior with the AI transport stubbed.
Browser checks cover editing, loading, success, failure and mobile layout if available.
A real generation requires an ANTHROPIC_API_KEY and is reported separately.
