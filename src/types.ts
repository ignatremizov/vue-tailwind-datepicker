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

export type ShortcutInvalidReason
  = | 'disabled'
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

export const DATETIME_ERROR_CODES = [
  'config-missing-time-token',
  'invalid-time-input',
  'dst-nonexistent-time',
  'range-end-before-start',
] as const

export type DateTimeErrorCode = (typeof DATETIME_ERROR_CODES)[number]
export type DateTimeErrorType = 'configuration' | 'validation'
export type DateTimeErrorField = 'formatter' | 'time' | 'range'
export type DateTimeEndpointSelection = 'start' | 'end'
export type DateTimeMeridiem = 'AM' | 'PM'

export interface DateTimeModeConfig {
  datetime: boolean
  formatterDate: string
  uses12Hour: boolean
  usesSeconds: boolean
  defaultTimeNormalized: string | null
  defaultEndTimeNormalized: string | null
}

export interface DateTimeDraft {
  datePart: Dayjs | null
  timeText: string
  hour: number | null
  minute: number | null
  second: number | null
  meridiem: DateTimeMeridiem | null
  isHydrated: boolean
  isValid: boolean
  errorCode: DateTimeErrorCode | null
}

export interface RangeDraftState {
  start: DateTimeDraft
  end: DateTimeDraft
  activeEndpoint: DateTimeEndpointSelection
}

export interface ApplyGuardState {
  canApply: boolean
  blockedCode: DateTimeErrorCode | null
  blockedField: DateTimeErrorField | null
  blockedEndpoint: DateTimeEndpointSelection | null
}

export interface DateTimeErrorEventPayload {
  type: DateTimeErrorType
  code: DateTimeErrorCode
  message: string
  field: DateTimeErrorField
  endpoint: DateTimeEndpointSelection | null
}

export type SelectorFocus = 'month' | 'year'
export type SelectionPanel = 'previous' | 'next'
export type YearNumberingMode = 'historical' | 'astronomical'

export interface DirectYearInputConfig {
  directYearInput: boolean
  yearNumberingMode: YearNumberingMode
}

export interface SelectorYearInputTokenState {
  rawText: string
  normalizedText: string
  parsedYear: number | null
  isValidToken: boolean
}
