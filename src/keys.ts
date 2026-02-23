import type { Dayjs } from 'dayjs'
import type { InjectionKey, Ref } from 'vue'
import type { DatePickerDay, ShortcutDefinition } from './types'

const isBetweenRangeKey: InjectionKey<(date: DatePickerDay) => boolean>
  = Symbol('isBetweenRange')
const betweenRangeClassesKey: InjectionKey<(date: Dayjs) => string> = Symbol(
  'betweenRangeClasses',
)
const datepickerClassesKey: InjectionKey<
  (date: DatePickerDay) => string | undefined
> = Symbol('datepickerClasses')
const atMouseOverKey: InjectionKey<(date: Dayjs) => false | undefined>
  = Symbol('atMouseOver')

export type BuiltInShortcutId
  = | 'today'
    | 'yesterday'
    | 'past-week'
    | 'past-7-days'
    | 'past-30-days'
    | 'this-month'
    | 'last-month'
    | 'next-three-business-days'
    | 'three-business-days'
    | 'next-week'
    | 'next-month'

export type ShortcutActivationTarget = ShortcutDefinition | BuiltInShortcutId
export type ShortcutDisabledReason = 'explicit' | 'blocked-date' | null

export interface ShortcutDisabledState {
  isDisabled: boolean
  disabledReason: ShortcutDisabledReason
}

const activateShortcutKey: InjectionKey<
  (
    target: ShortcutActivationTarget,
    close?: ((ref?: Ref | HTMLElement) => void) | undefined,
    index?: number,
  ) => void
> = Symbol('activateShortcut')

const isShortcutDisabledKey: InjectionKey<
  (
    target: ShortcutActivationTarget,
    index?: number,
  ) => boolean
> = Symbol('isShortcutDisabled')

const getShortcutDisabledStateKey: InjectionKey<
  (
    target: ShortcutActivationTarget,
    index?: number,
  ) => ShortcutDisabledState
> = Symbol('getShortcutDisabledState')

export {
  activateShortcutKey,
  atMouseOverKey,
  betweenRangeClassesKey,
  datepickerClassesKey,
  getShortcutDisabledStateKey,
  isBetweenRangeKey,
  isShortcutDisabledKey,
}
