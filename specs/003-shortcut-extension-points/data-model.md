# Data Model: Shortcut Extension Points in Date Picker Panel

## Overview

This feature extends picker runtime state and public API contracts for shortcut execution. No persistent storage changes are required.

## Entities

### ShortcutPreset

- Purpose: Selects which built-in shortcut set the library uses when custom shortcuts are not provided.
- Type: `'legacy' | 'modern'`
- Default: `'legacy'`
- Invariant: Modern built-ins are never active unless `shortcutPreset='modern'`.

### PickerMode

- Purpose: Captures current picker selection mode.
- Type: `'single' | 'range'`
- Source: Derived from existing picker props (`useRange`, `asSingle`) and current runtime mode decisions.

### ShortcutResolverContext

- Purpose: Frozen input contract for typed shortcut resolvers.
- Shape:
  - `currentValue`: current model selection in mode-appropriate shape
  - `mode`: current picker mode
  - `now`: local timestamp captured at activation time
  - `constraints`: active date constraint adapter (including disableDate/guard checks)
- Invariant: Context keys are exactly `{ currentValue, mode, now, constraints }`.

### TypedShortcutDefinition

- Purpose: New extension-point model for deterministic shortcut resolution.
- Fields:
  - `id: string` (required stable identifier)
  - `label: string`
  - `resolver: (context) => Date | [Date, Date]`
  - `atClick?: () => Date[]` (optional legacy fallback field)
  - `meta?: Record<string, unknown>` (optional render metadata)

### LegacyShortcutDefinition

- Purpose: Backward-compatible shortcut shape already supported by the library.
- Fields:
  - `label: string`
  - `atClick: () => Date[]`
  - `id?: string` (optional user-provided id)
- Invariant: If no `id` is provided, runtime generates a deterministic id from ordered position and normalized label.

### ShortcutExecutionResult

- Purpose: Normalized intermediate result used before validation/application.
- Type:
  - `single: Date`
  - `range: [Date, Date]`
- Invariants:
  - Range mode can normalize single date into `[d, d]`.
  - Single mode rejects typed range outputs as invalid.

### InvalidShortcutEventPayload

- Purpose: Structured failure payload for rejected/failed shortcut activation.
- Fields:
  - `id: string`
  - `resolvedValue: Date | [Date, Date] | null`
  - `reason: 'blocked-date' | 'mode-mismatch' | 'resolver-error' | 'invalid-result'`
  - `mode: 'single' | 'range'`
- Invariant: Failed activations emit this payload and do not emit `update:modelValue`.

## Relationships

- `ShortcutPreset` selects active built-ins only when custom shortcuts are absent.
- Consumer-provided shortcut collections replace built-ins by default.
- `TypedShortcutDefinition` and `LegacyShortcutDefinition` feed one shared activation pipeline.
- Activation pipeline consumes `ShortcutResolverContext`, produces `ShortcutExecutionResult`, then applies or emits `InvalidShortcutEventPayload`.

## State Transitions

1. Determine active shortcut list
   - If custom shortcuts exist: use custom list only.
   - Else: use preset list from `shortcutPreset` (`legacy` or `modern`).
2. Activate shortcut
   - Triggered by click, Enter/Space, or custom render callback invoking `activate()`.
3. Resolve output
   - If typed resolver exists: execute resolver with frozen context.
   - Else execute legacy `atClick()`.
4. Normalize by mode
   - Range mode: `Date` -> `[d, d]`.
   - Single mode: typed `[Date, Date]` -> reject; legacy `[Date, Date]` -> first date.
5. Validate constraints
   - If any endpoint is blocked, reject entire result.
6. Apply or reject
   - Apply: emit/update through existing model flow and preserve existing close/open/focus behavior.
   - Reject: keep selection unchanged, emit `invalid-shortcut`, and return control without throwing.

## Invariants

- Default preset is always `legacy`.
- Typed resolver takes precedence when both resolver types exist on one item.
- Failure paths never mutate model value.
- Range results are atomic; partial acceptance is not allowed.
- All activation surfaces route through one shared library-owned `activate()` pipeline.
