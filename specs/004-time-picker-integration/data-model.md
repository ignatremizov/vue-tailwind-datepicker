# Data Model: Integrated Time Selection for Date Picker

## Overview

This feature adds deterministic datetime state, endpoint projection, validation, and panel-lock entities within the existing picker component.

## Entities

### TimeModeConfig

- Purpose: normalized config for integrated time behavior.
- Fields:
  - `timePickerStyle: 'none' | 'input' | 'wheel-inline' | 'wheel-page'`
  - `timeInlinePosition: 'below' | 'right'`
  - `timePageMode: 'toggle' | 'after-date'`
  - `timeWheelScrollMode: 'boundary' | 'fractional'`
  - `uses12Hour: boolean`
  - `usesSeconds: boolean`
  - `defaultTimeNormalized: string | null`
  - `defaultEndTimeNormalized: string | null`

### EndpointSelection

- Values:
  - `start`
  - `end`

### DateTimeDraft

- Purpose: editable date+time draft for one endpoint.
- Fields:
  - `datePart: Dayjs | null`
  - `timeText: string`
  - `hour: number | null`
  - `minute: number | null`
  - `second: number | null`
  - `meridiem: 'AM' | 'PM' | null`
  - `isHydrated: boolean`
  - `isValid: boolean`
  - `errorCode: ErrorCode | null`

### RangeDraftState

- Fields:
  - `start: DateTimeDraft`
  - `end: DateTimeDraft`
  - `activeEndpoint: EndpointSelection`

### VisibleEndpointProjection

- Purpose: style-aware endpoint rendering contract.
- Derived behavior:
  - input mode + single-panel range -> both endpoints visible
  - wheel mode + single-panel range -> active endpoint only
  - dual-panel range -> both endpoints visible

### ApplyGuardState

- Fields:
  - `canApply: boolean`
  - `blockedCode: ErrorCode | null`
  - `blockedField: 'formatter' | 'time' | 'range' | null`
  - `blockedEndpoint: EndpointSelection | null`

### ErrorEventPayload

- Fields:
  - `type: 'configuration' | 'validation'`
  - `code: ErrorCode`
  - `message: string`
  - `field: 'formatter' | 'time' | 'range'`
  - `endpoint: EndpointSelection | null`

### PanelContentLockState

- Purpose: prevent open-state layout jitter and stale rendering artifacts.
- Fields:
  - `shellWidth: number`
  - `width: number`
  - `height: number`

### ErrorCode (minimum enum)

- `config-missing-time-token`
- `invalid-time-input`
- `dst-nonexistent-time`
- `range-end-before-start`

## Relationships

- `TimeModeConfig` controls all time rendering/validation paths.
- `RangeDraftState` and `VisibleEndpointProjection` together determine active editing endpoint and visible controls.
- `ApplyGuardState` is derived from draft + config checks.
- `ErrorEventPayload` is emitted only on blocked Apply attempts.
- `PanelContentLockState` is derived from measured DOM geometry and reset on structural mode changes.

## State Transitions

1. **Initialization**

- Parse incoming model value.
- Hydrate missing time parts from defaults/fallback.
- Do not emit `update:modelValue` during hydration.

2. **Edit**

- Update draft for active endpoint (or directly edited endpoint in dual-input mode).
- Update inline validation state.
- Preserve range-order error until ordering becomes valid.

3. **Endpoint toggle**

- In wheel range mode, set active endpoint.
- Clicking currently active endpoint flips to opposite endpoint.

4. **Apply attempt**

- Evaluate guard in order:
  1. formatter/token contract
  2. typed/parsed input validity
  3. DST local-time validity
  4. range ordering (`end >= start`)
- If blocked:
  - keep panel open
  - show inline/panel-level error
  - emit one structured `error` event
- If valid:
  - commit formatted datetime values preserving external model shape

5. **Structural settings changed while open**

- Reset panel lock state.
- Re-measure shell/content dimensions.
- Re-apply bounded lock styles for current mode.

## Invariants

- Date-only mode (`timePickerStyle='none'`) preserves legacy behavior.
- Time-enabled modes require explicit Apply regardless of `autoApply`.
- `formatter.date` is the single parse/format contract.
- Range-order errors clear only when corrected (not on endpoint toggle).
- Blocked Apply never throws runtime exceptions.
- Blocked Apply `error` events emit on Apply attempts only.
- Input-mode errors wrap without expanding picker width.
