# Tasks: Native-Like Month/Year Scrolling Selector

**Input**: Design documents from `specs/001-feat-native-scroll-month-year-selector/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/selector-mode-contract.md`, `quickstart.md`

## Format: `[ID] [P?] [Story] Description`

- `[P]`: Can run in parallel (different files, no direct dependency)
- `[Story]`: `US1`, `US2`, `US3`, `US4`, or `Shared`
- Each task includes requirement mapping tags (FR/SC)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Introduce the feature scaffolding without changing default behavior.

- [x] T001 [Shared] Update `specs/001-feat-native-scroll-month-year-selector/contracts/selector-mode-contract.md` to document `selectorMode`, toggle behavior, and range-context semantics [FR-008]
- [x] T002 [Shared] Add implementation TODO checkpoints in `specs/001-feat-native-scroll-month-year-selector/quickstart.md` for manual verification runs [SC-001, SC-004]

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core state and toggling primitives that all stories depend on.

**⚠️ CRITICAL**: No user-story completion before this phase is done.

- [x] T003 [Shared] Add `selectorMode?: boolean` prop (default `false`) in `src/VueTailwindDatePicker.vue` [FR-008]
- [x] T004 [Shared] Add internal state entities in `src/VueTailwindDatePicker.vue`: `pickerViewMode`, `selectorFocus`, `selectionContext`, `selectorState` [FR-001, FR-003]
- [x] T005 [Shared] Implement view toggle handlers in `src/VueTailwindDatePicker.vue` for calendar <-> selector transitions [FR-001, FR-005, FR-012]
- [x] T006 [Shared] Extend `src/components/Header.vue` emit/props to trigger selector mode entry and focus (`month`/`year`) [FR-001, FR-012]

**Checkpoint**: Foundational selector state and mode transitions are working behind opt-in prop.

---

## Phase 3: User Story 1 - Switch from Calendar to Scroll Selectors (Priority: P1) 🎯 MVP

**Goal**: Header click toggles calendar/selector mode with native-like flow.

**Independent Test**: With `:selector-mode="true"`, clicking month/year in header enters selector view; toggling back returns to calendar with applied month/year.

### Implementation for User Story 1

- [x] T007 [US1] Add selector-view rendering branch in `src/VueTailwindDatePicker.vue` while preserving current calendar rendering [FR-001, FR-012]
- [x] T008 [P] [US1] Add month selector UI component implementation in `src/components/Month.vue` (or new selector component wired here) with scrollable interaction [FR-002, FR-004]
- [x] T009 [P] [US1] Add year selector UI component implementation in `src/components/Year.vue` (or new selector component wired here) with scrollable interaction [FR-002, FR-004]
- [x] T010 [US1] Wire Header interaction to selector focus (month/year) and selector-to-calendar toggle in `src/VueTailwindDatePicker.vue` [FR-001, FR-005, FR-012]
- [x] T011 [US1] Ensure default mode (`selectorMode=false`) path uses legacy month/year panels unchanged in `src/VueTailwindDatePicker.vue` [FR-008]

**Checkpoint**: Selector mode flow is functional and legacy flow still works when disabled.

---

## Phase 4: User Story 2 - Scroll and Select Month/Year Efficiently (Priority: P1)

**Goal**: Native-like month/year scrolling and selection updates active calendar context.

**Independent Test**: In selector mode, scrolling/selecting month/year updates displayed calendar period smoothly, and target month/year can be reached in <=2 direct interactions after selector view is opened (excluding scroll distance).

### Implementation for User Story 2

- [x] T012 [US2] Implement month selection handler in `src/VueTailwindDatePicker.vue` that updates active context without popover close [FR-003, FR-012]
- [x] T013 [US2] Implement year selection handler in `src/VueTailwindDatePicker.vue` that updates active context without popover close [FR-003, FR-012]
- [x] T014 [US2] Add virtually unbounded year window generation/anchoring logic in `src/VueTailwindDatePicker.vue` and/or `src/composables/date.ts` [FR-011]
- [x] T015 [US2] Add scroll-snap and item-state styling for selector lists in `src/index.css` (and any related component classes) [FR-004, FR-010]
- [x] T016 [US2] Validate selector update latency and avoid heavy per-scroll recomputation in `src/VueTailwindDatePicker.vue` [SC-004]

**Checkpoint**: Selector interactions are smooth and correctly drive month/year changes.

---

## Phase 5: User Story 3 - Preserve Existing Date-Picker Behavior (Priority: P2)

**Goal**: Preserve single/range semantics and apply behavior with new selector mode.

**Independent Test**: Single, single-panel range, and double-panel range all retain expected model semantics.

### Implementation for User Story 3

- [x] T017 [US3] Implement `selectionContext` derivation for single mode and single-panel range (`use-range` + `as-single`) in `src/VueTailwindDatePicker.vue` [FR-006]
- [x] T018 [US3] Implement per-panel context routing for double-panel range (clicked header determines panel) in `src/VueTailwindDatePicker.vue` [FR-006]
- [x] T019 [US3] Verify autoApply/manual apply behavior remains unchanged after selector updates in `src/VueTailwindDatePicker.vue` [FR-007]
- [x] T020 [US3] Ensure keyboard entry/exit focus management for selector mode in `src/VueTailwindDatePicker.vue` and `src/components/Header.vue` [FR-009]
- [x] T021 [US3] Manual non-regression run for range panel sync edge cases using `src/App.vue` demo scenarios [SC-003, SC-004]

**Checkpoint**: Existing model semantics and accessibility behavior are preserved.

---

## Phase 6: User Story 4 - Customizable and Backward Compatible API Surface (Priority: P3)

**Goal**: Provide clear opt-in API and integration guidance.

**Independent Test**: Consumers can enable/disable selector mode with no breakage.

### Implementation for User Story 4

- [x] T022 [US4] Document new `selectorMode` prop in `README.md` with examples for single and range usage [FR-008]
- [x] T023 [US4] Add opt-in selector mode example in `src/App.vue` for manual verification [FR-008, SC-001]
- [x] T024 [US4] Ensure emitted behavior and exposed API remain unchanged unless `selectorMode` is enabled in `src/VueTailwindDatePicker.vue` [FR-008]
- [x] T030 [US4] Add configurable selector year scroll mode (`boundary` default, `fractional` experimental) in `src/VueTailwindDatePicker.vue` and `src/components/Year.vue` [FR-008, FR-011]
- [x] T031 [US4] Add both selector year-scroll variants in `src/App.vue` for side-by-side UX validation [SC-004]
- [x] T032 [US1] Update selector-mode header to a single combined month+year toggle and hide side arrows in selector mode in `src/components/Header.vue` [FR-001, FR-018]
- [x] T033 [US2] Ensure selector item click recenters wheel/list with smooth motion in `src/components/Month.vue` and `src/components/Year.vue` [FR-015, FR-016]
- [x] T034 [US2] Stabilize selector-mode container dimensions across view toggles in `src/VueTailwindDatePicker.vue` [FR-014]
- [x] T035 [US4] Add configurable selector focus tint behavior in `src/VueTailwindDatePicker.vue` and demo usage in `src/App.vue` [FR-013]

**Checkpoint**: API is backward compatible and documented.

---

## Phase 7: Polish & Verification

**Purpose**: Final checks across all stories.

- [x] T025 [Shared] Run `npm run typecheck` and address failures [SC-003]
- [x] T026 [Shared] Run `npm run build` and address failures [SC-001, SC-003]
- [x] T027 [Shared] Execute quickstart verification checklist in `specs/001-feat-native-scroll-month-year-selector/quickstart.md` and record outcomes in PR notes [SC-001, SC-004]
- [x] T028 [Shared] Verify and document SC-002 interaction-count criterion (<=2 direct interactions after selector open, excluding scroll distance) using `src/App.vue` scenarios [SC-002]
- [x] T029 [Shared] Execute and document edge-case matrix checks (far-year offsets, small screens, disabled-date constraints, invalid/empty model, double-panel clicked-context) in `specs/001-feat-native-scroll-month-year-selector/quickstart.md` [FR-004, FR-006, FR-007, FR-010, FR-011, SC-004]

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 -> Phase 2 -> Phase 3/4/5/6 -> Phase 7
- User stories begin only after Phase 2 checkpoint.

### User Story Dependencies

- **US1 (P1)**: Depends on foundational tasks T003-T006.
- **US2 (P1)**: Depends on US1 rendering/toggle baseline (T007-T011).
- **US3 (P2)**: Depends on US1 + US2 handlers.
- **US4 (P3)**: Depends on stable behavior from US1-US3.

### Parallel Opportunities

- T008 and T009 can run in parallel.
- T022 and T023 can run in parallel after US3 stabilizes.
- Final verification T025 and T026 can run in sequence; T027-T029 after both pass.

## Implementation Strategy

### MVP First

1. Complete Phases 1-2.
2. Complete US1.
3. Complete US2.
4. Validate with T025-T026 before moving to higher-priority polish.

### Incremental Delivery

1. Deliver opt-in toggle + selector entry/exit (US1).
2. Deliver full scroll selection and unbounded years (US2).
3. Harden range/accessibility semantics (US3).
4. Finalize docs and demo integration (US4).
