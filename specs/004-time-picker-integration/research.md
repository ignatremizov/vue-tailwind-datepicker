# Research: Integrated Time Selection for Date Picker

## Decision 1: Time Mode Rollout and Commit Semantics

- Decision: Use `timePickerStyle` as the feature switch (`none`, `input`, `wheel-inline`, `wheel-page`) and require explicit Apply for all non-`none` modes, even when `autoApply=true`.
- Rationale: Preserves date-only compatibility while preventing partial datetime commits.
- Alternatives considered:
  - Boolean `datetime` prop + separate display prop: rejected as redundant and drift-prone.

## Decision 2: Formatter Contract as Single Source of Truth

- Decision: Use `formatter.date` tokens as canonical parse/format contract for all time modes.
- Rationale: Keeps behavior deterministic and avoids dual-format conflicts.
- Alternatives considered:
  - Separate datetime format prop: rejected due to conflicting contracts.

## Decision 3: Valid Token Policy and Apply Guard

- Decision: Time-enabled mode requires supported time tokens in `formatter.date`; missing tokens block Apply.
- Rationale: Prevents silent date-only output in time-enabled flows.

## Decision 4: Default-Time Input Flexibility with Normalization

- Decision: Accept `defaultTime`/`defaultEndTime` in 12-hour or 24-hour forms and normalize internally to formatter contract.
- Rationale: Better consumer ergonomics with deterministic internals.

## Decision 5: Style-Aware Range Endpoint UX

- Decision: Range endpoint UI depends on style:
  - `input` in single-panel range: render both start/end inputs.
  - wheel styles in single-panel range: one active endpoint at a time using Start/End toggle.
- Rationale: Balances density, clarity, and wheel interaction ergonomics.

## Decision 6: Wheel Carry and Boundary Stability

- Decision: Deduplicate rapid boundary carry triggers (minute/second/hour/meridiem) using step signatures/direction hints and scoped debounce.
- Rationale: Prevents duplicate carry jumps under aggressive flicking.

## Decision 7: Error Lifecycle and Messaging

- Decision: Keep range-order errors visible until corrected, not cleared by endpoint toggles; use human-friendly copy with start time context.
- Rationale: Aligns user expectation with state validity and reduces confusion.

## Decision 8: Layout Locking and Open-State Reconfiguration

- Decision: Lock shell/panel dimensions in lockable modes and reset/re-measure on structural setting changes while open.
- Rationale: Prevents stale clipping/oversized render artifacts when switching styles/positions.

## Decision 9: Error Event Cadence

- Decision: Emit one structured `error` event per blocked Apply attempt; do not emit per keystroke.
- Rationale: Deterministic telemetry and low-noise integration behavior.

## Risks and Mitigations

- Risk: Mode-switch layout artifacts during open popover.
  - Mitigation: Explicit lock reset/re-measure watchers for style/position/range layout changes.
- Risk: Carry drift under rapid wheel oscillation.
  - Mitigation: Signature-based carry dedupe and deterministic endpoint-scoped carry resolution.
- Risk: Hidden-endpoint errors in single-endpoint wheel views.
  - Mitigation: panel-level error projection when errored endpoint is not active.
