import { mount } from '@vue/test-utils'
import dayjs from 'dayjs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import VueTailwindDatePicker from '../../src/VueTailwindDatePicker.vue'

afterEach(() => {
  vi.useRealTimers()
})

describe('calendar today styling in range preview', () => {
  it('keeps today marker styling when today is inside an active range (non-endpoint)', async () => {
    vi.useFakeTimers()
    const startDate = dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss')
    const endDate = dayjs().add(2, 'day').format('YYYY-MM-DD HH:mm:ss')
    const todayKey = dayjs().format('YYYY-MM-DD')

    const wrapper = mount(VueTailwindDatePicker, {
      attachTo: document.body,
      props: {
        noInput: true,
        useRange: true,
        asSingle: true,
        autoApply: true,
        modelValue: {
          startDate,
          endDate,
        },
      },
    })

    vi.advanceTimersByTime(260)
    await nextTick()
    await nextTick()

    const todayButton = wrapper.get(`[data-date-key="${todayKey}"]`)
    const classNames = todayButton.attributes('class')

    // Today should keep a distinct marker while inside the in-range preview.
    expect(classNames).toContain('text-vtd-primary-500')
    expect(classNames).toContain('rounded-full')
    expect(classNames).not.toContain('vtd-datepicker-date-selected')
  })

  it('keeps selected day circular for single-day ranges in asSingle useRange mode', async () => {
    vi.useFakeTimers()
    const selectedDate = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const selectedDateKey = dayjs(selectedDate).format('YYYY-MM-DD')

    const wrapper = mount(VueTailwindDatePicker, {
      attachTo: document.body,
      props: {
        noInput: true,
        useRange: true,
        asSingle: true,
        autoApply: true,
        modelValue: {
          startDate: selectedDate,
          endDate: selectedDate,
        },
      },
    })

    vi.advanceTimersByTime(260)
    await nextTick()
    await nextTick()

    const selectedButton = wrapper.get(`button[data-date-key="${selectedDateKey}"]`)
    const classNames = selectedButton.attributes('class')
    expect(classNames).toContain('vtd-datepicker-date-selected-single')

    const selectedCell = selectedButton.element.parentElement as HTMLElement
    const edgePreview = selectedCell.querySelector('.vtd-datepicker-range-preview-edge')
    expect(edgePreview).toBeNull()
  })

  it('keeps range endpoints visibly selected while previewing second date selection', async () => {
    vi.useFakeTimers()
    const wrapper = mount(VueTailwindDatePicker, {
      attachTo: document.body,
      props: {
        noInput: true,
        useRange: true,
        asSingle: false,
        autoApply: false,
        modelValue: {
          startDate: '2026-02-11 17:46:58',
          endDate: '2026-02-20 17:46:58',
        },
      },
    })

    vi.advanceTimersByTime(260)
    await nextTick()
    await nextTick()

    const startButton = wrapper.get(
      '[data-vtd-selector-panel="previous"] button[data-date-key="2026-02-02"]',
    )
    await startButton.trigger('click')
    await nextTick()

    const endButton = wrapper.get(
      '[data-vtd-selector-panel="previous"] button[data-date-key="2026-02-10"]',
    )
    await endButton.trigger('mouseenter')
    await nextTick()

    expect(startButton.attributes('class')).toContain('vtd-datepicker-date-selected')
    expect(endButton.attributes('class')).toContain('vtd-datepicker-date-selected')
  })
})
