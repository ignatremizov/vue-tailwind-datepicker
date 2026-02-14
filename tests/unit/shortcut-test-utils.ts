import { vi } from 'vitest'

export interface ShortcutEdgeFixture {
  label: string
  now: Date
}

export const SHORTCUT_EDGE_FIXTURES: Record<string, ShortcutEdgeFixture> = {
  weekendSaturday: {
    label: 'Saturday baseline',
    now: createLocalDate(2026, 0, 31, 12, 0, 0),
  },
  monthBoundary: {
    label: 'Month boundary baseline',
    now: createLocalDate(2026, 0, 30, 12, 0, 0),
  },
  timezoneMidnight: {
    label: 'Local midnight boundary',
    now: createLocalDate(2026, 6, 1, 0, 1, 0),
  },
}

export function createLocalDate(
  year: number,
  monthIndex: number,
  day: number,
  hour = 12,
  minute = 0,
  second = 0,
  millisecond = 0,
) {
  return new Date(year, monthIndex, day, hour, minute, second, millisecond)
}

export function addCalendarDays(base: Date, days: number) {
  const next = new Date(base)
  next.setDate(next.getDate() + days)
  return next
}

export function addBusinessDays(base: Date, businessDays: number) {
  const next = new Date(base)
  let remaining = businessDays
  while (remaining > 0) {
    next.setDate(next.getDate() + 1)
    const weekday = next.getDay()
    if (weekday !== 0 && weekday !== 6)
      remaining -= 1
  }
  return next
}

export function clampToNextMonth(base: Date) {
  const year = base.getFullYear()
  const month = base.getMonth()
  const day = base.getDate()
  const firstOfNextMonth = new Date(year, month + 1, 1)
  const lastOfNextMonth = new Date(year, month + 2, 0)
  const clampedDay = Math.min(day, lastOfNextMonth.getDate())
  return new Date(
    firstOfNextMonth.getFullYear(),
    firstOfNextMonth.getMonth(),
    clampedDay,
    base.getHours(),
    base.getMinutes(),
    base.getSeconds(),
    base.getMilliseconds(),
  )
}

export async function withFixedNow<T>(now: Date, run: () => Promise<T> | T) {
  vi.useFakeTimers()
  vi.setSystemTime(now)
  try {
    return await run()
  }
  finally {
    vi.useRealTimers()
  }
}
