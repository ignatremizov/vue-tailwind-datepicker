<script setup lang="ts">
import {
  Popover,
  PopoverButton,
  PopoverOverlay,
  PopoverPanel,
} from '@headlessui/vue'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import localeData from 'dayjs/plugin/localeData'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import isToday from 'dayjs/plugin/isToday'
import isBetween from 'dayjs/plugin/isBetween'
import duration from 'dayjs/plugin/duration'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import type { Ref } from 'vue'
import {
  computed,
  isProxy,
  nextTick,
  provide,
  reactive,
  ref,
  unref,
  watch,
  watchEffect,
} from 'vue'
import { localesMap } from './utils'
import VtdHeader from './components/Header.vue'
import VtdShortcut from './components/Shortcut.vue'
import VtdCalendar from './components/Calendar.vue'
import VtdYear from './components/Year.vue'
import VtdWeek from './components/Week.vue'
import VtdMonth from './components/Month.vue'
import useDate from './composables/date'
import useDom from './composables/dom'
import useShortcut, { resolveModernBuiltInDate } from './composables/shortcut'
import type {
  DatePickerDay,
  InvalidShortcutEventPayload,
  LegacyShortcutDefinition,
  ShortcutDefinition,
  ShortcutFactory,
  ShortcutPreset,
  TypedShortcutDefinition,
} from './types'
import {
  type BuiltInShortcutId,
  type ShortcutActivationTarget,
  type ShortcutDisabledState,
  activateShortcutKey,
  atMouseOverKey,
  betweenRangeClassesKey,
  datepickerClassesKey,
  getShortcutDisabledStateKey,
  isBetweenRangeKey,
  isShortcutDisabledKey,
} from './keys'

export interface Props {
  noInput?: boolean
  overlay?: boolean
  asSingle?: boolean
  useRange?: boolean
  placeholder?: string
  i18n?: string
  inputClasses?: string
  disabled?: boolean
  disableInRange?: boolean
  disableDate?: boolean | ((date: Date) => boolean)
  autoApply?: boolean
  shortcutPreset?: ShortcutPreset
  shortcuts?:
    | boolean
    | ShortcutDefinition[]
    | ShortcutFactory<LegacyShortcutDefinition>
    | ShortcutFactory<TypedShortcutDefinition>
  separator?: string
  formatter?: {
    date: string
    month: string
  }
  startFrom?: Date
  weekdaysSize?: string
  weekNumber?: boolean
  selectorMode?: boolean
  selectorFocusTint?: boolean
  selectorYearScrollMode?: 'boundary' | 'fractional'
  selectorYearHomeJump?: number
  selectorYearEndJump?: number
  selectorYearPageJump?: number
  selectorYearPageShiftJump?: number
  closeOnRangeSelection?: boolean
  options?: {
    shortcuts: {
      today: string
      yesterday: string
      past: (period: number) => string
      currentMonth: string
      pastMonth: string
    }
    footer: {
      apply: string
      cancel: string
    }
  }
  modelValue:
  | [Date, Date]
  | { start: Date | string; end: Date | string }
  | {
    startDate: Date | string
    endDate: Date | string
  }
  | string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '',
  i18n: 'en',
  inputClasses: '',
  disabled: false,
  disableInRange: false,
  disableDate: false,
  autoApply: true,
  shortcutPreset: 'legacy',
  shortcuts: true,
  separator: ' ~ ',
  formatter: () => ({
    date: 'YYYY-MM-DD HH:mm:ss',
    month: 'MMM',
  }),
  startFrom: () => new Date(),
  weekdaysSize: 'short',
  weekNumber: false,
  selectorMode: false,
  selectorFocusTint: true,
  selectorYearScrollMode: 'boundary',
  selectorYearHomeJump: 100,
  selectorYearEndJump: 100,
  selectorYearPageJump: 10,
  selectorYearPageShiftJump: 100,
  closeOnRangeSelection: true,
  options: () => ({
    shortcuts: {
      today: 'Today',
      yesterday: 'Yesterday',
      past: period => `Last ${period} Days`,
      currentMonth: 'This Month',
      pastMonth: 'Last Month',
    },
    footer: {
      apply: 'Apply',
      cancel: 'Cancel',
    },
  }),
  modelValue: () => [new Date(), new Date()],
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: Array<string> | Array<Dayjs> | string | Record<string, string>): void;
  (e: 'invalid-shortcut', payload: InvalidShortcutEventPayload): void;
  (e: 'selectMonth', value: Dayjs): void;
  (e: 'selectYear', value: Dayjs): void;
  (e: 'selectRightMonth', value: Dayjs): void;
  (e: 'selectRightYear', value: Dayjs): void;
  (e: 'clickPrev', value: Dayjs): void;
  (e: 'clickNext', value: Dayjs): void;
  (e: 'clickRightPrev', value: Dayjs): void;
  (e: 'clickRightNext', value: Dayjs): void;
}>()

const {
  useCurrentDate,
  useDisableDate,
  useBetweenRange,
  useNextDate,
  usePreviousDate,
  useToValueFromArray,
  useToValueFromString,
} = useDate()

const { useVisibleViewport } = useDom()
const {
  activateShortcut: activateShortcutByDefinition,
  isShortcutDisabled: isShortcutDisabledByDefinition,
} = useShortcut()

dayjs.extend(localeData)
dayjs.extend(localizedFormat)
dayjs.extend(customParseFormat)
dayjs.extend(isToday)
dayjs.extend(isBetween)
dayjs.extend(duration)
dayjs.extend(weekOfYear)

const VtdRef = ref(null)
const VtdStaticRef = ref<HTMLElement | null>(null)
const VtdInputRef = ref<HTMLInputElement | null>(null)
const VtdPopoverButtonRef = ref<unknown>(null)
const placement = ref<boolean | null>(null)
const givenPlaceholder = ref('')
const selection = ref<Dayjs | null>(null)
const pickerValue = ref('')
const hoverValue = ref<Dayjs[]>([])
const applyValue = ref<Dayjs[]>([])
const previous = ref<Dayjs | null>(null)
const next = ref<Dayjs | null>(null)
const panel = reactive({
  previous: {
    calendar: true,
    month: false,
    year: false,
  },
  next: {
    calendar: true,
    month: false,
    year: false,
  },
})
const datepicker = ref({
  previous: dayjs(),
  next: dayjs().add(1, 'month'),
  year: {
    previous: dayjs().year(),
    next: dayjs().year(),
  },
  weeks:
    props.weekdaysSize === 'min' ? dayjs.weekdaysMin() : dayjs.weekdaysShort(),
  months:
    props.formatter.month === 'MMM' ? dayjs.monthsShort() : dayjs.months(),
})
const weeks = computed(() => datepicker.value.weeks)
const months = computed(() => datepicker.value.months)

function classifyWeekend(date: Dayjs) {
  const saturday = date.day() === 6
  const sunday = date.day() === 0
  return {
    saturday,
    sunday,
    weekend: saturday || sunday,
  }
}

const builtInShortcutItems = computed(() => {
  if (props.shortcutPreset === 'modern') {
    return [
      { id: 'today' as const, label: 'Today' },
      { id: 'three-business-days' as const, label: '3 business days' },
      { id: 'next-week' as const, label: 'Next week' },
      { id: 'next-month' as const, label: 'Next month' },
    ]
  }

  return [
    { id: 'today' as const, label: props.options.shortcuts.today },
    { id: 'yesterday' as const, label: props.options.shortcuts.yesterday },
    { id: 'past-7-days' as const, label: props.options.shortcuts.past(7) },
    { id: 'past-30-days' as const, label: props.options.shortcuts.past(30) },
    { id: 'this-month' as const, label: props.options.shortcuts.currentMonth },
    { id: 'last-month' as const, label: props.options.shortcuts.pastMonth },
  ]
})
const calendar = computed(() => {
  const { previous, next, year } = unref(datepicker)
  return {
    previous: {
      date: () => {
        return usePreviousDate(previous)
          .concat(useCurrentDate(previous))
          .concat(useNextDate(previous))
          .map((v) => {
            const { saturday, sunday, weekend } = classifyWeekend(v)
            Object.assign(v, {
              today: v.isToday(),
              active: previous.month() === v.month(),
              off: previous.month() !== v.month(),
              saturday,
              sunday,
              weekend,
              disabled: useDisableDate(v, props) && !inRangeDate(v),
              inRange: () => {
                if (props.asSingle && !props.useRange)
                  return previous.month() !== v.month()
              },
              hovered: () => {
                if (!asRange())
                  return false
                if (hoverValue.value.length > 1) {
                  return (
                    (v.isBetween(
                      hoverValue.value[0],
                      hoverValue.value[1],
                      'date',
                      '()',
                    )
                      || v.isBetween(
                        hoverValue.value[1],
                        hoverValue.value[0],
                        'date',
                        '(]',
                      ))
                    && previous.month() === v.month()
                  )
                }
                return false
              },
              duration: () => {
                return false
              },
            })

            return v as DatePickerDay
          })
      },
      month: previous && previous.format(props.formatter.month),
      year: previous && previous.year(),
      years: () => {
        return Array.from(
          {
            length: 12,
          },
          (v, k) => year.previous + k,
        )
      },
      onPrevious: () => {
        datepicker.value.previous = previous.subtract(1, 'month')
        emit('clickPrev', datepicker.value.previous)
      },
      onNext: () => {
        datepicker.value.previous = previous.add(1, 'month')
        if (previous.diff(next, 'month') === -1)
          datepicker.value.next = next.add(1, 'month')

        emit('clickNext', datepicker.value.previous)
      },
      onPreviousYear: () => {
        datepicker.value.year.previous = datepicker.value.year.previous - 12
      },
      onNextYear: () => {
        datepicker.value.year.previous = datepicker.value.year.previous + 12
      },
      openMonth: () => {
        panel.previous.month = !panel.previous.month
        panel.previous.year = false
        panel.previous.calendar = !panel.previous.month
      },
      setMonth: ($event: number) => {
        datepicker.value.previous = previous.month($event)
        panel.previous.month = !panel.previous.month
        panel.previous.year = false
        panel.previous.calendar = !panel.previous.month
        emit('selectMonth', datepicker.value.previous)
        nextTick(() => {
          if (
            datepicker.value.next.isSame(datepicker.value.previous, 'month')
            || datepicker.value.next.isBefore(datepicker.value.previous)
          )
            datepicker.value.next = datepicker.value.previous.add(1, 'month')

          datepicker.value.year.next = datepicker.value.next.year()
        })
      },
      openYear: () => {
        panel.previous.year = !panel.previous.year
        panel.previous.month = false
        panel.previous.calendar = !panel.previous.year
      },
      setYear: ($event: number) => {
        datepicker.value.previous = previous.year($event)
        panel.previous.year = !panel.previous.year
        panel.previous.calendar = !panel.previous.year
        emit('selectYear', datepicker.value.previous)
        nextTick(() => {
          if (
            datepicker.value.next.isSame(datepicker.value.previous, 'month')
            || datepicker.value.next.isBefore(datepicker.value.previous)
          )
            datepicker.value.next = datepicker.value.previous.add(1, 'month')

          datepicker.value.year.previous = datepicker.value.previous.year()
          datepicker.value.year.next = datepicker.value.next.year()
        })
      },
    },
    next: {
      date: () => {
        return usePreviousDate(next)
          .concat(useCurrentDate(next))
          .concat(useNextDate(next))
          .map((v) => {
            const { saturday, sunday, weekend } = classifyWeekend(v)
            Object.assign(v, {
              today: v.isToday(),
              active: next.month() === v.month(),
              off: next.month() !== v.month(),
              saturday,
              sunday,
              weekend,
              disabled: useDisableDate(v, props) && !inRangeDate(v),
              inRange: () => {
                if (props.asSingle && !props.useRange)
                  return next.month() !== v.month()
              },
              hovered: () => {
                if (hoverValue.value.length > 1) {
                  return (
                    (v.isBetween(
                      hoverValue.value[0],
                      hoverValue.value[1],
                      'date',
                      '()',
                    )
                      || v.isBetween(
                        hoverValue.value[1],
                        hoverValue.value[0],
                        'date',
                        '(]',
                      ))
                    && next.month() === v.month()
                  )
                }
                return false
              },
              duration: () => {
                return false
              },
            })

            return v as DatePickerDay
          })
      },
      month: next && next.format(props.formatter.month),
      year: next && next.year(),
      years: () => {
        return Array.from(
          {
            length: 12,
          },
          (v, k) => year.next + k,
        )
      },
      onPrevious: () => {
        datepicker.value.next = next.subtract(1, 'month')
        if (next.diff(previous, 'month') === 1)
          datepicker.value.previous = previous.subtract(1, 'month')

        emit('clickRightPrev', datepicker.value.next)
      },
      onNext: () => {
        datepicker.value.next = next.add(1, 'month')
        emit('clickRightNext', datepicker.value.next)
      },
      onPreviousYear: () => {
        datepicker.value.year.next = datepicker.value.year.next - 12
      },
      onNextYear: () => {
        datepicker.value.year.next = datepicker.value.year.next + 12
      },
      openMonth: () => {
        panel.next.month = !panel.next.month
        panel.next.year = false
        panel.next.calendar = !panel.next.month
      },
      setMonth: ($event: number) => {
        datepicker.value.next = next.month($event)
        panel.next.month = !panel.next.month
        panel.next.year = false
        panel.next.calendar = !panel.next.month
        emit('selectRightMonth', datepicker.value.next)
        nextTick(() => {
          if (
            datepicker.value.previous.isSame(datepicker.value.next, 'month')
            || datepicker.value.previous.isAfter(datepicker.value.next)
          ) {
            datepicker.value.previous = datepicker.value.next.subtract(
              1,
              'month',
            )
          }

          datepicker.value.year.previous = datepicker.value.previous.year()
        })
      },
      openYear: () => {
        panel.next.year = !panel.next.year
        panel.next.month = false
        panel.next.calendar = !panel.next.year
      },
      setYear: ($event: number) => {
        datepicker.value.next = next.year($event)
        panel.next.year = !panel.next.year
        panel.next.month = false
        panel.next.calendar = !panel.next.year
        emit('selectRightYear', datepicker.value.next)
        nextTick(() => {
          if (
            datepicker.value.previous.isSame(datepicker.value.next, 'month')
            || datepicker.value.previous.isAfter(datepicker.value.next)
          ) {
            datepicker.value.previous = datepicker.value.next.subtract(
              1,
              'month',
            )
          }

          datepicker.value.year.previous = datepicker.value.previous.year()
          datepicker.value.year.next = datepicker.value.next.year()
        })
      },
    },
  }
})

const displayDatepicker = ref(false)
type PickerViewMode = 'calendar' | 'selector'
type SelectorFocus = 'month' | 'year'
type SelectionContext = 'single' | 'singleRangeDisplayed' | 'previousPanel' | 'nextPanel'
type SelectionPanel = 'previous' | 'next'
type SelectorMonthPayload = number | { month: number, year: number }

interface SelectorState {
  selectedMonth: number
  selectedYear: number
  anchorYear: number
}

interface SelectorPanelState {
  previous: boolean
  next: boolean
}

interface HeaderInteractionPayload {
  panel: SelectionPanel
  focus: SelectorFocus
}

interface HeaderMonthStepPayload {
  panel: SelectionPanel
  delta: -1 | 1
}

interface SelectorMonthWheelHandle {
  stepBy: (delta: -1 | 1) => void
}

interface TogglePickerViewOptions {
  restoreFocus?: boolean
}

const SELECTOR_YEAR_WINDOW_SIZE = 401
const SELECTOR_YEAR_WINDOW_RADIUS = Math.floor(SELECTOR_YEAR_WINDOW_SIZE / 2)
const SELECTOR_YEAR_REANCHOR_THRESHOLD = 24

const pickerViewMode = ref<PickerViewMode>('calendar')
const selectorFocus = ref<SelectorFocus>('month')
const selectionContext = ref<SelectionContext>('single')
const selectorState = reactive<SelectorState>({
  selectedMonth: datepicker.value.previous.month(),
  selectedYear: datepicker.value.previous.year(),
  anchorYear: datepicker.value.previous.year(),
})
const selectorPanels = reactive<SelectorPanelState>({
  previous: false,
  next: false,
})
const previousSelectorMonthWheelRef = ref<SelectorMonthWheelHandle | null>(null)
const nextSelectorMonthWheelRef = ref<SelectorMonthWheelHandle | null>(null)

function setPreviousSelectorMonthWheelRef(instance: unknown) {
  previousSelectorMonthWheelRef.value = instance as SelectorMonthWheelHandle | null
}

function setNextSelectorMonthWheelRef(instance: unknown) {
  nextSelectorMonthWheelRef.value = instance as SelectorMonthWheelHandle | null
}

function generateSelectorYears(anchorYear: number) {
  const startYear = anchorYear - SELECTOR_YEAR_WINDOW_RADIUS
  return Array.from({ length: SELECTOR_YEAR_WINDOW_SIZE }, (_, index) => startYear + index)
}

function anchorSelectorYearWindow(targetYear: number) {
  if (selectorState.anchorYear === targetYear)
    return
  selectorState.anchorYear = targetYear
}

const selectorYears = computed(() => {
  return generateSelectorYears(selectorState.anchorYear)
})

function resolveSelectionContext(panel: SelectionPanel): SelectionContext {
  const isSingleDateMode = !!props.asSingle && !props.useRange
  const isSinglePanelRangeMode = !!props.asSingle && !!props.useRange

  if (isSingleDateMode)
    return 'single'
  if (isSinglePanelRangeMode)
    return 'singleRangeDisplayed'
  return panel === 'next' ? 'nextPanel' : 'previousPanel'
}

function isDualPanelRangeMode() {
  return asRange() && !props.asSingle
}

function resolveContextDate(context: SelectionContext): Dayjs {
  if (context === 'nextPanel')
    return datepicker.value.next
  return datepicker.value.previous
}

function resolveContextPanel(context: SelectionContext): SelectionPanel {
  return context === 'nextPanel' ? 'next' : 'previous'
}

function getPanelSelectedMonth(panel: SelectionPanel) {
  return resolveContextDate(resolveSelectionContext(panel)).month()
}

function getPanelSelectedYear(panel: SelectionPanel) {
  return resolveContextDate(resolveSelectionContext(panel)).year()
}

function getPickerQueryRoot() {
  if (props.noInput)
    return VtdStaticRef.value
  return VtdRef.value as HTMLElement | null
}

function isPopoverOpen() {
  return !!(VtdRef.value && document.body.contains(VtdRef.value))
}

function resolvePopoverButtonElement() {
  const refValue = VtdPopoverButtonRef.value as
    | HTMLElement
    | { $el?: unknown; $?: { vnode?: { el?: unknown } } }
    | null

  if (!refValue)
    return null
  if (refValue instanceof HTMLElement)
    return refValue
  if (refValue.$el instanceof HTMLElement)
    return refValue.$el
  if (refValue.$?.vnode?.el instanceof HTMLElement)
    return refValue.$.vnode.el
  return VtdInputRef.value?.closest('label') ?? null
}

function triggerPopoverButtonClick() {
  const buttonElement = resolvePopoverButtonElement()
  if (buttonElement)
    buttonElement.click()
}

function focusHeaderValue(panel: SelectionPanel, focus: SelectorFocus) {
  const queryRoot = getPickerQueryRoot()
  if (!queryRoot)
    return
  const headerButton
    = queryRoot.querySelector<HTMLElement>(`#vtd-header-${panel}-${focus}`)
      ?? queryRoot.querySelector<HTMLElement>(`#vtd-header-${panel}-month`)
  if (headerButton instanceof HTMLElement)
    headerButton.focus()
}

function focusSelectorModeTarget(
  context: SelectionContext = selectionContext.value,
  focus: SelectorFocus = selectorFocus.value,
) {
  const queryRoot = getPickerQueryRoot()
  if (!queryRoot)
    return
  const panel = resolveContextPanel(context)
  const panelElement = queryRoot.querySelector<HTMLElement>(`[data-vtd-selector-panel="${panel}"]`)
  if (!panelElement)
    return

  if (focus === 'month') {
    const monthSelector = panelElement.querySelector<HTMLElement>('[aria-label="Month selector"]')
    if (monthSelector) {
      monthSelector.focus()
      return true
    }
  }
  else {
    const yearSelector = panelElement.querySelector<HTMLElement>('[aria-label="Year selector"]')
    if (yearSelector) {
      yearSelector.focus()
      return true
    }
  }

  return false
}

function focusSelectorModeTargetDeferred(
  context: SelectionContext = selectionContext.value,
  focus: SelectorFocus = selectorFocus.value,
  attempt = 0,
) {
  requestAnimationFrame(() => {
    const focused = focusSelectorModeTarget(context, focus)
    if (!focused && attempt < 2)
      focusSelectorModeTargetDeferred(context, focus, attempt + 1)
  })
}

function focusCalendarModeTarget() {
  const queryRoot = getPickerQueryRoot()
  if (!queryRoot)
    return false

  const preferredPanel = queryRoot.querySelector<HTMLElement>('[data-vtd-selector-panel="previous"]')
  const fallbackPanel = queryRoot.querySelector<HTMLElement>('[data-vtd-selector-panel="next"]')
  const panelElement = preferredPanel ?? fallbackPanel
  if (!panelElement)
    return false

  const calendarDateButton
    = panelElement.querySelector<HTMLButtonElement>('.vtd-calendar-focus-target')
      ?? panelElement.querySelector<HTMLButtonElement>('.vtd-datepicker-date:not(:disabled)')
  if (!calendarDateButton)
    return false

  calendarDateButton.focus()
  return true
}

function focusCalendarModeTargetDeferred(attempt = 0) {
  requestAnimationFrame(() => {
    const focused = focusCalendarModeTarget()
    if (!focused && attempt < 2)
      focusCalendarModeTargetDeferred(attempt + 1)
  })
}

interface SyncSelectorStateOptions {
  syncAnchor?: boolean
}

function syncSelectorState(
  context: SelectionContext = selectionContext.value,
  options: SyncSelectorStateOptions = {},
) {
  const { syncAnchor = true } = options
  const contextDate = resolveContextDate(context)
  selectorState.selectedMonth = contextDate.month()
  selectorState.selectedYear = contextDate.year()
  if (syncAnchor)
    anchorSelectorYearWindow(contextDate.year())
}

function syncDatepickerYears() {
  datepicker.value.year.previous = datepicker.value.previous.year()
  datepicker.value.year.next = datepicker.value.next.year()
}

function syncSelectorRangeOrder(context: SelectionContext) {
  if (context === 'nextPanel') {
    if (
      datepicker.value.previous.isSame(datepicker.value.next, 'month')
      || datepicker.value.previous.isAfter(datepicker.value.next)
    ) {
      datepicker.value.previous = datepicker.value.next.subtract(1, 'month')
    }
    return
  }

  if (
    datepicker.value.next.isSame(datepicker.value.previous, 'month')
    || datepicker.value.next.isBefore(datepicker.value.previous)
  ) {
    datepicker.value.next = datepicker.value.previous.add(1, 'month')
  }
}

function applySelectorMonth(context: SelectionContext, month: number, year?: number) {
  if (context === 'nextPanel') {
    let nextDate = datepicker.value.next
    if (typeof year === 'number')
      nextDate = nextDate.year(year)
    nextDate = nextDate.month(month)
    datepicker.value.next = nextDate
    emit('selectRightMonth', datepicker.value.next)
  }
  else {
    let previousDate = datepicker.value.previous
    if (typeof year === 'number')
      previousDate = previousDate.year(year)
    previousDate = previousDate.month(month)
    datepicker.value.previous = previousDate
    emit('selectMonth', datepicker.value.previous)
  }

  syncSelectorRangeOrder(context)
  syncDatepickerYears()
}

function resolveSelectorMonthDelta(currentMonth: number, targetMonth: number) {
  const rawDelta = targetMonth - currentMonth
  if (rawDelta > 6)
    return rawDelta - 12
  if (rawDelta < -6)
    return rawDelta + 12
  return rawDelta
}

function applySelectorYear(context: SelectionContext, year: number) {
  if (context === 'nextPanel') {
    datepicker.value.next = datepicker.value.next.year(year)
    emit('selectRightYear', datepicker.value.next)
  }
  else {
    datepicker.value.previous = datepicker.value.previous.year(year)
    emit('selectYear', datepicker.value.previous)
  }

  syncSelectorRangeOrder(context)
  syncDatepickerYears()
}

function closeLegacyPanels() {
  const isAlreadyClosed
    = panel.previous.calendar
      && !panel.previous.month
      && !panel.previous.year
      && panel.next.calendar
      && !panel.next.month
      && !panel.next.year
  if (isAlreadyClosed)
    return

  panel.previous.calendar = true
  panel.previous.month = false
  panel.previous.year = false
  panel.next.calendar = true
  panel.next.month = false
  panel.next.year = false
}

function shouldReanchorSelectorYearWindow(year: number) {
  const years = selectorYears.value
  if (years.length === 0)
    return true
  const firstYear = years[0]
  const lastYear = years[years.length - 1]
  return year <= firstYear + SELECTOR_YEAR_REANCHOR_THRESHOLD
    || year >= lastYear - SELECTOR_YEAR_REANCHOR_THRESHOLD
}

function ensureSelectorYearInWindow(year: number) {
  const years = selectorYears.value
  if (years.length === 0) {
    anchorSelectorYearWindow(year)
    return
  }

  const firstYear = years[0]
  const lastYear = years[years.length - 1]
  if (year < firstYear || year > lastYear)
    anchorSelectorYearWindow(year)
}

function isSelectorPanel(panelName: SelectionPanel) {
  if (!props.selectorMode || pickerViewMode.value !== 'selector')
    return false
  if (isDualPanelRangeMode())
    return selectorPanels[panelName]
  return selectionContext.value === resolveSelectionContext(panelName)
}

function getPanelPickerViewMode(panelName: SelectionPanel): PickerViewMode {
  return isSelectorPanel(panelName) ? 'selector' : 'calendar'
}

function getSelectorColumnClass(focus: SelectorFocus) {
  if (!props.selectorFocusTint) {
    return selectorFocus.value === focus
      ? 'border-vtd-primary-300 dark:border-vtd-primary-500'
      : 'border-black/[.08] dark:border-vtd-secondary-700/[1]'
  }

  return selectorFocus.value === focus
    ? 'border-vtd-primary-300 bg-vtd-primary-50/40 ring-2 ring-vtd-primary-400/35 ring-offset-1 ring-offset-transparent dark:border-vtd-primary-500 dark:bg-vtd-secondary-700/50 dark:ring-vtd-primary-500/35'
    : 'border-black/[.08] dark:border-vtd-secondary-700/[1]'
}

function onSelectorColumnFocus(panelName: SelectionPanel, focus: SelectorFocus) {
  if (!props.selectorMode)
    return
  selectionContext.value = resolveSelectionContext(panelName)
  selectorFocus.value = focus
}

function requestSelectorColumnFocus(panelName: SelectionPanel, focus: SelectorFocus) {
  if (!props.selectorMode)
    return

  const context = resolveSelectionContext(panelName)
  selectionContext.value = context
  selectorFocus.value = focus
  nextTick(() => {
    focusSelectorModeTargetDeferred(context, focus)
  })
}

function enterSelectorMode(payload: HeaderInteractionPayload) {
  if (!props.selectorMode)
    return
  const { panel, focus } = payload

  selectorFocus.value = focus
  selectionContext.value = resolveSelectionContext(panel)
  if (isDualPanelRangeMode())
    selectorPanels[panel] = true
  syncSelectorState(selectionContext.value)
  pickerViewMode.value = 'selector'
  closeLegacyPanels()
  nextTick(() => {
    if (pickerViewMode.value === 'selector') {
      closeLegacyPanels()
      focusSelectorModeTargetDeferred(selectionContext.value, selectorFocus.value)
    }
  })
}

function togglePickerViewMode(
  payload: HeaderInteractionPayload,
  options: TogglePickerViewOptions = {},
) {
  if (!props.selectorMode)
    return
  const { restoreFocus = false } = options
  const { panel, focus } = payload

  selectorFocus.value = focus
  selectionContext.value = resolveSelectionContext(panel)
  const isDualPanel = isDualPanelRangeMode()

  if (isDualPanel) {
    const nextOpenState = !selectorPanels[panel]
    selectorPanels[panel] = nextOpenState

    if (!selectorPanels.previous && !selectorPanels.next) {
      pickerViewMode.value = 'calendar'
      closeLegacyPanels()
      if (restoreFocus)
        nextTick(() => focusHeaderValue(panel, focus))
      return
    }

    pickerViewMode.value = 'selector'
    closeLegacyPanels()
    if (nextOpenState) {
      syncSelectorState(selectionContext.value)
      nextTick(() => {
        if (pickerViewMode.value === 'selector') {
          closeLegacyPanels()
          focusSelectorModeTargetDeferred(selectionContext.value, selectorFocus.value)
        }
      })
      return
    }

    if (!selectorPanels[panel]) {
      selectionContext.value = selectorPanels.previous ? 'previousPanel' : 'nextPanel'
    }
    return
  }

  if (pickerViewMode.value === 'selector') {
    pickerViewMode.value = 'calendar'
    closeLegacyPanels()
    if (restoreFocus)
      nextTick(() => focusHeaderValue(panel, focus))
    return
  }
  syncSelectorState(selectionContext.value)
  pickerViewMode.value = 'selector'
  closeLegacyPanels()
  nextTick(() => {
    if (pickerViewMode.value === 'selector') {
      closeLegacyPanels()
      focusSelectorModeTargetDeferred(selectionContext.value, selectorFocus.value)
    }
  })
}

function onSelectorMonthUpdate(panelName: SelectionPanel, payload: SelectorMonthPayload) {
  if (!props.selectorMode)
    return
  const context = resolveSelectionContext(panelName)
  selectionContext.value = context
  const targetMonth = typeof payload === 'number' ? payload : payload.month
  const targetYear = typeof payload === 'number' ? undefined : payload.year
  const contextDate = resolveContextDate(context)
  const isSameMonth = contextDate.month() === targetMonth
  const isSameYear = targetYear === undefined || contextDate.year() === targetYear
  if (isSameMonth && isSameYear) {
    closeLegacyPanels()
    return
  }

  if (typeof targetYear === 'number') {
    applySelectorMonth(context, targetMonth, targetYear)
  }
  else {
    // Month-only selector events infer year rollover from cyclic month deltas.
    const delta = resolveSelectorMonthDelta(contextDate.month(), targetMonth)
    const inferredDate = contextDate.add(delta, 'month')
    applySelectorMonth(context, inferredDate.month(), inferredDate.year())
  }

  syncSelectorState(context, { syncAnchor: false })
  if (shouldReanchorSelectorYearWindow(selectorState.selectedYear))
    anchorSelectorYearWindow(selectorState.selectedYear)
  closeLegacyPanels()
}

function onSelectorYearUpdate(panelName: SelectionPanel, year: number) {
  if (!props.selectorMode)
    return
  const context = resolveSelectionContext(panelName)
  selectionContext.value = context

  // Keyboard jumps can target a year beyond the current virtual window.
  // Anchor first so the requested year is renderable in the next selector paint.
  ensureSelectorYearInWindow(year)

  if (resolveContextDate(context).year() === year) {
    syncSelectorState(context, { syncAnchor: false })
    if (shouldReanchorSelectorYearWindow(selectorState.selectedYear))
      anchorSelectorYearWindow(selectorState.selectedYear)
    closeLegacyPanels()
    return
  }
  applySelectorYear(context, year)
  syncSelectorState(context, { syncAnchor: false })
  if (shouldReanchorSelectorYearWindow(selectorState.selectedYear))
    anchorSelectorYearWindow(selectorState.selectedYear)
  closeLegacyPanels()
}

function onHeaderMonthStep(payload: HeaderMonthStepPayload) {
  if (!props.selectorMode || pickerViewMode.value !== 'selector')
    return

  const wheel = payload.panel === 'next'
    ? nextSelectorMonthWheelRef.value
    : previousSelectorMonthWheelRef.value
  if (wheel) {
    selectionContext.value = resolveSelectionContext(payload.panel)
    wheel.stepBy(payload.delta)
    closeLegacyPanels()
    return
  }

  const context = resolveSelectionContext(payload.panel)
  selectionContext.value = context
  const nextDate = resolveContextDate(context).add(payload.delta, 'month')
  applySelectorMonth(context, nextDate.month(), nextDate.year())
  syncSelectorState(context, { syncAnchor: false })
  if (shouldReanchorSelectorYearWindow(selectorState.selectedYear))
    anchorSelectorYearWindow(selectorState.selectedYear)
  closeLegacyPanels()
}

function resetPickerViewMode() {
  pickerViewMode.value = 'calendar'
  selectorPanels.previous = false
  selectorPanels.next = false
  if (props.selectorMode)
    closeLegacyPanels()
}

function isVisibleElement(element: HTMLElement) {
  return element.getClientRects().length > 0
}

function getSelectorFocusCycleTargets() {
  const queryRoot = getPickerQueryRoot()
  if (!queryRoot)
    return []

  const targets: HTMLElement[] = []
  const pushTarget = (element: HTMLElement | null) => {
    if (!element || !isVisibleElement(element))
      return
    if (targets.includes(element))
      return
    targets.push(element)
  }

  const appendPanelTargets = (panel: SelectionPanel) => {
    pushTarget(queryRoot.querySelector<HTMLElement>(`#vtd-header-${panel}-month`))
    const panelElement = queryRoot.querySelector<HTMLElement>(`[data-vtd-selector-panel="${panel}"]`)
    if (!panelElement)
      return
    pushTarget(panelElement.querySelector<HTMLElement>('[aria-label="Month selector"]'))
    pushTarget(panelElement.querySelector<HTMLElement>('[aria-label="Year selector"]'))
  }

  appendPanelTargets('previous')
  if (asRange() && !props.asSingle)
    appendPanelTargets('next')

  // Shortcuts are treated as a single focus stop in selector tab order.
  pushTarget(queryRoot.querySelector<HTMLElement>('.vtd-shortcuts'))
  return targets
}

function getCalendarFocusCycleTargets() {
  const queryRoot = getPickerQueryRoot()
  if (!queryRoot)
    return []

  const targets: HTMLElement[] = []
  const pushTarget = (element: HTMLElement | null) => {
    if (!element || !isVisibleElement(element))
      return
    if (targets.includes(element))
      return
    targets.push(element)
  }

  const appendCalendarTarget = (panel: SelectionPanel) => {
    const panelElement = queryRoot.querySelector<HTMLElement>(`[data-vtd-selector-panel="${panel}"]`)
    if (!panelElement)
      return
    pushTarget(panelElement.querySelector<HTMLElement>('.vtd-calendar-focus-target'))
  }

  const isDoublePanel = asRange() && !props.asSingle
  const previousHeader = queryRoot.querySelector<HTMLElement>('#vtd-header-previous-month')
  const nextHeader = queryRoot.querySelector<HTMLElement>('#vtd-header-next-month')
  const shortcutContainer = queryRoot.querySelector<HTMLElement>('.vtd-shortcuts')

  // Calendar mode tab order:
  // previous calendar -> (next header -> next calendar) -> shortcuts -> previous header -> repeat
  appendCalendarTarget('previous')
  if (isDoublePanel) {
    pushTarget(nextHeader)
    appendCalendarTarget('next')
  }
  pushTarget(shortcutContainer)
  pushTarget(previousHeader)
  return targets
}

type PopoverCloseFn = (ref?: Ref | HTMLElement) => void

function closePopoverFromPanel(close?: PopoverCloseFn) {
  resetPickerViewMode()
  if (close) {
    if (VtdInputRef.value) {
      close(VtdInputRef.value)
      return
    }
    close()
    return
  }
  if (!props.noInput)
    triggerPopoverButtonClick()
}

function onPickerPanelKeydown(event: KeyboardEvent, close?: PopoverCloseFn) {
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    closePopoverFromPanel(close)
    return
  }

  if (event.key !== 'Tab')
    return

  const inSelectorMode = props.selectorMode && pickerViewMode.value === 'selector'
  const targets = inSelectorMode
    ? getSelectorFocusCycleTargets()
    : getCalendarFocusCycleTargets()
  if (targets.length === 0)
    return

  event.preventDefault()
  event.stopPropagation()

  const activeElement = document.activeElement as HTMLElement | null
  let currentIndex = targets.findIndex(target => target === activeElement || target.contains(activeElement))
  if (currentIndex < 0) {
    currentIndex = targets.findIndex((target) => {
      const panel = resolveContextPanel(selectionContext.value)
      const expectedHeader = target.id === `vtd-header-${panel}-month`
      const expectedMonth = selectorFocus.value === 'month' && target.getAttribute('aria-label') === 'Month selector'
      const expectedYear = selectorFocus.value === 'year' && target.getAttribute('aria-label') === 'Year selector'
      return expectedHeader || expectedMonth || expectedYear
    })
  }
  if (currentIndex < 0)
    currentIndex = 0

  const delta = event.shiftKey ? -1 : 1
  const nextIndex = (currentIndex + delta + targets.length) % targets.length
  targets[nextIndex].focus()
}

function onInputKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter' || event.altKey || event.ctrlKey || event.metaKey)
    return

  event.preventDefault()
  event.stopPropagation()
  resetPickerViewMode()

  if (!isPopoverOpen())
    triggerPopoverButtonClick()

  nextTick(() => {
    focusCalendarModeTargetDeferred()
  })
}

function onPopoverAfterEnter() {
  nextTick(() => {
    if (props.selectorMode && pickerViewMode.value === 'selector') {
      focusSelectorModeTargetDeferred(selectionContext.value, selectorFocus.value)
      return
    }
    focusCalendarModeTargetDeferred()
  })
}

watch(
  () => props.selectorMode,
  (enabled) => {
    if (!enabled)
      resetPickerViewMode()
  },
)

setTimeout(() => {
  displayDatepicker.value = true
}, 250)

function isFirstMonday() {
  return dayjs().localeData().firstDayOfWeek()
}

function shuffleWeekdays(days: dayjs.WeekdayNames): dayjs.WeekdayNames {
  const daysArr = [...days]
  const lastDay = daysArr.shift()
  return [...daysArr, lastDay] as unknown as dayjs.WeekdayNames
}

function asRange() {
  if (!props.useRange && !props.asSingle)
    return true
  else if (!props.useRange && props.asSingle)
    return false
  else if (props.useRange && !props.asSingle)
    return true
  else return !!(props.useRange && props.asSingle)
}

function inRangeDate(date: Dayjs) {
  if (props.disableInRange || typeof props.disableDate === 'function')
    return false
  if (pickerValue.value === '')
    return false
  let s, e
  if (Array.isArray(props.modelValue)) {
    const [start, end] = props.modelValue
    s = start
    e = end
  }
  else if (typeof props.modelValue === 'object') {
    if (props.modelValue) {
      const [start, end] = Object.values(props.modelValue)
      s = start
      e = end
    }
  }
  else {
    const [start, end] = props.modelValue.split(props.separator)
    s = start
    e = end
  }

  return date.isBetween(
    dayjs(s, props.formatter.date, true),
    dayjs(e, props.formatter.date, true),
    'date',
    '[]',
  )
}

function force() {
  previous.value = null
  next.value = null
  hoverValue.value = []
  selection.value = null
}

function clearPicker() {
  pickerValue.value = ''
  if (Array.isArray(props.modelValue)) {
    emit('update:modelValue', [])
  }
  else if (typeof props.modelValue === 'object') {
    const obj: Record<string, string> = {}
    const [start, end] = Object.keys(props.modelValue)
    obj[start] = ''
    obj[end] = ''
    emit('update:modelValue', obj)
  }
  else {
    emit('update:modelValue', '')
  }
  applyValue.value = []
  VtdInputRef.value && VtdInputRef.value.focus()
}
defineExpose({ clearPicker })

/**
 * keyUp event
 * @since v1.0.5
 */
function keyUp() {
  if (asRange()) {
    const [s, e] = pickerValue.value.split(props.separator)
    const [sd, ed] = [
      dayjs(s, props.formatter.date, true),
      dayjs(e, props.formatter.date, true),
    ]
    if (sd.isValid() && ed.isValid()) {
      setDate(sd)
      setDate(ed)
      if (Array.isArray(props.modelValue)) {
        emit('update:modelValue', [s, e])
      }
      else if (typeof props.modelValue === 'object') {
        const obj: Record<string, string> = {}
        const [start, end] = Object.keys(props.modelValue)
        obj[start] = s
        obj[end] = e
        emit('update:modelValue', obj)
      }
      else {
        emit(
          'update:modelValue',
          useToValueFromArray(
            {
              previous: sd,
              next: ed,
            },
            props,
          ),
        )
      }
    }
  }
  else {
    const d = dayjs(pickerValue.value, props.formatter.date, true)
    if (d.isValid()) {
      setDate(d)
      if (Array.isArray(props.modelValue)) {
        emit('update:modelValue', [pickerValue.value])
      }
      else if (typeof props.modelValue === 'object') {
        const obj: Record<string, string> = {}
        const [start] = Object.keys(props.modelValue)
        obj[start] = pickerValue.value
        emit('update:modelValue', obj)
      }
      else {
        emit('update:modelValue', pickerValue.value)
      }
    }
  }
}

function setDate(date: Dayjs, close?: (ref?: Ref | HTMLElement) => void) {
  if (asRange()) {
    if (previous.value) {
      next.value = date
      if (props.autoApply) {
        if (date.isBefore(previous.value)) {
          pickerValue.value = useToValueFromArray(
            {
              previous: date,
              next: previous.value,
            },
            props,
          )
        }
        else {
          pickerValue.value = useToValueFromArray(
            {
              previous: previous.value,
              next: date,
            },
            props,
          )
        }
        const [s, e] = pickerValue.value.split(props.separator)

        if (Array.isArray(props.modelValue)) {
          emit('update:modelValue', [
            dayjs(s, props.formatter.date, true).format(props.formatter.date),
            dayjs(e, props.formatter.date, true).format(props.formatter.date),
          ])
        }
        else if (typeof props.modelValue === 'object') {
          const obj: Record<string, string> = {}
          const [start, end] = Object.keys(props.modelValue)
          obj[start] = s
          obj[end] = e
          emit('update:modelValue', obj)
        }
        else {
          emit(
            'update:modelValue',
            useToValueFromArray(
              {
                previous: dayjs(s, props.formatter.date, true),
                next: dayjs(e, props.formatter.date, true),
              },
              props,
            ),
          )
        }
        const shouldClosePopover
          = props.closeOnRangeSelection && typeof close === 'function'
        // In `no-input` static mode there is no popover close callback, so
        // this option intentionally becomes a no-op.
        if (shouldClosePopover)
          close()

        applyValue.value = []
        if (
          !dayjs(s, props.formatter.date, true).isSame(
            dayjs(e, props.formatter.date, true),
            'month',
          )
        ) {
          datepicker.value.previous = dayjs(s, props.formatter.date, true)
          datepicker.value.next = dayjs(e, props.formatter.date, true)
        }
        force()
      }
      else {
        if (previous.value.isAfter(date, 'month'))
          applyValue.value = [date, previous.value]
        else applyValue.value = [previous.value, date]

        const [s, e] = applyValue.value

        if (!s.isSame(e, 'month')) {
          datepicker.value.previous = s
          datepicker.value.next = e
        }
        force()
      }
    }
    else {
      applyValue.value = []
      previous.value = date
      selection.value = date
      hoverValue.value.push(date)
      applyValue.value.push(date)
      datepicker.value.previous = date
      if (datepicker.value.next.isSame(date, 'month')) {
        datepicker.value.previous = datepicker.value.next
        datepicker.value.next = date.add(1, 'month')
      }
    }
  }
  else {
    if (props.autoApply) {
      pickerValue.value = useToValueFromString(date, props)
      if (Array.isArray(props.modelValue)) {
        emit('update:modelValue', [pickerValue.value])
      }
      else if (typeof props.modelValue === 'object') {
        const obj: Record<string, string> = {}
        const [start] = Object.keys(props.modelValue)
        obj[start] = pickerValue.value
        emit('update:modelValue', obj)
      }
      else {
        emit('update:modelValue', pickerValue.value)
      }
      if (close)
        close()

      applyValue.value = []
      force()
    }
    else {
      applyValue.value = [date]
      force()
    }
  }
}

function applyDate(close?: (ref?: Ref | HTMLElement) => void) {
  if (applyValue.value.length < 1)
    return false
  let date
  if (asRange()) {
    const [s, e] = applyValue.value
    if (e.isBefore(s)) {
      date = useToValueFromArray(
        {
          previous: e,
          next: s,
        },
        props,
      )
    }
    else {
      date = useToValueFromArray(
        {
          previous: s,
          next: e,
        },
        props,
      )
    }
  }
  else {
    const [s] = applyValue.value
    date = s
  }
  if (asRange()) {
    const [s, e] = (date as string).split(props.separator)

    if (Array.isArray(props.modelValue)) {
      emit('update:modelValue', [
        dayjs(s, props.formatter.date, true).format(props.formatter.date),
        dayjs(e, props.formatter.date, true).format(props.formatter.date),
      ])
    }
    else if (typeof props.modelValue === 'object') {
      const obj: Record<string, string> = {}
      const [start, end] = Object.keys(props.modelValue)
      obj[start] = s
      obj[end] = e
      emit('update:modelValue', obj)
    }
    else {
      emit(
        'update:modelValue',
        useToValueFromArray(
          {
            previous: dayjs(s, props.formatter.date, true),
            next: dayjs(e, props.formatter.date, true),
          },
          props,
        ),
      )
    }
    pickerValue.value = date as string
  }
  else {
    pickerValue.value = (date as Dayjs).format(props.formatter.date)
    if (Array.isArray(props.modelValue)) {
      emit('update:modelValue', [pickerValue.value])
    }
    else if (typeof props.modelValue === 'object') {
      const obj: Record<string, string> = {}
      const [start] = Object.keys(props.modelValue)
      obj[start] = pickerValue.value
      emit('update:modelValue', obj)
    }
    else {
      emit('update:modelValue', pickerValue.value)
    }
  }
  if (close)
    close()
}

function atMouseOver(date: Dayjs) {
  if (!asRange())
    return false
  if (previous.value) {
    hoverValue.value = [previous.value, date]
  }
  else {
    hoverValue.value = []
    return false
  }
}

function isBetweenRange(date: DatePickerDay) {
  if (previous.value && props.autoApply)
    return false
  let s, e
  if (hoverValue.value.length > 1) {
    const [start, end] = hoverValue.value
    s = dayjs(start, props.formatter.date, true)
    e = dayjs(end, props.formatter.date, true)
  }
  else {
    if (Array.isArray(props.modelValue)) {
      if (props.autoApply) {
        const [start, end] = props.modelValue
        s = start && dayjs(start, props.formatter.date, true)
        e = end && dayjs(end, props.formatter.date, true)
      }
      else {
        const [start, end] = applyValue.value
        s = dayjs(start, props.formatter.date, true)
        e = dayjs(end, props.formatter.date, true)
      }
    }
    else if (typeof props.modelValue === 'object') {
      if (props.autoApply) {
        if (props.modelValue) {
          const [start, end] = Object.values(props.modelValue)
          s = start && dayjs(start, props.formatter.date, true)
          e = end && dayjs(end, props.formatter.date, true)
        }
      }
      else {
        const [start, end] = applyValue.value
        s = dayjs(start, props.formatter.date, true)
        e = dayjs(end, props.formatter.date, true)
      }
    }
    else {
      if (props.autoApply) {
        const [start, end] = props.modelValue
          ? props.modelValue.split(props.separator)
          : [null, null]
        s = start && dayjs(start, props.formatter.date, true)
        e = end && dayjs(end, props.formatter.date, true)
      }
      else {
        const [start, end] = applyValue.value
        s = dayjs(start, props.formatter.date, true)
        e = dayjs(end, props.formatter.date, true)
      }
    }
  }
  if (s && e) {
    return useBetweenRange(date, {
      previous: s,
      next: e,
    })
  }
  return false
}

function datepickerClasses(date: DatePickerDay) {
  const { today, active, off, disabled } = date
  let classes, s, e
  if (asRange()) {
    if (Array.isArray(props.modelValue)) {
      if (selection.value) {
        const [start, end] = hoverValue.value
        s = start && dayjs(start, props.formatter.date, true)
        e = end && dayjs(end, props.formatter.date, true)
      }
      else {
        if (props.autoApply) {
          const [start, end] = props.modelValue
          s = start && dayjs(start, props.formatter.date, true)
          e = end && dayjs(end, props.formatter.date, true)
        }
        else {
          const [start, end] = applyValue.value
          s = start && dayjs(start, props.formatter.date, true)
          e = end && dayjs(end, props.formatter.date, true)
        }
      }
    }
    else if (typeof props.modelValue === 'object') {
      if (selection.value) {
        const [start, end] = hoverValue.value
        s = start && dayjs(start, props.formatter.date, true)
        e = end && dayjs(end, props.formatter.date, true)
      }
      else {
        if (props.autoApply) {
          const [start, end] = props.modelValue
            ? Object.values(props.modelValue)
            : [null, null]
          s = start && dayjs(start, props.formatter.date, true)
          e = end && dayjs(end, props.formatter.date, true)
        }
        else {
          const [start, end] = applyValue.value
          s = start && dayjs(start, props.formatter.date, true)
          e = end && dayjs(end, props.formatter.date, true)
        }
      }
    }
    else {
      if (selection.value) {
        const [start, end] = hoverValue.value
        s = start && dayjs(start, props.formatter.date, true)
        e = end && dayjs(end, props.formatter.date, true)
      }
      else {
        if (props.autoApply) {
          const [start, end] = props.modelValue
            ? props.modelValue.split(props.separator)
            : [null, null]
          s = start && dayjs(start, props.formatter.date, true)
          e = end && dayjs(end, props.formatter.date, true)
        }
        else {
          const [start, end] = applyValue.value
          s = start && dayjs(start, props.formatter.date, true)
          e = end && dayjs(end, props.formatter.date, true)
        }
      }
    }
  }
  else {
    if (Array.isArray(props.modelValue)) {
      if (props.autoApply) {
        if (props.modelValue.length > 0) {
          const [start] = props.modelValue
          s = dayjs(start, props.formatter.date, true)
        }
      }
      else {
        const [start] = applyValue.value
        s = start && dayjs(start, props.formatter.date, true)
      }
    }
    else if (typeof props.modelValue === 'object') {
      if (props.autoApply) {
        if (props.modelValue) {
          const [start] = Object.values(props.modelValue)
          s = dayjs(start, props.formatter.date, true)
        }
      }
      else {
        const [start] = applyValue.value
        s = start && dayjs(start, props.formatter.date, true)
      }
    }
    else {
      if (props.autoApply) {
        if (props.modelValue) {
          const [start] = props.modelValue.split(props.separator)
          s = dayjs(start, props.formatter.date, true)
        }
      }
      else {
        const [start] = applyValue.value
        s = start && dayjs(start, props.formatter.date, true)
      }
    }
  }
  if (active) {
    classes = today
      ? 'text-vtd-primary-500 font-semibold dark:text-vtd-primary-400 rounded-full focus:bg-vtd-primary-50 focus:text-vtd-secondary-900 focus:border-vtd-primary-300 focus:ring focus:ring-vtd-primary-500/10 focus:outline-none dark:bg-vtd-secondary-800 dark:text-vtd-secondary-300 dark:hover:bg-vtd-secondary-700 dark:hover:text-vtd-secondary-300 dark:focus:bg-vtd-secondary-600/50 dark:focus:text-vtd-secondary-100 dark:focus:border-vtd-primary-500 dark:focus:ring-vtd-primary-500/25'
        : disabled
          ? 'text-vtd-secondary-600 font-normal disabled:text-vtd-secondary-500 disabled:cursor-not-allowed rounded-full'
          : date.isBetween(s as Dayjs, e as Dayjs, 'date', '()')
            ? 'text-vtd-secondary-700 font-medium dark:text-vtd-secondary-100'
            : 'text-vtd-secondary-600 font-medium dark:text-vtd-secondary-200 rounded-full'
  }
  if (off)
    classes = 'text-vtd-secondary-400 font-light disabled:cursor-not-allowed'

  if (s && e && !off) {
    if (date.isSame(s, 'date')) {
      classes = e.isAfter(s, 'date')
        ? 'vtd-datepicker-date-selected vtd-datepicker-date-selected-start disabled:cursor-not-allowed'
        : 'vtd-datepicker-date-selected vtd-datepicker-date-selected-end disabled:cursor-not-allowed'
      if (s.isSame(e, 'date')) {
        classes
          = 'vtd-datepicker-date-selected vtd-datepicker-date-selected-single disabled:cursor-not-allowed'
      }
    }
    if (date.isSame(e, 'date')) {
      classes = e.isAfter(s, 'date')
        ? 'vtd-datepicker-date-selected vtd-datepicker-date-selected-end disabled:cursor-not-allowed'
        : 'vtd-datepicker-date-selected vtd-datepicker-date-selected-start disabled:cursor-not-allowed'
      if (s.isSame(e, 'date')) {
        classes
          = 'vtd-datepicker-date-selected vtd-datepicker-date-selected-single disabled:cursor-not-allowed'
      }
    }
  }
  else if (s) {
    if (date.isSame(s, 'date') && !off) {
      classes
        = 'vtd-datepicker-date-selected vtd-datepicker-date-selected-single disabled:cursor-not-allowed'
    }
  }

  return classes
}

function betweenRangeClasses(date: Dayjs) {
  let classes, s, e
  classes = ''
  if (!asRange())
    return classes
  if (Array.isArray(props.modelValue)) {
    if (hoverValue.value.length > 1) {
      const [start, end] = hoverValue.value
      s = start && dayjs(start, props.formatter.date, true)
      e = end && dayjs(end, props.formatter.date, true)
    }
    else {
      if (props.autoApply) {
        const [start, end] = props.modelValue
        s = start && dayjs(start, props.formatter.date, true)
        e = end && dayjs(end, props.formatter.date, true)
      }
      else {
        const [start, end] = applyValue.value
        s = start && dayjs(start, props.formatter.date, true)
        e = end && dayjs(end, props.formatter.date, true)
      }
    }
  }
  else if (typeof props.modelValue === 'object') {
    if (hoverValue.value.length > 1) {
      const [start, end] = hoverValue.value
      s = start && dayjs(start, props.formatter.date, true)
      e = end && dayjs(end, props.formatter.date, true)
    }
    else {
      if (props.autoApply) {
        if (props.modelValue) {
          const [start, end] = Object.values(props.modelValue)
          s = start && dayjs(start, props.formatter.date, true)
          e = end && dayjs(end, props.formatter.date, true)
        }
      }
      else {
        const [start, end] = applyValue.value
        s = start && dayjs(start, props.formatter.date, true)
        e = end && dayjs(end, props.formatter.date, true)
      }
    }
  }
  else {
    if (hoverValue.value.length > 1) {
      const [start, end] = hoverValue.value
      s = start && dayjs(start, props.formatter.date, true)
      e = end && dayjs(end, props.formatter.date, true)
    }
    else {
      if (props.autoApply) {
        const [start, end] = props.modelValue
          ? props.modelValue.split(props.separator)
          : [null, null]
        s = start && dayjs(start, props.formatter.date, true)
        e = end && dayjs(end, props.formatter.date, true)
      }
      else {
        const [start, end] = applyValue.value
        s = start && dayjs(start, props.formatter.date, true)
        e = end && dayjs(end, props.formatter.date, true)
      }
    }
  }

  const startDate = dayjs.isDayjs(s) && s.isValid() ? s : null
  const endDate = dayjs.isDayjs(e) && e.isValid() ? e : null

  if (startDate && endDate) {
    // Single-day ranges should rely on the selected-day button styling.
    // Rendering range preview edges here stretches to full grid-cell width in wide layouts,
    // which visually turns the selected circle into a pill.
    if (startDate.isSame(endDate, 'date'))
      return classes

    const isWithinRange
      = date.isBetween(startDate, endDate, 'date', '[]')
        || date.isBetween(endDate, startDate, 'date', '[]')
    if (!isWithinRange)
      return classes

    if (date.isSame(startDate, 'date')) {
      if (endDate.isBefore(startDate))
        classes += ' rounded-r-full inset-0 vtd-datepicker-range-preview-edge'

      if (startDate.isBefore(endDate))
        classes += ' rounded-l-full inset-0 vtd-datepicker-range-preview-edge'

      if (startDate.isSame(endDate, 'date'))
        classes += ' rounded-full inset-0 vtd-datepicker-range-preview-edge'
    }
    else if (date.isSame(endDate, 'date')) {
      if (endDate.isBefore(startDate))
        classes += ' rounded-l-full inset-0 vtd-datepicker-range-preview-edge'

      if (startDate.isBefore(endDate))
        classes += ' rounded-r-full inset-0 vtd-datepicker-range-preview-edge'

      if (startDate.isSame(endDate, 'date'))
        classes += ' rounded-full inset-0 vtd-datepicker-range-preview-edge'
    }
    else {
      classes += ' inset-0'
    }
  }
  return classes
}

function forceEmit(s: string, e: string) {
  datepicker.value.previous = dayjs(s, props.formatter.date, true)
  datepicker.value.next = dayjs(e, props.formatter.date, true)

  if (
    dayjs
      .duration(datepicker.value.next.diff(datepicker.value.previous))
      .get('months') === 2
    || (dayjs
      .duration(datepicker.value.next.diff(datepicker.value.previous))
      .get('months') === 1
      && dayjs
        .duration(datepicker.value.next.diff(datepicker.value.previous))
        .get('days') === 7)
  )
    datepicker.value.next = datepicker.value.next.subtract(1, 'month')

  if (
    datepicker.value.next.isSame(datepicker.value.previous, 'month')
    || datepicker.value.next.isBefore(datepicker.value.previous)
  )
    datepicker.value.next = datepicker.value.previous.add(1, 'month')
}

function emitShortcut(s: string, e: string) {
  if (asRange()) {
    if (props.autoApply) {
      if (Array.isArray(props.modelValue)) {
        emit('update:modelValue', [s, e])
      }
      else if (typeof props.modelValue === 'object') {
        const obj: Record<string, string> = {}
        const [start, end] = Object.keys(props.modelValue)
        obj[start] = s
        obj[end] = e
        emit('update:modelValue', obj)
      }
      else {
        emit(
          'update:modelValue',
          useToValueFromArray(
            {
              previous: dayjs(s, props.formatter.date, true),
              next: dayjs(e, props.formatter.date, true),
            },
            props,
          ),
        )
      }
      pickerValue.value = `${s}${props.separator}${e}`
    }
    else {
      applyValue.value = [
        dayjs(s, props.formatter.date, true),
        dayjs(e, props.formatter.date, true),
      ]
    }
  }
  else {
    if (props.autoApply) {
      if (Array.isArray(props.modelValue)) {
        emit('update:modelValue', [s])
      }
      else if (typeof props.modelValue === 'object') {
        const obj: Record<string, string> = {}
        const [start] = Object.keys(props.modelValue)
        obj[start] = s
        emit('update:modelValue', obj)
      }
      else {
        emit('update:modelValue', s)
      }
      pickerValue.value = s
    }
    else {
      applyValue.value = [
        dayjs(s, props.formatter.date, true),
        dayjs(e, props.formatter.date, true),
      ]
    }
  }
  forceEmit(s, e)
}

function getBuiltInShortcut(target: BuiltInShortcutId): LegacyShortcutDefinition | TypedShortcutDefinition {
  switch (target) {
    case 'today':
      return {
        id: 'legacy-today',
        label: props.options.shortcuts.today,
        atClick: () => {
          const date = dayjs().toDate()
          return [date, date]
        },
      }
    case 'yesterday':
      return {
        id: 'legacy-yesterday',
        label: props.options.shortcuts.yesterday,
        atClick: () => {
          const date = dayjs().subtract(1, 'day').toDate()
          return [date, date]
        },
      }
    case 'past-7-days':
      return {
        id: 'legacy-past-7-days',
        label: props.options.shortcuts.past(7),
        atClick: () => {
          return [
            dayjs().subtract(6, 'day').toDate(),
            dayjs().toDate(),
          ]
        },
      }
    case 'past-30-days':
      return {
        id: 'legacy-past-30-days',
        label: props.options.shortcuts.past(30),
        atClick: () => {
          return [
            dayjs().subtract(29, 'day').toDate(),
            dayjs().toDate(),
          ]
        },
      }
    case 'this-month':
      return {
        id: 'legacy-this-month',
        label: props.options.shortcuts.currentMonth,
        atClick: () => {
          return [
            dayjs().date(1).toDate(),
            dayjs().date(dayjs().daysInMonth()).toDate(),
          ]
        },
      }
    case 'last-month':
      return {
        id: 'legacy-last-month',
        label: props.options.shortcuts.pastMonth,
        atClick: () => {
          return [
            dayjs().date(1).subtract(1, 'month').toDate(),
            dayjs().date(0).toDate(),
          ]
        },
      }
    case 'three-business-days':
      return {
        id: 'modern-three-business-days',
        label: '3 business days',
        resolver: ({ now }) => resolveModernBuiltInDate('three-business-days', now),
      }
    case 'next-week':
      return {
        id: 'modern-next-week',
        label: 'Next week',
        resolver: ({ now }) => resolveModernBuiltInDate('next-week', now),
      }
    case 'next-month':
      return {
        id: 'modern-next-month',
        label: 'Next month',
        resolver: ({ now }) => resolveModernBuiltInDate('next-month', now),
      }
  }
}

function emitInvalidShortcut(payload: InvalidShortcutEventPayload) {
  emit('invalid-shortcut', payload)
}

function applyShortcutResolvedValue(value: Date | [Date, Date]) {
  const [start, end] = Array.isArray(value) ? value : [value, value]
  const s = dayjs(start).format(props.formatter.date)
  const e = dayjs(end).format(props.formatter.date)
  emitShortcut(s, e)
}

function getShortcutActivationState(target: ShortcutActivationTarget, index?: number) {
  const item = typeof target === 'string' ? getBuiltInShortcut(target) : target
  const mode = asRange() ? 'range' : 'single'
  const now = new Date()
  return activateShortcutByDefinition({
    item,
    mode,
    currentValue: props.modelValue,
    now,
    index,
    constraints: {
      isDateBlocked: (date: Date) => useDisableDate(dayjs(date), props),
    },
  })
}

function isTypedShortcutDefinition(target: ShortcutActivationTarget): target is TypedShortcutDefinition {
  return typeof target !== 'string' && 'resolver' in target && typeof target.resolver === 'function'
}

const shortcutDisabledStateCache = new Map<string, ShortcutDisabledState>()
let shortcutDisabledStateCacheMinuteBucket = Math.floor(Date.now() / 60000)

function clearShortcutDisabledStateCache() {
  shortcutDisabledStateCache.clear()
}

function syncShortcutDisabledStateCacheBucket() {
  const currentMinuteBucket = Math.floor(Date.now() / 60000)
  if (currentMinuteBucket !== shortcutDisabledStateCacheMinuteBucket) {
    shortcutDisabledStateCacheMinuteBucket = currentMinuteBucket
    clearShortcutDisabledStateCache()
  }
}

function getShortcutCacheTargetKey(target: ShortcutActivationTarget, index?: number) {
  if (typeof target === 'string')
    return `builtin:${target}`

  if ('id' in target && typeof target.id === 'string' && target.id.trim().length > 0)
    return `custom:${target.id.trim()}:${index ?? -1}`

  return `legacy:${index ?? -1}:${target.label}`
}

function getShortcutDisabledStateCacheKey(target: ShortcutActivationTarget, index?: number) {
  syncShortcutDisabledStateCacheBucket()
  return `${asRange() ? 'range' : 'single'}:${getShortcutCacheTargetKey(target, index)}`
}

function cacheShortcutDisabledState(
  cacheKey: string,
  state: ShortcutDisabledState,
): ShortcutDisabledState {
  shortcutDisabledStateCache.set(cacheKey, state)
  return state
}

function getShortcutDisabledState(target: ShortcutActivationTarget, index?: number) {
  const cacheKey = getShortcutDisabledStateCacheKey(target, index)
  const cachedState = shortcutDisabledStateCache.get(cacheKey)
  if (cachedState)
    return cachedState

  if (typeof target === 'string') {
    const activation = getShortcutActivationState(target, index)
    if (!activation.ok && activation.payload.reason === 'blocked-date') {
      return cacheShortcutDisabledState(cacheKey, {
        isDisabled: true,
        disabledReason: 'blocked-date' as const,
      })
    }

    return cacheShortcutDisabledState(cacheKey, {
      isDisabled: false,
      disabledReason: null,
    })
  }

  const explicitlyDisabled = isShortcutDisabledByDefinition({
    item: target,
    mode: asRange() ? 'range' : 'single',
    currentValue: props.modelValue,
    now: new Date(),
    constraints: {
      isDateBlocked: (date: Date) => useDisableDate(dayjs(date), props),
    },
  })

  if (explicitlyDisabled) {
    return cacheShortcutDisabledState(cacheKey, {
      isDisabled: true,
      disabledReason: 'explicit' as const,
    })
  }

  if (isTypedShortcutDefinition(target)) {
    const activation = getShortcutActivationState(target, index)
    if (!activation.ok && activation.payload.reason === 'blocked-date') {
      return cacheShortcutDisabledState(cacheKey, {
        isDisabled: true,
        disabledReason: 'blocked-date' as const,
      })
    }
  }

  return cacheShortcutDisabledState(cacheKey, {
    isDisabled: false,
    disabledReason: null,
  })
}

function isShortcutDisabled(target: ShortcutActivationTarget, index?: number) {
  return getShortcutDisabledState(target, index).isDisabled
}

function activateShortcut(
  target: ShortcutActivationTarget,
  close?: (ref?: Ref | HTMLElement) => void,
  index?: number,
) {
  const activation = getShortcutActivationState(target, index)

  if (!activation.ok) {
    emitInvalidShortcut(activation.payload)
    return
  }

  applyShortcutResolvedValue(activation.value)

  if (close)
    close()
}

watch(
  () => applyValue.value,
  (newValue) => {
    if (newValue.length > 0) {
      panel.previous.calendar = true
      panel.previous.month = false
      panel.previous.year = false

      panel.next.calendar = true
      panel.next.month = false
      panel.next.year = false
    }
  },
)

watch(() => props.modelValue, clearShortcutDisabledStateCache, { deep: true })
watch(() => props.disableDate, clearShortcutDisabledStateCache)
watch(() => props.useRange, clearShortcutDisabledStateCache)
watch(() => props.shortcutPreset, clearShortcutDisabledStateCache)
watch(() => props.shortcuts, clearShortcutDisabledStateCache, { deep: true })

watchEffect(() => {
  if (!props.placeholder) {
    if (asRange())
      givenPlaceholder.value = `${props.formatter.date}${props.separator}${props.formatter.date}`
    else givenPlaceholder.value = props.formatter.date
  }
  else {
    givenPlaceholder.value = props.placeholder
  }
})

dayjs.locale(props.i18n)
watch(() => props.i18n, () => dayjs.locale(props.i18n))

watchEffect(() => {
  const locale = props.i18n
  const modelValueCloned = props.modelValue
  nextTick(async () => {
    if (locale in localesMap) {
      const localeData = await localesMap[locale]()
      dayjs.locale(localeData, undefined, true)
      dayjs.locale(locale)
    }

    let s, e
    if (asRange()) {
      if (Array.isArray(modelValueCloned)) {
        if (modelValueCloned.length > 0) {
          const [start, end] = modelValueCloned
          s = dayjs(start, props.formatter.date, true)
          e = dayjs(end, props.formatter.date, true)
        }
      }
      else if (typeof modelValueCloned === 'object') {
        if (!isProxy(modelValueCloned)) {
          try {
            Object.keys(modelValueCloned)
          }
          catch (e) {
            console.warn(
              '[Vue Tailwind Datepicker]: It looks like you want to use Object as the argument %cv-model',
              'font-style: italic; color: #42b883;',
              ', but you pass it undefined or null.',
            )
            console.warn(
              '[Vue Tailwind Datepicker]: We has replace with %c{ startDate: \'\', endDate: \'\' }',
              'font-style: italic; color: #42b883;',
              ', but you can replace manually.',
            )
            emit('update:modelValue', {
              startDate: '',
              endDate: '',
            })
          }
        }
        if (modelValueCloned) {
          const [start, end] = Object.values(modelValueCloned)
          s = start && dayjs(start, props.formatter.date, true)
          e = end && dayjs(end, props.formatter.date, true)
        }
      }
      else {
        if (modelValueCloned) {
          const [start, end] = modelValueCloned.split(props.separator)
          s = dayjs(start, props.formatter.date, true)
          e = dayjs(end, props.formatter.date, true)
        }
      }

      if (s && e) {
        pickerValue.value = useToValueFromArray(
          {
            previous: s,
            next: e,
          },
          props,
        )
        if (e.isBefore(s, 'month')) {
          datepicker.value.previous = e
          datepicker.value.next = s
          datepicker.value.year.previous = e.year()
          datepicker.value.year.next = s.year()
        }
        else if (e.isSame(s, 'month')) {
          datepicker.value.previous = s
          datepicker.value.next = e.add(1, 'month')
          datepicker.value.year.previous = s.year()
          datepicker.value.year.next = s.add(1, 'year').year()
        }
        else {
          datepicker.value.previous = s
          datepicker.value.next = e
          datepicker.value.year.previous = s.year()
          datepicker.value.year.next = e.year()
        }
        if (!props.autoApply)
          applyValue.value = [s, e]
      }
      else {
        datepicker.value.previous = dayjs(props.startFrom)
        datepicker.value.next = dayjs(props.startFrom).add(1, 'month')
        datepicker.value.year.previous = datepicker.value.previous.year()
        datepicker.value.year.next = datepicker.value.next.year()
      }
    }
    else {
      if (Array.isArray(modelValueCloned)) {
        if (modelValueCloned.length > 0) {
          const [start] = modelValueCloned
          s = dayjs(start, props.formatter.date, true)
        }
      }
      else if (typeof modelValueCloned === 'object') {
        if (modelValueCloned) {
          const [start] = Object.values(modelValueCloned)
          s = dayjs(start, props.formatter.date, true)
        }
      }
      else {
        if (modelValueCloned.length) {
          const [start] = modelValueCloned.split(props.separator)
          s = dayjs(start, props.formatter.date, true)
        }
      }

      if (s && s.isValid()) {
        pickerValue.value = useToValueFromString(s, props)
        datepicker.value.previous = s
        datepicker.value.next = s.add(1, 'month')
        datepicker.value.year.previous = s.year()
        datepicker.value.year.next = s.add(1, 'year').year()
        if (!props.autoApply)
          applyValue.value = [s]
      }
      else {
        datepicker.value.previous = dayjs(props.startFrom)
        datepicker.value.next = dayjs(props.startFrom).add(1, 'month')
        datepicker.value.year.previous = datepicker.value.previous.year()
        datepicker.value.year.next = datepicker.value.next.year()
      }
    }
    const days
      = props.weekdaysSize === 'min'
        ? dayjs.weekdaysMin()
        : dayjs.weekdaysShort()
    datepicker.value.weeks = isFirstMonday() ? shuffleWeekdays(days) : days
    datepicker.value.months
      = props.formatter.month === 'MMM' ? dayjs.monthsShort() : dayjs.months()
  })
})

function getAbsoluteClass(open: boolean) {
  if (open && placement.value === null)
    placement.value = useVisibleViewport(VtdRef.value)

  if (open && placement.value)
    return 'place-right'

  return 'place-left'
}

function getAbsoluteParentClass(open: boolean) {
  if (open && placement.value === null)
    placement.value = useVisibleViewport(VtdRef.value)

  if (placement.value)
    return 'left-auto right-0'

  return 'left-0 right-auto'
}

watchEffect(() => {
  if (pickerViewMode.value === 'calendar')
    syncSelectorState(resolveSelectionContext('previous'))
})

provide(isBetweenRangeKey, isBetweenRange)
provide(betweenRangeClassesKey, betweenRangeClasses)
provide(datepickerClassesKey, datepickerClasses)
provide(atMouseOverKey, atMouseOver)
provide(activateShortcutKey, activateShortcut)
provide(isShortcutDisabledKey, isShortcutDisabled)
provide(getShortcutDisabledStateKey, getShortcutDisabledState)
</script>

<template>
  <Popover v-if="!props.noInput" id="vtd" v-slot="{ open }: { open: boolean }" as="div" class="relative w-full">
    <PopoverOverlay v-if="props.overlay && !props.disabled" class="fixed inset-0 bg-black opacity-30" />

    <PopoverButton ref="VtdPopoverButtonRef" as="label" class="relative block" @click="resetPickerViewMode">
      <slot :value="pickerValue" :placeholder="givenPlaceholder" :clear="clearPicker">
        <input ref="VtdInputRef" v-bind="$attrs" v-model="pickerValue" type="text" class="relative block w-full"
          :disabled="props.disabled" :class="[
            props.disabled ? 'cursor-default opacity-50' : 'opacity-100',
            inputClasses
            || 'pl-3 pr-12 py-2.5 rounded-lg overflow-hidden border-solid text-sm text-vtd-secondary-700 placeholder-vtd-secondary-400 transition-colors bg-white border border-vtd-secondary-300 focus:border-vtd-primary-300 focus:ring focus:ring-vtd-primary-500/10 focus:outline-none dark:bg-vtd-secondary-800 dark:border-vtd-secondary-700 dark:text-vtd-secondary-100 dark:placeholder-vtd-secondary-500 dark:focus:border-vtd-primary-500 dark:focus:ring-vtd-primary-500/20',
          ]" autocomplete="off" data-lpignore="true" data-form-type="other" :placeholder="givenPlaceholder"
          @keyup.stop="keyUp" @keydown.stop="onInputKeydown">
        <div class="absolute inset-y-0 right-0 inline-flex items-center rounded-md overflow-hidden">
          <button type="button" :disabled="props.disabled" :class="props.disabled ? 'cursor-default opacity-50' : 'opacity-100'
            " class="px-2 py-1 mr-1 focus:outline-none text-vtd-secondary-400 dark:text-vtd-secondary-400/70 rounded-md" @click="
    props.disabled
      ? false
      : pickerValue
        ? clearPicker()
        : VtdInputRef?.focus()
    ">
            <slot name="inputIcon" :value="pickerValue">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg">
                <path v-if="pickerValue" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M6 18L18 6M6 6l12 12" />
                <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </slot>
          </button>
        </div>
      </slot>
    </PopoverButton>

    <transition enter-from-class="opacity-0 translate-y-3" enter-to-class="opacity-100 translate-y-0"
      enter-active-class="transform transition ease-out duration-200"
      leave-active-class="transform transition ease-in duration-150" leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-3" @after-enter="onPopoverAfterEnter">
      <PopoverPanel v-if="!props.disabled" v-slot="{ close }: { close: (ref?: Ref | HTMLElement) => void }" as="div"
        class="relative z-50">
        <div class="absolute z-50 top-full sm:mt-2.5" :class="getAbsoluteParentClass(open)">
          <div ref="VtdRef"
            class="fixed inset-0 z-50 overflow-y-auto sm:overflow-visible sm:static sm:z-auto bg-white dark:bg-vtd-secondary-800 sm:rounded-lg shadow-sm">
            <div
              class="vtd-datepicker static sm:relative w-full sm:w-fit bg-white sm:rounded-lg sm:shadow-sm border-0 sm:border border-black/[.1] px-3 py-3 sm:px-4 sm:py-4 dark:bg-vtd-secondary-800 dark:border-vtd-secondary-700/[1]"
              :class="[getAbsoluteClass(open), props.selectorMode && props.asSingle ? 'sm:min-h-[23.5rem]' : '']"
              @keydown.capture="(event) => onPickerPanelKeydown(event, close)">
              <div class="flex flex-wrap lg:flex-nowrap" :class="props.selectorMode && props.asSingle ? 'sm:h-full' : ''">
                <VtdShortcut v-if="props.shortcuts" :shortcuts="props.shortcuts" :as-range="asRange()"
                  :as-single="props.asSingle" :built-in-shortcuts="builtInShortcutItems" :close="close">
                  <template #shortcut-item="slotProps">
                    <slot name="shortcut-item" v-bind="slotProps" />
                  </template>
                </VtdShortcut>
                <div class="relative flex flex-wrap sm:flex-nowrap p-1 w-full sm:w-auto" :class="props.selectorMode && props.asSingle ? 'sm:h-full' : ''">
                  <div v-if="asRange() && !props.asSingle"
                    class="hidden h-full absolute inset-0 sm:flex justify-center items-center">
                    <div class="h-full border-r border-black/[.1] dark:border-vtd-secondary-700/[1]" />
                  </div>
                  <div class="relative w-full" data-vtd-selector-panel="previous" :class="{
                    'mb-3 sm:mb-0 sm:mr-2 md:w-1/2 lg:w-80':
                      asRange() && !props.asSingle,
                    'lg:w-80': props.asSingle && !!props.shortcuts,
                    'sm:min-h-[21.625rem]': props.asSingle && !props.selectorMode,
                    'sm:h-full': props.selectorMode && props.asSingle,
                    'overflow-visible': isSelectorPanel('previous'),
                    'overflow-hidden': !isSelectorPanel('previous'),
                  }">
                    <VtdHeader
                      :panel="panel.previous"
                      :calendar="calendar.previous"
                      panel-name="previous"
                      :selector-mode="props.selectorMode"
                      :selector-focus="selectorFocus"
                      :picker-view-mode="getPanelPickerViewMode('previous')"
                      @enter-selector-mode="enterSelectorMode"
                      @toggle-picker-view="(payload) => togglePickerViewMode(payload, { restoreFocus: true })"
                      @step-month="onHeaderMonthStep"
                    />
                    <div class="px-0.5 sm:px-2" :class="{
                      'sm:min-h-[17.625rem]': props.selectorMode,
                    }">
                      <template v-if="isSelectorPanel('previous')">
                        <div class="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:[grid-template-columns:minmax(0,7.25rem)_minmax(0,7.25rem)] sm:justify-center">
                          <div
                            class="rounded-md border p-1 min-w-0"
                            :class="getSelectorColumnClass('month')"
                          >
                            <VtdMonth
                              :ref="setPreviousSelectorMonthWheelRef"
                              :months="months"
                              selector-mode
                              :selected-month="getPanelSelectedMonth('previous')"
                              :selected-year="getPanelSelectedYear('previous')"
                              :selector-focus="selectorFocus"
                              @focus-month="onSelectorColumnFocus('previous', 'month')"
                              @request-focus-year="requestSelectorColumnFocus('previous', 'year')"
                              @update-month="(month) => onSelectorMonthUpdate('previous', month)"
                              @scroll-month="(month) => onSelectorMonthUpdate('previous', month)"
                            />
                          </div>
                          <div
                            class="rounded-md border p-1 min-w-0"
                            :class="getSelectorColumnClass('year')"
                          >
                            <VtdYear
                              :years="selectorYears"
                              selector-mode
                              :selected-month="getPanelSelectedMonth('previous')"
                              :selected-year="getPanelSelectedYear('previous')"
                              :selector-focus="selectorFocus"
                              :year-scroll-mode="props.selectorYearScrollMode"
                              :home-jump="props.selectorYearHomeJump"
                              :end-jump="props.selectorYearEndJump"
                              :page-jump="props.selectorYearPageJump"
                              :page-shift-jump="props.selectorYearPageShiftJump"
                              @focus-year="onSelectorColumnFocus('previous', 'year')"
                              @request-focus-month="requestSelectorColumnFocus('previous', 'month')"
                              @update-year="(year) => onSelectorYearUpdate('previous', year)"
                              @scroll-year="(year) => onSelectorYearUpdate('previous', year)"
                            />
                          </div>
                        </div>
                      </template>
                      <template v-else>
                        <VtdMonth v-show="panel.previous.month" :months="months"
                          @update-month="calendar.previous.setMonth" />
                        <VtdYear v-show="panel.previous.year" :years="calendar.previous.years()"
                          @update-year="calendar.previous.setYear" />
                        <div v-show="panel.previous.calendar">
                          <VtdWeek :weeks="weeks" />
                          <VtdCalendar :calendar="calendar.previous" :weeks="weeks" :as-range="asRange()"
                            :week-number="weekNumber" @update-date="(date) => setDate(date, close)" />
                        </div>
                      </template>
                    </div>
                  </div>

                  <div v-if="asRange() && !props.asSingle"
                    data-vtd-selector-panel="next"
                    class="relative w-full md:w-1/2 lg:w-80 mt-3 sm:mt-0 sm:ml-2"
                    :class="{
                      'overflow-visible': isSelectorPanel('next'),
                      'overflow-hidden': !isSelectorPanel('next'),
                    }">
                    <VtdHeader
                      as-prev-or-next
                      :panel="panel.next"
                      :calendar="calendar.next"
                      panel-name="next"
                      :selector-mode="props.selectorMode"
                      :selector-focus="selectorFocus"
                      :picker-view-mode="getPanelPickerViewMode('next')"
                      @enter-selector-mode="enterSelectorMode"
                      @toggle-picker-view="(payload) => togglePickerViewMode(payload, { restoreFocus: true })"
                      @step-month="onHeaderMonthStep"
                    />
                    <div class="px-0.5 sm:px-2" :class="{
                      'sm:min-h-[17.625rem]': props.selectorMode,
                    }">
                      <template v-if="isSelectorPanel('next')">
                        <div class="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:[grid-template-columns:minmax(0,7.25rem)_minmax(0,7.25rem)] sm:justify-center">
                          <div
                            class="rounded-md border p-1 min-w-0"
                            :class="getSelectorColumnClass('month')"
                          >
                            <VtdMonth
                              :ref="setNextSelectorMonthWheelRef"
                              :months="months"
                              selector-mode
                              :selected-month="getPanelSelectedMonth('next')"
                              :selected-year="getPanelSelectedYear('next')"
                              :selector-focus="selectorFocus"
                              @focus-month="onSelectorColumnFocus('next', 'month')"
                              @request-focus-year="requestSelectorColumnFocus('next', 'year')"
                              @update-month="(month) => onSelectorMonthUpdate('next', month)"
                              @scroll-month="(month) => onSelectorMonthUpdate('next', month)"
                            />
                          </div>
                          <div
                            class="rounded-md border p-1 min-w-0"
                            :class="getSelectorColumnClass('year')"
                          >
                            <VtdYear
                              as-prev-or-next
                              :years="selectorYears"
                              selector-mode
                              :selected-month="getPanelSelectedMonth('next')"
                              :selected-year="getPanelSelectedYear('next')"
                              :selector-focus="selectorFocus"
                              :year-scroll-mode="props.selectorYearScrollMode"
                              :home-jump="props.selectorYearHomeJump"
                              :end-jump="props.selectorYearEndJump"
                              :page-jump="props.selectorYearPageJump"
                              :page-shift-jump="props.selectorYearPageShiftJump"
                              @focus-year="onSelectorColumnFocus('next', 'year')"
                              @request-focus-month="requestSelectorColumnFocus('next', 'month')"
                              @update-year="(year) => onSelectorYearUpdate('next', year)"
                              @scroll-year="(year) => onSelectorYearUpdate('next', year)"
                            />
                          </div>
                        </div>
                      </template>
                      <template v-else>
                        <VtdMonth v-show="panel.next.month" :months="months" @update-month="calendar.next.setMonth" />
                        <VtdYear v-show="panel.next.year" as-prev-or-next :years="calendar.next.years()"
                          @update-year="calendar.next.setYear" />
                        <div v-show="panel.next.calendar">
                          <VtdWeek :weeks="weeks" />
                          <VtdCalendar as-prev-or-next :calendar="calendar.next" :weeks="weeks" :as-range="asRange()"
                            :week-number="weekNumber" @update-date="(date) => setDate(date, close)" />
                        </div>
                      </template>
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="!props.autoApply">
                <div class="mt-2 mx-2 py-1.5 border-t border-black/[.1] dark:border-vtd-secondary-700/[1]">
                  <div class="mt-1.5 sm:flex sm:flex-row-reverse">
                    <button type="button"
                      class="away-apply-picker w-full transition ease-out duration-300 inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-vtd-primary-600 text-base font-medium text-white hover:bg-vtd-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-vtd-primary-500 sm:ml-3 sm:w-auto sm:text-sm dark:ring-offset-vtd-secondary-800 disabled:cursor-not-allowed"
                      :disabled="props.asSingle
                        ? applyValue.length < 1
                        : applyValue.length < 2
                        " @click="applyDate(close)" v-text="props.options.footer.apply" />
                    <button type="button"
                      class="mt-3 away-cancel-picker w-full transition ease-out duration-300 inline-flex justify-center rounded-md border border-vtd-secondary-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-vtd-secondary-700 hover:bg-vtd-secondary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-vtd-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:ring-offset-vtd-secondary-800"
                      @click="close()" v-text="props.options.footer.cancel" />
                  </div>
                </div>
              </div>
              <div v-else class="sm:hidden">
                <div class="mt-2 mx-2 py-1.5 border-t border-black/[.1] dark:border-vtd-secondary-700/[1]">
                  <div class="mt-1.5 sm:flex sm:flex-row-reverse">
                    <button type="button"
                      class="away-cancel-picker w-full transition ease-out duration-300 inline-flex justify-center rounded-md border border-vtd-secondary-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-vtd-secondary-700 hover:bg-vtd-secondary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-vtd-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:ring-offset-vtd-secondary-800"
                      @click="close()" v-text="props.options.footer.cancel" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PopoverPanel>
    </transition>
  </Popover>
  <div v-else-if="displayDatepicker" class="flex">
    <div
      ref="VtdStaticRef"
      class="bg-white rounded-lg shadow-sm border border-black/[.1] px-3 py-3 sm:px-4 sm:py-4 dark:bg-vtd-secondary-800 dark:border-vtd-secondary-700/[1]"
      :class="props.selectorMode && props.asSingle ? 'sm:min-h-[23.5rem]' : ''"
      @keydown.capture="onPickerPanelKeydown">
      <div class="flex flex-wrap lg:flex-nowrap" :class="props.selectorMode && props.asSingle ? 'sm:h-full' : ''">
        <VtdShortcut v-if="props.shortcuts" :shortcuts="props.shortcuts" :as-range="asRange()" :as-single="props.asSingle"
          :built-in-shortcuts="builtInShortcutItems">
          <template #shortcut-item="slotProps">
            <slot name="shortcut-item" v-bind="slotProps" />
          </template>
        </VtdShortcut>
        <div class="relative flex flex-wrap sm:flex-nowrap p-1 w-full sm:w-auto" :class="props.selectorMode && props.asSingle ? 'sm:h-full' : ''">
          <div v-if="asRange() && !props.asSingle"
            class="hidden h-full absolute inset-0 sm:flex justify-center items-center">
            <div class="h-full border-r border-black/[.1] dark:border-vtd-secondary-700/[1]" />
          </div>
          <div class="relative w-full" data-vtd-selector-panel="previous" :class="{
            'mb-3 sm:mb-0 sm:mr-2 md:w-1/2 lg:w-80': asRange() && !props.asSingle,
            'lg:w-80': props.asSingle && !!props.shortcuts,
            'sm:min-h-[21.625rem]': props.asSingle && !props.selectorMode,
            'sm:h-full': props.selectorMode && props.asSingle,
            'overflow-visible': isSelectorPanel('previous'),
            'overflow-hidden': !isSelectorPanel('previous'),
          }">
            <VtdHeader
              :panel="panel.previous"
              :calendar="calendar.previous"
              panel-name="previous"
              :selector-mode="props.selectorMode"
              :selector-focus="selectorFocus"
              :picker-view-mode="getPanelPickerViewMode('previous')"
              @enter-selector-mode="enterSelectorMode"
              @toggle-picker-view="(payload) => togglePickerViewMode(payload, { restoreFocus: true })"
              @step-month="onHeaderMonthStep"
            />
            <div class="px-0.5 sm:px-2" :class="{
              'sm:min-h-[17.625rem]': props.selectorMode,
            }">
              <template v-if="isSelectorPanel('previous')">
                <div class="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:[grid-template-columns:minmax(0,7.25rem)_minmax(0,7.25rem)] sm:justify-center">
                  <div
                    class="rounded-md border p-1 min-w-0"
                    :class="getSelectorColumnClass('month')"
                  >
                    <VtdMonth
                      :ref="setPreviousSelectorMonthWheelRef"
                      :months="months"
                      selector-mode
                      :selected-month="getPanelSelectedMonth('previous')"
                      :selected-year="getPanelSelectedYear('previous')"
                      :selector-focus="selectorFocus"
                      @focus-month="onSelectorColumnFocus('previous', 'month')"
                      @request-focus-year="requestSelectorColumnFocus('previous', 'year')"
                      @update-month="(month) => onSelectorMonthUpdate('previous', month)"
                      @scroll-month="(month) => onSelectorMonthUpdate('previous', month)"
                    />
                  </div>
                  <div
                    class="rounded-md border p-1 min-w-0"
                    :class="getSelectorColumnClass('year')"
                  >
                    <VtdYear
                      :years="selectorYears"
                      selector-mode
                      :selected-month="getPanelSelectedMonth('previous')"
                      :selected-year="getPanelSelectedYear('previous')"
                      :selector-focus="selectorFocus"
                      :year-scroll-mode="props.selectorYearScrollMode"
                      :home-jump="props.selectorYearHomeJump"
                      :end-jump="props.selectorYearEndJump"
                      :page-jump="props.selectorYearPageJump"
                      :page-shift-jump="props.selectorYearPageShiftJump"
                      @focus-year="onSelectorColumnFocus('previous', 'year')"
                      @request-focus-month="requestSelectorColumnFocus('previous', 'month')"
                      @update-year="(year) => onSelectorYearUpdate('previous', year)"
                      @scroll-year="(year) => onSelectorYearUpdate('previous', year)"
                    />
                  </div>
                </div>
              </template>
              <template v-else>
                <VtdMonth v-show="panel.previous.month" :months="months" @update-month="calendar.previous.setMonth" />
                <VtdYear v-show="panel.previous.year" :years="calendar.previous.years()"
                  @update-year="calendar.previous.setYear" />
                <div v-show="panel.previous.calendar">
                  <VtdWeek :weeks="weeks" />
                  <VtdCalendar :calendar="calendar.previous" :weeks="weeks" :as-range="asRange()" :week-number="weekNumber"
                    @update-date="(date) => setDate(date)" />
                </div>
              </template>
            </div>
          </div>

          <div v-if="asRange() && !props.asSingle"
            data-vtd-selector-panel="next"
            class="relative w-full md:w-1/2 lg:w-80 mt-3 sm:mt-0 sm:ml-2"
            :class="{
              'overflow-visible': isSelectorPanel('next'),
              'overflow-hidden': !isSelectorPanel('next'),
            }">
            <VtdHeader
              as-prev-or-next
              :panel="panel.next"
              :calendar="calendar.next"
              panel-name="next"
              :selector-mode="props.selectorMode"
              :selector-focus="selectorFocus"
              :picker-view-mode="getPanelPickerViewMode('next')"
              @enter-selector-mode="enterSelectorMode"
              @toggle-picker-view="(payload) => togglePickerViewMode(payload, { restoreFocus: true })"
              @step-month="onHeaderMonthStep"
            />
            <div class="px-0.5 sm:px-2" :class="{
              'sm:min-h-[17.625rem]': props.selectorMode,
            }">
              <template v-if="isSelectorPanel('next')">
                <div class="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:[grid-template-columns:minmax(0,7.25rem)_minmax(0,7.25rem)] sm:justify-center">
                  <div
                    class="rounded-md border p-1 min-w-0"
                    :class="getSelectorColumnClass('month')"
                  >
                    <VtdMonth
                      :ref="setNextSelectorMonthWheelRef"
                      :months="months"
                      selector-mode
                      :selected-month="getPanelSelectedMonth('next')"
                      :selected-year="getPanelSelectedYear('next')"
                      :selector-focus="selectorFocus"
                      @focus-month="onSelectorColumnFocus('next', 'month')"
                      @request-focus-year="requestSelectorColumnFocus('next', 'year')"
                      @update-month="(month) => onSelectorMonthUpdate('next', month)"
                      @scroll-month="(month) => onSelectorMonthUpdate('next', month)"
                    />
                  </div>
                  <div
                    class="rounded-md border p-1 min-w-0"
                    :class="getSelectorColumnClass('year')"
                  >
                    <VtdYear
                      as-prev-or-next
                      :years="selectorYears"
                      selector-mode
                      :selected-month="getPanelSelectedMonth('next')"
                      :selected-year="getPanelSelectedYear('next')"
                      :selector-focus="selectorFocus"
                      :year-scroll-mode="props.selectorYearScrollMode"
                      :home-jump="props.selectorYearHomeJump"
                      :end-jump="props.selectorYearEndJump"
                      :page-jump="props.selectorYearPageJump"
                      :page-shift-jump="props.selectorYearPageShiftJump"
                      @focus-year="onSelectorColumnFocus('next', 'year')"
                      @request-focus-month="requestSelectorColumnFocus('next', 'month')"
                      @update-year="(year) => onSelectorYearUpdate('next', year)"
                      @scroll-year="(year) => onSelectorYearUpdate('next', year)"
                    />
                  </div>
                </div>
              </template>
              <template v-else>
                <VtdMonth v-show="panel.next.month" :months="months" @update-month="calendar.next.setMonth" />
                <VtdYear v-show="panel.next.year" as-prev-or-next :years="calendar.next.years()"
                  @update-year="calendar.next.setYear" />
                <div v-show="panel.next.calendar">
                  <VtdWeek :weeks="weeks" />
                  <VtdCalendar as-prev-or-next :calendar="calendar.next" :weeks="weeks" :as-range="asRange()"
                    :week-number="weekNumber" @update-date="(date) => setDate(date)" />
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
      <div v-if="!props.autoApply">
        <div class="mt-2 mx-2 py-1.5 border-t border-black/[.1] dark:border-vtd-secondary-700/[1]">
          <div class="mt-1.5 sm:flex sm:flex-row-reverse">
            <button type="button"
              class="away-apply-picker w-full transition ease-out duration-300 inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-vtd-primary-600 text-base font-medium text-white hover:bg-vtd-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-vtd-primary-500 sm:ml-3 sm:w-auto sm:text-sm dark:ring-offset-vtd-secondary-800 disabled:cursor-not-allowed"
              :disabled="props.asSingle ? applyValue.length < 1 : applyValue.length < 2
                " @click="applyDate()" v-text="props.options.footer.apply" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
@import "tailwindcss";
@import "./index.css";

.vtd-datepicker-overlay.open::before {
  @apply block opacity-50;
}

.vtd-datepicker::before {
  --vtd-datepicker: 0px;
  content: "";
  @apply absolute top-0 w-4 h-4 bg-white shadow border border-black/[.1] dark:bg-vtd-secondary-800 dark:border-vtd-secondary-700;
  transform: translate(50%, -50%) rotate(-45deg);
  clip-path: polygon(calc(var(--vtd-datepicker) * -1) calc(var(--vtd-datepicker) * -1),
      calc(100% + var(--vtd-datepicker)) calc(var(--vtd-datepicker) * -1),
      calc(100% + var(--vtd-datepicker)) calc(100% + var(--vtd-datepicker)));
}

.vtd-datepicker.place-left::before {
  @apply left-1 dark:bg-vtd-secondary-800 dark:border-vtd-secondary-700;
}

.vtd-datepicker.place-right::before {
  @apply right-5 dark:bg-vtd-secondary-800 dark:border-vtd-secondary-700;
}
</style>
