import { mount, type DOMWrapper, type VueWrapper } from '@vue/test-utils'
import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import VueTailwindDatePicker from '../../src/VueTailwindDatePicker.vue'

function getDateKeyFromButton(button: DOMWrapper<Element>) {
  const dateKey = button.attributes('data-date-key')
  expect(dateKey).toBeTruthy()
  return dateKey as string
}

function findButtonByDate(wrapper: VueWrapper, date: string) {
  const targetDateKey = dayjs(date).format('YYYY-MM-DD')
  return wrapper.findAll('button.vtd-datepicker-date').find((button) => {
    return getDateKeyFromButton(button) === targetDateKey
  })
}

function assertWeekendHookContract(buttons: DOMWrapper<Element>[]) {
  for (const button of buttons) {
    const date = dayjs(getDateKeyFromButton(button))
    const classes = button.classes()
    const day = date.day()
    const isWeekend = day === 0 || day === 6

    if (isWeekend) {
      expect(classes).toContain('vtd-weekend')
      if (day === 6) {
        expect(classes).toContain('vtd-saturday')
        expect(classes).not.toContain('vtd-sunday')
      } else {
        expect(classes).toContain('vtd-sunday')
        expect(classes).not.toContain('vtd-saturday')
      }
      continue
    }

    expect(classes).not.toContain('vtd-weekend')
    expect(classes).not.toContain('vtd-saturday')
    expect(classes).not.toContain('vtd-sunday')
  }
}

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function mountSinglePicker(extraProps: Record<string, unknown> = {}) {
  const { waitMs = 320, ...pickerProps } = extraProps as Record<string, unknown> & {
    waitMs?: number
  }
  const wrapper = mount(VueTailwindDatePicker, {
    props: {
      noInput: true,
      asSingle: true,
      shortcuts: false,
      autoApply: true,
      startFrom: new Date(2025, 5, 1),
      modelValue: '2025-06-15 00:00:00',
      ...pickerProps,
    },
  })

  if (waitMs > 0)
    await wait(waitMs)
  await nextTick()
  return wrapper
}

async function assertWeekendContractForLocale(locale: string) {
  const wrapper = await mountSinglePicker({ i18n: locale })
  const buttons = wrapper.findAll('button.vtd-datepicker-date')
  assertWeekendHookContract(buttons)
  wrapper.unmount()
}

describe('weekend day styling hooks', () => {
  it('applies weekend hook classes to all weekend cells including off-month cells', async () => {
    const wrapper = await mountSinglePicker()
    try {
      const buttons = wrapper.findAll('button.vtd-datepicker-date')
      assertWeekendHookContract(buttons)

      let offMonthWeekendCount = 0

      for (const button of buttons) {
        const date = dayjs(getDateKeyFromButton(button))
        const classes = button.classes()
        if ((date.day() === 0 || date.day() === 6) && classes.includes('text-vtd-secondary-400'))
          offMonthWeekendCount += 1
      }

      expect(offMonthWeekendCount).toBeGreaterThan(0)
    } finally {
      wrapper.unmount()
    }
  })

  it('keeps weekend hooks additive with selected/range/disabled semantics', async () => {
    const rangeWrapper = await mountSinglePicker({
      useRange: true,
      modelValue: {
        startDate: '2025-06-06 00:00:00',
        endDate: '2025-06-08 00:00:00',
      },
    })
    let disabledWrapper: VueWrapper | undefined

    try {
      const rangeEnd = findButtonByDate(rangeWrapper, '2025-06-08')
      expect(rangeEnd).toBeTruthy()
      expect(rangeEnd?.classes()).toContain('vtd-weekend')
      expect(rangeEnd?.classes()).toContain('vtd-sunday')
      expect(rangeEnd?.classes()).toContain('vtd-datepicker-date-selected')

      const inRangeSaturday = findButtonByDate(rangeWrapper, '2025-06-07')
      expect(inRangeSaturday).toBeTruthy()
      expect(inRangeSaturday?.classes()).toContain('vtd-weekend')
      expect(inRangeSaturday?.classes()).toContain('vtd-saturday')

      disabledWrapper = await mountSinglePicker({
        disableDate: (date: Date) => {
          const day = dayjs(date).day()
          return day === 0 || day === 6
        },
      })

      const disabledSaturday = findButtonByDate(disabledWrapper, '2025-06-07')
      expect(disabledSaturday).toBeTruthy()
      expect(disabledSaturday?.classes()).toContain('vtd-weekend')
      expect(disabledSaturday?.classes()).toContain('vtd-saturday')
      expect(disabledSaturday?.attributes('disabled')).not.toBeUndefined()
    } finally {
      disabledWrapper?.unmount()
      rangeWrapper.unmount()
    }
  })

  it('keeps weekend hook assignment stable after month navigation', async () => {
    const wrapper = await mountSinglePicker()
    try {
      const vm = wrapper.vm as unknown as { calendar: { previous: { onNext: () => void } } }
      const initialKeys = wrapper
        .findAll('button.vtd-datepicker-date')
        .map(button => getDateKeyFromButton(button))

      vm.calendar.previous.onNext()
      await nextTick()

      const nextMonthButtons = wrapper.findAll('button.vtd-datepicker-date')
      const nextKeys = nextMonthButtons.map(button => getDateKeyFromButton(button))

      expect(nextKeys).not.toEqual(initialKeys)
      assertWeekendHookContract(nextMonthButtons)
    } finally {
      wrapper.unmount()
    }
  })

  it('keeps weekend hook assignment deterministic across locales', async () => {
    await assertWeekendContractForLocale('en')
    await assertWeekendContractForLocale('de')
  })
})
