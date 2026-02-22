import type { BuiltInShortcutId } from '~/keys'
import type {
  InvalidShortcutEventPayload,
  LegacyShortcutDefinition,
  ShortcutConstraints,
  ShortcutDefinition,
  ShortcutMode,
  ShortcutResolvedValue,
  ShortcutResolverContext,
  TypedShortcutDefinition,
} from '~/types'

export interface ShortcutActivationResultSuccess {
  ok: true
  id: string
  value: ShortcutResolvedValue
}

export interface ShortcutActivationResultFailure {
  ok: false
  payload: InvalidShortcutEventPayload
}

export type ShortcutActivationResult
  = | ShortcutActivationResultSuccess
    | ShortcutActivationResultFailure

interface ActivateShortcutParams {
  item: ShortcutDefinition
  mode: ShortcutMode
  currentValue: unknown
  now: Date
  constraints: ShortcutConstraints
  index?: number
}

interface ResolveShortcutDisabledParams {
  item: ShortcutDefinition
  mode: ShortcutMode
  currentValue: unknown
  now: Date
  constraints: ShortcutConstraints
}

function isTypedShortcutDefinition(
  item: ShortcutDefinition,
): item is TypedShortcutDefinition {
  return 'resolver' in item && typeof item.resolver === 'function'
}

function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime())
}

function toLegacyResolvedValue(result: Date[]): ShortcutResolvedValue | null {
  if (result.length === 1 && isValidDate(result[0]))
    return result[0]

  if (result.length >= 2 && isValidDate(result[0]) && isValidDate(result[1]))
    return [result[0], result[1]]

  return null
}

function normalizeResolvedValue(
  value: unknown,
  mode: ShortcutMode,
  isTyped: boolean,
): { value: ShortcutResolvedValue | null, reason: InvalidShortcutEventPayload['reason'] | null } {
  if (isValidDate(value)) {
    return mode === 'range'
      ? { value: [value, value], reason: null }
      : { value, reason: null }
  }

  if (Array.isArray(value)) {
    const [start, end] = value
    if (!isValidDate(start) || !isValidDate(end))
      return { value: null, reason: 'invalid-result' }

    if (mode === 'range')
      return { value: [start, end], reason: null }

    if (isTyped)
      return { value: null, reason: 'mode-mismatch' }

    return { value: start, reason: null }
  }

  return { value: null, reason: 'invalid-result' }
}

function createInvalidPayload(
  id: string,
  reason: InvalidShortcutEventPayload['reason'],
  mode: ShortcutMode,
  resolvedValue: ShortcutResolvedValue | null,
): ShortcutActivationResultFailure {
  return {
    ok: false,
    payload: {
      id,
      reason,
      mode,
      resolvedValue,
    },
  }
}

export function legacyShortcutFallbackId(label: string, index = 0) {
  const normalizedLabel = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `legacy-${index}-${normalizedLabel || 'shortcut'}`
}

function resolveLegacyShortcutId(item: LegacyShortcutDefinition, index?: number) {
  if (typeof item.id === 'string' && item.id.trim().length > 0)
    return item.id.trim()

  return legacyShortcutFallbackId(item.label, index ?? 0)
}

function cloneDate(value: Date) {
  return new Date(value.getTime())
}

function addBusinessDays(base: Date, amount: number) {
  const next = cloneDate(base)
  let remaining = amount
  while (remaining > 0) {
    next.setDate(next.getDate() + 1)
    const day = next.getDay()
    if (day !== 0 && day !== 6)
      remaining -= 1
  }
  return next
}

function addWeek(base: Date) {
  const next = cloneDate(base)
  next.setDate(next.getDate() + 7)
  return next
}

function addMonthClamped(base: Date) {
  const nextYear = base.getFullYear()
  const nextMonth = base.getMonth() + 1
  const lastDay = new Date(nextYear, nextMonth + 1, 0).getDate()
  const day = Math.min(base.getDate(), lastDay)
  return new Date(
    nextYear,
    nextMonth,
    day,
    base.getHours(),
    base.getMinutes(),
    base.getSeconds(),
    base.getMilliseconds(),
  )
}

export function resolveModernBuiltInDate(
  shortcut: Extract<
    BuiltInShortcutId,
    'today' | 'three-business-days' | 'next-week' | 'next-month'
  >,
  now: Date,
) {
  const baseline = cloneDate(now)
  switch (shortcut) {
    case 'today':
      return baseline
    case 'three-business-days':
      return addBusinessDays(baseline, 3)
    case 'next-week':
      return addWeek(baseline)
    case 'next-month':
      return addMonthClamped(baseline)
  }
}

export default function useShortcut() {
  const isShortcutDisabled = ({
    item,
    mode,
    currentValue,
    now,
    constraints,
  }: ResolveShortcutDisabledParams): boolean => {
    const disabled = item.disabled
    if (typeof disabled === 'boolean')
      return disabled

    if (typeof disabled === 'function') {
      try {
        const context: ShortcutResolverContext = {
          currentValue,
          mode,
          now,
          constraints,
        }
        return Boolean(disabled(context))
      } catch {
        return false
      }
    }

    return false
  }

  const activateShortcut = ({
    item,
    mode,
    currentValue,
    now,
    constraints,
    index,
  }: ActivateShortcutParams): ShortcutActivationResult => {
    const isTyped = isTypedShortcutDefinition(item)
    const id = isTyped
      ? item.id.trim()
      : resolveLegacyShortcutId(item, index)

    if (isTyped && id.length === 0)
      return createInvalidPayload(`typed-missing-id-${index ?? 0}`, 'invalid-result', mode, null)

    const context: ShortcutResolverContext = {
      currentValue,
      mode,
      now,
      constraints,
    }

    if (isShortcutDisabled({ item, mode, currentValue, now, constraints }))
      return createInvalidPayload(id, 'disabled', mode, null)

    let rawResolvedValue: unknown = null

    if (isTyped) {
      try {
        rawResolvedValue = item.resolver(context)
      } catch {
        return createInvalidPayload(id, 'resolver-error', mode, null)
      }
    } else {
      try {
        rawResolvedValue = toLegacyResolvedValue(item.atClick())
      } catch {
        return createInvalidPayload(id, 'resolver-error', mode, null)
      }
    }

    const { value, reason } = normalizeResolvedValue(rawResolvedValue, mode, isTyped)
    if (!value || reason)
      return createInvalidPayload(id, reason ?? 'invalid-result', mode, value)

    if (Array.isArray(value)) {
      if (constraints.isDateBlocked(value[0]) || constraints.isDateBlocked(value[1]))
        return createInvalidPayload(id, 'blocked-date', mode, value)
    } else if (constraints.isDateBlocked(value)) {
      return createInvalidPayload(id, 'blocked-date', mode, value)
    }

    return {
      ok: true,
      id,
      value,
    }
  }

  return {
    activateShortcut,
    isShortcutDisabled,
    resolveLegacyShortcutId,
  }
}
