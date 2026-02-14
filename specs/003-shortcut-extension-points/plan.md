# Implementation Plan: Shortcut Extension Points in Date Picker Panel

**Branch**: `003-shortcut-extension-points` | **Date**: 2026-02-13 | **Spec**: `specs/003-shortcut-extension-points/spec.md`
**Input**: Feature specification from `specs/003-shortcut-extension-points/spec.md`

## Summary

Add extensible, in-panel shortcut behavior with a typed resolver contract, invalid-shortcut signaling, and per-item render extension points while preserving backward compatibility. The new built-in shortcut set (Today, 3 business days, Next week, Next month) is gated behind `shortcutPreset="modern"`; default behavior remains `shortcutPreset="legacy"` so existing consumers keep current shortcuts unless they opt in.

## Technical Context

**Language/Version**: TypeScript 5.9, Vue 3.5 SFCs  
**Primary Dependencies**: Vue 3, dayjs, @headlessui/vue, tailwindcss  
**Storage**: N/A (component-local state and event flow only)  
**Testing**: `npm run typecheck`, `npm run build`, manual quickstart flows for shortcut semantics and accessibility  
**Target Platform**: Browser-based Vue 3 component library (desktop and mobile)  
**Project Type**: Single frontend component library  
**Performance Goals**: Shortcut activation updates selection with no noticeable lag and preserves current panel responsiveness  
**Constraints**: Backward compatible defaults, local-time deterministic calculations, no extra popup/panel for shortcut actions  
**Scale/Scope**: Primary work in `src/VueTailwindDatePicker.vue`, `src/components/Shortcut.vue`, and typing/event contracts

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution source: `specs/constitution.md`

- Principle I (Backward Compatibility by Default): PASS - `shortcutPreset` defaults to `legacy`; modern behavior is opt-in only.
- Principle II (Spec-Driven Changes): PASS - plan/data-model/contracts/quickstart map to FR-001 through FR-021 and SC-001 through SC-003.
- Principle III (Deterministic UX Semantics): PASS - shortcut resolution, mode normalization, and rejection rules are explicitly defined.
- Principle IV (Verification Before Merge): PASS - quickstart includes required typecheck/build and manual UX checks.
- Principle V (Minimal-Risk Evolution): PASS - extends existing shortcut surface instead of replacing picker architecture.

Post-design constitution re-check: PASS (no unresolved violations).

## Project Structure

### Documentation (this feature)

```text
specs/003-shortcut-extension-points/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── shortcut-extension-contract.md
├── checklists/
│   └── requirements-quality.md
└── spec.md
```

### Source Code (repository root)

```text
src/
├── VueTailwindDatePicker.vue
├── components/
│   ├── Shortcut.vue
│   ├── Calendar.vue
│   ├── Header.vue
│   ├── Month.vue
│   └── Year.vue
├── types.ts
└── keys.ts
```

**Structure Decision**: Keep all changes in existing picker/shortcut components and add narrowly scoped type and event contracts to avoid high-churn architecture changes.

## Phase 0: Research and Tradeoffs

See `specs/003-shortcut-extension-points/research.md`.

## Phase 1: Design

1. Add public preset API with `shortcutPreset: 'legacy' | 'modern'` defaulting to `legacy`.
2. Define modern built-in shortcut algorithms and freeze deterministic date rules in local timezone.
3. Introduce typed shortcut resolver contract with explicit context shape `{ currentValue, mode, now, constraints }`.
4. Preserve legacy `atClick()` behavior through adaptation, with typed resolver precedence when both are present.
5. Add mode-valid normalization/rejection rules for single vs range flows.
6. Add structured `invalid-shortcut` event payload and guarantee no `update:modelValue` emission on failures.
7. Add per-item shortcut render extension surface exposing metadata plus library-owned `activate()` helper.
8. Keep post-activation close/open/focus behavior aligned with current selection semantics.

Detailed entities and transitions are in `data-model.md` and `contracts/shortcut-extension-contract.md`.

## Phase 2: Implementation Outline

1. Extend public props/types for `shortcutPreset` and typed shortcut definitions.
2. Refactor shortcut execution path into a single activation pipeline (resolve -> normalize -> validate -> apply/reject).
3. Implement modern built-in shortcut set and preset switch without changing legacy defaults.
4. Add deterministic id handling for typed and legacy shortcuts.
5. Emit `invalid-shortcut` with structured reason codes for all invalid/failure paths.
6. Introduce per-item render extension contract that routes all activations through `activate()`.
7. Preserve keyboard activation and focus behavior in shortcut list semantics.
8. Run typecheck/build and execute quickstart manual checks.

## Test and Verification Strategy

- Type safety and build integrity:
  - `npm run typecheck`
  - `npm run build`
- Shortcut behavior regression checks:
  - `npm run test:unit` (or equivalent Vitest script introduced by this feature)
- Manual verification matrix:
  - `shortcutPreset='legacy'` matches existing shortcut defaults.
  - `shortcutPreset='modern'` maps to Today, 3 business days, Next week, Next month semantics.
  - Custom typed shortcuts replace built-ins by default.
  - Legacy `atClick()` shortcuts continue to operate in backward-compatible mode.
  - `invalid-shortcut` fires for blocked dates, invalid mode output, and resolver errors.
  - Enter/Space activation remains usable for every shortcut entry.
- Success criteria alignment:
  - SC-001: deterministic outputs for built-ins and unit-test matrix pass.
  - SC-002: custom shortcuts and render extension usable via public API.
  - SC-003: keyboard activation works for all shortcut actions.

## Edge Case Coverage Plan

- Business-day counting from weekends and across month boundaries (FR-004, CL-002, CL-008).
- Next-month clamping for invalid target dates (FR-004, CL-005).
- Range normalization and single-mode rejection rules (FR-008, FR-016, CL-006, CL-017, CL-020).
- Constraint rejection and non-emission of model updates on failure (FR-010, FR-012, CL-010, CL-012).
- Resolver exception handling and soft-failure behavior (FR-019, CL-021).
- Timezone boundaries around local midnight (FR-007, Edge Cases section).

## Traceability

- Spec reference: `specs/003-shortcut-extension-points/spec.md`
- Constitution reference: `specs/constitution.md`
- Contract reference: `specs/003-shortcut-extension-points/contracts/shortcut-extension-contract.md`
- No external issue tracker link was provided.

## Complexity Tracking

No constitution violations or risk exceptions require approval.
