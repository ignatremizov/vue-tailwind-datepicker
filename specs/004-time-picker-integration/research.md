# Research: Integrated Time Selection for Date Picker

## Decision 1: Datetime Mode Rollout and Commit Semantics

- Decision: Keep datetime behavior opt-in and require explicit Apply for commits in datetime mode, even when `autoApply=true`.
- Rationale: Preserves backward compatibility while preventing partial datetime commits during intermediate edits.
- Alternatives considered:
  - Respect `autoApply` in datetime mode: rejected because it conflicts with clarified explicit-commit contract.

## Decision 2: Formatter Contract as Single Source of Truth

- Decision: Use `formatter.date` tokens as the canonical parse/format contract for datetime mode.
- Rationale: Avoids divergent formatting rules and keeps consumer-facing output deterministic.
- Alternatives considered:
  - Add separate datetime format prop: rejected because it introduces conflicting formatting sources.

## Decision 3: Valid Token Policy and Apply Guard

- Decision: Datetime mode requires valid time tokens in formatter (`HH:mm` or `HH:mm:ss`; `h:mm A`, `h:mm a`, `hh:mm A`, `hh:mm a`, with optional seconds variants); missing tokens block Apply.
- Rationale: Prevents silent date-only output when datetime mode is explicitly enabled.
- Alternatives considered:
  - Permit datetime mode with date-only formatter: rejected due to ambiguous output and loss of time precision.

## Decision 4: Default-Time Input Flexibility with Internal Normalization

- Decision: Accept `defaultTime`/`defaultEndTime` in either 24-hour or 12-hour forms, then normalize to active formatter contract before hydration/use.
- Rationale: Keeps API ergonomic while ensuring one normalized internal representation.
- Alternatives considered:
  - Restrict defaults to formatter-matching input only: rejected because it is stricter than necessary and increases integration friction.

## Decision 5: Range Editing Model

- Decision: In datetime range mode, keep a single time input bound to explicit active endpoint (`start` or `end`) while maintaining independent stored endpoint times.
- Rationale: Aligns with clarified UX and reduces panel complexity.
- Alternatives considered:
  - Simultaneous dual time inputs: rejected due to layout complexity and increased error risk in narrow widths.

## Decision 6: DST Semantics in Local Time

- Decision: Parse and validate in local timezone only; reject nonexistent local times and resolve ambiguous fall-back times to first occurrence (earlier offset).
- Rationale: Matches clarified deterministic timezone behavior and avoids hidden timezone conversions.
- Alternatives considered:
  - UTC normalization for all comparisons: rejected because it breaks local-time UX expectations.
  - Prompt users on ambiguity: rejected for this iteration due to added interaction complexity.

## Decision 7: Error Event Contract and Cadence

- Decision: Emit one structured `error` event per blocked Apply attempt with payload fields `{ type, code, message, field, endpoint }`; do not emit this event on each keystroke/state change.
- Rationale: Keeps telemetry deterministic and prevents event spam while preserving inline validation feedback.
- Alternatives considered:
  - Emit error event on every invalid edit: rejected because cadence becomes noisy and non-deterministic.

## Risks and Mitigations

- Risk: Token parser edge cases for mixed 12-hour/24-hour defaults.
  - Mitigation: Normalize defaults before validation and test cross-format combinations in quickstart matrix.
- Risk: Range endpoint confusion while using one time input.
  - Mitigation: Explicit endpoint toggle label and endpoint field in error payload.
- Risk: DST handling regressions around locale/timezone boundaries.
  - Mitigation: Add targeted manual checks for spring-forward and fall-back transitions.
