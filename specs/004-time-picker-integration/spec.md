# Feature Specification: Integrated Time Selection for Date Picker

**Feature Branch**: `004-time-picker-integration`
**Created**: 2026-02-12
**Updated**: 2026-02-18
**Status**: Implemented (scope expanded during polish and stabilization)
**Input**: User description: "Add integrated time selection after date choice within the same picker UI, without opening a second popover."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Select Date and Time in One Panel (Priority: P1)

As a date-picker user, I can select both date and time inside one picker surface.

**Why this priority**: Date-only selection is insufficient for datetime workflows.

**Independent Test**: Open picker in each `timePickerStyle`, set date/time, apply, verify emitted value shape is preserved and contains time.

**Acceptance Scenarios**:

1. **Given** picker is open, **When** `timePickerStyle` is not `none`, **Then** time controls are rendered in the same panel flow (no second popover).
2. **Given** `timePickerStyle='input'`, **When** user edits time text, **Then** apply commits date+time and keeps existing `v-model` container shape.
3. **Given** `timePickerStyle='wheel-inline'`, **When** user scrolls/clicks wheel values, **Then** draft time updates without leaving calendar context.
4. **Given** `timePickerStyle='wheel-page'`, **When** user toggles between calendar/time pages, **Then** selection state remains synchronized.
5. **Given** `autoApply=true` and time mode is enabled, **When** user changes date/time, **Then** no commit occurs until explicit Apply.

---

### User Story 2 - Range Endpoint Editing and Keyboard UX (Priority: P2)

As a range user, I can edit start/end time deterministically with clear focus behavior.

**Why this priority**: Range datetime editing is high-frequency and sensitive to focus/state confusion.

**Independent Test**: Exercise `asSingle` range flows in input and wheel styles, verify endpoint behavior, tab order, and page-mode transitions.

**Acceptance Scenarios**:

1. **Given** `useRange=true` and `asSingle=true` with `timePickerStyle='input'`, **When** time controls render, **Then** start/end text inputs are both visible.
2. **Given** `useRange=true` and wheel style, **When** user toggles Start/End endpoint, **Then** one endpoint is active for wheel edits and endpoint-specific draft state is preserved.
3. **Given** wheel style range mode, **When** user clicks active endpoint button again, **Then** focus toggles to the opposite endpoint.
4. **Given** `timePageMode='after-date'`, **When** user returns to time page after date selection, **Then** Start endpoint is opened by default.
5. **Given** wheel time mode is focused, **When** user presses Tab/Shift+Tab, **Then** focus cycles predictably across endpoint toggle, wheels, and footer actions.

---

### User Story 3 - Validation, Stability, and Performance (Priority: P3)

As a user, I get stable validation feedback and resilient layout/scroll behavior.

**Why this priority**: UX quality depends on deterministic errors and stable rendering under fast interactions.

**Independent Test**: Validate error lifecycle/messaging, layout stability under errors, mode switching stability, and wheel carry behavior.

**Acceptance Scenarios**:

1. **Given** end datetime is before start datetime, **When** user applies, **Then** Apply is blocked with `range-end-before-start` and inline error.
2. **Given** range-order error is visible, **When** user toggles endpoint only, **Then** error remains visible until end is corrected to be `>= start`.
3. **Given** range-order error is shown, **When** message is rendered, **Then** it uses human-friendly text and includes start time context (time-only).
4. **Given** input-mode inline error is shown, **When** text wraps, **Then** picker width does not expand.
5. **Given** user switches `wheel-page -> wheel-inline(right) -> wheel-page` while open, **When** layout re-measures, **Then** stale width/ghost rendering does not persist.
6. **Given** formatter lacks supported time tokens, **When** user applies, **Then** Apply is blocked and `config-missing-time-token` is emitted.
7. **Given** local DST produces nonexistent local time, **When** user applies, **Then** Apply is blocked with `dst-nonexistent-time`.
8. **Given** wheel minute/second boundaries are crossed rapidly, **When** carry logic runs, **Then** endpoint hour/minute carry remains deterministic without duplicate jumps.

### Edge Cases

- Switching time picker style and inline position while popover remains open.
- Fast wheel flicking across minute/second/hour boundaries in both `boundary` and `fractional` modes.
- Range validation visibility when errored endpoint is not currently active.
- Error text wrapping in constrained layouts with shortcut panel + time controls.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: Time selection mode MUST be controlled by `timePickerStyle` with values `none`, `input`, `wheel-inline`, `wheel-page`.
- **FR-002**: Any non-`none` time mode MUST render integrated time controls in the same picker surface without opening a second popover.
- **FR-003**: Commit output MUST preserve existing `v-model` container shape (`string`, `array`, keyed `object`) while including time.
- **FR-004**: Date-only behavior MUST remain unchanged when `timePickerStyle='none'`.
- **FR-005**: In time-enabled modes, commit MUST require explicit Apply regardless of `autoApply`.
- **FR-006**: `formatter.date` MUST remain the single source of truth for parse/format behavior.
- **FR-007**: Supported formatter token families MUST include 24-hour (`HH:mm`, `HH:mm:ss`) and 12-hour (`h|hh:mm[ :ss ] a|A`) patterns with minutes required.
- **FR-008**: Missing/invalid time tokens in time-enabled mode MUST block Apply and produce `config-missing-time-token`.
- **FR-009**: `defaultTime` and `defaultEndTime` MUST accept 12-hour or 24-hour forms and normalize to formatter contract.
- **FR-010**: Missing time components in incoming model values MUST be hydrated from defaults (or `00:00[:00]`) without emitting `update:modelValue` before Apply.
- **FR-011**: Range Apply MUST be blocked when end datetime is earlier than start datetime.
- **FR-012**: Invalid typed time MUST block Apply and surface inline validation.
- **FR-013**: DST-nonexistent local times MUST block Apply (`dst-nonexistent-time`), and DST-ambiguous fall-back times MUST resolve to first occurrence.
- **FR-014**: Range endpoint editing UI MUST be style-aware:
  - `input`: both start/end inputs visible in single-panel range mode.
  - wheel styles: active Start/End endpoint toggle with one editable endpoint at a time.
- **FR-015**: Clicking active Start/End endpoint toggle in wheel range mode MUST switch to the opposite endpoint.
- **FR-016**: `timePageMode='after-date'` MUST reopen time page on Start endpoint by default.
- **FR-017**: Wheel scroll mode (`boundary`/`fractional`) MUST apply to month/year selector and time wheels consistently.
- **FR-018**: Boundary carry logic for minute/second/hour/meridiem wheels MUST avoid duplicate carry on rapid boundary oscillation.
- **FR-019**: Keyboard focus cycle in wheel time mode MUST include endpoint toggle (when present), wheels, and footer actions.
- **FR-020**: Inline/panel-level validation errors MUST remain visible until corrected; endpoint switches alone MUST NOT clear range-order errors.
- **FR-021**: Range-order error message MUST be human-friendly and include start time context (time-only).
- **FR-022**: Validation error text MUST wrap without increasing picker container width.
- **FR-023**: Structural mode switches while open (time style, inline position, range layout) MUST reset and re-measure lock state to avoid stale layout artifacts.
- **FR-024**: Structured `error` events MUST emit only when Apply is attempted and blocked (not per keystroke).
- **FR-025**: Structured `error` payload MUST include `{ type, code, message, field, endpoint }` with stable minimum code enum:
  - `config-missing-time-token`
  - `invalid-time-input`
  - `dst-nonexistent-time`
  - `range-end-before-start`

### Key Entities _(include if feature involves data)_

- **DateTime Draft State**: endpoint-scoped editable date+time state with validity markers.
- **Apply Guard State**: deterministic blocked/allowed commit decision with code/field/endpoint metadata.
- **Panel Lock State**: measured width/height constraints used to stabilize inline/time-page layout transitions.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Date+time can be completed inside one picker surface for all supported time picker styles.
- **SC-002**: Date-only integrations are behaviorally unchanged in non-time mode.
- **SC-003**: Invalid time, formatter, DST, and range-order conditions block Apply with deterministic error code behavior.
- **SC-004**: Validation error rendering does not expand picker width in input mode.
- **SC-005**: Style-switch transitions while open do not leave stale layout artifacts.

## Clarifications

- **CL-001** Q: What enables datetime behavior? -> A: `timePickerStyle !== 'none'`.
- **CL-002** Q: Is `autoApply` respected for time mode? -> A: No, Apply is always explicit in time-enabled flows.
- **CL-003** Q: How are range endpoints edited in different styles? -> A: Input mode shows both fields; wheel styles use Start/End toggle with one active endpoint.
- **CL-004** Q: What should happen when clicking active endpoint toggle? -> A: Flip to the opposite endpoint.
- **CL-005** Q: Which endpoint opens in `after-date` mode? -> A: Start endpoint.
- **CL-006** Q: When should blocked `error` events fire? -> A: Only on blocked Apply attempts.
- **CL-007** Q: Should range-order errors clear on endpoint toggle? -> A: No, only when end time becomes valid relative to start.
- **CL-008** Q: How should range-order message read? -> A: Human-friendly, time-only context including start time.
- **CL-009** Q: What is required for layout stability during open-state mode toggles? -> A: Reset/re-measure lock state on structural setting changes.
- **CL-010** Q: Is wheel behavior expected under aggressive flicking? -> A: Deterministic carry with no duplicate jumps and stable re-sync.
- **CL-011** Q: Which `timePickerStyle` values are in contract? -> A: `none`, `input`, `wheel-inline`, `wheel-page`.
- **CL-012** Q: Is date-only behavior still default? -> A: Yes, `timePickerStyle='none'` preserves legacy behavior.
- **CL-013** Q: What is the parse/format source of truth? -> A: `formatter.date` only.
- **CL-014** Q: What time token families are supported? -> A: 24-hour (`HH:mm`, `HH:mm:ss`) and 12-hour (`h|hh:mm a|A` with optional seconds), minutes required.
- **CL-015** Q: What if formatter tokens are missing in time mode? -> A: Apply is blocked with `config-missing-time-token`.
- **CL-016** Q: How are `defaultTime` and `defaultEndTime` interpreted? -> A: 12-hour or 24-hour input accepted, normalized to formatter contract.
- **CL-017** Q: What happens when model values miss time components? -> A: Internal draft is hydrated from defaults/fallback (`00:00[:00]`) with no pre-Apply emit.
- **CL-018** Q: What are range ordering semantics? -> A: Apply blocked when end datetime is earlier than start (`range-end-before-start`).
- **CL-019** Q: When errored endpoint is not active in wheel range mode, should user still see error? -> A: Yes, via panel-level error projection.
- **CL-020** Q: Is wheel scroll mode shared across selector and time wheels? -> A: Yes, `boundary`/`fractional` behavior is consistently applied.
- **CL-021** Q: How is DST handled? -> A: Nonexistent local times are rejected; ambiguous fall-back times resolve to first occurrence.
- **CL-022** Q: Should validation text be allowed to resize picker width? -> A: No, messages wrap without expanding container width.
- **CL-023** Q: What is the minimum stable `error.code` enum? -> A: `config-missing-time-token`, `invalid-time-input`, `dst-nonexistent-time`, `range-end-before-start`.
