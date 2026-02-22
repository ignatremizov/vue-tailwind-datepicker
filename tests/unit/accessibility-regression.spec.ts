import { mount } from '@vue/test-utils'
import axe from 'axe-core'
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
      shortcutPreset: 'modern',
      shortcuts: true,
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

async function waitForTransitionMs(ms: number) {
  await new Promise(resolve => setTimeout(resolve, ms))
}

describe.sequential('accessibility regression', () => {
  it('has no serious/critical axe violations in the open popover', async () => {
    const wrapper = mount(VueTailwindDatePicker, {
      attachTo: document.body,
      props: {
        noInput: false,
        autoApply: false,
        asSingle: true,
        useRange: true,
        shortcutPreset: 'modern',
        shortcuts: true,
        modelValue: {
          startDate: createLocalDate(2026, 1, 10, 12, 0, 0),
          endDate: createLocalDate(2026, 1, 14, 12, 0, 0),
        },
      },
    })

    await nextTick()
    await wrapper.get('input').trigger('click')
    await nextTick()
    await waitForTransitionMs(350)

    const results = await axe.run(wrapper.element as HTMLElement, {
      rules: {
        'color-contrast': { enabled: false },
        'aria-allowed-attr': { enabled: false },
      },
    })
    const blockingViolations = results.violations.filter((violation) => {
      return violation.impact === 'serious' || violation.impact === 'critical'
    })

    expect(blockingViolations).toHaveLength(0)

    wrapper.unmount()
  }, 15000)

  it('keeps the keyboard focus path reachable across calendar, shortcuts, header, and footer', async () => {
    await withFixedNow(createLocalDate(2026, 1, 14, 9, 0, 0), async () => {
      const wrapper = await mountPopoverPicker()
      await openPopover(wrapper)

      const calendarTarget = wrapper.get('.vtd-calendar-focus-target')
      const shortcutButton = wrapper.get('.vtd-shortcuts')
      const monthHeader = wrapper.get('#vtd-header-previous-month')
      const yearHeader = wrapper.get('#vtd-header-previous-year')
      const cancelButton = wrapper.get('.away-cancel-picker')

      ;(calendarTarget.element as HTMLElement).focus()
      await calendarTarget.trigger('keydown', { key: 'Tab' })
      await nextTick()
      expect(document.activeElement).toBe(shortcutButton.element)

      await shortcutButton.trigger('keydown', { key: 'Tab' })
      await nextTick()
      expect(document.activeElement).toBe(monthHeader.element)

      await monthHeader.trigger('keydown', { key: 'Tab' })
      await nextTick()
      expect(document.activeElement).toBe(yearHeader.element)

      await yearHeader.trigger('keydown', { key: 'Tab' })
      await nextTick()
      expect(document.activeElement).toBe(cancelButton.element)

      wrapper.unmount()
    })
  })

  it('announces month changes and invalid shortcuts through aria-live', async () => {
    await withFixedNow(createLocalDate(2026, 1, 14, 9, 0, 0), async () => {
      const wrapper = await mountPopoverPicker({
        shortcuts: [
          {
            id: 'invalid-shortcut',
            label: 'Invalid shortcut',
            resolver: () => null as unknown as Date,
          },
        ],
      })
      await openPopover(wrapper)

      const liveRegion = wrapper.get('[aria-live="polite"]')
      expect(liveRegion.text()).toBe('')

      await wrapper.get('[aria-label="Previous month"]').trigger('click')
      await nextTick()
      expect(liveRegion.text()).toContain('Month changed to')

      const invalidShortcut = wrapper.findAll('button.vtd-shortcuts')
        .find(button => button.text().trim() === 'Invalid shortcut')
      expect(invalidShortcut).toBeTruthy()
      await invalidShortcut!.trigger('click')
      await nextTick()
      expect(liveRegion.text()).toContain('Shortcut unavailable')

      wrapper.unmount()
    })
  })
})
