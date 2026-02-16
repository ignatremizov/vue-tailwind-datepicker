# Research: Shortcut Extension Points in Date Picker Panel

## Decision 1: Preset rollout and default behavior

- Decision: Introduce `shortcutPreset` with enum `legacy | modern`, defaulting to `legacy`.
- Rationale: Satisfies opt-in requirement for new built-ins while preserving existing behavior for current users.
- Alternatives considered:
  - Replace legacy shortcuts by default: rejected due to backward-compatibility risk.
  - Add a boolean flag only: rejected because enum scale is clearer for future preset additions.

## Decision 2: Built-in modern shortcut semantics

- Decision: Define modern built-ins exactly as Today, 3 business days, Next week, Next month.
- Rationale: Aligns directly with FR-001 and clarifications CL-004, CL-005, CL-008.
- Alternatives considered:
  - Add additional built-ins in v1: rejected to keep scope deterministic and testable.

## Decision 3: Resolver contract shape and precedence

- Decision: Support both legacy `atClick()` and typed `resolver(context)` with typed precedence when both exist.
- Rationale: Preserves compatibility while enabling explicit mode-aware logic for new integrations.
- Alternatives considered:
  - Remove legacy support: rejected due to migration breakage.
  - Prefer legacy when both exist: rejected because typed behavior must be authoritative.

## Decision 4: Frozen resolver context

- Decision: Freeze typed resolver context to exactly `{ currentValue, mode, now, constraints }`.
- Rationale: Stable surface prevents accidental contract drift and keeps extension points predictable.
- Alternatives considered:
  - Open-ended context object: rejected because hidden additions reduce API certainty.

## Decision 5: Mode normalization and rejection rules

- Decision: In range mode, single-date output normalizes to `[d, d]`; in single mode, typed `[Date, Date]` is rejected; legacy single mode keeps first-date fallback.
- Rationale: Matches FR-016 and CL-020 while preserving legacy expectations.
- Alternatives considered:
  - Auto-coerce typed ranges in single mode: rejected because it obscures invalid resolver intent.

## Decision 6: Constraint failure and error signaling

- Decision: Any blocked endpoint or resolver exception fails soft, keeps value unchanged, and emits `invalid-shortcut` with structured payload and reason.
- Rationale: Delivers deterministic failure semantics without runtime crashes.
- Alternatives considered:
  - Partial application of valid endpoints: rejected because range semantics become ambiguous.
  - Throw errors to consumers: rejected because picker should remain resilient during interaction.

## Decision 7: Custom shortcuts vs built-ins

- Decision: When consumer-provided shortcuts are present, they replace built-ins by default (no implicit merge).
- Rationale: Reduces accidental mixed behavior and aligns with FR-014.
- Alternatives considered:
  - Merge custom and built-ins automatically: rejected due to ordering and duplication ambiguity.

## Decision 8: Per-item render extension ownership

- Decision: Provide slot/callback metadata plus `activate()`; library retains ownership of mutation and emitted events.
- Rationale: Allows UI customization without breaking internal semantics.
- Alternatives considered:
  - Full panel override: rejected because it bypasses required keyboard/event guarantees.

## Decision 9: Shortcut identity stability

- Decision: Require `id` for typed shortcuts and generate deterministic ids for legacy items lacking explicit ids.
- Rationale: Event payloads must remain stable for analytics/logging and regression assertions.
- Alternatives considered:
  - Optional ids for all items: rejected because payload stability becomes best-effort only.

## Decision 10: Accessibility and activation model

- Decision: Keep shortcuts as keyboard-focusable actions with Enter/Space activation routed through the same `activate()` pipeline.
- Rationale: Preserves consistent behavior across pointer, keyboard, and custom-rendered entries.
- Alternatives considered:
  - Separate keyboard path: rejected because duplicate activation logic increases drift risk.

## Decision 11: Disabled-state render-performance caching

- Decision: Memoize shortcut disabled-state results by shortcut target and mode, invalidate on relevant reactive inputs, and refresh cache on minute boundaries for time-sensitive shortcuts.
- Rationale: Prevents repeated resolver/activation evaluation on unrelated rerenders while preserving accurate disabled status for changing values and time-based built-ins.
- Alternatives considered:
  - Recompute disabled state on every render: rejected due to unnecessary resolver work under reactive churn.
  - Infinite cache without time refresh: rejected because time-dependent disabled states could become stale without user interaction.

## Risks and Mitigations

- Risk: Date math regressions around month boundaries and weekends.
  - Mitigation: Explicit algorithm docs and edge-case matrix in quickstart.
- Risk: Event-contract regressions for invalid paths.
  - Mitigation: Single centralized reject path and structured reason codes.
- Risk: Render extension bypassing internal side effects.
  - Mitigation: Enforce library-owned `activate()` helper as the activation boundary.
