<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import type { LengthArray } from '../types'

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
}>()

const SELECTOR_VISIBLE_RADIUS = 180
const SELECTOR_CENTER_INDEX = SELECTOR_VISIBLE_RADIUS
const SELECTOR_EDGE_REBASE_THRESHOLD = 42
const USER_SCROLL_IDLE_MS = 90
const PROGRAMMATIC_SCROLL_SYNC_MS = 120
const FALLBACK_ROW_HEIGHT = 44

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

function normalizeMonthYear(rawMonth: number, rawYear: number): SelectorMonthPayload {
  const totalMonths = (rawYear * 12) + rawMonth
  const year = Math.floor(totalMonths / 12)
  const month = ((totalMonths % 12) + 12) % 12
  return { month, year }
}

function addMonths(month: number, year: number, delta: number): SelectorMonthPayload {
  return normalizeMonthYear(month + delta, year)
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

function markProgrammaticScrollSync() {
  isProgrammaticScrollSync.value = true
  if (programmaticSyncTimeoutId !== null)
    clearTimeout(programmaticSyncTimeoutId)
  programmaticSyncTimeoutId = setTimeout(() => {
    isProgrammaticScrollSync.value = false
  }, PROGRAMMATIC_SCROLL_SYNC_MS)
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

function syncSelectorToSelected(force = false) {
  if (!props.selectorMode || props.selectedMonth === null || props.selectedYear === null)
    return

  if (!force && isUserScrolling.value)
    return

  anchorSelection.value = { month: props.selectedMonth, year: props.selectedYear }
  lastEmittedScrollKey = monthKey(props.selectedMonth, props.selectedYear)

  nextTick(() => {
    markProgrammaticScrollSync()
    updateSelectorMetrics()
    scrollToIndex(SELECTOR_CENTER_INDEX)
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

  if (event.key === 'ArrowDown' || event.key === 'PageDown') {
    event.preventDefault()
    const current = getSelectionBase()
    const next = addMonths(current.month, current.year, 1)
    emitScrollMonth(next)
    return
  }

  if (event.key === 'ArrowUp' || event.key === 'PageUp') {
    event.preventDefault()
    const current = getSelectionBase()
    const next = addMonths(current.month, current.year, -1)
    emitScrollMonth(next)
  }
}

function onMonthClick(item: SelectorMonthItem) {
  if (!props.selectorMode) {
    emit('updateMonth', item.month)
    return
  }

  markProgrammaticScrollSync()
  scrollToIndex(item.index, 'smooth')
  emitScrollMonth({ month: item.month, year: item.year })
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

    if (shouldForceSync) {
      syncSelectorToSelected(true)
      return
    }

    if (!monthChanged && !yearChanged)
      return

    const selectedKey = monthKey(selectedMonth, selectedYear)
    const isScrollDrivenUpdate = selectedKey === lastEmittedScrollKey
    if (isScrollDrivenUpdate)
      return

    syncSelectorToSelected()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (scrollFrameId !== null)
    cancelAnimationFrame(scrollFrameId)
  if (scrollIdleTimeoutId !== null)
    clearTimeout(scrollIdleTimeoutId)
  if (programmaticSyncTimeoutId !== null)
    clearTimeout(programmaticSyncTimeoutId)
})
</script>

<template>
  <div v-if="!props.selectorMode" class="flex flex-wrap mt-1.5">
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

  <div v-else class="mt-1.5 h-64 w-full min-w-0">
    <div class="relative h-full w-full min-w-0 overflow-hidden rounded-md">
      <div
        ref="selectorContainerRef"
        class="h-full w-full min-w-0 overflow-y-auto px-0.5 py-1 select-none"
        role="listbox"
        aria-label="Month selector"
        :tabindex="props.selectorFocus === 'month' ? 0 : -1"
        @scroll.passive="onSelectorScroll"
        @keydown="onSelectorKeydown"
      >
        <div
          v-for="item in selectorMonthItems"
          :key="item.key"
          :data-month-index="item.index"
          class="h-11 flex items-center"
        >
          <button
            :id="`vtd-selector-month-${item.year}-${item.month}`"
            type="button"
            role="option"
            :aria-selected="props.selectedMonth === item.month && props.selectedYear === item.year"
            class="vtd-month-selector-btn px-3 py-2 block w-full rounded-[8px] tracking-wide transition-colors border focus:outline-hidden uppercase"
            :class="[
              props.selectedMonth === item.month && props.selectedYear === item.year
                ? 'vtd-month-selector-btn-selected'
                : 'vtd-month-selector-btn-default bg-transparent border-transparent focus:bg-vtd-primary-50 focus:text-vtd-secondary-900 focus:border-vtd-primary-300 dark:focus:bg-vtd-secondary-700 dark:focus:text-vtd-secondary-100',
            ]"
            @click="onMonthClick(item)"
            v-text="props.months[item.month]"
          />
        </div>
      </div>
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
