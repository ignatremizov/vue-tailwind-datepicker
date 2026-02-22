import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
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
        startDate: createLocalDate(2026, 1, 10, 12, 0, 0),
        endDate: createLocalDate(2026, 1, 14, 12, 0, 0),
      },
      ...props,
    },
  })

  await vi.advanceTimersByTimeAsync(320)
  await nextTick()
  return wrapper
}

async function openPopover(wrapper: ReturnType<typeof mount>) {
  await wrapper.get('input').trigger('click')
  await nextTick()
  await vi.advanceTimersByTimeAsync(320)
  await nextTick()
}

async function clickOutsidePopover() {
  const pointerDownEvent
    = typeof PointerEvent === 'function'
      ? new PointerEvent('pointerdown', { bubbles: true })
      : new MouseEvent('pointerdown', { bubbles: true })
  document.body.dispatchEvent(pointerDownEvent)
  document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
  document.body.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
  document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await nextTick()
  await vi.advanceTimersByTimeAsync(320)
  await nextTick()
}

function findButtonByText(wrapper: ReturnType<typeof mount>, text: string) {
  return wrapper.findAll('button').find(button => button.text().trim() === text)
}

describe.sequential('input tab focus handoff', () => {
  it('keeps focus on input after opening when openFocusTarget=input', async () => {
    await withFixedNow(createLocalDate(2026, 1, 14, 9, 0, 0), async () => {
      const wrapper = await mountPopoverPicker({
        openFocusTarget: 'input',
      })
      await openPopover(wrapper)

      const calendarTarget = wrapper.find('.vtd-calendar-focus-target')
      expect(calendarTarget.exists()).toBe(true)
      expect(document.activeElement).not.toBe(calendarTarget.element)

      wrapper.unmount()
    })
  })

  it('moves focus from input into picker targets on Tab when popover is open', async () => {
    await withFixedNow(createLocalDate(2026, 1, 14, 9, 0, 0), async () => {
      const wrapper = await mountPopoverPicker()
      await openPopover(wrapper)

      const input = wrapper.get('input')
      ;(input.element as HTMLInputElement).focus()
      expect(document.activeElement).toBe(input.element)

      await input.trigger('keydown', { key: 'Tab' })
      await nextTick()

      const calendarTarget = wrapper.find('.vtd-calendar-focus-target')
      expect(calendarTarget.exists()).toBe(true)
      expect(document.activeElement).toBe(calendarTarget.element)

      wrapper.unmount()
    })
  })

  it('keeps popover open when clicking the text input while already open', async () => {
    await withFixedNow(createLocalDate(2026, 1, 14, 9, 0, 0), async () => {
      const wrapper = await mountPopoverPicker({
        openFocusTarget: 'input',
      })
      await openPopover(wrapper)

      const input = wrapper.get('input')
      await input.trigger('mousedown')
      await input.trigger('click')
      await nextTick()

      expect(wrapper.find('.vtd-datepicker').exists()).toBe(true)

      wrapper.unmount()
    })
  })

  it('closes on outside click without restoring trigger focus by default', async () => {
    await withFixedNow(createLocalDate(2026, 1, 14, 9, 0, 0), async () => {
      const wrapper = await mountPopoverPicker({
        openFocusTarget: 'input',
      })
      await openPopover(wrapper)

      const input = wrapper.get('input')
      await clickOutsidePopover()

      expect(wrapper.find('.vtd-datepicker').exists()).toBe(false)
      expect(document.activeElement).not.toBe(input.element)

      wrapper.unmount()
    })
  })

  it('keeps calendar in the tab sequence for wheel-inline mode', async () => {
    await withFixedNow(createLocalDate(2026, 1, 14, 9, 0, 0), async () => {
      const wrapper = await mountPopoverPicker({
        timePickerStyle: 'wheel-inline',
        timeInlinePosition: 'right',
      })
      await openPopover(wrapper)

      const input = wrapper.get('input')
      ;(input.element as HTMLInputElement).focus()
      await input.trigger('keydown', { key: 'Tab' })
      await nextTick()

      const calendarTarget = wrapper.get('.vtd-calendar-focus-target')
      const shortcutButton = wrapper.get('.vtd-shortcuts')
      const headerButton = wrapper.get('#vtd-header-previous-month')
      const startButton = findButtonByText(wrapper, 'Start')
      const firstWheel = wrapper.get('.vtd-time-wheel[role="listbox"]')
      const wheelNodes = wrapper.findAll('.vtd-time-wheel[role="listbox"]')
      const lastWheel = wheelNodes[wheelNodes.length - 1]
      const cancelButton = findButtonByText(wrapper, 'Cancel')
      const applyButton = findButtonByText(wrapper, 'Apply')
      expect(document.activeElement).toBe(calendarTarget.element)

      await calendarTarget.trigger('keydown', { key: 'Tab' })
      await nextTick()
      expect(document.activeElement).toBe(shortcutButton.element)

      await shortcutButton.trigger('keydown', { key: 'Tab' })
      await nextTick()
      expect(document.activeElement).toBe(headerButton.element)

      expect(startButton).toBeTruthy()
      await headerButton.trigger('keydown', { key: 'Tab' })
      await nextTick()
      expect(document.activeElement).toBe(startButton!.element)

      await startButton!.trigger('keydown', { key: 'Tab' })
      await nextTick()
      expect(document.activeElement).toBe(firstWheel.element)

      expect(lastWheel).toBeTruthy()
      ;(lastWheel!.element as HTMLElement).focus()
      await lastWheel!.trigger('keydown', { key: 'Tab' })
      await nextTick()
      expect(cancelButton).toBeTruthy()
      expect(document.activeElement).toBe(cancelButton!.element)

      await cancelButton!.trigger('keydown', { key: 'Tab' })
      await nextTick()
      expect(applyButton).toBeTruthy()
      expect(document.activeElement).toBe(applyButton!.element)

      await applyButton!.trigger('keydown', { key: 'Tab' })
      await nextTick()
      expect(document.activeElement).toBe(calendarTarget.element)

      wrapper.unmount()
    })
  }, 40000)

  it('keeps footer actions reachable in calendar-mode tab cycle', async () => {
    await withFixedNow(createLocalDate(2026, 1, 14, 9, 0, 0), async () => {
      const wrapper = await mountPopoverPicker()
      await openPopover(wrapper)

      const calendarTarget = wrapper.get('.vtd-calendar-focus-target')
      const shortcutButton = wrapper.get('.vtd-shortcuts')
      const headerButton = wrapper.get('#vtd-header-previous-month')
      const cancelButton = wrapper.get('.away-cancel-picker')
      const applyButton = wrapper.get('.away-apply-picker')

      ;(calendarTarget.element as HTMLElement).focus()
      await calendarTarget.trigger('keydown', { key: 'Tab' })
      await nextTick()
      expect(document.activeElement).toBe(shortcutButton.element)

      await shortcutButton.trigger('keydown', { key: 'Tab' })
      await nextTick()
      expect(document.activeElement).toBe(headerButton.element)

      await headerButton.trigger('keydown', { key: 'Tab' })
      await nextTick()
      expect(document.activeElement).toBe(cancelButton.element)

      await cancelButton.trigger('keydown', { key: 'Tab' })
      await nextTick()
      expect(document.activeElement).toBe(applyButton.element)

      wrapper.unmount()
    })
  })

  it('cycles footer actions with ArrowLeft/ArrowRight', async () => {
    await withFixedNow(createLocalDate(2026, 1, 14, 9, 0, 0), async () => {
      const wrapper = await mountPopoverPicker({
        timePickerStyle: 'wheel-page',
      })
      await openPopover(wrapper)

      const cancelButton = findButtonByText(wrapper, 'Cancel')
      const timeButton = findButtonByText(wrapper, 'Time')
      const applyButton = findButtonByText(wrapper, 'Apply')
      expect(cancelButton).toBeTruthy()
      expect(timeButton).toBeTruthy()
      expect(applyButton).toBeTruthy()
      ;(cancelButton!.element as HTMLElement).focus()
      await cancelButton!.trigger('keydown', { key: 'ArrowRight' })
      await nextTick()
      expect(document.activeElement).toBe(timeButton!.element)

      await timeButton!.trigger('keydown', { key: 'ArrowRight' })
      await nextTick()
      expect(document.activeElement).toBe(applyButton!.element)

      await applyButton!.trigger('keydown', { key: 'ArrowRight' })
      await nextTick()
      expect(document.activeElement).toBe(cancelButton!.element)

      await cancelButton!.trigger('keydown', { key: 'ArrowLeft' })
      await nextTick()
      expect(document.activeElement).toBe(applyButton!.element)

      wrapper.unmount()
    })
  })
})
