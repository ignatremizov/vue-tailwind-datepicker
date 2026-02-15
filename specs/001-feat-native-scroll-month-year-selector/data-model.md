# Data Model: Native-Like Month/Year Scrolling Selector

## Overview

This feature introduces UI state entities only. No persistent storage changes.

## Entities

### PickerViewMode

- Purpose: controls which major picker view is shown.
- Values:
  - `calendar`
  - `selector`

### SelectorFocus

- Purpose: controls which selector column is primary.
- Values:
  - `month`
  - `year`

### SelectionContext

- Purpose: identifies which calendar context receives month/year changes.
- Values:
  - `single` (single-date mode)
  - `singleRangeDisplayed` (single-panel range; displayed month/year)
  - `previousPanel` (double-panel range, left)
  - `nextPanel` (double-panel range, right)

### SelectorState

- Purpose: active-context selector synchronization state used for focus and year-window anchoring.
- Fields:
  - `selectedMonth: number` (0-11)
  - `selectedYear: number` (unbounded integer)
  - `anchorYear: number` (used for virtual year windowing)
- Note: in dual-panel selector mode, each panel displays selected month/year from its own calendar context (`previous`/`next`) rather than from a single shared displayed tuple.

### SelectorPanelState

- Purpose: controls per-panel selector visibility in double-panel range mode.
- Fields:
  - `previous: boolean`
  - `next: boolean`

### FeatureConfig

- Purpose: opt-in behavior gate.
- Fields:
  - `selectorMode: boolean` (default `false`)

## State Transitions

1. Header month/year click in calendar view:
   - `PickerViewMode: calendar -> selector`
   - `SelectorFocus` set from clicked header element.
   - `SelectionContext` derived from active panel/mode.
2. Selector value change:
   - updates `SelectorState` and calendar context month/year.
3. Toggle back to calendar:
   - `PickerViewMode: selector -> calendar`
   - calendar reflects selected month/year.
4. Double-panel selector toggles:
   - opening/toggling one panel selector updates only that panel's visibility flag.
   - both panel selectors may be open simultaneously.
   - closing both selectors returns view to calendar mode.

## Invariants

- Legacy behavior is unchanged when `selectorMode = false`.
- Single-panel range never edits hidden/non-existent second panel.
- Double-panel range selector never mutates opposite panel in v1.
- Double-panel selectors may be open simultaneously, but each panel reads/writes only its own month/year context.
- Year selection supports unbounded values without exhausting DOM rendering.
