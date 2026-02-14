import type { InjectionKey, Ref } from 'vue'
import type { Dayjs } from 'dayjs'
import type { DatePickerDay, ShortcutDefinition } from './types'

const isBetweenRangeKey: InjectionKey<(date: DatePickerDay) => boolean> =
  Symbol('isBetweenRange')
const betweenRangeClassesKey: InjectionKey<(date: Dayjs) => string> = Symbol(
  'betweenRangeClasses',
)
const datepickerClassesKey: InjectionKey<
  (date: DatePickerDay) => string | undefined
> = Symbol('datepickerClasses')
const atMouseOverKey: InjectionKey<(date: Dayjs) => false | undefined> =
  Symbol('atMouseOver')

export type BuiltInShortcutId
  = 'today'
    | 'yesterday'
    | 'past-7-days'
    | 'past-30-days'
    | 'this-month'
    | 'last-month'
    | 'three-business-days'
    | 'next-week'
    | 'next-month'

export type ShortcutActivationTarget = ShortcutDefinition | BuiltInShortcutId

const activateShortcutKey: InjectionKey<
  (
    target: ShortcutActivationTarget,
    close?: ((ref?: Ref | HTMLElement) => void) | undefined,
    index?: number,
  ) => void
> = Symbol('activateShortcut')

export {
  isBetweenRangeKey,
  betweenRangeClassesKey,
  datepickerClassesKey,
  atMouseOverKey,
  activateShortcutKey,
}
