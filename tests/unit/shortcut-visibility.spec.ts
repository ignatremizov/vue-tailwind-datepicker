import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import VueTailwindDatePicker from '../../src/VueTailwindDatePicker.vue'
import { SHORTCUT_EDGE_FIXTURES, withFixedNow } from './shortcut-test-utils'

async function mountPicker(props: Record<string, unknown>) {
  const wrapper = mount(VueTailwindDatePicker, {
    attachTo: document.body,
    props: {
      noInput: true,
      shortcuts: true,
      autoApply: true,
      modelValue: '2026-01-15 12:00:00',
      ...props,
    },
  })

  await vi.advanceTimersByTimeAsync(320)
  await nextTick()
  return wrapper
}

function hasShortcutButtons(wrapper: ReturnType<typeof mount>) {
  return wrapper.findAll('button.vtd-shortcuts').length > 0
}

describe.sequential('shortcut visibility matrix', () => {
  it('shows shortcuts for useRange=false and asSingle=false', async () => {
    await withFixedNow(SHORTCUT_EDGE_FIXTURES.monthBoundary.now, async () => {
      const wrapper = await mountPicker({
        useRange: false,
        asSingle: false,
      })
      expect(hasShortcutButtons(wrapper)).toBe(true)
      wrapper.unmount()
    })
  })

  it('shows shortcuts for useRange=true and asSingle=false', async () => {
    await withFixedNow(SHORTCUT_EDGE_FIXTURES.monthBoundary.now, async () => {
      const wrapper = await mountPicker({
        useRange: true,
        asSingle: false,
      })
      expect(hasShortcutButtons(wrapper)).toBe(true)
      wrapper.unmount()
    })
  })

  it('shows shortcuts for useRange=true and asSingle=true', async () => {
    await withFixedNow(SHORTCUT_EDGE_FIXTURES.monthBoundary.now, async () => {
      const wrapper = await mountPicker({
        useRange: true,
        asSingle: true,
      })
      expect(hasShortcutButtons(wrapper)).toBe(true)
      wrapper.unmount()
    })
  })

  it('hides shortcuts for useRange=false and asSingle=true', async () => {
    await withFixedNow(SHORTCUT_EDGE_FIXTURES.monthBoundary.now, async () => {
      const wrapper = await mountPicker({
        useRange: false,
        asSingle: true,
      })
      expect(hasShortcutButtons(wrapper)).toBe(false)
      wrapper.unmount()
    })
  })

  it('does not fall back to built-ins when custom shortcuts are provided as an empty list', async () => {
    await withFixedNow(SHORTCUT_EDGE_FIXTURES.monthBoundary.now, async () => {
      const wrapper = await mountPicker({
        useRange: true,
        asSingle: true,
        shortcutPreset: 'modern',
        shortcuts: [],
      })
      expect(hasShortcutButtons(wrapper)).toBe(false)
      wrapper.unmount()
    })
  })
})
