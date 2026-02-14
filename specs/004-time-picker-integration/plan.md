# Implementation Plan: Integrated Time Selection for Date Picker

**Branch**: `004-time-picker-integration` | **Date**: 2026-02-13 | **Spec**: `specs/004-time-picker-integration/spec.md`
**Input**: Feature specification from `specs/004-time-picker-integration/spec.md`

## Summary

Add an opt-in datetime mode that keeps date and time selection in one picker panel, preserves existing `v-model` container shapes, and enforces explicit Apply in datetime flows (including when `autoApply=true`). The design keeps `formatter.date` as the single source of truth for parse/format behavior, validates required time tokens, supports deterministic default-time hydration, and emits structured `error` events only when Apply is blocked.

## Technical Context

**Language/Version**: TypeScript 5.9, Vue 3.5 SFCs  
**Primary Dependencies**: Vue 3, dayjs, @vueuse/core, tailwindcss  
**Storage**: N/A (component-local state only)  
**Testing**: `npm run typecheck`, `npm run build`, manual quickstart scenarios for datetime/range/DST/error-event flows  
**Target Platform**: Browser (desktop + mobile), Vue 3 library consumers  
**Project Type**: Single frontend component library  
**Performance Goals**: Maintain smooth picker interaction (target 60fps-feel) with no additional overlay transitions  
**Constraints**: Backward compatible by default, local-time parsing only, deterministic DST handling, no runtime throws for blocked Apply paths  
**Scale/Scope**: Primary changes in `src/VueTailwindDatePicker.vue`, with focused updates to types/utilities and existing panel controls

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Backward Compatibility by Default**: PASS. Datetime behavior is strictly opt-in (`datetime=false` by default); date-only behavior remains unchanged when opt-in props are absent.
- **II. Spec-Driven Changes**: PASS. Plan, research, data model, contract, and quickstart map directly to spec requirements (FR-001..FR-023) and success criteria.
- **III. Deterministic UX Semantics**: PASS. Apply gating, endpoint toggle behavior, default-time precedence, DST invalid/ambiguous handling, and error-event cadence are explicit.
- **IV. Verification Before Merge**: PASS. Required verification commands and manual matrix are documented in quickstart.
- **V. Minimal-Risk Evolution**: PASS. Extend existing picker state and validation pipeline rather than adding a second popover or separate datetime component.

Re-check after Phase 1 design: PASS. No constitution violations or exception requests remain.

## Project Structure

### Documentation (this feature)

```text
specs/004-time-picker-integration/
├── plan.md
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── datetime-mode-contract.md
└── checklists/
    └── requirements-quality.md
```

### Source Code (repository root)

```text
src/
├── VueTailwindDatePicker.vue
├── components/
│   ├── Calendar.vue
│   ├── Header.vue
│   └── Week.vue
├── composables/
│   └── date.ts
├── types.ts
└── utils.ts
```

**Structure Decision**: Implement datetime and validation changes in existing picker/state modules to minimize churn and preserve established consumer behavior.

## Phase 0: Research and Tradeoffs

See `research.md` for resolved decisions on Apply gating, formatter token contracts, default-time normalization, range endpoint editing semantics, DST handling, and error-event cadence.

## Phase 1: Design

1. Define normalized datetime configuration and draft state entities.
2. Model deterministic state transitions for initialization hydration, endpoint toggling, validation, blocked Apply, and commit.
3. Lock public behavior/API contract in `contracts/datetime-mode-contract.md`:
   - opt-in datetime mode
   - formatter token validity rules
   - default-time input normalization
   - structured error event shape and emission cadence
4. Document manual verification sequence for core and edge flows in `quickstart.md`.

Detailed entities, invariants, and transitions are in `data-model.md`.

## Phase 2: Implementation Outline

1. Add/normalize datetime props and mode guards (`datetime`, `defaultTime`, `defaultEndTime`).
2. Extend internal state to keep date + time drafts without changing external container shapes.
3. Render in-panel time controls and explicit Start/End endpoint selector in datetime range mode.
4. Enforce formatter-based token validation before Apply and normalize default-time inputs to formatter contract.
5. Implement DST validation semantics (reject nonexistent local times; pick first occurrence for ambiguous fall-back time).
6. Enforce Apply-only commit behavior in datetime mode, including `autoApply=true` contexts.
7. Emit structured `error` events only on blocked Apply attempts; never throw runtime exceptions for these validation/config cases.
8. Run typecheck/build and complete quickstart matrix.

## Test and Verification Strategy

- **Static checks**: `npm run typecheck`, `npm run build`
- **Manual flow checks**:
  - Single-date datetime select/apply
  - Date-only non-regression with datetime disabled/omitted
  - Range mode with explicit Start/End endpoint toggle
  - Formatter-token invalid config blocking
  - Invalid typed time blocking and recovery
  - Error event cadence (blocked Apply only)
  - DST nonexistent and ambiguous time behavior
- **Traceability checks**:
  - FR-008 + FR-019: Apply gating and event cadence
  - FR-013 + FR-018 + FR-020: formatter/date-token and default-time normalization
  - FR-014 + FR-009: single input endpoint toggle + range ordering validation
  - FR-007 + FR-021: local timezone DST semantics

## Edge Case Coverage Plan

- Incoming date-only model in datetime mode hydrates internal time without emitting `update:modelValue` (FR-017, FR-022).
- Formatter lacks required time tokens while datetime enabled blocks Apply with deterministic error code (FR-011, FR-023).
- 12-hour and 24-hour formatter/default-time combinations normalize consistently before validation (FR-018, FR-020).
- Range end datetime earlier than start blocks Apply with endpoint-aware inline error/event payload (FR-009, FR-015).
- DST spring-forward nonexistent local times reject apply; fall-back ambiguity resolves to first occurrence (FR-007, FR-021).

## Traceability

- Spec reference: `specs/004-time-picker-integration/spec.md`
- Contract reference: `specs/004-time-picker-integration/contracts/datetime-mode-contract.md`
- Manual verification reference: `specs/004-time-picker-integration/quickstart.md`

## Complexity Tracking

No constitution violations identified that require exception handling.
