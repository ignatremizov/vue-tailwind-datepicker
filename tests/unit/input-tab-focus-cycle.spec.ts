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

function getFocusableCalendarEdgeButtons(
  wrapper: ReturnType<typeof mount>,
  panel: 'previous' | 'next' = 'previous',
) {
  const panelRoot = wrapper.get(`[data-vtd-selector-panel="${panel}"]`)
  const focusableButtons = panelRoot
    .findAll('button.vtd-datepicker-date')
    .filter(button => button.attributes('disabled') === undefined)
  expect(focusableButtons.length).toBeGreaterThan(0)
  return {
    first: focusableButtons[0]!,
    last: focusableButtons[focusableButtons.length - 1]!,
  }
}

function getCalendarFocusTargetByPanel(
  wrapper: ReturnType<typeof mount>,
  panel: 'previous' | 'next',
) {
  return wrapper
    .get(`[data-vtd-selector-panel="${panel}"]`)
    .get('.vtd-calendar-focus-target')
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

  it('closes popover on Escape from focused input and keeps input focused', async () => {
    await withFixedNow(createLocalDate(2026, 1, 14, 9, 0, 0), async () => {
      const wrapper = await mountPopoverPicker({
        openFocusTarget: 'input',
      })
      await openPopover(wrapper)

      const input = wrapper.get('input')
      ;(input.element as HTMLInputElement).focus()
      expect(document.activeElement).toBe(input.element)

      await input.trigger('keydown', { key: 'Escape' })
      await nextTick()
      await vi.advanceTimersByTimeAsync(320)
      await nextTick()

      expect(wrapper.find('.vtd-datepicker').exists()).toBe(false)
      expect(document.activeElement).toBe(input.element)

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
      const yearButton = wrapper.get('#vtd-header-previous-year')
      const startButton = findButtonByText(wrapper, 'Start')
      const firstWheel = wrapper.get('.vtd-time-wheel[role="listbox"]')
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
      expect(document.activeElement).toBe(yearButton.element)

      await yearButton.trigger('keydown', { key: 'Tab' })
      await nextTick()
      expect(document.activeElement).toBe(startButton!.element)

      await startButton!.trigger('keydown', { key: 'Tab' })
      await nextTick()
      expect(document.activeElement).toBe(firstWheel.element)

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
      const yearButton = wrapper.get('#vtd-header-previous-year')
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
      expect(document.activeElement).toBe(yearButton.element)

      await yearButton.trigger('keydown', { key: 'Tab' })
      await nextTick()
      expect(document.activeElement).toBe(cancelButton.element)

      await cancelButton.trigger('keydown', { key: 'Tab' })
      await nextTick()
      expect(document.activeElement).toBe(applyButton.element)

      wrapper.unmount()
    })
  })

  it('keeps dual-panel tab cycle as calendar -> shortcuts -> headers -> second calendar -> second headers -> actions', async () => {
    await withFixedNow(createLocalDate(2026, 1, 14, 9, 0, 0), async () => {
      const wrapper = await mountPopoverPicker({
        asSingle: false,
      })
      await openPopover(wrapper)

      const previousCalendarTarget = getCalendarFocusTargetByPanel(wrapper, 'previous')
      const shortcutButton = wrapper.get('.vtd-shortcuts')
      const previousMonthHeader = wrapper.get('#vtd-header-previous-month')
      const previousYearHeader = wrapper.get('#vtd-header-previous-year')
      const nextCalendarTarget = getCalendarFocusTargetByPanel(wrapper, 'next')
      const nextMonthHeader = wrapper.get('#vtd-header-next-month')
      const nextYearHeader = wrapper.get('#vtd-header-next-year')
      const cancelButton = wrapper.get('.away-cancel-picker')

      ;(previousCalendarTarget.element as HTMLElement).focus()
      await previousCalendarTarget.trigger('keydown', { key: 'Tab' })
      await nextTick()
      expect(document.activeElement).toBe(shortcutButton.element)

      await shortcutButton.trigger('keydown', { key: 'Tab' })
      await nextTick()
      expect(document.activeElement).toBe(previousMonthHeader.element)

      await previousMonthHeader.trigger('keydown', { key: 'Tab' })
      await nextTick()
      expect(document.activeElement).toBe(previousYearHeader.element)

      await previousYearHeader.trigger('keydown', { key: 'Tab' })
      await nextTick()
      expect(document.activeElement).toBe(nextCalendarTarget.element)

      await nextCalendarTarget.trigger('keydown', { key: 'Tab' })
      await nextTick()
      expect(document.activeElement).toBe(nextMonthHeader.element)

      await nextMonthHeader.trigger('keydown', { key: 'Tab' })
      await nextTick()
      expect(document.activeElement).toBe(nextYearHeader.element)

      await nextYearHeader.trigger('keydown', { key: 'Tab' })
      await nextTick()
      expect(document.activeElement).toBe(cancelButton.element)

      wrapper.unmount()
    })
  })

  it('tabs to the first enabled shortcut when earlier shortcuts are disabled', async () => {
    await withFixedNow(createLocalDate(2026, 1, 14, 9, 0, 0), async () => {
      const wrapper = await mountPopoverPicker({
        shortcuts: [
          {
            label: 'Disabled shortcut',
            disabled: true,
            atClick: () => [createLocalDate(2026, 1, 1, 0, 0, 0)],
          },
          {
            label: 'Enabled shortcut',
            atClick: () => [createLocalDate(2026, 1, 2, 0, 0, 0)],
          },
        ],
      })
      await openPopover(wrapper)

      const calendarTarget = wrapper.get('.vtd-calendar-focus-target')
      const enabledShortcut = findButtonByText(wrapper, 'Enabled shortcut')
      expect(enabledShortcut).toBeTruthy()

      ;(calendarTarget.element as HTMLElement).focus()
      await calendarTarget.trigger('keydown', { key: 'Tab' })
      await nextTick()
      expect(document.activeElement).toBe(enabledShortcut!.element)

      wrapper.unmount()
    })
  })

  it('steps month from legacy month header with arrow keys', async () => {
    await withFixedNow(createLocalDate(2026, 1, 14, 9, 0, 0), async () => {
      const wrapper = await mountPopoverPicker()
      await openPopover(wrapper)

      const headerButton = wrapper.get('#vtd-header-previous-month')
      const normalizeHeaderText = () => wrapper.get('#vtd-header-previous-month').text().trim()

      ;(headerButton.element as HTMLElement).focus()
      const before = normalizeHeaderText()

      await headerButton.trigger('keydown', { key: 'ArrowRight' })
      await nextTick()
      const afterIncrement = normalizeHeaderText()
      expect(afterIncrement).not.toBe(before)

      await wrapper.get('#vtd-header-previous-month').trigger('keydown', { key: 'ArrowLeft' })
      await nextTick()
      const afterDecrement = normalizeHeaderText()
      expect(afterDecrement).toBe(before)

      wrapper.unmount()
    })
  })

  it('steps year from legacy year header with arrow keys', async () => {
    await withFixedNow(createLocalDate(2026, 1, 14, 9, 0, 0), async () => {
      const wrapper = await mountPopoverPicker()
      await openPopover(wrapper)

      const yearButton = wrapper.get('#vtd-header-previous-year')
      const normalizeYearText = () => wrapper.get('#vtd-header-previous-year').text().trim()

      ;(yearButton.element as HTMLElement).focus()
      const before = normalizeYearText()

      await yearButton.trigger('keydown', { key: 'ArrowRight' })
      await nextTick()
      const afterIncrement = normalizeYearText()
      expect(afterIncrement).not.toBe(before)

      await yearButton.trigger('keydown', { key: 'ArrowLeft' })
      await nextTick()
      expect(normalizeYearText()).toBe(before)

      wrapper.unmount()
    })
  })

  it('moves focus from legacy month header to calendar on ArrowDown and ArrowUp', async () => {
    await withFixedNow(createLocalDate(2026, 1, 14, 9, 0, 0), async () => {
      const wrapper = await mountPopoverPicker()
      await openPopover(wrapper)

      const headerButton = wrapper.get('#vtd-header-previous-month')
      const calendarTarget = wrapper.get('.vtd-calendar-focus-target')
      const normalizeHeaderText = () => wrapper.get('#vtd-header-previous-month').text().trim()
      const before = normalizeHeaderText()

      ;(headerButton.element as HTMLElement).focus()
      await headerButton.trigger('keydown', { key: 'ArrowDown' })
      await nextTick()
      expect(document.activeElement).toBe(calendarTarget.element)
      expect(normalizeHeaderText()).toBe(before)

      ;(headerButton.element as HTMLElement).focus()
      await headerButton.trigger('keydown', { key: 'ArrowUp' })
      await nextTick()
      expect(document.activeElement).toBe(calendarTarget.element)
      expect(normalizeHeaderText()).toBe(before)

      wrapper.unmount()
    })
  })

  it('moves focus from calendar to joined header on Tab in selector calendar mode when shortcuts are hidden', async () => {
    await withFixedNow(createLocalDate(2026, 1, 14, 9, 0, 0), async () => {
      const wrapper = await mountPopoverPicker({
        selectorMode: true,
        shortcuts: false,
      })
      await openPopover(wrapper)

      const calendarTarget = wrapper.get('.vtd-calendar-focus-target')
      const headerButton = wrapper.get('#vtd-header-previous-month')

      ;(calendarTarget.element as HTMLElement).focus()
      await calendarTarget.trigger('keydown', { key: 'Tab' })
      await nextTick()
      expect(document.activeElement).toBe(headerButton.element)

      wrapper.unmount()
    })
  })

  it('steps month from joined header arrows in selector calendar mode', async () => {
    await withFixedNow(createLocalDate(2026, 1, 14, 9, 0, 0), async () => {
      const wrapper = await mountPopoverPicker({
        selectorMode: true,
      })
      await openPopover(wrapper)

      const normalizeHeaderText = () => {
        return wrapper.get('#vtd-header-previous-month').text().replace(/\s+/g, ' ').trim()
      }
      const headerButton = wrapper.get('#vtd-header-previous-month')
      const before = normalizeHeaderText()

      ;(headerButton.element as HTMLElement).focus()
      await headerButton.trigger('keydown', { key: 'ArrowRight' })
      await nextTick()
      expect(document.activeElement).toBe(headerButton.element)
      const afterIncrement = normalizeHeaderText()
      expect(afterIncrement).not.toBe(before)

      await wrapper.get('#vtd-header-previous-month').trigger('keydown', { key: 'ArrowLeft' })
      await nextTick()
      expect(normalizeHeaderText()).toBe(before)

      wrapper.unmount()
    })
  })

  it('uses header arrows and Escape while selector wheels are open', async () => {
    await withFixedNow(createLocalDate(2026, 1, 14, 9, 0, 0), async () => {
      const wrapper = await mountPopoverPicker({
        selectorMode: true,
      })
      await openPopover(wrapper)

      const headerButton = wrapper.get('#vtd-header-previous-month')
      await headerButton.trigger('click')
      await nextTick()

      const normalizeHeaderText = () => {
        return wrapper.get('#vtd-header-previous-month').text().replace(/\s+/g, ' ').trim()
      }

      const before = normalizeHeaderText()
      ;(headerButton.element as HTMLElement).focus()
      await headerButton.trigger('keydown', { key: 'ArrowRight' })
      await nextTick()
      const afterIncrement = normalizeHeaderText()
      expect(afterIncrement).not.toBe(before)

      await headerButton.trigger('keydown', { key: 'ArrowLeft' })
      await nextTick()
      expect(normalizeHeaderText()).toBe(before)

      await headerButton.trigger('keydown', { key: 'ArrowDown' })
      await nextTick()
      expect(document.activeElement?.getAttribute('aria-label')).toBe('Month selector')

      ;(headerButton.element as HTMLElement).focus()
      await headerButton.trigger('keydown', { key: 'Escape' })
      await nextTick()

      expect(wrapper.find('.vtd-datepicker').exists()).toBe(true)
      expect(wrapper.find('[aria-label="Month selector"]').exists()).toBe(false)
      expect(wrapper.find('[aria-label="Year selector"]').exists()).toBe(false)

      wrapper.unmount()
    })
  })

  it('moves focus from joined selector header to calendar on ArrowDown and ArrowUp', async () => {
    await withFixedNow(createLocalDate(2026, 1, 14, 9, 0, 0), async () => {
      const wrapper = await mountPopoverPicker({
        selectorMode: true,
      })
      await openPopover(wrapper)

      const headerButton = wrapper.get('#vtd-header-previous-month')
      const calendarTarget = wrapper.get('.vtd-calendar-focus-target')
      const normalizeHeaderText = () => {
        return wrapper.get('#vtd-header-previous-month').text().replace(/\s+/g, ' ').trim()
      }
      const before = normalizeHeaderText()

      ;(headerButton.element as HTMLElement).focus()
      await headerButton.trigger('keydown', { key: 'ArrowDown' })
      await nextTick()
      expect(document.activeElement).toBe(calendarTarget.element)
      expect(normalizeHeaderText()).toBe(before)

      ;(headerButton.element as HTMLElement).focus()
      await headerButton.trigger('keydown', { key: 'ArrowUp' })
      await nextTick()
      expect(document.activeElement).toBe(calendarTarget.element)
      expect(normalizeHeaderText()).toBe(before)

      wrapper.unmount()
    })
  })

  it('moves focus from calendar top/bottom edges to legacy header on ArrowUp/ArrowDown', async () => {
    await withFixedNow(createLocalDate(2026, 1, 14, 9, 0, 0), async () => {
      const wrapper = await mountPopoverPicker()
      await openPopover(wrapper)

      const headerButton = wrapper.get('#vtd-header-previous-month')
      const { first, last } = getFocusableCalendarEdgeButtons(wrapper, 'previous')

      ;(first.element as HTMLElement).focus()
      await first.trigger('keydown', { key: 'ArrowUp' })
      await nextTick()
      expect(document.activeElement).toBe(headerButton.element)

      ;(last.element as HTMLElement).focus()
      await last.trigger('keydown', { key: 'ArrowDown' })
      await nextTick()
      expect(document.activeElement).toBe(headerButton.element)

      wrapper.unmount()
    })
  })

  it('moves focus from calendar top/bottom edges to joined header in selector calendar mode', async () => {
    await withFixedNow(createLocalDate(2026, 1, 14, 9, 0, 0), async () => {
      const wrapper = await mountPopoverPicker({
        selectorMode: true,
      })
      await openPopover(wrapper)

      const headerButton = wrapper.get('#vtd-header-previous-month')
      const { first, last } = getFocusableCalendarEdgeButtons(wrapper, 'previous')

      ;(first.element as HTMLElement).focus()
      await first.trigger('keydown', { key: 'ArrowUp' })
      await nextTick()
      expect(document.activeElement).toBe(headerButton.element)

      ;(last.element as HTMLElement).focus()
      await last.trigger('keydown', { key: 'ArrowDown' })
      await nextTick()
      expect(document.activeElement).toBe(headerButton.element)

      wrapper.unmount()
    })
  })

  it('shows selected-day circle on first pointer click in range mode before hover range exists', async () => {
    await withFixedNow(createLocalDate(2026, 1, 14, 9, 0, 0), async () => {
      const wrapper = await mountPopoverPicker({
        shortcutPreset: 'modern',
      })
      await openPopover(wrapper)

      const firstClicked = wrapper.get('[data-date-key="2026-02-02"]')
      await firstClicked.trigger('click')
      await nextTick()

      const classNames = wrapper.get('[data-date-key="2026-02-02"]').attributes('class') ?? ''
      expect(classNames).toContain('vtd-datepicker-date-selected-single')

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
