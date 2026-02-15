# Tasks: Integrated Time Selection for Date Picker

**Input**: Design documents from `specs/004-time-picker-integration/`  
**Prerequisites**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/datetime-mode-contract.md`, `quickstart.md`

**Tests**: Verified with static checks and targeted unit tests (`tests/unit/time-panel-layout.spec.ts`), plus manual quickstart matrix.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish shared datetime/time-mode types and helpers.

- [X] T001 Add datetime/time-mode state and error payload types in `src/types.ts` (mode config, drafts, endpoint selection, stable error-code enum).
- [X] T002 [P] Add formatter-token analysis and default-time normalization helpers in `src/utils.ts`.
- [X] T003 [P] Add local datetime DST validation helpers in `src/composables/date.ts`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build core integrated time plumbing used by all stories.

- [X] T004 Add time-mode props and defaults (`timePickerStyle`, wheel/page/inline controls, scroll mode, defaults) in `src/VueTailwindDatePicker.vue`.
- [X] T005 Add endpoint-scoped datetime draft state and hydration-only initialization flow in `src/VueTailwindDatePicker.vue`.
- [X] T006 Add apply guard evaluation order (formatter -> parse/input -> DST -> range ordering) in `src/VueTailwindDatePicker.vue`.
- [X] T007 Add structured blocked-apply `error` emit helper and stable payload mapping in `src/VueTailwindDatePicker.vue`.
- [X] T008 Gate commits behind explicit Apply in time-enabled modes even when `autoApply=true`.

---

## Phase 3: User Story 1 - In-Panel Time Selection (Priority: P1)

**Goal**: Select date + time in one picker surface and commit deterministically.

- [X] T009 [US1] Render integrated in-panel time controls for `input` / `wheel-inline` / `wheel-page` modes.
- [X] T010 [US1] Keep date/time draft synchronization and shape-preserving commit behavior.
- [X] T011 [US1] Render formatter-driven wheel/input variants (12h/24h, optional seconds).
- [X] T012 [US1] Keep calendar/time state synchronized when toggling page/inline modes.
- [X] T013 [US1] Block Apply with clear config error when time tokens are missing.

---

## Phase 4: User Story 2 - Range Endpoint UX and Keyboard Flow (Priority: P2)

**Goal**: Make range endpoint editing and keyboard flow predictable across styles.

- [X] T014 [US2] Preserve date-only non-regression when `timePickerStyle='none'`.
- [X] T015 [US2] Implement style-aware range endpoint rendering:
  - input mode: dual start/end inputs
  - wheel modes: active endpoint toggle + single editable endpoint.
- [X] T016 [US2] Add endpoint-toggle behavior: clicking active endpoint flips to opposite endpoint.
- [X] T017 [US2] Ensure `timePageMode='after-date'` opens Start endpoint on time page.
- [X] T018 [US2] Implement keyboard focus cycle across endpoint toggles, wheels, and footer actions.

---

## Phase 5: User Story 3 - Validation, Stability, and Wheel Hardening (Priority: P3)

**Goal**: Provide deterministic validation lifecycle and robust rendering under aggressive interaction.

- [X] T019 [US3] Normalize `defaultTime`/`defaultEndTime` and hydrate missing time without pre-Apply emit.
- [X] T020 [US3] Keep range-order errors visible until corrected (do not clear on endpoint switch).
- [X] T021 [US3] Update range-order message to human-friendly copy with start time context (time-only).
- [X] T022 [US3] Keep panel-level error visible when errored endpoint is not active.
- [X] T023 [US3] Harden minute/second/hour/meridiem carry behavior under rapid boundary oscillation.
- [X] T024 [US3] Prevent input-mode error text from expanding picker width.
- [X] T025 [US3] Reset/re-measure panel lock state on structural open-state mode switches to prevent stale layout artifacts.

---

## Phase 6: Verification and Documentation

- [X] T026 [P] Update docs for time mode props and behavior in `docs/props.md`.
- [X] T027 [P] Document blocked-apply event payload/codes/cadence in `docs/events.md`.
- [X] T028 [P] Update examples/demos in `src/App.vue` for style/scroll/range scenarios.
- [X] T029 Run static verification (`npm run typecheck`, `npm run build`) and record outcomes.
- [X] T030 Add/maintain targeted unit coverage in `tests/unit/time-panel-layout.spec.ts` for endpoint toggles, wheel carry, range validation lifecycle, and remount/layout regressions.
- [X] T031 Update spec artifacts (`spec.md`, `plan.md`, `tasks.md`, `contracts/datetime-mode-contract.md`, `quickstart.md`) to reflect shipped API and stabilization work.

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup -> Foundational -> (US1 + US2) -> US3 -> Verification/Docs.

### Parallel Opportunities

- T002 and T003 can run in parallel after T001.
- T026 and T027 can run in parallel after implementation stabilization.

## Requirement Traceability

- US1: FR-001..FR-008, FR-017
- US2: FR-004, FR-005, FR-014..FR-016, FR-019
- US3: FR-009..FR-013, FR-018, FR-020..FR-025
- Verification/docs tasks: SC-001..SC-005 and contract/documentation alignment
