# OpenAI provider migration

The user requested replacing AI calls with OpenAI and selecting a suitable model.
All existing chat and E/A/B/D behavior, input/output contracts and local validation
remain intact. There is no need for UI or workflow changes.

## Approach
Use the existing httpx client to call OpenAI Responses API with strict JSON Schema.
An SDK would add a dependency to replace one HTTP call. A multi-provider router is
unnecessary because the user asked for replacement. No Anthropic fallback.

Default model: gpt-6-luna, reasoning effort low. Builder choice for short, frequent
message adaptation; multilingual quality and account access remain unverified until
live runs. OPENAI_MODEL allows explicit model selection. OPENAI_API_KEY is read
server-side from the existing local .env workflow; never expose or commit keys.

## Provider boundary
POST https://api.openai.com/v1/responses with Bearer authentication, store=false,
instructions, user input, max_output_tokens=6000 and text.format json_schema strict.
Make all object properties required and disallow extras recursively, including
fields with Pydantic defaults. Keep current conservative schema constraint removal;
Pydantic and semantic recipient/language/evidence checks still validate results.
Accept a completed assistant message containing one output_text JSON block, allowing
preceding reasoning items. Reject refusals, incomplete/failed responses, malformed
or ambiguous output and unexpected tools. Preserve safe access, quota, timeout and
network errors; explain missing keys and unavailable model access.

## Verification
Stub provider transport in tests. Exercise all four workflows, strict schemas,
reasoning output, refusals, partial/invalid bodies, credential/model routing and
no-store API responses. Retain all JS state tests. No real request without a key;
absence of credentials is an unverified live test, never a success claim.

Sources checked 2026-11-12:
- https://developers.openai.com/api/docs/models/gpt-6-luna
- https://developers.openai.com/api/docs/guides/structured-outputs
- https://developers.openai.com/api/reference/resources/responses/methods/create
