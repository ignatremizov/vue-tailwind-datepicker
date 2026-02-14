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
  sunday: boolean
  disabled: boolean
  inRange: boolean | undefined
  hovered: boolean
  duration: boolean
}

export type SelectorFocus = 'month' | 'year'
export type SelectionPanel = 'previous' | 'next'
export type YearNumberingMode = 'historical' | 'astronomical'
export type SelectorYearInputTrigger = 'input' | 'enter' | 'escape' | 'blur'

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

export interface SelectorYearInputEventPayload extends SelectorYearInputTokenState {
  panel: SelectionPanel
  trigger: SelectorYearInputTrigger
}
