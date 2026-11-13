# Participant views in one conversation

User request: switch among three participants in the same room. Two English users
get simplified English; one Korean user also gets Korean translation. Retain the
prepared-result demo and make no external AI calls.

## Design
Use the existing shared conversation and explanation cache. Add three visible
participant buttons above the message tabs. Builder assignment: Alex and Sam use
English; Jamie uses Korean. Show selected person and fixed language (role remains available in the profile and tooltip); replace
the independent chat language selector with a read-only treatment label.

Switching people preserves shared messages, replies, room and open explanation
context. Open explanations are shown/retrieved for the newly selected role and its
fixed language. Original English remains above every explanation. Chat composer
and unsent thread replies stay separate per person. Local sends use the selected
author. Fixed participant language bindings also apply to the optional role/language
tools and cannot be overwritten by loading an older Inbox snapshot.

Extend the existing HTML/CSS/JS and seeded fixtures, no new infrastructure or
separate rooms. A second independent language menu would allow inconsistent
person/language combinations; separate workspaces would stop demonstrating the same
conversation. Keep accessible pressed states, focus and responsive three-button UI.

## Verification
Test fixed en/ko/en mapping, same-thread switching, derived explanation request
language/role, draft isolation, shared sent messages and snapshot language policy.
Retain no-external-network tests and source-bound cache/stale-response tests.
Review desktop and narrow-screen participant switching in the browser.
