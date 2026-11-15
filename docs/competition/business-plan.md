# Sairo — Business Plan Draft

**Soul Mate Pioneers | Working draft | 15 November 2026**

All market, customer, performance, pricing, and team claims that have not been verified are marked **To be validated**. This draft describes the current local prototype separately from the proposed product.

## 1. Problem

People in different roles can read the same short workplace message as different commitments. “Let’s have the payment feature done by Friday” can mean a customer release to a product manager, code completion to an engineer, or approved screens to a designer. A thumbs-up or “got it” does not prove that the team shares the same completion criteria.

The cost can include clarification meetings, rework, missed handoffs, and delays. The team has not yet measured how often this happens or its financial impact. **To be validated:** frequency, cost, and urgency through interviews about recent real incidents.

## 2. Target Customers

The initial hypothesis is product teams where product, design, and engineering work together in chat, especially early-stage companies and teams coordinating across language or experience differences. Likely users are individual contributors and team leads; a buyer may be a founder, product leader, or operations lead.

**To be validated:** the first segment, preferred collaboration platform, buyer, purchasing process, and whether cross-language teams have a stronger need than single-language teams.

## 3. Solution

Sairo is designed as a communication layer that helps a team compare understanding around a message or thread:

1. Before sending, surface recipient-specific questions and information gaps.
2. Show a role- and knowledge-aware rewrite alongside the unchanged original.
3. After a conversation, summarize possible interpretations with links to source messages.
4. Ask participants the same clarification question and distinguish a possible mismatch from a difference confirmed by participant answers.

The current browser prototype uses prepared local results and simulated participant answers. It does not call an AI service or send messages to teammates.

## 4. Key Differentiation

Sairo’s product hypothesis is to connect two stages: prevent ambiguity before a message is sent, then help a team verify understanding after discussion. Role-aware rewrites use recipient role, seniority, and cross-discipline knowledge. The thread-check concept compares how people may understand a conversation, rather than checking only against a stored decision.

This positioning is a hypothesis based on the team’s desk research, not a complete or current competitive audit. Existing products cover adjacent areas such as writing assistance, meeting summaries, and decision tracking. **To be validated:** competitor feature coverage, customer preference, and whether Sairo’s combined workflow is distinct enough to adopt.

## 5. AI Technology

The planned approach is to use a general-purpose language model with explicit recipient profiles, structured outputs, and message-grounded evidence references. A model may propose a mismatch; participant responses are required before calling it a confirmed disagreement. The product should show the original beside every rewrite, preserve uncertainty, and avoid adding unsupported dates, costs, or commitments.

The repository retains provider code and tests for possible future work. The running demo does not use that provider path. **To be validated:** model selection, response quality, latency, unit cost, evaluation method, privacy terms, and reliability on real team conversations.

## 6. Prototype and Current Development Status

The local web demo currently includes fixed Alex, Jamie, and Sam profiles; in-memory chat interactions; prepared tailored translations; a prepared before-sending review and optional draft proposal; prepared thread interpretations and evidence links; and an explicitly labeled local answer simulation. The simulation is illustrative and does not represent actual participant responses. Refresh clears session activity.

Not implemented: live AI calls, Slack or other messenger integration, authentication, persistent storage, realtime collaboration, real participant confirmation, billing, or production security controls. No measured model accuracy or customer validation is claimed.

## 7. Competitive Landscape

The team’s preliminary research identifies adjacent categories: writing and tone assistants, built-in collaboration-platform AI, meeting transcription and summaries, requirement-quality tools, and products that compare new work with recorded decisions. Sairo’s intended focus is role-aware interpretation plus explicit human confirmation in the same communication workflow.

The research file itself notes gaps in market coverage and verification. **To be validated:** current product capabilities, platform policies, direct and indirect competitors, willingness to switch, and the durability of this distinction.

## 8. Business Model

Initial pricing hypotheses are a per-seat subscription or a team plan, potentially preceded by a limited trial. A future product might be distributed through a collaboration-platform marketplace and direct team sales. No price, conversion rate, or revenue is established.

**To be validated:** buyer and budget, willingness to pay, gross margin after model and infrastructure costs, usage limits, sales cycle, and whether the value supports a paid product.

## 9. Validation and Roadmap

- **Now — prototype comprehension:** run structured usability sessions and record task success, time, misunderstandings, and suggested changes. No sessions or outcomes are claimed in this draft.
- **Next — problem discovery:** interview at least 20 people across product, design, and engineering roles about recent incidents, current workarounds, and measurable impact. This is a proposed target, not completed research.
- **Then — feasibility and pilot:** only after problem evidence, validate platform permissions, privacy and data handling, model quality, and unit economics; recruit design-partner teams for a time-limited pilot.
- **Later — productization:** consider integration, persistence, security review, and paid distribution only after the earlier gates are met.

**To be validated:** all roadmap dates, evaluation criteria, access to pilot teams, and the technical and legal feasibility of any integration.

## 10. Team and Vision

The planning document describes a two-person student team; names, roles, availability, and institutional eligibility must be confirmed before submission. **To be validated:** final team biographies and role allocation.

The vision is to make cross-functional communication more precise while keeping people in control: show what was said, make uncertainty visible, and let participants establish shared understanding before work proceeds.

