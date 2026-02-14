# Contract: Weekend Day Styling Hooks

## Scope

Public styling-surface and internal behavior contract for weekend day-cell hooks in `vue-tailwind-datepicker`.

## Public Contract

### Stable Day-Cell Hooks

Each rendered day-cell button (`.vtd-datepicker-date`) MUST expose weekend classes as follows:

- `vtd-weekend` on Saturday and Sunday cells.
- `vtd-saturday` on Saturday cells only.
- `vtd-sunday` on Sunday cells only.

### Coverage Guarantee

Weekend hooks MUST be applied to all rendered day cells, including:

- Current-month cells
- Leading off-month cells
- Trailing off-month cells

### Backward-Compatibility Guarantee

- No new prop or option is required.
- Existing props and emitted events remain unchanged.
- Existing class semantics for non-weekend states remain unchanged.

## Behavioral Contract

### Weekend Classification

- Weekend is computed from local date day index:
  - Saturday: `day() === 6`
  - Sunday: `day() === 0`
- Classification is deterministic and independent of first-day-of-week display preferences.

### Precedence and Additivity

- Weekend hooks are additive selectors only.
- Selected/range/disabled/today visual semantics keep existing priority behavior.
- Weekend hooks MUST NOT suppress or replace existing state classes.

## Internal Interface Contract

### Day-Cell State Shape

`DatePickerDay` state MUST include weekend-disambiguation data sufficient to derive all three hooks (`weekend`, `saturday`, `sunday`), while preserving current fields used by existing rendering logic.

### Render Pipeline Consistency

Both calendar panels (`previous` and `next`) MUST use identical weekend-classification and hook-attachment rules.

## Non-Goals

- No default weekend color/tint values are introduced by this contract.
- No locale-specific weekend calendar definitions are introduced.
- No new styling API beyond stable class hooks is introduced.
