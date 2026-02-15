# Research: Native-Like Month/Year Scrolling Selector

## Decision 1: Rollout Strategy

- Decision: Make selector mode opt-in via a new prop.
- Rationale: Prevent regressions for existing consumers and keep upgrade non-breaking.
- Alternatives considered:
  - Default-on behavior: rejected due to migration risk.

## Decision 2: View Flow Behavior

- Decision: Mimic native toggle behavior between calendar and selector views.
- Rationale: Aligns with requested UX and avoids auto-close surprises.
- Alternatives considered:
  - Auto-close after month/year selection: rejected as non-native for this target flow.

## Decision 3: Range Context Rules

- Decision:
  - Single-panel range (`use-range` + `as-single`): selector edits displayed month/year context only.
  - Double-panel range: selector applies only to clicked panel.
- Rationale: Clear and predictable behavior with low state complexity.
- Alternatives considered:
  - Cross-panel switching inside selector: deferred due to higher complexity and bug risk.

## Decision 4: Year Selector Bounds

- Decision: Virtually unbounded year scrolling.
- Rationale: Meets requirement FR-011 and avoids arbitrary hard limits.
- Implementation note: Use lazily generated windows around current anchor year to avoid rendering huge DOM lists.

## Decision 5: Technical Shape

- Decision: Keep implementation inside existing component structure and state model.
- Rationale: Minimizes code churn and aligns with current architecture.
- Alternatives considered:
  - New fully separate picker component: rejected due to duplication and maintenance overhead.

## Decision 6: Selector Header Affordance

- Decision: In selector mode, use a single combined month+year toggle button with explicit affordance styling; keep side month arrows as subdued quick-navigation actions.
- Rationale: Retains native-like toggle clarity while restoring low-friction month stepping for keyboard/mouse users without forcing wheel scrolling.
- Alternatives considered:
  - Keep split month/year header buttons in selector mode: rejected due to weaker toggle clarity.
  - Hide side month arrows completely: rejected after UX review due to discoverability loss for simple month stepping.

## Decision 7: Selector Styling Controls

- Decision: Expose `selectorFocusTint` to allow custom UIs to disable active column tinting while retaining behavior.
- Rationale: Integrators need visual-system flexibility without forking selector logic.
- Alternatives considered:
  - Hard-coded focus tint only: rejected due to integration friction.

## Decision 8: Year Wheel Sync Variants

- Decision: Expose `selectorYearScrollMode` with `boundary` default and `fractional` experimental mode.
- Rationale: `boundary` is clearer for most users; `fractional` offers a native-like continuous feel for advanced adopters.
- Alternatives considered:
  - Single fixed behavior only: rejected due to unresolved UX preference tradeoff.

## Decision 9: Dual-Panel Selector Visibility

- Decision: Allow both selector panels to remain open simultaneously in double-panel range mode.
- Rationale: Improves side-by-side comparison and avoids collapsing the first panel when opening the second.
- Alternatives considered:
  - Single-active selector panel only: rejected after UX review because it hides context and causes panel-state churn.

## Risks and Mitigations

- Risk: Fast-flick rendering gaps (especially year wheel) under high momentum.
  - Mitigation: maintain stable list structures, reduce expensive per-scroll visual effects during active scroll, and tune virtual window/reanchor strategy.
- Risk: Range synchronization regressions.
  - Mitigation: centralize selector apply handlers and reuse existing month/year update logic where possible.
- Risk: Keyboard/focus regressions.
  - Mitigation: explicit focus targets on mode entry/exit and manual keyboard regression checks.
