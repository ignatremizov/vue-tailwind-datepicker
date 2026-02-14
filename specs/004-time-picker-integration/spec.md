# Feature Specification: Integrated Time Selection for Date Picker

**Feature Branch**: `004-time-picker-integration`  
**Created**: 2026-02-12  
**Status**: Draft  
**Input**: User description: "Add integrated time selection after date choice within the same picker UI, without opening a second popover."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Select Date and Time in One Panel (Priority: P1)

As a date-picker user, I can select both date and time in one picker panel flow.

**Why this priority**: Current date-only flow is insufficient for general datetime precision needs.

**Independent Test**: Open picker, choose date, set time, confirm value is emitted as combined datetime.

**Acceptance Scenarios**:

1. **Given** picker panel is open, **When** user selects a date, **Then** time controls are visible in the same panel.
2. **Given** date and time are selected, **When** user applies selection, **Then** output contains both date and time while preserving existing `v-model` shape.
3. **Given** user changes only time, **When** apply occurs, **Then** date portion stays unchanged.
4. **Given** `autoApply=true` and datetime mode is enabled, **When** user picks a date/time, **Then** value is not emitted until explicit Apply.
5. **Given** datetime mode is enabled with a formatter lacking time tokens, **When** user attempts Apply, **Then** Apply is blocked and configuration error is surfaced.

---

### User Story 2 - Preserve Date-Only Backward Compatibility (Priority: P2)

As an existing consumer, I can keep date-only behavior unless datetime mode is explicitly enabled.

**Why this priority**: Avoid regressions for current integrations.

**Independent Test**: Run existing date-only usage unchanged and verify no time controls or value-format changes appear.

**Acceptance Scenarios**:

1. **Given** datetime mode is disabled, **When** picker opens, **Then** component behaves exactly as date-only flow.
2. **Given** datetime mode is enabled, **When** picker opens, **Then** time controls are present and emission waits for explicit Apply.
3. **Given** datetime mode prop is not provided, **When** picker opens, **Then** behavior remains date-only and backward compatible.
4. **Given** datetime mode is enabled and incoming model has date without time, **When** picker initializes, **Then** missing time is hydrated from `defaultTime`/`defaultEndTime` or `00:00[:00]`.

---

### User Story 3 - Reasonable Defaults and Validation (Priority: P3)

As a user, I get sensible defaults and validation for time values.

**Why this priority**: Reduces input errors and ambiguous due-time values.

**Independent Test**: Verify default time behavior, boundary validation, and invalid input handling.

**Acceptance Scenarios**:

1. **Given** no prior time is set, **When** datetime picker opens, **Then** it initializes with configurable default time.
2. **Given** range mode is enabled, **When** user sets start/end times, **Then** Apply is blocked if end datetime is earlier than start datetime.
3. **Given** local timezone DST transition makes a chosen local time invalid, **When** user applies, **Then** component rejects the invalid local datetime.
4. **Given** user types an invalid time value, **When** picker validates input, **Then** inline validation is shown and Apply remains disabled until corrected.
5. **Given** range mode is enabled, **When** user edits time values, **Then** one time control is shown with an explicit Start/End endpoint toggle.
6. **Given** Apply is blocked by invalid config or validation, **When** error is raised, **Then** inline error is shown and structured error event is emitted.
7. **Given** no prior time is set, **When** datetime picker initializes, **Then** precedence is `defaultTime`/`defaultEndTime` first, otherwise `00:00[:00]`.
8. **Given** formatter uses 12-hour tokens with meridiem or 24-hour tokens with minutes, **When** datetime mode validates format, **Then** format is accepted.
9. **Given** input/config is invalid, **When** user has not attempted Apply, **Then** blocked-apply error event is not emitted yet.
10. **Given** local time is ambiguous during DST fall-back, **When** datetime is resolved, **Then** the first occurrence (earlier offset) is selected deterministically.
11. **Given** datetime mode hydrates missing time from incoming date-only model, **When** initialization completes, **Then** no `update:modelValue` is emitted until explicit Apply/commit.

### Edge Cases

- Transition over DST boundaries, including nonexistent local times.
- 12h vs 24h display expectations.
- Range mode semantics when datetime is enabled (independent start/end times).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support datetime mode through an explicit boolean prop (default `false`) in the picker API.
- **FR-002**: System MUST render time controls in the same panel as calendar (no second popover).
- **FR-003**: System MUST emit combined date-time values while preserving existing `v-model` container shape (`string`, `array`, keyed `object`).
- **FR-004**: System MUST preserve existing date-only API behavior when datetime mode is disabled.
- **FR-005**: System MUST validate time input and prevent invalid datetime submission.
- **FR-006**: System MUST support configurable time defaults and display format.
- **FR-007**: System MUST use local timezone interpretation for parse/apply and MUST reject invalid DST local times.
- **FR-008**: In datetime mode, value commit MUST require explicit Apply even if `autoApply=true`.
- **FR-009**: In range mode with datetime enabled, start and end times MUST be independently editable and Apply MUST be blocked when end < start.
- **FR-010**: Time granularity MUST support hours+minutes, with optional seconds when formatter includes seconds.
- **FR-011**: When datetime mode is enabled and formatter output omits time tokens, system MUST treat configuration as invalid and MUST block Apply with a clear error.
- **FR-012**: Invalid typed times (including DST-nonexistent local times) MUST surface inline validation and MUST keep Apply disabled until corrected.
- **FR-013**: Datetime formatting/parsing contract MUST use `formatter.date` as the single source of truth; implementation MAY add `defaultTime` and `defaultEndTime` props for initialization.
- **FR-014**: In range mode, implementation MUST use a single time input bound to an explicit active endpoint selector (`start` or `end`), while preserving independent start/end times.
- **FR-015**: When Apply is blocked by configuration or validation, implementation MUST show inline error and emit a single structured `error` event with payload at least `{ type, code, message, field, endpoint }`, without throwing runtime exceptions.
- **FR-016**: Time initialization precedence MUST be deterministic: use `defaultTime`/`defaultEndTime` when provided, otherwise fall back to `00:00[:00]`.
- **FR-017**: In datetime mode, incoming model values missing time components MUST be auto-hydrated using `defaultTime`/`defaultEndTime` or `00:00[:00]` at initialization.
- **FR-018**: Valid datetime formatter tokens MUST include both 24-hour (`HH:mm` or `HH:mm:ss`) and 12-hour (`h:mm A`, `h:mm a`, `hh:mm A`, `hh:mm a`, with optional seconds variants) patterns, with minutes required.
- **FR-019**: Structured `error` event emission for invalid configuration/input MUST occur when Apply is attempted and blocked (not on every keystroke/state change).
- **FR-020**: `defaultTime`/`defaultEndTime` inputs MAY be provided in either 24-hour or 12-hour forms and MUST be normalized to the active `formatter.date` contract before use.
- **FR-021**: For DST fall-back ambiguous local times, resolution MUST deterministically select the first occurrence (earlier offset).
- **FR-022**: Auto-hydration of missing time components during initialization MUST update internal state only and MUST NOT emit `update:modelValue` until explicit Apply/commit.
- **FR-023**: Structured `error` payload `code` MUST use a documented minimum enum: `config-missing-time-token`, `invalid-time-input`, `dst-nonexistent-time`, and `range-end-before-start`.

### Key Entities *(include if feature involves data)*

- **DateTime Selection State**: Combined in-panel state of selected calendar day and time.
- **Time Config**: Consumer options controlling defaults, format, and validation bounds.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Date+time selection can be completed in one panel without opening additional picker overlays.
- **SC-002**: Date-only integrations pass unchanged behavior checks.
- **SC-003**: Invalid time values (including DST-invalid local times) are rejected in 100% of validation test cases.

## Clarifications

- **CL-001** Q: Where should time selection occur? -> A: Within the same picker panel.
- **CL-002** Q: Should date-only behavior remain default? -> A: Yes; datetime mode is opt-in.
- **CL-003** Q: What should `v-model` emit in datetime mode? -> A: Preserve existing container shape and include time in formatted outputs.
- **CL-004** Q: When should value emit in datetime mode when `autoApply` exists? -> A: Require explicit Apply.
- **CL-005** Q: What timezone rule should govern parsing/emission and DST? -> A: Local timezone only; reject invalid DST local times.
- **CL-006** Q: How are range start/end times handled in datetime mode? -> A: Independent start/end times; block Apply if end < start.
- **CL-007** Q: What time granularity must be supported? -> A: Hours+minutes, with optional seconds when formatter includes seconds.
- **CL-008** Q: What is the canonical API switch for datetime mode? -> A: Explicit boolean prop, default `false`.
- **CL-009** Q: What happens if datetime mode is enabled but formatter omits time tokens? -> A: Treat as invalid config; block Apply and surface clear error.
- **CL-010** Q: How should invalid typed times be handled in UI? -> A: Show inline error and keep Apply disabled until corrected.
- **CL-011** Q: What is the canonical API contract for time behavior in datetime mode? -> A: Reuse `formatter.date` as source of truth; add minimal default-time props as needed.
- **CL-012** Q: How should range datetime editing work with independent start/end values? -> A: Single time input with explicit Start/End endpoint toggle.
- **CL-013** Q: How should config/validation blocking errors be surfaced? -> A: Inline errors plus structured error events; no runtime throws.
- **CL-014** Q: What is the public error event contract? -> A: Emit single `error` event with structured payload `{ type, code, message, field, endpoint }`.
- **CL-015** Q: What is deterministic default-time precedence when no prior value exists? -> A: `defaultTime`/`defaultEndTime` first, else `00:00[:00]`.
- **CL-016** Q: What is the single source of truth for time display/input format? -> A: Infer strictly from `formatter.date` tokens.
- **CL-017** Q: In datetime mode, how should incoming date-only model values be handled? -> A: Auto-hydrate missing time via defaults at initialization.
- **CL-018** Q: Which time token patterns are valid when formatter is source of truth? -> A: Support 24-hour and 12-hour patterns with minutes required.
- **CL-019** Q: When should structured `error` events emit? -> A: On blocked Apply attempts, not every invalid keystroke/state transition.
- **CL-020** Q: What default-time input formats are accepted when formatter is 12-hour? -> A: Accept both 24-hour and 12-hour default-time inputs and normalize internally.
- **CL-021** Q: During DST fall-back ambiguity, which instant should be selected? -> A: First occurrence (earlier offset).
- **CL-022** Q: Should initialization hydration emit `update:modelValue` immediately? -> A: No; hydrate internal state and emit only on Apply/commit.
- **CL-023** Q: How stable should `error.code` values be? -> A: Define and document a minimum fixed enum for deterministic integration/tests.
