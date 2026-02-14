# Feature Specification: Weekend Day Styling Hooks for Date Cells

**Feature Branch**: `002-weekend-day-styling`  
**Created**: 2026-02-12  
**Status**: Draft  
**Input**: User description: "Add reliable weekend styling support (Saturday/Sunday) for `vue-tailwind-datepicker` so host apps can render weekend days with custom tinting (e.g., red) without fragile CSS overrides."

## Reference Assets

- Baseline picker UI reference: `specs/001-feat-native-scroll-month-year-selector/references/native-picker-reference.png`

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Weekend Cells Expose Stable Styling State (Priority: P1)

As a component consumer, I can detect weekend dates in day-cell render state so weekend styling is deterministic.

**Why this priority**: Weekend visibility is currently inconsistent and blocks predictable, theme-driven date-picker UX.

**Independent Test**: Render one month with known Saturdays/Sundays and verify weekend metadata/class hooks are present on each weekend cell.

**Acceptance Scenarios**:

1. **Given** a rendered calendar month, **When** day cells are generated, **Then** Saturday and Sunday cells expose explicit weekend state.
2. **Given** weekend state is exposed, **When** default classes are computed, **Then** weekend cells include `vtd-weekend`, `vtd-saturday`, or `vtd-sunday` hooks as applicable.
3. **Given** weekend state is exposed, **When** a host app applies CSS by class, **Then** weekend tinting is applied consistently across month navigation.
4. **Given** leading/trailing off-month cells are rendered, **When** those dates are Saturday/Sunday, **Then** they expose the same weekend hooks.

---

### User Story 2 - Weekend Styling Is Configurable (Priority: P2)

As a component consumer, I can customize weekend colors without patching component internals.

**Why this priority**: Consumers need theme control and cannot rely on fragile deep selectors.

**Independent Test**: Apply host CSS targeting stable weekend hooks and verify weekend color changes without modifying component source.

**Acceptance Scenarios**:

1. **Given** host CSS targets weekend hook classes, **When** calendar renders weekends, **Then** weekend cells use the host styling.
2. **Given** no host weekend CSS is provided, **When** calendar renders weekends, **Then** defaults remain backward compatible.

---

### User Story 3 - Range and Disabled States Stay Correct (Priority: P3)

As a component consumer, I can style weekends while preserving selected/range/disabled state precedence.

**Why this priority**: Weekend styling must not break selection semantics.

**Independent Test**: In range mode with disabled dates, verify weekend styling coexists with selected, in-range, and disabled visuals.

**Acceptance Scenarios**:

1. **Given** a weekend date is selected, **When** state classes are merged, **Then** selected styling still has priority.
2. **Given** a weekend date is disabled, **When** rendered, **Then** disabled styling behavior remains unchanged except additive weekend hooks.
3. **Given** a weekend date is also today or in-range, **When** rendered, **Then** weekend styling remains additive and does not override higher-priority state visuals.

### Edge Cases

- Weekend cells on leading/trailing days outside current month.
- Locale configurations where week starts on Monday or Sunday.
- Months where today is a weekend and must show both "today" and weekend styles.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST identify both Saturday and Sunday day cells with explicit weekend state.
- **FR-002**: System MUST expose stable class hooks for weekend cells: `vtd-weekend`, `vtd-saturday`, and `vtd-sunday`.
- **FR-003**: System MUST apply weekend hooks to all rendered day cells, including leading/trailing off-month cells.
- **FR-004**: System MUST allow host-level style overrides for weekend cells via stable class hooks without editing library source.
- **FR-005**: System MUST preserve existing weekday rendering behavior.
- **FR-006**: System MUST preserve selected/range/disabled/today semantics when weekend hooks are enabled (weekend styling additive only).
- **FR-007**: System MUST keep API backward compatible for existing consumers and MUST NOT require new props for weekend styling.
- **FR-008**: System MUST compute weekend using fixed Saturday/Sunday local date semantics.

### Key Entities *(include if feature involves data)*

- **Day Cell State**: Render metadata for each date cell (today, selected, in-range, disabled, weekend).
- **Style Hook Map**: Class-name mapping used by calendar rendering to style date cell states.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of Saturday/Sunday cells in QA sample months expose weekend hooks.
- **SC-002**: Host app can apply weekend tinting without deep selector hacks in at least one integration example.
- **SC-003**: Existing single/range picker behavior checks remain green after weekend-hook changes.

## Clarifications

- **CL-001** Q: What days count as weekend? -> A: Saturday and Sunday.
- **CL-002** Q: Is weekend color predefined by the component? -> A: No; requirement is hook-level support and color values are consumer-owned.
- **CL-003** Q: What is the canonical weekend hook contract on day cells? -> A: Add stable classes `vtd-weekend`, `vtd-saturday`, and `vtd-sunday`.
- **CL-004** Q: Should off-month leading/trailing cells receive weekend hooks? -> A: Yes, all rendered cells get weekend hooks.
- **CL-005** Q: What is style precedence when weekend overlaps other states? -> A: Weekend styling is additive; selected/range/disabled/today visuals keep priority.
- **CL-006** Q: How should host customization be exposed? -> A: Through stable classes only; no new prop/API required.
- **CL-007** Q: How is weekend computed? -> A: Fixed Saturday/Sunday (`day() === 6 || day() === 0`) in local-date flow.
