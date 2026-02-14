# Data Model: Weekend Day Styling Hooks for Date Cells

## Overview

This feature extends day-cell render metadata and class-hook mapping. No persistent storage changes are introduced.

## Entities

### DayCellState

- Purpose: Complete state payload used to render one day button.
- Existing fields in scope:
  - `today: boolean`
  - `active: boolean`
  - `off: boolean`
  - `disabled: boolean`
  - `inRange: boolean | undefined`
  - `hovered: boolean`
  - `duration: boolean`
- Weekend additions:
  - `saturday: boolean`
  - `sunday: boolean`
  - `weekend: boolean` (derived from saturday/sunday)

### WeekendClassification

- Purpose: Deterministic day-of-week classification for style hooks.
- Inputs:
  - Local date day index from Dayjs (`0..6`)
- Rules:
  - `day === 6` -> Saturday
  - `day === 0` -> Sunday
  - otherwise not weekend

### DayCellClassHooks

- Purpose: Stable host-facing CSS hooks attached to day-cell buttons.
- Hook values:
  - `vtd-weekend` when `weekend === true`
  - `vtd-saturday` when `saturday === true`
  - `vtd-sunday` when `sunday === true`
- Composition rule:
  - Weekend hooks are additive and coexist with selected/range/disabled/today classes.

## Relationships

- `DayCellState` -> `WeekendClassification`: classification derives from date day index.
- `WeekendClassification` -> `DayCellClassHooks`: classification determines which weekend hooks are attached.
- `DayCellClassHooks` coexists with existing output from `datepickerClasses(date)`.

## State Transitions

1. Calendar month generation creates `DayCellState` entries for previous/current/next spillover days.
2. Each `DayCellState` receives weekend classification before render.
3. Day-button class binding combines:
   - Existing semantic class set from current logic.
   - Weekend class hooks from `DayCellClassHooks`.
4. Month navigation regenerates state and re-applies the same deterministic weekend rules.

## Invariants

- Every rendered day cell has deterministic weekend classification under fixed Saturday/Sunday semantics.
- Off-month rendered cells follow the same weekend classification and hooks as in-month cells.
- Weekend hooks do not replace existing state classes; they only add selectors.
- No new public prop is required to enable weekend hooks.
