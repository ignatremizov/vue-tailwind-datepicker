# Tasks: Integrated Time Selection for Date Picker

**Input**: Design documents from `specs/004-time-picker-integration/`  
**Prerequisites**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/datetime-mode-contract.md`, `quickstart.md`

**Tests**: No new automated tests are added because they were not explicitly requested; verification is via quickstart/manual checks (documented pass/fail matrix) plus build/typecheck commands.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish shared datetime types and helpers used by all stories.

- [ ] T001 Add datetime state and error payload types in `src/types.ts` covering `DateTimeModeConfig`, draft state, endpoint selection, and stable error code enum for FR-015 and FR-023.
- [ ] T002 [P] Add formatter token parsing and default-time normalization helpers in `src/utils.ts` for FR-011, FR-018, and FR-020.
- [ ] T003 [P] Add local datetime validation helpers in `src/composables/date.ts` for FR-007 and FR-021.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build core datetime mode plumbing that all user stories depend on.

**⚠️ CRITICAL**: User-story tasks start only after this phase is complete.

- [ ] T004 Add opt-in props `datetime`, `defaultTime`, and `defaultEndTime` with defaults in `src/VueTailwindDatePicker.vue` for FR-001 and FR-006.
- [ ] T005 Add datetime draft state, range endpoint selector state, and hydration-only initialization flow in `src/VueTailwindDatePicker.vue` for FR-014, FR-017, and FR-022.
- [ ] T006 Add apply guard evaluation order (formatter tokens -> input validity -> DST -> range ordering) in `src/VueTailwindDatePicker.vue` for FR-005, FR-009, FR-011, and FR-019.
- [ ] T007 Add structured `error` emit contract and blocked-apply emitter helper in `src/VueTailwindDatePicker.vue` for FR-015 and FR-023.
- [ ] T008 Update apply-button visibility/enablement gates in `src/VueTailwindDatePicker.vue` so datetime mode always requires explicit Apply even when `autoApply=true` for FR-008.

**Checkpoint**: Datetime mode infrastructure is in place and stories can be implemented incrementally.

---

## Phase 3: User Story 1 - Select Date and Time in One Panel (Priority: P1) 🎯 MVP

**Goal**: Let users choose date and time in the same picker panel and commit explicitly.

**Independent Test**: Open picker with `datetime=true`, choose date and time in-panel, click Apply, and verify emitted value preserves existing model container shape while including time.

- [ ] T009 [US1] Add integrated in-panel time controls (no second popover) in `src/VueTailwindDatePicker.vue` for FR-002.
- [ ] T010 [US1] Bind time edits to datetime draft state in `src/VueTailwindDatePicker.vue` so time-only edits preserve the selected date for FR-003.
- [ ] T011 [US1] Render formatter-driven time input modes (12h/24h, optional seconds) in `src/VueTailwindDatePicker.vue` for FR-010, FR-013, and FR-018.
- [ ] T012 [US1] Update apply commit path in `src/VueTailwindDatePicker.vue` to emit combined datetime while preserving `string`/`array`/keyed-object shape for FR-003 and FR-013.
- [ ] T013 [US1] Block Apply and show inline configuration error in `src/VueTailwindDatePicker.vue` when datetime formatter omits required time tokens for FR-011.

**Checkpoint**: MVP datetime selection flow works end-to-end in a single panel.

---

## Phase 4: User Story 2 - Preserve Date-Only Backward Compatibility (Priority: P2)

**Goal**: Keep date-only behavior unchanged unless datetime mode is explicitly enabled.

**Independent Test**: Run existing date-only usage without `datetime`; verify no time UI appears, existing auto-apply/date-only flows remain unchanged, and emitted values match pre-feature behavior.

- [ ] T014 [US2] Preserve legacy date-only rendering and selection flow behind `datetime` guards in `src/VueTailwindDatePicker.vue` for FR-004.
- [ ] T015 [US2] Implement deterministic missing-time hydration on initialization in `src/VueTailwindDatePicker.vue` using defaults/fallback without immediate emit for FR-016, FR-017, and FR-022.
- [ ] T016 [US2] Keep date-only `autoApply` semantics unchanged while applying explicit-Apply override only in datetime mode in `src/VueTailwindDatePicker.vue` for FR-004 and FR-008.
- [ ] T017 [US2] Add side-by-side date-only vs datetime demo states in `src/App.vue` to verify opt-in behavior and non-regression for SC-002.

**Checkpoint**: Existing integrations remain backward compatible by default.

---

## Phase 5: User Story 3 - Reasonable Defaults and Validation (Priority: P3)

**Goal**: Provide deterministic defaults, validation, DST handling, and structured blocked-apply errors.

**Independent Test**: Validate default-time precedence, invalid typed-time blocking, range end-before-start blocking, DST nonexistent rejection, DST ambiguous first-occurrence resolution, and blocked-apply error event cadence.

- [ ] T018 [US3] Normalize `defaultTime`/`defaultEndTime` input formats in `src/utils.ts` and consume normalized values in `src/VueTailwindDatePicker.vue` for FR-006, FR-016, and FR-020.
- [ ] T019 [US3] Add inline typed-time validation states and Apply disablement in `src/VueTailwindDatePicker.vue` for FR-005 and FR-012.
- [ ] T020 [US3] Implement single time input with explicit Start/End endpoint toggle in `src/VueTailwindDatePicker.vue` while preserving independent endpoint drafts for FR-014.
- [ ] T021 [US3] Enforce range ordering validation (`end >= start`) and endpoint-aware blocking metadata in `src/VueTailwindDatePicker.vue` for FR-009 and FR-015.
- [ ] T022 [US3] Enforce local-time DST rules in `src/composables/date.ts` and `src/VueTailwindDatePicker.vue` by rejecting nonexistent times and resolving ambiguous fall-back times to first occurrence for FR-007 and FR-021.
- [ ] T023 [US3] Emit one structured blocked-apply `error` event per Apply attempt in `src/VueTailwindDatePicker.vue` (not per keystroke) for FR-019 and FR-023.
- [ ] T024 [US3] Map validation/configuration failures to inline error messages and stable error codes in `src/VueTailwindDatePicker.vue` for FR-015 and FR-023.

**Checkpoint**: Validation and deterministic defaults are complete across single and range datetime flows.

---

## Phase 6: Final Polish & Cross-Cutting

**Purpose**: Final documentation and verification across all stories.

- [ ] T025 [P] Document datetime props, default-time behavior, and formatter token requirements in `docs/props.md` for FR-001, FR-006, FR-018, and FR-020.
- [ ] T026 [P] Document blocked-apply `error` event payload/codes and emission cadence in `docs/events.md` for FR-015, FR-019, and FR-023.
- [ ] T027 [P] Add datetime usage examples and migration notes in `README.md` for SC-001 and SC-002.
- [ ] T028 Run quickstart manual verification matrix and record results in `specs/004-time-picker-integration/quickstart.md` for SC-001, SC-002, and SC-003.
- [ ] T029 Run `npm run typecheck` and `npm run build`, then log outcomes in `specs/004-time-picker-integration/quickstart.md` for SC-003.
- [ ] T030 Record explicit pass/fail evidence for required datetime scenarios (single, range, formatter-invalid, DST-invalid, hydration) in `specs/004-time-picker-integration/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1) -> Foundational (Phase 2) -> (US1 (Phase 3) and US2 (Phase 4) in parallel) -> US3 (Phase 5) -> Final Polish (Phase 6).

### User Story Dependencies

- US1 depends on T001-T008.
- US2 depends on T001-T008 and can proceed in parallel with US1.
- US3 depends on T001-T008 and builds on US1-US2 datetime + compatibility flows.

### Parallel Opportunities

- T002 and T003 can run in parallel after T001.
- T025, T026, and T027 can run in parallel after US3 completion.

---

## Requirement Traceability

- US1 (T009-T013) covers FR-002, FR-003, FR-010, FR-011, FR-013, FR-018.
- US2 (T014-T017) covers FR-001, FR-004, FR-008, FR-016, FR-017, FR-022.
- US3 (T018-T024) covers FR-005, FR-006, FR-007, FR-009, FR-012, FR-014, FR-015, FR-019, FR-020, FR-021, FR-023.
- Setup/Foundational tasks (T001-T008) provide shared enforcement for FR-001, FR-005, FR-006, FR-008, FR-009, FR-011, FR-014, FR-015, FR-017, FR-019, FR-022, FR-023.
