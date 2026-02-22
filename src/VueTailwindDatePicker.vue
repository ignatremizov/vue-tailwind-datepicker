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
  getCurrentInstance,
  isProxy,
  nextTick,
  onMounted,
  onUnmounted,
  provide,
  reactive,
  ref,
  unref,
  watch,
  watchEffect,
} from 'vue'
import {
  analyzeFormatterTimeTokens,
  localesMap,
  maskDayjsEscapedLiterals,
  normalizeDefaultTimeInput,
} from './utils'
import VtdHeader from './components/Header.vue'
import VtdShortcut from './components/Shortcut.vue'
import VtdCalendar from './components/Calendar.vue'
import VtdYear from './components/Year.vue'
import VtdWeek from './components/Week.vue'
import VtdMonth from './components/Month.vue'
import VtdTimeWheel from './components/TimeWheel.vue'
import {
  formatModelDateWithDirectYear,
  parseModelDateWithDirectYear,
} from './composables/directYearInput'
import useDate from './composables/date'
import useDom from './composables/dom'
import useShortcut, {
  legacyShortcutFallbackId,
  resolveModernBuiltInDate,
} from './composables/shortcut'
import type {
  ApplyGuardState,
  DatePickerDay,
  DateTimeDraft,
  DateTimeEndpointSelection,
  DateTimeErrorCode,
  DateTimeErrorEventPayload,
  DateTimeModeConfig,
  InvalidShortcutEventPayload,
  LegacyShortcutDefinition,
  RangeDraftState,
  SelectionPanel,
  SelectorFocus,
  ShortcutDefinition,
  ShortcutFactory,
  ShortcutPreset,
  TypedShortcutDefinition,
  YearNumberingMode,
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
  defaultTime?: string
  defaultEndTime?: string
  timePickerStyle?: 'none' | 'input' | 'wheel-inline' | 'wheel-page'
  timeWheelHeight?: number
  timeWheelPageHeight?: number
  timeInlinePosition?: 'below' | 'right'
  timePageMode?: 'toggle' | 'after-date'
  timeWheelScrollMode?: 'boundary' | 'fractional'
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
  directYearInput?: boolean
  yearNumberingMode?: YearNumberingMode
  selectorYearHomeJump?: number
  selectorYearEndJump?: number
  selectorYearPageJump?: number
  selectorYearPageShiftJump?: number
  closeOnRangeSelection?: boolean
  openFocusTarget?: 'calendar' | 'input'
  popoverTransition?: boolean
  popoverRestoreFocus?: boolean
  options?: {
    shortcuts: {
      today: string
      yesterday: string
      past: (period: number) => string
      currentMonth: string
      pastMonth: string
      businessDays?: (period: number) => string
      nextWeek?: string
      nextMonth?: string
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
  defaultTime: undefined,
  defaultEndTime: undefined,
  timePickerStyle: 'none',
  timeWheelHeight: 176,
  timeWheelPageHeight: 232,
  timeInlinePosition: 'below',
  timePageMode: 'toggle',
  timeWheelScrollMode: 'boundary',
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
  directYearInput: false,
  yearNumberingMode: 'historical',
  selectorYearHomeJump: 100,
  selectorYearEndJump: 100,
  selectorYearPageJump: 10,
  selectorYearPageShiftJump: 100,
  closeOnRangeSelection: true,
  openFocusTarget: 'input',
  popoverTransition: true,
  popoverRestoreFocus: false,
  options: () => ({
    shortcuts: {
      today: 'Today',
      yesterday: 'Yesterday',
      past: period => `Last ${period} Days`,
      currentMonth: 'This Month',
      pastMonth: 'Last Month',
      businessDays: period => `${period} business days`,
      nextWeek: 'Next week',
      nextMonth: 'Next month',
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
  (e: 'error', value: DateTimeErrorEventPayload): void;
}>()

const {
  useValidateDayjsLocalDateTime,
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

const VtdRef = ref<HTMLElement | null>(null)
const VtdStaticRef = ref<HTMLElement | null>(null)
const VtdPanelContentRef = ref<HTMLElement | null>(null)
const VtdInputRef = ref<HTMLInputElement | null>(null)
const VtdPopoverButtonRef = ref<unknown>(null)
let panelMeasureJobToken = 0
const placement = ref<boolean | null>(null)
const givenPlaceholder = ref('')
const selection = ref<Dayjs | null>(null)
const pickerValue = ref('')
const hoverValue = ref<Dayjs[]>([])
const applyValue = ref<Dayjs[]>([])
const previous = ref<Dayjs | null>(null)
const next = ref<Dayjs | null>(null)

interface ResolvedModelDateValue {
  value: Dayjs | null
  isHydrated: boolean
}

interface TimeWheelOption {
  label: string
  value: number | string
}

interface TimeWheelStepPayload {
  value: number | string
  previousValue: number | string | null
  absoluteIndex: number
  previousAbsoluteIndex: number | null
  delta: number
}

type ResolvedTimePickerStyle = 'none' | 'input' | 'wheel-inline' | 'wheel-page'

interface VtdDebugEvent {
  at: number
  type: string
  instance: string
  payload?: Record<string, unknown>
}

interface VtdDebugStore {
  mountedCount: number
  events: VtdDebugEvent[]
}

interface VtdDebugWindow extends Window {
  __VTD_DEBUG__?: VtdDebugStore
  __VTD_DEBUG_ENABLED__?: boolean
}

const instanceUid = getCurrentInstance()?.uid ?? Math.round(Math.random() * 1_000_000)
const debugInstanceLabel = `picker-${instanceUid}`

function isDebugEnabled() {
  if (!import.meta.env.DEV || typeof window === 'undefined')
    return false

  const runtimeWindow = window as VtdDebugWindow
  return runtimeWindow.__VTD_DEBUG_ENABLED__ === true
}

function getDebugStore() {
  if (typeof window === 'undefined')
    return null

  const runtimeWindow = window as VtdDebugWindow
  if (!runtimeWindow.__VTD_DEBUG__) {
    runtimeWindow.__VTD_DEBUG__ = {
      mountedCount: 0,
      events: [],
    }
  }
  return runtimeWindow.__VTD_DEBUG__
}

function pushDebugEvent(type: string, payload?: Record<string, unknown>) {
  if (!isDebugEnabled())
    return

  const store = getDebugStore()
  if (!store)
    return

  const event: VtdDebugEvent = {
    at: performance.now(),
    type,
    instance: debugInstanceLabel,
  }
  if (payload)
    event.payload = payload
  store.events.push(event)

  // Keep the log bounded so long demo sessions do not balloon memory usage.
  if (store.events.length > 2000)
    store.events.splice(0, store.events.length - 2000)
}

function describeActiveElement() {
  if (typeof document === 'undefined')
    return 'none'

  const active = document.activeElement
  if (!(active instanceof HTMLElement))
    return 'none'

  const id = active.id ? `#${active.id}` : ''
  const className = typeof active.className === 'string' && active.className.trim().length > 0
    ? `.${active.className.trim().split(/\s+/).slice(0, 2).join('.')}`
    : ''
  return `${active.tagName.toLowerCase()}${id}${className}`
}

const DATE_TIME_TOKEN_PATTERN = /\s*(HH:mm(?::ss)?|h{1,2}:mm(?::ss)?\s*[Aa])/
const TIME_WHEEL_STEP_DEDUP_WINDOW_MS = 90

const resolvedTimePickerStyle = computed<ResolvedTimePickerStyle>(() => props.timePickerStyle)
const isDateTimeEnabled = computed(() => resolvedTimePickerStyle.value !== 'none')
const isInlineTimePickerStyle = computed(() => {
  return resolvedTimePickerStyle.value === 'input' || resolvedTimePickerStyle.value === 'wheel-inline'
})
const isInputTimePickerStyle = computed(() => resolvedTimePickerStyle.value === 'input')
const isPageTimePickerStyle = computed(() => resolvedTimePickerStyle.value === 'wheel-page')
const isInlineRightPosition = computed(() => {
  return resolvedTimePickerStyle.value === 'wheel-inline' && props.timeInlinePosition === 'right'
})
const isPageAutoSwitchMode = computed(() => props.timePageMode === 'after-date')

const autoApplyEnabled = computed(() => props.autoApply && !isDateTimeEnabled.value)
const showApplyFooter = computed(() => !autoApplyEnabled.value)
const showMobileCancelFooter = computed(() => autoApplyEnabled.value)

const useLegacyNoTimeSelectorHeightClamp = computed(() => {
  return props.selectorMode
    && props.asSingle
    && !isDateTimeEnabled.value
    && !showApplyFooter.value
    && !showMobileCancelFooter.value
})
const formatterTimeTokens = computed(() => analyzeFormatterTimeTokens(props.formatter.date))
const datetimeModeConfig = computed<DateTimeModeConfig>(() => ({
  datetime: isDateTimeEnabled.value,
  formatterDate: props.formatter.date,
  uses12Hour: formatterTimeTokens.value.uses12Hour,
  usesSeconds: formatterTimeTokens.value.usesSeconds,
  defaultTimeNormalized: normalizeDefaultTimeInput(
    props.defaultTime,
    props.formatter.date,
  ),
  defaultEndTimeNormalized: normalizeDefaultTimeInput(
    props.defaultEndTime,
    props.formatter.date,
  ),
}))

function createDateTimeDraft(): DateTimeDraft {
  return {
    datePart: null,
    timeText: '',
    hour: null,
    minute: null,
    second: null,
    meridiem: null,
    isHydrated: false,
    isValid: true,
    errorCode: null,
  }
}

const datetimeDraftState = reactive<RangeDraftState>({
  start: createDateTimeDraft(),
  end: createDateTimeDraft(),
  activeEndpoint: 'start',
})
const hourWheelStepDirection = reactive<Record<DateTimeEndpointSelection, -1 | 0 | 1>>({
  start: 0,
  end: 0,
})
const lastMinuteWheelStepSignature = reactive<Record<DateTimeEndpointSelection, { key: string; semanticKey: string; at: number }>>({
  start: { key: '', semanticKey: '', at: 0 },
  end: { key: '', semanticKey: '', at: 0 },
})
const lastSecondWheelStepSignature = reactive<Record<DateTimeEndpointSelection, { key: string; semanticKey: string; at: number }>>({
  start: { key: '', semanticKey: '', at: 0 },
  end: { key: '', semanticKey: '', at: 0 },
})
const meridiemWheelSyncDirection = reactive<Record<DateTimeEndpointSelection, -1 | 0 | 1>>({
  start: 0,
  end: 0,
})
const datetimeApplyError = ref<DateTimeErrorEventPayload | null>(null)

const activeDateTimeEndpoint = computed<DateTimeEndpointSelection>(() => {
  if (!asRange())
    return 'start'
  return datetimeDraftState.activeEndpoint
})

const formatterTimeTokenErrorMessage = computed(() => {
  if (!datetimeModeConfig.value.datetime || formatterTimeTokens.value.isValid)
    return null
  return 'Datetime mode requires formatter.date to include supported time tokens (for example HH:mm or h:mm A).'
})

const dateTimeInputPlaceholder = computed(() => {
  return formatterTimeTokens.value.normalizedTimeFormat ?? 'HH:mm'
})

const dateTimeFormatDescription = computed(() => {
  if (!formatterTimeTokens.value.isValid)
    return 'Unsupported formatter'
  if (formatterTimeTokens.value.uses12Hour)
    return formatterTimeTokens.value.usesSeconds ? '12-hour (hh:mm:ss AM)' : '12-hour (hh:mm AM)'
  return formatterTimeTokens.value.usesSeconds ? '24-hour (HH:mm:ss)' : '24-hour (HH:mm)'
})

const timePickerPanelOpen = ref(isInlineTimePickerStyle.value)

const isTimePickerWheelStyle = computed(() => {
  return resolvedTimePickerStyle.value === 'wheel-inline'
    || resolvedTimePickerStyle.value === 'wheel-page'
})

const shouldShowDatePanels = computed(() => {
  if (!isDateTimeEnabled.value)
    return true
  if (isInlineTimePickerStyle.value)
    return true
  return !timePickerPanelOpen.value
})

const shouldShowDateTimeControls = computed(() => {
  if (!isDateTimeEnabled.value)
    return false

  if (isInlineTimePickerStyle.value)
    return true

  return timePickerPanelOpen.value
})

const showPageTimePanelInline = computed(() => {
  return isPageTimePickerStyle.value && timePickerPanelOpen.value
})

const showInlineTimePanelInline = computed(() => {
  return isInlineRightPosition.value && shouldShowDateTimeControls.value
})

const showAnyInlineTimePanel = computed(() => {
  return showPageTimePanelInline.value || showInlineTimePanelInline.value
})

const inlineRightHeightLockReady = ref(false)

const shouldUseFillTimePanelLayout = computed(() => {
  if (showInlineTimePanelInline.value)
    return inlineRightHeightLockReady.value

  if (!showPageTimePanelInline.value)
    return false

  // In dual wheel-page mode, defer "fill" layout until a valid panel lock is
  // measured; otherwise the initial open can expand the wheel content height.
  if (asRange() && !props.asSingle)
    return panelContentLockState.height > 0

  return true
})

const timePanelFillClass = computed(() => {
  if (!shouldUseFillTimePanelLayout.value)
    return ''
  return 'vtd-time-panel-fill sm:mt-0 sm:h-full'
})

const hasMountedPageTimePanel = ref(false)

const shouldRenderInlineTimePanels = computed(() => {
  if (showPageTimePanelInline.value || showInlineTimePanelInline.value)
    return true
  return isPageTimePickerStyle.value
    && showDualRangeTimePanels.value
    && hasMountedPageTimePanel.value
})

const showStackedDateTimeControls = computed(() => {
  return shouldShowDateTimeControls.value && !showAnyInlineTimePanel.value
})

const canToggleTimePanel = computed(() => {
  return isDateTimeEnabled.value && isPageTimePickerStyle.value
})

const shouldShowTimePanelSwitchButton = computed(() => {
  return canToggleTimePanel.value
})

const shouldShowHeaderTimePanelSwitchButton = computed(() => {
  return shouldShowTimePanelSwitchButton.value
    && !showApplyFooter.value
    && !showMobileCancelFooter.value
})

const timePanelSwitchLabel = computed(() => {
  return timePickerPanelOpen.value ? 'Calendar' : 'Time'
})

const timeWheelColumnCount = computed(() => {
  let count = 2
  if (formatterTimeTokens.value.usesSeconds)
    count += 1
  if (formatterTimeTokens.value.uses12Hour)
    count += 1
  return count
})

const timeWheelGridColumnClass = computed(() => {
  switch (timeWheelColumnCount.value) {
    case 2:
      return 'grid-cols-2 sm:grid-cols-2'
    case 3:
      return 'grid-cols-3 sm:grid-cols-3'
    default:
      return 'grid-cols-2 sm:grid-cols-4'
  }
})

const panelContentLockState = reactive({
  shellWidth: 0,
  width: 0,
  height: 0,
})

const shouldLockPanelContentSize = computed(() => {
  return isPageTimePickerStyle.value || isInlineRightPosition.value || isInputTimePickerStyle.value
})

const shouldFixPanelContentHeight = computed(() => {
  return shouldLockPanelContentSize.value && showAnyInlineTimePanel.value
})

const panelContentLockStyle = computed(() => {
  if (!shouldLockPanelContentSize.value)
    return undefined

  const style: Record<string, string> = {}
  if (panelContentLockState.width > 0) {
    const lockedWidth = `${panelContentLockState.width}px`
    style.minWidth = lockedWidth
    style.maxWidth = lockedWidth
  }
  if (panelContentLockState.height > 0) {
    style.minHeight = `${panelContentLockState.height}px`
    if (shouldFixPanelContentHeight.value) {
      style.height = `${panelContentLockState.height}px`
      style.maxHeight = `${panelContentLockState.height}px`
    }
  }
  return style
})

const datepickerShellLockStyle = computed(() => {
  if (!shouldLockPanelContentSize.value || panelContentLockState.shellWidth <= 0)
    return undefined

  const lockedWidth = `${panelContentLockState.shellWidth}px`
  return {
    minWidth: lockedWidth,
    width: lockedWidth,
    maxWidth: lockedWidth,
  }
})

function resetPanelContentLockState() {
  panelMeasureJobToken += 1
  panelContentLockState.shellWidth = 0
  panelContentLockState.width = 0
  panelContentLockState.height = 0
  inlineRightHeightLockReady.value = false
}

function measureAndLockPanelContentSize() {
  const measurementStartAt = performance.now()
  if (!shouldLockPanelContentSize.value)
    return
  if (!shouldShowDatePanels.value)
    return

  const panelElement = VtdPanelContentRef.value
  if (!panelElement)
    return

  const rect = panelElement.getBoundingClientRect()
  if (!rect.width || !rect.height)
    return

  if (panelContentLockState.shellWidth <= 0) {
    const shellElement = panelElement.closest<HTMLElement>('.vtd-datepicker')
    const shellRect = shellElement?.getBoundingClientRect()
    if (shellRect?.width)
      panelContentLockState.shellWidth = Math.ceil(shellRect.width)
  }

  panelContentLockState.width = Math.max(panelContentLockState.width, Math.ceil(rect.width))
  let measuredHeight = rect.height
  if (showInlineTimePanelInline.value) {
    const calendarPanels = Array.from(
      panelElement.querySelectorAll<HTMLElement>('[data-vtd-selector-panel="previous"], [data-vtd-selector-panel="next"]'),
    )
    const calendarHeight = calendarPanels.reduce((maxHeight, el) => {
      const panelHeight = el.getBoundingClientRect().height
      if (!panelHeight)
        return maxHeight
      return Math.max(maxHeight, panelHeight)
    }, 0)

    const panelContentStyle = getComputedStyle(panelElement)
    const panelPaddingTop = Number.parseFloat(panelContentStyle.paddingTop || '0') || 0
    const panelPaddingBottom = Number.parseFloat(panelContentStyle.paddingBottom || '0') || 0

    if (calendarHeight > 0)
      measuredHeight = calendarHeight + panelPaddingTop + panelPaddingBottom
  }

  panelContentLockState.height = Math.max(panelContentLockState.height, Math.ceil(measuredHeight))
  if (showInlineTimePanelInline.value && panelContentLockState.height > 0)
    inlineRightHeightLockReady.value = true

  const measurementDuration = performance.now() - measurementStartAt
  if (measurementDuration >= 4 || isDebugEnabled()) {
    pushDebugEvent('panel-measure', {
      durationMs: Number(measurementDuration.toFixed(2)),
      shellWidth: panelContentLockState.shellWidth,
      width: panelContentLockState.width,
      height: panelContentLockState.height,
      inlineRight: showInlineTimePanelInline.value,
      open: isPopoverOpen(),
    })
  }
}

function queuePanelContentMeasurement() {
  const token = ++panelMeasureJobToken
  pushDebugEvent('panel-measure-queued', { token, open: isPopoverOpen() })
  nextTick(() => {
    if (token !== panelMeasureJobToken)
      return
    requestAnimationFrame(() => {
      if (token !== panelMeasureJobToken)
        return
      measureAndLockPanelContentSize()
    })
  })
}

function refreshPanelContentLockState() {
  if (!shouldLockPanelContentSize.value) {
    resetPanelContentLockState()
    return
  }

  resetPanelContentLockState()
  queuePanelContentMeasurement()
}

const showDualRangeTimePanels = computed(() => {
  return asRange() && !props.asSingle
})

const collapseDualRangeInlineRightTimePanel = computed(() => {
  return showDualRangeTimePanels.value && showInlineTimePanelInline.value
})

const showSingleRangeInputDualEndpointsUi = computed(() => {
  return asRange()
    && props.asSingle
    && !isTimePickerWheelStyle.value
    && shouldShowDateTimeControls.value
})

const showDualRangeTimePanelsUi = computed(() => {
  return (
    (showDualRangeTimePanels.value && !collapseDualRangeInlineRightTimePanel.value)
    || showSingleRangeInputDualEndpointsUi.value
  )
})

const timePanelEndpointLayoutClass = computed(() => {
  const useCompactWheelLayout = isTimePickerWheelStyle.value && !shouldUseFillTimePanelLayout.value

  if (showDualRangeTimePanelsUi.value) {
    if (useCompactWheelLayout)
      return 'grid min-h-0 w-full gap-2 sm:grid-cols-2'
    return 'grid auto-rows-fr flex-1 min-h-0 w-full gap-2 sm:grid-cols-2'
  }

  if (isTimePickerWheelStyle.value) {
    if (useCompactWheelLayout)
      return 'flex min-h-0 w-full py-2 items-stretch justify-center'
    return 'flex flex-1 min-h-0 w-full py-2 items-stretch justify-center'
  }

  return 'flex flex-1 min-h-0 w-full items-stretch justify-center'
})

const timePanelEndpointLayoutStyle = computed(() => {
  if (!isTimePickerWheelStyle.value)
    return undefined

  const configuredHeight
    = isPageTimePickerStyle.value ? props.timeWheelPageHeight : props.timeWheelHeight
  if (!Number.isFinite(configuredHeight) || configuredHeight <= 0)
    return undefined

  const heightPx = `${configuredHeight}px`
  if (shouldUseFillTimePanelLayout.value)
    return { minHeight: heightPx }

  return {
    minHeight: heightPx,
    height: heightPx,
  }
})

const timePanelSingleEndpointTitle = computed(() => {
  if (!asRange())
    return 'Time'
  return activeDateTimeEndpoint.value === 'start' ? 'Start time' : 'End time'
})

const timePanelHeaderActionsClass = computed(() => {
  return [
    'ml-auto flex items-center justify-end gap-2',
    collapseDualRangeInlineRightTimePanel.value ? 'flex-nowrap min-w-0' : 'flex-wrap',
  ]
})

const timePanelHeaderRowClass = computed(() => {
  return [
    'flex items-center gap-2',
    showDualRangeTimePanelsUi.value || shouldCenterTimePanelEndpointToggle.value || shouldOverlayTimeFormatLabel.value
      ? 'relative'
      : 'justify-between',
  ]
})

const shouldCenterTimePanelEndpointToggle = computed(() => {
  return asRange()
    && !showDualRangeTimePanelsUi.value
    && showStackedDateTimeControls.value
    && !showInlineTimePanelInline.value
    && !!props.shortcuts
})

const shouldShowInlineTimePanelEndpointToggle = computed(() => {
  return asRange()
    && !showDualRangeTimePanelsUi.value
    && !shouldCenterTimePanelEndpointToggle.value
})

const shouldOverlayTimeFormatLabel = computed(() => {
  if (shouldShowHeaderTimePanelSwitchButton.value)
    return false
  if (showInlineTimePanelInline.value)
    return false
  return showDualRangeTimePanelsUi.value || shouldCenterTimePanelEndpointToggle.value
})

const shouldShowInlineTimeFormatLabel = computed(() => {
  return !shouldOverlayTimeFormatLabel.value
})

const timePanelCenteredToggleWrapperClass = 'pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center px-2'
const timePanelDualEndpointLabelsClass = computed(() => {
  return [
    'grid min-w-0 flex-1 grid-cols-2 gap-2',
  ]
})
const timePanelDualEndpointLabelTextClass = 'truncate pl-1 text-xs font-medium text-vtd-secondary-700 dark:text-vtd-secondary-200'

const timePanelEndpointToggleGroupClass = 'pointer-events-auto inline-flex shrink-0 items-center gap-1 rounded-md border border-black/[.1] p-0.5 dark:border-vtd-secondary-700/[1]'
const timePanelEndpointToggleButtonClass = 'rounded px-2 py-1 text-[11px] font-medium transition'
const timePanelHeaderSwitchButtonClass = 'rounded-md border border-vtd-secondary-300 px-2 py-1 text-[11px] font-medium text-vtd-secondary-700 transition hover:bg-vtd-secondary-100 dark:border-vtd-secondary-700 dark:text-vtd-secondary-200 dark:hover:bg-vtd-secondary-700'
const timePanelFormatLabelClass = 'text-[11px] whitespace-nowrap text-vtd-secondary-500 dark:text-vtd-secondary-400'

function timePanelEndpointToggleButtonStateClass(endpoint: DateTimeEndpointSelection) {
  return activeDateTimeEndpoint.value === endpoint
    ? 'bg-vtd-primary-600 text-white'
    : 'bg-white text-vtd-secondary-700 hover:bg-vtd-secondary-100 dark:bg-vtd-secondary-800 dark:text-vtd-secondary-200 dark:hover:bg-vtd-secondary-700'
}

const visibleTimeEndpoints = computed<DateTimeEndpointSelection[]>(() => {
  if (showDualRangeTimePanelsUi.value)
    return ['start', 'end']
  return [activeDateTimeEndpoint.value]
})

const shouldShowPanelLevelDateTimeError = computed(() => {
  const error = datetimeApplyError.value
  if (!error)
    return false
  if (!error.endpoint)
    return true
  if (showDualRangeTimePanelsUi.value)
    return false
  return error.endpoint !== activeDateTimeEndpoint.value
})

const panelLevelDateTimeErrorMessage = computed(() => {
  if (!shouldShowPanelLevelDateTimeError.value)
    return null
  return datetimeApplyError.value?.message ?? null
})

function getDateTimeDraftByEndpoint(endpoint: DateTimeEndpointSelection) {
  return endpoint === 'end' ? datetimeDraftState.end : datetimeDraftState.start
}

function getDateTimeInputValue(endpoint: DateTimeEndpointSelection) {
  return getDateTimeDraftByEndpoint(endpoint).timeText
}

function getDateTimeValidationMessage(endpoint: DateTimeEndpointSelection) {
  const targetDraft = getDateTimeDraftByEndpoint(endpoint)
  if (targetDraft.isValid || !targetDraft.errorCode)
    return null
  if (targetDraft.errorCode === 'range-end-before-start' && endpoint === 'end') {
    return resolveDateTimeErrorMessage(targetDraft.errorCode, {
      startDate: datetimeDraftState.start.datePart ?? applyValue.value[0] ?? null,
    })
  }
  return resolveDateTimeErrorMessage(targetDraft.errorCode)
}

function isDateTimeDraftReady(endpoint: DateTimeEndpointSelection) {
  const targetDraft = getDateTimeDraftByEndpoint(endpoint)
  return !!(targetDraft.datePart ?? getApplyValueByEndpoint(endpoint))
}

function getDateTimeWheelSourceDate(endpoint: DateTimeEndpointSelection) {
  const targetDraft = getDateTimeDraftByEndpoint(endpoint)
  return targetDraft.datePart ?? getApplyValueByEndpoint(endpoint)
}

const hourWheelOptions = computed<TimeWheelOption[]>(() => {
  if (formatterTimeTokens.value.uses12Hour) {
    return Array.from({ length: 12 }, (_, index) => {
      const hour = index + 1
      return {
        label: String(hour).padStart(2, '0'),
        value: hour,
      }
    })
  }

  return Array.from({ length: 24 }, (_, index) => ({
    label: String(index).padStart(2, '0'),
    value: index,
  }))
})

const minuteWheelOptions = computed<TimeWheelOption[]>(() => {
  return Array.from({ length: 60 }, (_, index) => ({
    label: String(index).padStart(2, '0'),
    value: index,
  }))
})

const secondWheelOptions = computed<TimeWheelOption[]>(() => {
  return Array.from({ length: 60 }, (_, index) => ({
    label: String(index).padStart(2, '0'),
    value: index,
  }))
})

const meridiemWheelOptions: TimeWheelOption[] = [
  {
    label: 'AM',
    value: 'AM',
  },
  {
    label: 'PM',
    value: 'PM',
  },
]

function getHourWheelValue(endpoint: DateTimeEndpointSelection) {
  const targetDraft = getDateTimeDraftByEndpoint(endpoint)
  const sourceDate = getDateTimeWheelSourceDate(endpoint)
  const hour = targetDraft.hour ?? sourceDate?.hour() ?? 0
  if (!formatterTimeTokens.value.uses12Hour)
    return hour
  const normalizedHour = hour % 12
  return normalizedHour === 0 ? 12 : normalizedHour
}

function getMinuteWheelValue(endpoint: DateTimeEndpointSelection) {
  const targetDraft = getDateTimeDraftByEndpoint(endpoint)
  const sourceDate = getDateTimeWheelSourceDate(endpoint)
  return targetDraft.minute ?? sourceDate?.minute() ?? 0
}

function getSecondWheelValue(endpoint: DateTimeEndpointSelection) {
  const targetDraft = getDateTimeDraftByEndpoint(endpoint)
  const sourceDate = getDateTimeWheelSourceDate(endpoint)
  return targetDraft.second ?? sourceDate?.second() ?? 0
}

function getMeridiemWheelValue(endpoint: DateTimeEndpointSelection) {
  const targetDraft = getDateTimeDraftByEndpoint(endpoint)
  if (targetDraft.meridiem)
    return targetDraft.meridiem
  const sourceDate = getDateTimeWheelSourceDate(endpoint)
  const hour = targetDraft.hour ?? sourceDate?.hour() ?? 0
  return hour >= 12 ? 'PM' : 'AM'
}

function getHourWheelFractionalOffset(endpoint: DateTimeEndpointSelection) {
  if (props.timeWheelScrollMode !== 'fractional')
    return 0
  const targetDraft = getDateTimeDraftByEndpoint(endpoint)
  const sourceDate = getDateTimeWheelSourceDate(endpoint)
  const minute = Math.min(Math.max(targetDraft.minute ?? sourceDate?.minute() ?? 0, 0), 59)
  // Center the interpolation inside each minute cell and avoid exact half-row offsets.
  return ((minute + 0.5) / 60) - 0.5
}

function getMinuteWheelFractionalOffset(endpoint: DateTimeEndpointSelection) {
  if (props.timeWheelScrollMode !== 'fractional' || !formatterTimeTokens.value.usesSeconds)
    return 0
  const targetDraft = getDateTimeDraftByEndpoint(endpoint)
  const sourceDate = getDateTimeWheelSourceDate(endpoint)
  const second = Math.min(Math.max(targetDraft.second ?? sourceDate?.second() ?? 0, 0), 59)
  // Center the interpolation inside each second cell and avoid exact half-row offsets.
  return ((second + 0.5) / 60) - 0.5
}

function getMeridiemWheelFractionalOffset(endpoint: DateTimeEndpointSelection) {
  if (props.timeWheelScrollMode !== 'fractional' || !formatterTimeTokens.value.uses12Hour)
    return 0
  const targetDraft = getDateTimeDraftByEndpoint(endpoint)
  const sourceDate = getDateTimeWheelSourceDate(endpoint)
  const hour = targetDraft.hour ?? sourceDate?.hour() ?? 0
  const minute = Math.min(Math.max(targetDraft.minute ?? sourceDate?.minute() ?? 0, 0), 59)
  // Same interpolation rule for AM/PM wheel to keep phase alignment with hour.
  const halfDayProgress = ((hour % 12) + ((minute + 0.5) / 60)) / 12
  return halfDayProgress - 0.5
}

function markActiveDateTimeEndpoint(endpoint: DateTimeEndpointSelection) {
  if (asRange())
    datetimeDraftState.activeEndpoint = endpoint
}

function normalizeDirection(value: number): -1 | 0 | 1 {
  if (!Number.isFinite(value) || value === 0)
    return 0
  return value > 0 ? 1 : -1
}

function getHourWheelStepDirection(endpoint: DateTimeEndpointSelection) {
  return hourWheelStepDirection[endpoint]
}

function setHourWheelStepDirection(endpoint: DateTimeEndpointSelection, direction: number) {
  const normalizedDirection = normalizeDirection(direction)
  if (normalizedDirection === 0)
    return

  hourWheelStepDirection[endpoint] = normalizedDirection
  const directionSnapshot = normalizedDirection
  nextTick(() => {
    if (hourWheelStepDirection[endpoint] === directionSnapshot)
      hourWheelStepDirection[endpoint] = 0
  })
}

function getMeridiemWheelSyncDirection(endpoint: DateTimeEndpointSelection) {
  return meridiemWheelSyncDirection[endpoint]
}

function setMeridiemWheelSyncDirection(endpoint: DateTimeEndpointSelection, direction: number) {
  const normalizedDirection = normalizeDirection(direction)
  if (normalizedDirection === 0)
    return

  meridiemWheelSyncDirection[endpoint] = normalizedDirection
  const directionSnapshot = normalizedDirection
  nextTick(() => {
    if (meridiemWheelSyncDirection[endpoint] === directionSnapshot)
      meridiemWheelSyncDirection[endpoint] = 0
  })
}

function getCircularHourDelta(baseHour24: number, nextHour24: number) {
  let delta = nextHour24 - baseHour24
  if (delta > 12)
    delta -= 24
  if (delta < -12)
    delta += 24
  return delta
}

function resolveNearest24HourFromHour12(
  hour12: number,
  baseHour24: number,
  directionHint = 0,
) {
  const targetHour12 = Math.min(Math.max(hour12, 1), 12)
  const candidates = [
    to24HourFrom12Hour(targetHour12, 'AM'),
    to24HourFrom12Hour(targetHour12, 'PM'),
  ]

  let bestHour24 = candidates[0]
  let bestDelta = getCircularHourDelta(baseHour24, bestHour24)
  for (const candidate of candidates.slice(1)) {
    const candidateDelta = getCircularHourDelta(baseHour24, candidate)
    const candidateDistance = Math.abs(candidateDelta)
    const bestDistance = Math.abs(bestDelta)
    if (candidateDistance < bestDistance) {
      bestHour24 = candidate
      bestDelta = candidateDelta
      continue
    }

    if (candidateDistance !== bestDistance)
      continue

    const normalizedHint = normalizeDirection(directionHint)
    if (normalizedHint !== 0) {
      const candidateMatchesHint = Math.sign(candidateDelta) === normalizedHint
      const bestMatchesHint = Math.sign(bestDelta) === normalizedHint
      if (candidateMatchesHint && !bestMatchesHint) {
        bestHour24 = candidate
        bestDelta = candidateDelta
      }
    }
  }

  return bestHour24
}

function extractDateOnlyFormatter(formatterDate: string) {
  const trimmedFormatter = formatterDate.trim()
  if (!trimmedFormatter)
    return null

  const formatWithoutEscapedLiterals = maskDayjsEscapedLiterals(trimmedFormatter)
  const match = DATE_TIME_TOKEN_PATTERN.exec(formatWithoutEscapedLiterals)
  if (!match)
    return trimmedFormatter

  let datePart = trimmedFormatter.slice(0, match.index)
  datePart = datePart.replace(/(?:\[(?:[Tt\s.,:;/_-]*)\]|[\sT.,:;/_-])+$/u, '').trimEnd()
  return datePart || null
}

function resolveHydrationTime(endpoint: DateTimeEndpointSelection) {
  if (!datetimeModeConfig.value.datetime)
    return null
  const timeTokens = formatterTimeTokens.value
  if (!timeTokens.isValid || !timeTokens.normalizedTimeFormat)
    return null

  const configuredTime = endpoint === 'end'
    ? datetimeModeConfig.value.defaultEndTimeNormalized
      ?? datetimeModeConfig.value.defaultTimeNormalized
    : datetimeModeConfig.value.defaultTimeNormalized

  if (configuredTime)
    return configuredTime

  const zeroTime = dayjs(
    timeTokens.usesSeconds ? '00:00:00' : '00:00',
    timeTokens.usesSeconds ? 'HH:mm:ss' : 'HH:mm',
    true,
  )

  if (!zeroTime.isValid())
    return null

  return zeroTime.format(timeTokens.normalizedTimeFormat)
}

function applyHydratedTimeToDate(
  dateValue: Dayjs,
  endpoint: DateTimeEndpointSelection,
): ResolvedModelDateValue {
  const timeTokens = formatterTimeTokens.value
  const hydrationTime = resolveHydrationTime(endpoint)
  if (!timeTokens.normalizedTimeFormat || !hydrationTime) {
    return {
      value: dateValue,
      isHydrated: false,
    }
  }

  const parsedTime = dayjs(hydrationTime, timeTokens.normalizedTimeFormat, true)
  if (!parsedTime.isValid()) {
    return {
      value: dateValue,
      isHydrated: false,
    }
  }

  return {
    value: dateValue
      .hour(parsedTime.hour())
      .minute(parsedTime.minute())
      .second(timeTokens.usesSeconds ? parsedTime.second() : 0)
      .millisecond(0),
    isHydrated: true,
  }
}

function resolveModelDateValue(
  rawValue: unknown,
  endpoint: DateTimeEndpointSelection,
): ResolvedModelDateValue {
  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return {
      value: null,
      isHydrated: false,
    }
  }

  if (rawValue instanceof Date || dayjs.isDayjs(rawValue)) {
    const parsedDate = dayjs(rawValue)
    return {
      value: parsedDate.isValid() ? parsedDate : null,
      isHydrated: false,
    }
  }

  if (typeof rawValue === 'string') {
    const trimmedValue = rawValue.trim()
    if (!trimmedValue) {
      return {
        value: null,
        isHydrated: false,
      }
    }

    const strictDateTime = dayjs(trimmedValue, props.formatter.date, true)
    if (strictDateTime.isValid()) {
      return {
        value: strictDateTime,
        isHydrated: false,
      }
    }

    if (datetimeModeConfig.value.datetime) {
      const dateOnlyFormatter = extractDateOnlyFormatter(props.formatter.date)
      if (dateOnlyFormatter) {
        const parsedDateOnly = dayjs(trimmedValue, dateOnlyFormatter, true)
        if (parsedDateOnly.isValid())
          return applyHydratedTimeToDate(parsedDateOnly, endpoint)
      }
    }

    return {
      value: null,
      isHydrated: false,
    }
  }

  const fallbackParsedDate = dayjs(rawValue as Date | number | string)
  return {
    value: fallbackParsedDate.isValid() ? fallbackParsedDate : null,
    isHydrated: false,
  }
}

function assignDateTimeDraft(
  endpoint: DateTimeEndpointSelection,
  dateValue: Dayjs | null,
  isHydrated = false,
) {
  const targetDraft
    = endpoint === 'start' ? datetimeDraftState.start : datetimeDraftState.end

  if (!dateValue || !dateValue.isValid()) {
    targetDraft.datePart = null
    targetDraft.timeText = ''
    targetDraft.hour = null
    targetDraft.minute = null
    targetDraft.second = null
    targetDraft.meridiem = null
    targetDraft.isHydrated = false
    targetDraft.isValid = true
    targetDraft.errorCode = null
    return
  }

  targetDraft.datePart = dateValue
  targetDraft.hour = dateValue.hour()
  targetDraft.minute = dateValue.minute()
  targetDraft.second = dateValue.second()
  targetDraft.meridiem = formatterTimeTokens.value.uses12Hour
    ? (dateValue.format('A') as 'AM' | 'PM')
    : null
  targetDraft.timeText = formatterTimeTokens.value.normalizedTimeFormat
    ? dateValue.format(formatterTimeTokens.value.normalizedTimeFormat)
    : ''
  targetDraft.isHydrated = isHydrated
  targetDraft.isValid = true
  targetDraft.errorCode = null
}

function syncDateTimeDraftsFromApplyValue() {
  if (!datetimeModeConfig.value.datetime)
    return

  const [startDate, endDate] = applyValue.value
  assignDateTimeDraft('start', startDate ?? null, datetimeDraftState.start.isHydrated)
  assignDateTimeDraft('end', endDate ?? null, datetimeDraftState.end.isHydrated)
}

function setDateTimeEndpoint(endpoint: DateTimeEndpointSelection) {
  if (!asRange())
    return
  if (datetimeDraftState.activeEndpoint === endpoint) {
    datetimeDraftState.activeEndpoint = endpoint === 'start' ? 'end' : 'start'
  }
  else {
    datetimeDraftState.activeEndpoint = endpoint
  }
}

function toggleTimePanel() {
  if (canToggleTimePanel.value || shouldShowTimePanelSwitchButton.value)
    timePickerPanelOpen.value = !timePickerPanelOpen.value
}

function openTimePanelAfterDateSelection() {
  if (!isDateTimeEnabled.value)
    return
  if (!isPageTimePickerStyle.value)
    return
  if (!isPageAutoSwitchMode.value)
    return

  const requiredSelectionCount = asRange() ? 2 : 1
  if (applyValue.value.length >= requiredSelectionCount) {
    if (asRange())
      datetimeDraftState.activeEndpoint = 'start'
    timePickerPanelOpen.value = true
  }
}

function reconcileRangeOrderErrorState() {
  if (!datetimeApplyError.value || datetimeApplyError.value.code !== 'range-end-before-start')
    return

  const [startRaw, endRaw] = applyValue.value
  const startDate = startRaw ? dayjs(startRaw) : null
  const endDate = endRaw ? dayjs(endRaw) : null
  const stillInvalidRange = !!(
    asRange()
    && startDate
    && endDate
    && startDate.isValid()
    && endDate.isValid()
    && endDate.isBefore(startDate)
  )

  if (stillInvalidRange) {
    datetimeApplyError.value = {
      ...datetimeApplyError.value,
      message: resolveDateTimeErrorMessage('range-end-before-start', { startDate }),
      field: 'range',
      endpoint: 'end',
      type: 'validation',
    }
    markDateTimeDraftInvalid('end', 'range-end-before-start')
    return
  }

  datetimeApplyError.value = null
  if (datetimeDraftState.end.errorCode === 'range-end-before-start') {
    datetimeDraftState.end.isValid = true
    datetimeDraftState.end.errorCode = null
  }
}

function normalize24Hour(hour: number) {
  return ((hour % 24) + 24) % 24
}

function to24HourFrom12Hour(hour12: number, meridiem: 'AM' | 'PM') {
  const normalizedHour12 = Math.min(Math.max(hour12, 1), 12)
  if (normalizedHour12 === 12)
    return meridiem === 'AM' ? 0 : 12
  return meridiem === 'PM' ? normalizedHour12 + 12 : normalizedHour12
}

function parseNumberValue(rawValue: number | string, fallback = 0) {
  const parsed = typeof rawValue === 'number' ? rawValue : Number.parseInt(rawValue, 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

function getApplyValueByEndpoint(endpoint: DateTimeEndpointSelection): Dayjs | null {
  if (endpoint === 'start')
    return applyValue.value[0] ?? null
  return applyValue.value[1] ?? null
}

function setApplyValueByEndpoint(endpoint: DateTimeEndpointSelection, dateValue: Dayjs) {
  const normalizedDate = dayjs(dateValue)
  if (!normalizedDate.isValid())
    return

  if (!asRange()) {
    applyValue.value = [normalizedDate]
    return
  }

  if (endpoint === 'start') {
    if (applyValue.value.length > 1)
      applyValue.value = [normalizedDate, applyValue.value[1]]
    else
      applyValue.value = [normalizedDate]
    return
  }

  if (applyValue.value.length > 1) {
    applyValue.value = [applyValue.value[0], normalizedDate]
    return
  }

  if (applyValue.value.length === 1) {
    applyValue.value = [applyValue.value[0], normalizedDate]
    return
  }

  return
}

function mergeDateWithDraftTime(dateValue: Dayjs, endpoint: DateTimeEndpointSelection) {
  const normalizedDate = dayjs(dateValue)
  if (!normalizedDate.isValid() || !datetimeModeConfig.value.datetime)
    return normalizedDate

  const targetDraft = endpoint === 'end' ? datetimeDraftState.end : datetimeDraftState.start
  const sourceDate = targetDraft.datePart ?? getApplyValueByEndpoint(endpoint)
  if (!sourceDate || !sourceDate.isValid())
    return normalizedDate

  return normalizedDate
    .hour(sourceDate.hour())
    .minute(sourceDate.minute())
    .second(formatterTimeTokens.value.usesSeconds ? sourceDate.second() : 0)
    .millisecond(0)
}

function applyDateTimePartsToDraft(
  endpoint: DateTimeEndpointSelection,
  options: {
    hour24?: number
    hour12?: number
    minute?: number
    second?: number
    meridiem?: 'AM' | 'PM'
  },
) {
  const targetDraft = endpoint === 'end' ? datetimeDraftState.end : datetimeDraftState.start
  const baseDate = targetDraft.datePart ?? getApplyValueByEndpoint(endpoint)
  if (!baseDate) {
    targetDraft.isValid = false
    targetDraft.errorCode = 'invalid-time-input'
    return
  }

  const currentHour = targetDraft.hour ?? baseDate.hour()
  const currentMinute = targetDraft.minute ?? baseDate.minute()
  const currentSecond = targetDraft.second ?? baseDate.second()
  const currentMeridiem = targetDraft.meridiem ?? (currentHour >= 12 ? 'PM' : 'AM')

  let nextHour = options.hour24 !== undefined ? normalize24Hour(options.hour24) : currentHour
  const nextMinute = options.minute !== undefined
    ? Math.min(Math.max(options.minute, 0), 59)
    : currentMinute
  const nextSecond = options.second !== undefined
    ? Math.min(Math.max(options.second, 0), 59)
    : currentSecond

  let nextMeridiem: 'AM' | 'PM' | null = null
  if (formatterTimeTokens.value.uses12Hour) {
    const resolvedMeridiem = options.meridiem ?? currentMeridiem
    const hour12 = options.hour12 !== undefined
      ? Math.min(Math.max(options.hour12, 1), 12)
      : (() => {
          const normalized = nextHour % 12
          return normalized === 0 ? 12 : normalized
        })()
    nextHour = to24HourFrom12Hour(hour12, resolvedMeridiem)
    nextMeridiem = resolvedMeridiem
  }

  const nextDate = dayjs(baseDate)
    .hour(nextHour)
    .minute(nextMinute)
    .second(formatterTimeTokens.value.usesSeconds ? nextSecond : 0)
    .millisecond(0)

  const localDateValidation = useValidateDayjsLocalDateTime(nextDate)
  if (!localDateValidation.isValid && localDateValidation.isDstNonexistent) {
    targetDraft.isValid = false
    targetDraft.errorCode = 'dst-nonexistent-time'
    return
  }

  const resolvedDate = localDateValidation.resolvedDate
    ? dayjs(localDateValidation.resolvedDate)
    : nextDate

  targetDraft.datePart = resolvedDate
  targetDraft.hour = resolvedDate.hour()
  targetDraft.minute = resolvedDate.minute()
  targetDraft.second = resolvedDate.second()
  targetDraft.meridiem = formatterTimeTokens.value.uses12Hour
    ? (nextMeridiem ?? (resolvedDate.format('A') as 'AM' | 'PM'))
    : null
  targetDraft.timeText = formatterTimeTokens.value.normalizedTimeFormat
    ? resolvedDate.format(formatterTimeTokens.value.normalizedTimeFormat)
    : ''
  targetDraft.isValid = true
  targetDraft.errorCode = null
  targetDraft.isHydrated = false

  setApplyValueByEndpoint(endpoint, resolvedDate)
  reconcileRangeOrderErrorState()
}

function onDateTimeHourWheelUpdate(
  value: number | string,
  endpoint: DateTimeEndpointSelection = activeDateTimeEndpoint.value,
) {
  markActiveDateTimeEndpoint(endpoint)
  const parsedHourValue = parseNumberValue(value, getHourWheelValue(endpoint))
  if (formatterTimeTokens.value.uses12Hour) {
    const hour12 = Math.min(Math.max(parsedHourValue, 1), 12)
    const sourceDate = getDateTimeWheelSourceDate(endpoint)
    const currentHour24 = getDateTimeDraftByEndpoint(endpoint).hour ?? sourceDate?.hour() ?? 0
    const directionHint = getHourWheelStepDirection(endpoint)
    const nextHour24 = resolveNearest24HourFromHour12(hour12, currentHour24, directionHint)
    const meridiem: 'AM' | 'PM' = nextHour24 >= 12 ? 'PM' : 'AM'
    const currentMeridiem = getMeridiemWheelValue(endpoint) as 'AM' | 'PM'
    if (currentMeridiem !== meridiem) {
      const meridiemDirection = directionHint !== 0
        ? directionHint
        : getCircularHourDelta(currentHour24, nextHour24)
      setMeridiemWheelSyncDirection(endpoint, meridiemDirection)
    }
    applyDateTimePartsToDraft(endpoint, {
      hour12,
      meridiem,
    })
    return
  }
  applyDateTimePartsToDraft(endpoint, {
    hour24: parsedHourValue,
  })
}

function onDateTimeHourWheelStep(
  payload: TimeWheelStepPayload,
  endpoint: DateTimeEndpointSelection = activeDateTimeEndpoint.value,
) {
  if (payload.previousValue !== null) {
    const currentHourValue = getHourWheelValue(endpoint)
    const expectedPreviousHour = parseNumberValue(payload.previousValue, Number(currentHourValue))
    if (Number(currentHourValue) !== expectedPreviousHour)
      return
  }
  markActiveDateTimeEndpoint(endpoint)
  setHourWheelStepDirection(endpoint, payload.delta)
}

function onDateTimeMinuteWheelUpdate(
  value: number | string,
  endpoint: DateTimeEndpointSelection = activeDateTimeEndpoint.value,
) {
  markActiveDateTimeEndpoint(endpoint)
  applyDateTimePartsToDraft(endpoint, {
    minute: parseNumberValue(value, getMinuteWheelValue(endpoint)),
  })
}

function resolveTimeWheelStepDelta(payload: TimeWheelStepPayload) {
  if (!Number.isFinite(payload.delta))
    return 0
  return Math.trunc(payload.delta)
}

function normalizeWheelCycleValue(
  rawValue: number | string | null,
  fallbackValue: number,
  cycleSize: number,
) {
  const parsed = parseNumberValue(rawValue ?? fallbackValue, fallbackValue)
  const normalized = ((parsed % cycleSize) + cycleSize) % cycleSize
  return Math.min(Math.max(normalized, 0), cycleSize - 1)
}

function resolveCyclicWheelStepDelta(
  payload: TimeWheelStepPayload,
  cycleSize: number,
  fallbackPreviousValue: number,
) {
  const rawDelta = resolveTimeWheelStepDelta(payload)
  if (rawDelta === 0)
    return 0

  const direction = rawDelta > 0 ? 1 : -1
  const previousValue = normalizeWheelCycleValue(payload.previousValue, fallbackPreviousValue, cycleSize)
  const nextValue = normalizeWheelCycleValue(payload.value, previousValue, cycleSize)

  // For boundary carries we prefer semantic 00<->(cycle-1) transitions over
  // raw absolute-index deltas, which can be noisy around virtual-window rebase.
  if (previousValue === cycleSize - 1 && nextValue === 0)
    return 1
  if (previousValue === 0 && nextValue === cycleSize - 1)
    return -1

  let semanticDelta = nextValue - previousValue
  if (direction > 0 && semanticDelta < 0)
    semanticDelta += cycleSize
  else if (direction < 0 && semanticDelta > 0)
    semanticDelta -= cycleSize

  if (semanticDelta === 0)
    return direction * cycleSize

  return semanticDelta
}

function isDuplicateWheelStep(
  endpoint: DateTimeEndpointSelection,
  payload: TimeWheelStepPayload,
  cache: Record<DateTimeEndpointSelection, { key: string; semanticKey: string; at: number }>,
) {
  const key = `${payload.previousAbsoluteIndex}:${payload.absoluteIndex}:${String(payload.value)}`
  const semanticKey = `${String(payload.previousValue)}:${String(payload.value)}`
  const now = Date.now()
  const previous = cache[endpoint]
  if (now - previous.at <= TIME_WHEEL_STEP_DEDUP_WINDOW_MS) {
    if (previous.key === key)
      return true
    if (previous.semanticKey === semanticKey)
      return true
  }

  cache[endpoint] = { key, semanticKey, at: now }
  return false
}

function applyDateTimeHourCarry(
  endpoint: DateTimeEndpointSelection,
  hourCarry: number,
  minute?: number,
) {
  if (hourCarry === 0 && minute === undefined)
    return

  if (hourCarry === 0) {
    applyDateTimePartsToDraft(endpoint, { minute })
    return
  }

  const currentHour = getDateTimeDraftByEndpoint(endpoint).hour ?? getDateTimeWheelSourceDate(endpoint)?.hour() ?? 0
  const nextHour24 = normalize24Hour(currentHour + hourCarry)

  if (formatterTimeTokens.value.uses12Hour) {
    const currentMeridiem = getMeridiemWheelValue(endpoint) as 'AM' | 'PM'
    const normalizedHour12 = nextHour24 % 12
    const hour12 = normalizedHour12 === 0 ? 12 : normalizedHour12
    const meridiem: 'AM' | 'PM' = nextHour24 >= 12 ? 'PM' : 'AM'
    if (currentMeridiem !== meridiem)
      setMeridiemWheelSyncDirection(endpoint, hourCarry)
    const payload: { hour12: number; meridiem: 'AM' | 'PM'; minute?: number } = { hour12, meridiem }
    if (minute !== undefined)
      payload.minute = minute
    applyDateTimePartsToDraft(endpoint, payload)
    return
  }

  const payload: { hour24: number; minute?: number } = { hour24: nextHour24 }
  if (minute !== undefined)
    payload.minute = minute
  applyDateTimePartsToDraft(endpoint, payload)
}

function onDateTimeMinuteWheelStep(
  payload: TimeWheelStepPayload,
  endpoint: DateTimeEndpointSelection = activeDateTimeEndpoint.value,
) {
  if (isDuplicateWheelStep(endpoint, payload, lastMinuteWheelStepSignature))
    return

  if (payload.previousValue === null)
    return

  // TODO(time-inline-day-boundary): evaluate optional day-boundary carry for
  // wheel-inline mode so hour/day updates can stay synchronized with calendar
  // dates when the hour wheel crosses midnight.
  const MINUTES_PER_HOUR = 60
  const currentMinute = Math.min(Math.max(getMinuteWheelValue(endpoint), 0), 59)
  let expectedPreviousMinute = currentMinute
  if (payload.previousValue !== null) {
    expectedPreviousMinute = Math.min(
      Math.max(parseNumberValue(payload.previousValue, currentMinute), 0),
      59,
    )
    if (expectedPreviousMinute !== currentMinute)
      return
  }
  const minuteDelta = resolveCyclicWheelStepDelta(payload, MINUTES_PER_HOUR, expectedPreviousMinute)
  if (minuteDelta === 0)
    return
  const hourCarry = Math.floor((expectedPreviousMinute + minuteDelta) / MINUTES_PER_HOUR)
  if (hourCarry === 0)
    return

  markActiveDateTimeEndpoint(endpoint)
  applyDateTimeHourCarry(endpoint, hourCarry)
}

function onDateTimeSecondWheelStep(
  payload: TimeWheelStepPayload,
  endpoint: DateTimeEndpointSelection = activeDateTimeEndpoint.value,
) {
  if (isDuplicateWheelStep(endpoint, payload, lastSecondWheelStepSignature))
    return

  if (payload.previousValue === null)
    return

  const SECONDS_PER_MINUTE = 60
  const currentSecond = Math.min(Math.max(getSecondWheelValue(endpoint), 0), 59)
  let expectedPreviousSecond = currentSecond
  if (payload.previousValue !== null) {
    expectedPreviousSecond = Math.min(
      Math.max(parseNumberValue(payload.previousValue, currentSecond), 0),
      59,
    )
    if (expectedPreviousSecond !== currentSecond)
      return
  }
  const secondDelta = resolveCyclicWheelStepDelta(payload, SECONDS_PER_MINUTE, expectedPreviousSecond)
  if (secondDelta === 0)
    return
  const minuteCarry = Math.floor((expectedPreviousSecond + secondDelta) / SECONDS_PER_MINUTE)
  if (minuteCarry === 0)
    return

  markActiveDateTimeEndpoint(endpoint)
  const currentMinute = Math.min(Math.max(getMinuteWheelValue(endpoint), 0), 59)
  const nextMinuteRaw = currentMinute + minuteCarry
  const MINUTES_PER_HOUR = 60
  const hourCarry = Math.floor(nextMinuteRaw / MINUTES_PER_HOUR)
  const nextMinute = ((nextMinuteRaw % MINUTES_PER_HOUR) + MINUTES_PER_HOUR) % MINUTES_PER_HOUR

  applyDateTimeHourCarry(endpoint, hourCarry, nextMinute)
}

function onDateTimeSecondWheelUpdate(
  value: number | string,
  endpoint: DateTimeEndpointSelection = activeDateTimeEndpoint.value,
) {
  markActiveDateTimeEndpoint(endpoint)
  applyDateTimePartsToDraft(endpoint, {
    second: parseNumberValue(value, getSecondWheelValue(endpoint)),
  })
}

function onDateTimeMeridiemWheelUpdate(
  value: number | string,
  endpoint: DateTimeEndpointSelection = activeDateTimeEndpoint.value,
) {
  markActiveDateTimeEndpoint(endpoint)
  const meridiem = value === 'PM' ? 'PM' : 'AM'
  applyDateTimePartsToDraft(endpoint, { meridiem })
}

function onDateTimeInput(
  event: Event,
  endpoint: DateTimeEndpointSelection = activeDateTimeEndpoint.value,
) {
  const inputElement = event.target as HTMLInputElement | null
  const inputValue = inputElement?.value ?? ''
  markActiveDateTimeEndpoint(endpoint)
  const targetDraft = endpoint === 'end' ? datetimeDraftState.end : datetimeDraftState.start

  targetDraft.timeText = inputValue

  if (!formatterTimeTokens.value.isValid || !formatterTimeTokens.value.normalizedTimeFormat) {
    targetDraft.isValid = false
    targetDraft.errorCode = 'config-missing-time-token'
    return
  }

  const trimmedInput = inputValue.trim()
  if (!trimmedInput) {
    targetDraft.isValid = false
    targetDraft.errorCode = 'invalid-time-input'
    return
  }

  const parsedTime = dayjs(trimmedInput, formatterTimeTokens.value.normalizedTimeFormat, true)
  if (!parsedTime.isValid()) {
    targetDraft.isValid = false
    targetDraft.errorCode = 'invalid-time-input'
    return
  }

  const baseDate = targetDraft.datePart ?? getApplyValueByEndpoint(endpoint)
  if (!baseDate) {
    targetDraft.isValid = false
    targetDraft.errorCode = 'invalid-time-input'
    return
  }

  applyDateTimePartsToDraft(endpoint, {
    hour24: parsedTime.hour(),
    minute: parsedTime.minute(),
    second: parsedTime.second(),
    meridiem: (parsedTime.format('A') as 'AM' | 'PM'),
  })
}

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

function getModernShortcutLabel(id: 'today' | 'three-business-days' | 'next-week' | 'next-month') {
  switch (id) {
    case 'today':
      return props.options.shortcuts.today
    case 'three-business-days':
      return props.options.shortcuts.businessDays?.(3) ?? '3 business days'
    case 'next-week':
      return props.options.shortcuts.nextWeek ?? 'Next week'
    case 'next-month':
      return props.options.shortcuts.nextMonth ?? 'Next month'
  }
}

const builtInShortcutItems = computed(() => {
  if (props.shortcutPreset === 'modern') {
    return [
      { id: 'today' as const, label: getModernShortcutLabel('today') },
      { id: 'three-business-days' as const, label: getModernShortcutLabel('three-business-days') },
      { id: 'next-week' as const, label: getModernShortcutLabel('next-week') },
      { id: 'next-month' as const, label: getModernShortcutLabel('next-month') },
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
type SelectionContext = 'single' | 'singleRangeDisplayed' | 'previousPanel' | 'nextPanel'
type SelectorMonthPayload = number | { month: number, year: number }
type CommitBoundaryEvent = 'enterInPlace' | 'apply' | 'closeWithPersist' | 'escape' | 'cancel' | 'backdropDismiss' | 'blur'

interface SelectorState {
  selectedMonth: number
  selectedYear: number
  anchorYear: number
}

interface RangeNormalizationState {
  hasTemporaryInversion: boolean
  normalizationBoundaryPending: boolean
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

interface CommitTypedYearOptions {
  emitModelUpdate?: boolean
  allowTemporaryInversion?: boolean
  syncSelectorStateAfterCommit?: boolean
}

const SELECTOR_YEAR_WINDOW_SIZE = 401
const SELECTOR_YEAR_WINDOW_RADIUS = Math.floor(SELECTOR_YEAR_WINDOW_SIZE / 2)
const SELECTOR_YEAR_REANCHOR_THRESHOLD = 24

const pickerViewMode = ref<PickerViewMode>('calendar')
const selectorFocus = ref<SelectorFocus>('month')
const suppressSelectorColumnFocus = ref(false)
const selectionContext = ref<SelectionContext>('single')
const selectorState = reactive<SelectorState>({
  selectedMonth: datepicker.value.previous.month(),
  selectedYear: datepicker.value.previous.year(),
  anchorYear: datepicker.value.previous.year(),
})
const rangeNormalizationState = reactive<RangeNormalizationState>({
  hasTemporaryInversion: false,
  normalizationBoundaryPending: false,
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

function parseModelDateCandidate(value: unknown) {
  return parseModelDateWithDirectYear(value, props.formatter.date)
}

function resolveModelRangeDates() {
  let startDate: Dayjs | null = null
  let endDate: Dayjs | null = null

  if (Array.isArray(props.modelValue)) {
    const [start, end] = props.modelValue
    startDate = parseModelDateCandidate(start)
    endDate = parseModelDateCandidate(end)
  }
  else if (typeof props.modelValue === 'object') {
    if (props.modelValue) {
      const [start, end] = Object.values(props.modelValue)
      startDate = parseModelDateCandidate(start)
      endDate = parseModelDateCandidate(end)
    }
  }
  else if (typeof props.modelValue === 'string' && props.modelValue.length > 0) {
    const [start, end] = props.modelValue.split(props.separator)
    startDate = parseModelDateCandidate(start)
    endDate = parseModelDateCandidate(end)
  }

  return { startDate, endDate }
}

function resolveModelValueKeys() {
  if (typeof props.modelValue !== 'object' || !props.modelValue) {
    return {
      startKey: 'startDate',
      endKey: 'endDate',
    }
  }

  const [startKey = 'startDate', endKey = 'endDate'] = Object.keys(props.modelValue)
  return { startKey, endKey }
}

function emitRangeModelValueFromFormatted(
  startValue: string,
  endValue: string,
  stringValue: string = `${startValue}${props.separator}${endValue}`,
) {
  if (Array.isArray(props.modelValue)) {
    emit('update:modelValue', [startValue, endValue])
    return
  }

  if (typeof props.modelValue === 'object') {
    const payload: Record<string, string> = {}
    const { startKey, endKey } = resolveModelValueKeys()
    payload[startKey] = startValue
    payload[endKey] = endValue
    emit('update:modelValue', payload)
    return
  }

  emit('update:modelValue', stringValue)
}

function emitSingleModelValueFromFormatted(
  value: string,
  stringValue: string = value,
) {
  if (Array.isArray(props.modelValue)) {
    emit('update:modelValue', [value])
    return
  }

  if (typeof props.modelValue === 'object') {
    const payload: Record<string, string> = {}
    const { startKey } = resolveModelValueKeys()
    payload[startKey] = value
    emit('update:modelValue', payload)
    return
  }

  emit('update:modelValue', stringValue)
}

function emitEmptyModelValue() {
  if (Array.isArray(props.modelValue)) {
    emit('update:modelValue', [])
    return
  }

  if (typeof props.modelValue === 'object') {
    const payload: Record<string, string> = {}
    const { startKey, endKey } = resolveModelValueKeys()
    payload[startKey] = ''
    payload[endKey] = ''
    emit('update:modelValue', payload)
    return
  }

  emit('update:modelValue', '')
}

function emitRangeModelValue(startDate: Dayjs, endDate: Dayjs) {
  const formattedStart = formatModelDateWithDirectYear(startDate, props.formatter.date)
  const formattedEnd = formatModelDateWithDirectYear(endDate, props.formatter.date)
  emitRangeModelValueFromFormatted(formattedStart, formattedEnd)
}

function emitSingleModelValue(value: Dayjs) {
  const formattedValue = formatModelDateWithDirectYear(value, props.formatter.date)
  emitSingleModelValueFromFormatted(formattedValue)
}

interface SelectionRangeValue {
  start: Dayjs | null
  end: Dayjs | null
}

type SelectionRangeSource = 'model' | 'apply' | 'hover' | 'interactive'

function resolveModelSelectionRange(): SelectionRangeValue {
  const { startDate, endDate } = resolveModelRangeDates()
  return {
    start: startDate,
    end: endDate,
  }
}

function resolveApplySelectionRange(): SelectionRangeValue {
  const [start, end] = applyValue.value
  return {
    start: parseModelDateCandidate(start),
    end: parseModelDateCandidate(end),
  }
}

function resolveHoverSelectionRange(): SelectionRangeValue {
  if (hoverValue.value.length < 2) {
    return {
      start: null,
      end: null,
    }
  }

  const [start, end] = hoverValue.value
  return {
    start: parseModelDateCandidate(start),
    end: parseModelDateCandidate(end),
  }
}

function resolveSelectionRange(source: SelectionRangeSource): SelectionRangeValue {
  switch (source) {
    case 'model':
      return resolveModelSelectionRange()
    case 'apply':
      return resolveApplySelectionRange()
    case 'hover':
      return resolveHoverSelectionRange()
    case 'interactive':
      return autoApplyEnabled.value
        ? resolveModelSelectionRange()
        : resolveApplySelectionRange()
    default:
      return {
        start: null,
        end: null,
      }
  }
}

function emitActiveContextModelValueForTypedYear(context: SelectionContext) {
  if (!asRange()) {
    emitSingleModelValue(resolveContextDate(context))
    return
  }

  const isNextPanel = context === 'nextPanel'
  const { startDate, endDate } = resolveModelRangeDates()
  const startFromApply = applyValue.value[0] ?? null
  const endFromApply = applyValue.value[1] ?? null
  const nextStart = isNextPanel
    ? (startFromApply ?? startDate ?? datepicker.value.previous)
    : (datetimeModeConfig.value.datetime
        ? mergeDateWithDraftTime(datepicker.value.previous, 'start')
        : datepicker.value.previous)
  const nextEnd = isNextPanel
    ? (datetimeModeConfig.value.datetime
        ? mergeDateWithDraftTime(datepicker.value.next, 'end')
        : datepicker.value.next)
    : (endFromApply ?? endDate ?? datepicker.value.next)

  emitRangeModelValue(nextStart, nextEnd)
}

function trackTemporaryRangeInversion() {
  if (!asRange()) {
    rangeNormalizationState.hasTemporaryInversion = false
    rangeNormalizationState.normalizationBoundaryPending = false
    return
  }

  rangeNormalizationState.hasTemporaryInversion
    = datepicker.value.previous.isAfter(datepicker.value.next, 'date')
}

function shouldNormalizeRangeAtCommitBoundary(boundary: CommitBoundaryEvent) {
  if (!asRange())
    return false
  if (boundary !== 'apply' && boundary !== 'closeWithPersist')
    return false
  return rangeNormalizationState.hasTemporaryInversion
}

function normalizeRangeAtCommitBoundary(boundary: CommitBoundaryEvent) {
  rangeNormalizationState.normalizationBoundaryPending
    = shouldNormalizeRangeAtCommitBoundary(boundary)
  if (!rangeNormalizationState.normalizationBoundaryPending)
    return false

  const previousDate = datepicker.value.previous
  datepicker.value.previous = datepicker.value.next
  datepicker.value.next = previousDate
  syncDatepickerYears()
  rangeNormalizationState.hasTemporaryInversion = false
  rangeNormalizationState.normalizationBoundaryPending = false
  return true
}

function normalizeRangeAtBoundaryAndPersist(boundary: CommitBoundaryEvent) {
  const normalized = normalizeRangeAtCommitBoundary(boundary)
  if (!normalized)
    return false

  emitRangeModelValue(datepicker.value.previous, datepicker.value.next)
  if (!props.autoApply)
    applyValue.value = [datepicker.value.previous, datepicker.value.next]

  if (props.selectorMode && pickerViewMode.value === 'selector')
    syncSelectorState(selectionContext.value, { syncAnchor: false })

  return true
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

function triggerPopoverButtonClick() {
  const refValue = VtdPopoverButtonRef.value as HTMLElement | { $el?: unknown } | null
  if (refValue instanceof HTMLElement) {
    refValue.click()
    return
  }
  if (refValue?.$el instanceof HTMLElement)
    refValue.$el.click()
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

function commitTypedYearToActiveContext(
  context: SelectionContext,
  year: number,
  options: CommitTypedYearOptions = {},
) {
  const {
    emitModelUpdate = true,
    allowTemporaryInversion = true,
    syncSelectorStateAfterCommit = true,
  } = options

  if (context === 'nextPanel') {
    datepicker.value.next = datepicker.value.next.year(year)
    emit('selectRightYear', datepicker.value.next)
  }
  else {
    datepicker.value.previous = datepicker.value.previous.year(year)
    emit('selectYear', datepicker.value.previous)
  }

  if (!allowTemporaryInversion)
    syncSelectorRangeOrder(context)

  syncDatepickerYears()
  trackTemporaryRangeInversion()

  if (!props.autoApply) {
    if (asRange()) {
      if (datetimeModeConfig.value.datetime) {
        const nextStart = mergeDateWithDraftTime(datepicker.value.previous, 'start')
        const nextEnd = mergeDateWithDraftTime(datepicker.value.next, 'end')
        applyValue.value = [nextStart, nextEnd]
      }
      else {
        applyValue.value = [datepicker.value.previous, datepicker.value.next]
      }
    }
    else if (datetimeModeConfig.value.datetime) {
      applyValue.value = [mergeDateWithDraftTime(resolveContextDate(context), 'start')]
    }
    else {
      applyValue.value = [resolveContextDate(context)]
    }
  }

  if (syncSelectorStateAfterCommit)
    syncSelectorState(context, { syncAnchor: false })

  if (emitModelUpdate)
    emitActiveContextModelValueForTypedYear(context)
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
  commitTypedYearToActiveContext(context, year, {
    emitModelUpdate: false,
    allowTemporaryInversion: false,
    syncSelectorStateAfterCommit: false,
  })
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
  const isFocusActive = !suppressSelectorColumnFocus.value && selectorFocus.value === focus
  if (!props.selectorFocusTint) {
    return isFocusActive
      ? 'border-vtd-primary-300 dark:border-vtd-primary-500'
      : 'border-black/[.08] dark:border-vtd-secondary-700/[1]'
  }

  return isFocusActive
    ? 'border-vtd-primary-300 bg-vtd-primary-50/40 ring-2 ring-vtd-primary-400/35 ring-offset-1 ring-offset-transparent dark:border-vtd-primary-500 dark:bg-vtd-secondary-700/50 dark:ring-vtd-primary-500/35'
    : 'border-black/[.08] dark:border-vtd-secondary-700/[1]'
}

function clearSelectorColumnFocusSuppression() {
  suppressSelectorColumnFocus.value = false
}

function onTimeWheelInteraction(event: Event) {
  if (!props.selectorMode || pickerViewMode.value !== 'selector')
    return

  const target = event.target
  if (!(target instanceof HTMLElement))
    return

  if (!target.closest('.vtd-time-wheel'))
    return

  suppressSelectorColumnFocus.value = true
}

function onSelectorColumnFocus(panelName: SelectionPanel, focus: SelectorFocus) {
  if (!props.selectorMode)
    return
  selectionContext.value = resolveSelectionContext(panelName)
  selectorFocus.value = focus
  clearSelectorColumnFocusSuppression()
}

function requestSelectorColumnFocus(panelName: SelectionPanel, focus: SelectorFocus) {
  if (!props.selectorMode)
    return

  const context = resolveSelectionContext(panelName)
  selectionContext.value = context
  selectorFocus.value = focus
  clearSelectorColumnFocusSuppression()
  nextTick(() => {
    focusSelectorModeTargetDeferred(context, focus)
  })
}

function enterSelectorMode(payload: HeaderInteractionPayload) {
  if (!props.selectorMode)
    return
  const { panel, focus } = payload

  selectorFocus.value = focus
  clearSelectorColumnFocusSuppression()
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
  clearSelectorColumnFocusSuppression()
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

function onPopoverButtonClick(open: boolean, event?: MouseEvent) {
  pushDebugEvent('trigger-click', {
    open,
    target: event?.target instanceof HTMLElement ? event.target.tagName.toLowerCase() : 'unknown',
    activeElement: describeActiveElement(),
  })

  if (open && event && isTextInputLikeTarget(event.target)) {
    event.stopPropagation()
    pushDebugEvent('trigger-click-ignored-while-open')
    return
  }

  if (open) {
    normalizeRangeAtBoundaryAndPersist('closeWithPersist')
  }
  resetPickerViewMode()
}

function onPopoverButtonCaptureClick(open: boolean, event: MouseEvent) {
  if (!open)
    return
  if (!isTextInputLikeTarget(event.target))
    return

  event.preventDefault()
  event.stopPropagation()
  event.stopImmediatePropagation()
  pushDebugEvent('trigger-click-capture-blocked', {
    target: event.target instanceof HTMLElement ? event.target.tagName.toLowerCase() : 'unknown',
    activeElement: describeActiveElement(),
  })
}

function onInputMouseDown(open: boolean, event: MouseEvent) {
  stopInputEventWhenOpen(open, event)
}

function onInputClick(open: boolean, event: MouseEvent) {
  stopInputEventWhenOpen(open, event)
}

function stopInputEventWhenOpen(open: boolean, event: MouseEvent) {
  if (!open)
    return
  event.stopPropagation()
}

function isVisibleElement(element: HTMLElement) {
  return element.getClientRects().length > 0
}

function getElementLabelText(element: HTMLElement) {
  return (element.textContent ?? '').replace(/\s+/g, ' ').trim()
}

function isDisabledFocusTarget(element: HTMLElement) {
  if (element.getAttribute('aria-disabled') === 'true')
    return true

  if (
    element instanceof HTMLButtonElement
    || element instanceof HTMLInputElement
    || element instanceof HTMLSelectElement
    || element instanceof HTMLTextAreaElement
  ) {
    return !!element.disabled
  }

  return false
}

interface FooterActionFocusTargets {
  cancelButton: HTMLButtonElement | null
  switchButton: HTMLButtonElement | null
  applyButton: HTMLButtonElement | null
}

function resolveFooterActionFocusTargets(queryRoot: HTMLElement): FooterActionFocusTargets {
  const footerButtons = Array.from(queryRoot.querySelectorAll<HTMLButtonElement>('.away-cancel-picker, .away-apply-picker'))
    .filter(button => isVisibleElement(button) && !isDisabledFocusTarget(button))

  const cancelButton = footerButtons.find((button) => {
    return button.classList.contains('away-cancel-picker')
      && getElementLabelText(button) !== timePanelSwitchLabel.value
  }) ?? null

  const switchButton = footerButtons.find((button) => {
    return button.classList.contains('away-cancel-picker')
      && getElementLabelText(button) === timePanelSwitchLabel.value
  }) ?? null

  const applyButton = footerButtons.find(button => button.classList.contains('away-apply-picker')) ?? null

  return {
    cancelButton,
    switchButton,
    applyButton,
  }
}

interface FocusTargetCollectorOptions {
  skipDisabled?: boolean
}

type FocusTargetPusher = (element: HTMLElement | null) => void

function createFocusTargetCollector(options: FocusTargetCollectorOptions = {}) {
  const targets: HTMLElement[] = []
  const pushTarget: FocusTargetPusher = (element) => {
    if (!element || !isVisibleElement(element))
      return
    if (options.skipDisabled && isDisabledFocusTarget(element))
      return
    if (targets.includes(element))
      return
    targets.push(element)
  }

  return {
    targets,
    pushTarget,
  }
}

function appendCalendarPanelFocusTarget(
  queryRoot: HTMLElement,
  panel: SelectionPanel,
  pushTarget: FocusTargetPusher,
) {
  const panelElement = queryRoot.querySelector<HTMLElement>(`[data-vtd-selector-panel="${panel}"]`)
  if (!panelElement)
    return
  const focusTarget
    = panelElement.querySelector<HTMLElement>('.vtd-calendar-focus-target')
      ?? panelElement.querySelector<HTMLElement>('.vtd-datepicker-date:not(:disabled)')
  pushTarget(focusTarget)
}

function appendFooterActionFocusTargets(
  footerActions: FooterActionFocusTargets,
  pushTarget: FocusTargetPusher,
) {
  pushTarget(footerActions.cancelButton)
  pushTarget(footerActions.switchButton)
  pushTarget(footerActions.applyButton)
}

function getSelectorFocusCycleTargets() {
  const queryRoot = getPickerQueryRoot()
  if (!queryRoot)
    return []

  const { targets, pushTarget } = createFocusTargetCollector()

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
  const footerActions = resolveFooterActionFocusTargets(queryRoot)
  appendFooterActionFocusTargets(footerActions, pushTarget)
  return targets
}

function getCalendarFocusCycleTargets() {
  const queryRoot = getPickerQueryRoot()
  if (!queryRoot)
    return []

  const { targets, pushTarget } = createFocusTargetCollector()

  const isDoublePanel = asRange() && !props.asSingle
  const previousHeader = queryRoot.querySelector<HTMLElement>('#vtd-header-previous-month')
  const nextHeader = queryRoot.querySelector<HTMLElement>('#vtd-header-next-month')
  const shortcutContainer = queryRoot.querySelector<HTMLElement>('.vtd-shortcuts')

  // Calendar mode tab order:
  // previous calendar -> (next header -> next calendar) -> shortcuts -> previous header
  // -> cancel -> time/calendar switch -> apply -> repeat
  appendCalendarPanelFocusTarget(queryRoot, 'previous', pushTarget)
  if (isDoublePanel) {
    pushTarget(nextHeader)
    appendCalendarPanelFocusTarget(queryRoot, 'next', pushTarget)
  }
  pushTarget(shortcutContainer)
  pushTarget(previousHeader)
  const footerActions = resolveFooterActionFocusTargets(queryRoot)
  appendFooterActionFocusTargets(footerActions, pushTarget)
  return targets
}

function getTimeModeFocusCycleTargets() {
  const queryRoot = getPickerQueryRoot()
  if (!queryRoot)
    return []

  const { targets, pushTarget } = createFocusTargetCollector({ skipDisabled: true })

  // Inline wheel mode keeps date panels visible, so keep calendar focusable in the cycle.
  appendCalendarPanelFocusTarget(queryRoot, 'previous', pushTarget)
  if (asRange() && !props.asSingle)
    appendCalendarPanelFocusTarget(queryRoot, 'next', pushTarget)

  // Keep shortcuts as a single focus stop in time mode.
  pushTarget(queryRoot.querySelector<HTMLElement>('.vtd-shortcuts'))

  // Keep header navigation available between shortcuts and time controls.
  pushTarget(queryRoot.querySelector<HTMLElement>('#vtd-header-previous-month'))
  if (asRange() && !props.asSingle)
    pushTarget(queryRoot.querySelector<HTMLElement>('#vtd-header-next-month'))

  const endpointToggleButtons = Array.from(queryRoot.querySelectorAll<HTMLButtonElement>('button'))
    .filter((button) => {
      if (!isVisibleElement(button) || isDisabledFocusTarget(button))
        return false
      const label = getElementLabelText(button)
      return label === 'Start' || label === 'End'
    })
  const activeEndpointLabel = activeDateTimeEndpoint.value === 'start' ? 'Start' : 'End'
  const activeEndpointToggle = endpointToggleButtons.find(button => getElementLabelText(button) === activeEndpointLabel)
    ?? endpointToggleButtons[0]
    ?? null
  pushTarget(activeEndpointToggle)

  const wheelTargets = Array.from(queryRoot.querySelectorAll<HTMLElement>('.vtd-time-wheel[role="listbox"]'))
    .filter(target => isVisibleElement(target) && !isDisabledFocusTarget(target))
  wheelTargets.forEach(target => pushTarget(target))

  const footerActions = resolveFooterActionFocusTargets(queryRoot)
  appendFooterActionFocusTargets(footerActions, pushTarget)

  return targets
}

type PopoverCloseFn = (ref?: Ref | HTMLElement) => void

function closePopover(close?: PopoverCloseFn) {
  close?.()
}

function closePopoverFromPanel(close?: PopoverCloseFn) {
  resetPickerViewMode()
  close?.()
}

function handleFooterActionArrowNavigation(event: KeyboardEvent) {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')
    return false

  const target = event.target
  if (!(target instanceof HTMLElement))
    return false
  if (!target.classList.contains('away-cancel-picker') && !target.classList.contains('away-apply-picker'))
    return false

  const queryRoot = getPickerQueryRoot()
  if (!queryRoot)
    return false

  const footerActions = resolveFooterActionFocusTargets(queryRoot)
  const orderedTargets = [footerActions.cancelButton, footerActions.switchButton, footerActions.applyButton]
    .filter((item): item is HTMLButtonElement => !!item)
  if (orderedTargets.length <= 1)
    return false

  const currentIndex = orderedTargets.findIndex(item => item === target)
  if (currentIndex < 0)
    return false

  event.preventDefault()
  event.stopPropagation()
  const delta = event.key === 'ArrowRight' ? 1 : -1
  const nextIndex = (currentIndex + delta + orderedTargets.length) % orderedTargets.length
  orderedTargets[nextIndex]?.focus()
  return true
}

function resolveTimeEndpointToggleButton(
  queryRoot: HTMLElement,
  endpoint: DateTimeEndpointSelection,
) {
  const targetLabel = endpoint === 'start' ? 'Start' : 'End'
  const toggleButtons = Array.from(queryRoot.querySelectorAll<HTMLButtonElement>('button'))
    .filter((button) => {
      if (!isVisibleElement(button) || isDisabledFocusTarget(button))
        return false
      return getElementLabelText(button) === targetLabel
    })
  return toggleButtons[0] ?? null
}

function handleTimeEndpointToggleArrowNavigation(event: KeyboardEvent) {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')
    return false
  if (!asRange() || !isTimePickerWheelStyle.value || !shouldShowDateTimeControls.value)
    return false

  const target = event.target
  if (!(target instanceof HTMLElement))
    return false

  const targetLabel = getElementLabelText(target)
  if (targetLabel !== 'Start' && targetLabel !== 'End')
    return false

  const queryRoot = getPickerQueryRoot()
  if (!queryRoot)
    return false

  const nextEndpoint: DateTimeEndpointSelection = event.key === 'ArrowLeft' ? 'start' : 'end'
  const nextToggleButton = resolveTimeEndpointToggleButton(queryRoot, nextEndpoint)
  if (!nextToggleButton)
    return false

  event.preventDefault()
  event.stopPropagation()
  markActiveDateTimeEndpoint(nextEndpoint)

  nextTick(() => {
    const refreshedQueryRoot = getPickerQueryRoot()
    if (!refreshedQueryRoot)
      return
    resolveTimeEndpointToggleButton(refreshedQueryRoot, nextEndpoint)?.focus()
  })

  return true
}

function resolveActiveFocusTargetIndex(targets: HTMLElement[], activeElement: HTMLElement | null) {
  return targets.findIndex(target => target === activeElement || target.contains(activeElement))
}

interface FocusCycleOptions {
  backward: boolean
  fallbackIndex?: number
  resolveCurrentIndex?: (targets: HTMLElement[], activeElement: HTMLElement | null) => number
}

function moveFocusInCycle(targets: HTMLElement[], options: FocusCycleOptions) {
  if (targets.length < 1)
    return false

  const activeElement = document.activeElement as HTMLElement | null
  let currentIndex = options.resolveCurrentIndex
    ? options.resolveCurrentIndex(targets, activeElement)
    : resolveActiveFocusTargetIndex(targets, activeElement)
  if (currentIndex < 0)
    currentIndex = options.fallbackIndex ?? (options.backward ? 0 : -1)

  const delta = options.backward ? -1 : 1
  const nextIndex = (currentIndex + delta + targets.length) % targets.length
  targets[nextIndex]?.focus()
  return true
}

function resolveSelectorFocusFallbackIndex(targets: HTMLElement[]) {
  return targets.findIndex((target) => {
    const panel = resolveContextPanel(selectionContext.value)
    const expectedHeader = target.id === `vtd-header-${panel}-month`
    const expectedMonth = selectorFocus.value === 'month' && target.getAttribute('aria-label') === 'Month selector'
    const expectedYear = selectorFocus.value === 'year' && target.getAttribute('aria-label') === 'Year selector'
    return expectedHeader || expectedMonth || expectedYear
  })
}

function focusFirstTarget(targets: HTMLElement[]) {
  if (targets.length < 1)
    return false
  targets[0].focus()
  return true
}

function onPickerPanelKeydown(event: KeyboardEvent, close?: PopoverCloseFn) {
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    closePopoverFromPanel(close)
    return
  }

  if (handleFooterActionArrowNavigation(event))
    return

  if (handleTimeEndpointToggleArrowNavigation(event))
    return

  if (event.key !== 'Tab')
    return

  if (isTimePickerWheelStyle.value && shouldShowDateTimeControls.value) {
    const timeWheelTargets = getTimeModeFocusCycleTargets()
    if (timeWheelTargets.length > 0) {
      event.preventDefault()
      event.stopPropagation()
      moveFocusInCycle(timeWheelTargets, {
        backward: event.shiftKey,
        fallbackIndex: event.shiftKey ? 0 : -1,
        resolveCurrentIndex(targets, activeElement) {
          let currentIndex = resolveActiveFocusTargetIndex(targets, activeElement)
          if (currentIndex >= 0 || !activeElement)
            return currentIndex

          const activeLabel = getElementLabelText(activeElement)
          if (activeLabel !== 'Start' && activeLabel !== 'End')
            return -1
          const activeEndpointLabel = activeDateTimeEndpoint.value === 'start' ? 'Start' : 'End'
          return targets.findIndex(target => getElementLabelText(target) === activeEndpointLabel)
        },
      })
      return
    }
  }

  const inSelectorMode = props.selectorMode && pickerViewMode.value === 'selector'
  const targets = inSelectorMode
    ? getSelectorFocusCycleTargets()
    : getCalendarFocusCycleTargets()
  if (targets.length === 0)
    return

  event.preventDefault()
  event.stopPropagation()
  moveFocusInCycle(targets, {
    backward: event.shiftKey,
    fallbackIndex: 0,
    resolveCurrentIndex(nextTargets, activeElement) {
      const activeIndex = resolveActiveFocusTargetIndex(nextTargets, activeElement)
      if (activeIndex >= 0)
        return activeIndex
      return resolveSelectorFocusFallbackIndex(nextTargets)
    },
  })
}

function isTextInputLikeTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement))
    return false
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)
    return true
  return target.isContentEditable
}

function focusFirstPickerCycleTarget() {
  if (isTimePickerWheelStyle.value && shouldShowDateTimeControls.value) {
    const timeWheelTargets = getTimeModeFocusCycleTargets()
    if (focusFirstTarget(timeWheelTargets))
      return true
  }

  const inSelectorMode = props.selectorMode && pickerViewMode.value === 'selector'
  const targets = inSelectorMode
    ? getSelectorFocusCycleTargets()
    : getCalendarFocusCycleTargets()
  if (focusFirstTarget(targets))
    return true

  return focusCalendarModeTarget()
}

function onInputKeydown(event: KeyboardEvent) {
  if (!isTextInputLikeTarget(event.target))
    return

  if (event.key === 'Tab' && !event.shiftKey) {
    if (!isPopoverOpen())
      return
    const focused = focusFirstPickerCycleTarget()
    if (!focused)
      return
    event.preventDefault()
    event.stopPropagation()
    return
  }

  if (event.key !== 'Enter' || event.altKey || event.ctrlKey || event.metaKey)
    return

  event.preventDefault()
  event.stopPropagation()
  resetPickerViewMode()

  if (!isPopoverOpen())
    triggerPopoverButtonClick()

  nextTick(() => {
    if (props.openFocusTarget === 'input' && !props.noInput) {
      VtdInputRef.value?.focus()
      return
    }
    focusCalendarModeTargetDeferred()
  })
}

function onPopoverAfterEnter() {
  pushDebugEvent('after-enter', { activeElement: describeActiveElement() })
  // Preserve lock dimensions across reopen cycles so inline-right wheels remain
  // bounded while a fresh measurement is queued.
  if (panelContentLockState.width <= 0 || panelContentLockState.height <= 0)
    resetPanelContentLockState()
  queuePanelContentMeasurement()
  nextTick(() => {
    if (props.selectorMode && pickerViewMode.value === 'selector') {
      focusSelectorModeTargetDeferred(selectionContext.value, selectorFocus.value)
      return
    }
    if (props.openFocusTarget === 'input' && !props.noInput) {
      VtdInputRef.value?.focus()
      return
    }
    focusCalendarModeTargetDeferred()
  })
}

function onPopoverAfterLeave() {
  pushDebugEvent('after-leave', { activeElement: describeActiveElement() })
}

onMounted(() => {
  const store = getDebugStore()
  if (!store)
    return

  store.mountedCount += 1
  pushDebugEvent('mounted', {
    mountedCount: store.mountedCount,
  })
})

onUnmounted(() => {
  const store = getDebugStore()
  if (!store)
    return

  store.mountedCount = Math.max(0, store.mountedCount - 1)
  pushDebugEvent('unmounted', {
    mountedCount: store.mountedCount,
  })
})

watch(
  () => props.selectorMode,
  (enabled) => {
    if (!enabled)
      resetPickerViewMode()
  },
)

watch(
  () => resolvedTimePickerStyle.value,
  (style) => {
    timePickerPanelOpen.value = style === 'input' || style === 'wheel-inline'
    if (style !== 'wheel-page')
      hasMountedPageTimePanel.value = false

    refreshPanelContentLockState()
  },
  { immediate: true },
)

watch(
  () => showPageTimePanelInline.value,
  (visible) => {
    if (visible && showDualRangeTimePanels.value)
      hasMountedPageTimePanel.value = true
  },
  { immediate: true },
)

watch(
  () => shouldLockPanelContentSize.value,
  () => {
    refreshPanelContentLockState()
  },
)

watch(
  () => [props.timeInlinePosition, props.asSingle, props.useRange, !!props.shortcuts],
  () => {
    if (!shouldLockPanelContentSize.value)
      return
    refreshPanelContentLockState()
  },
)

watch(
  () => [
    timePickerPanelOpen.value,
    shouldShowDatePanels.value,
    showAnyInlineTimePanel.value,
    props.asSingle,
    props.useRange,
    !!props.shortcuts,
    pickerViewMode.value,
  ],
  () => {
    queuePanelContentMeasurement()
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
  return props.useRange || !props.asSingle
}

function inRangeDate(date: Dayjs) {
  if (props.disableInRange || typeof props.disableDate === 'function')
    return false
  if (pickerValue.value === '')
    return false
  const { start: s, end: e } = resolveSelectionRange('model')
  if (!s || !e)
    return false

  return date.isBetween(
    s,
    e,
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
  emitEmptyModelValue()
  applyValue.value = []
  VtdInputRef.value && VtdInputRef.value.focus()
}
defineExpose({ clearPicker })

function resolveDateTimeErrorMessage(
  code: DateTimeErrorCode,
  context: { startDate?: Dayjs | null } = {},
) {
  switch (code) {
    case 'config-missing-time-token':
      return 'Datetime mode requires formatter.date to include supported time tokens.'
    case 'invalid-time-input':
      return 'Please provide a valid time before applying the selection.'
    case 'dst-nonexistent-time':
      return 'Selected local time does not exist because of a DST transition.'
    case 'range-end-before-start': {
      const startDate = context.startDate
      const fallbackTimeFormat = formatterTimeTokens.value.usesSeconds ? 'HH:mm:ss' : 'HH:mm'
      const timeFormat = formatterTimeTokens.value.normalizedTimeFormat ?? fallbackTimeFormat
      if (startDate && startDate.isValid()) {
        return `End time must be at or after start (${startDate.format(timeFormat)}).`
      }
      return 'End time must be at or after start.'
    }
    default:
      return 'Unable to apply the current datetime selection.'
  }
}

function resetDateTimeDraftValidationState() {
  datetimeDraftState.start.isValid = true
  datetimeDraftState.start.errorCode = null
  datetimeDraftState.end.isValid = true
  datetimeDraftState.end.errorCode = null
}

function markDateTimeDraftInvalid(
  endpoint: DateTimeEndpointSelection | null,
  code: DateTimeErrorCode,
) {
  if (!endpoint)
    return
  const targetDraft
    = endpoint === 'start' ? datetimeDraftState.start : datetimeDraftState.end
  targetDraft.isValid = false
  targetDraft.errorCode = code
}

function evaluateDateTimeApplyGuard(): ApplyGuardState {
  if (!datetimeModeConfig.value.datetime) {
    return {
      canApply: true,
      blockedCode: null,
      blockedField: null,
      blockedEndpoint: null,
    }
  }

  if (!formatterTimeTokens.value.isValid) {
    return {
      canApply: false,
      blockedCode: 'config-missing-time-token',
      blockedField: 'formatter',
      blockedEndpoint: null,
    }
  }

  if (!datetimeDraftState.start.isValid) {
    return {
      canApply: false,
      blockedCode: datetimeDraftState.start.errorCode ?? 'invalid-time-input',
      blockedField: datetimeDraftState.start.errorCode === 'config-missing-time-token' ? 'formatter' : 'time',
      blockedEndpoint: 'start',
    }
  }

  if (asRange() && !datetimeDraftState.end.isValid) {
    return {
      canApply: false,
      blockedCode: datetimeDraftState.end.errorCode ?? 'invalid-time-input',
      blockedField: datetimeDraftState.end.errorCode === 'config-missing-time-token' ? 'formatter' : 'time',
      blockedEndpoint: 'end',
    }
  }

  const requiredSelectionCount = asRange() ? 2 : 1
  if (applyValue.value.length < requiredSelectionCount) {
    return {
      canApply: false,
      blockedCode: 'invalid-time-input',
      blockedField: 'time',
      blockedEndpoint: asRange() ? 'end' : 'start',
    }
  }

  const [startDateRaw, endDateRaw] = applyValue.value
  const startDate = startDateRaw ? dayjs(startDateRaw) : null
  const endDate = endDateRaw ? dayjs(endDateRaw) : null

  if (!startDate || !startDate.isValid()) {
    return {
      canApply: false,
      blockedCode: 'invalid-time-input',
      blockedField: 'time',
      blockedEndpoint: 'start',
    }
  }

  if (asRange() && (!endDate || !endDate.isValid())) {
    return {
      canApply: false,
      blockedCode: 'invalid-time-input',
      blockedField: 'time',
      blockedEndpoint: 'end',
    }
  }

  const startValidation = useValidateDayjsLocalDateTime(startDate)
  if (!startValidation.isValid && startValidation.isDstNonexistent) {
    return {
      canApply: false,
      blockedCode: 'dst-nonexistent-time',
      blockedField: 'time',
      blockedEndpoint: 'start',
    }
  }

  if (asRange() && endDate) {
    const endValidation = useValidateDayjsLocalDateTime(endDate)
    if (!endValidation.isValid && endValidation.isDstNonexistent) {
      return {
        canApply: false,
        blockedCode: 'dst-nonexistent-time',
        blockedField: 'time',
        blockedEndpoint: 'end',
      }
    }
  }

  if (asRange() && endDate && endDate.isBefore(startDate)) {
    return {
      canApply: false,
      blockedCode: 'range-end-before-start',
      blockedField: 'range',
      blockedEndpoint: 'end',
    }
  }

  return {
    canApply: true,
    blockedCode: null,
    blockedField: null,
    blockedEndpoint: null,
  }
}

function emitBlockedApplyError(blockedState: ApplyGuardState) {
  if (
    blockedState.canApply
    || !blockedState.blockedCode
    || !blockedState.blockedField
  ) {
    return
  }

  const payload: DateTimeErrorEventPayload = {
    type: blockedState.blockedField === 'formatter' ? 'configuration' : 'validation',
    code: blockedState.blockedCode,
    message: resolveDateTimeErrorMessage(
      blockedState.blockedCode,
      blockedState.blockedCode === 'range-end-before-start'
        ? { startDate: applyValue.value[0] ?? null }
        : {},
    ),
    field: blockedState.blockedField,
    endpoint: blockedState.blockedEndpoint,
  }

  resetDateTimeDraftValidationState()
  markDateTimeDraftInvalid(payload.endpoint, payload.code)
  datetimeApplyError.value = payload
  emit('error', payload)
}

function isApplyButtonDisabled() {
  if (datetimeModeConfig.value.datetime) {
    const hasRequiredSelection = asRange()
      ? isDateTimeDraftReady('start') && isDateTimeDraftReady('end')
      : isDateTimeDraftReady('start')
    if (!hasRequiredSelection)
      return true

    const startHasInputError = !datetimeDraftState.start.isValid
      && (
        datetimeDraftState.start.errorCode === 'invalid-time-input'
        || datetimeDraftState.start.errorCode === 'dst-nonexistent-time'
      )
    const endHasInputError = asRange()
      && !datetimeDraftState.end.isValid
      && (
        datetimeDraftState.end.errorCode === 'invalid-time-input'
        || datetimeDraftState.end.errorCode === 'dst-nonexistent-time'
      )

    return startHasInputError || endHasInputError
  }

  return props.asSingle ? applyValue.value.length < 1 : applyValue.value.length < 2
}

/**
 * keyUp event
 * @since v1.0.5
 */
function keyUp() {
  if (datetimeModeConfig.value.datetime)
    return

  if (asRange()) {
    const [s, e] = pickerValue.value.split(props.separator)
    const [sd, ed] = [
      dayjs(s, props.formatter.date, true),
      dayjs(e, props.formatter.date, true),
    ]
    if (sd.isValid() && ed.isValid()) {
      setDate(sd)
      setDate(ed)
      emitRangeModelValueFromFormatted(
        s,
        e,
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
  else {
    const d = dayjs(pickerValue.value, props.formatter.date, true)
    if (d.isValid()) {
      setDate(d)
      emitSingleModelValueFromFormatted(pickerValue.value)
    }
  }
}

type DateSelectionSource = 'keyboard' | 'pointer'
interface DateSelectionPayload {
  date: Dayjs
  source?: DateSelectionSource
  activationKey?: string
}

function normalizeDateSelectionPayload(payload: Dayjs | DateSelectionPayload) {
  if (dayjs.isDayjs(payload)) {
    return {
      date: payload,
      source: 'pointer' as DateSelectionSource,
      activationKey: null as string | null,
    }
  }

  return {
    date: payload.date,
    source: payload.source === 'keyboard' ? 'keyboard' : 'pointer',
    activationKey: typeof payload.activationKey === 'string' ? payload.activationKey : null,
  }
}

function setDate(payload: Dayjs | DateSelectionPayload, close?: (ref?: Ref | HTMLElement) => void) {
  const { date, source, activationKey } = normalizeDateSelectionPayload(payload)

  if (datetimeModeConfig.value.datetime) {
    datetimeApplyError.value = null
    resetDateTimeDraftValidationState()
  }

  if (asRange()) {
    const selectedRangeEndDate = applyValue.value.length >= 2 ? applyValue.value[1] : null
    const shouldApplyKeyboardRange
      = !autoApplyEnabled.value
        && source === 'keyboard'
        && activationKey === 'Enter'
        && !!selectedRangeEndDate
        && selectedRangeEndDate.isSame(date, 'date')
    if (shouldApplyKeyboardRange) {
      applyDate(close)
      return
    }

    if (previous.value) {
      datetimeDraftState.activeEndpoint = 'end'
      next.value = date
      if (autoApplyEnabled.value) {
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
        const startDate = dayjs(s, props.formatter.date, true)
        const endDate = dayjs(e, props.formatter.date, true)
        emitRangeModelValueFromFormatted(
          startDate.format(props.formatter.date),
          endDate.format(props.formatter.date),
          useToValueFromArray(
            {
              previous: startDate,
              next: endDate,
            },
            props,
          ),
        )
        const shouldClosePopover
          = props.closeOnRangeSelection && typeof close === 'function'
        // In `no-input` static mode there is no popover close callback, so
        // this option intentionally becomes a no-op.
        if (shouldClosePopover)
          closePopover(close)

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
        const startBaseDate = applyValue.value[0] ?? previous.value
        const startDateWithDraftTime = mergeDateWithDraftTime(startBaseDate, 'start')
        const endDateWithDraftTime = mergeDateWithDraftTime(date, 'end')

        if (previous.value.isAfter(date, 'date'))
          applyValue.value = [endDateWithDraftTime, startDateWithDraftTime]
        else applyValue.value = [startDateWithDraftTime, endDateWithDraftTime]

        const [s, e] = applyValue.value

        if (!s.isSame(e, 'month')) {
          datepicker.value.previous = s
          datepicker.value.next = e
        }
        assignDateTimeDraft('start', s, false)
        assignDateTimeDraft('end', e, false)
        openTimePanelAfterDateSelection()
        force()
      }
    }
    else {
      datetimeDraftState.activeEndpoint = 'start'
      applyValue.value = []
      previous.value = date
      selection.value = date
      hoverValue.value.push(date)
      applyValue.value.push(mergeDateWithDraftTime(date, 'start'))
      datepicker.value.previous = date
      if (datepicker.value.next.isSame(date, 'month')) {
        datepicker.value.previous = datepicker.value.next
        datepicker.value.next = date.add(1, 'month')
      }
      openTimePanelAfterDateSelection()
    }
  }
  else {
    if (autoApplyEnabled.value) {
      pickerValue.value = useToValueFromString(date, props)
      emitSingleModelValueFromFormatted(pickerValue.value)
      if (close)
        closePopover(close)

      applyValue.value = []
      force()
    }
    else {
      const dateWithDraftTime = mergeDateWithDraftTime(date, 'start')
      applyValue.value = [dateWithDraftTime]
      assignDateTimeDraft('start', dateWithDraftTime, false)
      openTimePanelAfterDateSelection()
      force()
    }
  }
}

function applyDate(close?: (ref?: Ref | HTMLElement) => void) {
  if (applyValue.value.length < 1)
    return false

  if (datetimeModeConfig.value.datetime) {
    const applyGuard = evaluateDateTimeApplyGuard()
    if (!applyGuard.canApply) {
      emitBlockedApplyError(applyGuard)
      return false
    }
    datetimeApplyError.value = null
    resetDateTimeDraftValidationState()
  }

  if (asRange()) {
    const normalizedAtApply = normalizeRangeAtCommitBoundary('apply')
    if (normalizedAtApply && !props.autoApply)
      applyValue.value = [datepicker.value.previous, datepicker.value.next]
  }

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
    const startDate = dayjs(s, props.formatter.date, true)
    const endDate = dayjs(e, props.formatter.date, true)
    emitRangeModelValueFromFormatted(
      startDate.format(props.formatter.date),
      endDate.format(props.formatter.date),
      useToValueFromArray(
        {
          previous: startDate,
          next: endDate,
        },
        props,
      ),
    )
    pickerValue.value = date as string
  }
  else {
    pickerValue.value = (date as Dayjs).format(props.formatter.date)
    emitSingleModelValueFromFormatted(pickerValue.value)
  }
  if (close)
    closePopover(close)
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
  if (previous.value && autoApplyEnabled.value)
    return false
  const range = hoverValue.value.length > 1
    ? resolveSelectionRange('hover')
    : resolveSelectionRange('interactive')
  const { start: s, end: e } = range
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
  let classes: string | undefined
  let s: Dayjs | null = null
  let e: Dayjs | null = null
  if (asRange()) {
    const range = selection.value
      ? resolveSelectionRange('hover')
      : resolveSelectionRange('interactive')
    s = range.start
    e = range.end
  }
  else {
    const range = resolveSelectionRange(autoApplyEnabled.value ? 'model' : 'apply')
    s = range.start
  }
  if (active) {
    classes = today
      ? 'text-vtd-primary-500 font-semibold dark:text-vtd-primary-400 rounded-full focus:bg-vtd-primary-50 focus:text-vtd-secondary-900 focus:border-vtd-primary-300 focus:ring focus:ring-vtd-primary-500/10 focus:outline-none dark:bg-vtd-secondary-800 dark:text-vtd-secondary-300 dark:hover:bg-vtd-secondary-700 dark:hover:text-vtd-secondary-300 dark:focus:bg-vtd-secondary-600/50 dark:focus:text-vtd-secondary-100 dark:focus:border-vtd-primary-500 dark:focus:ring-vtd-primary-500/25'
        : disabled
          ? 'text-vtd-secondary-600 font-normal disabled:text-vtd-secondary-500 disabled:cursor-not-allowed rounded-full'
          : !!(s && e && date.isBetween(s, e, 'date', '()'))
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
  let classes = ''
  if (!asRange())
    return classes
  const range = hoverValue.value.length > 1
    ? resolveSelectionRange('hover')
    : resolveSelectionRange('interactive')
  const s = range.start
  const e = range.end

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

function emitShortcut(s: string, e: string) {
  if (asRange()) {
    if (autoApplyEnabled.value) {
      emitRangeModelValueFromFormatted(
        s,
        e,
        useToValueFromArray(
          {
            previous: dayjs(s, props.formatter.date, true),
            next: dayjs(e, props.formatter.date, true),
          },
          props,
        ),
      )
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
    if (autoApplyEnabled.value) {
      emitSingleModelValueFromFormatted(s)
      pickerValue.value = s
    }
    else {
      applyValue.value = [
        dayjs(s, props.formatter.date, true),
        dayjs(e, props.formatter.date, true),
      ]
    }
  }

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

function getBuiltInShortcut(target: BuiltInShortcutId): LegacyShortcutDefinition | TypedShortcutDefinition {
  switch (target) {
    case 'today':
      return {
        id: 'today',
        label: props.options.shortcuts.today,
        atClick: () => {
          const date = dayjs().toDate()
          return [date, date]
        },
      }
    case 'yesterday':
      return {
        id: 'yesterday',
        label: props.options.shortcuts.yesterday,
        atClick: () => {
          const date = dayjs().subtract(1, 'day').toDate()
          return [date, date]
        },
      }
    case 'past-7-days':
      return {
        id: 'past-7-days',
        label: props.options.shortcuts.past(7),
        atClick: () => {
          const now = dayjs()
          return [
            now.subtract(6, 'day').toDate(),
            now.toDate(),
          ]
        },
      }
    case 'past-30-days':
      return {
        id: 'past-30-days',
        label: props.options.shortcuts.past(30),
        atClick: () => {
          const now = dayjs()
          return [
            now.subtract(29, 'day').toDate(),
            now.toDate(),
          ]
        },
      }
    case 'this-month':
      return {
        id: 'this-month',
        label: props.options.shortcuts.currentMonth,
        atClick: () => {
          const now = dayjs()
          return [
            now.date(1).toDate(),
            now.date(now.daysInMonth()).toDate(),
          ]
        },
      }
    case 'last-month':
      return {
        id: 'last-month',
        label: props.options.shortcuts.pastMonth,
        atClick: () => {
          const now = dayjs()
          return [
            now.date(1).subtract(1, 'month').toDate(),
            now.date(0).toDate(),
          ]
        },
      }
    case 'three-business-days':
      return {
        id: 'three-business-days',
        label: getModernShortcutLabel('three-business-days'),
        resolver: ({ now }) => resolveModernBuiltInDate('three-business-days', now),
      }
    case 'next-week':
      return {
        id: 'next-week',
        label: getModernShortcutLabel('next-week'),
        resolver: ({ now }) => resolveModernBuiltInDate('next-week', now),
      }
    case 'next-month':
      return {
        id: 'next-month',
        label: getModernShortcutLabel('next-month'),
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

function isTypedShortcutDefinition(target: ShortcutActivationTarget): target is TypedShortcutDefinition {
  return typeof target !== 'string' && 'resolver' in target && typeof target.resolver === 'function'
}

const shortcutDisabledStateCache = new Map<string, ShortcutDisabledState>()
type ShortcutActivationState = ReturnType<typeof activateShortcutByDefinition>
const shortcutActivationStateCache = new Map<string, ShortcutActivationState>()
let shortcutDisabledStateCacheMinuteBucket = Math.floor(new Date().getTime() / 60000)

function clearShortcutDisabledStateCache() {
  shortcutDisabledStateCache.clear()
  shortcutActivationStateCache.clear()
}

function syncShortcutDisabledStateCacheBucket() {
  const currentMinuteBucket = Math.floor(new Date().getTime() / 60000)
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

  return `legacy:${legacyShortcutFallbackId(target.label, index ?? -1)}`
}

function getShortcutDisabledStateCacheKey(target: ShortcutActivationTarget, index?: number) {
  syncShortcutDisabledStateCacheBucket()
  return `${asRange() ? 'range' : 'single'}:${getShortcutCacheTargetKey(target, index)}`
}

function getShortcutActivationState(
  target: ShortcutActivationTarget,
  index?: number,
  options: { preferCached?: boolean; cacheResult?: boolean } = {},
) {
  const cacheKey = getShortcutDisabledStateCacheKey(target, index)
  if (options.preferCached) {
    const cachedActivation = shortcutActivationStateCache.get(cacheKey)
    if (cachedActivation)
      return cachedActivation
  }

  const item = typeof target === 'string' ? getBuiltInShortcut(target) : target
  const mode = asRange() ? 'range' : 'single'
  const now = new Date()
  const activation = activateShortcutByDefinition({
    item,
    mode,
    currentValue: props.modelValue,
    now,
    index,
    constraints: {
      isDateBlocked: (date: Date) => useDisableDate(dayjs(date), props),
    },
  })

  if (options.cacheResult)
    shortcutActivationStateCache.set(cacheKey, activation)

  return activation
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
    const activation = getShortcutActivationState(target, index, {
      preferCached: true,
      cacheResult: true,
    })
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
    const activation = getShortcutActivationState(target, index, {
      preferCached: true,
      cacheResult: true,
    })
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
  const activation = getShortcutActivationState(target, index, {
    preferCached: false,
    cacheResult: true,
  })

  if (!activation.ok) {
    emitInvalidShortcut(activation.payload)
    return
  }

  applyShortcutResolvedValue(activation.value)

  const shouldCloseAfterShortcutSelection
    = typeof close === 'function'
      && (!asRange() || props.closeOnRangeSelection)

  if (shouldCloseAfterShortcutSelection)
    closePopover(close)
}

watch(
  () => applyValue.value,
  (newValue) => {
    if (datetimeModeConfig.value.datetime) {
      // Keep the user-selected endpoint stable while editing time wheels.
      // Explicit endpoint changes come from Start/End controls (or date selection flow).
      if (!asRange() || newValue.length === 0)
        datetimeDraftState.activeEndpoint = 'start'
      syncDateTimeDraftsFromApplyValue()
    }

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

    let s: Dayjs | null = null
    let e: Dayjs | null = null
    let startHydrated = false
    let endHydrated = false
    if (asRange()) {
      if (Array.isArray(modelValueCloned)) {
        if (modelValueCloned.length > 0) {
          const [start, end] = modelValueCloned
          const resolvedStart = resolveModelDateValue(start, 'start')
          const resolvedEnd = resolveModelDateValue(end, 'end')
          s = resolvedStart.value
          e = resolvedEnd.value
          startHydrated = resolvedStart.isHydrated
          endHydrated = resolvedEnd.isHydrated
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
            emitEmptyModelValue()
          }
        }
        if (modelValueCloned) {
          const [start, end] = Object.values(modelValueCloned)
          const resolvedStart = resolveModelDateValue(start, 'start')
          const resolvedEnd = resolveModelDateValue(end, 'end')
          s = resolvedStart.value
          e = resolvedEnd.value
          startHydrated = resolvedStart.isHydrated
          endHydrated = resolvedEnd.isHydrated
        }
      }
      else {
        if (modelValueCloned) {
          const [start, end] = modelValueCloned.split(props.separator)
          const resolvedStart = resolveModelDateValue(start, 'start')
          const resolvedEnd = resolveModelDateValue(end, 'end')
          s = resolvedStart.value
          e = resolvedEnd.value
          startHydrated = resolvedStart.isHydrated
          endHydrated = resolvedEnd.isHydrated
        }
      }

      if (s && e) {
        const formattedStart = formatModelDateWithDirectYear(s, props.formatter.date)
        const formattedEnd = formatModelDateWithDirectYear(e, props.formatter.date)
        pickerValue.value = `${formattedStart}${props.separator}${formattedEnd}`
        const preserveTemporaryInversion
          = props.selectorMode
            && props.directYearInput
            && !props.autoApply
            && pickerViewMode.value === 'selector'
            && rangeNormalizationState.hasTemporaryInversion

        if (e.isBefore(s, 'month')) {
          if (preserveTemporaryInversion) {
            datepicker.value.previous = s
            datepicker.value.next = e
            datepicker.value.year.previous = s.year()
            datepicker.value.year.next = e.year()
          }
          else {
            datepicker.value.previous = e
            datepicker.value.next = s
            datepicker.value.year.previous = e.year()
            datepicker.value.year.next = s.year()
          }
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
        assignDateTimeDraft('start', s, startHydrated)
        assignDateTimeDraft('end', e, endHydrated)
        if (!autoApplyEnabled.value)
          applyValue.value = [s, e]
      }
      else {
        datepicker.value.previous = dayjs(props.startFrom)
        datepicker.value.next = dayjs(props.startFrom).add(1, 'month')
        datepicker.value.year.previous = datepicker.value.previous.year()
        datepicker.value.year.next = datepicker.value.next.year()
        assignDateTimeDraft('start', null)
        assignDateTimeDraft('end', null)
      }
    }
    else {
      if (Array.isArray(modelValueCloned)) {
        if (modelValueCloned.length > 0) {
          const [start] = modelValueCloned
          const resolvedStart = resolveModelDateValue(start, 'start')
          s = resolvedStart.value
          startHydrated = resolvedStart.isHydrated
        }
      }
      else if (typeof modelValueCloned === 'object') {
        if (modelValueCloned) {
          const [start] = Object.values(modelValueCloned)
          const resolvedStart = resolveModelDateValue(start, 'start')
          s = resolvedStart.value
          startHydrated = resolvedStart.isHydrated
        }
      }
      else {
        if (modelValueCloned.length) {
          const [start] = modelValueCloned.split(props.separator)
          const resolvedStart = resolveModelDateValue(start, 'start')
          s = resolvedStart.value
          startHydrated = resolvedStart.isHydrated
        }
      }

      if (s && s.isValid()) {
        pickerValue.value = formatModelDateWithDirectYear(s, props.formatter.date)
        datepicker.value.previous = s
        datepicker.value.next = s.add(1, 'month')
        datepicker.value.year.previous = s.year()
        datepicker.value.year.next = s.add(1, 'year').year()
        assignDateTimeDraft('start', s, startHydrated)
        assignDateTimeDraft('end', null)
        if (!autoApplyEnabled.value)
          applyValue.value = [s]
      }
      else {
        datepicker.value.previous = dayjs(props.startFrom)
        datepicker.value.next = dayjs(props.startFrom).add(1, 'month')
        datepicker.value.year.previous = datepicker.value.previous.year()
        datepicker.value.year.next = datepicker.value.next.year()
        assignDateTimeDraft('start', null)
        assignDateTimeDraft('end', null)
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
  <Popover
    v-if="!props.noInput"
    id="vtd"
    v-slot="{ open }: { open: boolean }"
    as="div"
    class="relative w-full"
    :restore-focus="props.popoverRestoreFocus"
  >
    <PopoverOverlay v-if="props.overlay && !props.disabled" class="fixed inset-0 bg-black opacity-30" />

    <PopoverButton
      ref="VtdPopoverButtonRef"
      as="label"
      data-vtd-popover-button="true"
      class="relative block"
      @click.capture="onPopoverButtonCaptureClick(open, $event)"
      @click="onPopoverButtonClick(open, $event)"
      @keydown.capture="onInputKeydown"
    >
      <slot :value="pickerValue" :placeholder="givenPlaceholder" :clear="clearPicker">
        <input ref="VtdInputRef" v-bind="$attrs" v-model="pickerValue" type="text" class="relative block w-full"
          :disabled="props.disabled" :class="[
            props.disabled ? 'cursor-default opacity-50' : 'opacity-100',
            inputClasses
            || 'pl-3 pr-12 py-2.5 rounded-lg overflow-hidden border-solid text-sm text-vtd-secondary-700 placeholder-vtd-secondary-400 transition-colors bg-white border border-vtd-secondary-300 focus:border-vtd-primary-300 focus:ring focus:ring-vtd-primary-500/10 focus:outline-none dark:bg-vtd-secondary-800 dark:border-vtd-secondary-700 dark:text-vtd-secondary-100 dark:placeholder-vtd-secondary-500 dark:focus:border-vtd-primary-500 dark:focus:ring-vtd-primary-500/20',
          ]" autocomplete="off" data-lpignore="true" data-form-type="other" :placeholder="givenPlaceholder"
          @mousedown="onInputMouseDown(open, $event)" @click="onInputClick(open, $event)"
          @keyup.stop="keyUp" @keydown.stop="onInputKeydown">
        <div class="absolute inset-y-0 right-0 inline-flex items-center rounded-md overflow-hidden">
          <button type="button" :disabled="props.disabled" :class="props.disabled ? 'cursor-default opacity-50' : 'opacity-100'
            " class="px-2 py-1 mr-1 focus:outline-none text-vtd-secondary-400 dark:text-vtd-secondary-400/70 rounded-md" @click.stop="
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

    <transition :css="props.popoverTransition" enter-from-class="opacity-0 translate-y-3" enter-to-class="opacity-100 translate-y-0"
      enter-active-class="transform transition ease-out duration-200"
      leave-active-class="transform transition ease-in duration-150" leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-3" @after-enter="onPopoverAfterEnter" @after-leave="onPopoverAfterLeave">
      <PopoverPanel v-if="!props.disabled" v-slot="{ close }: { close: (ref?: Ref | HTMLElement) => void }" as="div"
        class="relative z-50">
        <div class="absolute z-50 top-full sm:mt-2.5" :class="getAbsoluteParentClass(open)">
          <div ref="VtdRef"
            class="fixed inset-0 z-50 overflow-y-auto sm:overflow-visible sm:static sm:z-auto bg-white dark:bg-vtd-secondary-800 sm:rounded-lg shadow-sm">
            <div
              class="vtd-datepicker static sm:relative w-full sm:w-fit bg-white sm:rounded-lg sm:shadow-sm border-0 sm:border border-black/[.1] px-3 py-3 sm:px-4 sm:py-4 dark:bg-vtd-secondary-800 dark:border-vtd-secondary-700/[1]"
              :class="[
                getAbsoluteClass(open),
                props.selectorMode && props.asSingle ? 'sm:w-[28.5rem]' : '',
                useLegacyNoTimeSelectorHeightClamp ? 'sm:h-[23.5rem]' : '',
                collapseDualRangeInlineRightTimePanel ? 'sm:min-w-[78rem]' : '',
              ]"
              :style="datepickerShellLockStyle"
              @keydown.capture="(event) => onPickerPanelKeydown(event, close)"
              @focusin.capture="onTimeWheelInteraction"
              @pointerdown.capture="onTimeWheelInteraction">
              <div class="flex flex-wrap lg:flex-nowrap" :class="useLegacyNoTimeSelectorHeightClamp ? 'sm:h-full' : ''">
                <VtdShortcut v-if="props.shortcuts" :shortcuts="props.shortcuts" :as-range="asRange()"
                  :as-single="props.asSingle" :built-in-shortcuts="builtInShortcutItems" :close="close">
                  <template #shortcut-item="slotProps">
                    <slot name="shortcut-item" v-bind="slotProps" />
                  </template>
                </VtdShortcut>
                <div
                  ref="VtdPanelContentRef"
                  class="relative flex flex-wrap sm:flex-nowrap p-1 w-full"
                  :class="[
                    useLegacyNoTimeSelectorHeightClamp ? 'sm:h-full' : '',
                    showAnyInlineTimePanel ? 'sm:flex-1 sm:min-w-0' : 'sm:w-auto',
                  ]"
                  :style="panelContentLockStyle"
                >
                  <template v-if="shouldShowDatePanels">
                    <div v-if="asRange() && !props.asSingle && !collapseDualRangeInlineRightTimePanel"
                    class="hidden h-full absolute inset-0 sm:flex justify-center items-center">
                      <div class="h-full border-r border-black/[.1] dark:border-vtd-secondary-700/[1]" />
                    </div>
                    <div class="relative w-full" data-vtd-selector-panel="previous" :class="{
                      'mb-3 sm:mb-0 sm:mr-2 md:w-1/2 lg:w-80':
                        asRange() && !props.asSingle && !showInlineTimePanelInline,
                      'mb-3 sm:mb-0 sm:mr-2 md:flex-1 md:min-w-0 lg:w-auto':
                        asRange() && !props.asSingle && showInlineTimePanelInline,
                      'lg:w-80': props.asSingle && !!props.shortcuts,
                      'sm:min-h-[21.75rem]': props.asSingle && !props.selectorMode && !showInlineTimePanelInline,
                      'overflow-visible': isSelectorPanel('previous'),
                      'overflow-hidden': !isSelectorPanel('previous'),
                      'sm:h-full': useLegacyNoTimeSelectorHeightClamp,
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
                      'sm:min-h-[17.75rem]': props.selectorMode,
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
                              panel-name="previous"
                              :years="selectorYears"
                              selector-mode
                              :direct-year-input="props.directYearInput"
                              :selected-month="getPanelSelectedMonth('previous')"
                              :selected-year="getPanelSelectedYear('previous')"
                              :selector-focus="selectorFocus"
                              :year-numbering-mode="props.yearNumberingMode"
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
                    class="relative w-full mt-3 sm:mt-0 sm:ml-2"
                    :class="{
                      'md:w-1/2 lg:w-80': asRange() && !props.asSingle && !showInlineTimePanelInline,
                      'md:flex-1 md:min-w-0 lg:w-auto': asRange() && !props.asSingle && showInlineTimePanelInline,
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
                      'sm:min-h-[17.75rem]': props.selectorMode,
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
                              panel-name="next"
                              :years="selectorYears"
                              selector-mode
                              :direct-year-input="props.directYearInput"
                              :selected-month="getPanelSelectedMonth('next')"
                              :selected-year="getPanelSelectedYear('next')"
                              :selector-focus="selectorFocus"
                              :year-numbering-mode="props.yearNumberingMode"
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
                  </template>
                  <template v-if="shouldRenderInlineTimePanels">
                    <div
                      v-show="showPageTimePanelInline || showInlineTimePanelInline"
                      class="w-full min-w-0 sm:flex-1 px-0.5 sm:px-2 flex flex-col sm:h-full"
                      @focusin.capture="onTimeWheelInteraction"
                      @pointerdown.capture="onTimeWheelInteraction"
                    >
                      <div class="mt-2 w-full min-w-0 rounded-md border border-black/[.08] p-2 dark:border-vtd-secondary-700/[1]"
                        :class="timePanelFillClass">
                        <div class="flex flex-col gap-2" :class="shouldUseFillTimePanelLayout ? 'h-full' : ''">
                          <div :class="timePanelHeaderRowClass">
                            <p
                              v-if="!showDualRangeTimePanelsUi"
                              class="shrink-0 whitespace-nowrap text-xs font-medium text-vtd-secondary-700 dark:text-vtd-secondary-200"
                            >
                              {{ timePanelSingleEndpointTitle }}
                            </p>
                            <div
                              v-if="showDualRangeTimePanelsUi"
                              :class="timePanelDualEndpointLabelsClass"
                            >
                              <p :class="timePanelDualEndpointLabelTextClass">
                                Start time
                              </p>
                              <p :class="timePanelDualEndpointLabelTextClass">
                                End time
                              </p>
                            </div>
                            <div v-if="shouldCenterTimePanelEndpointToggle" data-vtd-time-endpoint-toggle-centered :class="timePanelCenteredToggleWrapperClass">
                              <div :class="timePanelEndpointToggleGroupClass">
                                <button
                                  type="button"
                                  :class="[timePanelEndpointToggleButtonClass, timePanelEndpointToggleButtonStateClass('start')]"
                                  @click="setDateTimeEndpoint('start')"
                                >
                                  Start
                                </button>
                                <button
                                  type="button"
                                  :class="[timePanelEndpointToggleButtonClass, timePanelEndpointToggleButtonStateClass('end')]"
                                  @click="setDateTimeEndpoint('end')"
                                >
                                  End
                                </button>
                              </div>
                            </div>
                            <p
                              v-if="shouldOverlayTimeFormatLabel"
                              :class="[timePanelFormatLabelClass, 'absolute right-0 top-0']"
                            >
                              {{ dateTimeFormatDescription }}
                            </p>
                            <div :class="timePanelHeaderActionsClass">
                              <div v-if="shouldShowInlineTimePanelEndpointToggle" :class="timePanelEndpointToggleGroupClass">
                                <button
                                  type="button"
                                  :class="[timePanelEndpointToggleButtonClass, timePanelEndpointToggleButtonStateClass('start')]"
                                  @click="setDateTimeEndpoint('start')"
                                >
                                  Start
                                </button>
                                <button
                                  type="button"
                                  :class="[timePanelEndpointToggleButtonClass, timePanelEndpointToggleButtonStateClass('end')]"
                                  @click="setDateTimeEndpoint('end')"
                                >
                                  End
                                </button>
                              </div>
                              <button
                                v-if="shouldShowHeaderTimePanelSwitchButton"
                                type="button"
                                :class="timePanelHeaderSwitchButtonClass"
                                @click="toggleTimePanel()"
                              >
                                {{ timePanelSwitchLabel }}
                              </button>
                              <p v-if="shouldShowInlineTimeFormatLabel" :class="timePanelFormatLabelClass">
                                {{ dateTimeFormatDescription }}
                              </p>
                            </div>
                          </div>
                          <div class="w-full min-w-0" :class="timePanelEndpointLayoutClass" :style="timePanelEndpointLayoutStyle">
                            <div
                              v-for="endpoint in visibleTimeEndpoints"
                              :key="endpoint"
                              class="vtd-time-endpoint min-w-0 flex flex-col gap-2"
                              :class="showDualRangeTimePanelsUi ? 'vtd-time-endpoint-dual h-full min-h-0 w-full overflow-hidden rounded-md border border-black/[.1] px-2 py-4 dark:border-vtd-secondary-700/[1]' : 'vtd-time-endpoint-single w-full'"
                            >
                              <template v-if="isTimePickerWheelStyle">
                                <div
                                  class="vtd-time-wheel-grid mt-1.5 mb-1 grid min-h-0 auto-rows-[minmax(0,1fr)] items-stretch gap-2"
                                  :class="[timeWheelGridColumnClass, showDualRangeTimePanelsUi ? 'vtd-time-wheel-grid-dual' : 'vtd-time-wheel-grid-single w-full']"
                                >
                                  <VtdTimeWheel
                                    ariaLabel="Hour wheel"
                                    :items="hourWheelOptions"
                                    :model-value="getHourWheelValue(endpoint)"
                                    :scrollMode="props.timeWheelScrollMode"
                                    :fractionalOffset="getHourWheelFractionalOffset(endpoint)"
                                    :disabled="!isDateTimeDraftReady(endpoint)"
                                    @step="(payload) => onDateTimeHourWheelStep(payload, endpoint)"
                                    @update:model-value="(value) => onDateTimeHourWheelUpdate(value, endpoint)"
                                  />
                                  <VtdTimeWheel
                                    ariaLabel="Minute wheel"
                                    :items="minuteWheelOptions"
                                    :model-value="getMinuteWheelValue(endpoint)"
                                    :scrollMode="props.timeWheelScrollMode"
                                    :fractionalOffset="getMinuteWheelFractionalOffset(endpoint)"
                                    :disabled="!isDateTimeDraftReady(endpoint)"
                                    @step="(payload) => onDateTimeMinuteWheelStep(payload, endpoint)"
                                    @update:model-value="(value) => onDateTimeMinuteWheelUpdate(value, endpoint)"
                                  />
                                  <VtdTimeWheel
                                    v-if="formatterTimeTokens.usesSeconds"
                                    ariaLabel="Second wheel"
                                    :items="secondWheelOptions"
                                    :model-value="getSecondWheelValue(endpoint)"
                                    :scrollMode="props.timeWheelScrollMode"
                                    :disabled="!isDateTimeDraftReady(endpoint)"
                                    @step="(payload) => onDateTimeSecondWheelStep(payload, endpoint)"
                                    @update:model-value="(value) => onDateTimeSecondWheelUpdate(value, endpoint)"
                                  />
                                  <VtdTimeWheel
                                    v-if="formatterTimeTokens.uses12Hour"
                                    ariaLabel="Meridiem wheel"
                                    :items="meridiemWheelOptions"
                                    :model-value="getMeridiemWheelValue(endpoint)"
                                    :scrollMode="props.timeWheelScrollMode"
                                    :fractionalOffset="getMeridiemWheelFractionalOffset(endpoint)"
                                    :syncDirection="getMeridiemWheelSyncDirection(endpoint)"
                                    :disabled="!isDateTimeDraftReady(endpoint)"
                                    @update:model-value="(value) => onDateTimeMeridiemWheelUpdate(value, endpoint)"
                                  />
                                </div>
                              </template>
                              <template v-else>
                                <input
                                  :value="getDateTimeInputValue(endpoint)"
                                  :placeholder="dateTimeInputPlaceholder"
                                  type="text"
                                  class="block w-full rounded-md border border-vtd-secondary-300 px-3 py-2 text-sm text-vtd-secondary-700 placeholder-vtd-secondary-400 focus:border-vtd-primary-300 focus:outline-none focus:ring focus:ring-vtd-primary-500 focus:ring-opacity-10 dark:border-vtd-secondary-700 dark:bg-vtd-secondary-800 dark:text-vtd-secondary-100 dark:placeholder-vtd-secondary-500 dark:focus:border-vtd-primary-500 dark:focus:ring-opacity-20"
                                  :disabled="!isDateTimeDraftReady(endpoint)"
                                  @input="(event) => onDateTimeInput(event, endpoint)"
                                >
                              </template>
                              <p v-if="getDateTimeValidationMessage(endpoint)" class="w-full min-w-0 break-words whitespace-normal [overflow-wrap:anywhere] mt-2 text-xs text-red-600 dark:text-red-400">
                                {{ getDateTimeValidationMessage(endpoint) }}
                              </p>
                            </div>
                          </div>
                          <p v-if="formatterTimeTokenErrorMessage" class="w-full min-w-0 break-words whitespace-normal [overflow-wrap:anywhere] mt-2 text-xs text-red-600 dark:text-red-400">
                            {{ formatterTimeTokenErrorMessage }}
                          </p>
                          <p v-else-if="panelLevelDateTimeErrorMessage" class="w-full min-w-0 break-words whitespace-normal [overflow-wrap:anywhere] mt-2 text-xs text-red-600 dark:text-red-400">
                            {{ panelLevelDateTimeErrorMessage }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </template>
                </div>
              </div>
              <div v-if="showStackedDateTimeControls" class="mt-2 mx-2 py-1.5 border-t border-black/[.1] dark:border-vtd-secondary-700/[1]">
                <div class="mt-1.5 w-full min-w-0 flex flex-col gap-2">
                  <div :class="timePanelHeaderRowClass">
                    <p
                      v-if="!showDualRangeTimePanelsUi"
                      class="shrink-0 whitespace-nowrap text-xs font-medium text-vtd-secondary-700 dark:text-vtd-secondary-200"
                    >
                      {{ timePanelSingleEndpointTitle }}
                    </p>
                    <div
                      v-if="showDualRangeTimePanelsUi"
                      :class="timePanelDualEndpointLabelsClass"
                    >
                      <p :class="timePanelDualEndpointLabelTextClass">
                        Start time
                      </p>
                      <p :class="timePanelDualEndpointLabelTextClass">
                        End time
                      </p>
                    </div>
                    <div v-if="shouldCenterTimePanelEndpointToggle" data-vtd-time-endpoint-toggle-centered :class="timePanelCenteredToggleWrapperClass">
                      <div :class="timePanelEndpointToggleGroupClass">
                        <button
                          type="button"
                          :class="[timePanelEndpointToggleButtonClass, timePanelEndpointToggleButtonStateClass('start')]"
                          @click="setDateTimeEndpoint('start')"
                        >
                          Start
                        </button>
                        <button
                          type="button"
                          :class="[timePanelEndpointToggleButtonClass, timePanelEndpointToggleButtonStateClass('end')]"
                          @click="setDateTimeEndpoint('end')"
                        >
                          End
                        </button>
                      </div>
                    </div>
                    <p
                      v-if="shouldOverlayTimeFormatLabel"
                      :class="[timePanelFormatLabelClass, 'absolute right-0 top-0']"
                    >
                      {{ dateTimeFormatDescription }}
                    </p>
                    <div :class="timePanelHeaderActionsClass">
                      <div v-if="shouldShowInlineTimePanelEndpointToggle" :class="timePanelEndpointToggleGroupClass">
                        <button
                          type="button"
                          :class="[timePanelEndpointToggleButtonClass, timePanelEndpointToggleButtonStateClass('start')]"
                          @click="setDateTimeEndpoint('start')"
                        >
                          Start
                        </button>
                        <button
                          type="button"
                          :class="[timePanelEndpointToggleButtonClass, timePanelEndpointToggleButtonStateClass('end')]"
                          @click="setDateTimeEndpoint('end')"
                        >
                          End
                        </button>
                      </div>
                      <button
                        v-if="shouldShowHeaderTimePanelSwitchButton"
                        type="button"
                        :class="timePanelHeaderSwitchButtonClass"
                        @click="toggleTimePanel()"
                      >
                        {{ timePanelSwitchLabel }}
                      </button>
                      <p v-if="shouldShowInlineTimeFormatLabel" :class="timePanelFormatLabelClass">
                        {{ dateTimeFormatDescription }}
                      </p>
                    </div>
                  </div>
                  <div class="w-full min-w-0" :class="timePanelEndpointLayoutClass" :style="timePanelEndpointLayoutStyle">
                    <div
                      v-for="endpoint in visibleTimeEndpoints"
                      :key="`stacked-${endpoint}`"
                      class="vtd-time-endpoint min-w-0 flex flex-col gap-2"
                      :class="showDualRangeTimePanelsUi ? 'vtd-time-endpoint-dual h-full min-h-0 w-full overflow-hidden rounded-md border border-black/[.1] px-2 py-4 dark:border-vtd-secondary-700/[1]' : 'vtd-time-endpoint-single w-full'"
                    >
                      <template v-if="isTimePickerWheelStyle">
                        <div
                          class="vtd-time-wheel-grid mt-1.5 mb-1 grid min-h-0 auto-rows-[minmax(0,1fr)] items-stretch gap-2"
                          :class="[timeWheelGridColumnClass, showDualRangeTimePanelsUi ? 'vtd-time-wheel-grid-dual' : 'vtd-time-wheel-grid-single w-full']"
                        >
                          <VtdTimeWheel
                            ariaLabel="Hour wheel"
                                    :items="hourWheelOptions"
                            :model-value="getHourWheelValue(endpoint)"
                            :scrollMode="props.timeWheelScrollMode"
                            :fractionalOffset="getHourWheelFractionalOffset(endpoint)"
                            :disabled="!isDateTimeDraftReady(endpoint)"
                            @step="(payload) => onDateTimeHourWheelStep(payload, endpoint)"
                            @update:model-value="(value) => onDateTimeHourWheelUpdate(value, endpoint)"
                          />
                          <VtdTimeWheel
                            ariaLabel="Minute wheel"
                                    :items="minuteWheelOptions"
                            :model-value="getMinuteWheelValue(endpoint)"
                            :scrollMode="props.timeWheelScrollMode"
                            :fractionalOffset="getMinuteWheelFractionalOffset(endpoint)"
                            :disabled="!isDateTimeDraftReady(endpoint)"
                            @step="(payload) => onDateTimeMinuteWheelStep(payload, endpoint)"
                            @update:model-value="(value) => onDateTimeMinuteWheelUpdate(value, endpoint)"
                          />
                          <VtdTimeWheel
                            v-if="formatterTimeTokens.usesSeconds"
                            ariaLabel="Second wheel"
                                    :items="secondWheelOptions"
                            :model-value="getSecondWheelValue(endpoint)"
                            :scrollMode="props.timeWheelScrollMode"
                            :disabled="!isDateTimeDraftReady(endpoint)"
                            @step="(payload) => onDateTimeSecondWheelStep(payload, endpoint)"
                            @update:model-value="(value) => onDateTimeSecondWheelUpdate(value, endpoint)"
                          />
                          <VtdTimeWheel
                            v-if="formatterTimeTokens.uses12Hour"
                            ariaLabel="Meridiem wheel"
                            :items="meridiemWheelOptions"
                            :model-value="getMeridiemWheelValue(endpoint)"
                            :scrollMode="props.timeWheelScrollMode"
                            :fractionalOffset="getMeridiemWheelFractionalOffset(endpoint)"
                            :syncDirection="getMeridiemWheelSyncDirection(endpoint)"
                            :disabled="!isDateTimeDraftReady(endpoint)"
                            @update:model-value="(value) => onDateTimeMeridiemWheelUpdate(value, endpoint)"
                          />
                        </div>
                      </template>
                      <template v-else>
                        <input
                          :value="getDateTimeInputValue(endpoint)"
                          :placeholder="dateTimeInputPlaceholder"
                          type="text"
                          class="block w-full rounded-md border border-vtd-secondary-300 px-3 py-2 text-sm text-vtd-secondary-700 placeholder-vtd-secondary-400 focus:border-vtd-primary-300 focus:outline-none focus:ring focus:ring-vtd-primary-500 focus:ring-opacity-10 dark:border-vtd-secondary-700 dark:bg-vtd-secondary-800 dark:text-vtd-secondary-100 dark:placeholder-vtd-secondary-500 dark:focus:border-vtd-primary-500 dark:focus:ring-opacity-20"
                          :disabled="!isDateTimeDraftReady(endpoint)"
                          @input="(event) => onDateTimeInput(event, endpoint)"
                        >
                      </template>
                      <p v-if="getDateTimeValidationMessage(endpoint)" class="w-full min-w-0 break-words whitespace-normal [overflow-wrap:anywhere] mt-2 text-xs text-red-600 dark:text-red-400">
                        {{ getDateTimeValidationMessage(endpoint) }}
                      </p>
                    </div>
                  </div>
                  <p v-if="formatterTimeTokenErrorMessage" class="w-full min-w-0 break-words whitespace-normal [overflow-wrap:anywhere] mt-2 text-xs text-red-600 dark:text-red-400">
                    {{ formatterTimeTokenErrorMessage }}
                  </p>
                  <p v-else-if="panelLevelDateTimeErrorMessage" class="w-full min-w-0 break-words whitespace-normal [overflow-wrap:anywhere] mt-2 text-xs text-red-600 dark:text-red-400">
                    {{ panelLevelDateTimeErrorMessage }}
                  </p>
                </div>
              </div>
              <div v-if="showApplyFooter">
                <div class="mt-2 mx-2 py-1.5 border-t border-black/[.1] dark:border-vtd-secondary-700/[1]">
                  <div class="mt-1.5 sm:flex sm:flex-row-reverse">
                    <button type="button"
                      class="away-apply-picker w-full transition ease-out duration-300 inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-vtd-primary-600 text-base font-medium text-white hover:bg-vtd-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-vtd-primary-500 sm:ml-3 sm:w-auto sm:text-sm dark:ring-offset-vtd-secondary-800 disabled:cursor-not-allowed"
                      :disabled="isApplyButtonDisabled()" @click="applyDate(close)" v-text="props.options.footer.apply" />
                    <button
                      v-if="canToggleTimePanel || shouldShowTimePanelSwitchButton"
                      type="button"
                      class="mt-3 away-cancel-picker w-full transition ease-out duration-300 inline-flex justify-center rounded-md border border-vtd-secondary-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-vtd-secondary-700 hover:bg-vtd-secondary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-vtd-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:ring-offset-vtd-secondary-800"
                      @click="toggleTimePanel()"
                    >
                      {{ timePanelSwitchLabel }}
                    </button>
                    <button type="button"
                      class="mt-3 away-cancel-picker w-full transition ease-out duration-300 inline-flex justify-center rounded-md border border-vtd-secondary-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-vtd-secondary-700 hover:bg-vtd-secondary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-vtd-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:ring-offset-vtd-secondary-800"
                      @click="closePopover(close)" v-text="props.options.footer.cancel" />
                  </div>
                </div>
              </div>
              <div v-else-if="showMobileCancelFooter" class="sm:hidden">
                <div class="mt-2 mx-2 py-1.5 border-t border-black/[.1] dark:border-vtd-secondary-700/[1]">
                  <div class="mt-1.5 sm:flex sm:flex-row-reverse">
                    <button type="button"
                      class="away-cancel-picker w-full transition ease-out duration-300 inline-flex justify-center rounded-md border border-vtd-secondary-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-vtd-secondary-700 hover:bg-vtd-secondary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-vtd-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:ring-offset-vtd-secondary-800"
                      @click="closePopover(close)" v-text="props.options.footer.cancel" />
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
      :class="[
        props.selectorMode && props.asSingle ? 'sm:w-[28.5rem]' : '',
        useLegacyNoTimeSelectorHeightClamp ? 'sm:h-[23.5rem]' : '',
        collapseDualRangeInlineRightTimePanel ? 'sm:min-w-[78rem]' : '',
      ]"
      @keydown.capture="onPickerPanelKeydown"
      @focusin.capture="onTimeWheelInteraction"
      @pointerdown.capture="onTimeWheelInteraction">
      <div class="flex flex-wrap lg:flex-nowrap" :class="useLegacyNoTimeSelectorHeightClamp ? 'sm:h-full' : ''">
        <VtdShortcut v-if="props.shortcuts" :shortcuts="props.shortcuts" :as-range="asRange()" :as-single="props.asSingle"
          :built-in-shortcuts="builtInShortcutItems">
          <template #shortcut-item="slotProps">
            <slot name="shortcut-item" v-bind="slotProps" />
          </template>
        </VtdShortcut>
        <div
          ref="VtdPanelContentRef"
          class="relative flex flex-wrap sm:flex-nowrap p-1 w-full"
          :class="[
            useLegacyNoTimeSelectorHeightClamp ? 'sm:h-full' : '',
            showAnyInlineTimePanel ? 'sm:flex-1 sm:min-w-0' : 'sm:w-auto',
          ]"
          :style="panelContentLockStyle"
        >
          <template v-if="shouldShowDatePanels">
            <div v-if="asRange() && !props.asSingle && !collapseDualRangeInlineRightTimePanel"
            class="hidden h-full absolute inset-0 sm:flex justify-center items-center">
              <div class="h-full border-r border-black/[.1] dark:border-vtd-secondary-700/[1]" />
            </div>
            <div class="relative w-full" data-vtd-selector-panel="previous" :class="{
              'mb-3 sm:mb-0 sm:mr-2 md:w-1/2 lg:w-80': asRange() && !props.asSingle && !showInlineTimePanelInline,
              'mb-3 sm:mb-0 sm:mr-2 md:flex-1 md:min-w-0 lg:w-auto': asRange() && !props.asSingle && showInlineTimePanelInline,
              'lg:w-80': props.asSingle && !!props.shortcuts,
              'sm:min-h-[21.75rem]': props.asSingle && !props.selectorMode && !showInlineTimePanelInline,
              'sm:h-full': useLegacyNoTimeSelectorHeightClamp,
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
              'sm:min-h-[17.75rem]': props.selectorMode,
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
                      panel-name="previous"
                      :years="selectorYears"
                      selector-mode
                      :direct-year-input="props.directYearInput"
                      :selected-month="getPanelSelectedMonth('previous')"
                      :selected-year="getPanelSelectedYear('previous')"
                      :selector-focus="selectorFocus"
                      :year-numbering-mode="props.yearNumberingMode"
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
            class="relative w-full mt-3 sm:mt-0 sm:ml-2"
            :class="{
              'md:w-1/2 lg:w-80': asRange() && !props.asSingle && !showInlineTimePanelInline,
              'md:flex-1 md:min-w-0 lg:w-auto': asRange() && !props.asSingle && showInlineTimePanelInline,
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
              'sm:min-h-[17.75rem]': props.selectorMode,
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
                      panel-name="next"
                      :years="selectorYears"
                      selector-mode
                      :direct-year-input="props.directYearInput"
                      :selected-month="getPanelSelectedMonth('next')"
                      :selected-year="getPanelSelectedYear('next')"
                      :selector-focus="selectorFocus"
                      :year-numbering-mode="props.yearNumberingMode"
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
          </template>
          <template v-if="shouldRenderInlineTimePanels">
            <div
              v-show="showPageTimePanelInline || showInlineTimePanelInline"
              class="w-full min-w-0 sm:flex-1 px-0.5 sm:px-2 flex flex-col sm:h-full"
              @focusin.capture="onTimeWheelInteraction"
              @pointerdown.capture="onTimeWheelInteraction"
            >
              <div class="mt-2 w-full min-w-0 rounded-md border border-black/[.08] p-2 dark:border-vtd-secondary-700/[1]"
                :class="timePanelFillClass">
                <div class="flex flex-col gap-2" :class="shouldUseFillTimePanelLayout ? 'h-full' : ''">
                  <div :class="timePanelHeaderRowClass">
                    <p
                      v-if="!showDualRangeTimePanelsUi"
                      class="shrink-0 whitespace-nowrap text-xs font-medium text-vtd-secondary-700 dark:text-vtd-secondary-200"
                    >
                      {{ timePanelSingleEndpointTitle }}
                    </p>
                    <div
                      v-if="showDualRangeTimePanelsUi"
                      :class="timePanelDualEndpointLabelsClass"
                    >
                      <p :class="timePanelDualEndpointLabelTextClass">
                        Start time
                      </p>
                      <p :class="timePanelDualEndpointLabelTextClass">
                        End time
                      </p>
                    </div>
                    <div v-if="shouldCenterTimePanelEndpointToggle" data-vtd-time-endpoint-toggle-centered :class="timePanelCenteredToggleWrapperClass">
                      <div :class="timePanelEndpointToggleGroupClass">
                        <button
                          type="button"
                          :class="[timePanelEndpointToggleButtonClass, timePanelEndpointToggleButtonStateClass('start')]"
                          @click="setDateTimeEndpoint('start')"
                        >
                          Start
                        </button>
                        <button
                          type="button"
                          :class="[timePanelEndpointToggleButtonClass, timePanelEndpointToggleButtonStateClass('end')]"
                          @click="setDateTimeEndpoint('end')"
                        >
                          End
                        </button>
                      </div>
                    </div>
                    <p
                      v-if="shouldOverlayTimeFormatLabel"
                      :class="[timePanelFormatLabelClass, 'absolute right-0 top-0']"
                    >
                      {{ dateTimeFormatDescription }}
                    </p>
                    <div :class="timePanelHeaderActionsClass">
                      <div v-if="shouldShowInlineTimePanelEndpointToggle" :class="timePanelEndpointToggleGroupClass">
                        <button
                          type="button"
                          :class="[timePanelEndpointToggleButtonClass, timePanelEndpointToggleButtonStateClass('start')]"
                          @click="setDateTimeEndpoint('start')"
                        >
                          Start
                        </button>
                        <button
                          type="button"
                          :class="[timePanelEndpointToggleButtonClass, timePanelEndpointToggleButtonStateClass('end')]"
                          @click="setDateTimeEndpoint('end')"
                        >
                          End
                        </button>
                      </div>
                      <button
                        v-if="shouldShowHeaderTimePanelSwitchButton"
                        type="button"
                        :class="timePanelHeaderSwitchButtonClass"
                        @click="toggleTimePanel()"
                      >
                        {{ timePanelSwitchLabel }}
                      </button>
                      <p v-if="shouldShowInlineTimeFormatLabel" :class="timePanelFormatLabelClass">
                        {{ dateTimeFormatDescription }}
                      </p>
                    </div>
                  </div>
                  <div class="w-full min-w-0" :class="timePanelEndpointLayoutClass" :style="timePanelEndpointLayoutStyle">
                    <div
                      v-for="endpoint in visibleTimeEndpoints"
                      :key="`static-inline-${endpoint}`"
                      class="vtd-time-endpoint min-w-0 flex flex-col gap-2"
                      :class="showDualRangeTimePanelsUi ? 'vtd-time-endpoint-dual h-full min-h-0 w-full overflow-hidden rounded-md border border-black/[.1] px-2 py-4 dark:border-vtd-secondary-700/[1]' : 'vtd-time-endpoint-single w-full'"
                    >
                      <template v-if="isTimePickerWheelStyle">
                        <div
                          class="vtd-time-wheel-grid mt-1.5 mb-1 grid min-h-0 auto-rows-[minmax(0,1fr)] items-stretch gap-2"
                          :class="[timeWheelGridColumnClass, showDualRangeTimePanelsUi ? 'vtd-time-wheel-grid-dual' : 'vtd-time-wheel-grid-single w-full']"
                        >
                          <VtdTimeWheel
                            ariaLabel="Hour wheel"
                                    :items="hourWheelOptions"
                            :model-value="getHourWheelValue(endpoint)"
                            :scrollMode="props.timeWheelScrollMode"
                            :fractionalOffset="getHourWheelFractionalOffset(endpoint)"
                            :disabled="!isDateTimeDraftReady(endpoint)"
                            @step="(payload) => onDateTimeHourWheelStep(payload, endpoint)"
                            @update:model-value="(value) => onDateTimeHourWheelUpdate(value, endpoint)"
                          />
                          <VtdTimeWheel
                            ariaLabel="Minute wheel"
                                    :items="minuteWheelOptions"
                            :model-value="getMinuteWheelValue(endpoint)"
                            :scrollMode="props.timeWheelScrollMode"
                            :fractionalOffset="getMinuteWheelFractionalOffset(endpoint)"
                            :disabled="!isDateTimeDraftReady(endpoint)"
                            @step="(payload) => onDateTimeMinuteWheelStep(payload, endpoint)"
                            @update:model-value="(value) => onDateTimeMinuteWheelUpdate(value, endpoint)"
                          />
                          <VtdTimeWheel
                            v-if="formatterTimeTokens.usesSeconds"
                            ariaLabel="Second wheel"
                                    :items="secondWheelOptions"
                            :model-value="getSecondWheelValue(endpoint)"
                            :scrollMode="props.timeWheelScrollMode"
                            :disabled="!isDateTimeDraftReady(endpoint)"
                            @step="(payload) => onDateTimeSecondWheelStep(payload, endpoint)"
                            @update:model-value="(value) => onDateTimeSecondWheelUpdate(value, endpoint)"
                          />
                          <VtdTimeWheel
                            v-if="formatterTimeTokens.uses12Hour"
                            ariaLabel="Meridiem wheel"
                            :items="meridiemWheelOptions"
                            :model-value="getMeridiemWheelValue(endpoint)"
                            :scrollMode="props.timeWheelScrollMode"
                            :fractionalOffset="getMeridiemWheelFractionalOffset(endpoint)"
                            :syncDirection="getMeridiemWheelSyncDirection(endpoint)"
                            :disabled="!isDateTimeDraftReady(endpoint)"
                            @update:model-value="(value) => onDateTimeMeridiemWheelUpdate(value, endpoint)"
                          />
                        </div>
                      </template>
                      <template v-else>
                        <input
                          :value="getDateTimeInputValue(endpoint)"
                          :placeholder="dateTimeInputPlaceholder"
                          type="text"
                          class="block w-full rounded-md border border-vtd-secondary-300 px-3 py-2 text-sm text-vtd-secondary-700 placeholder-vtd-secondary-400 focus:border-vtd-primary-300 focus:outline-none focus:ring focus:ring-vtd-primary-500 focus:ring-opacity-10 dark:border-vtd-secondary-700 dark:bg-vtd-secondary-800 dark:text-vtd-secondary-100 dark:placeholder-vtd-secondary-500 dark:focus:border-vtd-primary-500 dark:focus:ring-opacity-20"
                          :disabled="!isDateTimeDraftReady(endpoint)"
                          @input="(event) => onDateTimeInput(event, endpoint)"
                        >
                      </template>
                      <p v-if="getDateTimeValidationMessage(endpoint)" class="w-full min-w-0 break-words whitespace-normal [overflow-wrap:anywhere] mt-2 text-xs text-red-600 dark:text-red-400">
                        {{ getDateTimeValidationMessage(endpoint) }}
                      </p>
                    </div>
                  </div>
                  <p v-if="formatterTimeTokenErrorMessage" class="w-full min-w-0 break-words whitespace-normal [overflow-wrap:anywhere] mt-2 text-xs text-red-600 dark:text-red-400">
                    {{ formatterTimeTokenErrorMessage }}
                  </p>
                  <p v-else-if="panelLevelDateTimeErrorMessage" class="w-full min-w-0 break-words whitespace-normal [overflow-wrap:anywhere] mt-2 text-xs text-red-600 dark:text-red-400">
                    {{ panelLevelDateTimeErrorMessage }}
                  </p>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
      <div v-if="showStackedDateTimeControls" class="mt-2 mx-2 py-1.5 border-t border-black/[.1] dark:border-vtd-secondary-700/[1]">
        <div class="mt-1.5 w-full min-w-0 flex flex-col gap-2">
          <div :class="timePanelHeaderRowClass">
            <p
              v-if="!showDualRangeTimePanelsUi"
              class="shrink-0 whitespace-nowrap text-xs font-medium text-vtd-secondary-700 dark:text-vtd-secondary-200"
            >
              {{ timePanelSingleEndpointTitle }}
            </p>
            <div
              v-if="showDualRangeTimePanelsUi"
              :class="timePanelDualEndpointLabelsClass"
            >
              <p :class="timePanelDualEndpointLabelTextClass">
                Start time
              </p>
              <p :class="timePanelDualEndpointLabelTextClass">
                End time
              </p>
            </div>
            <div v-if="shouldCenterTimePanelEndpointToggle" data-vtd-time-endpoint-toggle-centered :class="timePanelCenteredToggleWrapperClass">
              <div :class="timePanelEndpointToggleGroupClass">
                <button
                  type="button"
                  :class="[timePanelEndpointToggleButtonClass, timePanelEndpointToggleButtonStateClass('start')]"
                  @click="setDateTimeEndpoint('start')"
                >
                  Start
                </button>
                <button
                  type="button"
                  :class="[timePanelEndpointToggleButtonClass, timePanelEndpointToggleButtonStateClass('end')]"
                  @click="setDateTimeEndpoint('end')"
                >
                  End
                </button>
              </div>
            </div>
            <p
              v-if="shouldOverlayTimeFormatLabel"
              :class="[timePanelFormatLabelClass, 'absolute right-0 top-0']"
            >
              {{ dateTimeFormatDescription }}
            </p>
            <div :class="timePanelHeaderActionsClass">
              <div v-if="shouldShowInlineTimePanelEndpointToggle" :class="timePanelEndpointToggleGroupClass">
                <button
                  type="button"
                  :class="[timePanelEndpointToggleButtonClass, timePanelEndpointToggleButtonStateClass('start')]"
                  @click="setDateTimeEndpoint('start')"
                >
                  Start
                </button>
                <button
                  type="button"
                  :class="[timePanelEndpointToggleButtonClass, timePanelEndpointToggleButtonStateClass('end')]"
                  @click="setDateTimeEndpoint('end')"
                >
                  End
                </button>
              </div>
              <button
                v-if="shouldShowHeaderTimePanelSwitchButton"
                type="button"
                :class="timePanelHeaderSwitchButtonClass"
                @click="toggleTimePanel()"
              >
                {{ timePanelSwitchLabel }}
              </button>
              <p v-if="shouldShowInlineTimeFormatLabel" :class="timePanelFormatLabelClass">
                {{ dateTimeFormatDescription }}
              </p>
            </div>
          </div>
          <div class="w-full min-w-0" :class="timePanelEndpointLayoutClass" :style="timePanelEndpointLayoutStyle">
            <div
              v-for="endpoint in visibleTimeEndpoints"
              :key="`static-stacked-${endpoint}`"
              class="vtd-time-endpoint min-w-0 flex flex-col gap-2"
              :class="showDualRangeTimePanelsUi ? 'vtd-time-endpoint-dual h-full min-h-0 w-full overflow-hidden rounded-md border border-black/[.1] px-2 py-4 dark:border-vtd-secondary-700/[1]' : 'vtd-time-endpoint-single w-full'"
            >
              <template v-if="isTimePickerWheelStyle">
                <div
                  class="vtd-time-wheel-grid mt-1.5 mb-1 grid min-h-0 auto-rows-[minmax(0,1fr)] items-stretch gap-2"
                  :class="[timeWheelGridColumnClass, showDualRangeTimePanelsUi ? 'vtd-time-wheel-grid-dual' : 'vtd-time-wheel-grid-single w-full']"
                >
                  <VtdTimeWheel
                    ariaLabel="Hour wheel"
                                    :items="hourWheelOptions"
                    :model-value="getHourWheelValue(endpoint)"
                    :scrollMode="props.timeWheelScrollMode"
                    :fractionalOffset="getHourWheelFractionalOffset(endpoint)"
                    :disabled="!isDateTimeDraftReady(endpoint)"
                    @step="(payload) => onDateTimeHourWheelStep(payload, endpoint)"
                    @update:model-value="(value) => onDateTimeHourWheelUpdate(value, endpoint)"
                  />
                  <VtdTimeWheel
                    ariaLabel="Minute wheel"
                                    :items="minuteWheelOptions"
                    :model-value="getMinuteWheelValue(endpoint)"
                    :scrollMode="props.timeWheelScrollMode"
                    :fractionalOffset="getMinuteWheelFractionalOffset(endpoint)"
                    :disabled="!isDateTimeDraftReady(endpoint)"
                    @step="(payload) => onDateTimeMinuteWheelStep(payload, endpoint)"
                    @update:model-value="(value) => onDateTimeMinuteWheelUpdate(value, endpoint)"
                  />
                  <VtdTimeWheel
                    v-if="formatterTimeTokens.usesSeconds"
                    ariaLabel="Second wheel"
                                    :items="secondWheelOptions"
                    :model-value="getSecondWheelValue(endpoint)"
                    :scrollMode="props.timeWheelScrollMode"
                    :disabled="!isDateTimeDraftReady(endpoint)"
                    @step="(payload) => onDateTimeSecondWheelStep(payload, endpoint)"
                    @update:model-value="(value) => onDateTimeSecondWheelUpdate(value, endpoint)"
                  />
                  <VtdTimeWheel
                    v-if="formatterTimeTokens.uses12Hour"
                    ariaLabel="Meridiem wheel"
                    :items="meridiemWheelOptions"
                    :model-value="getMeridiemWheelValue(endpoint)"
                    :scrollMode="props.timeWheelScrollMode"
                    :fractionalOffset="getMeridiemWheelFractionalOffset(endpoint)"
                    :syncDirection="getMeridiemWheelSyncDirection(endpoint)"
                    :disabled="!isDateTimeDraftReady(endpoint)"
                    @update:model-value="(value) => onDateTimeMeridiemWheelUpdate(value, endpoint)"
                  />
                </div>
              </template>
              <template v-else>
                <input
                  :value="getDateTimeInputValue(endpoint)"
                  :placeholder="dateTimeInputPlaceholder"
                  type="text"
                  class="block w-full rounded-md border border-vtd-secondary-300 px-3 py-2 text-sm text-vtd-secondary-700 placeholder-vtd-secondary-400 focus:border-vtd-primary-300 focus:outline-none focus:ring focus:ring-vtd-primary-500 focus:ring-opacity-10 dark:border-vtd-secondary-700 dark:bg-vtd-secondary-800 dark:text-vtd-secondary-100 dark:placeholder-vtd-secondary-500 dark:focus:border-vtd-primary-500 dark:focus:ring-opacity-20"
                  :disabled="!isDateTimeDraftReady(endpoint)"
                  @input="(event) => onDateTimeInput(event, endpoint)"
                >
              </template>
              <p v-if="getDateTimeValidationMessage(endpoint)" class="w-full min-w-0 break-words whitespace-normal [overflow-wrap:anywhere] mt-2 text-xs text-red-600 dark:text-red-400">
                {{ getDateTimeValidationMessage(endpoint) }}
              </p>
            </div>
          </div>
          <p v-if="formatterTimeTokenErrorMessage" class="w-full min-w-0 break-words whitespace-normal [overflow-wrap:anywhere] mt-2 text-xs text-red-600 dark:text-red-400">
            {{ formatterTimeTokenErrorMessage }}
          </p>
          <p v-else-if="panelLevelDateTimeErrorMessage" class="w-full min-w-0 break-words whitespace-normal [overflow-wrap:anywhere] mt-2 text-xs text-red-600 dark:text-red-400">
            {{ panelLevelDateTimeErrorMessage }}
          </p>
        </div>
      </div>
      <div v-if="showApplyFooter">
        <div class="mt-2 mx-2 py-1.5 border-t border-black/[.1] dark:border-vtd-secondary-700/[1]">
          <div class="mt-1.5 sm:flex sm:flex-row-reverse">
            <button type="button"
              class="away-apply-picker w-full transition ease-out duration-300 inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-vtd-primary-600 text-base font-medium text-white hover:bg-vtd-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-vtd-primary-500 sm:ml-3 sm:w-auto sm:text-sm dark:ring-offset-vtd-secondary-800 disabled:cursor-not-allowed"
              :disabled="isApplyButtonDisabled()" @click="applyDate()" v-text="props.options.footer.apply" />
            <button
              v-if="canToggleTimePanel || shouldShowTimePanelSwitchButton"
              type="button"
              class="mt-3 away-cancel-picker w-full transition ease-out duration-300 inline-flex justify-center rounded-md border border-vtd-secondary-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-vtd-secondary-700 hover:bg-vtd-secondary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-vtd-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:ring-offset-vtd-secondary-800"
              @click="toggleTimePanel()"
            >
              {{ timePanelSwitchLabel }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
@import "tailwindcss";
@import "./index.css";

.vtd-time-panel-fill {
  @apply h-full;
}

.vtd-time-panel-fill .vtd-time-endpoint {
  @apply min-h-0;
}

.vtd-time-panel-fill .vtd-time-endpoint-dual {
  @apply flex-1 h-full min-h-0;
}

.vtd-time-panel-fill .vtd-time-endpoint-single {
  @apply flex-1 h-full min-h-0 w-full;
}

.vtd-time-panel-fill .vtd-time-wheel-grid-dual {
  @apply flex-1 h-full min-h-0;
}

.vtd-time-panel-fill .vtd-time-wheel-grid-single {
  @apply flex-1 min-h-0 w-full;
}

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
