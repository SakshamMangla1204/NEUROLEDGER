## Corrected Prototype Architecture

### Identity Layer

`User -> Frontend -> Simulated ABHA-Compatible Identity Layer -> Backend API`

The real ABHA integration is unavailable, so the backend stores mock identities locally with fields such as:

`name`
`dob`
`phone`
`abha_id`
`linked_reports`

### ML Insight Layer

`Wearable API / Manual Input -> Backend API -> ML Service`

Inside the ML service, the implemented sequence is:

`Input Features -> Normalization -> Baseline Context -> Cardio Engine -> Glucose Engine -> Fatigue Engine -> Trend Analysis -> Scoring Engine -> Guardrail Layer -> Risk Level + Recommendations`

### Report Integrity Layer

`Frontend -> Backend API -> Local Report Storage -> SHA-256 Hash`

For the current prototype, the hash is stored locally. Blockchain anchoring is intentionally left as a follow-up integration point.

### Combined Dashboard Layer

`Backend API -> combine patient identity + latest wearable snapshot + latest ML output + uploaded report metadata + integrity state -> Frontend`

### Blockchain Final Step

`Dashboard-ready authentic report -> hash verified -> blockchain finalization handoff`

The current prototype stores a simulated anchor record locally so the handoff point is explicit even before reconnecting the actual chain module.
