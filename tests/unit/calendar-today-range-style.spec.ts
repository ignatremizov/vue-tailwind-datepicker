import dayjs from 'dayjs'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import VueTailwindDatePicker from '../../src/VueTailwindDatePicker.vue'

afterEach(() => {
  vi.useRealTimers()
})

describe('Calendar today styling in range preview', () => {
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
})
