import { mount } from '@vue/test-utils'
import dayjs from 'dayjs'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import VueTailwindDatePicker from '../../src/VueTailwindDatePicker.vue'
import {
  addBusinessDays,
  addCalendarDays,
  clampToNextMonth,
  SHORTCUT_EDGE_FIXTURES,
  withFixedNow,
} from './shortcut-test-utils'

const DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss'

async function mountModernPresetPicker(props: Record<string, unknown> = {}) {
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
      ...props,
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

describe.sequential('shortcutPreset=modern', () => {
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
      const nextWeekButton = getShortcutButtons(wrapper).find(
        item => item.text().trim() === 'Next week',
      )
      expect(nextWeekButton).toBeTruthy()
      await nextWeekButton!.trigger('keydown', { key: 'Enter' })
      await nextTick()
      expect(getLastRangeEmission(wrapper)).toEqual(
        expectedSingleRange(addCalendarDays(now, 7)),
      )

      const nextMonthButton = getShortcutButtons(wrapper).find(
        item => item.text().trim() === 'Next month',
      )
      expect(nextMonthButton).toBeTruthy()
      await nextMonthButton!.trigger('keyup.space')
      await nextTick()
      expect(getLastRangeEmission(wrapper)).toEqual(
        expectedSingleRange(clampToNextMonth(now)),
      )

      wrapper.unmount()
    })
  })

  it('moves shortcut focus with arrow keys', async () => {
    await withFixedNow(SHORTCUT_EDGE_FIXTURES.weekendSaturday.now, async () => {
      const wrapper = await mountModernPresetPicker()
      const buttons = getShortcutButtons(wrapper)
      expect(buttons.length).toBeGreaterThan(1)
      ;(buttons[0]!.element as HTMLElement).focus()
      expect(document.activeElement).toBe(buttons[0]!.element)

      await buttons[0]!.trigger('keydown', { key: 'ArrowDown' })
      await nextTick()
      expect(document.activeElement).toBe(buttons[1]!.element)

      await buttons[1]!.trigger('keydown', { key: 'ArrowUp' })
      await nextTick()
      expect(document.activeElement).toBe(buttons[0]!.element)

      wrapper.unmount()
    })
  })

  it('supports localized modern shortcut labels from options.shortcuts', async () => {
    const now = SHORTCUT_EDGE_FIXTURES.weekendSaturday.now
    await withFixedNow(now, async () => {
      const wrapper = await mountModernPresetPicker({
        options: {
          shortcuts: {
            today: 'Hoy',
            yesterday: 'Ayer',
            past: (period: number) => `Ultimos ${period} dias`,
            currentMonth: 'Este mes',
            pastMonth: 'Mes pasado',
            businessDays: (period: number) => `${period} dias habiles`,
            nextWeek: 'Proxima semana',
            nextMonth: 'Proximo mes',
          },
          footer: {
            apply: 'Aplicar',
            cancel: 'Cancelar',
          },
        },
      })

      expect(getShortcutLabels(wrapper)).toEqual([
        'Hoy',
        '3 dias habiles',
        'Proxima semana',
        'Proximo mes',
      ])

      await clickShortcut(wrapper, 'Proxima semana')
      expect(getLastRangeEmission(wrapper)).toEqual(
        expectedSingleRange(addCalendarDays(now, 7)),
      )

      wrapper.unmount()
    })
  })
})
