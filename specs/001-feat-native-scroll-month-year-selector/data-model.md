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

- Purpose: current month/year values displayed and selected in selector mode.
- Fields:
  - `selectedMonth: number` (0-11)
  - `selectedYear: number` (unbounded integer)
  - `anchorYear: number` (used for virtual year windowing)

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

## Invariants

- Legacy behavior is unchanged when `selectorMode = false`.
- Single-panel range never edits hidden/non-existent second panel.
- Double-panel range selector never mutates opposite panel in v1.
- Year selection supports unbounded values without exhausting DOM rendering.
