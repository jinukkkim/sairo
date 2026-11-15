# Sairo — Seven-Minute Pitch and Q&A

## Seven-minute presentation

| Time | Section | Speaker notes / visual |
|---|---|---|
| 0:00–0:45 | Problem | “Done by Friday” can mean release, code completion, or approved design. Acknowledgement is not proof of shared understanding. Rework and delay are the problem hypotheses; we have not measured their frequency or cost. Show the ambiguous message. |
| 0:45–1:25 | Customer | Describe the initial hypothesis: cross-functional product teams working in chat, including teams with language or experience differences. State that the first segment and buyer remain to be validated. |
| 1:25–2:00 | Solution | Explain the flow: check a draft, compare role-aware rewrites with the original, inspect thread evidence, then ask participants a common question. Emphasize estimate versus confirmed response. |
| 2:00–4:45 | Live prototype demonstration | (1) Open Friday draft and Before sending; show owner, deadline, completion criteria, priority, and scope questions. (2) Show original and three recipient rewrites. (3) Open Friday payment conversation. (4) Run Thread check and open evidence links. (5) Use the local answer simulation to show different answers → “Confirmed disagreement” and matching answers → “Aligned”; leave a field unanswered to show “Unresolved.” Say aloud that this is prepared local data and a presenter simulation. |
| 4:45–5:25 | Technology and differentiation | Planned approach: profile-conditioned prompts, structured findings grounded in message IDs, and human confirmation. The live provider path is not enabled in this demo. Distinguish the concept from writing help, meeting summaries, and tools that check against recorded decisions; competitor coverage requires fresh validation. |
| 5:25–6:10 | Business model and market | Present per-seat or team subscription as pricing hypotheses only. Name model/API cost, privacy, and buyer validation as open work. Do not state a market size or price without sourced, current evidence. |
| 6:10–6:45 | Validation and roadmap | First test comprehension and the problem with structured sessions and interviews; next validate feasibility and security; then consider a limited pilot. No participant sessions or accuracy metrics are claimed yet. |
| 6:45–7:00 | Team and close | Confirm team names and roles before delivery. Close: “Sairo helps teams make sure they mean the same thing before work moves forward.” |

## Expected questions

1. **Why not use ChatGPT directly?**
   A general chat can rewrite a message when prompted. Sairo’s product hypothesis is a repeatable team workflow with recipient profiles, original-linked evidence, and an explicit confirmation step. The prototype does not yet prove that teams prefer or need a separate product; we plan to test that.

2. **How is Sairo different from Slack AI?**
   Sairo focuses on role-aware rewrites and comparing participant understanding with human confirmation. Slack’s capabilities and product surface change, so we need a current feature-by-feature comparison before making a definitive claim. The present demo is not a Slack app.

3. **How do you prevent AI hallucinations?**
   We cannot promise that a model never hallucinates. The intended controls are source-linked evidence, preserving the original, clear uncertainty labels, structured validation, and requiring participant responses before marking a disagreement confirmed. The current demo uses prepared data; live quality has not been evaluated.

4. **Can companies trust Sairo with sensitive messages?**
   There is no production integration or security certification today. Before a pilot, we would define data minimization and retention, review platform terms and provider data handling, document access controls, and undergo customer security review. We will not claim message privacy controls that are not implemented.

5. **How will Sairo generate revenue?**
   Per-seat subscription and team pricing are hypotheses. We need interviews and pilots to identify the buyer, willingness to pay, usage, and the cost of model and infrastructure before choosing pricing.

6. **Does the demo use a live AI model?**
   No. App actions return prepared local results after a simulated delay. Provider code is retained for possible future work but is not called by this server.

7. **Are the people’s answers real?**
   No. The Friday scenario and response controls are illustrative local data. A real product would need an explicit response from each participant; an AI estimate alone would stay a potential misunderstanding.

8. **What if everyone chooses the same answer?**
   The result is “Aligned” on that question. It does not prove agreement on every detail, so the question and its scope remain visible.

9. **What is your market size and customer evidence?**
   We have not established a market-size estimate or completed customer validation. Both are to be validated with a defined segment, reliable external market sources, and structured discovery.

10. **What is the biggest risk?**
    That the problem is too infrequent or can be solved by existing tools and team habits. We will test recent incidents, workarounds, frequency, impact, and willingness to try a solution before building a production integration.

## Presenter checklist

- State “prepared local demo” before and during the demonstration.
- Keep original messages and evidence links visible.
- Use the local answer simulation only as an interaction example.
- Confirm final team names, roles, eligibility, and contest submission requirements before recording.
- Replace no placeholder or unverified claim with an invented metric, customer, or market number.

