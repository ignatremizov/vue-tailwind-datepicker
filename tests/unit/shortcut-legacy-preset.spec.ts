import { mount } from '@vue/test-utils'
import dayjs from 'dayjs'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import VueTailwindDatePicker from '../../src/VueTailwindDatePicker.vue'
import { SHORTCUT_EDGE_FIXTURES, withFixedNow } from './shortcut-test-utils'

const DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss'

async function mountPicker(props: Record<string, unknown> = {}) {
  const wrapper = mount(VueTailwindDatePicker, {
    attachTo: document.body,
    props: {
      noInput: true,
      shortcuts: true,
      useRange: true,
      asSingle: true,
      autoApply: true,
      modelValue: [new Date('2026-01-15T12:00:00'), new Date('2026-01-15T12:00:00')],
      ...props,
    },
  })
  await vi.advanceTimersByTimeAsync(320)
  await nextTick()
  return wrapper
}

function getShortcutLabels(wrapper: ReturnType<typeof mount>) {
  return wrapper.findAll('button.vtd-shortcuts').map(button => button.text().trim())
}

function getLastRangeEmission(wrapper: ReturnType<typeof mount>) {
  const emitted = wrapper.emitted('update:modelValue')
  expect(emitted).toBeTruthy()
  const latest = emitted!.at(-1)?.[0]
  expect(Array.isArray(latest)).toBe(true)
  return latest as string[]
}

describe.sequential('shortcutPreset=legacy', () => {
  it('uses legacy built-ins when shortcutPreset is omitted', async () => {
    await withFixedNow(SHORTCUT_EDGE_FIXTURES.monthBoundary.now, async () => {
      const wrapper = await mountPicker()
      expect(getShortcutLabels(wrapper)).toEqual([
        'Today',
        'Yesterday',
        'Last 7 Days',
        'Last 30 Days',
        'This Month',
        'Last Month',
      ])
      wrapper.unmount()
    })
  })

  it('keeps legacy built-ins when shortcutPreset="legacy"', async () => {
    await withFixedNow(SHORTCUT_EDGE_FIXTURES.monthBoundary.now, async () => {
      const wrapper = await mountPicker({ shortcutPreset: 'legacy' })
      expect(getShortcutLabels(wrapper)).toEqual([
        'Today',
        'Yesterday',
        'Last 7 Days',
        'Last 30 Days',
        'This Month',
        'Last Month',
      ])
      wrapper.unmount()
    })
  })

  it('applies Today in legacy mode with stable [d, d] output in range mode', async () => {
    const now = SHORTCUT_EDGE_FIXTURES.weekendSaturday.now
    await withFixedNow(now, async () => {
      const wrapper = await mountPicker({ shortcutPreset: 'legacy' })
      const todayButton = wrapper
        .findAll('button.vtd-shortcuts')
        .find(item => item.text().trim() === 'Today')
      expect(todayButton).toBeTruthy()
      await todayButton!.trigger('click')
      await nextTick()
      const expected = dayjs(now).format(DATE_FORMAT)
      expect(getLastRangeEmission(wrapper)).toEqual([expected, expected])
      wrapper.unmount()
    })
  })
})
