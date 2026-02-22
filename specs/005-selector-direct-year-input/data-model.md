# Data Model: Selector Direct Year Input

## Overview

This feature adds deterministic selector-mode input state and range-normalization boundary state. No persistent storage changes are introduced.

## Entities

### DirectYearInputConfig

- Purpose: Controls feature enablement and parsing semantics.
- Fields:
  - `directYearInput: boolean` (default `false`)
  - `yearNumberingMode: 'historical' | 'astronomical'` (default `historical`)

### YearInputSessionState

- Purpose: Tracks typed token lifecycle in selector mode.
- Fields:
  - `rawText: string` (current user-entered text)
  - `normalizedText: string` (trimmed/sanitized signed token candidate)
  - `parsedYear: number | null` (parsed integer when candidate is valid)
  - `isValidToken: boolean`
  - `lastValidYear: number` (fallback target for Escape/blur reversion)

### SelectorContextState

- Purpose: Identifies where valid typed-year updates apply.
- Fields:
  - `mode: 'single' | 'range'`
  - `activePanel: 'single' | 'start' | 'end'`
  - `selectorViewOpen: boolean`

### CalendarResolvedState

- Purpose: Represents committed month/year used by selector and calendar rendering.
- Fields:
  - `monthIndex: number` (0-11)
  - `year: number`
  - `rangeStartYear: number | null`
  - `rangeEndYear: number | null`

### RangeNormalizationState

- Purpose: Tracks temporary chronology inversion and normalization boundary handling in range mode.
- Fields:
  - `hasTemporaryInversion: boolean` (`true` when `start > end` due to live typing)
  - `normalizationBoundaryPending: boolean`

### CommitBoundaryEvent

- Purpose: Enumerates actions that may or may not trigger chronology normalization.
- Values:
  - `enterInPlace`
  - `apply`
  - `closeWithPersist`
  - `escape`
  - `cancel`
  - `backdropDismiss`
  - `blur`

## State Transitions

1. Enter selector mode from header toggle:
   - Initialize `YearInputSessionState.rawText` from current committed year.
   - Set `lastValidYear` to current committed year for active context.
2. Raw input changes:
   - Recompute `normalizedText` and validity.
   - If valid token:
     - set `parsedYear`
     - commit year immediately into `CalendarResolvedState` for active context
     - emit model update for active context
     - update `lastValidYear`
     - re-anchor year wheel window if needed
   - If invalid or partial:
     - keep committed state unchanged
3. Enter key:
   - Confirm current committed year; keep selector open.
   - No chronology normalization trigger.
4. Escape key:
   - Revert raw and normalized text to `lastValidYear` representation.
   - Keep committed calendar year at the last valid value.
5. Blur with invalid/partial token:
   - Revert text fields to `lastValidYear` representation.
6. Range live typing inversion:
   - Allow `rangeStartYear > rangeEndYear` while typing.
   - Mark `hasTemporaryInversion = true` until explicit persist boundary.
7. Apply or close-with-persist:
   - If temporary inversion exists, auto-swap range endpoints.
   - Clear inversion flags.
8. Cancel-like exits (Escape/Cancel/backdrop dismiss):
   - Do not perform inversion normalization as a boundary side effect.

## Validation Rules and Invariants

- Normalized token grammar is optional leading `-` plus one to five digits.
- Numeric bounds are inclusive `-99999..99999`.
- `yearNumberingMode = historical` forbids year `0`; `astronomical` allows year `0`.
- Only valid token states can change committed year.
- In range mode, typed-year updates mutate active panel context only.
- Temporary inversion is valid live state but must not persist through Apply/close-with-persist boundaries.

## Relationships

- `DirectYearInputConfig` governs how `YearInputSessionState` is interpreted.
- `YearInputSessionState` drives updates to `CalendarResolvedState`.
- `SelectorContextState.activePanel` routes live updates in single/range modes.
- `RangeNormalizationState` is evaluated only when `CommitBoundaryEvent` is `apply` or `closeWithPersist`.
