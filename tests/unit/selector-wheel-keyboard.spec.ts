import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Month from '../../src/components/Month.vue'
import Year from '../../src/components/Year.vue'
import VueTailwindDatePicker from '../../src/VueTailwindDatePicker.vue'
import type { LengthArray } from '../../src/types'

const MONTHS: LengthArray<string, 12> = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

function dispatchKey(target: HTMLElement, options: { key: string; shiftKey?: boolean }) {
  target.dispatchEvent(new KeyboardEvent('keydown', {
    key: options.key,
    bubbles: true,
    cancelable: true,
    shiftKey: !!options.shiftKey,
  }))
}

afterEach(() => {
  vi.useRealTimers()
})

async function mountSelectorPicker() {
  vi.useFakeTimers()
  const wrapper = mount(VueTailwindDatePicker, {
    attachTo: document.body,
    props: {
      noInput: true,
      selectorMode: true,
      selectorFocusTint: true,
      selectorYearScrollMode: 'boundary',
      useRange: false,
      asSingle: true,
      shortcuts: false,
      autoApply: true,
      modelValue: '2025-01-15 00:00:00',
    },
  })

  vi.advanceTimersByTime(260)
  await nextTick()
  return wrapper
}

describe('Selector wheel keyboard behavior', () => {
  it('navigates month wheel and requests year focus with keyboard keys', async () => {
    const wrapper = mount(Month, {
      props: {
        months: MONTHS,
        selectorMode: true,
        selectedMonth: 11,
        selectedYear: 2024,
      },
    })

    const selector = wrapper.get('[aria-label="Month selector"]')

    await selector.trigger('keydown', { key: 'ArrowDown' })
    await selector.trigger('keydown', { key: 'ArrowUp' })
    await selector.trigger('keydown', { key: 'Tab' })
    await selector.trigger('keydown', { key: 'ArrowRight' })

    expect(wrapper.emitted('scrollMonth')).toEqual([
      [{ month: 0, year: 2025 }],
      [{ month: 10, year: 2024 }],
    ])
    expect(wrapper.emitted('requestFocusYear')).toHaveLength(2)
  })

  it('navigates year wheel and requests month focus with keyboard keys', async () => {
    const years = Array.from({ length: 401 }, (_, index) => 1900 + index)
    const wrapper = mount(Year, {
      props: {
        years,
        selectorMode: true,
        selectedYear: 2025,
        selectedMonth: 0,
      },
    })

    const selector = wrapper.get('[aria-label="Year selector"]')

    await selector.trigger('keydown', { key: 'ArrowDown' })
    await selector.trigger('keydown', { key: 'PageDown' })
    await selector.trigger('keydown', { key: 'Tab' })
    await selector.trigger('keydown', { key: 'ArrowLeft' })

    expect(wrapper.emitted('updateYear')).toEqual([
      [2026],
      [2035],
    ])
    expect(wrapper.emitted('requestFocusMonth')).toHaveLength(2)
  })

  it('cycles selector focus with Tab and Shift+Tab', async () => {
    const wrapper = await mountSelectorPicker()

    await wrapper.get('#vtd-header-previous-month').trigger('click')
    await nextTick()

    const header = wrapper.get('#vtd-header-previous-month').element as HTMLElement
    const monthSelector = wrapper.get('[aria-label="Month selector"]').element as HTMLElement
    const yearSelector = wrapper.get('[aria-label="Year selector"]').element as HTMLElement

    header.focus()
    dispatchKey(header, { key: 'Tab' })
    expect(document.activeElement).toBe(monthSelector)

    dispatchKey(monthSelector, { key: 'Tab' })
    expect(document.activeElement).toBe(yearSelector)

    dispatchKey(yearSelector, { key: 'Tab' })
    expect(document.activeElement).toBe(header)

    dispatchKey(header, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(yearSelector)

    wrapper.unmount()
  })
})
