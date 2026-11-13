# Chat-first workspace

User request: make the existing virtual chat behave like a normal messenger. Typing
and sending is the primary flow. Each message has an action that rewrites it in
language understandable to the current viewer. Do not name the reference product
in the interface. English UI remains the repository convention.

## Approach and design
Extend the existing vanilla JS workspace and real translation endpoint. A standalone
messenger or new framework adds unnecessary infrastructure; keeping the existing
feature form as the main view fails the requested chat-first flow.

Use a full-height shell: narrow workspace rail, channel/people sidebar, white chat
column and an optional detail panel. Existing blue identity, cool gray borders and
system sans type; compact left-aligned messages with colored initial avatars.
Default view contains only chat. Composer is empty on first load. Each message's
“Help me understand” action runs real role adaptation for the selected viewer and
shows the explanation inline with the original retained. Language is selectable.
Retain the four existing AI workflows in an optional Clarity tools panel. Add
search, thread replies, reaction toggles and saved messages as local interactions.

## Boundaries and checks
No external participants, auth, persistence or database. A single workspace notice
explains local data and refresh reset. Samples and live AI results remain distinct.
Never show invented AI explanations. Keep provider errors actionable inline.
Translation responses belong to the original conversation/message/viewer/language;
edits or deletion cannot resurrect a stale explanation. Thread replies have their
own input and never silently replace the conversation used for AI checks.
Check desktop/mobile, keyboard entry including IME, message and reply limits,
conversation isolation, hostile text rendering and existing AI invalidation tests.
