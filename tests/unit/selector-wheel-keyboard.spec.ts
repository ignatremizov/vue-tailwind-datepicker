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

async function mountRangeSelectorPicker() {
  vi.useFakeTimers()
  const wrapper = mount(VueTailwindDatePicker, {
    attachTo: document.body,
    props: {
      noInput: true,
      selectorMode: true,
      selectorFocusTint: true,
      selectorYearScrollMode: 'boundary',
      useRange: true,
      asSingle: false,
      shortcuts: false,
      autoApply: true,
      modelValue: {
        startDate: '2025-01-15 00:00:00',
        endDate: '2025-04-20 00:00:00',
      },
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

  it('supports configurable Home/End keyboard jumps for year wheel', async () => {
    const years = Array.from({ length: 401 }, (_, index) => 1900 + index)
    let wrapper: ReturnType<typeof mount>
    wrapper = mount(Year, {
      props: {
        years,
        selectorMode: true,
        selectedYear: 2025,
        selectedMonth: 0,
        homeJump: 25,
        endJump: 40,
        onUpdateYear: (value: number) => {
          wrapper.setProps({ selectedYear: value })
        },
      },
    })

    const selector = wrapper.get('[aria-label="Year selector"]')
    await selector.trigger('keydown', { key: 'Home' })
    await nextTick()
    await selector.trigger('keydown', { key: 'End' })

    expect(wrapper.emitted('updateYear')).toEqual([
      [2000],
      [2040],
    ])
  })

  it('supports configurable PageUp/PageDown keyboard jumps for year wheel', async () => {
    const years = Array.from({ length: 401 }, (_, index) => 1900 + index)
    let wrapper: ReturnType<typeof mount>
    wrapper = mount(Year, {
      props: {
        years,
        selectorMode: true,
        selectedYear: 2025,
        selectedMonth: 0,
        pageJump: 7,
        pageShiftJump: 30,
        onUpdateYear: (value: number) => {
          wrapper.setProps({ selectedYear: value })
        },
      },
    })

    const selector = wrapper.get('[aria-label="Year selector"]')
    await selector.trigger('keydown', { key: 'PageDown' })
    await nextTick()
    await selector.trigger('keydown', { key: 'PageUp', shiftKey: true })

    expect(wrapper.emitted('updateYear')).toEqual([
      [2032],
      [2002],
    ])
  })

  it('steps month wheel with click controls', async () => {
    const wrapper = mount(Month, {
      props: {
        months: MONTHS,
        selectorMode: true,
        selectedMonth: 0,
        selectedYear: 2025,
      },
    })

    await wrapper.get('[aria-label="Select previous month"]').trigger('click')
    await wrapper.get('[aria-label="Select next month"]').trigger('click')

    expect(wrapper.emitted('scrollMonth')).toEqual([
      [{ month: 11, year: 2024 }],
      [{ month: 1, year: 2025 }],
    ])
  })

  it('steps year wheel with click controls', async () => {
    const years = Array.from({ length: 401 }, (_, index) => 1900 + index)
    const wrapper = mount(Year, {
      props: {
        years,
        selectorMode: true,
        selectedYear: 2025,
        selectedMonth: 0,
      },
    })

    await wrapper.get('[aria-label="Select previous year"]').trigger('click')
    await wrapper.get('[aria-label="Select next year"]').trigger('click')

    expect(wrapper.emitted('updateYear')).toEqual([
      [2024],
      [2026],
    ])
  })

  it('does not re-center month wheel when only selected year changes', async () => {
    const scrollSpy = vi.spyOn(HTMLElement.prototype, 'scrollTo')
    const wrapper = mount(Month, {
      props: {
        months: MONTHS,
        selectorMode: true,
        selectedMonth: 2,
        selectedYear: 2025,
      },
    })

    await nextTick()
    await nextTick()
    scrollSpy.mockClear()

    await wrapper.setProps({ selectedYear: 2026 })
    await nextTick()
    await nextTick()

    expect(scrollSpy).not.toHaveBeenCalled()
    scrollSpy.mockRestore()
  })

  it('keeps selected month row stable on year-only updates', async () => {
    const wrapper = mount(Month, {
      props: {
        months: MONTHS,
        selectorMode: true,
        selectedMonth: 2,
        selectedYear: 2025,
      },
    })

    await nextTick()
    await nextTick()

    const selectedBefore = wrapper.get('[role="option"][aria-selected="true"]')
    const selectedRowBefore = selectedBefore.element.closest('[data-month-index]') as HTMLElement | null
    const selectedIndexBefore = Number(selectedRowBefore?.getAttribute('data-month-index'))

    await wrapper.setProps({ selectedYear: 2026 })
    await nextTick()

    const selectedAfter = wrapper.get('[role="option"][aria-selected="true"]')
    const selectedRowAfter = selectedAfter.element.closest('[data-month-index]') as HTMLElement | null
    const selectedIndexAfter = Number(selectedRowAfter?.getAttribute('data-month-index'))
    expect(selectedIndexAfter).toBe(selectedIndexBefore)
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

  it('updates month wheel selection when header month arrows are clicked in selector view', async () => {
    const scrollSpy = vi.spyOn(HTMLElement.prototype, 'scrollTo')
    const wrapper = await mountSelectorPicker()
    await wrapper.get('#vtd-header-previous-month').trigger('click')
    await nextTick()

    const selectedBefore = wrapper.get('[aria-label="Month selector"] [role="option"][aria-selected="true"]')
    const normalize = (value: string) => value.trim().slice(0, 3).toUpperCase()
    const beforeMonth = normalize(selectedBefore.text())
    const beforeIndex = MONTHS.findIndex(month => month.toUpperCase() === beforeMonth)
    expect(beforeIndex).toBeGreaterThanOrEqual(0)

    await wrapper.get('[aria-label="Previous month"]').trigger('click')
    await nextTick()
    await nextTick()

    const calledWithSmoothBehavior = scrollSpy.mock.calls.some((call: any[]) => {
      const firstArg = call[0] as any
      return typeof firstArg === 'object' && firstArg !== null && firstArg.behavior === 'smooth'
    })
    expect(calledWithSmoothBehavior).toBe(true)

    const selectedAfter = wrapper.get('[aria-label="Month selector"] [role="option"][aria-selected="true"]')
    const afterMonth = normalize(selectedAfter.text())
    const afterIndex = MONTHS.findIndex(month => month.toUpperCase() === afterMonth)
    expect(afterIndex).toBe((beforeIndex + 11) % 12)

    scrollSpy.mockRestore()
    wrapper.unmount()
  })

  it('keeps both range panel selectors open when toggled from each header', async () => {
    const wrapper = await mountRangeSelectorPicker()
    const normalize = (value: string) => value.trim().slice(0, 3).toUpperCase()

    await wrapper.get('#vtd-header-previous-month').trigger('click')
    await nextTick()
    expect(wrapper.find('[data-vtd-selector-panel="previous"] [aria-label="Month selector"]').exists()).toBe(true)
    expect(wrapper.find('[data-vtd-selector-panel="next"] [aria-label="Month selector"]').exists()).toBe(false)
    const previousBefore = normalize(
      wrapper.get('[data-vtd-selector-panel="previous"] [aria-label="Month selector"] [role="option"][aria-selected="true"]').text(),
    )

    await wrapper.get('#vtd-header-next-month').trigger('click')
    await nextTick()
    expect(wrapper.find('[data-vtd-selector-panel="previous"] [aria-label="Month selector"]').exists()).toBe(true)
    expect(wrapper.find('[data-vtd-selector-panel="next"] [aria-label="Month selector"]').exists()).toBe(true)
    const previousAfter = normalize(
      wrapper.get('[data-vtd-selector-panel="previous"] [aria-label="Month selector"] [role="option"][aria-selected="true"]').text(),
    )
    const nextSelected = normalize(
      wrapper.get('[data-vtd-selector-panel="next"] [aria-label="Month selector"] [role="option"][aria-selected="true"]').text(),
    )
    expect(previousAfter).toBe(previousBefore)
    expect(nextSelected).not.toBe(previousAfter)

    wrapper.unmount()
  })
})
