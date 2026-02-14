# Contract: Datetime Mode Interface and Behavior

## Scope

Defines public and internal behavior contract for integrated in-panel time selection.

## Public API Contract

### `datetime`

- Type: `boolean`
- Default: `false`
- Behavior:
  - `false`: picker remains date-only with existing behavior.
  - `true`: picker enables integrated time controls and datetime validation/apply rules.

### `defaultTime`

- Type: `string | undefined`
- Behavior:
  - Used to hydrate missing time for single-date mode and range start endpoint.
  - Accepts 24-hour and 12-hour input forms.
  - Normalized to active `formatter.date` contract before use.

### `defaultEndTime`

- Type: `string | undefined`
- Behavior:
  - Used to hydrate missing time for range end endpoint.
  - Accepts 24-hour and 12-hour input forms.
  - Normalized to active `formatter.date` contract before use.

## Formatter Contract

- `formatter.date` is the only source of truth for datetime parse/format behavior.
- Valid datetime token families:
  - 24-hour: `HH:mm` or `HH:mm:ss`
  - 12-hour:
    - non-padded hour: `h:mm A`, `h:mm:ss A`, `h:mm a`, `h:mm:ss a`
    - zero-padded hour: `hh:mm A`, `hh:mm:ss A`, `hh:mm a`, `hh:mm:ss a`
- Minutes are mandatory in supported patterns.
- If `datetime=true` and formatter lacks required time tokens:
  - Apply must be blocked.
  - Inline error must be shown.
  - `error` event must emit `code='config-missing-time-token'`.

## UI and Interaction Contract

- Time selection is rendered in the same panel as calendar (no second popover).
- In datetime mode, explicit Apply is required for commit even when `autoApply=true`.
- In range datetime mode:
  - One time input is visible.
  - User must choose explicit active endpoint (`start` or `end`).
  - Start/end endpoint values stay independently editable and stored.

## Model Commit Contract

- External `v-model` shape is preserved (`string`, `array`, keyed `object`).
- Date-only mode output remains unchanged.
- Time-only edits keep existing date portion intact.
- Initialization hydration of missing time updates internal state only and does not emit `update:modelValue` until Apply/commit.

## Validation and Timezone Contract

- Parse/apply uses local timezone interpretation.
- Invalid typed times block Apply with inline error.
- Range Apply is blocked when end datetime is earlier than start datetime.
- DST spring-forward nonexistent local times block Apply with `code='dst-nonexistent-time'`.
- DST fall-back ambiguous local times resolve deterministically to first occurrence (earlier offset).

## Error Event Contract

### Event Name

- `error`

### Emission Cadence

- Emitted when user attempts Apply and Apply is blocked.
- Not emitted for every invalid keystroke or passive state transition.
- At most one event per blocked Apply attempt.

### Payload Shape

```ts
{
  type: 'configuration' | 'validation'
  code: 'config-missing-time-token' | 'invalid-time-input' | 'dst-nonexistent-time' | 'range-end-before-start'
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

- Adding a separate timezone selection UI.
- Introducing a second datetime format prop independent from `formatter.date`.
