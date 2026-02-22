<script setup lang="ts">
import type { InvalidShortcutEventPayload } from './types'
import dayjs, { type Dayjs } from 'dayjs'
import { computed, onUnmounted, ref, watch } from 'vue'
import VueTailwindDatePicker from './VueTailwindDatePicker.vue'

const dateValue = ref({
  startDate: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  endDate: dayjs().format('YYYY-MM-DD HH:mm:ss'),
})
const selectorModeValue = ref({
  startDate: dayjs().subtract(3, 'month').format('YYYY-MM-DD HH:mm:ss'),
  endDate: dayjs().add(3, 'month').format('YYYY-MM-DD HH:mm:ss'),
})
const selectorSingleRangeValue = ref({
  startDate: dayjs().subtract(10, 'day').format('YYYY-MM-DD HH:mm:ss'),
  endDate: dayjs().add(10, 'day').format('YYYY-MM-DD HH:mm:ss'),
})
const selectorSingleRangeFractionalValue = ref({
  startDate: dayjs().subtract(10, 'day').format('YYYY-MM-DD HH:mm:ss'),
  endDate: dayjs().add(10, 'day').format('YYYY-MM-DD HH:mm:ss'),
})
const selectorModeWheelRangeValue = ref({
  startDate: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
  endDate: dayjs().add(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
})
const selectorModeWheelRangeNoSidepanelValue = ref({
  startDate: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss'),
  endDate: dayjs().add(2, 'day').format('YYYY-MM-DD HH:mm:ss'),
})
const selectorDisabledValue = ref(dayjs().format('YYYY-MM-DD HH:mm:ss'))
const selectorEmptyModelValue = ref('')
const selectorInvalidModelValue = ref('not-a-date ~ not-a-date')
const singleDateValue = ref(dayjs().format('YYYY-MM-DD HH:mm:ss'))
function monthRangeValue(offsetMonths = 0) {
  const current = dayjs().add(offsetMonths, 'month')
  return {
    startDate: current.startOf('month').format('YYYY-MM-DD HH:mm:ss'),
    endDate: current.endOf('month').format('YYYY-MM-DD HH:mm:ss'),
  }
}

const weekendTintEnValue = ref(monthRangeValue(0))
const weekendTintDeValue = ref(monthRangeValue(1))
const weekendSelectorTintValue = ref(monthRangeValue(0))
const shortcutSuccessDemoValue = ref(
  `${dayjs().format('YYYY-MM-DD HH:mm:ss')} ~ ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`,
)
const shortcutInvalidDemoValue = ref(
  `${dayjs().format('YYYY-MM-DD HH:mm:ss')} ~ ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`,
)
const shortcutDisabledDemoValue = ref(
  `${dayjs().format('YYYY-MM-DD HH:mm:ss')} ~ ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`,
)
const shortcutFailureLog = ref<string[]>([])
const compatibilityDateOnlyValue = ref(dayjs().format('YYYY-MM-DD'))
const compatibilityDateTimeValue = ref(dayjs().format('YYYY-MM-DD'))
const wheelInlineValue = ref(dayjs().format('YYYY-MM-DD HH:mm:ss'))
const wheelInlineBoundaryValue = ref(dayjs().format('YYYY-MM-DD HH:mm:ss'))
const wheelToggleValue = ref(dayjs().format('YYYY-MM-DD hh:mm A'))
const wheelToggleSecondsValue = ref(dayjs().format('YYYY-MM-DD HH:mm:ss'))
const allFeaturesValue = ref({
  startDate: dayjs().subtract(4, 'day').format('YYYY-MM-DD hh:mm:ss A'),
  endDate: dayjs().add(6, 'day').format('YYYY-MM-DD hh:mm:ss A'),
})
const allFeaturesWeekendTintEnabled = ref(true)
const allFeaturesSinglePanelRange = ref(true)
const allFeaturesSelectorStyle = ref<'wheel' | 'page'>('wheel')
const allFeaturesTimePickerStyle = ref<'none' | 'input' | 'wheel-page' | 'wheel-inline'>('wheel-page')
const allFeaturesTimeInlinePosition = ref<'below' | 'right'>('below')
const allFeaturesTimePageMode = ref<'toggle' | 'after-date'>('toggle')
const allFeaturesTimeWheelScrollMode = ref<'boundary' | 'fractional'>('fractional')
const allFeaturesTimeWheelFormat = ref<'HH:mm' | 'hh:mm A' | 'HH:mm:ss' | 'hh:mm:ss A'>('hh:mm:ss A')
const allFeaturesCloseOnRangeSelection = ref(false)
const allFeaturesDirectYearInput = ref(true)
const allFeaturesPopoverTransition = ref(true)
const allFeaturesPopoverRestoreFocus = ref(false)
const allFeaturesYearNumberingMode = ref<'historical' | 'astronomical'>('historical')
const allFeaturesShortcutsMode = ref<'off' | 'preset' | 'legacy' | 'custom'>('custom')
const allFeaturesOpenFocusTarget = ref<'input' | 'calendar'>('input')
const allFeaturesDebugInstrumentation = ref(false)
const allFeaturesUsesWheelPicker = computed(() => {
  return (
    allFeaturesTimePickerStyle.value === 'wheel-page'
    || allFeaturesTimePickerStyle.value === 'wheel-inline'
  )
})
const allFeaturesWheelControlsDisabled = computed(() => !allFeaturesUsesWheelPicker.value)
const allFeaturesSelectClass = 'w-full rounded border border-blue-300 bg-white px-2 py-1.5 text-xs text-blue-900'
const allFeaturesSelectClassWithDisabled = `${allFeaturesSelectClass} disabled:opacity-50 disabled:cursor-not-allowed`
// TODO(time-wheel-settings): add playground controls for
// - timeWheelPageJump / timeWheelPageShiftJump
// - timeWheelHomeJump / timeWheelEndJump
// - timeWheelWrap
// - timeWheelStepButtons
// - timeWheelLinkedCarry
// - timeAutoSwitchEndpoint
// - timeCloseOnComplete
// - timeWheelColumnMinWidth
const allFeaturesFormatterDate = computed(() => `YYYY-MM-DD ${allFeaturesTimeWheelFormat.value}`)
const allFeaturesKnownDateFormats = [
  'YYYY-MM-DD HH:mm',
  'YYYY-MM-DD hh:mm A',
  'YYYY-MM-DD HH:mm:ss',
  'YYYY-MM-DD hh:mm:ss A',
]

function parseAllFeaturesDate(value: unknown) {
  if (dayjs.isDayjs(value))
    return value
  if (value instanceof Date)
    return dayjs(value)
  if (typeof value === 'string') {
    for (const format of allFeaturesKnownDateFormats) {
      const parsed = dayjs(value, format, true)
      if (parsed.isValid())
        return parsed
    }
  }
  const parsed = dayjs(value as string | number | Date)
  return parsed.isValid() ? parsed : dayjs()
}

watch(
  allFeaturesTimeWheelFormat,
  () => {
    const startDate = parseAllFeaturesDate(allFeaturesValue.value.startDate)
    const endDate = parseAllFeaturesDate(allFeaturesValue.value.endDate)
    allFeaturesValue.value = {
      startDate: startDate.format(allFeaturesFormatterDate.value),
      endDate: endDate.format(allFeaturesFormatterDate.value),
    }
  },
  { immediate: true },
)
const allFeaturesDemoShortcuts = [
  {
    id: 'today',
    label: 'Today',
    resolver: ({ now }: { now: Date }) => new Date(now),
  },
  {
    id: 'next-3-business-days',
    label: '3 business days',
    resolver: ({ now }: { now: Date }) => {
      const date = new Date(now)
      let remaining = 3
      while (remaining > 0) {
        date.setDate(date.getDate() + 1)
        const weekday = date.getDay()
        if (weekday !== 0 && weekday !== 6)
          remaining -= 1
      }
      return date
    },
  },
  {
    id: 'next-week',
    label: 'Next week',
    resolver: ({ now }: { now: Date }) => {
      const date = new Date(now)
      date.setDate(date.getDate() + 7)
      return date
    },
  },
  {
    id: 'next-month',
    label: 'Next month',
    resolver: ({ now }: { now: Date }) => {
      const current = dayjs(now)
      return current.add(1, 'month').toDate()
    },
  },
  {
    id: 'highlight-next-week-range',
    label: 'Highlight next week range',
    resolver: ({ now, mode }: { now: Date, mode: 'single' | 'range' }) => {
      const nextWeekStart = dayjs(now).add(1, 'week').startOf('week')
      const nextWeekEnd = nextWeekStart.endOf('week')
      if (mode === 'range')
        return [nextWeekStart.toDate(), nextWeekEnd.toDate()] as [Date, Date]
      return nextWeekStart.toDate()
    },
  },
]
const allFeaturesShortcutPreset = computed(() => {
  if (allFeaturesShortcutsMode.value === 'preset')
    return 'modern'
  if (allFeaturesShortcutsMode.value === 'legacy')
    return 'legacy'
  return 'legacy'
})
const allFeaturesShortcutsProp = computed(() => {
  if (allFeaturesShortcutsMode.value === 'off')
    return false
  if (allFeaturesShortcutsMode.value === 'preset' || allFeaturesShortcutsMode.value === 'legacy')
    return true
  return allFeaturesDemoShortcuts
})

const currentLocale = ref('en')
const localeOptions = [
  { code: 'en', flag: '🇺🇸' },
  { code: 'es', flag: '🇪🇸' },
  { code: 'de', flag: '🇩🇪' },
]
const isDark = ref(false)

interface VtdPerfStore {
  frameGaps: Array<{
    at: number
    gapMs: number
    lastUserType: string
    sinceLastUserMs: number
    lastUserTarget: string
    activeElement: string
  }>
  longTasks: Array<{
    at: number
    durationMs: number
    name: string
  }>
}

function getRuntimeWindow() {
  return window as Window & {
    __VTD_DEBUG_ENABLED__?: boolean
    __VTD_DEBUG__?: {
      mountedCount?: number
      events?: Array<{
        at?: number
        type?: string
        instance?: string
        payload?: Record<string, unknown>
      }>
    }
    __VTD_PERF__?: VtdPerfStore
  }
}

function getPerfStore() {
  if (typeof window === 'undefined')
    return null
  const runtimeWindow = getRuntimeWindow()
  if (!runtimeWindow.__VTD_PERF__) {
    runtimeWindow.__VTD_PERF__ = {
      frameGaps: [],
      longTasks: [],
    }
  }
  return runtimeWindow.__VTD_PERF__
}

function describeActiveElementForPerf() {
  if (typeof document === 'undefined')
    return 'none'
  const active = document.activeElement
  if (!(active instanceof HTMLElement))
    return 'none'
  const id = active.id ? `#${active.id}` : ''
  const className
    = typeof active.className === 'string' && active.className.trim().length > 0
      ? `.${active.className.trim().split(/\s+/).slice(0, 2).join('.')}`
      : ''
  return `${active.tagName.toLowerCase()}${id}${className}`
}

let perfRafId: number | null = null
let lastRafAt = 0
let lastUserEventAt = 0
let lastUserEventType = 'none'
let lastUserEventTarget = 'none'
let longTaskObserver: PerformanceObserver | null = null
let perfTrackingEnabled = false

function trackUserEvent(event: Event) {
  lastUserEventAt = performance.now()
  lastUserEventType = event.type
  if (event.target instanceof HTMLElement)
    lastUserEventTarget = event.target.tagName.toLowerCase()
  else
    lastUserEventTarget = 'unknown'
}

function trackFrameGap(now: number) {
  const store = getPerfStore()
  if (!store)
    return
  if (lastRafAt > 0) {
    const gapMs = now - lastRafAt
    if (gapMs >= 120) {
      const sinceLastUserMs = lastUserEventAt > 0 ? now - lastUserEventAt : Number.POSITIVE_INFINITY
      store.frameGaps.push({
        at: now,
        gapMs: Number(gapMs.toFixed(2)),
        lastUserType: lastUserEventType,
        sinceLastUserMs: Number(sinceLastUserMs.toFixed(2)),
        lastUserTarget: lastUserEventTarget,
        activeElement: describeActiveElementForPerf(),
      })
      if (store.frameGaps.length > 200)
        store.frameGaps.splice(0, store.frameGaps.length - 200)
    }
  }
  lastRafAt = now
  perfRafId = requestAnimationFrame(trackFrameGap)
}

const shortcutSuccessDemoShortcuts = [
  {
    id: 'next-3-business-days',
    label: 'Next 3 business days',
    meta: { hint: 'custom typed' },
    resolver: ({ now }: { now: Date }) => {
      const date = new Date(now)
      let remaining = 3
      while (remaining > 0) {
        date.setDate(date.getDate() + 1)
        const weekday = date.getDay()
        if (weekday !== 0 && weekday !== 6)
          remaining -= 1
      }
      return date
    },
  },
]

const shortcutInvalidDemoShortcuts = [
  {
    id: 'typed-range-invalid-single',
    label: 'Trigger invalid result',
    meta: { hint: 'invalid demo' },
    resolver: () => null as unknown as Date,
  },
]

const shortcutDisabledDemoShortcuts = [
  {
    id: 'always-disabled',
    label: 'Always disabled',
    disabled: true,
    resolver: ({ now }: { now: Date }) => new Date(now),
  },
  {
    id: 'next-saturday-blocked',
    label: 'Next Saturday (blocked)',
    resolver: ({ now }: { now: Date }) => {
      const date = new Date(now)
      const weekday = date.getDay()
      const delta = ((6 - weekday + 7) % 7) || 7
      date.setDate(date.getDate() + delta)
      return date
    },
  },
  {
    id: 'next-business-day',
    label: 'Next business day',
    resolver: ({ now }: { now: Date }) => {
      const date = new Date(now)
      do {
        date.setDate(date.getDate() + 1)
      } while ([0, 6].includes(date.getDay()))
      return date
    },
  },
]

function disableWeekendDates(date: Date) {
  const day = dayjs(date).day()
  return day === 0 || day === 6
}

function onClickSomething(e: Dayjs) {
  console.log(e)
}

function onSelectSomething(e: Dayjs) {
  console.log(e)
}

function onInvalidShortcut(payload: InvalidShortcutEventPayload) {
  shortcutFailureLog.value = [
    `${payload.id}: ${payload.reason}`,
    ...shortcutFailureLog.value,
  ].slice(0, 3)
}

function logVtdDebugSnapshot() {
  if (typeof window === 'undefined')
    return

  const runtimeWindow = getRuntimeWindow()
  const snapshot = runtimeWindow.__VTD_DEBUG__
  const mountedCount = snapshot?.mountedCount ?? 0
  const events = snapshot?.events ?? []
  const eventCount = events.length
  console.log('[VTD DEBUG] mountedCount=%d eventCount=%d', mountedCount, eventCount)
  const instanceCounts = new Map<string, number>()
  for (const event of events) {
    const key = event.instance ?? 'unknown'
    instanceCounts.set(key, (instanceCounts.get(key) ?? 0) + 1)
  }
  const instanceSummary = Array.from(instanceCounts.entries())
    .map(([instance, count]) => ({ instance, count }))
    .sort((a, b) => b.count - a.count)
  const primaryInstance = instanceSummary[0]?.instance ?? 'none'
  const primaryEvents = primaryInstance === 'none'
    ? []
    : events.filter(event => event.instance === primaryInstance)

  const recentPrimaryEvents = primaryEvents.slice(-40)
  const slowPanelMeasures = primaryEvents
    .filter(event => event.type === 'panel-measure')
    .filter((event) => {
      const duration = Number(event.payload?.durationMs ?? 0)
      return Number.isFinite(duration) && duration >= 8
    })
    .slice(-20)
  const longEventGaps = primaryEvents
    .slice(1)
    .map((event, index) => {
      const previous = primaryEvents[index]
      const previousAt = Number(previous?.at ?? 0)
      const currentAt = Number(event.at ?? 0)
      const gapMs = currentAt - previousAt
      return {
        gapMs,
        previousType: previous?.type ?? 'unknown',
        nextType: event.type ?? 'unknown',
        previousAt: previousAt.toFixed(2),
        nextAt: currentAt.toFixed(2),
      }
    })
    .filter(item => Number.isFinite(item.gapMs) && item.gapMs >= 250)
    .slice(-20)
  console.log(
    '[VTD DEBUG] primaryInstance=%s events=%d slowPanelMeasures(>=8ms)=%d',
    primaryInstance,
    primaryEvents.length,
    slowPanelMeasures.length,
  )
  if (instanceSummary.length > 0)
    console.table(instanceSummary.slice(0, 10))
  console.table(recentPrimaryEvents.map((event) => {
    const payload = event.payload ?? {}
    return {
      at: Number(event.at ?? 0).toFixed(2),
      type: event.type ?? 'unknown',
      active: String(payload.activeElement ?? ''),
      target: String(payload.target ?? ''),
      closeDelayMs: payload.closeDelayMs ?? '',
      durationMs: payload.durationMs ?? '',
      source: payload.source ?? '',
    }
  }))
  console.log('[VTD DEBUG] long primary instance event gaps (>=250ms)=%d', longEventGaps.length)
  if (longEventGaps.length > 0)
    console.table(longEventGaps)

  const perf = runtimeWindow.__VTD_PERF__
  const frameGaps = perf?.frameGaps ?? []
  const longTasks = perf?.longTasks ?? []
  console.log(
    '[VTD PERF] frame gaps (>=120ms)=%d long tasks=%d',
    frameGaps.length,
    longTasks.length,
  )
  if (frameGaps.length > 0)
    console.table(frameGaps.slice(-20).map(item => ({ ...item, at: item.at.toFixed(2) })))
  if (longTasks.length > 0)
    console.table(longTasks.slice(-20).map(item => ({ ...item, at: item.at.toFixed(2) })))

  console.log(snapshot)
}

function clearVtdDebugSnapshot() {
  if (typeof window === 'undefined')
    return

  const runtimeWindow = getRuntimeWindow()
  if (!runtimeWindow.__VTD_DEBUG__) {
    runtimeWindow.__VTD_DEBUG__ = { mountedCount: 0, events: [] }
  }
  runtimeWindow.__VTD_DEBUG__.events = []
  if (runtimeWindow.__VTD_PERF__) {
    runtimeWindow.__VTD_PERF__.frameGaps = []
    runtimeWindow.__VTD_PERF__.longTasks = []
  }
}

function startPerfTracking() {
  if (typeof window === 'undefined' || perfTrackingEnabled)
    return

  perfTrackingEnabled = true
  lastRafAt = 0
  lastUserEventAt = 0
  lastUserEventType = 'none'
  lastUserEventTarget = 'none'

  document.addEventListener('pointerdown', trackUserEvent, true)
  document.addEventListener('click', trackUserEvent, true)
  document.addEventListener('keydown', trackUserEvent, true)

  perfRafId = requestAnimationFrame(trackFrameGap)

  if (typeof PerformanceObserver !== 'undefined') {
    try {
      const supported = PerformanceObserver.supportedEntryTypes ?? []
      if (supported.includes('longtask')) {
        longTaskObserver = new PerformanceObserver((list) => {
          const store = getPerfStore()
          if (!store)
            return
          for (const entry of list.getEntries()) {
            store.longTasks.push({
              at: Number(entry.startTime.toFixed(2)),
              durationMs: Number(entry.duration.toFixed(2)),
              name: entry.name,
            })
          }
          if (store.longTasks.length > 200)
            store.longTasks.splice(0, store.longTasks.length - 200)
        })
        longTaskObserver.observe({ type: 'longtask', buffered: true })
      }
    } catch {
      // No-op: long task observer is best effort across browsers.
    }
  }
}

function stopPerfTracking() {
  if (typeof window === 'undefined' || !perfTrackingEnabled)
    return

  document.removeEventListener('pointerdown', trackUserEvent, true)
  document.removeEventListener('click', trackUserEvent, true)
  document.removeEventListener('keydown', trackUserEvent, true)

  if (perfRafId !== null)
    cancelAnimationFrame(perfRafId)
  perfRafId = null

  if (longTaskObserver) {
    longTaskObserver.disconnect()
    longTaskObserver = null
  }
  perfTrackingEnabled = false
}

function setComponentDebugEnabled(enabled: boolean) {
  if (typeof window === 'undefined')
    return
  getRuntimeWindow().__VTD_DEBUG_ENABLED__ = enabled
}

watch(allFeaturesDebugInstrumentation, (enabled) => {
  setComponentDebugEnabled(enabled)
  if (enabled)
    startPerfTracking()
  else
    stopPerfTracking()
}, { immediate: true })

onUnmounted(() => {
  stopPerfTracking()
  setComponentDebugEnabled(false)
})
</script>

<template>
  <div
    class="min-h-screen px-10 pt-10 pb-[28rem]"
    :class="[isDark ? 'dark bg-slate-950' : 'bg-sky-50']"
  >
    <div class="mb-3">
      <span class="text-sm text-slate-700 dark:text-slate-200">Choose one locale</span>
      <div class="mt-2 flex flex-wrap gap-2">
        <button
          v-for="locale in localeOptions"
          :key="locale.code"
          type="button"
          :aria-pressed="currentLocale === locale.code"
          class="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors"
          :class="[
            currentLocale === locale.code
              ? 'border-sky-400 bg-sky-50 text-sky-700 dark:border-sky-500 dark:bg-sky-900/30 dark:text-sky-200'
              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800',
          ]"
          @click="currentLocale = locale.code"
        >
          <span aria-hidden="true" class="text-base leading-none">{{ locale.flag }}</span>
          <span class="uppercase">{{ locale.code }}</span>
        </button>
      </div>
    </div>

    <label
      class="mb-6 inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-200"
    >
      <input
        v-model="isDark"
        type="checkbox"
        class="h-4 w-4 rounded border-slate-300 text-sky-500 focus:ring-sky-400 dark:border-slate-600 dark:bg-slate-900"
      >
      <span>Dark Theme</span>
    </label>

    <div class="grid gap-4">
      <div class="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p class="mb-3 text-sm font-medium text-blue-900">
          All-features playground (range + selector wheels + modern shortcuts + wheel time)
        </p>
        <div class="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <div class="rounded-md border border-blue-200/70 bg-white p-3">
            <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-700">
              Settings
            </p>
            <div
              class="mb-3 rounded border border-blue-200 bg-blue-50 px-2 py-1.5 text-[11px] text-blue-800"
            >
              <p class="font-semibold">
                Shortcuts panel
              </p>
              <p>
                Choose `off`, `modern preset`, `legacy preset`, or custom typed shortcuts (includes &quot;Highlight next week range&quot;).
              </p>
            </div>
            <label class="mb-3 block">
              <span class="mb-1 block text-xs font-medium text-blue-900">Shortcuts panel mode</span>
              <select v-model="allFeaturesShortcutsMode" :class="allFeaturesSelectClass">
                <option value="custom">
                  custom typed
                </option>
                <option value="preset">
                  modern preset
                </option>
                <option value="legacy">
                  legacy preset
                </option>
                <option value="off">
                  off
                </option>
              </select>
            </label>

            <label class="mb-3 block">
              <span class="mb-1 block text-xs font-medium text-blue-900">Month/year selector style</span>
              <select v-model="allFeaturesSelectorStyle" :class="allFeaturesSelectClass">
                <option value="wheel">
                  wheel (selector-mode)
                </option>
                <option value="page">
                  page (legacy month/year view)
                </option>
              </select>
            </label>

            <label class="mb-3 block">
              <span class="mb-1 block text-xs font-medium text-blue-900">Year numbering mode</span>
              <select
                v-model="allFeaturesYearNumberingMode"
                :disabled="allFeaturesSelectorStyle !== 'wheel' || !allFeaturesDirectYearInput"
                :class="allFeaturesSelectClassWithDisabled"
              >
                <option value="historical">
                  historical (no year 0)
                </option>
                <option value="astronomical">
                  astronomical (includes year 0)
                </option>
              </select>
            </label>

            <label class="mb-3 block">
              <span class="mb-1 block text-xs font-medium text-blue-900">Open focus target</span>
              <select v-model="allFeaturesOpenFocusTarget" :class="allFeaturesSelectClass">
                <option value="input">
                  keep focus on text input
                </option>
                <option value="calendar">
                  focus calendar grid
                </option>
              </select>
            </label>

            <label class="mb-3 block">
              <span class="mb-1 block text-xs font-medium text-blue-900">Time picker style</span>
              <select v-model="allFeaturesTimePickerStyle" :class="allFeaturesSelectClass">
                <option value="none">
                  none
                </option>
                <option value="input">
                  input
                </option>
                <option value="wheel-page">
                  wheel-page
                </option>
                <option value="wheel-inline">
                  wheel-inline
                </option>
              </select>
            </label>

            <label class="mb-3 block">
              <span class="mb-1 block text-xs font-medium text-blue-900">Wheel scroll mode (selector + time)</span>
              <select
                v-model="allFeaturesTimeWheelScrollMode"
                :disabled="allFeaturesWheelControlsDisabled"
                :class="allFeaturesSelectClassWithDisabled"
              >
                <option value="fractional">
                  fractional
                </option>
                <option value="boundary">
                  boundary
                </option>
              </select>
            </label>

            <label class="mb-3 block">
              <span class="mb-1 block text-xs font-medium text-blue-900">Time wheel format</span>
              <select
                v-model="allFeaturesTimeWheelFormat"
                :disabled="allFeaturesWheelControlsDisabled"
                :class="allFeaturesSelectClassWithDisabled"
              >
                <option value="HH:mm">
                  HH:mm
                </option>
                <option value="hh:mm A">
                  hh:mm A
                </option>
                <option value="HH:mm:ss">
                  HH:mm:ss
                </option>
                <option value="hh:mm:ss A">
                  hh:mm:ss A
                </option>
              </select>
            </label>

            <label class="mb-3 block">
              <span class="mb-1 block text-xs font-medium text-blue-900">Wheel-inline position</span>
              <select
                v-model="allFeaturesTimeInlinePosition"
                :disabled="allFeaturesTimePickerStyle !== 'wheel-inline'"
                :class="allFeaturesSelectClassWithDisabled"
              >
                <option value="below">
                  below calendar
                </option>
                <option value="right">
                  right of calendar
                </option>
              </select>
            </label>

            <label class="mb-3 block">
              <span class="mb-1 block text-xs font-medium text-blue-900">Page mode</span>
              <select
                v-model="allFeaturesTimePageMode"
                :disabled="allFeaturesTimePickerStyle !== 'wheel-page'"
                :class="allFeaturesSelectClassWithDisabled"
              >
                <option value="toggle">
                  toggle (manual)
                </option>
                <option value="after-date">
                  after-date
                </option>
              </select>
            </label>

            <div class="mb-3">
              <span class="mb-1 block text-xs font-medium text-blue-900">Range layout</span>
              <label class="mb-1 flex items-center gap-2 text-xs text-blue-900">
                <input
                  v-model="allFeaturesSinglePanelRange"
                  :value="true"
                  type="radio"
                  name="all-features-range-layout"
                >
                Single page (`asSingle`)
              </label>
              <label class="flex items-center gap-2 text-xs text-blue-900">
                <input
                  v-model="allFeaturesSinglePanelRange"
                  :value="false"
                  type="radio"
                  name="all-features-range-layout"
                >
                Double page (`asSingle=false`)
              </label>
            </div>

            <div class="flex flex-wrap items-center gap-3">
              <label class="flex items-center gap-2 text-xs text-blue-900">
                <input v-model="allFeaturesWeekendTintEnabled" type="checkbox">
                Weekend red styling
              </label>
              <label
                class="flex items-center gap-2 text-xs text-blue-900"
                :class="allFeaturesSelectorStyle !== 'wheel' ? 'opacity-50' : ''"
              >
                <input
                  v-model="allFeaturesDirectYearInput"
                  type="checkbox"
                  :disabled="allFeaturesSelectorStyle !== 'wheel'"
                >
                Direct year input
              </label>
            </div>

            <label class="mt-2 flex items-center gap-2 text-xs text-blue-900">
              <input v-model="allFeaturesCloseOnRangeSelection" type="checkbox">
              Auto-close after selecting range end
            </label>
            <label class="mt-2 flex items-center gap-2 text-xs text-blue-900">
              <input v-model="allFeaturesPopoverTransition" type="checkbox">
              Animate popover transition
            </label>
            <label class="mt-2 flex items-center gap-2 text-xs text-blue-900">
              <input v-model="allFeaturesPopoverRestoreFocus" type="checkbox">
              Restore trigger focus on close
            </label>

            <div
              class="mt-3 rounded border border-blue-200 bg-blue-50 px-2 py-2 text-[11px] text-blue-900"
            >
              <label class="mb-2 flex items-center gap-2">
                <input v-model="allFeaturesDebugInstrumentation" type="checkbox">
                Enable debug instrumentation (dev only)
              </label>
              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  class="rounded border border-blue-300 bg-white px-2 py-1 text-[11px] font-medium text-blue-900"
                  @click="logVtdDebugSnapshot"
                >
                  Log debug snapshot
                </button>
                <button
                  type="button"
                  class="rounded border border-blue-300 bg-white px-2 py-1 text-[11px] font-medium text-blue-900"
                  @click="clearVtdDebugSnapshot"
                >
                  Clear debug events
                </button>
              </div>
            </div>
          </div>

          <div
            class="rounded-md border border-blue-200/70 bg-white p-3"
            :class="[allFeaturesWeekendTintEnabled ? 'all-features-weekend' : '']"
          >
            <VueTailwindDatePicker
              v-model="allFeaturesValue"
              use-range
              :as-single="allFeaturesSinglePanelRange"
              :selector-mode="allFeaturesSelectorStyle === 'wheel'"
              :selector-focus-tint="false"
              :selector-year-scroll-mode="allFeaturesTimeWheelScrollMode"
              :direct-year-input="allFeaturesDirectYearInput"
              :year-numbering-mode="allFeaturesYearNumberingMode"
              :shortcuts="allFeaturesShortcutsProp"
              :shortcut-preset="allFeaturesShortcutPreset"
              :auto-apply="false"
              :time-picker-style="allFeaturesTimePickerStyle"
              :time-inline-position="allFeaturesTimeInlinePosition"
              :time-page-mode="allFeaturesTimePageMode"
              :time-wheel-scroll-mode="allFeaturesTimeWheelScrollMode"
              :close-on-range-selection="allFeaturesCloseOnRangeSelection"
              :popover-transition="allFeaturesPopoverTransition"
              :popover-restore-focus="allFeaturesPopoverRestoreFocus"
              :open-focus-target="allFeaturesOpenFocusTarget"
              :formatter="{ date: allFeaturesFormatterDate, month: 'MMM' }"
              :i18n="currentLocale"
            />
          </div>
        </div>
      </div>

      <div class="rounded-lg border border-slate-200 bg-white p-4">
        <p class="mb-3 text-sm font-medium text-slate-700">
          Legacy behavior (`selectorMode=false`, default)
        </p>
        <VueTailwindDatePicker
          v-model="dateValue"
          :i18n="currentLocale"
          @select-month="onSelectSomething($event)"
          @select-year="onSelectSomething($event)"
          @select-right-month="onSelectSomething($event)"
          @select-right-year="onSelectSomething($event)"
          @click-prev="onClickSomething($event)"
          @click-next="onClickSomething($event)"
          @click-right-prev="onClickSomething($event)"
          @click-right-next="onClickSomething($event)"
        />
      </div>

      <div class="rounded-lg border border-slate-200 bg-white p-4">
        <p class="mb-3 text-sm font-medium text-slate-700">
          Legacy single-date mode (`asSingle`)
        </p>
        <VueTailwindDatePicker v-model="singleDateValue" as-single :i18n="currentLocale" />
      </div>

      <div class="rounded-lg border border-sky-200 bg-sky-50 p-4">
        <p class="mb-3 text-sm font-medium text-sky-900">
          Time picker style modes
        </p>
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <p class="mb-2 text-xs font-semibold text-sky-800">
              Date-only (`timePickerStyle=&quot;none&quot;`)
            </p>
            <VueTailwindDatePicker
              v-model="compatibilityDateOnlyValue"
              as-single
              :auto-apply="true"
              time-picker-style="none"
              :formatter="{ date: 'YYYY-MM-DD', month: 'MMM' }"
              :i18n="currentLocale"
            />
          </div>
          <div>
            <p class="mb-2 text-xs font-semibold text-sky-800">
              Text input time (`timePickerStyle=&quot;input&quot;`)
            </p>
            <VueTailwindDatePicker
              v-model="compatibilityDateTimeValue"
              as-single
              :auto-apply="true"
              time-picker-style="input"
              default-time="09:30"
              :formatter="{ date: 'YYYY-MM-DD HH:mm', month: 'MMM' }"
              :i18n="currentLocale"
            />
          </div>
          <div>
            <p class="mb-2 text-xs font-semibold text-sky-800">
              Wheel inline (`wheel-inline`)
            </p>
            <VueTailwindDatePicker
              v-model="wheelInlineValue"
              as-single
              :auto-apply="true"
              time-picker-style="wheel-inline"
              :formatter="{ date: 'YYYY-MM-DD HH:mm:ss', month: 'MMM' }"
              :i18n="currentLocale"
            />
          </div>
          <div>
            <p class="mb-2 text-xs font-semibold text-sky-800">
              Wheel inline (`wheel-inline`, boundary HH:mm:ss)
            </p>
            <VueTailwindDatePicker
              v-model="wheelInlineBoundaryValue"
              as-single
              :auto-apply="true"
              time-picker-style="wheel-inline"
              time-wheel-scroll-mode="boundary"
              :formatter="{ date: 'YYYY-MM-DD HH:mm:ss', month: 'MMM' }"
              :i18n="currentLocale"
            />
          </div>
          <div>
            <p class="mb-2 text-xs font-semibold text-sky-800">
              Wheel page (`wheel-page`, manual toggle, fractional hh:mm A)
            </p>
            <VueTailwindDatePicker
              v-model="wheelToggleValue"
              as-single
              :auto-apply="true"
              time-picker-style="wheel-page"
              time-page-mode="toggle"
              time-wheel-scroll-mode="fractional"
              :formatter="{ date: 'YYYY-MM-DD hh:mm A', month: 'MMM' }"
              :i18n="currentLocale"
            />
          </div>
          <div>
            <p class="mb-2 text-xs font-semibold text-sky-800">
              Wheel page (`wheel-page`, date -> time auto switch, fractional HH:mm:ss)
            </p>
            <VueTailwindDatePicker
              v-model="wheelToggleSecondsValue"
              as-single
              :auto-apply="true"
              time-picker-style="wheel-page"
              time-page-mode="after-date"
              time-wheel-scroll-mode="fractional"
              :formatter="{ date: 'YYYY-MM-DD HH:mm:ss', month: 'MMM' }"
              :i18n="currentLocale"
            />
          </div>
        </div>
      </div>

      <div class="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <p class="mb-3 text-sm font-medium text-emerald-900">
          Opt-in selector mode demo (`:selector-mode=&quot;true&quot;`)
        </p>
        <VueTailwindDatePicker
          v-model="selectorModeValue"
          :selector-mode="true"
          :selector-focus-tint="false"
          :i18n="currentLocale"
          @select-month="onSelectSomething($event)"
          @select-year="onSelectSomething($event)"
          @select-right-month="onSelectSomething($event)"
          @select-right-year="onSelectSomething($event)"
          @click-prev="onClickSomething($event)"
          @click-next="onClickSomething($event)"
          @click-right-prev="onClickSomething($event)"
          @click-right-next="onClickSomething($event)"
        />
      </div>

      <div class="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p class="mb-3 text-sm font-medium text-amber-900">
          Selector mode single-panel range (`useRange` + `asSingle`, year scroll: `boundary`)
        </p>
        <VueTailwindDatePicker
          v-model="selectorSingleRangeValue"
          use-range
          as-single
          :selector-mode="true"
          :selector-focus-tint="false"
          selector-year-scroll-mode="boundary"
          :i18n="currentLocale"
        />
      </div>

      <div class="rounded-lg border border-violet-200 bg-violet-50 p-4">
        <p class="mb-3 text-sm font-medium text-violet-900">
          Selector mode single-panel range (`useRange` + `asSingle`, year scroll: `fractional`)
        </p>
        <VueTailwindDatePicker
          v-model="selectorSingleRangeFractionalValue"
          use-range
          as-single
          :selector-mode="true"
          :selector-focus-tint="false"
          selector-year-scroll-mode="fractional"
          :i18n="currentLocale"
        />
      </div>

      <div class="rounded-lg border border-fuchsia-200 bg-fuchsia-50 p-4">
        <p class="mb-3 text-sm font-medium text-fuchsia-900">
          Selector mode + wheel time (`:selector-mode=&quot;true&quot;`, `useRange` + `asSingle`, `wheel-inline`)
        </p>
        <VueTailwindDatePicker
          v-model="selectorModeWheelRangeValue"
          use-range
          as-single
          :selector-mode="true"
          :selector-focus-tint="false"
          :auto-apply="true"
          time-picker-style="wheel-inline"
          time-wheel-scroll-mode="fractional"
          :formatter="{ date: 'YYYY-MM-DD HH:mm:ss', month: 'MMM' }"
          :i18n="currentLocale"
        />
      </div>

      <div class="rounded-lg border border-pink-200 bg-pink-50 p-4">
        <p class="mb-3 text-sm font-medium text-pink-900">
          Selector mode + wheel time (same config, sidepanel off)
        </p>
        <VueTailwindDatePicker
          v-model="selectorModeWheelRangeNoSidepanelValue"
          use-range
          as-single
          :selector-mode="true"
          :selector-focus-tint="false"
          :shortcuts="false"
          :auto-apply="true"
          time-picker-style="wheel-inline"
          time-wheel-scroll-mode="fractional"
          :formatter="{ date: 'YYYY-MM-DD HH:mm:ss', month: 'MMM' }"
          :i18n="currentLocale"
        />
      </div>

      <div class="rounded-lg border border-rose-200 bg-rose-50 p-4">
        <p class="mb-3 text-sm font-medium text-rose-900">
          Selector mode with disabled-date constraints (`disableDate` weekends)
        </p>
        <VueTailwindDatePicker
          v-model="selectorDisabledValue"
          as-single
          :selector-mode="true"
          :selector-focus-tint="false"
          :disable-date="disableWeekendDates"
          :i18n="currentLocale"
        />
      </div>

      <div class="weekend-tint-demo rounded-lg border border-red-200 bg-red-50 p-4">
        <p class="mb-3 text-sm font-medium text-red-900">
          Host CSS weekend tint demos (`vtd-weekend`, `vtd-saturday`, `vtd-sunday`)
        </p>
        <div class="grid gap-4 xl:grid-cols-3">
          <div class="rounded-md border border-red-200/70 bg-white p-3">
            <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-red-700">
              Locale EN
            </p>
            <VueTailwindDatePicker
              v-model="weekendTintEnValue"
              use-range
              i18n="en"
            />
          </div>

          <div class="rounded-md border border-red-200/70 bg-white p-3">
            <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-red-700">
              Locale DE
            </p>
            <VueTailwindDatePicker
              v-model="weekendTintDeValue"
              use-range
              i18n="de"
            />
          </div>

          <div class="rounded-md border border-red-200/70 bg-white p-3">
            <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-red-700">
              Selector wheel + weekend hooks
            </p>
            <VueTailwindDatePicker
              v-model="weekendSelectorTintValue"
              use-range
              as-single
              :selector-mode="true"
              :selector-focus-tint="false"
              selector-year-scroll-mode="boundary"
              i18n="en"
            />
          </div>
        </div>
        <p class="mt-3 text-xs text-red-800">
          Verify weekend tint parity across locales and selector mode while selected/range/disabled states stay behaviorally unchanged.
        </p>
      </div>

      <div class="rounded-lg border border-cyan-200 bg-cyan-50 p-4">
        <p class="mb-3 text-sm font-medium text-cyan-900">
          Selector mode with empty/invalid model value seeds
        </p>
        <div class="grid gap-4 md:grid-cols-2">
          <VueTailwindDatePicker
            v-model="selectorEmptyModelValue"
            as-single
            :selector-mode="true"
            :selector-focus-tint="false"
            :i18n="currentLocale"
            placeholder="Empty string model"
          />
          <VueTailwindDatePicker
            v-model="selectorInvalidModelValue"
            :selector-mode="true"
            :selector-focus-tint="false"
            :i18n="currentLocale"
            placeholder="Invalid range model"
          />
        </div>
      </div>

      <div class="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
        <p class="mb-3 text-sm font-medium text-indigo-900">
          Custom shortcut success showcase (`activate()` flow)
        </p>
        <VueTailwindDatePicker
          v-model="shortcutSuccessDemoValue"
          as-single
          use-range
          :shortcuts="shortcutSuccessDemoShortcuts"
          shortcut-preset="modern"
        >
          <template #shortcut-item="{ id, label, isDisabled, meta, activate }">
            <button
              type="button"
              :disabled="isDisabled"
              class="vtd-shortcuts mb-1 w-[10.5rem] rounded border border-indigo-300 bg-white px-2 py-1.5 text-left text-sm text-indigo-900 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
              :data-shortcut-id="id"
              @click="activate"
            >
              {{ label }}
              <span v-if="meta?.hint" class="text-xs text-indigo-600">({{ meta.hint }})</span>
            </button>
          </template>
        </VueTailwindDatePicker>
        <p class="mt-3 text-xs text-indigo-800">
          Contains only successful typed shortcuts.
        </p>
      </div>

      <div class="rounded-lg border border-fuchsia-200 bg-fuchsia-50 p-4">
        <p class="mb-3 text-sm font-medium text-fuchsia-900">
          Custom shortcut invalid showcase (`invalid-shortcut` flow)
        </p>
        <VueTailwindDatePicker
          v-model="shortcutInvalidDemoValue"
          as-single
          use-range
          :shortcuts="shortcutInvalidDemoShortcuts"
          shortcut-preset="modern"
          @invalid-shortcut="onInvalidShortcut"
        >
          <template #shortcut-item="{ id, label, isDisabled, meta, activate }">
            <button
              type="button"
              :disabled="isDisabled"
              class="vtd-shortcuts mb-1 w-[10.5rem] rounded border border-fuchsia-300 bg-white px-2 py-1.5 text-left text-sm text-fuchsia-900 hover:bg-fuchsia-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
              :data-shortcut-id="id"
              @click="activate"
            >
              {{ label }}
              <span v-if="meta?.hint" class="text-xs text-fuchsia-600">({{ meta.hint }})</span>
            </button>
          </template>
        </VueTailwindDatePicker>
        <p class="mt-3 text-xs text-fuchsia-800">
          Recent invalid-shortcut payloads: {{ shortcutFailureLog.join(' | ') || 'none' }}
        </p>
      </div>

      <div class="rounded-lg border border-teal-200 bg-teal-50 p-4">
        <p class="mb-3 text-sm font-medium text-teal-900">
          Custom shortcut disabled-state showcase (`shortcut-item` `isDisabled`)
        </p>
        <VueTailwindDatePicker
          v-model="shortcutDisabledDemoValue"
          as-single
          use-range
          :disable-date="disableWeekendDates"
          :shortcuts="shortcutDisabledDemoShortcuts"
          shortcut-preset="modern"
        >
          <template #shortcut-item="{ id, label, isDisabled, disabledReason, activate }">
            <button
              type="button"
              :disabled="isDisabled"
              class="vtd-shortcuts mb-1 inline-flex w-[12.25rem] items-center justify-between rounded border border-teal-300 bg-white px-2 py-1.5 text-left text-sm text-teal-900 hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-white"
              :data-shortcut-id="id"
              @click="activate"
            >
              <span>{{ label }}</span>
              <span
                class="ml-2 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                :class="
                  isDisabled
                    ? disabledReason === 'blocked-date'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-teal-100 text-teal-700'
                    : 'bg-teal-600 text-white'
                "
              >
                {{
                  isDisabled
                    ? disabledReason === 'blocked-date'
                      ? 'Blocked'
                      : 'Disabled'
                    : 'Active'
                }}
              </span>
            </button>
          </template>
        </VueTailwindDatePicker>
        <p class="mt-3 text-xs text-teal-800">
          Shows both explicit disabled shortcuts and shortcuts disabled by current `disableDate` constraints.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.weekend-tint-demo
  :deep(.vtd-datepicker-date.vtd-weekend:not(.vtd-datepicker-date-selected):not(:disabled)) {
  color: rgb(220 38 38 / 100%);
}

.weekend-tint-demo
  :deep(.vtd-datepicker-date.vtd-saturday:not(.vtd-datepicker-date-selected):not(:disabled)) {
  color: rgb(234 88 12 / 100%);
}

.weekend-tint-demo
  :deep(.vtd-datepicker-date.vtd-sunday:not(.vtd-datepicker-date-selected):not(:disabled)) {
  color: rgb(185 28 28 / 100%);
}

.all-features-weekend
  :deep(.vtd-datepicker-date.vtd-weekend:not(.vtd-datepicker-date-selected):not(:disabled)) {
  color: rgb(220 38 38 / 100%);
}

.all-features-weekend
  :deep(.vtd-datepicker-date.vtd-saturday:not(.vtd-datepicker-date-selected):not(:disabled)) {
  color: rgb(234 88 12 / 100%);
}

.all-features-weekend
  :deep(.vtd-datepicker-date.vtd-sunday:not(.vtd-datepicker-date-selected):not(:disabled)) {
  color: rgb(185 28 28 / 100%);
}
</style>
