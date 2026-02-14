# Requirements-Quality Checklist: Shortcut Extension Points

**Purpose**: Validate requirement completeness, clarity, consistency, and measurability before implementation begins.
**Created**: 2026-02-13
**Feature**: `specs/003-shortcut-extension-points/spec.md`

## Completeness

- [ ] CHK001 Do requirements explicitly define both built-in preset inventories (legacy and modern) so no built-in labels/semantics are implied? [Spec §Functional Requirements FR-001, FR-011, FR-021] [Gap]
- [ ] CHK002 Do requirements fully specify the modern preset algorithms (business-day counting, +7 days, month clamp, local timezone) without hidden assumptions? [Spec §Functional Requirements FR-004, FR-007] [Spec §Clarifications CL-004, CL-005, CL-007, CL-008]
- [ ] CHK003 Do requirements define when shortcuts are visible for each mode combination (`use-range`, `as-single`, single mode), or is display scope still implicit? [Spec §User Story 1] [Ambiguity]
- [ ] CHK004 Do requirements define the full invalid-shortcut reason taxonomy needed for all rejection paths, including blocked date, mode mismatch, and resolver exception cases? [Spec §Functional Requirements FR-010, FR-012, FR-019] [Gap]
- [ ] CHK005 Do requirements specify whether custom shortcut replacement is all-or-nothing in every input form (array, factory, legacy, typed)? [Spec §Functional Requirements FR-014] [Assumption]

## Clarity and Determinism

- [ ] CHK006 Is the typed resolver context contract frozen to exactly `{ currentValue, mode, now, constraints }` with no optional/extra keys implied? [Spec §Functional Requirements FR-013] [Spec §Clarifications CL-015]
- [ ] CHK007 Is resolver precedence unambiguous when both `atClick()` and `resolver(context)` are present on one item? [Spec §Functional Requirements FR-017] [Spec §Clarifications CL-018]
- [ ] CHK008 Are single-mode vs range-mode normalization rules written as deterministic pass/fail outcomes for every result shape? [Spec §Functional Requirements FR-008, FR-016] [Spec §Clarifications CL-006, CL-017, CL-020]
- [ ] CHK009 Is post-activation close/open/focus behavior defined as reuse of existing semantics with no new divergent path? [Spec §Functional Requirements FR-020] [Spec §Clarifications CL-022]
- [ ] CHK010 Are keyboard and accessibility requirements specific enough to avoid interpretation drift across native and custom-rendered shortcut items? [Spec §Functional Requirements FR-006] [Spec §User Story 3]

## Consistency and Compatibility

- [ ] CHK011 Do requirements consistently state that new built-ins are opt-in and default remains legacy across all sections (stories, FRs, clarifications)? [Spec §User Story 1 Scenario 5-8] [Spec §Functional Requirements FR-005, FR-011, FR-021] [Conflict]
- [ ] CHK012 Are compatibility expectations aligned for legacy custom outputs in single mode (first-date fallback) versus typed outputs (rejection)? [Spec §Functional Requirements FR-016] [Spec §Clarifications CL-017, CL-020]
- [ ] CHK013 Is event behavior consistent that `invalid-shortcut` emits on failure while `update:modelValue` never emits on failure? [Spec §Functional Requirements FR-012, FR-019] [Spec §Clarifications CL-012, CL-021]
- [ ] CHK014 Do id-stability requirements clearly distinguish mandatory typed `id` and deterministic legacy id generation semantics? [Spec §Functional Requirements FR-018] [Spec §Clarifications CL-019]
- [ ] CHK015 Is per-item render extension ownership consistent with requirement that library retains activation side effects/events? [Spec §Functional Requirements FR-015] [Spec §Clarifications CL-016]

## Measurability and Coverage

- [ ] CHK016 Do success criteria include measurable expectations for failure-path behavior (invalid event payload quality and non-mutation), not only successful flows? [Spec §Success Criteria SC-001..SC-003] [Gap]
- [ ] CHK017 Do acceptance scenarios cover all high-risk edge cases listed (weekends, month boundaries, timezone midnight) with expected outputs? [Spec §Edge Cases] [Gap]
- [ ] CHK018 Do requirements define what constitutes keyboard accessibility pass/fail beyond focusability and Enter/Space activation? [Spec §User Story 3] [Ambiguity]
- [ ] CHK019 Are assumptions about constraint evaluation order and atomic rejection in range mode documented and testable? [Spec §Functional Requirements FR-010, FR-013, FR-016] [Assumption]
- [ ] CHK020 Do requirements identify external dependencies (date library behavior, locale/timezone source) that could alter deterministic shortcut outcomes? [Spec §Functional Requirements FR-004, FR-007] [Assumption]

## Notes

- Mark each item `[x]` only when requirement text (not implementation notes) is explicit and unambiguous.
- Open requirement issues for every `[Gap]`, `[Ambiguity]`, `[Conflict]`, or `[Assumption]` item that remains unresolved.
