// Fixed demo content. No participant messages or sample findings are live data.
export const participantLanguages = Object.freeze({manager: 'en', frontend: 'ko', designer: 'en'});
export const exampleDraft = 'Checkout feels slow. Let’s simplify the flow and show better error states before the release. We still need to agree on the affected screens, failure conditions and timing.';
export const conflictingThread = [
    {"id": "m1", "profile_id": "manager", "text": "For the release, let’s simplify all checkout screens."},
    {"id": "m2", "profile_id": "frontend", "text": "I’m planning changes to the payment screen only. The API will stay the same."},
    {"id": "m3", "profile_id": "designer", "text": "My draft covers cart, address and payment. Are all three in scope?"},
    {"id": "m4", "profile_id": "manager", "text": "Good question. Let’s settle the scope here before anyone starts building. Jamie, what would keep the implementation manageable?", "reactions": {"👍": ["frontend", "designer"]}},
    {"id": "m5", "profile_id": "frontend", "text": "Payment first would help. We can keep the existing API contract and handle the failed-payment state in the UI.", "reactions": {"👀": ["manager"]}},
    {"id": "m6", "profile_id": "designer", "text": "I’ll start with the payment states then. One open question: do we keep the form values after a failed attempt?"}
];
export const conversations = {
  checkout: {title: 'Checkout team', channel: 'team-checkout', topic: 'Payment waiting states, safe retries, and experiment measurement.', kind: 'Group demo', draft: exampleDraft, messages: [
    {"id": "m1", "profile_id": "manager", "text": "We’re seeing a lot of drop-off between clicking Pay and getting a response. I’d like to test whether making the waiting state clearer improves purchase conversion.", "time": "2026-11-13T09:41:00+09:00"},
    {"id": "m3", "profile_id": "designer", "text": "Right now the button just shows a spinner, so it’s hard to tell whether payment is progressing or stuck. How about a non-modal inline status below the button? Since we can’t calculate a percentage, I’d use indeterminate progress.", "time": "2026-11-13T09:43:00+09:00"},
    {"id": "m2", "profile_id": "frontend", "text": "That works. One thing, though: a gateway timeout doesn’t mean the payment failed. The payment processor may have approved it even if the response was lost, so I’ll keep the state machine in pending rather than transition it to failed.", "time": "2026-11-13T09:45:00+09:00"},
    {"id": "m6", "profile_id": "designer", "text": "Then we shouldn’t send people to an error screen just because it’s taking a while. I’ll start with “Processing your payment” and switch to “Checking your payment status” after a timeout. No optimistic success UI for this flow, either.", "time": "2026-11-13T09:47:00+09:00"},
    {"id": "m4", "profile_id": "manager", "text": "What happens if someone refreshes or clicks Pay again while it’s pending? I don’t want the new UI to encourage retries that lead to duplicate charges.", "time": "2026-11-13T09:49:00+09:00"},
    {"id": "m5", "profile_id": "frontend", "text": "I’ll reuse the same idempotency key for retries of the same payment attempt. On refresh, I’ll restore the state using the existing payment ID. Payment-processor webhooks can arrive more than once, so I’ll dedup by event_id before applying them to the payment state.", "reactions": {"👍": ["manager", "designer"]}, "time": "2026-11-13T09:51:00+09:00"},
    {"id": "m7", "profile_id": "designer", "text": "Then please keep focus on the button while it’s pending and only block additional submissions. Announce the status copy through a polite live region. I’d rather not move focus on every update or have the screen reader keep announcing the spinner.", "time": "2026-11-13T09:53:00+09:00"},
    {"id": "m8", "profile_id": "frontend", "text": "Yep. I’ll use aria-disabled instead of native disabled and guard against re-entry in the submit handler. I’ll hide the spinner from the accessibility tree and announce only the status copy. After restoring the payment, I’ll poll with backoff and use the server-verified processor status as the source of truth.", "time": "2026-11-13T09:55:00+09:00"},
    {"id": "m9", "profile_id": "manager", "text": "Let’s apply idempotency and state restoration to the control group too. Only the waiting-state presentation should differ in this experiment so we can isolate its effect.", "reactions": {"✅": ["frontend", "designer"]}, "time": "2026-11-13T09:57:00+09:00"},
    {"id": "m10", "profile_id": "designer", "text": "Sounds good. I’ll change only the progress indicator and status copy in the treatment, keeping the button placement and visual hierarchy intact. I’ll expose the error state and retry action only after failure is confirmed.", "time": "2026-11-13T09:59:00+09:00"},
    {"id": "m11", "profile_id": "manager", "text": "Please use user-level sticky assignment rather than session-level assignment. The primary metric is purchase CVR among checkout entrants, with AOV and duplicate authorization rate as guardrails.", "time": "2026-11-13T10:01:00+09:00"},
    {"id": "m12", "profile_id": "frontend", "text": "Then I’ll count conversions from the server-side payment-confirmed event, not the success-screen impression. That way an approved payment won’t be missed just because someone closed the browser.", "time": "2026-11-13T10:03:00+09:00"},
    {"id": "m13", "profile_id": "manager", "text": "Yes, let’s use that. I’ll size the sample for a 3% relative MDE. We won’t stop early just because the interim results look good, and if we detect SRM, we’ll hold off on interpreting uplift until we understand the cause.", "reactions": {"👍": ["frontend", "designer"]}, "time": "2026-11-13T10:05:00+09:00"}]},
  product: {title: 'Product updates', channel: 'product-updates', topic: 'Checkout experiment updates and decisions.', kind: 'Group demo', draft: exampleDraft, messages: [
    {"id": "p1", "profile_id": "manager", "text": "We’ve agreed on the payment waiting-state experiment in #team-checkout. Only the waiting-state UI will differ between groups; duplicate-payment protection and state recovery will be shared.", "time": "2026-11-13T10:12:00+09:00"},
    {"id": "p2", "profile_id": "frontend", "text": "Got it. I’ll keep the shared payment handling the same in both groups and count purchases from server-confirmed payments.", "time": "2026-11-13T10:14:00+09:00"}]},
  design: {title: 'Alex + Sam', kind: '1:1 demo', draft: exampleDraft, messages: [
    {"id": "d1", "profile_id": "manager", "text": "Sam, can you share the inline waiting-state mockup when it’s ready? Let’s keep the button placement unchanged.", "time": "2026-11-13T10:08:00+09:00"},
    {"id": "d2", "profile_id": "designer", "text": "Will do. I’ll include the processing, checking and confirmed-failure states, with the retry action shown only after failure is confirmed.", "time": "2026-11-13T10:09:00+09:00"}]}
};
export const alignedThread = [
  {id: 'a1', profile_id: 'manager', text: 'Only the payment screen is in scope. Keep cart and address unchanged.'},
  {id: 'a2', profile_id: 'frontend', text: 'Agreed: payment only, with no changes to cart or address.'},
  {id: 'a3', profile_id: 'designer', text: 'My mockups match: payment only. Cart and address stay unchanged.'}
];
export const fridayThread = [
  {id: 'f1', profile_id: 'manager', text: 'Let’s have the payment feature done by Friday.'},
  {id: 'f2', profile_id: 'frontend', text: 'I understand Friday as the deadline for finishing the code. What acceptance criteria should I use?'},
  {id: 'f3', profile_id: 'designer', text: 'I read Friday as the date to finalize the screen design. Which screens are included?'}
];
conversations.friday = {title: 'Friday payment launch', channel: 'friday-payment-launch', topic: 'A prepared example of how “done by Friday” can mean different deliverables.', kind: 'Group demo', draft: 'Let’s have the payment feature done by Friday.', messages: fridayThread};
export const sampleInbox = [
  {id: 'sample-review', title: 'Checkout draft has open questions', provenance: 'sample', kind: 'review',
   snapshot: {mode: 'A', conversation: 'checkout', message: exampleDraft, target_languages: participantLanguages},
   data: {reviews: [
     {profile_id: 'manager', likely_questions: ['Which release and what is the priority?'], missing_information: [{category: 'deadline', question: 'When is the review needed?'}]},
     {profile_id: 'frontend', likely_questions: ['Which failures need a new state?'], missing_information: [{category: 'conditions', question: 'Which API failures should trigger the error state?'}]},
     {profile_id: 'designer', likely_questions: ['Which screens are included?'], missing_information: [{category: 'scope', question: 'Does this include cart, address and payment?'}]}
   ]}},
  {id: 'sample-thread', title: 'Payment waiting-state experiment aligned', provenance: 'sample', kind: 'thread-check',
   snapshot: {mode: 'B', conversation: 'checkout', messages: conversations.checkout.messages},
   data: {
  "interpretations": [
    {
      "profile_id": "manager",
      "understanding": "Test only the payment waiting-state presentation. Keep duplicate-request protection and state recovery in both groups, use persistent user-level assignment and server-confirmed purchases, monitor guardrails, and investigate allocation imbalance before interpreting improvement.",
      "insufficient_evidence": false,
      "source_message_ids": [
        "m1",
        "m9",
        "m11",
        "m13"
      ]
    },
    {
      "profile_id": "frontend",
      "understanding": "A timeout leaves payment pending. Reuse the payment attempt’s idempotency key, restore its existing state, deduplicate processor events, preserve accessibility and verify the processor status on the server. Count purchases from server payment confirmation.",
      "insufficient_evidence": false,
      "source_message_ids": [
        "m2",
        "m5",
        "m8",
        "m12"
      ]
    },
    {
      "profile_id": "designer",
      "understanding": "Use an inline indeterminate waiting state with status copy and no premature success. Preserve keyboard focus, announce status updates politely, keep button placement and visual hierarchy, and show retry only after confirmed failure.",
      "insufficient_evidence": false,
      "source_message_ids": [
        "m3",
        "m6",
        "m7",
        "m10"
      ]
    }
  ],
  "disagreements": []
}}
  ,{id: 'sample-friday', title: 'Friday payment feature: what does “done” mean?', provenance: 'sample', kind: 'thread-check',
   snapshot: {mode: 'B', conversation: 'friday', messages: fridayThread},
   data: {interpretations: [
     {profile_id: 'manager', understanding: 'The payment feature should be available to users by Friday.', insufficient_evidence: false, source_message_ids: ['f1']},
     {profile_id: 'frontend', understanding: 'The code work is expected to be finished by Friday; acceptance criteria are still unclear.', insufficient_evidence: false, source_message_ids: ['f2']},
     {profile_id: 'designer', understanding: 'The screen design is expected to be finalized by Friday; screen scope is still unclear.', insufficient_evidence: false, source_message_ids: ['f3']}
   ], disagreements: [{id: 'friday-completion', topic: 'Meaning of “done by Friday”', profile_ids: ['manager', 'frontend', 'designer'], source_message_ids: ['f1', 'f2', 'f3'], question: 'What deliverable do you understand should be complete by Friday?', choices: ['Payment feature available to users', 'Payment code complete', 'Payment screen design finalized']} ]}}
];

