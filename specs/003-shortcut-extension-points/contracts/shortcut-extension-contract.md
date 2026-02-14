# Contract: Shortcut Extension Points

## Scope

Defines public API additions and behavioral guarantees for in-panel shortcut presets, typed shortcut resolvers, render extension points, and invalid-shortcut signaling.

## Public Props

### `shortcutPreset`

- Type: `'legacy' | 'modern'`
- Default: `'legacy'`
- Behavior:
  - `legacy`: existing built-in shortcut set remains active (current default behavior).
  - `modern`: built-ins switch to Today, 3 business days, Next week, Next month.

### `shortcuts`

- Backward-compatible accepted forms:
  - `false`: no shortcuts displayed.
  - `true`: built-ins shown according to `shortcutPreset`.
  - `() => LegacyShortcutDefinition[]`: existing custom shortcut factory.
  - `TypedShortcutDefinition[] | () => TypedShortcutDefinition[]`: typed custom shortcuts.
- Behavior:
  - When custom shortcuts are provided, they replace built-ins by default.
  - No implicit custom+built-in merge occurs.

## Shortcut Definition Contracts

### Legacy shortcut shape

```ts
interface LegacyShortcutDefinition {
  id?: string
  label: string
  atClick: () => Date[]
}
```

### Typed shortcut shape

```ts
type ShortcutMode = 'single' | 'range'

type ShortcutResolverContext = {
  currentValue: unknown
  mode: ShortcutMode
  now: Date
  constraints: unknown
}

interface TypedShortcutDefinition {
  id: string
  label: string
  resolver: (context: ShortcutResolverContext) => Date | [Date, Date]
  atClick?: () => Date[]
  meta?: Record<string, unknown>
}
```

### Precedence and normalization

1. If both `resolver` and `atClick` exist, `resolver` is authoritative.
2. In range mode, single-date output normalizes to `[d, d]`.
3. In single mode:
   - typed `[Date, Date]` is invalid and rejected.
   - legacy `atClick()` `[Date, Date]` remains backward-compatible by using the first date.
4. If any resolved endpoint fails constraints, the entire result is rejected.

## Built-in Shortcut Semantics

### Modern preset (`shortcutPreset='modern'`)

- `Today`: local date at activation time.
- `3 business days`: excludes today; counts next 3 Monday-Friday dates.
- `Next week`: local date plus 7 calendar days.
- `Next month`: same day in next month, clamped to last valid day when needed.

### Legacy preset (`shortcutPreset='legacy'`)

- Preserves current built-in labels and behavior.

## Render Extension Contract

Consumers can customize per-item rendering through slot/callback while keeping activation semantics internal.

```ts
type ShortcutRenderPayload = {
  id: string
  label: string
  isDisabled: boolean
  meta?: Record<string, unknown>
  activate: () => void
}
```

- `activate()` is the only supported mutation trigger.
- Library owns selection mutation, validation, and event emission side effects.

## Events

### Existing event behavior

- `update:modelValue` is emitted only after successful shortcut application.

### `invalid-shortcut`

- Emitted whenever shortcut activation fails due to invalid output, blocked dates, or resolver failure.
- Payload contract:

```ts
type InvalidShortcutReason =
  | 'blocked-date'
  | 'mode-mismatch'
  | 'resolver-error'
  | 'invalid-result'

interface InvalidShortcutPayload {
  id: string
  resolvedValue: Date | [Date, Date] | null
  reason: InvalidShortcutReason
  mode: 'single' | 'range'
}
```

- Guarantees:
  - Failed shortcuts do not change current value.
  - Failed shortcuts do not emit `update:modelValue`.
  - Resolver exceptions do not bubble as runtime throws.

## Accessibility and Interaction Guarantees

- Shortcuts remain keyboard-focusable in panel order.
- Enter/Space activation uses the same `activate()` execution path as pointer activation.
- In-panel shortcut actions do not require secondary dialogs/popups.

## Compatibility Guarantees

- Omitting `shortcutPreset` is equivalent to `shortcutPreset='legacy'`.
- Existing consumers using legacy shortcut APIs continue to function without required changes.
- New behavior is additive and opt-in.
