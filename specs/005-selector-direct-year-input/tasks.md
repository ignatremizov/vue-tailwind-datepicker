# Tasks: Selector Direct Year Input

**Input**: Design documents from `specs/005-selector-direct-year-input/`
**Prerequisites**: `spec.md`, `plan.md`, `data-model.md`, `research.md`, `contracts/direct-year-input-contract.md`, `quickstart.md`
**Tests**: No new automated tests requested by spec/user; use manual verification and existing typecheck/build scripts only.

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Add shared direct-year-input and year-numbering type definitions in `src/types.ts` (FR-012, FR-014).
- [x] T002 Add `directYearInput` and `yearNumberingMode` props with backward-compatible defaults in `src/VueTailwindDatePicker.vue` (FR-010, FR-012, FR-014).
- [x] T003 Add selector year-input event payload typings used by parent/child wiring in `src/types.ts` (FR-001, FR-006).

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T004 Create signed-year normalization and bounds-validation helpers in `src/composables/directYearInput.ts` (FR-007, FR-011).
- [x] T005 Add selector year-input session state (`rawText`, `parsedYear`, `isValidToken`, `lastValidYear`) in `src/VueTailwindDatePicker.vue` (FR-003, FR-015).
- [x] T006 Add shared helper to commit typed years to active selector/calendar context while preserving month in `src/VueTailwindDatePicker.vue` (FR-002, FR-004, FR-016, FR-017).
- [x] T007 Add shared helper to emit active-context `update:modelValue` during typed-year commits in `src/VueTailwindDatePicker.vue` (FR-016, FR-017).
- [x] T008 Add temporary inversion tracking and explicit commit-boundary normalization helpers in `src/VueTailwindDatePicker.vue` (FR-018, FR-019, FR-021, FR-022).

## Phase 3: User Story 1 - Type Year Directly from Selector Header Flow (Priority: P1)

**Goal**: Let users type valid years directly in selector mode entered from header toggle and get immediate navigation/model sync.
**Independent Test**: Enter selector mode from header, type `2034`, confirm immediate selector/calendar update and persisted year on confirm.

- [x] T009 [US1] Add direct year text-input UI for selector-mode year column in `src/components/Year.vue` (FR-001, FR-006).
- [x] T010 [US1] Emit year-input lifecycle events (`input`, `enter`, `escape`, `blur`) in `src/components/Year.vue` (FR-006, FR-009).
- [x] T011 [US1] Wire direct-year-input props/events through both selector panels in `src/VueTailwindDatePicker.vue` (FR-001, FR-010).
- [x] T012 [US1] Commit valid typed tokens immediately to selector/calendar year with month preserved in `src/VueTailwindDatePicker.vue` (FR-002, FR-004, FR-015).
- [x] T013 [US1] Emit immediate model updates for single and active range contexts on valid typed tokens in `src/VueTailwindDatePicker.vue` (FR-016, FR-017).
- [x] T014 [US1] Re-anchor selector year window when valid typed year falls outside the current window in `src/VueTailwindDatePicker.vue` (FR-008).
- [x] T015 [US1] Keep Enter confirmation in place without closing selector mode in `src/VueTailwindDatePicker.vue` (FR-006, FR-009, FR-022).

## Phase 4: User Story 2 - Validate and Guard Invalid Year Input (Priority: P2)

**Goal**: Ensure partial/invalid input never commits invalid state and always reverts predictably.
**Independent Test**: Enter mixed content, out-of-range values, and partial tokens; verify no invalid commit and deterministic reversion.

- [x] T016 [US2] Apply trim/sanitize pipeline for mixed or pasted input before token validation in `src/composables/directYearInput.ts` (FR-011).
- [x] T017 [US2] Enforce `historical` vs `astronomical` year-`0` validity in parsing helpers in `src/composables/directYearInput.ts` (FR-013).
- [x] T018 [US2] Block invalid/partial token commits from mutating resolved calendar/model state in `src/VueTailwindDatePicker.vue` (FR-003, FR-007).
- [x] T019 [US2] Revert invalid/partial blur text to `lastValidYear` representation in `src/VueTailwindDatePicker.vue` (FR-009).
- [x] T020 [US2] Revert Escape action to `lastValidYear` representation without new commit in `src/VueTailwindDatePicker.vue` (FR-009).
- [x] T021 [US2] Advance `lastValidYear` baseline after each valid typed token commit in `src/VueTailwindDatePicker.vue` (FR-015).

## Phase 5: User Story 3 - Preserve Existing Scroll Selector Behavior (Priority: P3)

**Goal**: Keep wheel-based interaction fully intact while typed input stays synchronized in single and range modes.
**Independent Test**: Mix scroll and typed year changes in one session, including range mode, and confirm synchronization without regressions.

- [x] T022 [US3] Synchronize year-wheel scroll changes back into direct-year input text state in `src/VueTailwindDatePicker.vue` (FR-005).
- [x] T023 [US3] Synchronize valid typed-year commits into year-wheel selected/centered state in `src/components/Year.vue` (FR-005, FR-008).
- [x] T024 [US3] Keep scroll-only behavior unchanged when `directYearInput` is disabled in `src/components/Year.vue` (FR-010, FR-020).
- [x] T025 [US3] Confirm `yearNumberingMode` affects text-input parsing only and does not alter year-wheel behavior when direct input is enabled in `src/VueTailwindDatePicker.vue` and `src/components/Year.vue` (FR-020).
- [x] T026 [US3] Route typed-year updates to active range panel context only in `src/VueTailwindDatePicker.vue` (FR-017).
- [x] T027 [US3] Allow temporary `start > end` inversion during live typed-year updates in `src/VueTailwindDatePicker.vue` (FR-018).
- [x] T028 [US3] Auto-swap inverted range endpoints only on Apply commit boundary in `src/VueTailwindDatePicker.vue` (FR-019, FR-021, FR-022).
- [x] T029 [US3] Auto-swap on close-with-persist and skip normalization for Enter/Escape/Cancel/backdrop exits in `src/VueTailwindDatePicker.vue` (FR-019, FR-022).

## Phase 6: Final Polish & Cross-Cutting

- [x] T030 [P] Document new direct-year-input props, defaults, and scope in `docs/props.md` (FR-010, FR-012, FR-014, FR-020).
- [x] T031 [P] Document direct-year selector usage and commit-boundary behavior in `README.md` (FR-001, FR-019, FR-022).
- [x] T032 Run manual validation scenarios (including locale/IME numeric-input behavior and selector scroll/wheel regression checks) and record outcomes in `specs/005-selector-direct-year-input/quickstart.md` (SC-001, SC-002, SC-003, SC-004, SC-005).
- [x] T033 Run `npm run typecheck` and `npm run build` from scripts in `package.json` (SC-003).

## Dependencies & Execution Order

Phase order: Phase 1 -> Phase 2 -> Phase 3 (US1) -> Phase 4 (US2) -> Phase 5 (US3) -> Phase 6.

Story dependencies: US1 is MVP and must complete before US2/US3; US2 depends on foundational parser/state work; US3 depends on US1 event wiring plus range-boundary helpers.

Parallel opportunities: T030 and T031 can run in parallel after US3 completion.

## Requirement Traceability

- FR-001: T003, T009, T011, T031
- FR-002: T006, T012
- FR-003: T005, T018
- FR-004: T006, T012
- FR-005: T022, T023
- FR-006: T003, T009, T010, T015
- FR-007: T004, T018
- FR-008: T014, T023
- FR-009: T010, T019, T020, T015
- FR-010: T002, T011, T024, T030
- FR-011: T004, T016
- FR-012: T001, T002, T030
- FR-013: T017
- FR-014: T001, T002, T030
- FR-015: T005, T012, T021
- FR-016: T006, T007, T013
- FR-017: T006, T007, T013, T026
- FR-018: T008, T027
- FR-019: T008, T028, T029, T031
- FR-020: T024, T025, T030
- FR-021: T008, T028
- FR-022: T008, T015, T028, T029, T031
- SC-001: T032
- SC-002: T032
- SC-003: T032, T033
- SC-004: T032
- SC-005: T032
