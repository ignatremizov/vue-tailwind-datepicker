<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import type { LengthArray } from '../types'
import VtdSelectorWheelStepButton from './SelectorWheelStepButton.vue'

type SelectorFocus = 'month' | 'year'

interface SelectorMonthPayload {
  month: number
  year: number
}

interface SelectorMonthItem {
  month: number
  year: number
  key: string
  index: number
}

const props = withDefaults(defineProps<{
  months: LengthArray<string, 12>
  selectorMode?: boolean
  selectedMonth?: number | null
  selectedYear?: number | null
  selectorFocus?: SelectorFocus
}>(), {
  selectorMode: false,
  selectedMonth: null,
  selectedYear: null,
  selectorFocus: 'month',
})

const emit = defineEmits<{
  (e: 'updateMonth', value: number): void
  (e: 'scrollMonth', value: SelectorMonthPayload): void
  (e: 'focusMonth'): void
  (e: 'requestFocusYear'): void
}>()

const SELECTOR_VISIBLE_RADIUS = 180
const SELECTOR_CENTER_INDEX = SELECTOR_VISIBLE_RADIUS
const SELECTOR_EDGE_REBASE_THRESHOLD = 42
const USER_SCROLL_IDLE_MS = 90
const PROGRAMMATIC_SCROLL_SYNC_MS = 120
const SMOOTH_SCROLL_SYNC_MS = 420
const FALLBACK_ROW_HEIGHT = 44
const MONTH_TYPEAHEAD_IDLE_MS = 900

const selectorContainerRef = ref<HTMLDivElement | null>(null)
const selectorScrollTop = ref(0)
const selectorViewportHeight = ref(256)
const selectorRowHeight = ref(FALLBACK_ROW_HEIGHT)
const selectorPaddingTop = ref(0)
const isUserScrolling = ref(false)
const isProgrammaticScrollSync = ref(false)
const anchorSelection = ref<SelectorMonthPayload>(getSelectionBase())

let scrollFrameId: number | null = null
let scrollIdleTimeoutId: ReturnType<typeof setTimeout> | null = null
let programmaticSyncTimeoutId: ReturnType<typeof setTimeout> | null = null
let lastEmittedScrollKey: string | null = null
const monthTypeaheadText = ref('')
let monthTypeaheadTimeoutId: ReturnType<typeof setTimeout> | null = null

function normalizeMonthYear(rawMonth: number, rawYear: number): SelectorMonthPayload {
  const totalMonths = (rawYear * 12) + rawMonth
  const year = Math.floor(totalMonths / 12)
  const month = ((totalMonths % 12) + 12) % 12
  return { month, year }
}

function addMonths(month: number, year: number, delta: number): SelectorMonthPayload {
  return normalizeMonthYear(month + delta, year)
}

function totalMonths(month: number, year: number) {
  return (year * 12) + month
}

function monthKey(month: number, year: number) {
  return `${year}-${month}`
}

function getSelectionBase() {
  return {
    month: props.selectedMonth ?? new Date().getMonth(),
    year: props.selectedYear ?? new Date().getFullYear(),
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

const selectorMonthItems = computed<SelectorMonthItem[]>(() => {
  if (!props.selectorMode)
    return []

  const base = anchorSelection.value
  const items: SelectorMonthItem[] = []

  for (let offset = -SELECTOR_VISIBLE_RADIUS; offset <= SELECTOR_VISIBLE_RADIUS; offset += 1) {
    const normalized = addMonths(base.month, base.year, offset)
    items.push({
      month: normalized.month,
      year: normalized.year,
      key: `${normalized.year}-${normalized.month}-${offset}`,
      index: offset + SELECTOR_VISIBLE_RADIUS,
    })
  }

  return items
})

function monthOptionId(month: number, year: number) {
  return `vtd-selector-month-${year}-${month}`
}

const centeredIndexFloat = computed(() => {
  const rowHeight = selectorRowHeight.value || FALLBACK_ROW_HEIGHT
  const viewportHeight = selectorViewportHeight.value || 256
  return (
    selectorScrollTop.value
    - selectorPaddingTop.value
    + (viewportHeight / 2)
    - (rowHeight / 2)
  ) / rowHeight
})

function emitScrollMonth(target: SelectorMonthPayload) {
  const key = monthKey(target.month, target.year)
  if (key === lastEmittedScrollKey)
    return

  lastEmittedScrollKey = key
  emit('scrollMonth', target)
}

function markProgrammaticScrollSync(durationMs = PROGRAMMATIC_SCROLL_SYNC_MS) {
  isProgrammaticScrollSync.value = true
  if (programmaticSyncTimeoutId !== null)
    clearTimeout(programmaticSyncTimeoutId)
  programmaticSyncTimeoutId = setTimeout(() => {
    isProgrammaticScrollSync.value = false
  }, durationMs)
}

function updateSelectorMetrics() {
  const container = selectorContainerRef.value
  if (!container)
    return

  selectorViewportHeight.value = container.clientHeight || selectorViewportHeight.value
  selectorScrollTop.value = container.scrollTop
  selectorPaddingTop.value = Number.parseFloat(getComputedStyle(container).paddingTop || '0') || 0

  const firstRow = container.querySelector<HTMLDivElement>('[data-month-index="0"]')
  if (firstRow && firstRow.offsetHeight > 0)
    selectorRowHeight.value = firstRow.offsetHeight
}

function getCenteredItem() {
  const items = selectorMonthItems.value
  if (items.length === 0)
    return null

  const index = clamp(
    Math.round(centeredIndexFloat.value),
    0,
    items.length - 1,
  )

  return items[index]
}

const activeMonthOptionId = computed(() => {
  if (!props.selectorMode)
    return undefined

  if (props.selectedMonth !== null && props.selectedYear !== null)
    return monthOptionId(props.selectedMonth, props.selectedYear)

  const centered = getCenteredItem()
  if (!centered)
    return undefined

  return monthOptionId(centered.month, centered.year)
})

function scrollToIndex(index: number, behavior: ScrollBehavior = 'auto') {
  const container = selectorContainerRef.value
  if (!container)
    return

  const rowHeight = selectorRowHeight.value || FALLBACK_ROW_HEIGHT
  const centeredScrollTop
    = selectorPaddingTop.value
      + (index * rowHeight)
      - (container.clientHeight / 2)
      + (rowHeight / 2)

  container.scrollTo({
    top: Math.max(0, centeredScrollTop),
    behavior,
  })
  selectorScrollTop.value = container.scrollTop
}

function rebaseWindowAround(item: SelectorMonthItem) {
  const container = selectorContainerRef.value
  if (!container)
    return

  const previousScrollTop = container.scrollTop
  const rowHeight = selectorRowHeight.value || FALLBACK_ROW_HEIGHT
  const rowDelta = item.index - SELECTOR_CENTER_INDEX

  anchorSelection.value = { month: item.month, year: item.year }

  nextTick(() => {
    markProgrammaticScrollSync()
    updateSelectorMetrics()
    container.scrollTop = Math.max(0, previousScrollTop - (rowDelta * rowHeight))
    selectorScrollTop.value = container.scrollTop
  })
}

function syncSelectorToSelected(force = false, behavior: ScrollBehavior = 'auto') {
  if (!props.selectorMode || props.selectedMonth === null || props.selectedYear === null)
    return

  if (!force && isUserScrolling.value)
    return

  anchorSelection.value = { month: props.selectedMonth, year: props.selectedYear }
  lastEmittedScrollKey = monthKey(props.selectedMonth, props.selectedYear)

  nextTick(() => {
    markProgrammaticScrollSync(behavior === 'smooth' ? SMOOTH_SCROLL_SYNC_MS : PROGRAMMATIC_SCROLL_SYNC_MS)
    updateSelectorMetrics()
    scrollToIndex(SELECTOR_CENTER_INDEX, behavior)
  })
}

function flushScrollMonthUpdate() {
  scrollFrameId = null
  const centered = getCenteredItem()
  if (!centered)
    return

  emitScrollMonth({ month: centered.month, year: centered.year })

  if (
    centered.index <= SELECTOR_EDGE_REBASE_THRESHOLD
    || centered.index >= selectorMonthItems.value.length - 1 - SELECTOR_EDGE_REBASE_THRESHOLD
  ) {
    rebaseWindowAround(centered)
  }
}

function onSelectorScroll() {
  if (!props.selectorMode)
    return

  updateSelectorMetrics()

  if (isProgrammaticScrollSync.value)
    return

  isUserScrolling.value = true
  if (scrollIdleTimeoutId !== null)
    clearTimeout(scrollIdleTimeoutId)

  scrollIdleTimeoutId = setTimeout(() => {
    isUserScrolling.value = false
  }, USER_SCROLL_IDLE_MS)

  if (scrollFrameId !== null)
    return

  scrollFrameId = requestAnimationFrame(flushScrollMonthUpdate)
}

function onSelectorKeydown(event: KeyboardEvent) {
  if (!props.selectorMode)
    return

  if (!event.altKey && !event.ctrlKey && !event.metaKey) {
    if (event.key.length === 1 && /\p{L}/u.test(event.key)) {
      event.preventDefault()
      const typed = event.key.toLocaleLowerCase()
      monthTypeaheadText.value += typed

      const applied = applyMonthTypeahead(monthTypeaheadText.value)
      if (!applied) {
        monthTypeaheadText.value = typed
        applyMonthTypeahead(monthTypeaheadText.value)
      }

      scheduleMonthTypeaheadReset()
      return
    }

    if (event.key === 'Backspace' && monthTypeaheadText.value.length > 0) {
      event.preventDefault()
      monthTypeaheadText.value = monthTypeaheadText.value.slice(0, -1)
      if (!monthTypeaheadText.value)
        clearMonthTypeaheadState()
      else {
        applyMonthTypeahead(monthTypeaheadText.value)
        scheduleMonthTypeaheadReset()
      }
      return
    }

    if (event.key === 'Escape' && monthTypeaheadText.value.length > 0) {
      event.preventDefault()
      event.stopPropagation()
      clearMonthTypeaheadState()
      return
    }
  }

  // Intentional: both Tab and Shift+Tab switch between month/year wheels.
  // Although this local handler always requests the sibling wheel, reverse
  // traversal is preserved at the picker level by the parent focus cycle logic.
  if (event.key === 'Tab' && !event.altKey && !event.ctrlKey && !event.metaKey) {
    event.preventDefault()
    emit('requestFocusYear')
    return
  }

  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault()
    emit('requestFocusYear')
    return
  }

  if (event.key === 'ArrowDown' || event.key === 'PageDown') {
    event.preventDefault()
    applyKeyboardMonthDelta(1)
    return
  }

  if (event.key === 'ArrowUp' || event.key === 'PageUp') {
    event.preventDefault()
    applyKeyboardMonthDelta(-1)
  }
}

function getKeyboardBaseSelection() {
  if (props.selectedMonth !== null && props.selectedYear !== null) {
    return {
      month: props.selectedMonth,
      year: props.selectedYear,
    }
  }

  const centered = getCenteredItem()
  if (centered) {
    return {
      month: centered.month,
      year: centered.year,
    }
  }

  return getSelectionBase()
}

function applyKeyboardMonthDelta(delta: number) {
  if (!props.selectorMode)
    return

  const current = getKeyboardBaseSelection()
  const next = addMonths(current.month, current.year, delta)
  emitScrollMonth(next)

  const targetItem = selectorMonthItems.value.find(
    item => item.month === next.month && item.year === next.year,
  )
  if (targetItem) {
    markProgrammaticScrollSync(SMOOTH_SCROLL_SYNC_MS)
    scrollToIndex(targetItem.index, 'smooth')
    return
  }

  anchorSelection.value = next
  nextTick(() => {
    markProgrammaticScrollSync(SMOOTH_SCROLL_SYNC_MS)
    updateSelectorMetrics()
    scrollToIndex(SELECTOR_CENTER_INDEX, 'smooth')
  })
}

function clearMonthTypeaheadState() {
  monthTypeaheadText.value = ''
  if (monthTypeaheadTimeoutId !== null) {
    clearTimeout(monthTypeaheadTimeoutId)
    monthTypeaheadTimeoutId = null
  }
}

function scheduleMonthTypeaheadReset() {
  if (monthTypeaheadTimeoutId !== null)
    clearTimeout(monthTypeaheadTimeoutId)
  monthTypeaheadTimeoutId = setTimeout(() => {
    clearMonthTypeaheadState()
  }, MONTH_TYPEAHEAD_IDLE_MS)
}

function findTypeaheadMonthIndex(typedText: string) {
  const normalized = typedText.trim().toLocaleLowerCase()
  if (!normalized)
    return -1
  return props.months.findIndex(month => month.toLocaleLowerCase().startsWith(normalized))
}

function applyMonthTypeahead(typedText: string) {
  const matchedMonth = findTypeaheadMonthIndex(typedText)
  if (matchedMonth < 0)
    return false

  const current = getKeyboardBaseSelection()
  const next = { month: matchedMonth, year: current.year }
  emitScrollMonth(next)

  const targetItem = selectorMonthItems.value.find(
    item => item.month === next.month && item.year === next.year,
  )

  if (targetItem) {
    markProgrammaticScrollSync(SMOOTH_SCROLL_SYNC_MS)
    scrollToIndex(targetItem.index, 'smooth')
  }
  else {
    anchorSelection.value = next
    nextTick(() => {
      markProgrammaticScrollSync(SMOOTH_SCROLL_SYNC_MS)
      updateSelectorMetrics()
      scrollToIndex(SELECTOR_CENTER_INDEX, 'smooth')
    })
  }

  return true
}

function onMonthClick(item: SelectorMonthItem) {
  if (!props.selectorMode) {
    emit('updateMonth', item.month)
    return
  }

  markProgrammaticScrollSync(SMOOTH_SCROLL_SYNC_MS)
  scrollToIndex(item.index, 'smooth')
  emitScrollMonth({ month: item.month, year: item.year })
  selectorContainerRef.value?.focus({ preventScroll: true })
}

function onSelectorStepClick(delta: number) {
  if (!props.selectorMode)
    return

  clearMonthTypeaheadState()
  applyKeyboardMonthDelta(delta)
  selectorContainerRef.value?.focus({ preventScroll: true })
}

function stepBy(delta: number) {
  if (!props.selectorMode)
    return

  clearMonthTypeaheadState()
  applyKeyboardMonthDelta(delta)
  selectorContainerRef.value?.focus({ preventScroll: true })
}

function onSelectorFocus() {
  clearMonthTypeaheadState()
  emit('focusMonth')
}

watch(
  () => ({
    selectorMode: props.selectorMode,
    selectedMonth: props.selectedMonth,
    selectedYear: props.selectedYear,
  }),
  ({ selectorMode, selectedMonth, selectedYear }, previous) => {
    if (!selectorMode || selectedMonth === null || selectedYear === null)
      return

    const wasSelectorMode = previous?.selectorMode ?? false
    const monthChanged = selectedMonth !== previous?.selectedMonth
    const yearChanged = selectedYear !== previous?.selectedYear
    const shouldForceSync = !wasSelectorMode
    const selectedKey = monthKey(selectedMonth, selectedYear)
    const isScrollDrivenUpdate
      = selectedKey === lastEmittedScrollKey
        && (isUserScrolling.value || isProgrammaticScrollSync.value)

    if (shouldForceSync) {
      syncSelectorToSelected(true)
      return
    }

    if (!monthChanged && !yearChanged)
      return

    // When only year changes (from year wheel), keep current scroll position
    // but shift the month window's tuple year so subsequent month scroll emits
    // the updated year rather than stale pre-change values.
    if (yearChanged && !monthChanged) {
      const previousYear = previous?.selectedYear
      if (typeof previousYear === 'number') {
        const yearDelta = selectedYear - previousYear
        if (yearDelta !== 0) {
          anchorSelection.value = {
            month: anchorSelection.value.month,
            year: anchorSelection.value.year + yearDelta,
          }
        }
      }
      else {
        anchorSelection.value = { month: selectedMonth, year: selectedYear }
      }
      lastEmittedScrollKey = monthKey(selectedMonth, selectedYear)
      return
    }

    if (monthChanged) {
      if (isScrollDrivenUpdate)
        return

      const previousMonth = previous?.selectedMonth
      const previousYear = previous?.selectedYear
      if (typeof previousMonth === 'number' && typeof previousYear === 'number') {
        const delta = totalMonths(selectedMonth, selectedYear) - totalMonths(previousMonth, previousYear)
        if (delta !== 0 && Math.abs(delta) <= 2) {
          lastEmittedScrollKey = monthKey(selectedMonth, selectedYear)
          nextTick(() => {
            markProgrammaticScrollSync(SMOOTH_SCROLL_SYNC_MS)
            updateSelectorMetrics()
            scrollToIndex(SELECTOR_CENTER_INDEX + delta, 'smooth')
          })
          return
        }
      }
    }

    if (isScrollDrivenUpdate)
      return

    // Month changes initiated outside the wheel (for example header prev/next)
    // should animate the wheel position update.
    syncSelectorToSelected(false, monthChanged ? 'smooth' : 'auto')
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  clearMonthTypeaheadState()
  if (scrollFrameId !== null)
    cancelAnimationFrame(scrollFrameId)
  if (scrollIdleTimeoutId !== null)
    clearTimeout(scrollIdleTimeoutId)
  if (programmaticSyncTimeoutId !== null)
    clearTimeout(programmaticSyncTimeoutId)
})

defineExpose({
  stepBy,
})
</script>

<template>
  <div v-if="!props.selectorMode" class="mx-auto mt-1.5 flex max-w-[20.5rem] flex-wrap">
    <div v-for="(month, key) in props.months" :key="key" class="w-1/2 px-0.5">
      <span class="flex rounded-md mt-1.5">
        <button
          type="button"
          class="px-3 py-2 block w-full leading-6 rounded-md bg-white text-xs 2xl:text-sm tracking-wide text-vtd-secondary-600 font-medium transition-colors border border-transparent hover:bg-vtd-secondary-100 hover:text-vtd-secondary-900 focus:bg-vtd-primary-50 focus:text-vtd-secondary-900 focus:border-vtd-primary-300 focus:ring-3 focus:ring-vtd-primary-500/10 focus:outline-hidden uppercase dark:bg-vtd-secondary-800 dark:hover:bg-vtd-secondary-700 dark:text-vtd-secondary-300 dark:hover:text-vtd-secondary-100 dark:focus:bg-vtd-secondary-700"
          @click="emit('updateMonth', Number(key))" v-text="month"
        />
      </span>
    </div>
  </div>

  <div v-else class="h-64 w-full min-w-0">
    <div class="relative h-full w-full min-w-0 overflow-visible rounded-md">
      <VtdSelectorWheelStepButton
        direction="up"
        label="Select previous month"
        @click="onSelectorStepClick(-1)"
      />
      <div
        ref="selectorContainerRef"
        class="h-full w-full min-w-0 overflow-y-auto px-0.5 py-1 select-none focus:outline-none focus-visible:outline-none"
        role="listbox"
        aria-label="Month selector"
        :aria-activedescendant="activeMonthOptionId"
        tabindex="0"
        @focus="onSelectorFocus"
        @focusin="onSelectorFocus"
        @scroll.passive="onSelectorScroll"
        @keydown="onSelectorKeydown"
      >
        <div
          v-for="item in selectorMonthItems"
          :key="item.key"
          :data-month-index="item.index"
          class="flex items-center"
          :style="{ height: 'var(--vtd-selector-wheel-cell-height, 40px)' }"
        >
          <button
            :id="monthOptionId(item.month, item.year)"
            type="button"
            role="option"
            :aria-selected="props.selectedMonth === item.month && props.selectedYear === item.year"
            class="vtd-month-selector-btn px-3 py-2 block w-full rounded-[8px] tracking-wide transition-colors border focus:outline-hidden uppercase"
            :class="[
              props.selectedMonth === item.month && props.selectedYear === item.year
                ? 'vtd-month-selector-btn-selected'
                : 'vtd-month-selector-btn-default bg-transparent border-transparent focus:bg-vtd-primary-50 focus:text-vtd-secondary-900 focus:border-vtd-primary-300 dark:focus:bg-vtd-secondary-700 dark:focus:text-vtd-secondary-100',
            ]"
            tabindex="-1"
            @click="onMonthClick(item)"
            v-text="props.months[item.month]"
          />
        </div>
      </div>
      <VtdSelectorWheelStepButton
        direction="down"
        label="Select next month"
        @click="onSelectorStepClick(1)"
      />
    </div>
  </div>
</template>

<style scoped>
.vtd-month-selector-btn {
  appearance: none;
  -moz-appearance: none;
  background-image: none;
  display: flex;
  align-items: center;
  justify-content: center;
  height: var(--vtd-selector-wheel-cell-height, 40px);
  padding-top: 0;
  padding-bottom: 0;
  border-width: var(--vtd-selector-month-selected-border-width, 0.85px);
  font-family: var(--vtd-selector-month-font-family, inherit);
  font-size: var(--vtd-selector-month-font-size, 0.875rem);
  font-weight: var(--vtd-selector-month-font-weight, 500);
  line-height: var(--vtd-selector-month-line-height, 1.5rem);
  box-shadow: var(--vtd-selector-month-cell-shadow, none);
}

.vtd-month-selector-btn::-moz-focus-inner {
  border: 0;
  padding: 0;
}

.vtd-month-selector-btn-selected {
  border-width: var(--vtd-selector-month-selected-border-width, 0.85px);
  background-color: var(--vtd-selector-month-selected-bg, rgb(14 165 233 / 13%)) !important;
  border-color: var(--vtd-selector-month-selected-border, rgb(14 165 233 / 62%)) !important;
  color: var(--vtd-selector-month-selected-text, rgb(56 189 248 / 100%)) !important;
}

.vtd-month-selector-btn-default {
  color: var(--vtd-selector-month-text, var(--color-vtd-secondary-600)) !important;
}

.vtd-month-selector-btn[aria-selected='false']:hover,
.vtd-month-selector-btn[aria-selected='false']:active {
  border-width: var(--vtd-selector-month-hover-border-width, 0.85px);
  background-color: var(--vtd-selector-month-hover-bg, rgb(30 41 59 / 92%)) !important;
  border-color: var(--vtd-selector-month-hover-border, rgb(100 116 139 / 50%)) !important;
  color: var(--vtd-selector-month-hover-text, rgb(226 232 240 / 96%)) !important;
}
</style>
