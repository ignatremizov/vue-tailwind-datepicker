# Data Model: Integrated Time Selection for Date Picker

## Overview

This feature adds deterministic datetime state and validation entities inside the existing picker component. No persistent storage changes are required.

## Entities

### DateTimeModeConfig

- Purpose: normalized configuration that enables datetime behavior.
- Fields:
  - `datetime: boolean` (default `false`)
  - `formatterDate: string` (`formatter.date` source string)
  - `uses12Hour: boolean` (derived from formatter tokens)
  - `usesSeconds: boolean` (derived from formatter tokens)
  - `defaultTimeNormalized: string | null`
  - `defaultEndTimeNormalized: string | null`

### EndpointSelection

- Purpose: identifies active range endpoint for single time input editing.
- Values:
  - `start`
  - `end`

### DateTimeDraft

- Purpose: in-panel editable draft for one endpoint.
- Fields:
  - `datePart: Dayjs | null`
  - `timeText: string` (current input text)
  - `hour: number | null`
  - `minute: number | null`
  - `second: number | null`
  - `meridiem: 'AM' | 'PM' | null`
  - `isHydrated: boolean` (true when time came from defaults/fallback)
  - `isValid: boolean`
  - `errorCode: ErrorCode | null`

### RangeDraftState

- Purpose: datetime draft container for range mode.
- Fields:
  - `start: DateTimeDraft`
  - `end: DateTimeDraft`
  - `activeEndpoint: EndpointSelection`

### ApplyGuardState

- Purpose: records commit eligibility and blocking reasons at Apply-time.
- Fields:
  - `canApply: boolean`
  - `blockedCode: ErrorCode | null`
  - `blockedField: 'formatter' | 'time' | 'range' | null`
  - `blockedEndpoint: EndpointSelection | null`

### ErrorEventPayload

- Purpose: emitted payload for blocked Apply attempts.
- Fields:
  - `type: 'configuration' | 'validation'`
  - `code: ErrorCode`
  - `message: string`
  - `field: 'formatter' | 'time' | 'range'`
  - `endpoint: EndpointSelection | null`

### ErrorCode (minimum enum)

- `config-missing-time-token`
- `invalid-time-input`
- `dst-nonexistent-time`
- `range-end-before-start`

## Relationships

- `DateTimeModeConfig` controls validation and parse/format behavior for all `DateTimeDraft` records.
- Single-date mode uses one `DateTimeDraft`; range mode uses `RangeDraftState` with explicit `activeEndpoint`.
- `ApplyGuardState` is derived from draft + config checks.
- `ErrorEventPayload` is produced only when `ApplyGuardState.canApply=false` and user attempts Apply.

## State Transitions

1. Initialization (datetime disabled)
- Use existing date-only initialization flow.
- No time controls or datetime validation state is created.

2. Initialization (datetime enabled)
- Parse incoming model by existing container shape.
- If time components are missing, hydrate from `defaultTime`/`defaultEndTime` or fallback `00:00[:00]`.
- Mark hydrated drafts with `isHydrated=true`.
- Do not emit `update:modelValue` during hydration.

3. User edits date or time
- Update active draft fields.
- Run inline validation state updates (`isValid`, `errorCode`) without emitting blocked-apply error event.

4. User toggles active endpoint in range mode
- Switch `RangeDraftState.activeEndpoint` between `start` and `end`.
- Single visible time input binds to selected endpoint draft.

5. User attempts Apply
- Recompute `ApplyGuardState` in this order:
  1) formatter token validity
  2) endpoint time parse validity
  3) DST local-time validity
  4) range ordering (`end >= start`)
- If blocked:
  - keep current panel open
  - show inline error
  - emit one structured `error` payload
- If valid:
  - format output using `formatter.date`
  - commit via existing `v-model` shape
  - clear apply-block state

## Invariants

- Datetime mode never changes external `v-model` container shape.
- Datetime mode ignores `autoApply` and commits only on explicit Apply.
- `formatter.date` remains the sole format contract.
- Blocked Apply never throws runtime exceptions.
- Blocked Apply error events are emitted only on Apply attempts, not on every edit.
- DST ambiguous fall-back time resolves to first occurrence (earlier offset).
