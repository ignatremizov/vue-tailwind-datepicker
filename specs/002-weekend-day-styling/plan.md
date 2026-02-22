# Implementation Plan: Weekend Day Styling Hooks for Date Cells

**Branch**: `002-weekend-day-styling` | **Date**: 2026-02-13 | **Spec**: `specs/002-weekend-day-styling/spec.md`
**Input**: Feature specification from `specs/002-weekend-day-styling/spec.md`

## Summary

Add deterministic weekend styling hooks for day cells so Saturday/Sunday can be themed through stable class names (`vtd-weekend`, `vtd-saturday`, `vtd-sunday`) without deep selectors or source patches. The change is additive, applies to in-month and off-month cells, and preserves selected/range/disabled/today precedence semantics.

## Technical Context

**Language/Version**: TypeScript 5.9, Vue 3.5 SFCs
**Primary Dependencies**: Vue 3, dayjs, tailwindcss, @headlessui/vue
**Storage**: N/A (computed view state only)
**Testing**: `npm run typecheck`, `npm run build`, manual picker checks from quickstart
**Target Platform**: Browser-based Vue 3 component consumers (desktop + mobile)
**Project Type**: Single frontend component library
**Performance Goals**: No perceptible regression in month navigation or day-grid paint responsiveness
**Constraints**: Backward-compatible API (no new props), weekend hooks are additive only, fixed Saturday/Sunday local-date semantics
**Scale/Scope**: `src/VueTailwindDatePicker.vue`, `src/components/Calendar.vue`, `src/types.ts`, `src/App.vue`, `README.md`, `docs/theming-options.md`, and docs under `specs/002-weekend-day-styling/`

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **I. Backward Compatibility by Default**: PASS. No new required API or behavior flags; existing consumers continue to function without changes.
- **II. Spec-Driven Changes**: PASS. Plan, research, data model, contract, and quickstart map directly to FR/SC/CL items in `spec.md`.
- **III. Deterministic UX Semantics**: PASS. Weekend detection contract is explicit (CL-001, CL-007) and class-hook surface is deterministic (CL-003).
- **IV. Verification Before Merge**: PASS. Quickstart defines typecheck/build plus manual checks for precedence and edge cases.
- **V. Minimal-Risk Evolution**: PASS. Scope is a small extension of existing day-cell state/class computation.

Re-check after Phase 1 design: PASS. No constitution violations identified.

## Project Structure

### Documentation (this feature)

```text
specs/002-weekend-day-styling/
├── plan.md
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── weekend-day-styling-contract.md
└── checklists/
    └── requirements-quality.md
```

### Source Code (repository root)

```text
src/
├── VueTailwindDatePicker.vue
├── components/
│   └── Calendar.vue
└── types.ts
```

**Structure Decision**: Keep implementation in the existing date-cell pipeline. Extend `DatePickerDay` state and class composition where day cells are created and rendered, without introducing new components or external APIs.

## Phase 0: Research and Tradeoffs

See `research.md` for finalized decisions on weekend semantics, class contract shape, additive precedence, and regression controls.

## Phase 1: Design

1. Extend day-cell metadata to expose both `saturday` and `sunday` state while retaining existing flags.
2. Compute a shared weekend state for every rendered day cell (including leading/trailing off-month days).
3. Add stable class hooks in day-button class composition:
   - `vtd-weekend` on Saturday/Sunday
   - `vtd-saturday` only on Saturday
   - `vtd-sunday` only on Sunday
4. Keep current selected/range/disabled/today class semantics unchanged; weekend classes remain additive selectors.
5. Preserve public API surface (no new props) and document host-CSS customization workflow.

Detailed entities and invariants are captured in `data-model.md`; behavior/interface guarantees are in `contracts/weekend-day-styling-contract.md`.

## Phase 2: Implementation Outline

1. Update `DatePickerDay` typing to represent weekend granularity.
2. Populate weekend metadata in both calendar panels where day cells are constructed.
3. Compose weekend hook classes onto day-cell button class bindings without disturbing existing state logic.
4. Confirm off-month weekend cells receive identical hooks.
5. Run non-regression checks against selected/range/disabled/today intersections.
6. Execute `npm run typecheck` and `npm run build`.

## Test and Verification Strategy

- **Static/build gates**: `npm run typecheck`, `npm run build`
- **Manual checks**:
  - Weekend hook presence in normal and off-month cells.
  - Host CSS tint application through stable class hooks.
  - Selection/range/disabled/today precedence preserved when weekend hooks coexist.
  - Navigation across months preserves deterministic hook assignment.

### Edge Case Coverage Plan

- Leading/trailing off-month weekend days keep weekend hooks (FR-003, CL-004).
- Months where today falls on a weekend retain both today and weekend semantics (FR-006).
- Range mode with disabled weekend dates keeps disabled/selected precedence while weekend hooks stay additive (FR-006, CL-005).
- Week-start locale differences do not change fixed weekend definition (FR-008, CL-001, CL-007).

## Traceability

- Spec reference: `specs/002-weekend-day-styling/spec.md`
- Contract reference: `specs/002-weekend-day-styling/contracts/weekend-day-styling-contract.md`
- Clarifications used: CL-001 through CL-007

## Complexity Tracking

No constitution violations or exception requests for this feature.
