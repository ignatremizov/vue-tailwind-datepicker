# Implementation Plan: Selector Direct Year Input

**Branch**: `005-selector-direct-year-input` | **Date**: 2026-02-13 | **Spec**: `specs/005-selector-direct-year-input/spec.md`
**Input**: Feature specification from `specs/005-selector-direct-year-input/spec.md`

## Summary

Add an opt-in direct-year text input flow inside selector mode (entered from header toggle), with deterministic signed-year parsing and immediate live sync when the token is valid. The implementation preserves existing scroll selector behavior, introduces a `yearNumberingMode` flag (`historical` vs `astronomical`), and enforces range-mode normalization only at explicit persist boundaries (Apply or close-with-persist), not during live typing.

## Technical Context

**Language/Version**: TypeScript 5.9, Vue 3.5 SFCs  
**Primary Dependencies**: Vue 3, dayjs, @headlessui/vue, tailwindcss  
**Storage**: N/A (component-local state only)  
**Testing**: `npm run typecheck`, `npm run build`, manual quickstart scenarios  
**Target Platform**: Browser (desktop + mobile), Vue 3 library consumers  
**Project Type**: Single frontend component library  
**Performance Goals**: Keep selector typing and year-wheel synchronization responsive (no perceptible lag during normal typing pace)  
**Constraints**: Backward-compatible defaults, deterministic keyboard semantics, no hidden range auto-corrections during live typing  
**Scale/Scope**: Extend existing selector/calendar flow in `src/VueTailwindDatePicker.vue` and related header/month/year subcomponents

## Constitution Check

Constitution source: `specs/constitution.md`

- Principle I (Backward Compatibility by Default): PASS - direct year input is behind a new opt-in prop and `yearNumberingMode` defaults to `historical`.
- Principle II (Spec-Driven Changes): PASS - all plan artifacts map to FR-001..FR-022 and SC-001..SC-005.
- Principle III (Deterministic UX Semantics): PASS - valid token sync, invalid reversion, and range normalization boundaries are explicitly defined.
- Principle IV (Verification Before Merge): PASS - plan includes required typecheck/build and explicit manual quickstart checks for edge cases.
- Principle V (Minimal-Risk Evolution): PASS - implementation extends existing selector architecture rather than introducing parallel picker systems.

Post-design re-check: PASS. No constitution violations or exceptions.

## Project Structure

### Documentation (this feature)

```text
specs/005-selector-direct-year-input/
├── plan.md
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── direct-year-input-contract.md
└── checklists/
    └── requirements-quality.md
```

### Source Code (repository root)

```text
src/
├── VueTailwindDatePicker.vue
├── types.ts
├── composables/
│   └── directYearInput.ts
└── components/
    ├── Header.vue
    ├── Month.vue
    └── Year.vue
```

**Structure Decision**: Keep changes inside existing picker architecture and subcomponents, with at most one focused helper under existing `src/composables/` for signed-year parsing/validation. Avoid introducing new top-level feature modules.

## Phase 0: Research and Tradeoffs

See `specs/005-selector-direct-year-input/research.md`.

## Phase 1: Design

1. Define public feature flags and defaults:
   - `directYearInput` (opt-in, default `false`)
   - `yearNumberingMode: 'historical' | 'astronomical'` (default `historical`)
2. Add selector year-input state model:
   - raw input text
   - normalized token candidate
   - last-valid-year baseline
   - active context target (single or active range panel)
3. Encode signed-year normalization and validity rules:
   - trim whitespace
   - preserve optional leading `-`
   - sanitize remaining content to digits
   - enforce token grammar and numeric bounds `-99999..99999`
   - enforce year `0` validity by numbering mode
4. Apply live sync semantics for valid tokens:
   - immediately commit selector/calendar year
   - emit model update for active context
   - advance last-valid baseline
   - re-anchor year wheel if outside current window
5. Encode invalid/partial resolution behavior:
   - Enter: confirm current committed valid year and keep selector open
   - Escape: revert input value to last valid year
   - Blur with invalid/partial: revert to last valid year
6. Encode range chronology policy:
   - allow temporary inversion during live typing
   - normalize only at Apply or close-with-persist boundaries
   - auto-swap endpoints during normalization
   - exclude Enter-in-place and cancel-like exits from normalization triggers

Detailed entities and transitions are in `data-model.md` and `contracts/direct-year-input-contract.md`.

## Phase 2: Implementation Outline

1. Extend public types/props and defaults for direct year input and numbering mode.
2. Add parser/normalizer and token validity helpers for signed year input.
3. Integrate typed-year state in selector mode entered from header toggle flow.
4. Wire live valid-token commit to navigation state and emitted model updates.
5. Synchronize typed input with year wheel scroll updates in both directions.
6. Add explicit commit-boundary handling for range inversion normalization.
7. Cover keyboard/blur/escape behavior against last-valid baseline semantics.
8. Run `npm run typecheck` and `npm run build`, then execute manual quickstart checks.

## Test and Verification Strategy

- Static safety: `npm run typecheck`
- Build integrity: `npm run build`
- Manual scenario groups:
  - Selector header entry -> direct typed year apply path
  - Signed-year validation boundaries (`-99999`, `99999`, and out-of-range)
  - Year `0` behavior in `historical` vs `astronomical`
  - Invalid/partial resolution paths (Enter, Escape, blur)
  - Range mode active-panel targeting and temporary inversion handling
  - Apply/close-with-persist normalization vs cancel-like exits
  - Regression checks with `directYearInput` disabled

### Edge Case Coverage Plan

- Leading zeros and whitespace/mixed paste normalization.
- Negative years and one-digit years.
- Fast switching between typed input and wheel scroll.
- Active-panel switching in double-panel range before/after typed updates.
- Re-anchoring behavior for typed years far outside visible wheel window.

## Traceability

- Spec reference: `specs/005-selector-direct-year-input/spec.md`
- Contract reference: `specs/005-selector-direct-year-input/contracts/direct-year-input-contract.md`
- No external issue link provided.

## Complexity Tracking

No constitution violations requiring exemptions.
