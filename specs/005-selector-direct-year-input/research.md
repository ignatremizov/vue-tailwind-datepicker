# Research: Selector Direct Year Input

## Decision 1: Rollout and Backward Compatibility

- Decision: Gate direct year typing behind `directYearInput` (default off).
- Rationale: Preserves current selector behavior for existing consumers and aligns with constitution backward-compatibility requirements.
- Alternatives considered:
  - Always-on direct typing: rejected due to upgrade regression risk.

## Decision 2: Input Availability Scope

- Decision: Enable direct year input only in selector mode entered from header toggle flow.
- Rationale: Matches feature scope and avoids introducing text input behavior into non-selector navigation states.
- Alternatives considered:
  - Allow typing in all picker contexts: rejected as out-of-scope and higher-risk UX expansion.

## Decision 3: Signed Token Normalization Pipeline

- Decision: Normalize input by trimming whitespace, preserving one optional leading `-`, and sanitizing remaining content to digits before validation.
- Rationale: Provides deterministic parsing for keyboard typing and pasted content while preserving intended negative-year semantics.
- Alternatives considered:
  - Reject any mixed content without sanitization: rejected due to poor paste ergonomics.
  - Strip minus signs entirely: rejected because it breaks BCE-style year entry.

## Decision 4: Year Validity Domain and Mode Flags

- Decision: Accept only signed integer tokens in `-99999..99999` with one to five digits (after optional leading `-`), and apply `yearNumberingMode` for year `0` validity.
- Rationale: Directly matches clarified requirements for signed range and historical/astronomical conventions.
- Alternatives considered:
  - Four-digit-only years: rejected because it excludes required short and extended year values.
  - Single fixed year-zero rule: rejected because mode-based behavior is explicitly required.

## Decision 5: Live Commit Semantics

- Decision: Treat each valid token as an immediate commit that updates selector navigation state, emits model update for active context, and advances the last-valid-year baseline.
- Rationale: Supports immediate zoom-and-set behavior and deterministic fallback targets for Escape/blur.
- Alternatives considered:
  - Commit only on Enter/Apply: rejected because it conflicts with live-update clarifications.

## Decision 6: Keyboard and Blur Resolution

- Decision:
  - Enter confirms current committed valid year and keeps selector open.
  - Escape reverts to last valid year.
  - Blur with invalid or partial token reverts to last valid year.
- Rationale: Removes ambiguity between transient text and committed year state.
- Alternatives considered:
  - Enter closes selector: rejected by clarified behavior.
  - Blur keeps invalid text: rejected because it leaves state unresolved.

## Decision 7: Range Context and Temporary Inversion

- Decision: In range mode, typed-year updates target active panel only; temporary inversion (`start > end`) is allowed during live typing.
- Rationale: Preserves panel-local intent during interaction and avoids disruptive corrections while user is still editing.
- Alternatives considered:
  - Auto-reject inversion on each keystroke: rejected as overly restrictive.
  - Auto-swap immediately on inversion: rejected due to context-jump risk.

## Decision 8: Normalization Boundaries for Inverted Ranges

- Decision: Normalize temporary inversion only at explicit persist boundaries (Apply or close-with-persist) by auto-swapping endpoints; do not normalize on Enter-in-place or cancel-like exits.
- Rationale: Keeps live typing fluid while preserving chronological output at save boundaries.
- Alternatives considered:
  - Normalize on every commit-like action including Enter: rejected because Enter is defined as in-place confirmation only.

## Decision 9: Year Wheel Re-Anchor Strategy

- Decision: Re-anchor/regenerate year-wheel window whenever a valid typed year falls outside the current visible window.
- Rationale: Ensures typed target year remains represented in scroll UI and keeps typed and wheel interactions synchronized.
- Alternatives considered:
  - Keep window static and allow desync: rejected due to inconsistent selector state.

## Risks and Mitigations

- Risk: Ambiguity between raw typed text and committed value during rapid edits.
  - Mitigation: Separate raw token state from committed year and persist a last-valid baseline.
- Risk: Regression in range chronology handling.
  - Mitigation: Centralize commit-boundary normalization policy and test Apply/close/cancel/Enter boundaries explicitly.
- Risk: Re-anchor churn for far-year typing.
  - Mitigation: Re-anchor only when valid token exits the current window and keep window generation bounded.
