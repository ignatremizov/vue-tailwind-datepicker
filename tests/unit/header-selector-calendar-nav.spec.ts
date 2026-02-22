import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import Header from '../../src/components/Header.vue'

function createCalendarStub() {
  return {
    date: () => [],
    month: 'Jan',
    year: 2025,
    years: () => [2024, 2025, 2026],
    onPrevious: vi.fn(),
    onNext: vi.fn(),
    onPreviousYear: vi.fn(),
    onNextYear: vi.fn(),
    openMonth: vi.fn(),
    setMonth: vi.fn(),
    openYear: vi.fn(),
    setYear: vi.fn(),
  }
}

describe('header calendar quick navigation in selector mode', () => {
  it('keeps month prev/next arrows available in calendar view', async () => {
    const calendar = createCalendarStub()
    const wrapper = mount(Header, {
      props: {
        panel: {
          calendar: true,
          month: false,
          year: false,
        },
        calendar,
        selectorMode: true,
        pickerViewMode: 'calendar',
        panelName: 'previous',
      },
    })

    await wrapper.get('[aria-label="Previous month"]').trigger('click')
    await wrapper.get('[aria-label="Next month"]').trigger('click')

    expect(calendar.onPrevious).toHaveBeenCalledTimes(1)
    expect(calendar.onNext).toHaveBeenCalledTimes(1)
    expect(calendar.onPreviousYear).not.toHaveBeenCalled()
    expect(calendar.onNextYear).not.toHaveBeenCalled()
  })

  it('keeps side arrows visible and functional while selector wheels are open', async () => {
    const calendar = createCalendarStub()
    const wrapper = mount(Header, {
      props: {
        panel: {
          calendar: true,
          month: false,
          year: false,
        },
        calendar,
        selectorMode: true,
        pickerViewMode: 'selector',
        panelName: 'previous',
      },
    })

    const previousButton = wrapper.get('[aria-label="Previous month"]')
    const nextButton = wrapper.get('[aria-label="Next month"]')

    expect((previousButton.element.closest('span') as HTMLElement | null)?.style.display).not.toBe('none')
    expect((nextButton.element.closest('span') as HTMLElement | null)?.style.display).not.toBe('none')
    expect(previousButton.classes()).toContain('opacity-65')
    expect(nextButton.classes()).toContain('opacity-65')

    await previousButton.trigger('click')
    await nextButton.trigger('click')

    expect(wrapper.emitted('step-month')).toEqual([
      [{ panel: 'previous', delta: -1 }],
      [{ panel: 'previous', delta: 1 }],
    ])
    expect(calendar.onPrevious).not.toHaveBeenCalled()
    expect(calendar.onNext).not.toHaveBeenCalled()
    expect(calendar.onPreviousYear).not.toHaveBeenCalled()
    expect(calendar.onNextYear).not.toHaveBeenCalled()
  })
})
