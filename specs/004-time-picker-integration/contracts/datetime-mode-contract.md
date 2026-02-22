# Contract: Integrated Time Mode Interface and Behavior

## Scope

Defines public and internal behavior contract for integrated in-panel date+time selection.

## Public API Contract

### `timePickerStyle`

- Type: `'none' | 'input' | 'wheel-inline' | 'wheel-page'`
- Default: `'none'`
- Behavior:
  - `none`: date-only behavior (legacy compatibility mode).
  - `input`: text-input time controls shown with calendar.
  - `wheel-inline`: wheel controls shown inline with calendar.
  - `wheel-page`: calendar/time are page-switched within the same picker.

### `defaultTime` / `defaultEndTime`

- Type: `string | undefined`
- Behavior:
  - Used to hydrate missing time components.
  - Accept both 24-hour and 12-hour forms.
  - Normalized internally to active formatter contract before use.

### Related Time Mode Controls

- `timeInlinePosition`: `'below' | 'right'`
- `timePageMode`: `'toggle' | 'after-date'`
- `timeWheelScrollMode`: `'boundary' | 'fractional'`
- `timeWheelHeight` / `timeWheelPageHeight`: wheel sizing controls

## Formatter Contract

- `formatter.date` is the only source of truth for datetime parse/format behavior.
- Supported time token families:
  - 24-hour: `HH:mm` and `HH:mm:ss`
  - 12-hour: `h|hh:mm a|A` and optional seconds variant
- Minutes are required.
- If time mode is enabled but formatter lacks supported time tokens:
  - Apply is blocked
  - inline validation is shown
  - `error` emits with `code='config-missing-time-token'`

## UI and Interaction Contract

- Time selection remains within one picker surface (no second popover).
- In time-enabled modes, Apply is always explicit even when `autoApply=true`.
- Range endpoint UI is style-aware:
  - `input` in single-panel range: start and end text inputs are both shown.
  - wheel styles in single-panel range: one active endpoint at a time via Start/End toggle.
- In wheel styles, clicking the currently active endpoint toggle flips to the opposite endpoint.
- In `timePageMode='after-date'`, time page opens on Start endpoint.

## Model Commit Contract

- External `v-model` shape is preserved (`string`, `array`, keyed `object`).
- Date-only mode output remains unchanged.
- Time-only edits preserve selected date component.
- Initialization hydration updates internal draft only and does not emit `update:modelValue` before Apply.

## Validation and Timezone Contract

- Parse/apply uses local timezone interpretation.
- Invalid typed times block Apply with inline validation.
- Range Apply is blocked when end datetime is earlier than start datetime.
- `range-end-before-start` validation remains visible until end is corrected (`>= start`).
- Range-order error message is human-friendly and includes start time context (time-only).
- DST spring-forward nonexistent local times block Apply with `dst-nonexistent-time`.
- DST fall-back ambiguous local times resolve to first occurrence (earlier offset).

## Error Rendering and Layout Contract

- Input-mode validation errors must wrap without increasing picker container width.
- If the errored endpoint is not currently active (single-endpoint wheel view), a panel-level error message remains visible.
- Structural mode switches while open (style/inline/range layout) must reset and re-measure lock state to avoid stale render artifacts.

## Error Event Contract

### Event Name

- `error`

### Emission Cadence

- Emitted when Apply is attempted and blocked.
- Not emitted for each keystroke or passive state transition.
- At most one event per blocked Apply attempt.

### Payload Shape

```ts
{
  type: 'configuration' | 'validation'
  code: 'config-missing-time-token'
    | 'invalid-time-input'
    | 'dst-nonexistent-time'
    | 'range-end-before-start'
  message: string
  field: 'formatter' | 'time' | 'range'
  endpoint: 'start' | 'end' | null
}
```

### Minimum Stable `code` Enum

- `config-missing-time-token`
- `invalid-time-input`
- `dst-nonexistent-time`
- `range-end-before-start`

## Non-Goals

- Adding timezone selection UI.
- Introducing a second format prop independent from `formatter.date`.
- Introducing a second popover for time selection.
