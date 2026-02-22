import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import VueTailwindDatePicker from '../../src/VueTailwindDatePicker.vue'

describe.sequential('text input synchronization', () => {
  it('syncs single-date text input on input events without requiring keyup', async () => {
    const wrapper = mount(VueTailwindDatePicker, {
      attachTo: document.body,
      props: {
        asSingle: true,
        useRange: false,
        modelValue: '',
        formatter: {
          date: 'YYYY-MM-DD HH:mm:ss',
          month: 'MMM',
        },
      },
    })

    const value = '2026-02-15 11:59:52'
    const input = wrapper.get('input[type="text"]')
    ;(input.element as HTMLInputElement).value = value
    await input.trigger('input')
    await nextTick()

    let updates = wrapper.emitted('update:modelValue') ?? []
    expect(updates.length).toBeGreaterThan(0)
    expect(updates.at(-1)?.[0]).toBe(value)
    const countAfterInput = updates.length

    await input.trigger('keyup', { key: '2' })
    await nextTick()

    updates = wrapper.emitted('update:modelValue') ?? []
    expect(updates).toHaveLength(countAfterInput)

    wrapper.unmount()
  })

  it('syncs range text input on input events in 12-hour mode', async () => {
    const wrapper = mount(VueTailwindDatePicker, {
      attachTo: document.body,
      props: {
        asSingle: false,
        useRange: true,
        modelValue: '',
        formatter: {
          date: 'YYYY-MM-DD hh:mm:ss A',
          month: 'MMM',
        },
      },
    })

    const value = '2026-02-15 11:59:52 AM ~ 2026-02-25 05:30:00 PM'
    const input = wrapper.get('input[type="text"]')
    ;(input.element as HTMLInputElement).value = value
    await input.trigger('input')
    await nextTick()

    const updates = wrapper.emitted('update:modelValue') ?? []
    expect(updates.length).toBeGreaterThan(0)
    expect(updates.at(-1)?.[0]).toBe(value)

    wrapper.unmount()
  })
})
