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

## Risks and Mitigations

- Risk: Scroll selector UX jitter on mobile.
  - Mitigation: constrain selector item height, use CSS scroll snap, and avoid heavy reactive work per scroll event.
- Risk: Range synchronization regressions.
  - Mitigation: centralize selector apply handlers and reuse existing month/year update logic where possible.
- Risk: Keyboard/focus regressions.
  - Mitigation: explicit focus targets on mode entry/exit and manual keyboard regression checks.
