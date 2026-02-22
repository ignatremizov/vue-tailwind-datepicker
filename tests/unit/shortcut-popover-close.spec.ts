import { mount } from '@vue/test-utils'
import dayjs from 'dayjs'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import VueTailwindDatePicker from '../../src/VueTailwindDatePicker.vue'
import { createLocalDate, withFixedNow } from './shortcut-test-utils'

const DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss'

const nextWeekRangeShortcut = {
  id: 'highlight-next-week-range',
  label: 'Highlight next week range',
  resolver: ({ now, mode }: { now: Date, mode: 'single' | 'range' }) => {
    const start = dayjs(now).add(1, 'week').startOf('week')
    const end = start.endOf('week')
    if (mode === 'range')
      return [start.toDate(), end.toDate()] as [Date, Date]
    return start.toDate()
  },
}

async function mountPopoverPicker(props: Record<string, unknown> = {}) {
  const wrapper = mount(VueTailwindDatePicker, {
    attachTo: document.body,
    props: {
      noInput: false,
      autoApply: true,
      asSingle: true,
      useRange: true,
      shortcuts: [nextWeekRangeShortcut],
      modelValue: {
        startDate: createLocalDate(2026, 0, 15, 12, 0, 0),
        endDate: createLocalDate(2026, 0, 16, 12, 0, 0),
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
  await nextTick()
}

function getShortcutButton(wrapper: ReturnType<typeof mount>, label: string) {
  return wrapper.findAll('button.vtd-shortcuts').find(button => button.text().trim() === label)
}

describe.sequential('shortcut popover close behavior', () => {
  it('keeps popover open after range shortcut when closeOnRangeSelection=false', async () => {
    await withFixedNow(createLocalDate(2026, 1, 14, 9, 0, 0), async () => {
      const wrapper = await mountPopoverPicker({
        closeOnRangeSelection: false,
      })

      await openPopover(wrapper)
      expect(isPopoverOpen(wrapper)).toBe(true)

      const shortcut = getShortcutButton(wrapper, 'Highlight next week range')
      expect(shortcut).toBeTruthy()
      await shortcut!.trigger('click')
      await nextTick()

      expect(isPopoverOpen(wrapper)).toBe(true)

      const updates = wrapper.emitted('update:modelValue')
      expect(updates).toBeTruthy()
      const lastPayload = updates!.at(-1)?.[0] as Record<string, string>
      expect(lastPayload.startDate).toBe(
        dayjs(createLocalDate(2026, 1, 14, 9, 0, 0))
          .add(1, 'week')
          .startOf('week')
          .format(DATE_FORMAT),
      )
      expect(lastPayload.endDate).toBe(
        dayjs(createLocalDate(2026, 1, 14, 9, 0, 0))
          .add(1, 'week')
          .startOf('week')
          .endOf('week')
          .format(DATE_FORMAT),
      )

      wrapper.unmount()
    })
  })

  it('closes popover after range shortcut when closeOnRangeSelection=true', async () => {
    await withFixedNow(createLocalDate(2026, 1, 14, 9, 0, 0), async () => {
      const wrapper = await mountPopoverPicker({
        closeOnRangeSelection: true,
      })

      await openPopover(wrapper)
      expect(isPopoverOpen(wrapper)).toBe(true)

      const shortcut = getShortcutButton(wrapper, 'Highlight next week range')
      expect(shortcut).toBeTruthy()
      await shortcut!.trigger('click')
      await nextTick()
      await nextTick()

      expect(isPopoverOpen(wrapper)).toBe(false)

      wrapper.unmount()
    })
  })
})
