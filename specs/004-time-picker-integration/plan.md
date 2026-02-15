# Implementation Plan: Integrated Time Selection for Date Picker

**Branch**: `004-time-picker-integration` | **Date**: 2026-02-18 | **Spec**: `specs/004-time-picker-integration/spec.md`  
**Input**: Feature specification from `specs/004-time-picker-integration/spec.md`

## Summary

Implement and harden integrated time selection using `timePickerStyle` (`none` / `input` / `wheel-inline` / `wheel-page`) with explicit Apply semantics, stable range endpoint editing, deterministic error/event behavior, and resilient layout/scroll synchronization under mode switches and fast wheel interaction.

## Technical Context

**Language/Version**: TypeScript 5.9, Vue 3.5 SFCs  
**Primary Dependencies**: Vue 3, dayjs, @vueuse/core, tailwindcss  
**Storage**: N/A (component-local state only)  
**Testing**: `npm run typecheck`, `npm run build`, `npm run test:unit -- tests/unit/time-panel-layout.spec.ts`, manual quickstart scenarios  
**Target Platform**: Browser (desktop + mobile), Vue 3 library consumers  
**Project Type**: Single frontend component library  
**Performance Goals**: Smooth wheel interaction with deterministic carry/re-anchor behavior and stable layout transitions  
**Constraints**: Backward compatible by default, local-time parsing only, deterministic DST handling, blocked-Apply errors must not throw runtime exceptions  
**Scale/Scope**: Primary changes in `src/VueTailwindDatePicker.vue`, `src/components/TimeWheel.vue`, focused style hooks in `src/index.css`, and unit tests in `tests/unit/time-panel-layout.spec.ts`

## Constitution Check

- **I. Backward Compatibility by Default**: PASS. Non-time mode (`timePickerStyle='none'`) preserves date-only behavior.
- **II. Spec-Driven Changes**: PASS. Spec and contracts updated to current shipped API (`timePickerStyle`-driven, not boolean `datetime`).
- **III. Deterministic UX Semantics**: PASS. Apply gating, endpoint toggles, carry behavior, and error lifecycle are explicit.
- **IV. Verification Before Merge**: PASS. Typecheck/build/unit + manual matrix are defined.
- **V. Minimal-Risk Evolution**: PASS. Existing picker architecture extended; no separate popover subsystem added.

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
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── VueTailwindDatePicker.vue
├── components/
│   └── TimeWheel.vue
├── composables/
│   └── date.ts
├── types.ts
└── utils.ts

tests/
└── unit/
    └── time-panel-layout.spec.ts
```

## Phase 0: Research and Tradeoffs

Capture decisions around:
- style-aware endpoint UI contract (`input` dual inputs vs wheel toggle)
- wheel carry/debounce strategy for fast boundary oscillation
- lock-state reset/re-measure strategy for open-state structural mode switches
- error lifecycle and message ergonomics

## Phase 1: Design

1. Define a `timePickerStyle`-driven state machine and UI projection model.
2. Define endpoint interaction semantics for single/range and input/wheel variants.
3. Define layout lock lifecycle for width/height stability under open-state toggles.
4. Define validation/error lifecycle including panel-level visibility and delayed clear semantics.

## Phase 2: Implementation Outline

1. Replace legacy datetime-mode assumptions with `timePickerStyle` feature gating.
2. Implement style-aware endpoint projection:
   - input mode: dual inputs in single-panel range
   - wheel modes: active endpoint toggle + single editable endpoint
3. Implement wheel behavior hardening:
   - consistent boundary/fractional behavior
   - stable minute/second/hour/meridiem carry under rapid input
4. Implement keyboard/focus cycle contract for time wheels and controls.
5. Implement error lifecycle/message improvements:
   - range-order errors persist until corrected
   - user-friendly time-only start context
6. Implement layout stability improvements:
   - error text wrapping without width growth
   - shell/panel lock reset + re-measure on structural mode changes

## Test and Verification Strategy

- **Static checks**:
  - `npm run typecheck`
  - `npm run build`
- **Automated checks**:
  - `npm run test:unit -- tests/unit/time-panel-layout.spec.ts`
- **Manual checks (quickstart)**:
  - input vs wheel style behavior
  - range endpoint interactions (toggle, after-date default endpoint)
  - blocked-Apply event cadence
  - range-order error persistence and correction
  - mode-switch rendering stability while open
  - DST invalid/ambiguous handling

## Edge Case Coverage Plan

- Structural settings toggled while picker is open should not leave stale lock dimensions.
- Error text in narrow range-input layouts should wrap and not resize shell.
- Wheel boundary oscillation should avoid duplicate carry changes.
- Hidden-endpoint errors must remain visible via panel-level error rendering.

## Traceability

- Spec reference: `specs/004-time-picker-integration/spec.md`
- Contract reference: `specs/004-time-picker-integration/contracts/datetime-mode-contract.md`
- Verification reference: `specs/004-time-picker-integration/quickstart.md`
- Test reference: `tests/unit/time-panel-layout.spec.ts`

## Complexity Tracking

No constitution exceptions required.
