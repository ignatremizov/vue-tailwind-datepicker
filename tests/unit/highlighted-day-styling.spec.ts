import { mount, type DOMWrapper, type VueWrapper } from '@vue/test-utils'
import dayjs, { type Dayjs } from 'dayjs'
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

describe('highlighted day styling hooks', () => {
  it('applies the highlight hook class to matching cells including off-month cells', async () => {
    const highlightedDates = ['2025-05-31', '2025-06-07', '2025-06-15', '2025-07-01']
    const wrapper = await mountSinglePicker({
      highlightDates: highlightedDates.map((date, index) => {
        const mode = (['date', 'string', 'dayjs'] as const)[index % 3]
        return toHighlightInput(date, mode)
      }),
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
      highlightDates: ['not-a-date', null, undefined, '2025-06-07'] as unknown as Array<string | Dayjs>,
    })

    try {
      const buttons = wrapper.findAll('button.vtd-datepicker-date')
      assertHighlightHookContract(buttons, ['2025-06-07'])
    } finally {
      wrapper.unmount()
    }
  })
})
