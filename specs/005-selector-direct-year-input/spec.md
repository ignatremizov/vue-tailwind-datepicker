# Feature Specification: Direct Year Typing in Selector Mode

**Feature Branch**: `005-selector-direct-year-input`
**Created**: 2026-02-12
**Status**: Draft
**Input**: User description: "In selector mode, when toggled from header, users can type a year directly."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Type Year Directly from Selector Header Flow (Priority: P1)

As a date picker user, I can type a target year directly in selector mode after toggling from the header, so I can jump quickly without long scrolling.

**Why this priority**: This addresses the primary usability gap for far-year navigation.

**Independent Test**: Open selector mode from header, type a valid year, confirm the calendar context updates to that year.

**Acceptance Scenarios**:

1. **Given** calendar view is open, **When** user toggles selector mode from header and types `2034`, **Then** selector state updates to year `2034` when input is a valid signed year token.
2. **Given** selector mode has typed year `2034`, **When** user confirms selection, **Then** calendar view returns with month preserved and year `2034` applied.
3. **Given** user types a valid year outside the current wheel window, **When** input becomes valid, **Then** the year wheel re-anchors around that year.
4. **Given** selector mode has a valid typed year, **When** user presses Enter, **Then** current committed year is confirmed and selector mode remains open.
5. **Given** year numbering mode is `astronomical`, **When** user types `0`, **Then** `0` is accepted as a valid year token.
6. **Given** user types a valid year token, **When** value is accepted, **Then** picker performs immediate navigation zoom and emits model update for the active context.

---

### User Story 2 - Validate and Guard Invalid Year Input (Priority: P2)

As a date picker user, I get predictable behavior when year input is partial or invalid.

**Why this priority**: Validation prevents broken picker state and ambiguous year selection.

**Independent Test**: Enter invalid and partial values (e.g., non-digits, too short, out-of-range) and verify no invalid year is committed.

**Acceptance Scenarios**:

1. **Given** selector mode year input, **When** user enters whitespace/mixed paste content, **Then** input is sanitized to digits before validation.
2. **Given** selector mode year input, **When** resulting value is outside `-99999..99999`, **Then** no invalid year is committed.
3. **Given** year numbering mode is `historical`, **When** resulting value is `0`, **Then** `0` is rejected and no year is committed.
4. **Given** selector mode year input is partial/invalid, **When** user blurs input, **Then** value reverts to last valid year.
5. **Given** selector mode year input has invalid interim text, **When** user presses Escape, **Then** value reverts to last valid year.

---

### User Story 3 - Preserve Existing Scroll Selector Behavior (Priority: P3)

As a date picker user, I can still use scroll-based month/year selection even when direct year typing exists.

**Why this priority**: Direct typing should augment, not replace, existing native-like selector interaction.

**Independent Test**: Use both scroll and typed year entry in one session; verify synchronized state and no regressions.

**Acceptance Scenarios**:

1. **Given** selector mode opened with scroll columns, **When** user types year, **Then** year column syncs to typed value.
2. **Given** user scrolls year after typing, **When** value changes via scroll, **Then** input reflects active year.
3. **Given** direct-year-input feature toggle is disabled, **When** selector mode opens, **Then** behavior remains current scroll-only flow.
4. **Given** range mode is active, **When** user types a valid year token, **Then** update applies only to the active panel context.
5. **Given** range mode is active, **When** active-panel typed year temporarily inverts range chronology (`start > end`), **Then** temporary inversion is allowed and no auto-swap/reject occurs during live typing.
6. **Given** temporary range inversion exists from live typing, **When** user reaches explicit commit boundary (Apply or close-with-persist), **Then** range chronology is normalized at that boundary.
7. **Given** temporary inversion exists at commit boundary, **When** normalization is applied, **Then** endpoints are auto-swapped to preserve chronological order.
8. **Given** user exits with cancel-like actions (Escape/Cancel/backdrop), **When** no state persist occurs, **Then** commit-boundary normalization is not applied.

### Edge Cases

- Typing very large or very old years relative to generated year-window.
- Leading zeros or pasted values with whitespace.
- Locale or IME input behavior for numeric entry.
- Keyboard-only workflow (Tab, Enter, Escape) with typed year and selector panel transitions.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST allow direct numeric year input in selector mode when entered from header toggle flow.
- **FR-002**: System MUST synchronize typed year with selector/calendar state as soon as input becomes a valid signed year token.
- **FR-003**: System MUST validate year input and prevent invalid committed year state.
- **FR-004**: System MUST keep existing month selection semantics unchanged.
- **FR-005**: System MUST preserve existing scroll-based month/year selection behavior and keep it synchronized with typed input.
- **FR-006**: System MUST support keyboard interaction for year typing and confirmation.
- **FR-007**: System MUST enforce valid typed year range `-99999..99999` with optional leading `-` and 1-5 digits.
- **FR-008**: System MUST re-anchor/regenerate the year wheel window around valid typed years outside the current visible window.
- **FR-009**: System MUST resolve invalid/partial typed input deterministically: Enter confirms current valid year and keeps selector mode open; Escape reverts to last valid year; blur with invalid/partial input reverts to last valid year.
- **FR-010**: System MUST keep behavior backward compatible through a separate direct-year-input opt-in prop defaulting to off.
- **FR-011**: System MUST normalize user input by trimming whitespace, preserving an optional leading `-`, and sanitizing remaining content to digits before year validity checks.
- **FR-012**: System MUST expose a year numbering mode flag with values `historical` and `astronomical`.
- **FR-013**: In `historical` mode, year `0` MUST be invalid; in `astronomical` mode, year `0` MUST be valid.
- **FR-014**: Default year numbering mode MUST be `historical` for backward compatibility with CE/BCE-style numbering.
- **FR-015**: A valid typed year token MUST become the committed selector/calendar year immediately and MUST advance the last-valid-year baseline used by blur/Escape reversion.
- **FR-016**: A valid typed year token MUST update both internal navigation state and emitted model value for the active context (single mode or active range panel) to support immediate zoom-and-set behavior.
- **FR-017**: In range mode, typed-year updates MUST target the active panel context only.
- **FR-018**: In range mode, typed-year updates that temporarily invert chronology (`start > end`) MUST be allowed during live typing; implementation MUST NOT auto-swap or reject solely due to temporary inversion.
- **FR-019**: Temporary range inversion introduced by live typed-year updates MUST be normalized at explicit commit boundary (Apply or close-with-persist), not during live typing.
- **FR-020**: `yearNumberingMode` scope MUST apply to direct year text input validation/parsing only and MUST NOT alter non-text year-wheel behavior in this feature scope.
- **FR-021**: When normalization occurs at commit boundary for temporary inversion, implementation MUST auto-swap range endpoints to restore chronological order.
- **FR-022**: Explicit commit boundary for inversion normalization MUST include Apply and close-with-persist exits, and MUST exclude Enter key confirmation-in-place plus cancel-like exits (Escape/Cancel/backdrop dismiss).

### Key Entities _(include if feature involves data)_

- **Selector Year Input State**: Raw user-entered year text and its validated numeric value.
- **Resolved Calendar Context**: Active month/year context used to render calendar and apply selection.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can navigate to a target year by typing with no scroll interaction in selector mode.
- **SC-002**: Invalid year input never produces a committed invalid calendar state.
- **SC-003**: Existing selector-mode interaction checks for month/year scrolling remain green.
- **SC-004**: Year `0` validation behaves correctly in both numbering modes (`historical` rejects, `astronomical` accepts).
- **SC-005**: Valid typed-year tokens trigger immediate navigation zoom and model update in 100% of tested single/range flows.

## Clarifications

- **CL-001** Q: Where is direct year typing available? -> A: In selector mode entered via header toggle.
- **CL-002** Q: How does typed year interact with scroll selection? -> A: They coexist and stay synchronized.
- **CL-003** Q: When should typed year update selector/calendar context? -> A: As soon as input becomes a valid signed year token (live update).
- **CL-004** Q: What is the valid numeric domain for typed years? -> A: `-99999..99999`, with `0` validity controlled by numbering mode.
- **CL-005** Q: If typed year is outside current year wheel window, what should happen? -> A: Re-anchor/regenerate the year window around typed year.
- **CL-006** Q: How should rollout/backward compatibility be handled? -> A: Separate direct-year-input opt-in prop, default off.
- **CL-007** Q: What is invalid/partial keyboard resolution behavior? -> A: Enter confirms current valid year and keeps selector open; Escape reverts; blur invalid/partial reverts.
- **CL-008** Q: What exact rule makes typed input valid for live sync? -> A: Optional leading `-` plus 1-5 digits in `-99999..99999`, with `0` validity controlled by numbering mode.
- **CL-009** Q: When Enter is pressed on valid year, should selector close? -> A: No; commit year and stay in selector mode.
- **CL-010** Q: What is input policy for non-numeric/whitespace/paste content? -> A: Sanitize to digits (trim whitespace), then validate.
- **CL-011** Q: Should years above 9999 be supported? -> A: Yes, up to 99999.
- **CL-012** Q: Should shorter years and BC years be supported? -> A: Yes; allow 1-5 digits and negative years for BC-style input.
- **CL-013** Q: Should numbering conventions be selectable? -> A: Yes; add `historical` (no year 0) and `astronomical` (year 0 allowed) mode flag.
- **CL-014** Q: What should be the default numbering mode? -> A: `historical`.
- **CL-015** Q: What is commit vs live-sync behavior and last-valid baseline update? -> A: Valid token commits immediately and advances last-valid baseline; Enter confirms and stays open.
- **CL-016** Q: Should typed year affect only navigation or also model value? -> A: Both; update navigation and emit model update for active context.
- **CL-017** Q: In range mode, which context receives typed-year update? -> A: Active panel context only.
- **CL-018** Q: In range mode, what if active-panel typed year temporarily inverts chronology? -> A: Allow temporary inversion during live typing; no auto-swap/reject.
- **CL-019** Q: If temporary inversion is allowed during live typing, when is chronology normalized? -> A: At explicit commit boundary (Apply or close-with-persist), not on Enter key confirmation-in-place.
- **CL-020** Q: Does `yearNumberingMode` affect only direct text input or all year interactions? -> A: Direct text input validation/parsing only.
- **CL-021** Q: What exact normalization rule applies at commit boundary? -> A: Auto-swap endpoints to restore chronological order.
- **CL-022** Q: Which actions count as explicit commit boundary? -> A: Apply and close-with-persist exits; Enter-in-place and cancel-like exits do not trigger normalization.
