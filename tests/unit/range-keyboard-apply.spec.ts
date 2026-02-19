import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import VueTailwindDatePicker from '../../src/VueTailwindDatePicker.vue'
import { createLocalDate, withFixedNow } from './shortcut-test-utils'

async function mountPopoverPicker(props: Record<string, unknown> = {}) {
  const wrapper = mount(VueTailwindDatePicker, {
    attachTo: document.body,
    props: {
      noInput: false,
      autoApply: false,
      asSingle: true,
      useRange: true,
      modelValue: {
        startDate: '',
        endDate: '',
      },
      ...props,
    },
  })

  await vi.advanceTimersByTimeAsync(320)
  await nextTick()
  return wrapper
}

function isPopoverOpen(wrapper: ReturnType<typeof mount>) {
  return wrapper.find('.vtd-datepicker').exists()
}

async function openPopover(wrapper: ReturnType<typeof mount>) {
  await wrapper.get('input').trigger('click')
  await nextTick()
  await vi.advanceTimersByTimeAsync(320)
  await nextTick()
}

describe.sequential('range keyboard apply behavior', () => {
  it('applies and closes after Enter is pressed again on the selected end date', async () => {
    await withFixedNow(createLocalDate(2026, 1, 14, 9, 0, 0), async () => {
      const wrapper = await mountPopoverPicker()

      await openPopover(wrapper)
      expect(isPopoverOpen(wrapper)).toBe(true)

      const startButton = wrapper.get('[data-date-key="2026-02-10"]')
      const endButton = wrapper.get('[data-date-key="2026-02-14"]')

      await startButton.trigger('focusin')
      await startButton.trigger('keydown', { key: 'Enter' })
      await nextTick()
      expect(wrapper.emitted('update:modelValue')).toBeFalsy()

      await endButton.trigger('focusin')
      await endButton.trigger('keydown', { key: 'Enter' })
      await nextTick()
      expect(isPopoverOpen(wrapper)).toBe(true)
      expect(wrapper.emitted('update:modelValue')).toBeFalsy()

      await endButton.trigger('keydown', { key: 'Enter' })
      await nextTick()
      await vi.advanceTimersByTimeAsync(320)
      await nextTick()

      const updates = wrapper.emitted('update:modelValue') ?? []
      expect(updates.length).toBeGreaterThan(0)
      const lastPayload = updates.at(-1)?.[0] as Record<string, string>
      expect(lastPayload.startDate.startsWith('2026-02-10')).toBe(true)
      expect(lastPayload.endDate.startsWith('2026-02-14')).toBe(true)
      expect(isPopoverOpen(wrapper)).toBe(false)

      wrapper.unmount()
    })
  })
})
