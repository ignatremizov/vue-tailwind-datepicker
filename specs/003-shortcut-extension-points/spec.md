# Feature Specification: Shortcut Extension Points in Date Picker Panel

**Feature Branch**: `003-shortcut-extension-points`  
**Created**: 2026-02-12  
**Status**: Draft  
**Input**: User description: "Support in-panel quick actions (Today, 3 business days, Next week, Next month) and extensible shortcut rendering for custom picker workflows."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Built-in Date Shortcuts (Priority: P1)

As a date-picker user, I can click built-in shortcuts in the picker panel to apply common date presets quickly.

**Why this priority**: This is the core quick-selection behavior for common date workflows.

**Independent Test**: Open picker panel and click each preset; verify resulting date matches expected rule.

**Acceptance Scenarios**:

1. **Given** picker panel is open, **When** user clicks `Today`, **Then** selected date becomes current local date.
2. **Given** picker panel is open, **When** user clicks `3 business days`, **Then** selected date excludes today and lands on the third subsequent Mon-Fri day.
3. **Given** picker panel is open, **When** user clicks `Next week`, **Then** selected date becomes `today + 7 calendar days` in local time.
4. **Given** picker panel is open, **When** user clicks `Next month` from a day like Jan 31, **Then** selected date clamps to the last valid day of the next month.
5. **Given** shortcut preset opt-in is not enabled, **When** shortcuts render, **Then** legacy default shortcuts remain unchanged.
6. **Given** shortcut preset opt-in is enabled, **When** shortcuts render, **Then** new built-in shortcuts become active.
7. **Given** consumer sets `shortcutPreset='legacy'` or omits the prop, **When** shortcuts render, **Then** legacy built-in set is used by default.
8. **Given** consumer sets `shortcutPreset='modern'`, **When** shortcuts render, **Then** modern built-in shortcut set is used.

---

### User Story 2 - Consumer-Defined Shortcut Sets (Priority: P2)

As a library consumer, I can provide my own shortcut definitions and labels without forking the picker.

**Why this priority**: Different domains require different date presets.

**Independent Test**: Register custom shortcuts and verify panel renders custom actions and applies custom resolver logic.

**Acceptance Scenarios**:

1. **Given** consumer provides shortcut config, **When** picker renders, **Then** custom shortcuts are shown instead of defaults when configured.
2. **Given** consumer provides a per-item render slot/callback, **When** shortcut items are rendered, **Then** custom item UI is used while preserving internal action semantics.
3. **Given** a custom shortcut is selected, **When** action executes, **Then** emitted value matches custom resolver output.
4. **Given** a shortcut resolves to a date blocked by `disableDate`/constraints, **When** action executes, **Then** current value remains unchanged and an invalid-shortcut signal is emitted.
5. **Given** consumer provides custom shortcuts, **When** picker renders, **Then** custom shortcuts replace built-ins by default.
6. **Given** per-item render extension is used, **When** custom UI triggers activation, **Then** activation goes through library-owned `activate()` flow and preserves built-in side effects/events.
7. **Given** picker is in single mode, **When** typed resolver returns `[Date, Date]`, **Then** shortcut is rejected as invalid and no value update occurs.
8. **Given** a shortcut item defines both `atClick()` and typed `resolver(context)`, **When** shortcut executes, **Then** typed resolver takes precedence.
9. **Given** picker is in single mode and legacy `atClick()` returns `[Date, Date]`, **When** shortcut executes, **Then** first date is used for backward compatibility.
10. **Given** typed resolver throws an exception, **When** shortcut executes, **Then** shortcut fails soft, value is unchanged, and `invalid-shortcut` is emitted with `reason='resolver-error'`.
11. **Given** shortcut executes successfully, **When** post-activation behavior is evaluated, **Then** picker follows existing selection close/open/focus behavior for the current mode/props.

---

### User Story 3 - Keyboard and Accessibility Support (Priority: P3)

As a keyboard or assistive-tech user, I can discover and activate shortcuts reliably.

**Why this priority**: Shortcut panel must remain accessible and operable.

**Independent Test**: Tab through shortcuts and activate with Enter/Space; verify selection applies and focus handling remains valid.

**Acceptance Scenarios**:

1. **Given** picker is open, **When** user tabs into shortcuts, **Then** each shortcut is focusable and announced with label.
2. **Given** shortcut is focused, **When** user presses Enter/Space, **Then** shortcut action is applied.
3. **Given** consumer uses per-item render extension, **When** shortcut items are rendered, **Then** each activatable item still exposes exactly one focusable control with an accessible name.
4. **Given** keyboard focus moves through shortcuts, **When** user tabs/shift-tabs through the list, **Then** focus order follows rendered shortcut order with no trap.

### Edge Cases

- Business-day calculation across month boundaries MUST continue counting Mon-Fri days into the next month (example: Jan 30 Thursday -> Feb 4 Tuesday for `3 business days`).
- Business-day calculation when "today" is Saturday/Sunday MUST start counting from the next Monday.
- `Next month` rollover from dates that do not exist in the destination month MUST clamp to the destination month's final calendar day.
- Timezone boundaries around midnight MUST resolve from browser-local click-time `now`; render-time date snapshots MUST NOT be reused.

## Assumptions and External Dependencies

- Date arithmetic semantics (add/subtract days, month length, overflow behavior) depend on the date library implementation (currently dayjs-compatible Gregorian behavior).
- Built-in shortcut determinism depends on browser-local time (`Date`/dayjs local timezone) at activation time, not server time.
- Business-day semantics are fixed to Monday-Friday regardless of locale first-day-of-week configuration.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide two explicit built-in preset inventories: `legacy = {Today, Yesterday, Past 7 days, Past 30 days, This month, Last month}` and `modern = {Today, 3 business days, Next week, Next month}`.
- **FR-002**: System MUST execute shortcut actions within the same picker panel (no secondary popup required).
- **FR-003**: System MUST allow consumer-provided shortcut definitions and a per-item shortcut render slot/callback.
- **FR-004**: System MUST use deterministic built-in date rules. `legacy`: `Today = [today, today]`; `Yesterday = [today-1, today-1]`; `Past 7 days = [today-6, today]`; `Past 30 days = [today-29, today]`; `This month = [first day of current month, last day of current month]`; `Last month = [first day of previous month, last day of previous month]`. `modern`: `3 business days = exclude today and count next 3 Mon-Fri days`; `Next week = +7 calendar days`; `Next month = clamp to last valid day`.
- **FR-005**: System MUST preserve backward compatibility when shortcuts are disabled or unspecified, including existing shortcut visibility behavior: render shortcuts when mode resolves range-capable (`useRange=false && asSingle=false`, `useRange=true && asSingle=false`, or `useRange=true && asSingle=true`) and hide shortcuts in pure single mode (`useRange=false && asSingle=true`).
- **FR-006**: System MUST support keyboard interaction and accessibility semantics for shortcut actions: each shortcut is a focusable control with an accessible name, Enter/Space activation is supported, and tab order follows rendered shortcut order for both default-rendered and extension-rendered items.
- **FR-007**: System MUST apply built-in shortcut calculations in browser local timezone.
- **FR-008**: In range mode, single-date built-in shortcuts MUST set both endpoints to the same resolved date (`[d, d]`).
- **FR-009**: System MUST support both legacy custom shortcut handlers (`atClick(): Date[]`) and a typed resolver contract (`(context) => Date | [Date, Date]`) via backward-compatible adaptation.
- **FR-010**: When a shortcut resolves to a date blocked by configured constraints, system MUST NOT apply the value, MUST keep prior selection unchanged, and MUST emit an invalid-shortcut signal/event.
- **FR-011**: New built-in shortcut behavior MUST be opt-in; default shortcut behavior MUST remain backward compatible.
- **FR-012**: `invalid-shortcut` event MUST be emitted with structured payload containing shortcut identifier, resolved value, reason, and mode. `reason` MUST be one of `blocked-date`, `mode-mismatch`, `resolver-error`, or `invalid-result`. System MUST NOT emit `update:modelValue` on failure.
- **FR-013**: Typed resolver context MUST be explicitly defined as exactly `{ currentValue, mode, now, constraints }`; in range mode, single-date resolver output MUST normalize to `[d, d]`; validation order MUST be normalize first, then evaluate start endpoint, then evaluate end endpoint against the same constraint snapshot; if any endpoint is blocked, the full result MUST be rejected atomically.
- **FR-014**: When custom shortcuts are configured, they MUST replace built-in shortcuts by default (no implicit merge) for every supported shortcut input form (legacy array, legacy factory function, typed array, typed factory function).
- **FR-015**: Per-item render extension MUST receive shortcut metadata plus an `activate()` helper; library MUST own mutation side effects and event emission.
- **FR-016**: Resolver output MUST be mode-valid: in single mode, typed resolver `[Date, Date]` output MUST be rejected as invalid; in range mode, single `Date` MUST normalize to `[d, d]`.
- **FR-017**: If both legacy `atClick()` and typed `resolver(context)` are defined on one shortcut item, typed resolver MUST take precedence.
- **FR-018**: Typed shortcut definitions MUST include a stable unique `id`; legacy shortcut items without explicit `id` MUST receive deterministic generated ids for event payload stability.
- **FR-019**: Resolver failures MUST fail soft: no value update, emit `invalid-shortcut` with `reason='resolver-error'`, and MUST NOT throw runtime exceptions.
- **FR-020**: After successful shortcut activation, picker panel close/open/focus behavior MUST reuse existing selection semantics for the active mode/props.
- **FR-021**: Built-in shortcut preset selection MUST use a dedicated public prop `shortcutPreset` with enum `legacy | modern`; default MUST be `legacy`.

### Key Entities *(include if feature involves data)*

- **Shortcut Definition**: Label + resolver function/strategy that maps current context to target date.
- **Shortcut Item Renderer**: Per-item extension hook for shortcut UI while preserving internal action wiring.
- **Picker Context**: Current date value, timezone/locality assumptions, and active mode (single/range).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of built-in shortcuts produce expected date outputs in unit test matrix, including weekend starts, month-boundary rollover, and timezone-midnight activation cases.
- **SC-002**: Custom shortcuts and per-item rendering can be injected by API without source patching in integration example.
- **SC-003**: Keyboard-only activation works for all shortcut actions in both default and extension-rendered shortcut items, preserving valid focus traversal behavior.
- **SC-004**: For each invalid failure class (`blocked-date`, `mode-mismatch`, `resolver-error`, `invalid-result`), tests verify: `invalid-shortcut` payload includes `id`, `resolvedValue`, `reason`, and `mode`; selection value is unchanged; and no `update:modelValue` event is emitted.

## Clarifications

- **CL-001** Q: Where are shortcut actions rendered? -> A: Inside the same picker panel.
- **CL-002** Q: What does `3 business days` exclude? -> A: Saturday and Sunday.
- **CL-003** Q: What extension point is required beyond labels/resolvers? -> A: Per-item render slot/callback; no full panel override required.
- **CL-004** Q: What is the exact `Next week` rule? -> A: `today + 7 calendar days` (same weekday).
- **CL-005** Q: What rollover policy applies for `Next month` on invalid dates? -> A: Clamp to last valid day in next month.
- **CL-006** Q: In `use-range` mode, how do single-date shortcuts apply? -> A: Set `[d, d]`.
- **CL-007** Q: Which timezone basis defines built-in shortcut calculations? -> A: Browser local timezone at click time.
- **CL-008** Q: How is `3 business days` counted? -> A: Exclude today; count the next 3 Mon-Fri days.
- **CL-009** Q: What custom shortcut resolver contract should be supported? -> A: Support both legacy `atClick(): Date[]` and typed resolver with backward-compatible adapter.
- **CL-010** Q: What happens when a shortcut resolves to a blocked date? -> A: Do not apply; keep value unchanged; emit invalid-shortcut signal/event.
- **CL-011** Q: Should new built-in shortcuts be default or opt-in? -> A: Opt-in; legacy defaults remain unless enabled.
- **CL-012** Q: What is the `invalid-shortcut` contract? -> A: Emit structured payload with `reason` in `{blocked-date, mode-mismatch, resolver-error, invalid-result}` and do not emit model updates on failure.
- **CL-013** Q: What is the typed resolver contract surface? -> A: Explicit context shape plus range normalization/rejection rules.
- **CL-014** Q: When custom shortcuts are provided, how do they interact with built-ins? -> A: Custom shortcuts replace built-ins by default.
- **CL-015** Q: What is the frozen typed resolver context contract? -> A: Exactly `{ currentValue, mode, now, constraints }`.
- **CL-016** Q: What is the per-item render activation contract? -> A: Slot/callback gets shortcut metadata plus `activate()`; library handles side effects/events.
- **CL-017** Q: In single mode, how should resolver output `[Date, Date]` be handled? -> A: Reject as invalid shortcut.
- **CL-018** Q: If both `atClick()` and typed `resolver(context)` exist, which takes precedence? -> A: Typed resolver.
- **CL-019** Q: Is shortcut `id` mandatory for event payload stability? -> A: Required for typed shortcuts; legacy items use deterministic generated ids.
- **CL-020** Q: In single mode, does `[Date, Date]` rejection apply to legacy `atClick()` outputs too? -> A: No; legacy keeps backward-compatible first-date behavior.
- **CL-021** Q: How should resolver exceptions be handled? -> A: Fail soft; emit `invalid-shortcut` with `reason='resolver-error'`; no throw.
- **CL-022** Q: What is post-activation panel behavior after shortcut execute? -> A: Reuse existing selection close/open/focus semantics.
- **CL-023** Q: What is the canonical API for enabling new built-in shortcut preset while keeping legacy default? -> A: Dedicated `shortcutPreset` prop with enum `legacy | modern`; default `legacy`.
- **CL-024** Q: What exact built-ins belong to each preset? -> A: `legacy = {Today, Yesterday, Past 7 days, Past 30 days, This month, Last month}` and `modern = {Today, 3 business days, Next week, Next month}`.
- **CL-025** Q: When are shortcuts visible across `useRange`/`asSingle` combinations? -> A: Visible when `asRange()` resolves true (`false/false`, `true/false`, `true/true`); hidden in pure single mode (`false/true`).
- **CL-026** Q: Is custom replacement all-or-nothing for every shortcut input shape? -> A: Yes; legacy array, legacy factory, typed array, and typed factory all replace built-ins by default.
- **CL-027** Q: What is the constraint evaluation order for typed resolver outputs? -> A: Normalize output first, then validate start endpoint, then end endpoint; reject atomically on first blocked endpoint.
- **CL-028** Q: What are the minimum accessibility pass/fail requirements? -> A: Each shortcut is focusable, has an accessible name, supports Enter/Space activation, and follows rendered tab order in both default and extension render paths.
- **CL-029** Q: What external dependencies can alter deterministic outcomes? -> A: Dayjs date-math semantics and browser-local timezone source at click time; both are part of deterministic assumptions.
