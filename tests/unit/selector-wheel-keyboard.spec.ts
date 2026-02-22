import type { LengthArray } from '../../src/types'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import Month from '../../src/components/Month.vue'
import Year from '../../src/components/Year.vue'
import VueTailwindDatePicker from '../../src/VueTailwindDatePicker.vue'

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

function dispatchKey(target: HTMLElement, options: { key: string, shiftKey?: boolean }) {
  target.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: options.key,
      bubbles: true,
      cancelable: true,
      shiftKey: !!options.shiftKey,
    }),
  )
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

describe('selector wheel keyboard behavior', () => {
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
    await selector.trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('scrollMonth')).toEqual([
      [{ month: 0, year: 2025 }],
      [{ month: 10, year: 2024 }],
    ])
    expect(wrapper.emitted('requestFocusYear')).toHaveLength(3)
  })

  it('supports Home/End month boundary jumps for month wheel', async () => {
    const wrapper = mount(Month, {
      props: {
        months: MONTHS,
        selectorMode: true,
        selectedMonth: 5,
        selectedYear: 2025,
      },
    })

    const selector = wrapper.get('[aria-label="Month selector"]')

    await selector.trigger('keydown', { key: 'Home' })
    await selector.trigger('keydown', { key: 'End' })

    expect(wrapper.emitted('scrollMonth')).toEqual([
      [{ month: 0, year: 2025 }],
      [{ month: 11, year: 2025 }],
    ])
  })

  it('rolls Home/End to adjacent year when already at Jan/Dec', async () => {
    const janWrapper = mount(Month, {
      props: {
        months: MONTHS,
        selectorMode: true,
        selectedMonth: 0,
        selectedYear: 2025,
      },
    })
    const janSelector = janWrapper.get('[aria-label="Month selector"]')
    await janSelector.trigger('keydown', { key: 'Home' })
    expect(janWrapper.emitted('scrollMonth')).toEqual([
      [{ month: 0, year: 2024 }],
    ])

    const decWrapper = mount(Month, {
      props: {
        months: MONTHS,
        selectorMode: true,
        selectedMonth: 11,
        selectedYear: 2025,
      },
    })
    const decSelector = decWrapper.get('[aria-label="Month selector"]')
    await decSelector.trigger('keydown', { key: 'End' })
    expect(decWrapper.emitted('scrollMonth')).toEqual([
      [{ month: 11, year: 2026 }],
    ])
  })

  it('supports PageUp/PageDown year jumps for month wheel', async () => {
    const wrapper = mount(Month, {
      props: {
        months: MONTHS,
        selectorMode: true,
        selectedMonth: 0,
        selectedYear: 2025,
      },
    })

    const selector = wrapper.get('[aria-label="Month selector"]')

    await selector.trigger('keydown', { key: 'PageDown' })
    await selector.trigger('keydown', { key: 'PageUp' })

    expect(wrapper.emitted('scrollMonth')).toEqual([
      [{ month: 0, year: 2026 }],
      [{ month: 0, year: 2024 }],
    ])
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

  it('supports direct year typing on focused year wheel without inline textbox', async () => {
    const years = Array.from({ length: 401 }, (_, index) => 1900 + index)
    const wrapper: ReturnType<typeof mount> = mount(Year, {
      props: {
        years,
        selectorMode: true,
        directYearInput: true,
        selectedYear: 1950,
        selectedMonth: 0,
        onUpdateYear: (value: number) => {
          wrapper.setProps({ selectedYear: value })
        },
      },
    })

    const selector = wrapper.get('[aria-label="Year selector"]')
    await selector.trigger('keydown', { key: '1' })
    await nextTick()
    await selector.trigger('keydown', { key: '9' })
    await nextTick()
    await selector.trigger('keydown', { key: '8' })
    await nextTick()
    await selector.trigger('keydown', { key: '9' })
    await nextTick()

    expect(wrapper.emitted('updateYear')).toEqual([
      [1985],
      [1989],
    ])
  })

  it('allows direct year typing to target values outside the current wheel window', async () => {
    const years = Array.from({ length: 401 }, (_, index) => 1826 + index)
    const wrapper: ReturnType<typeof mount> = mount(Year, {
      props: {
        years,
        selectorMode: true,
        directYearInput: true,
        selectedYear: 1950,
        selectedMonth: 0,
        onUpdateYear: (value: number) => {
          wrapper.setProps({ selectedYear: value })
        },
      },
    })

    const selector = wrapper.get('[aria-label="Year selector"]')
    await selector.trigger('keydown', { key: '5' })
    await nextTick()

    expect(wrapper.emitted('updateYear')).toEqual([
      [5950],
    ])
  })

  it('clears direct-year typeahead state when selector mode closes and reopens', async () => {
    const wrapper = mount(Year, {
      props: {
        years: Array.from({ length: 401 }, (_, index) => 1900 + index),
        selectorMode: true,
        directYearInput: true,
        selectedYear: 2201,
        selectedMonth: 0,
      },
    })

    const selector = wrapper.get('[aria-label="Year selector"]')
    await selector.trigger('keydown', { key: '1' })
    await nextTick()

    await wrapper.setProps({ selectorMode: false, selectedYear: 2026 })
    await nextTick()

    await wrapper.setProps({ selectorMode: true })
    await nextTick()

    const reopenedSelector = wrapper.get('[aria-label="Year selector"]')
    await reopenedSelector.trigger('keydown', { key: '9' })
    await nextTick()

    const emitted = wrapper.emitted('updateYear') ?? []
    expect(emitted).toHaveLength(2)
    expect(emitted[0]).toEqual([1950])
    expect(emitted[1]).toEqual([9026])
  })

  it('clears direct-year typeahead buffer on Escape', async () => {
    const wrapper = mount(Year, {
      props: {
        years: Array.from({ length: 12001 }, (_, index) => -6000 + index),
        selectorMode: true,
        directYearInput: true,
        selectedYear: 2026,
        selectedMonth: 0,
      },
    })

    const selector = wrapper.get('[aria-label="Year selector"]')
    await selector.trigger('keydown', { key: '1' })
    await nextTick()
    await selector.trigger('keydown', { key: 'Escape' })
    await nextTick()
    await selector.trigger('keydown', { key: '9' })
    await nextTick()

    expect(wrapper.emitted('updateYear')).toEqual([
      [1950],
      [9026],
    ])
  })

  it('uses the 1900s anchor when direct typing starts with 1', async () => {
    const years = Array.from({ length: 8001 }, (_, index) => -2000 + index)
    const wrapper: ReturnType<typeof mount> = mount(Year, {
      props: {
        years,
        selectorMode: true,
        directYearInput: true,
        selectedYear: 2201,
        selectedMonth: 0,
        onUpdateYear: (value: number) => {
          wrapper.setProps({ selectedYear: value })
        },
      },
    })

    const selector = wrapper.get('[aria-label="Year selector"]')
    await selector.trigger('keydown', { key: '1' })
    await nextTick()

    expect(wrapper.emitted('updateYear')).toEqual([
      [1950],
    ])
  })

  it('uses mid-century anchoring for two-digit direct year prefixes', async () => {
    const years = Array.from({ length: 8001 }, (_, index) => -2000 + index)
    const wrapper: ReturnType<typeof mount> = mount(Year, {
      props: {
        years,
        selectorMode: true,
        directYearInput: true,
        selectedYear: 2201,
        selectedMonth: 0,
        onUpdateYear: (value: number) => {
          wrapper.setProps({ selectedYear: value })
        },
      },
    })

    const selector = wrapper.get('[aria-label="Year selector"]')
    await selector.trigger('keydown', { key: '1' })
    await nextTick()
    await selector.trigger('keydown', { key: '2' })
    await nextTick()

    expect(wrapper.emitted('updateYear')).toEqual([
      [1950],
      [1250],
    ])
  })

  it('uses middle-century suffix for two-digit prefixes regardless of previous selection suffix', async () => {
    const years = Array.from({ length: 8001 }, (_, index) => -2000 + index)
    const wrapper: ReturnType<typeof mount> = mount(Year, {
      props: {
        years,
        selectorMode: true,
        directYearInput: true,
        selectedYear: 2026,
        selectedMonth: 0,
        onUpdateYear: (value: number) => {
          wrapper.setProps({ selectedYear: value })
        },
      },
    })

    const selector = wrapper.get('[aria-label="Year selector"]')
    await selector.trigger('keydown', { key: '3' })
    await nextTick()
    await selector.trigger('keydown', { key: '4' })
    await nextTick()

    expect(wrapper.emitted('updateYear')).toEqual([
      [3026],
      [3450],
    ])
  })

  it('uses middle-decade suffix for three-digit prefixes regardless of previous selection suffix', async () => {
    const years = Array.from({ length: 8001 }, (_, index) => -2000 + index)
    const wrapper: ReturnType<typeof mount> = mount(Year, {
      props: {
        years,
        selectorMode: true,
        directYearInput: true,
        selectedYear: 2026,
        selectedMonth: 0,
        onUpdateYear: (value: number) => {
          wrapper.setProps({ selectedYear: value })
        },
      },
    })

    const selector = wrapper.get('[aria-label="Year selector"]')
    await selector.trigger('keydown', { key: '3' })
    await nextTick()
    await selector.trigger('keydown', { key: '4' })
    await nextTick()
    await selector.trigger('keydown', { key: '5' })
    await nextTick()

    expect(wrapper.emitted('updateYear')).toEqual([
      [3026],
      [3450],
      [3455],
    ])
  })

  it('uses the current-year anchor when direct typing starts with 2', async () => {
    const years = Array.from({ length: 8001 }, (_, index) => -2000 + index)
    const expectedYear = new Date().getFullYear()
    const wrapper: ReturnType<typeof mount> = mount(Year, {
      props: {
        years,
        selectorMode: true,
        directYearInput: true,
        selectedYear: 1950,
        selectedMonth: 0,
        onUpdateYear: (value: number) => {
          wrapper.setProps({ selectedYear: value })
        },
      },
    })

    const selector = wrapper.get('[aria-label="Year selector"]')
    await selector.trigger('keydown', { key: '2' })
    await nextTick()

    expect(wrapper.emitted('updateYear')).toEqual([
      [expectedYear],
    ])
  })

  it('supports signed direct year typing in astronomical mode', async () => {
    const years = Array.from({ length: 12001 }, (_, index) => -6000 + index)
    const wrapper: ReturnType<typeof mount> = mount(Year, {
      props: {
        years,
        selectorMode: true,
        directYearInput: true,
        yearNumberingMode: 'astronomical',
        selectedYear: 1950,
        selectedMonth: 0,
        onUpdateYear: (value: number) => {
          wrapper.setProps({ selectedYear: value })
        },
      },
    })

    const selector = wrapper.get('[aria-label="Year selector"]')
    await selector.trigger('keydown', { key: '-' })
    await nextTick()
    await selector.trigger('keydown', { key: '1' })
    await nextTick()
    await selector.trigger('keydown', { key: '9' })
    await nextTick()
    await selector.trigger('keydown', { key: '8' })
    await nextTick()
    await selector.trigger('keydown', { key: '9' })
    await nextTick()

    expect(wrapper.emitted('updateYear')).toEqual([
      [-1950],
      [-1985],
      [-1989],
    ])
  })

  it('supports explicit positive sign typing from a negative anchor in astronomical mode', async () => {
    const years = Array.from({ length: 12001 }, (_, index) => -6000 + index)
    const wrapper: ReturnType<typeof mount> = mount(Year, {
      props: {
        years,
        selectorMode: true,
        directYearInput: true,
        yearNumberingMode: 'astronomical',
        selectedYear: -1950,
        selectedMonth: 0,
        onUpdateYear: (value: number) => {
          wrapper.setProps({ selectedYear: value })
        },
      },
    })

    const selector = wrapper.get('[aria-label="Year selector"]')
    await selector.trigger('keydown', { key: '+' })
    await nextTick()
    await selector.trigger('keydown', { key: '1' })
    await nextTick()
    await selector.trigger('keydown', { key: '9' })
    await nextTick()
    await selector.trigger('keydown', { key: '8' })
    await nextTick()
    await selector.trigger('keydown', { key: '9' })
    await nextTick()

    expect(wrapper.emitted('updateYear')).toEqual([
      [1950],
      [1985],
      [1989],
    ])
  })

  it('does not emit year zero via direct typing in historical mode', async () => {
    const years = Array.from({ length: 401 }, (_, index) => -200 + index)
    const wrapper: ReturnType<typeof mount> = mount(Year, {
      props: {
        years,
        selectorMode: true,
        directYearInput: true,
        yearNumberingMode: 'historical',
        selectedYear: -50,
        selectedMonth: 0,
        onUpdateYear: (value: number) => {
          wrapper.setProps({ selectedYear: value })
        },
      },
    })

    const selector = wrapper.get('[aria-label="Year selector"]')
    await selector.trigger('keydown', { key: '+' })
    await nextTick()
    await selector.trigger('keydown', { key: '0' })
    await nextTick()
    await selector.trigger('keydown', { key: '0' })
    await nextTick()
    await selector.trigger('keydown', { key: '0' })
    await nextTick()
    await selector.trigger('keydown', { key: '0' })
    await nextTick()

    expect(wrapper.emitted('updateYear')).toEqual([
      [50],
    ])
  })

  it('supports configurable Home/End keyboard jumps for year wheel', async () => {
    const years = Array.from({ length: 401 }, (_, index) => 1900 + index)
    const wrapper: ReturnType<typeof mount> = mount(Year, {
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
    const wrapper: ReturnType<typeof mount> = mount(Year, {
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

  it('supports month letter typeahead on focused month wheel', async () => {
    const wrapper = mount(Month, {
      props: {
        months: MONTHS,
        selectorMode: true,
        selectedMonth: 11,
        selectedYear: 2025,
      },
    })

    const selector = wrapper.get('[aria-label="Month selector"]')
    await selector.trigger('keydown', { key: 'j' })
    await nextTick()
    await selector.trigger('keydown', { key: 'u' })
    await nextTick()

    expect(wrapper.emitted('scrollMonth')).toEqual([
      [{ month: 0, year: 2025 }],
      [{ month: 5, year: 2025 }],
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
    const selectedRowBefore = selectedBefore.element.closest(
      '[data-month-index]',
    ) as HTMLElement | null
    const selectedIndexBefore = Number(selectedRowBefore?.getAttribute('data-month-index'))

    await wrapper.setProps({ selectedYear: 2026 })
    await nextTick()

    const selectedAfter = wrapper.get('[role="option"][aria-selected="true"]')
    const selectedRowAfter = selectedAfter.element.closest(
      '[data-month-index]',
    ) as HTMLElement | null
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

  it('closes selector view when Enter is pressed on the year wheel', async () => {
    const wrapper = await mountSelectorPicker()

    await wrapper.get('#vtd-header-previous-month').trigger('click')
    await nextTick()

    const monthSelectorWrapper = wrapper.get('[aria-label="Month selector"]')
    const monthSelector = monthSelectorWrapper.element as HTMLElement
    const yearSelectorWrapper = wrapper.get('[aria-label="Year selector"]')
    monthSelector.focus()
    await monthSelectorWrapper.trigger('keydown', { key: 'Enter' })
    await nextTick()
    vi.advanceTimersByTime(64)
    await nextTick()

    await yearSelectorWrapper.trigger('keydown', { key: 'Enter' })
    vi.advanceTimersByTime(32)
    await nextTick()
    await nextTick()

    expect(wrapper.find('[aria-label="Month selector"]').exists()).toBe(false)
    expect(wrapper.find('[aria-label="Year selector"]').exists()).toBe(false)
    expect(wrapper.find('.vtd-calendar-focus-target').exists()).toBe(true)

    wrapper.unmount()
  })

  it('updates month wheel selection when header month arrows are clicked in selector view', async () => {
    const scrollSpy = vi.spyOn(HTMLElement.prototype, 'scrollTo')
    const wrapper = await mountSelectorPicker()
    await wrapper.get('#vtd-header-previous-month').trigger('click')
    await nextTick()

    const selectedBefore = wrapper.get(
      '[aria-label="Month selector"] [role="option"][aria-selected="true"]',
    )
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

    const selectedAfter = wrapper.get(
      '[aria-label="Month selector"] [role="option"][aria-selected="true"]',
    )
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
    expect(
      wrapper.find('[data-vtd-selector-panel="previous"] [aria-label="Month selector"]').exists(),
    ).toBe(true)
    expect(
      wrapper.find('[data-vtd-selector-panel="next"] [aria-label="Month selector"]').exists(),
    ).toBe(false)
    const previousBefore = normalize(
      wrapper
        .get(
          '[data-vtd-selector-panel="previous"] [aria-label="Month selector"] [role="option"][aria-selected="true"]',
        )
        .text(),
    )

    await wrapper.get('#vtd-header-next-month').trigger('click')
    await nextTick()
    expect(
      wrapper.find('[data-vtd-selector-panel="previous"] [aria-label="Month selector"]').exists(),
    ).toBe(true)
    expect(
      wrapper.find('[data-vtd-selector-panel="next"] [aria-label="Month selector"]').exists(),
    ).toBe(true)
    const previousAfter = normalize(
      wrapper
        .get(
          '[data-vtd-selector-panel="previous"] [aria-label="Month selector"] [role="option"][aria-selected="true"]',
        )
        .text(),
    )
    const nextSelected = normalize(
      wrapper
        .get(
          '[data-vtd-selector-panel="next"] [aria-label="Month selector"] [role="option"][aria-selected="true"]',
        )
        .text(),
    )
    expect(previousAfter).toBe(previousBefore)
    expect(nextSelected).not.toBe(previousAfter)

    wrapper.unmount()
  })

  it('re-anchors year wheel for direct typeahead beyond current virtual window', async () => {
    vi.useFakeTimers()
    const wrapper = mount(VueTailwindDatePicker, {
      attachTo: document.body,
      props: {
        noInput: true,
        selectorMode: true,
        directYearInput: true,
        selectorYearScrollMode: 'boundary',
        useRange: false,
        asSingle: true,
        shortcuts: false,
        autoApply: true,
        modelValue: '2026-02-15 00:00:00',
      },
    })

    vi.advanceTimersByTime(260)
    await nextTick()

    await wrapper.get('#vtd-header-previous-month').trigger('click')
    await nextTick()

    const yearSelector = wrapper.get('[aria-label="Year selector"]')
    await yearSelector.trigger('keydown', { key: '1' })
    await nextTick()
    await yearSelector.trigger('keydown', { key: '2' })
    await nextTick()
    await nextTick()

    expect(yearSelector.attributes('aria-valuenow')).toBe('1250')

    wrapper.unmount()
  })
})
