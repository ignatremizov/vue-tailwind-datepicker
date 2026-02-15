import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import Calendar from '../../src/components/Calendar.vue'
import {
  atMouseOverKey,
  betweenRangeClassesKey,
  datepickerClassesKey,
  isBetweenRangeKey,
} from '../../src/keys'

function createCalendarDate(key: string, day: number) {
  return {
    format: () => key,
    toDate: () => new Date(`${key}T00:00:00.000Z`),
    date: () => day,
    week: () => 7,
    hovered: () => false,
    duration: () => false,
    disabled: false,
    inRange: false,
    active: true,
    today: false,
  }
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

describe('Calendar keyboard activation', () => {
  it('activates the focused date on Enter and Space keys', async () => {
    const wrapper = mountCalendarForKeyboard()
    const button = wrapper.get('[data-date-key="2026-02-15"]')

    await button.trigger('keydown', { key: 'Enter' })
    await button.trigger('keydown', { key: ' ' })
    await button.trigger('keydown', { key: 'Spacebar' })

    const emissions = wrapper.emitted('updateDate') ?? []
    expect(emissions).toHaveLength(3)
  })
})
