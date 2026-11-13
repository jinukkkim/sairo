// Fixed demo content. No participant messages or sample findings are live data.
export const participantLanguages = Object.freeze({manager: 'en', frontend: 'ko', designer: 'en'});
export const exampleDraft = 'Checkout feels slow. Let’s simplify the flow and show better error states before the release. We still need to agree on the affected screens, failure conditions and timing.';
export const conversations = {
  checkout: {title: 'Checkout team', channel: 'team-checkout', topic: 'Scope, screens, and all the small details in between.', kind: 'Group demo', draft: exampleDraft, messages: [
    {id: 'm1', profile_id: 'manager', text: 'For the release, let’s simplify all checkout screens.'},
    {id: 'm2', profile_id: 'frontend', text: 'I’m planning changes to the payment screen only. The API will stay the same.'},
    {id: 'm3', profile_id: 'designer', text: 'My draft covers cart, address and payment. Are all three in scope?'},
    {id: 'm4', profile_id: 'manager', text: 'Good question. Let’s settle the scope here before anyone starts building. Jamie, what would keep the implementation manageable?', reactions: {'👍': ['frontend', 'designer']}},
    {id: 'm5', profile_id: 'frontend', text: 'Payment first would help. We can keep the existing API contract and handle the failed-payment state in the UI.', reactions: {'👀': ['manager']}},
    {id: 'm6', profile_id: 'designer', text: 'I’ll start with the payment states then. One open question: do we keep the form values after a failed attempt?'}]},
  product: {title: 'Product updates', channel: 'product-updates', topic: 'Decisions, small wins, and what comes next.', kind: 'Group demo', draft: exampleDraft, messages: [
    {id: 'p1', profile_id: 'manager', text: 'A quick home for decisions and progress. Bring the discussion to #team-checkout; share the outcome here.'},
    {id: 'p2', profile_id: 'designer', text: 'The updated component library is ready for review. Error, loading and empty states are included.', reactions: {'✅': ['manager', 'frontend']}},
    {id: 'p3', profile_id: 'frontend', text: 'Thanks! I’ll use these states for the next checkout iteration.'}]},
  design: {title: 'Alex + Sam', kind: '1:1 demo', draft: 'For payment errors, show an inline retry message. Cart and address are out of scope. Please prioritize the mockup for review on Friday; implementation timing is not agreed.', messages: [
    {id: 'd1', profile_id: 'manager', text: 'For this review, payment is the only screen in scope. Cart and address can wait.'},
    {id: 'd2', profile_id: 'designer', text: 'Agreed: payment only. I’ll show inline retry messages for failed payments, with cart and address unchanged.'}]}
};
export const alignedThread = [
  {id: 'a1', profile_id: 'manager', text: 'Only the payment screen is in scope. Keep cart and address unchanged.'},
  {id: 'a2', profile_id: 'frontend', text: 'Agreed: payment only, with no changes to cart or address.'},
  {id: 'a3', profile_id: 'designer', text: 'My mockups match: payment only. Cart and address stay unchanged.'}
];
export const sampleInbox = [
  {id: 'sample-review', title: 'Checkout draft has open questions', provenance: 'sample', kind: 'review',
   snapshot: {mode: 'A', conversation: 'checkout', message: exampleDraft, target_languages: participantLanguages},
   data: {reviews: [
     {profile_id: 'manager', likely_questions: ['Which release and what is the priority?'], missing_information: [{category: 'deadline', question: 'When is the review needed?'}]},
     {profile_id: 'frontend', likely_questions: ['Which failures need a new state?'], missing_information: [{category: 'conditions', question: 'Which API failures should trigger the error state?'}]},
     {profile_id: 'designer', likely_questions: ['Which screens are included?'], missing_information: [{category: 'scope', question: 'Does this include cart, address and payment?'}]}
   ]}},
  {id: 'sample-thread', title: 'Checkout scope needs confirmation', provenance: 'sample', kind: 'thread-check',
   snapshot: {mode: 'B', conversation: 'checkout', messages: conversations.checkout.messages},
   data: {interpretations: [
     {profile_id: 'manager', understanding: 'All checkout screens may be included.', insufficient_evidence: false, source_message_ids: ['m1']},
     {profile_id: 'frontend', understanding: 'Payment only is planned.', insufficient_evidence: false, source_message_ids: ['m2']},
     {profile_id: 'designer', understanding: 'Cart, address and payment appear in the draft; scope is still a question.', insufficient_evidence: false, source_message_ids: ['m3']}
   ], disagreements: [{id: 'sample-c1', topic: 'Affected screens', profile_ids: ['manager', 'frontend'], source_message_ids: ['m1', 'm2'], question: 'Which screens should change for this release?', choices: ['All checkout screens', 'Payment only']}]}}
];
