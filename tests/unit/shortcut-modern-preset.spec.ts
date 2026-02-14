import dayjs from 'dayjs'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import VueTailwindDatePicker from '../../src/VueTailwindDatePicker.vue'
import {
  SHORTCUT_EDGE_FIXTURES,
  addBusinessDays,
  addCalendarDays,
  clampToNextMonth,
  withFixedNow,
} from './shortcut-test-utils'

const DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss'

async function mountModernPresetPicker() {
  const wrapper = mount(VueTailwindDatePicker, {
    attachTo: document.body,
    props: {
      noInput: true,
      shortcuts: true,
      shortcutPreset: 'modern',
      useRange: true,
      asSingle: true,
      autoApply: true,
      modelValue: [new Date('2026-01-15T12:00:00'), new Date('2026-01-15T12:00:00')],
    },
  })

  await vi.advanceTimersByTimeAsync(320)
  await nextTick()
  return wrapper
}

function getShortcutButtons(wrapper: ReturnType<typeof mount>) {
  return wrapper.findAll('button.vtd-shortcuts')
}

function getShortcutLabels(wrapper: ReturnType<typeof mount>) {
  return getShortcutButtons(wrapper).map(button => button.text().trim())
}

async function clickShortcut(wrapper: ReturnType<typeof mount>, label: string) {
  const button = getShortcutButtons(wrapper).find(item => item.text().trim() === label)
  expect(button).toBeTruthy()
  await button!.trigger('click')
  await nextTick()
}

function getLastRangeEmission(wrapper: ReturnType<typeof mount>) {
  const emitted = wrapper.emitted('update:modelValue')
  expect(emitted).toBeTruthy()
  const latest = emitted!.at(-1)?.[0]
  expect(Array.isArray(latest)).toBe(true)
  return latest as string[]
}

function expectedSingleRange(date: Date) {
  const value = dayjs(date).format(DATE_FORMAT)
  return [value, value]
}

describe('shortcutPreset=modern', () => {
  it('renders modern built-ins and hides legacy built-ins', async () => {
    await withFixedNow(SHORTCUT_EDGE_FIXTURES.weekendSaturday.now, async () => {
      const wrapper = await mountModernPresetPicker()
      expect(getShortcutLabels(wrapper)).toEqual([
        'Today',
        '3 business days',
        'Next week',
        'Next month',
      ])
      wrapper.unmount()
    })
  })

  it('applies Today as a [d, d] range in range mode', async () => {
    const now = SHORTCUT_EDGE_FIXTURES.weekendSaturday.now
    await withFixedNow(now, async () => {
      const wrapper = await mountModernPresetPicker()
      await clickShortcut(wrapper, 'Today')
      expect(getLastRangeEmission(wrapper)).toEqual(expectedSingleRange(now))
      wrapper.unmount()
    })
  })

  it('applies 3 business days excluding weekends', async () => {
    const now = SHORTCUT_EDGE_FIXTURES.weekendSaturday.now
    await withFixedNow(now, async () => {
      const wrapper = await mountModernPresetPicker()
      await clickShortcut(wrapper, '3 business days')
      expect(getLastRangeEmission(wrapper)).toEqual(
        expectedSingleRange(addBusinessDays(now, 3)),
      )
      wrapper.unmount()
    })
  })

  it('applies Next week as +7 calendar days', async () => {
    const now = SHORTCUT_EDGE_FIXTURES.monthBoundary.now
    await withFixedNow(now, async () => {
      const wrapper = await mountModernPresetPicker()
      await clickShortcut(wrapper, 'Next week')
      expect(getLastRangeEmission(wrapper)).toEqual(
        expectedSingleRange(addCalendarDays(now, 7)),
      )
      wrapper.unmount()
    })
  })

  it('clamps Next month at the destination month end', async () => {
    const now = SHORTCUT_EDGE_FIXTURES.weekendSaturday.now
    await withFixedNow(now, async () => {
      const wrapper = await mountModernPresetPicker()
      await clickShortcut(wrapper, 'Next month')
      expect(getLastRangeEmission(wrapper)).toEqual(
        expectedSingleRange(clampToNextMonth(now)),
      )
      wrapper.unmount()
    })
  })

  it('routes Enter and Space activation through the shared shortcut pipeline', async () => {
    const now = SHORTCUT_EDGE_FIXTURES.weekendSaturday.now
    await withFixedNow(now, async () => {
      const wrapper = await mountModernPresetPicker()
      const nextWeekButton = getShortcutButtons(wrapper).find(item => item.text().trim() === 'Next week')
      expect(nextWeekButton).toBeTruthy()
      await nextWeekButton!.trigger('keydown', { key: 'Enter' })
      await nextTick()
      expect(getLastRangeEmission(wrapper)).toEqual(
        expectedSingleRange(addCalendarDays(now, 7)),
      )

      const nextMonthButton = getShortcutButtons(wrapper).find(item => item.text().trim() === 'Next month')
      expect(nextMonthButton).toBeTruthy()
      await nextMonthButton!.trigger('keydown.space')
      await nextTick()
      expect(getLastRangeEmission(wrapper)).toEqual(
        expectedSingleRange(clampToNextMonth(now)),
      )

      wrapper.unmount()
    })
  })
})
