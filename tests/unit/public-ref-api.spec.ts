import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import VueTailwindDatePicker, {
  type VueTailwindDatePickerRef,
} from '../../src/VueTailwindDatePicker.vue'

describe.sequential('public template ref API', () => {
  it('provides readiness and calendar focus methods for popover mode', async () => {
    const wrapper = mount(VueTailwindDatePicker, {
      attachTo: document.body,
      props: {
        popoverTransition: false,
        openFocusTarget: 'input',
      },
    })

    await wrapper.get('input').trigger('click')
    await nextTick()
    await nextTick()

    const api = wrapper.vm as unknown as VueTailwindDatePickerRef
    expect(typeof api.isReady).toBe('function')
    expect(typeof api.waitForReady).toBe('function')
    expect(typeof api.focusCalendar).toBe('function')
    expect(typeof api.focusInput).toBe('function')

    const ready = await api.waitForReady({ maxAttempts: 10, retryDelayMs: 8 })
    expect(ready).toBe(true)
    expect(api.isReady()).toBe(true)

    const focused = await api.focusCalendar({ maxAttempts: 10, retryDelayMs: 8 })
    expect(focused).toBe(true)
    expect((document.activeElement as HTMLElement | null)?.classList.contains('vtd-datepicker-date')).toBe(true)

    wrapper.unmount()
  })

  it('returns false when focusing input in no-input mode', async () => {
    const wrapper = mount(VueTailwindDatePicker, {
      props: {
        noInput: true,
      },
    })

    const api = wrapper.vm as unknown as VueTailwindDatePickerRef
    expect(api.focusInput()).toBe(false)

    wrapper.unmount()
  })

  it('returns false when waitForReady timeout elapses while popover is closed', async () => {
    const wrapper = mount(VueTailwindDatePicker, {
      props: {
        popoverTransition: false,
      },
    })

    const api = wrapper.vm as unknown as VueTailwindDatePickerRef
    const ready = await api.waitForReady({ timeoutMs: 25 })
    expect(ready).toBe(false)

    wrapper.unmount()
  })
})
