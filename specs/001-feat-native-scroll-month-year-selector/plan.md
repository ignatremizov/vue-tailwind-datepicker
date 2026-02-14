# Implementation Plan: Native-Like Month/Year Scrolling Selector

**Branch**: `001-feat-native-scroll-month-year-selector` | **Date**: 2026-02-11 | **Spec**: `specs/001-feat-native-scroll-month-year-selector/spec.md`
**Input**: Feature specification from `specs/001-feat-native-scroll-month-year-selector/spec.md`

## Summary

Add an opt-in selector mode for `vue-tailwind-datepicker` that toggles between calendar view and native-like month/year scrolling selectors. The implementation must preserve existing single/range behavior, support single-panel range (`use-range` + `as-single`) and double-panel range (per-panel selector context), and keep the existing default behavior unchanged unless explicitly enabled.

Current UX scope also includes: explicit selector-header toggle affordance, configurable selector focus tinting, selector container size stability across view toggles, click-to-center selector behavior, and selectable year scroll sync variants (`boundary` and `fractional`).

## Technical Context

**Language/Version**: TypeScript 5.9, Vue 3.5 SFCs  
**Primary Dependencies**: Vue 3, dayjs, headlessui/vue, tailwindcss  
**Storage**: N/A (component-local state only)  
**Testing**: `vue-tsc --noEmit`, `vite build`, manual demo verification in local app and consumer usage  
**Target Platform**: Browser (desktop + mobile), Vue 3 library consumers  
**Project Type**: Single frontend component library  
**Performance Goals**: Keep interactions smooth and maintain 60fps scroll/animation during selector use  
**Constraints**: Non-breaking API by default, preserve current range semantics and accessibility behavior  
**Scale/Scope**: One core component (`src/VueTailwindDatePicker.vue`) plus selector/header subcomponents

## Constitution Check

Project constitution is defined at `.specify/memory/constitution.md`. This plan is checked against its MUST-level principles:

- Backward compatibility by default: PASS (feature remains opt-in via `selectorMode`)
- Spec-driven traceability: PASS (spec/plan/tasks/contracts/quickstart are linked and requirement-tagged)
- Deterministic UX semantics: PASS (single-panel and double-panel selection-context rules are explicit)
- Verification before merge: PASS (`npm run typecheck`, `npm run build`, manual quickstart checks including SC-002 and edge-case matrix)
- Minimal-risk evolution: PASS (incremental changes in existing component architecture)

Re-check after Phase 1 design: PASS (design and tasks remain aligned with constitution gates).

## Project Structure

### Documentation (this feature)

```text
specs/001-feat-native-scroll-month-year-selector/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── selector-mode-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── VueTailwindDatePicker.vue
├── components/
│   ├── Header.vue
│   ├── Month.vue
│   ├── Year.vue
│   └── Calendar.vue
├── types.ts
└── App.vue
```

**Structure Decision**: Use existing component structure. Add selector mode state and rendering control in `src/VueTailwindDatePicker.vue`; evolve or replace `Month.vue` and `Year.vue` into scroll-selector variants; minimally extend `Header.vue` for toggle behavior.

## Phase 0: Research and Tradeoffs

See `research.md`.

## Phase 1: Design

1. Introduce opt-in prop for selector mode and keep legacy behavior as default.
2. Add explicit view mode state (`calendar` vs `selector`) and selector focus (`month` or `year`).
3. Implement scroll selector UI and interactions for month/year with virtually unbounded year generation.
4. Encode range selection context rules:
   - Single-panel range: operate on displayed month/year only.
   - Double-panel range: operate on clicked panel only.
5. Preserve model update behavior and auto-apply/manual apply semantics.
6. Provide stable visual container geometry and clear selector-toggle affordance.
7. Support both clarity-first and continuous year-wheel sync variants via prop.

Detailed entities and transitions are in `data-model.md` and `contracts/selector-mode-contract.md`.

## Phase 2: Implementation Outline

1. Add prop and default handling in `src/VueTailwindDatePicker.vue`.
2. Add view mode and active context state.
3. Update header interactions to toggle selector mode.
4. Implement month/year scroll selector rendering and selection handlers.
5. Integrate range context behavior rules.
6. Validate accessibility keyboard/focus behavior.
7. Update demo usage (`src/App.vue`) if needed for manual verification only.
8. Run `npm run typecheck` and `npm run build`.

## Test and Verification Strategy

- Type safety: `npm run typecheck`
- Build integrity: `npm run build`
- Manual checks:
  - Single date + selector mode on/off
  - Single-panel range (`use-range` + `as-single`)
  - Double-panel range (per-panel selector)
  - Auto-apply and manual apply
  - Keyboard interaction and focus transitions
  - SC-002 check: from selector open state, target month/year can be reached in <=2 direct interactions (selection actions), excluding scroll travel distance

### Edge Case Coverage Plan

- Far-year navigation: verify virtual year window behavior at large positive/negative offsets (maps to FR-011).
- Small screens: verify selector mode layout and toggle behavior on mobile breakpoints (maps to FR-004, FR-010).
- Visual stability: verify no width/height jitter when toggling calendar <-> selector for same mode/config (maps to FR-014).
- Disabled dates/month constraints: verify month/year changes do not break disabled-date semantics (maps to FR-006, FR-007).
- Invalid/empty model values: verify selector entry and fallback anchoring behavior remain stable (maps to FR-006).
- Double-panel interaction boundaries: verify clicked-panel-only rule is preserved (maps to FR-006).

## Linear and Traceability

- Linear issue reference: None provided.
- Spec reference: `specs/001-feat-native-scroll-month-year-selector/spec.md`
- Contract reference: `specs/001-feat-native-scroll-month-year-selector/contracts/selector-mode-contract.md`

## Complexity Tracking

No constitution violations identified that require exceptions.
