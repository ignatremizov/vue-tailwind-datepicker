# Tasks: Weekend Day Styling Hooks for Date Cells

**Input**: Design documents from `specs/002-weekend-day-styling/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/weekend-day-styling-contract.md`, `quickstart.md`

## Format: `- [ ] T### [P?] [US#?] Description with file path`

- `[P]` marks tasks that are safe to run in parallel (different files, no direct dependency).
- `[US#]` is required on user-story tasks (`US1`, `US2`, `US3`).
- Requirement and success-criteria traceability is provided in the mapping section at the end of this file.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare verification artifacts and baseline quality evidence before code changes.

- [ ] T001 Record pre-change `npm run typecheck` and `npm run build` results in `specs/002-weekend-day-styling/quickstart.md`
- [ ] T002 Add an implementation evidence log section for story-by-story validation in `specs/002-weekend-day-styling/quickstart.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core weekend-state scaffolding required by all user stories.

**CRITICAL**: No user-story implementation starts until this phase is complete.

- [ ] T003 Extend `DatePickerDay` weekend state fields (`saturday`, `sunday`, `weekend`) in `src/types.ts`
- [ ] T004 Add a shared weekend-classification helper (`day() === 6 || day() === 0`) in `src/VueTailwindDatePicker.vue`
- [ ] T005 Wire weekend-classification helper usage into day-cell generation scaffolding for both calendar panels in `src/VueTailwindDatePicker.vue`

**Checkpoint**: Shared type and classification primitives are ready for story delivery.

---

## Phase 3: User Story 1 - Weekend Cells Expose Stable Styling State (Priority: P1) MVP

**Goal**: Weekend state and class hooks are deterministic for every rendered day cell.

**Independent Test**: Render a month with known weekends and verify weekend metadata/class hooks exist on weekend cells, including off-month cells.

- [ ] T006 [US1] Populate `saturday`, `sunday`, and `weekend` flags for previous-panel day cells in `src/VueTailwindDatePicker.vue`
- [ ] T007 [US1] Populate `saturday`, `sunday`, and `weekend` flags for next-panel day cells in `src/VueTailwindDatePicker.vue`
- [ ] T008 [US1] Append `vtd-weekend`, `vtd-saturday`, and `vtd-sunday` class hooks in day-button bindings in `src/components/Calendar.vue`
- [ ] T009 [US1] Validate weekend hook presence across month navigation and off-month cells, then capture evidence in `specs/002-weekend-day-styling/quickstart.md`

**Checkpoint**: Weekend hooks are present and deterministic across both calendar panels.

---

## Phase 4: User Story 2 - Weekend Styling Is Configurable (Priority: P2)

**Goal**: Consumers can tint weekends with stable hooks and no source patching.

**Independent Test**: Apply host CSS against weekend hook classes and verify weekend tinting works without internal component edits.

- [ ] T010 [P] [US2] Document weekend hook usage and CSS override examples in `README.md`
- [ ] T011 [P] [US2] Document weekend hook theming guidance in `docs/theming-options.md`
- [ ] T012 [US2] Add a host-style weekend tint demonstration scenario in `src/App.vue`
- [ ] T013 [US2] Execute host-CSS customization verification and record outcomes in `specs/002-weekend-day-styling/quickstart.md`

**Checkpoint**: Weekend customization flow is documented and proven in integration usage.

---

## Phase 5: User Story 3 - Range and Disabled States Stay Correct (Priority: P3)

**Goal**: Weekend hooks remain additive while selected/range/disabled/today semantics keep priority.

**Independent Test**: In range mode with disabled dates, verify weekend hooks coexist with selected, in-range, disabled, and today states without regressions.

- [ ] T014 [US3] Keep weekend hook class merge additive after base semantic classes in `src/components/Calendar.vue`
- [ ] T015 [US3] Validate selected and in-range weekend overlap behavior using demo flows in `src/App.vue`
- [ ] T016 [US3] Validate disabled and today-weekend overlap behavior and record evidence in `specs/002-weekend-day-styling/quickstart.md`
- [ ] T017 [US3] Confirm no new required props/events were introduced for weekend styling in `src/VueTailwindDatePicker.vue`

**Checkpoint**: Weekend hooks are additive and non-weekend semantics remain intact.

---

## Phase 6: Final Polish & Cross-Cutting Validation

**Purpose**: Run final quality gates and finalize requirement coverage evidence.

- [ ] T018 Run final `npm run typecheck` and log status in `specs/002-weekend-day-styling/quickstart.md`
- [ ] T019 Run final `npm run build` and log status in `specs/002-weekend-day-styling/quickstart.md`
- [ ] T020 Reconcile the QA matrix and requirement evidence log against FR-001..FR-008 in `specs/002-weekend-day-styling/quickstart.md`
- [ ] T021 Execute explicit weekday non-regression checks (non-weekend cells unchanged in single/range flows) and capture evidence in `specs/002-weekend-day-styling/quickstart.md`
- [ ] T022 Run month-navigation responsiveness sanity checks and record observations in `specs/002-weekend-day-styling/quickstart.md`

---

## Dependencies & Execution Order

### Phase dependencies

- Setup (Phase 1) -> Foundational (Phase 2) -> US1 (Phase 3) -> US2 (Phase 4) -> US3 (Phase 5) -> Final Polish (Phase 6).
- User-story phases depend on completion of T003-T005.

### Story dependencies

- **US1 (P1)**: Depends on foundational typing/classification tasks T003-T005.
- **US2 (P2)**: Depends on weekend hooks being available from US1 (T006-T009).
- **US3 (P3)**: Depends on US1 hook wiring and US2 integration/docs context (T006-T013).

### Parallel opportunities

- T010 and T011 can run in parallel (separate documentation files).

## Requirement Traceability

- FR-001: T003, T004, T006, T007
- FR-002: T008
- FR-003: T005, T006, T007, T008
- FR-004: T010, T011, T012
- FR-005: T005, T017, T021
- FR-006: T014, T015, T016
- FR-007: T010, T011, T017
- FR-008: T003, T004, T006, T007
- SC-001: T009, T020
- SC-002: T010, T011, T012, T013, T020
- SC-003: T001, T002, T015, T016, T018, T019, T020, T021
