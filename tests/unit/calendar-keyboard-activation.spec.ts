import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import type { DatePickerDay } from '../../src/types'
import Calendar from '../../src/components/Calendar.vue'
import {
  atMouseOverKey,
  betweenRangeClassesKey,
  datepickerClassesKey,
  isBetweenRangeKey,
} from '../../src/keys'

function createCalendarDate(
  key: string,
  day: number,
  options: {
    disabled?: boolean
    inRange?: boolean
  } = {},
) {
  return {
    format: () => key,
    toDate: () => new Date(`${key}T00:00:00.000Z`),
    date: () => day,
    week: () => 7,
    hovered: false,
    duration: false,
    disabled: options.disabled ?? false,
    inRange: options.inRange ?? false,
    active: true,
    today: false,
  } as unknown as DatePickerDay
}

function mountCalendarForKeyboard() {
  const date = createCalendarDate('2026-02-15', 15)
  const calendar = {
    date: () => [date],
    month: 'Feb',
    year: 2026,
    years: () => [2025, 2026, 2027],
    onPrevious: vi.fn(),
    onNext: vi.fn(),
    onPreviousYear: vi.fn(),
    onNextYear: vi.fn(),
    openMonth: vi.fn(),
    setMonth: vi.fn(),
    openYear: vi.fn(),
    setYear: vi.fn(),
  }

  return mount(Calendar, {
    attachTo: document.body,
    props: {
      calendar,
      weeks: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      weekNumber: false,
      asRange: false,
    },
    global: {
      provide: {
        [isBetweenRangeKey as symbol]: () => false,
        [betweenRangeClassesKey as symbol]: () => '',
        [datepickerClassesKey as symbol]: () => '',
        [atMouseOverKey as symbol]: () => undefined,
      },
    },
  })
}

describe('calendar keyboard activation', () => {
  it('activates the focused date on Enter and Space keys', async () => {
    const wrapper = mountCalendarForKeyboard()
    const button = wrapper.get('[data-date-key="2026-02-15"]')

    await button.trigger('keydown', { key: 'Enter' })
    await button.trigger('keydown', { key: ' ' })
    await button.trigger('keydown', { key: 'Spacebar' })

    const emissions = wrapper.emitted('updateDate') ?? []
    expect(emissions).toHaveLength(3)
    expect(emissions[0]?.[0]).toMatchObject({
      source: 'keyboard',
      activationKey: 'Enter',
    })
    expect(emissions[1]?.[0]).toMatchObject({
      source: 'keyboard',
      activationKey: ' ',
    })
    expect(emissions[2]?.[0]).toMatchObject({
      source: 'keyboard',
      activationKey: 'Spacebar',
    })
  })

  it('moves to start/end of the week row on Home/End while skipping non-focusable dates', async () => {
    const weekDates = [
      createCalendarDate('2026-02-15', 15, { disabled: true }),
      createCalendarDate('2026-02-16', 16),
      createCalendarDate('2026-02-17', 17),
      createCalendarDate('2026-02-18', 18),
      createCalendarDate('2026-02-19', 19),
      createCalendarDate('2026-02-20', 20),
      createCalendarDate('2026-02-21', 21, { inRange: true }),
    ]
    const calendar = {
      date: () => weekDates,
      month: 'Feb',
      year: 2026,
      years: () => [2025, 2026, 2027],
      onPrevious: vi.fn(),
      onNext: vi.fn(),
      onPreviousYear: vi.fn(),
      onNextYear: vi.fn(),
      openMonth: vi.fn(),
      setMonth: vi.fn(),
      openYear: vi.fn(),
      setYear: vi.fn(),
    }

    const wrapper = mount(Calendar, {
      attachTo: document.body,
      props: {
        calendar,
        weeks: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        weekNumber: false,
        asRange: false,
      },
      global: {
        provide: {
          [isBetweenRangeKey as symbol]: () => false,
          [betweenRangeClassesKey as symbol]: () => '',
          [datepickerClassesKey as symbol]: () => '',
          [atMouseOverKey as symbol]: () => undefined,
        },
      },
    })

    const midWeekButton = wrapper.get('[data-date-key="2026-02-18"]')
    ;(midWeekButton.element as HTMLButtonElement).focus()

    await midWeekButton.trigger('keydown', { key: 'Home' })
    expect(document.activeElement).toBe(wrapper.get('[data-date-key="2026-02-16"]').element)

    const weekStartButton = wrapper.get('[data-date-key="2026-02-16"]')
    await weekStartButton.trigger('keydown', { key: 'End' })
    expect(document.activeElement).toBe(wrapper.get('[data-date-key="2026-02-20"]').element)
  })
})
