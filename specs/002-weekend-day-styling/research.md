# Research: Weekend Day Styling Hooks for Date Cells

## Decision 1: Weekend Definition

- Decision: Treat weekend as Saturday (`day() === 6`) and Sunday (`day() === 0`) in local-date flow.
- Rationale: Matches clarified requirement scope (CL-001, CL-007) and keeps behavior deterministic across consumers.
- Alternatives considered:
  - Locale-dependent weekend mapping: rejected because requirements define fixed Saturday/Sunday semantics.
  - Configurable weekend prop: rejected because API expansion is out of scope (FR-007, CL-006).

## Decision 2: Public Styling Contract

- Decision: Expose exactly three stable class hooks on weekend cells: `vtd-weekend`, `vtd-saturday`, `vtd-sunday`.
- Rationale: Satisfies deterministic styling without fragile selector chains and aligns with explicit clarification contract (CL-003).
- Alternatives considered:
  - One generic class only (`vtd-weekend`): rejected because Saturday/Sunday-specific customization would be impossible.
  - Data attributes instead of classes: rejected because requirements explicitly call for class hooks.

## Decision 3: Hook Coverage Scope

- Decision: Apply weekend hooks to every rendered day button, including leading/trailing off-month cells.
- Rationale: Prevents visual inconsistencies while paging months and satisfies FR-003 / CL-004.
- Alternatives considered:
  - Current-month-only hooks: rejected due to mismatch during edge-cell rendering.

## Decision 4: Class Merge Strategy

- Decision: Keep existing `datepickerClasses` selection/range/disabled/today logic intact; append weekend hook classes additively in button class bindings.
- Rationale: Minimizes regression risk and preserves state precedence guarantees in FR-006 / CL-005.
- Alternatives considered:
  - Inject weekend styles directly into existing class-return strings: rejected due to coupling and increased precedence risk.

## Decision 5: Backward-Compatibility Surface

- Decision: No new prop, no required migration, no breaking markup contract beyond additive classes.
- Rationale: Follows constitutional backward-compatibility principle and FR-007.
- Alternatives considered:
  - Feature flag prop (`weekendStyling`): rejected because weekend hooks are safe additive behavior.

## Decision 6: Verification Scope

- Decision: Validate with typecheck/build plus manual matrix for weekend hooks, host-CSS tinting, and overlapping states.
- Rationale: Existing repository quality gates rely on type/build plus manual UX checks; this feature is UI-state oriented.
- Alternatives considered:
  - Unit-test-only validation: rejected because manual visual precedence checks remain required for confidence.

## Risks and Mitigations

- Risk: Weekend classes accidentally omitted from one panel path.
  - Mitigation: Ensure both previous/next calendar date-generation paths include identical weekend metadata and class composition.
- Risk: Weekend hooks alter visual precedence unexpectedly.
  - Mitigation: Keep hooks additive and avoid replacing existing selected/range/disabled/today class strings.
- Risk: Consumer CSS over-applies weekend tint to disabled/selected states.
  - Mitigation: Document recommended selector specificity in quickstart while preserving semantic class priority behavior.
