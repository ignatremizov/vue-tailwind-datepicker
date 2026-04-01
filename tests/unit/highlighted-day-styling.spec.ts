import { mount, type DOMWrapper, type VueWrapper } from '@vue/test-utils'
import dayjs, { type Dayjs } from 'dayjs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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

function toHighlightInput(date: string, mode: 'date' | 'string' | 'dayjs') {
  switch (mode) {
    case 'date':
      return dayjs(date).toDate()
    case 'dayjs':
      return dayjs(date)
    default:
      return date
  }
}

function assertHighlightHookContract(
  buttons: DOMWrapper<Element>[],
  highlightedDates: string[],
) {
  const highlightedKeys = new Set(highlightedDates.map(date => dayjs(date).format('YYYY-MM-DD')))

  for (const button of buttons) {
    const dateKey = getDateKeyFromButton(button)
    const classes = button.classes()
    const shouldBeHighlighted = highlightedKeys.has(dateKey)

    if (shouldBeHighlighted)
      expect(classes).toContain('vtd-highlighted')
    else
      expect(classes).not.toContain('vtd-highlighted')
  }
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
    await vi.advanceTimersByTimeAsync(waitMs)
  await nextTick()
  return wrapper
}

describe('highlighted day styling hooks', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('applies the highlight hook class to matching cells including off-month cells', async () => {
    const highlightedDates = ['2025-05-31', '2025-06-07', '2025-06-15', '2025-07-01', '2025-06-21']
    const wrapper = await mountSinglePicker({
      highlightDates: highlightedDates.slice(0, 4).map((date, index) => {
        const mode = (['date', 'string', 'dayjs'] as const)[index % 3]
        return toHighlightInput(date, mode)
      }).concat('2025-06-21 09:30:00'),
    })

    try {
      const buttons = wrapper.findAll('button.vtd-datepicker-date')
      assertHighlightHookContract(buttons, highlightedDates)

      for (const date of highlightedDates) {
        expect(findButtonByDate(wrapper, date)?.classes()).toContain('vtd-highlighted')
      }
    } finally {
      wrapper.unmount()
    }
  })

  it('keeps highlight hooks additive with selected and disabled semantics', async () => {
    const selectedWrapper = await mountSinglePicker({
      highlightDates: ['2025-06-15', '2025-06-07'],
    })
    let disabledWrapper: VueWrapper | undefined

    try {
      const selectedButton = findButtonByDate(selectedWrapper, '2025-06-15')
      expect(selectedButton).toBeTruthy()
      expect(selectedButton?.classes()).toContain('vtd-highlighted')
      expect(selectedButton?.classes()).toContain('vtd-datepicker-date-selected')

      disabledWrapper = await mountSinglePicker({
        highlightDates: ['2025-06-07'],
        disableDate: (date: Date) => dayjs(date).isSame(dayjs('2025-06-07'), 'date'),
      })

      const disabledButton = findButtonByDate(disabledWrapper, '2025-06-07')
      expect(disabledButton).toBeTruthy()
      expect(disabledButton?.classes()).toContain('vtd-highlighted')
      expect(disabledButton?.attributes('disabled')).not.toBeUndefined()
    } finally {
      disabledWrapper?.unmount()
      selectedWrapper.unmount()
    }
  })

  it('keeps highlight hook assignment stable after month navigation', async () => {
    const nextMonthHighlight = '2025-07-05'
    const wrapper = await mountSinglePicker({
      highlightDates: [nextMonthHighlight],
    })

    try {
      expect(findButtonByDate(wrapper, nextMonthHighlight)).toBeTruthy()
      expect(findButtonByDate(wrapper, nextMonthHighlight)?.classes()).toContain('vtd-highlighted')

      const vm = wrapper.vm as unknown as { calendar: { previous: { onNext: () => void } } }
      vm.calendar.previous.onNext()
      await nextTick()

      const visibleHighlight = findButtonByDate(wrapper, nextMonthHighlight)
      expect(visibleHighlight).toBeTruthy()
      expect(visibleHighlight?.classes()).toContain('vtd-highlighted')
    } finally {
      wrapper.unmount()
    }
  })

  it('ignores invalid highlight values', async () => {
    const wrapper = await mountSinglePicker({
      highlightDates: ['not-a-date', '2025-02-31', null, undefined, '2025-06-07'] as unknown as Array<string | Dayjs>,
    })

    try {
      const buttons = wrapper.findAll('button.vtd-datepicker-date')
      assertHighlightHookContract(buttons, ['2025-06-07'])
    } finally {
      wrapper.unmount()
    }
  })

  it('does not treat nullish or blank highlight values as today', async () => {
    const today = dayjs()
    const wrapper = await mountSinglePicker({
      startFrom: today.toDate(),
      modelValue: `${today.format('YYYY-MM-DD')} 00:00:00`,
      highlightDates: [null, undefined, '', '   '] as unknown as Array<string | Dayjs>,
    })

    try {
      const todayButton = findButtonByDate(wrapper, today.format('YYYY-MM-DD'))
      expect(todayButton).toBeTruthy()
      expect(todayButton?.classes()).not.toContain('vtd-highlighted')
    } finally {
      wrapper.unmount()
    }
  })

  it('does not throw or highlight today when highlightDates is null at runtime', async () => {
    const today = dayjs()
    const wrapper = await mountSinglePicker({
      startFrom: today.toDate(),
      modelValue: `${today.format('YYYY-MM-DD')} 00:00:00`,
      highlightDates: null as unknown as Array<string | Dayjs>,
    })

    try {
      const todayButton = findButtonByDate(wrapper, today.format('YYYY-MM-DD'))
      expect(todayButton).toBeTruthy()
      expect(todayButton?.classes()).not.toContain('vtd-highlighted')
    } finally {
      wrapper.unmount()
    }
  })

  it('supports formatter-derived date-only string highlights for custom datetime formats', async () => {
    const wrapper = await mountSinglePicker({
      formatter: {
        date: 'MM/DD/YYYY HH:mm:ss',
        month: 'MMM',
      },
      modelValue: '06/15/2025 00:00:00',
      highlightDates: ['06/21/2025'],
    })

    try {
      const highlightedButton = findButtonByDate(wrapper, '2025-06-21')
      expect(highlightedButton).toBeTruthy()
      expect(highlightedButton?.classes()).toContain('vtd-highlighted')
    } finally {
      wrapper.unmount()
    }
  })
})
