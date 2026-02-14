# Contract: Selector Direct Year Input

## Scope

Public and behavioral contract for direct year typing in selector mode.

## Public API Contract

### Props

- `directYearInput`
  - Type: `boolean`
  - Default: `false`
  - Contract: Enables direct year text entry in selector mode. When `false`, selector behavior remains scroll-only.

- `yearNumberingMode`
  - Type: `'historical' | 'astronomical'`
  - Default: `'historical'`
  - Contract: Affects direct text-input year parsing/validation only.

## Availability and Context Contract

1. Direct year input is available only in selector mode entered from header toggle flow.
2. In single-date mode, typed-year commits target the single active context.
3. In range mode, typed-year commits target active panel context only (`start` or `end`).

## Input Normalization and Validation Contract

1. Normalization pipeline:
   - trim surrounding whitespace
   - preserve at most one leading `-`
   - sanitize remaining characters to digits
2. Valid token definition:
   - optional leading `-`
   - one to five digits
   - numeric value within inclusive bounds `-99999..99999`
3. Year zero rule:
   - `historical`: `0` invalid
   - `astronomical`: `0` valid

## Live Sync and Commit Contract

1. When normalized input becomes a valid token:
   - commit year immediately to selector/calendar state for active context
   - emit model update for active context
   - advance last-valid-year baseline
   - re-anchor year wheel window if target year is outside current window
2. When input is invalid or partial:
   - do not commit a new year
   - preserve last valid committed year as current resolved state

## Keyboard and Blur Contract

- Enter:
  - confirms current committed valid year
  - keeps selector mode open
  - does not trigger range inversion normalization boundary
- Escape:
  - reverts input to last valid year
- Blur with invalid/partial token:
  - reverts input to last valid year

## Range Chronology Contract

1. Live typing may temporarily invert chronology (`start > end`) in range mode.
2. No auto-swap or rejection occurs solely due to temporary inversion during live typing.
3. Normalization boundaries for inversion:
   - Trigger normalization: `Apply`, `close-with-persist`
   - Do not trigger normalization: `Enter` confirmation-in-place, `Escape`, `Cancel`, `backdrop dismiss`
4. Normalization action: auto-swap endpoints to restore chronological order.

## Non-Regression Contract

- With `directYearInput = false`, all existing selector scroll interactions and month-selection semantics remain unchanged.
- `yearNumberingMode` does not alter non-text year wheel semantics in this feature scope.
