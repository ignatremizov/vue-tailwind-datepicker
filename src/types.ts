import type { Dayjs } from 'dayjs'

export type LengthArray<
  T,
  N extends number,
  R extends T[] = [],
> = number extends N
  ? T[]
  : R['length'] extends N
    ? R
    : LengthArray<T, N, [T, ...R]>

export interface DatePickerDay extends Dayjs {
  today: boolean
  active: boolean
  off: boolean
  saturday: boolean
  sunday: boolean
  weekend: boolean
  disabled: boolean
  inRange: boolean | undefined
  hovered: boolean
  duration: boolean
}

export type ShortcutPreset = 'legacy' | 'modern'

export type ShortcutMode = 'single' | 'range'

export type ShortcutResolvedValue = Date | [Date, Date]

export type ShortcutInvalidReason =
  | 'blocked-date'
  | 'mode-mismatch'
  | 'resolver-error'
  | 'invalid-result'

export interface ShortcutConstraints {
  isDateBlocked: (date: Date) => boolean
}

export interface ShortcutResolverContext {
  currentValue: unknown
  mode: ShortcutMode
  now: Date
  constraints: ShortcutConstraints
}

export type ShortcutDisabledPredicate = (context: ShortcutResolverContext) => boolean

export interface LegacyShortcutDefinition {
  id?: string
  label: string
  disabled?: boolean | ShortcutDisabledPredicate
  atClick: () => Date[]
}

export interface TypedShortcutDefinition {
  id: string
  label: string
  disabled?: boolean | ShortcutDisabledPredicate
  resolver: (context: ShortcutResolverContext) => ShortcutResolvedValue
  atClick?: () => Date[]
  meta?: Record<string, unknown>
}

export type ShortcutDefinition = LegacyShortcutDefinition | TypedShortcutDefinition

export type ShortcutFactory<T extends ShortcutDefinition = ShortcutDefinition> = () => T[]

export interface InvalidShortcutEventPayload {
  id: string
  resolvedValue: ShortcutResolvedValue | null
  reason: ShortcutInvalidReason
  mode: ShortcutMode
}
