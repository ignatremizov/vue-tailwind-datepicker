import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import Year from '../../src/components/Year.vue'

const years = Array.from({ length: 241 }, (_, index) => 1900 + index)

async function flushTicks() {
  await nextTick()
  await nextTick()
}

describe('Selector year scroll mode', () => {
  it('does not re-center the wheel on month drift in boundary mode', async () => {
    const scrollSpy = vi.spyOn(HTMLElement.prototype, 'scrollTo')
    const wrapper = mount(Year, {
      props: {
        years,
        selectorMode: true,
        selectedYear: 2025,
        selectedMonth: 5,
        yearScrollMode: 'boundary',
      },
    })

    await flushTicks()
    scrollSpy.mockClear()

    await wrapper.setProps({ selectedMonth: 6 })
    await flushTicks()

    expect(scrollSpy).not.toHaveBeenCalled()
  })

  it('applies smooth re-centering on month drift in fractional mode', async () => {
    const scrollSpy = vi.spyOn(HTMLElement.prototype, 'scrollTo')
    const wrapper = mount(Year, {
      props: {
        years,
        selectorMode: true,
        selectedYear: 2025,
        selectedMonth: 5,
        yearScrollMode: 'fractional',
      },
    })

    await flushTicks()
    scrollSpy.mockClear()

    await wrapper.setProps({ selectedMonth: 7 })
    await flushTicks()

    expect(scrollSpy).toHaveBeenCalled()
    const calledWithSmoothBehavior = scrollSpy.mock.calls.some((call: any[]) => {
      const firstArg = call[0] as any
      return typeof firstArg === 'object' && firstArg !== null && firstArg.behavior === 'smooth'
    })
    expect(calledWithSmoothBehavior).toBe(true)
  })

  it('uses custom wheel cell height for click hit-testing', async () => {
    const rect = {
      x: 0,
      y: 0,
      width: 240,
      height: 256,
      top: 0,
      right: 240,
      bottom: 256,
      left: 0,
      toJSON: () => ({}),
    } as DOMRect
    const rectSpy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(rect)

    async function clickYearAtOffset(customHeight?: string) {
      const wrapper = mount(Year, {
        props: {
          years,
          selectorMode: true,
          selectedYear: 2025,
          selectedMonth: 5,
          yearScrollMode: 'fractional',
        },
      })
      await flushTicks()

      const selector = wrapper.get('[aria-label="Year selector"]')
      const selectorElement = selector.element as HTMLDivElement
      if (customHeight) {
        selectorElement.style.setProperty('--vtd-selector-wheel-cell-height', customHeight)
        await selector.trigger('focus')
        await flushTicks()
      }

      await selector.trigger('click', { clientY: 220 })
      await flushTicks()
      const nextYear = Number(wrapper.emitted('updateYear')?.at(-1)?.[0])
      wrapper.unmount()
      return nextYear
    }

    const defaultCellHeightYear = await clickYearAtOffset()
    const tallCellHeightYear = await clickYearAtOffset('72px')
    rectSpy.mockRestore()

    expect(tallCellHeightYear).toBeLessThan(defaultCellHeightYear)
  })

  it('keeps smooth motion on repeated year step-button clicks', async () => {
    const scrollSpy = vi.spyOn(HTMLElement.prototype, 'scrollTo')
    let wrapper: ReturnType<typeof mount>
    wrapper = mount(Year, {
      props: {
        years,
        selectorMode: true,
        selectedYear: 2025,
        selectedMonth: 5,
        yearScrollMode: 'boundary',
        onUpdateYear: (value: number) => {
          wrapper.setProps({ selectedYear: value })
        },
      },
    })
    await flushTicks()

    const nextButton = wrapper.get('[aria-label="Select next year"]')

    scrollSpy.mockClear()
    await nextButton.trigger('click')
    await flushTicks()
    const firstBehaviors = scrollSpy.mock.calls
      .map((call: any[]) => (call[0] as ScrollToOptions | undefined)?.behavior)
      .filter((behavior): behavior is ScrollBehavior => typeof behavior === 'string')

    scrollSpy.mockClear()
    await nextButton.trigger('click')
    await flushTicks()
    const secondBehaviors = scrollSpy.mock.calls
      .map((call: any[]) => (call[0] as ScrollToOptions | undefined)?.behavior)
      .filter((behavior): behavior is ScrollBehavior => typeof behavior === 'string')

    expect(firstBehaviors).toContain('smooth')
    expect(firstBehaviors).not.toContain('auto')
    expect(secondBehaviors).toContain('smooth')
    expect(secondBehaviors).not.toContain('auto')
  })
})
