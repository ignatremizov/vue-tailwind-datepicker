import { defineComponent, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import dayjs from 'dayjs'
import VueTailwindDatePicker from '../../src/VueTailwindDatePicker.vue'
import TimeWheel from '../../src/components/TimeWheel.vue'
import Year from '../../src/components/Year.vue'
import { createLocalDate } from './shortcut-test-utils'

function dispatchKey(target: HTMLElement, options: { key: string; shiftKey?: boolean }) {
  target.dispatchEvent(new KeyboardEvent('keydown', {
    key: options.key,
    bubbles: true,
    cancelable: true,
    shiftKey: !!options.shiftKey,
  }))
}

function findButtonByText(wrapper: ReturnType<typeof mount>, label: string) {
  return wrapper.findAll('button')
    .find(button => button.text().trim() === label)
}

async function settleUi(delayMs = 0) {
  if (delayMs > 0)
    await vi.advanceTimersByTimeAsync(delayMs)
  await nextTick()
  await nextTick()
}

async function mountTimePicker(props: Record<string, unknown> = {}) {
  const wrapper = mount(VueTailwindDatePicker, {
    attachTo: document.body,
    props: {
      noInput: false,
      autoApply: false,
      asSingle: false,
      useRange: true,
      selectorMode: true,
      timePickerStyle: 'wheel-page',
      formatter: {
        date: 'YYYY-MM-DD hh:mm:ss A',
        month: 'MMM',
      },
      modelValue: {
        startDate: createLocalDate(2026, 1, 12, 8, 4, 45),
        endDate: createLocalDate(2026, 1, 22, 20, 4, 45),
      },
      ...props,
    },
  })

  await settleUi(320)
  return wrapper
}

async function openPopover(wrapper: ReturnType<typeof mount>) {
  await wrapper.get('input').trigger('click')
  await settleUi(320)
}

async function openTimePage(wrapper: ReturnType<typeof mount>) {
  const buttons = wrapper.findAll('button').filter(button => button.text().trim() === 'Time')
  const toggle = buttons.at(-1)
  expect(toggle).toBeTruthy()
  await toggle!.trigger('click')
  await settleUi(320)
}

async function ensureTimePageOpen(wrapper: ReturnType<typeof mount>) {
  const buttons = wrapper.findAll('button').filter(button => button.text().trim() === 'Time')
  const toggle = buttons.at(-1)
  if (!toggle)
    return
  await toggle.trigger('click')
  await settleUi(320)
}

describe.sequential('time panel layout behavior', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders independent start/end wheels in dual-panel wheel-page mode', async () => {
    const wrapper = await mountTimePicker()
    await openPopover(wrapper)
    await openTimePage(wrapper)

    expect(wrapper.text()).toContain('Start time')
    expect(wrapper.text()).toContain('End time')
    expect(wrapper.findAll('[aria-label="Hour wheel"]').length).toBe(2)
    expect(wrapper.findAll('[aria-label="Minute wheel"]').length).toBe(2)
    expect(wrapper.findAll('[aria-label="Second wheel"]').length).toBe(2)
    expect(wrapper.findAll('[aria-label="Meridiem wheel"]').length).toBe(2)

    wrapper.unmount()
  }, 15000)

  it('keeps the selected endpoint when clicking hour options in single-panel range mode', async () => {
    const wrapper = await mountTimePicker({
      asSingle: true,
      useRange: true,
    })

    await openPopover(wrapper)
    await openTimePage(wrapper)

    const headerTitle = () => wrapper.get('.vtd-time-panel-fill p.text-xs.font-medium').text().trim()
    const startButton = wrapper.findAll('button').find(button => button.text().trim() === 'Start')
    expect(startButton).toBeTruthy()
    if (headerTitle() !== 'Start time') {
      await startButton!.trigger('click')
      await nextTick()
    }
    expect(headerTitle()).toBe('Start time')

    const options = wrapper.findAll('button[role="option"]')
    expect(options.length).toBeGreaterThan(0)
    const targetHour = options.find(option => option.attributes('aria-selected') !== 'true')

    expect(targetHour).toBeTruthy()
    await targetHour!.trigger('click')
    await nextTick()
    await nextTick()

    expect(headerTitle()).toBe('Start time')

    wrapper.unmount()
  })

  it('toggles to the opposite endpoint when clicking the active endpoint toggle again', async () => {
    const wrapper = await mountTimePicker({
      asSingle: true,
      useRange: true,
      timePickerStyle: 'wheel-page',
    })

    await openPopover(wrapper)
    await openTimePage(wrapper)

    const headerTitle = () => wrapper.get('.vtd-time-panel-fill p.text-xs.font-medium').text().trim()
    const startButton = findButtonByText(wrapper, 'Start')
    const endButton = findButtonByText(wrapper, 'End')
    expect(startButton).toBeTruthy()
    expect(endButton).toBeTruthy()

    if (headerTitle() !== 'Start time') {
      await startButton!.trigger('click')
      await nextTick()
    }
    expect(headerTitle()).toBe('Start time')

    await endButton!.trigger('click')
    await nextTick()
    expect(headerTitle()).toBe('End time')

    await endButton!.trigger('click')
    await nextTick()
    expect(headerTitle()).toBe('Start time')

    await startButton!.trigger('click')
    await nextTick()
    expect(headerTitle()).toBe('End time')

    wrapper.unmount()
  })

  it('renders wheel-inline controls inside the calendar row when timeInlinePosition=right', async () => {
    const wrapper = await mountTimePicker({
      timePickerStyle: 'wheel-inline',
      timeInlinePosition: 'right',
    })

    await openPopover(wrapper)

    const contentRow = wrapper.find('div.relative.flex.flex-wrap.sm\\:flex-nowrap.p-1.w-full')
    expect(contentRow.exists()).toBe(true)
    expect(contentRow.text()).toContain('Start time')
    expect(contentRow.text()).toContain('Start')
    expect(contentRow.text()).toContain('End')
    expect(wrapper.findAll('[aria-label="Hour wheel"]').length).toBe(1)
    expect(wrapper.findAll('[aria-label="Minute wheel"]').length).toBe(1)

    wrapper.unmount()
  })

  it('keeps wheel-inline-right selection rendered after close and reopen', async () => {
    const wrapper = await mountTimePicker({
      timePickerStyle: 'wheel-inline',
      timeInlinePosition: 'right',
      asSingle: true,
      useRange: true,
    })

    await openPopover(wrapper)

    const countSelectedOptions = () => {
      return wrapper.findAll('.vtd-time-wheel [role="option"][aria-selected="true"]').length
    }

    expect(countSelectedOptions()).toBeGreaterThan(0)

    await wrapper.get('input').trigger('click')
    await nextTick()
    await nextTick()

    await wrapper.get('input').trigger('click')
    await nextTick()
    await nextTick()
    await settleUi(400)

    expect(countSelectedOptions()).toBeGreaterThan(0)

    wrapper.unmount()
  }, 60000)

  it('switches endpoint toggle with ArrowLeft/ArrowRight', async () => {
    const wrapper = await mountTimePicker({
      asSingle: true,
      useRange: true,
      timePickerStyle: 'wheel-inline',
      timeInlinePosition: 'right',
    })

    await openPopover(wrapper)

    const startButton = findButtonByText(wrapper, 'Start')
    const endButton = findButtonByText(wrapper, 'End')
    expect(startButton).toBeTruthy()
    expect(endButton).toBeTruthy()

    ;(startButton!.element as HTMLElement).focus()
    dispatchKey(startButton!.element as HTMLElement, { key: 'ArrowRight' })
    await settleUi()

    const endButtonAfterRight = findButtonByText(wrapper, 'End')
    expect(endButtonAfterRight).toBeTruthy()
    expect(endButtonAfterRight!.classes()).toContain('bg-vtd-primary-600')
    expect(document.activeElement).toBe(endButtonAfterRight!.element)

    dispatchKey(endButtonAfterRight!.element as HTMLElement, { key: 'ArrowLeft' })
    await settleUi()

    const startButtonAfterLeft = findButtonByText(wrapper, 'Start')
    expect(startButtonAfterLeft).toBeTruthy()
    expect(startButtonAfterLeft!.classes()).toContain('bg-vtd-primary-600')
    expect(document.activeElement).toBe(startButtonAfterLeft!.element)

    wrapper.unmount()
  }, 60000)

  it('keeps wheel-inline controls stacked below the calendar by default', async () => {
    const wrapper = await mountTimePicker({
      timePickerStyle: 'wheel-inline',
      timeInlinePosition: 'below',
    })

    await openPopover(wrapper)

    const contentRow = wrapper.find('div.relative.flex.flex-wrap.sm\\:flex-nowrap.p-1.w-full')
    expect(contentRow.exists()).toBe(true)
    expect(contentRow.text()).not.toContain('Start time')
    expect(contentRow.text()).not.toContain('End time')
    expect(wrapper.text()).toContain('Start time')
    expect(wrapper.text()).toContain('End time')

    wrapper.unmount()
  })

  it('centers Start/End toggle only when shortcut panel is present in wheel-inline below mode', async () => {
    const withShortcuts = await mountTimePicker({
      asSingle: true,
      useRange: true,
      timePickerStyle: 'wheel-inline',
      timeInlinePosition: 'below',
      shortcuts: true,
    })
    await openPopover(withShortcuts)
    expect(withShortcuts.find('[data-vtd-time-endpoint-toggle-centered]').exists()).toBe(true)
    withShortcuts.unmount()

    const withoutShortcuts = await mountTimePicker({
      asSingle: true,
      useRange: true,
      timePickerStyle: 'wheel-inline',
      timeInlinePosition: 'below',
      shortcuts: false,
    })
    await openPopover(withoutShortcuts)
    expect(withoutShortcuts.find('[data-vtd-time-endpoint-toggle-centered]').exists()).toBe(false)
    withoutShortcuts.unmount()
  })

  it('uses timeWheelHeight for compact wheel-inline layout', async () => {
    const wrapper = await mountTimePicker({
      asSingle: true,
      useRange: true,
      timePickerStyle: 'wheel-inline',
      timeInlinePosition: 'below',
      timeWheelHeight: 220,
    })

    await openPopover(wrapper)

    const endpoint = wrapper.find('.vtd-time-endpoint')
    expect(endpoint.exists()).toBe(true)
    const layout = endpoint.element.parentElement as HTMLElement | null
    expect(layout).toBeTruthy()
    expect(layout!.style.minHeight).toBe('220px')
    expect(layout!.style.height).toBe('220px')

    wrapper.unmount()
  })

  it('uses timeWheelPageHeight as minimum height in wheel-page layout', async () => {
    const wrapper = await mountTimePicker({
      asSingle: true,
      useRange: true,
      timePickerStyle: 'wheel-page',
      timeWheelPageHeight: 280,
    })

    await openPopover(wrapper)
    await openTimePage(wrapper)

    const endpoint = wrapper.find('.vtd-time-endpoint')
    expect(endpoint.exists()).toBe(true)
    const layout = endpoint.element.parentElement as HTMLElement | null
    expect(layout).toBeTruthy()
    expect(layout!.style.minHeight).toBe('280px')
    expect(layout!.style.height).toBe('')

    wrapper.unmount()
  })

  it('keeps selector no-time single-panel footer inside the picker shell', async () => {
    const wrapper = await mountTimePicker({
      asSingle: true,
      useRange: true,
      selectorMode: true,
      timePickerStyle: 'none',
      autoApply: false,
    })

    await openPopover(wrapper)

    const pickerShell = wrapper.get('.vtd-datepicker')
    expect(pickerShell.classes()).not.toContain('sm:h-[23.5rem]')

    const footerApply = pickerShell.find('.away-apply-picker')
    const footerCancel = pickerShell.find('.away-cancel-picker')
    expect(footerApply.exists()).toBe(true)
    expect(footerCancel.exists()).toBe(true)

    const hasTimeFooterButton = pickerShell.findAll('button')
      .some(button => button.text().trim() === 'Time')
    expect(hasTimeFooterButton).toBe(false)

    wrapper.unmount()
  })

  it('keeps dual wheel-page layout bounded after reopening from single time view', async () => {
    const wrapper = await mountTimePicker({
      asSingle: true,
      useRange: true,
      timePickerStyle: 'wheel-page',
      timeWheelPageHeight: 232,
    })

    await openPopover(wrapper)
    await openTimePage(wrapper)

    // Close while time page is active, then reopen in dual mode.
    await wrapper.get('input').trigger('click')
    await settleUi(320)

    await wrapper.setProps({ asSingle: false })
    await settleUi(320)

    await openPopover(wrapper)
    await ensureTimePageOpen(wrapper)
    await settleUi(320)

    const endpoint = wrapper.find('.vtd-time-endpoint')
    expect(endpoint.exists()).toBe(true)
    const layout = endpoint.element.parentElement as HTMLElement | null
    expect(layout).toBeTruthy()
    expect(layout!.style.minHeight).toBe('232px')
    expect(layout!.style.height).toBe('232px')

    wrapper.unmount()
  })

  it('hydrates date-only model values when formatter.date contains an ISO T time delimiter', async () => {
    const wrapper = await mountTimePicker({
      noInput: true,
      asSingle: true,
      useRange: true,
      timePickerStyle: 'input',
      formatter: {
        date: 'YYYY-MM-DDTHH:mm:ss',
        month: 'MMM',
      },
      defaultTime: '08:30:00',
      defaultEndTime: '09:45:00',
      modelValue: {
        startDate: '2026-02-13',
        endDate: '2026-02-14',
      },
    })

    await settleUi(320)

    const inputs = wrapper.findAll('.vtd-time-endpoint input[type="text"]')
    expect(inputs.length).toBe(2)
    expect((inputs[0]!.element as HTMLInputElement).value).toBe('08:30:00')
    expect((inputs[1]!.element as HTMLInputElement).value).toBe('09:45:00')

    wrapper.unmount()
  }, 60000)

  it('hydrates date-only model values when formatter.date uses Dayjs escaped [T] delimiter', async () => {
    const wrapper = await mountTimePicker({
      noInput: true,
      asSingle: true,
      useRange: true,
      timePickerStyle: 'input',
      formatter: {
        date: 'YYYY-MM-DD[T]HH:mm:ss',
        month: 'MMM',
      },
      defaultTime: '08:30:00',
      defaultEndTime: '09:45:00',
      modelValue: {
        startDate: '2026-02-13',
        endDate: '2026-02-14',
      },
    })

    await settleUi(320)

    const inputs = wrapper.findAll('.vtd-time-endpoint input[type="text"]')
    expect(inputs.length).toBe(2)
    expect((inputs[0]!.element as HTMLInputElement).value).toBe('08:30:00')
    expect((inputs[1]!.element as HTMLInputElement).value).toBe('09:45:00')

    wrapper.unmount()
  }, 60000)

  it('shows both start and end time inputs in single-panel range input mode', async () => {
    const wrapper = await mountTimePicker({
      asSingle: true,
      useRange: true,
      timePickerStyle: 'input',
    })

    await openPopover(wrapper)
    const timeToggle = wrapper.findAll('button').find(button => button.text().trim() === 'Time')
    if (timeToggle) {
      await timeToggle.trigger('click')
      await nextTick()
      await nextTick()
    }

    expect(wrapper.text()).toContain('Start time')
    expect(wrapper.text()).toContain('End time')
    expect(wrapper.findAll('.vtd-time-endpoint').length).toBe(2)
    expect(wrapper.findAll('.vtd-time-endpoint input[type="text"]').length).toBe(2)

    wrapper.unmount()
  })

  it('cycles time wheel focus with arrow and tab keyboard actions', async () => {
    const wheelItems = Array.from({ length: 12 }, (_, index) => ({
      label: String(index).padStart(2, '0'),
      value: index,
    }))

    const Harness = defineComponent({
      components: {
        TimeWheel,
      },
      setup() {
        const hour = ref<number | string>(1)
        const minute = ref<number | string>(2)
        const second = ref<number | string>(3)
        const meridiem = ref<number | string>(4)
        return {
          wheelItems,
          hour,
          minute,
          second,
          meridiem,
        }
      },
      template: `
        <div class="vtd-time-wheel-grid grid grid-cols-4 gap-2">
          <TimeWheel v-model="hour" aria-label="Hour wheel" :items="wheelItems" />
          <TimeWheel v-model="minute" aria-label="Minute wheel" :items="wheelItems" />
          <TimeWheel v-model="second" aria-label="Second wheel" :items="wheelItems" />
          <TimeWheel v-model="meridiem" aria-label="Meridiem wheel" :items="wheelItems" />
        </div>
      `,
    })
    const wrapper = mount(Harness, { attachTo: document.body })
    await nextTick()

    const wheels = wrapper.findAll('.vtd-time-wheel').map(node => node.element as HTMLElement)
    expect(wheels.length).toBe(4)

    const hourWheel = wheels[0]!
    const minuteWheel = wheels[1]!
    const secondWheel = wheels[2]!
    const meridiemWheel = wheels[3]!

    hourWheel.focus()
    expect(document.activeElement).toBe(hourWheel)

    dispatchKey(hourWheel, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(minuteWheel)

    dispatchKey(minuteWheel, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(secondWheel)

    dispatchKey(secondWheel, { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(minuteWheel)

    dispatchKey(minuteWheel, { key: 'Tab' })
    expect(document.activeElement).toBe(secondWheel)

    dispatchKey(secondWheel, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(minuteWheel)

    hourWheel.focus()
    dispatchKey(hourWheel, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(meridiemWheel)

    dispatchKey(meridiemWheel, { key: 'Tab' })
    expect(document.activeElement).toBe(hourWheel)

    wrapper.unmount()
  })

  it('keeps ArrowUp/ArrowDown wheel scrolling aligned to fractional offset', async () => {
    const scrollSpy = vi.spyOn(HTMLElement.prototype, 'scrollTo')
      .mockImplementation(function (this: HTMLElement, options?: ScrollToOptions | number) {
        if (typeof options === 'number') {
          this.scrollTop = arguments[1] as number
          return
        }
        if (options && typeof options.top === 'number')
          this.scrollTop = options.top
      })

    const wheelItems = Array.from({ length: 60 }, (_, index) => ({
      label: String(index).padStart(2, '0'),
      value: index,
    }))

    const Harness = defineComponent({
      components: {
        TimeWheel,
      },
      setup() {
        const value = ref<number | string>(10)
        return {
          wheelItems,
          value,
        }
      },
      template: `
        <div class="vtd-time-wheel-grid grid grid-cols-1 gap-2">
          <TimeWheel
            v-model="value"
            aria-label="Second wheel"
            :items="wheelItems"
            scroll-mode="fractional"
            :fractional-offset="0.25"
          />
        </div>
      `,
    })

    const wrapper = mount(Harness, { attachTo: document.body })
    await settleUi(320)

    const wheel = wrapper.get('.vtd-time-wheel').element as HTMLElement
    Object.defineProperty(wheel, 'clientHeight', {
      configurable: true,
      value: 176,
    })

    scrollSpy.mockClear()
    wheel.focus()
    dispatchKey(wheel, { key: 'ArrowDown' })
    await settleUi()

    let smoothTop: number | null = null
    for (const call of [...scrollSpy.mock.calls].reverse()) {
      const arg = call[0] as ScrollToOptions | undefined
      if (arg && typeof arg === 'object' && arg.behavior === 'smooth' && typeof arg.top === 'number') {
        smoothTop = arg.top
        break
      }
    }

    expect(smoothTop).not.toBeNull()
    const derivedIndex = ((smoothTop as number) + 66) / 44
    const fractionalPart = Math.abs(derivedIndex - Math.round(derivedIndex))
    expect(fractionalPart).toBeGreaterThan(0.2)
    expect(fractionalPart).toBeLessThan(0.3)

    scrollSpy.mockRestore()
    wrapper.unmount()
  })

  it('marks disabled time wheel controls as disabled and non-tabbable', async () => {
    const wheelItems = Array.from({ length: 12 }, (_, index) => ({
      label: String(index).padStart(2, '0'),
      value: index,
    }))

    const Harness = defineComponent({
      components: {
        TimeWheel,
      },
      setup() {
        const value = ref<number | string>(1)
        return {
          wheelItems,
          value,
        }
      },
      template: `
        <div class="vtd-time-wheel-grid grid grid-cols-1 gap-2">
          <TimeWheel v-model="value" aria-label="Hour wheel" :items="wheelItems" :disabled="true" />
        </div>
      `,
    })

    const wrapper = mount(Harness, { attachTo: document.body })
    await settleUi(320)

    const wheel = wrapper.get('.vtd-time-wheel')
    expect(wheel.attributes('aria-disabled')).toBe('true')
    expect(wheel.attributes('tabindex')).toBe('-1')

    const stepButtons = wrapper.findAll('.vtd-time-wheel-shell > button')
    expect(stepButtons.length).toBe(2)
    for (const button of stepButtons)
      expect(button.attributes('disabled')).toBeDefined()

    wrapper.unmount()
  })

  it('emits stable step payloads across wheel wrap/rebase with keyboard stepping', async () => {
    const wheelItems = Array.from({ length: 4 }, (_, index) => ({
      label: String(index),
      value: index,
    }))

    const Harness = defineComponent({
      components: {
        TimeWheel,
      },
      setup() {
        const value = ref<number | string>(0)
        const steps = ref<Array<{
          value: number | string
          previousValue: number | string | null
          absoluteIndex: number
          previousAbsoluteIndex: number | null
          delta: number
        }>>([])

        function onStep(payload: {
          value: number | string
          previousValue: number | string | null
          absoluteIndex: number
          previousAbsoluteIndex: number | null
          delta: number
        }) {
          steps.value.push(payload)
        }

        return {
          wheelItems,
          value,
          steps,
          onStep,
        }
      },
      template: `
        <div class="vtd-time-wheel-grid grid grid-cols-1 gap-2">
          <TimeWheel v-model="value" aria-label="Hour wheel" :items="wheelItems" @step="onStep" />
        </div>
      `,
    })

    const wrapper = mount(Harness, { attachTo: document.body })
    await settleUi(320)
    const wheel = wrapper.get('.vtd-time-wheel').element as HTMLElement
    wheel.focus()

    const stepCount = 240
    for (let i = 0; i < stepCount; i += 1)
      dispatchKey(wheel, { key: 'ArrowDown' })

    await nextTick()
    const steps = (wrapper.vm as unknown as { steps: Array<any> }).steps
    expect(steps.length).toBe(stepCount)

    for (let index = 0; index < steps.length; index += 1) {
      const payload = steps[index]
      expect(payload.delta).toBe(1)
      if (index === 0) {
        expect(payload.previousValue).toBe(0)
        continue
      }
      const previous = steps[index - 1]
      expect(payload.previousValue).toBe(previous.value)
    }

    wrapper.unmount()
  })

  it('cycles time mode focus through endpoint toggles and footer actions', async () => {
    const wrapper = await mountTimePicker({
      asSingle: true,
      useRange: true,
      autoApply: false,
    })

    await openPopover(wrapper)
    await openTimePage(wrapper)

    const startButton = findButtonByText(wrapper, 'Start')
    const endButton = findButtonByText(wrapper, 'End')
    const cancelButton = findButtonByText(wrapper, 'Cancel')
    const calendarButton = findButtonByText(wrapper, 'Calendar')
    const applyButton = findButtonByText(wrapper, 'Apply')
    expect(startButton).toBeTruthy()
    expect(endButton).toBeTruthy()
    expect(cancelButton).toBeTruthy()
    expect(calendarButton).toBeTruthy()
    expect(applyButton).toBeTruthy()

    const shortcutButton = wrapper.get('.vtd-shortcuts').element as HTMLElement
    const firstWheel = wrapper.get('.vtd-time-panel-fill .vtd-time-wheel-grid .vtd-time-wheel').element as HTMLElement
    const wheelNodes = wrapper.findAll('.vtd-time-panel-fill .vtd-time-wheel-grid .vtd-time-wheel')
    const lastWheel = wheelNodes[wheelNodes.length - 1]!.element as HTMLElement
    const activeToggleButton = startButton!.classes().includes('bg-vtd-primary-600')
      ? startButton!
      : endButton!

    shortcutButton.focus()
    dispatchKey(shortcutButton, { key: 'Tab' })
    expect(document.activeElement).toBe(activeToggleButton.element)

    dispatchKey(activeToggleButton.element as HTMLElement, { key: 'Tab' })
    expect(document.activeElement).toBe(firstWheel)

    dispatchKey(firstWheel, { key: 'ArrowDown' })
    await nextTick()

    const applyButtonAfterChange = findButtonByText(wrapper, 'Apply')
    expect(applyButtonAfterChange).toBeTruthy()
    const isApplyEnabled = !(applyButtonAfterChange!.element as HTMLButtonElement).disabled

    lastWheel.focus()
    dispatchKey(lastWheel, { key: 'Tab' })
    expect(document.activeElement).toBe(cancelButton!.element)

    dispatchKey(cancelButton!.element as HTMLElement, { key: 'Tab' })
    expect(document.activeElement).toBe(calendarButton!.element)

    dispatchKey(calendarButton!.element as HTMLElement, { key: 'Tab' })
    if (isApplyEnabled)
      expect(document.activeElement).toBe(applyButtonAfterChange!.element)
    else
      expect(document.activeElement).toBe(shortcutButton)

    wrapper.unmount()
  }, 60000)

  it('skips disabled wheels in time-mode tab cycle before date selection', async () => {
    const wrapper = await mountTimePicker({
      noInput: false,
      asSingle: true,
      useRange: true,
      autoApply: false,
      timePickerStyle: 'wheel-page',
      modelValue: {
        startDate: '',
        endDate: '',
      },
    })

    await openPopover(wrapper)
    await openTimePage(wrapper)

    const endButton = findButtonByText(wrapper, 'End')
    const cancelButton = findButtonByText(wrapper, 'Cancel')
    const firstWheel = wrapper.get('.vtd-time-panel-fill .vtd-time-wheel-grid .vtd-time-wheel').element as HTMLElement
    expect(endButton).toBeTruthy()
    expect(cancelButton).toBeTruthy()
    expect(firstWheel.getAttribute('aria-disabled')).toBe('true')

    ;(endButton!.element as HTMLElement).focus()
    dispatchKey(endButton!.element as HTMLElement, { key: 'Tab' })
    expect(document.activeElement).toBe(cancelButton!.element)
    expect(document.activeElement).not.toBe(firstWheel)

    wrapper.unmount()
  }, 30000)

  it('keeps fractional hour selection stable after close and reopen', async () => {
    const wrapper = await mountTimePicker({
      asSingle: true,
      useRange: true,
      timeWheelScrollMode: 'fractional',
      timePickerStyle: 'wheel-page',
    })

    await openPopover(wrapper)
    await openTimePage(wrapper)

    const startButton = findButtonByText(wrapper, 'Start')
    if (startButton)
      await startButton.trigger('click')
    await nextTick()

    const before = (wrapper.get('input').element as HTMLInputElement).value
    expect(before.length).toBeGreaterThan(0)

    await wrapper.get('input').trigger('click')
    await nextTick()
    await nextTick()

    await wrapper.get('input').trigger('click')
    await nextTick()
    await nextTick()

    await ensureTimePageOpen(wrapper)
    await settleUi(700)

    const after = (wrapper.get('input').element as HTMLInputElement).value
    expect(after).toBe(before)

    wrapper.unmount()
  }, 30000)

  it('keeps meridiem wheel carry direction stable when second/minute boundaries are clicked', async () => {
    const wrapper = await mountTimePicker({
      asSingle: true,
      useRange: true,
      timePickerStyle: 'wheel-inline',
      timeInlinePosition: 'right',
      timeWheelScrollMode: 'fractional',
      modelValue: {
        startDate: createLocalDate(2026, 1, 22, 23, 59, 59),
        endDate: createLocalDate(2026, 1, 28, 23, 59, 59),
      },
    })

    await openPopover(wrapper)

    const secondWheel = wrapper.findAll('[aria-label="Second wheel"]').at(0)
    const minuteWheel = wrapper.findAll('[aria-label="Minute wheel"]').at(0)
    const hourWheel = wrapper.findAll('[aria-label="Hour wheel"]').at(0)
    const meridiemWheel = wrapper.findAll('[aria-label="Meridiem wheel"]').at(0)
    expect(secondWheel).toBeTruthy()
    expect(minuteWheel).toBeTruthy()
    expect(hourWheel).toBeTruthy()
    expect(meridiemWheel).toBeTruthy()

    const clickOption = async (wheel: ReturnType<typeof wrapper.find>, value: string) => {
      const option = wheel.findAll('[role="option"]')
        .filter(node => node.text().trim() === value)
        .sort((a, b) => {
          const aRow = a.element.closest('[data-time-index]')
          const bRow = b.element.closest('[data-time-index]')
          const aIndex = Number.parseInt(aRow?.getAttribute('data-time-index') ?? '', 10)
          const bIndex = Number.parseInt(bRow?.getAttribute('data-time-index') ?? '', 10)
          const aDistance = Number.isFinite(aIndex) ? Math.abs(aIndex - 180) : Number.POSITIVE_INFINITY
          const bDistance = Number.isFinite(bIndex) ? Math.abs(bIndex - 180) : Number.POSITIVE_INFINITY
          return aDistance - bDistance
        })
        .at(0)
      expect(option).toBeTruthy()
      await option!.trigger('click')
      await nextTick()
      await nextTick()
    }

    const selectedText = (wheel: ReturnType<typeof wrapper.find>) => {
      const selected = wheel.findAll('[role="option"][aria-selected="true"]')
      expect(selected.length).toBe(1)
      return selected[0]!.text().trim()
    }

    await clickOption(secondWheel!, '00')
    expect(selectedText(hourWheel!)).toBe('12')
    expect(selectedText(minuteWheel!)).toBe('00')
    expect(selectedText(secondWheel!)).toBe('00')
    expect(selectedText(meridiemWheel!)).toBe('AM')

    await clickOption(secondWheel!, '59')
    expect(selectedText(hourWheel!)).toBe('11')
    expect(selectedText(minuteWheel!)).toBe('59')
    expect(selectedText(secondWheel!)).toBe('59')
    expect(selectedText(meridiemWheel!)).toBe('PM')

    wrapper.unmount()
  }, 30000)

  it('applies second-boundary carry to range value payloads on apply', async () => {
    const wrapper = await mountTimePicker({
      noInput: true,
      asSingle: true,
      useRange: true,
      timePickerStyle: 'wheel-inline',
      timeInlinePosition: 'right',
      timeWheelScrollMode: 'boundary',
      modelValue: {
        startDate: createLocalDate(2026, 1, 22, 11, 59, 59),
        endDate: createLocalDate(2026, 1, 22, 12, 10, 10),
      },
    })

    await settleUi(320)

    const startButton = findButtonByText(wrapper, 'Start')
    if (startButton && !startButton.classes().includes('bg-vtd-primary-600')) {
      await startButton.trigger('click')
      await nextTick()
    }

    const secondWheel = wrapper.findAll('[aria-label="Second wheel"]').at(0)
    expect(secondWheel).toBeTruthy()
    const zeroSecondOption = secondWheel!.findAll('[role="option"]')
      .filter(node => node.text().trim() === '00')
      .sort((a, b) => {
        const aRow = a.element.closest('[data-time-index]')
        const bRow = b.element.closest('[data-time-index]')
        const aIndex = Number.parseInt(aRow?.getAttribute('data-time-index') ?? '', 10)
        const bIndex = Number.parseInt(bRow?.getAttribute('data-time-index') ?? '', 10)
        const aDistance = Number.isFinite(aIndex) ? Math.abs(aIndex - 180) : Number.POSITIVE_INFINITY
        const bDistance = Number.isFinite(bIndex) ? Math.abs(bIndex - 180) : Number.POSITIVE_INFINITY
        return aDistance - bDistance
      })
      .at(0)
    expect(zeroSecondOption).toBeTruthy()
    await zeroSecondOption!.trigger('click')
    await nextTick()
    await nextTick()

    const applyButton = findButtonByText(wrapper, 'Apply')
    expect(applyButton).toBeTruthy()
    await applyButton!.trigger('click')
    await nextTick()
    await nextTick()

    const emittedUpdates = wrapper.emitted('update:modelValue')
    expect(emittedUpdates).toBeTruthy()
    const latestPayload = emittedUpdates![emittedUpdates!.length - 1]![0] as Record<string, string>
    expect(latestPayload.startDate).toContain('12:00:00 PM')
    expect(latestPayload.endDate).toContain('12:10:10 PM')

    wrapper.unmount()
  }, 30000)

  it('uses wheel step delta direction for minute carry to avoid wrong-hour updates on large jumps', async () => {
    const wrapper = await mountTimePicker({
      noInput: true,
      asSingle: true,
      useRange: true,
      timePickerStyle: 'wheel-page',
      formatter: {
        date: 'YYYY-MM-DD HH:mm:ss',
        month: 'MMM',
      },
      modelValue: {
        startDate: createLocalDate(2026, 1, 22, 10, 10, 0),
        endDate: createLocalDate(2026, 1, 24, 11, 0, 0),
      },
    })

    await settleUi(320)
    await openTimePage(wrapper)

    const startButton = findButtonByText(wrapper, 'Start')
    if (startButton && !startButton.classes().includes('bg-vtd-primary-600')) {
      await startButton.trigger('click')
      await nextTick()
    }

    const minuteWheel = wrapper.findAllComponents(TimeWheel)
      .find(component => component.props('ariaLabel') === 'Minute wheel')
    expect(minuteWheel).toBeTruthy()

    minuteWheel!.vm.$emit('step', {
      value: 50,
      previousValue: 10,
      absoluteIndex: 2050,
      previousAbsoluteIndex: 2010,
      delta: 40,
    })
    minuteWheel!.vm.$emit('update:modelValue', 50)
    await settleUi(320)

    const applyButton = findButtonByText(wrapper, 'Apply')
    expect(applyButton).toBeTruthy()
    await applyButton!.trigger('click')
    await nextTick()
    await nextTick()

    const emittedUpdates = wrapper.emitted('update:modelValue')
    expect(emittedUpdates).toBeTruthy()
    const latestPayload = emittedUpdates![emittedUpdates!.length - 1]![0] as Record<string, string>
    const start = dayjs(latestPayload.startDate, 'YYYY-MM-DD HH:mm:ss', true)
    expect(start.isValid()).toBe(true)
    expect(start.hour()).toBe(10)
    expect(start.minute()).toBe(50)

    wrapper.unmount()
  }, 30000)

  it('normalizes second-wheel rebase deltas so boundary carry applies only once', async () => {
    const wrapper = await mountTimePicker({
      noInput: true,
      asSingle: true,
      useRange: true,
      timePickerStyle: 'wheel-page',
      timeWheelScrollMode: 'boundary',
      modelValue: {
        startDate: createLocalDate(2026, 1, 22, 11, 59, 59),
        endDate: createLocalDate(2026, 1, 24, 11, 0, 0),
      },
    })

    await settleUi(320)
    await openTimePage(wrapper)

    const startButton = findButtonByText(wrapper, 'Start')
    if (startButton && !startButton.classes().includes('bg-vtd-primary-600')) {
      await startButton.trigger('click')
      await nextTick()
    }

    const secondWheel = wrapper.findAllComponents(TimeWheel)
      .find(component => component.props('ariaLabel') === 'Second wheel')
    expect(secondWheel).toBeTruthy()

    // Simulate a wrap/rebase-inflated payload where absolute-index delta carries
    // an extra full cycle even though the semantic transition is 59 -> 00.
    secondWheel!.vm.$emit('step', {
      value: 0,
      previousValue: 59,
      absoluteIndex: 2161,
      previousAbsoluteIndex: 2100,
      delta: 61,
    })
    secondWheel!.vm.$emit('update:modelValue', 0)
    await settleUi(320)

    const applyButton = findButtonByText(wrapper, 'Apply')
    expect(applyButton).toBeTruthy()
    await applyButton!.trigger('click')
    await nextTick()
    await nextTick()

    const emittedUpdates = wrapper.emitted('update:modelValue')
    expect(emittedUpdates).toBeTruthy()
    const latestPayload = emittedUpdates![emittedUpdates!.length - 1]![0] as Record<string, string>
    const start = dayjs(latestPayload.startDate, 'YYYY-MM-DD hh:mm:ss A', true)
    expect(start.isValid()).toBe(true)
    expect(start.hour()).toBe(12)
    expect(start.minute()).toBe(0)
    expect(start.second()).toBe(0)

    wrapper.unmount()
  }, 30000)

  it('deduplicates repeated boundary-carry step payloads with rebased absolute indices', async () => {
    const wrapper = await mountTimePicker({
      noInput: true,
      asSingle: true,
      useRange: true,
      timePickerStyle: 'wheel-page',
      timeWheelScrollMode: 'boundary',
      modelValue: {
        startDate: createLocalDate(2026, 1, 22, 11, 59, 59),
        endDate: createLocalDate(2026, 1, 24, 11, 0, 0),
      },
    })

    await settleUi(320)
    await openTimePage(wrapper)

    const startButton = findButtonByText(wrapper, 'Start')
    if (startButton && !startButton.classes().includes('bg-vtd-primary-600')) {
      await startButton.trigger('click')
      await nextTick()
    }

    const secondWheel = wrapper.findAllComponents(TimeWheel)
      .find(component => component.props('ariaLabel') === 'Second wheel')
    expect(secondWheel).toBeTruthy()

    // First boundary-crossing payload.
    secondWheel!.vm.$emit('step', {
      value: 0,
      previousValue: 59,
      absoluteIndex: 2161,
      previousAbsoluteIndex: 2100,
      delta: 61,
    })
    secondWheel!.vm.$emit('update:modelValue', 0)

    // Duplicate semantic payload with different absolute indices (rebase noise).
    secondWheel!.vm.$emit('step', {
      value: 0,
      previousValue: 59,
      absoluteIndex: 2221,
      previousAbsoluteIndex: 2160,
      delta: 61,
    })
    secondWheel!.vm.$emit('update:modelValue', 0)

    await settleUi(320)

    const applyButton = findButtonByText(wrapper, 'Apply')
    expect(applyButton).toBeTruthy()
    await applyButton!.trigger('click')
    await nextTick()
    await nextTick()

    const emittedUpdates = wrapper.emitted('update:modelValue')
    expect(emittedUpdates).toBeTruthy()
    const latestPayload = emittedUpdates![emittedUpdates!.length - 1]![0] as Record<string, string>
    const start = dayjs(latestPayload.startDate, 'YYYY-MM-DD hh:mm:ss A', true)
    expect(start.isValid()).toBe(true)
    expect(start.hour()).toBe(12)
    expect(start.minute()).toBe(0)
    expect(start.second()).toBe(0)

    wrapper.unmount()
  }, 30000)

  it('keeps Apply disabled in single-panel range datetime mode until both endpoints are selected', async () => {
    const wrapper = await mountTimePicker({
      noInput: false,
      asSingle: true,
      useRange: true,
      timePickerStyle: 'input',
      modelValue: {
        startDate: '',
        endDate: '',
      },
    })

    await openPopover(wrapper)

    const applyButton = findButtonByText(wrapper, 'Apply')
    expect(applyButton).toBeTruthy()
    expect((applyButton!.element as HTMLButtonElement).disabled).toBe(true)

    const day12 = wrapper.findAll('button.vtd-datepicker-date')
      .filter(button => !button.attributes('disabled'))
      .filter(button => !button.classes().includes('text-vtd-secondary-400'))
      .find(button => button.text().trim() === '12')
    expect(day12).toBeTruthy()
    await day12!.trigger('click')
    await nextTick()
    await nextTick()

    const applyButtonAfterFirstDate = findButtonByText(wrapper, 'Apply')
    expect(applyButtonAfterFirstDate).toBeTruthy()
    expect((applyButtonAfterFirstDate!.element as HTMLButtonElement).disabled).toBe(true)

    const day18 = wrapper.findAll('button.vtd-datepicker-date')
      .filter(button => !button.attributes('disabled'))
      .filter(button => !button.classes().includes('text-vtd-secondary-400'))
      .find(button => button.text().trim() === '18')
    expect(day18).toBeTruthy()
    await day18!.trigger('click')
    await nextTick()
    await nextTick()

    const applyButtonAfterSecondDate = findButtonByText(wrapper, 'Apply')
    expect(applyButtonAfterSecondDate).toBeTruthy()
    expect((applyButtonAfterSecondDate!.element as HTMLButtonElement).disabled).toBe(false)

    wrapper.unmount()
  }, 30000)

  it('emits range-end-before-start validation error when end time is before start on same date', async () => {
    const wrapper = await mountTimePicker({
      noInput: true,
      asSingle: true,
      useRange: true,
      timePickerStyle: 'input',
      modelValue: {
        startDate: createLocalDate(2026, 1, 22, 11, 0, 0),
        endDate: createLocalDate(2026, 1, 22, 12, 0, 0),
      },
    })

    await settleUi(320)

    const inputs = wrapper.findAll('.vtd-time-endpoint input[type="text"]')
    expect(inputs.length).toBe(2)

    const startInput = inputs[0]!
    const endInput = inputs[1]!

    ;(startInput.element as HTMLInputElement).value = '11:00:00 PM'
    await startInput.trigger('input')
    ;(endInput.element as HTMLInputElement).value = '10:00:00 PM'
    await endInput.trigger('input')
    await nextTick()
    await nextTick()

    const applyButton = findButtonByText(wrapper, 'Apply')
    expect(applyButton).toBeTruthy()
    await applyButton!.trigger('click')
    await nextTick()

    const errorEvents = wrapper.emitted('error')
    expect(errorEvents).toBeTruthy()
    const payload = errorEvents![errorEvents!.length - 1]![0] as {
      code: string
      field: string
      endpoint: string | null
    }
    expect(payload.code).toBe('range-end-before-start')
    expect(payload.field).toBe('range')
    expect(payload.endpoint).toBe('end')

    const renderedMatches = wrapper.findAll('p')
      .map(node => node.text().trim())
      .filter(text =>
        text.includes('End time must be at or after start')
        && text.includes('(11:00:00 PM).'),
      )
    expect(renderedMatches.length).toBe(1)

    wrapper.unmount()
  }, 30000)

  it('normalizes reverse same-month range date picks before apply in datetime mode', async () => {
    const wrapper = await mountTimePicker({
      noInput: true,
      asSingle: true,
      useRange: true,
      timePickerStyle: 'input',
      modelValue: {
        startDate: createLocalDate(2026, 1, 12, 8, 4, 45),
        endDate: createLocalDate(2026, 1, 22, 20, 4, 45),
      },
    })

    await settleUi(320)

    const findInMonthDay = (day: number) => {
      return wrapper.findAll('button.vtd-datepicker-date')
        .filter(button => !button.attributes('disabled'))
        .filter(button => !button.classes().includes('text-vtd-secondary-400'))
        .find(button => button.text().trim() === String(day))
    }

    const day24 = findInMonthDay(24)
    const day18 = findInMonthDay(18)
    expect(day24).toBeTruthy()
    expect(day18).toBeTruthy()

    // Pick later date first, then earlier date in the same month.
    await day24!.trigger('click')
    await nextTick()
    await day18!.trigger('click')
    await nextTick()
    await nextTick()

    const applyButton = findButtonByText(wrapper, 'Apply')
    expect(applyButton).toBeTruthy()
    await applyButton!.trigger('click')
    await nextTick()
    await nextTick()

    const errorEvents = wrapper.emitted('error') ?? []
    const hasRangeOrderError = errorEvents.some((event) => {
      const payload = event?.[0] as { code?: string } | undefined
      return payload?.code === 'range-end-before-start'
    })
    expect(hasRangeOrderError).toBe(false)

    const emittedUpdates = wrapper.emitted('update:modelValue')
    expect(emittedUpdates).toBeTruthy()
    const latestPayload = emittedUpdates![emittedUpdates!.length - 1]![0] as Record<string, string>
    const start = dayjs(latestPayload.startDate, 'YYYY-MM-DD hh:mm:ss A', true)
    const end = dayjs(latestPayload.endDate, 'YYYY-MM-DD hh:mm:ss A', true)
    expect(start.isValid()).toBe(true)
    expect(end.isValid()).toBe(true)
    expect(end.isBefore(start)).toBe(false)
    expect(start.format('YYYY-MM-DD')).toBe('2026-02-18')
    expect(end.format('YYYY-MM-DD')).toBe('2026-02-24')

    wrapper.unmount()
  }, 30000)

  it('keeps range-order error until end time is corrected (does not clear on endpoint click)', async () => {
    const wrapper = await mountTimePicker({
      noInput: true,
      asSingle: true,
      useRange: true,
      timePickerStyle: 'wheel-inline',
      timeInlinePosition: 'below',
      timeWheelScrollMode: 'boundary',
      modelValue: {
        startDate: createLocalDate(2026, 1, 22, 0, 42, 31),
        endDate: createLocalDate(2026, 1, 22, 0, 39, 32),
      },
    })

    await settleUi(320)

    const applyButton = findButtonByText(wrapper, 'Apply')
    expect(applyButton).toBeTruthy()
    await applyButton!.trigger('click')
    await nextTick()
    await nextTick()

    const rangeErrorCount = () => wrapper.findAll('p')
      .map(node => node.text().trim())
      .filter(text => text.includes('End time must be at or after start'))
      .length

    expect(rangeErrorCount()).toBe(1)

    const startButton = findButtonByText(wrapper, 'Start')
    const endButton = findButtonByText(wrapper, 'End')
    expect(startButton).toBeTruthy()
    expect(endButton).toBeTruthy()

    await startButton!.trigger('click')
    await nextTick()
    expect(rangeErrorCount()).toBe(1)

    const isEndActive = () => endButton!.classes().includes('bg-vtd-primary-600')
    if (!isEndActive()) {
      await endButton!.trigger('click')
      await nextTick()
    }
    if (!isEndActive()) {
      await endButton!.trigger('click')
      await nextTick()
    }
    expect(rangeErrorCount()).toBe(1)

    const minuteWheel = wrapper.findAll('[aria-label="Minute wheel"]').at(0)
    expect(minuteWheel).toBeTruthy()
    const minute43 = minuteWheel!.findAll('[role="option"]').find(node => node.text().trim() === '43')
    expect(minute43).toBeTruthy()
    await minute43!.trigger('click')
    await nextTick()
    await nextTick()

    expect(rangeErrorCount()).toBe(0)

    wrapper.unmount()
  }, 30000)

  it('keeps boundary mode in sync on rapid second-boundary toggles', async () => {
    const wrapper = await mountTimePicker({
      asSingle: true,
      useRange: true,
      timePickerStyle: 'wheel-inline',
      timeInlinePosition: 'right',
      timeWheelScrollMode: 'boundary',
      modelValue: {
        startDate: createLocalDate(2026, 1, 22, 11, 59, 59),
        endDate: createLocalDate(2026, 1, 28, 11, 59, 59),
      },
    })

    await openPopover(wrapper)

    const secondWheel = wrapper.findAll('[aria-label="Second wheel"]').at(0)
    const minuteWheel = wrapper.findAll('[aria-label="Minute wheel"]').at(0)
    const hourWheel = wrapper.findAll('[aria-label="Hour wheel"]').at(0)
    const meridiemWheel = wrapper.findAll('[aria-label="Meridiem wheel"]').at(0)
    expect(secondWheel).toBeTruthy()
    expect(minuteWheel).toBeTruthy()
    expect(hourWheel).toBeTruthy()
    expect(meridiemWheel).toBeTruthy()

    const clickOptionFast = async (wheel: ReturnType<typeof wrapper.find>, value: string) => {
      const option = wheel.findAll('[role="option"]')
        .filter(node => node.text().trim() === value)
        .sort((a, b) => {
          const aRow = a.element.closest('[data-time-index]')
          const bRow = b.element.closest('[data-time-index]')
          const aIndex = Number.parseInt(aRow?.getAttribute('data-time-index') ?? '', 10)
          const bIndex = Number.parseInt(bRow?.getAttribute('data-time-index') ?? '', 10)
          const aDistance = Number.isFinite(aIndex) ? Math.abs(aIndex - 180) : Number.POSITIVE_INFINITY
          const bDistance = Number.isFinite(bIndex) ? Math.abs(bIndex - 180) : Number.POSITIVE_INFINITY
          return aDistance - bDistance
        })
        .at(0)
      expect(option).toBeTruthy()
      await option!.trigger('click')
      await nextTick()
    }

    const selectedText = (wheel: ReturnType<typeof wrapper.find>) => {
      const selected = wheel.findAll('[role="option"][aria-selected="true"]')
      expect(selected.length).toBe(1)
      return selected[0]!.text().trim()
    }

    // Flip boundaries quickly before previous smooth carry settles.
    await clickOptionFast(secondWheel!, '00')
    await clickOptionFast(secondWheel!, '59')
    await clickOptionFast(secondWheel!, '00')
    await settleUi(700)

    expect(selectedText(hourWheel!)).toBe('12')
    expect(selectedText(minuteWheel!)).toBe('00')
    expect(selectedText(secondWheel!)).toBe('00')
    expect(selectedText(meridiemWheel!)).toBe('PM')

    wrapper.unmount()
  }, 30000)

  it('opens after-date time page on Start endpoint even after previously selecting End', async () => {
    const wrapper = await mountTimePicker({
      asSingle: true,
      useRange: true,
      timePickerStyle: 'wheel-page',
      timePageMode: 'after-date',
      modelValue: {
        startDate: createLocalDate(2026, 1, 12, 8, 4, 45),
        endDate: createLocalDate(2026, 1, 22, 20, 4, 45),
      },
    })

    const headerTitle = () => wrapper.get('.vtd-time-panel-fill p.text-xs.font-medium').text().trim()

    await openPopover(wrapper)
    await openTimePage(wrapper)

    const endButton = findButtonByText(wrapper, 'End')
    expect(endButton).toBeTruthy()
    await endButton!.trigger('click')
    await nextTick()
    expect(headerTitle()).toBe('End time')

    // Close then reopen to reproduce persisted endpoint state.
    await wrapper.get('input').trigger('click')
    await nextTick()
    await nextTick()
    await wrapper.get('input').trigger('click')
    await nextTick()
    await nextTick()

    const calendarButton = findButtonByText(wrapper, 'Calendar')
    if (calendarButton) {
      await calendarButton.trigger('click')
      await nextTick()
      await nextTick()
    }

    // Select two dates in range mode; after second selection, after-date mode
    // auto-opens the time page and should always start at Start endpoint.
    const selectableDates = wrapper
      .findAll('button.vtd-datepicker-date')
      .filter(button => !button.attributes('disabled'))
      .slice(0, 2)
    expect(selectableDates.length).toBe(2)

    await selectableDates[0]!.trigger('click')
    await nextTick()
    await selectableDates[1]!.trigger('click')
    await nextTick()
    await nextTick()

    expect(headerTitle()).toBe('Start time')

    wrapper.unmount()
  }, 30000)

  it('preserves edited endpoint time when selector year changes without month change', async () => {
    const wrapper = await mountTimePicker({
      noInput: true,
      asSingle: true,
      useRange: true,
      selectorMode: true,
      autoApply: false,
      timePickerStyle: 'wheel-inline',
      timeInlinePosition: 'right',
      modelValue: {
        startDate: createLocalDate(2026, 1, 14, 21, 8, 33),
        endDate: createLocalDate(2026, 1, 24, 0, 0, 0),
      },
    })

    await settleUi(320)
    await wrapper.get('#vtd-header-previous-month').trigger('click')
    await settleUi(320)

    const endButton = findButtonByText(wrapper, 'End')
    expect(endButton).toBeTruthy()
    await endButton!.trigger('click')
    await settleUi(320)

    const minuteWheel = wrapper.findAll('[aria-label="Minute wheel"]').at(0)
    expect(minuteWheel).toBeTruthy()

    const pickWheelOptionNearCenter = async (wheel: NonNullable<typeof minuteWheel>, value: string) => {
      const option = wheel.findAll('[role="option"]')
        .filter(node => node.text().trim() === value)
        .sort((a, b) => {
          const aRow = a.element.closest('[data-time-index]')
          const bRow = b.element.closest('[data-time-index]')
          const aIndex = Number.parseInt(aRow?.getAttribute('data-time-index') ?? '', 10)
          const bIndex = Number.parseInt(bRow?.getAttribute('data-time-index') ?? '', 10)
          const aDistance = Number.isFinite(aIndex) ? Math.abs(aIndex - 180) : Number.POSITIVE_INFINITY
          const bDistance = Number.isFinite(bIndex) ? Math.abs(bIndex - 180) : Number.POSITIVE_INFINITY
          return aDistance - bDistance
        })
        .at(0)
      expect(option).toBeTruthy()
      await option!.trigger('click')
      await settleUi(320)
    }

    const selectedWheelText = (wheel: NonNullable<typeof minuteWheel>) => {
      const selected = wheel.findAll('[role="option"][aria-selected="true"]')
      expect(selected.length).toBe(1)
      return selected[0]!.text().trim()
    }

    await pickWheelOptionNearCenter(minuteWheel!, '17')
    expect(selectedWheelText(minuteWheel!)).toBe('17')

    const yearComponent = wrapper.findAllComponents(Year).at(0)
    expect(yearComponent).toBeTruthy()
    yearComponent!.vm.$emit('updateYear', 2027)
    await settleUi(320)

    const minuteWheelAfterYear = wrapper.findAll('[aria-label="Minute wheel"]').at(0)
    expect(minuteWheelAfterYear).toBeTruthy()
    expect(selectedWheelText(minuteWheelAfterYear!)).toBe('17')

    wrapper.unmount()
  }, 60000)
})
