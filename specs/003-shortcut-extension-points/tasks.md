# Tasks: Shortcut Extension Points in Date Picker Panel

**Input**: `specs/003-shortcut-extension-points/spec.md`, `specs/003-shortcut-extension-points/plan.md`, `specs/003-shortcut-extension-points/data-model.md`, `specs/003-shortcut-extension-points/contracts/shortcut-extension-contract.md`, `specs/003-shortcut-extension-points/quickstart.md`
**Prerequisites**: Plan bundle is present and up to date.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare shared typing and validation tooling used across all stories.

- [x] T001 Add unit-test script and Vitest configuration for shortcut matrix checks in `package.json` and `vitest.config.ts` (supports SC-001).
- [x] T002 [P] Define shared shortcut domain types for preset, resolver context, typed/legacy items, and invalid payload in `src/types.ts` (FR-003, FR-009, FR-012, FR-013, FR-018, FR-021).
- [x] T003 [P] Create deterministic shortcut test helpers for local-time and edge-date fixtures in `tests/unit/shortcut-test-utils.ts` (SC-001).

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish one activation pipeline and event contract before user-story work.

- [x] T004 Implement shared shortcut activation utilities (resolve, normalize, validate, reject reasons) in `src/composables/shortcut.ts` (FR-010, FR-013, FR-016, FR-019).
- [x] T005 [P] Update shortcut injection contracts for shared `activate()`-style execution in `src/keys.ts` (FR-015, FR-020).
- [x] T006 Wire activation pipeline and `invalid-shortcut` emit signature in `src/VueTailwindDatePicker.vue` (FR-002, FR-012, FR-020).

## Phase 3: User Story 1 - Built-in Date Shortcuts (Priority: P1) 🎯 MVP

**Goal**: Deliver modern built-ins behind opt-in preset while keeping legacy defaults.
**Independent Test**: Open picker panel, enable `shortcutPreset="modern"`, click Today / 3 business days / Next week / Next month, and verify deterministic outputs; then confirm omitted preset still uses legacy shortcuts.

- [x] T007 [US1] Add public `shortcutPreset` prop (`legacy | modern`) with default `legacy` in `src/VueTailwindDatePicker.vue` (FR-011, FR-021).
- [x] T008 [US1] Implement modern built-in algorithms (Today, 3 business days, Next week, Next month clamp) in `src/composables/shortcut.ts` (FR-001, FR-004, FR-007).
- [x] T009 [US1] Switch built-in shortcut rendering by preset while preserving legacy default behavior in `src/components/Shortcut.vue` and `src/VueTailwindDatePicker.vue` (FR-005, FR-011, FR-021).
- [x] T010 [US1] Normalize built-in shortcut application to `[d, d]` in range mode and keep in-panel execution flow in `src/VueTailwindDatePicker.vue` (FR-002, FR-008).
- [x] T011 [US1] Add deterministic unit-test matrix for modern built-ins and edge rollover/weekend cases in `tests/unit/shortcut-modern-preset.spec.ts` (SC-001, FR-001, FR-004, FR-007).

## Phase 4: User Story 2 - Consumer-Defined Shortcut Sets (Priority: P2)

**Goal**: Support typed custom shortcuts, per-item extension, and robust invalid handling without regressions.
**Independent Test**: Provide typed custom shortcuts and per-item render extension, verify custom shortcuts replace built-ins, successful resolver output applies, and blocked/invalid/error cases emit `invalid-shortcut` with no model update.

- [x] T012 [US2] Extend `shortcuts` prop typing for typed definitions and factories while retaining legacy signatures in `src/VueTailwindDatePicker.vue` and `src/types.ts` (FR-003, FR-009).
- [x] T013 [US2] Freeze typed resolver context to exactly `{ currentValue, mode, now, constraints }` in `src/composables/shortcut.ts` (FR-013).
- [x] T014 [US2] Enforce typed resolver precedence when both `resolver` and `atClick` exist in `src/composables/shortcut.ts` (FR-017).
- [x] T015 [US2] Implement stable shortcut identity rules (required typed `id`, deterministic legacy fallback ids) in `src/composables/shortcut.ts` (FR-018).
- [x] T016 [US2] Apply mode-valid output rules: typed `[Date, Date]` rejects in single mode, legacy `[Date, Date]` keeps first-date fallback, and range-mode `Date` normalizes to `[d, d]` in `src/composables/shortcut.ts` (FR-016).
- [x] T017 [US2] Reject blocked-date results atomically without changing current value in `src/VueTailwindDatePicker.vue` (FR-010).
- [x] T018 [US2] Emit structured `invalid-shortcut` payload and suppress `update:modelValue` on failed activations in `src/VueTailwindDatePicker.vue` (FR-012, FR-019).
- [x] T019 [US2] Make consumer-provided shortcut lists replace built-ins by default (no implicit merge) in `src/components/Shortcut.vue` and `src/VueTailwindDatePicker.vue` (FR-014).
- [x] T020 [US2] Add per-item render extension payload (`id`, `label`, `isDisabled`, `meta`, `activate`) with library-owned activation side effects in `src/components/Shortcut.vue` and `src/VueTailwindDatePicker.vue` (FR-015, FR-020).

## Phase 5: User Story 3 - Keyboard and Accessibility Support (Priority: P3)

**Goal**: Keep shortcut actions accessible and keyboard-operable across default and extended rendering.
**Independent Test**: Tab through shortcut entries, activate each with Enter/Space, and verify value updates/failure signals plus focus/close behavior stay consistent.

- [x] T021 [US3] Update shortcut item semantics for focusable, labeled controls in `src/components/Shortcut.vue` (FR-006).
- [x] T022 [US3] Route Enter/Space and pointer activation through the shared `activate()` path in `src/components/Shortcut.vue` and `src/VueTailwindDatePicker.vue` (FR-006, FR-020).
- [x] T023 [US3] Preserve existing post-activation close/open/focus behavior for keyboard-triggered shortcuts in `src/VueTailwindDatePicker.vue` (FR-020, SC-003).

## Phase 6: Final Polish & Cross-Cutting

**Purpose**: Final docs and verification across all delivered stories.

- [x] T024 [P] Update shortcut API docs for `shortcutPreset`, typed definitions, and replacement semantics in `docs/props.md` and `docs/advanced-features.md` (FR-003, FR-011, FR-014, FR-021, SC-002).
- [x] T025 [P] Document `invalid-shortcut` event payload and usage examples in `docs/events.md` and `specs/003-shortcut-extension-points/quickstart.md` (FR-012, FR-019, SC-002).
- [x] T026 Run final type/build and quickstart verification flow from `specs/003-shortcut-extension-points/quickstart.md` using scripts in `package.json` (SC-001, SC-003).
- [x] T027 Add an executable custom-shortcut + per-item render-extension integration example (using `activate()`) in `src/App.vue` and reference it in `specs/003-shortcut-extension-points/quickstart.md` (SC-002, FR-015).
- [x] T028 Add explicit timezone-boundary shortcut verification scenarios in `specs/003-shortcut-extension-points/quickstart.md` (FR-007, SC-001).
- [x] T029 Run the unit-test matrix for shortcut behavior in `tests/unit/shortcut-modern-preset.spec.ts` via the configured test script in `package.json` (SC-001).
- [x] T030 Add legacy-preset parity unit tests (default preset behavior and built-in outputs) in `tests/unit/shortcut-legacy-preset.spec.ts` (SC-001, FR-005, FR-011, FR-021).
- [x] T031 Add failure-path reason-matrix unit tests for `invalid-shortcut` (`blocked-date`, `mode-mismatch`, `resolver-error`, `invalid-result`) including payload shape, `update:modelValue` suppression, and deterministic legacy id generation in `tests/unit/shortcut-event-contract.spec.ts` (FR-012, FR-018, FR-019, SC-004).
- [x] T032 Add shortcut visibility matrix unit tests for `useRange/asSingle` combinations (visible for `false/false`, `true/false`, `true/true`; hidden for `false/true`) in `tests/unit/shortcut-visibility.spec.ts` (FR-005).
- [x] T033 Add shortcut disabled-state memoization and invalidation behavior in `src/VueTailwindDatePicker.vue` with regression coverage in `tests/unit/shortcut-event-contract.spec.ts` to prevent repeated typed resolver evaluation on unrelated rerenders (FR-022, SC-005).

## Dependencies & Execution Order

- Setup (Phase 1) must finish before Foundational (Phase 2).
- Foundational (Phase 2) blocks all user stories.
- US1 (Phase 3) is MVP and should ship first.
- US2 (Phase 4) depends on Phase 2.
- US3 (Phase 5) depends on Phase 2 and US2 completion, and validates accessibility on the final activation flow.
- Final Polish (Phase 6) runs after selected story phases are complete.

## Parallel Opportunities

- T002 and T003 can run in parallel after T001.
- T005 can run in parallel with T004 after Setup.
- T024 and T025 can run in parallel after implementation stabilizes.
- T030 and T031 can run in parallel after US2 implementation stabilizes.
- T031 and T032 can run in parallel after US2 implementation stabilizes.

## Requirements Traceability

- **US1 coverage**: FR-001, FR-002, FR-004, FR-005, FR-007, FR-008, FR-011, FR-021 -> T007-T011, T030, T032.
- **US2 coverage**: FR-003, FR-009, FR-010, FR-012, FR-013, FR-014, FR-015, FR-016, FR-017, FR-018, FR-019, FR-020, FR-022 -> T012-T020, T033.
- **US3 coverage**: FR-006, FR-020 -> T021-T023.
- **Success criteria coverage**: SC-001 -> T001/T003/T011/T026/T028/T029/T030, SC-002 -> T024/T025/T027, SC-003 -> T023/T026, SC-004 -> T018/T031, SC-005 -> T033.
