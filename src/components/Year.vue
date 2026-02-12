<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  years: number[]
  selectorMode?: boolean
  selectedYear?: number | null
  selectedMonth?: number | null
  yearScrollMode?: 'boundary' | 'fractional'
}>(), {
  selectorMode: false,
  selectedYear: null,
  selectedMonth: null,
  yearScrollMode: 'boundary',
})

const emit = defineEmits<{
  (e: 'updateYear', value: number): void
  (e: 'scrollYear', value: number): void
}>()

const selectorContainerRef = ref<HTMLDivElement | null>(null)
const isUserScrolling = ref(false)
const isProgrammaticScrollSync = ref(false)
const selectorScrollTop = ref(0)
const selectorViewportHeight = ref(256)
const selectorRowHeight = ref(44)
const selectorPaddingTop = ref(0)
let scrollFrameId: number | null = null
let scrollIdleTimeoutId: ReturnType<typeof setTimeout> | null = null
let programmaticSyncTimeoutId: ReturnType<typeof setTimeout> | null = null
let lastEmittedScrollYear: number | null = null
let suppressSelectedYearSyncUntil = 0
const USER_SCROLL_IDLE_MS = 120
const PROGRAMMATIC_SCROLL_SYNC_MS = 180
const CLICK_SYNC_SUPPRESS_MS = 360
const SMOOTH_SCROLL_SYNC_MS = 520
const FALLBACK_ROW_HEIGHT = 44

function isSelectedYear(year: number) {
  return props.selectedYear === year
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
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

  const firstRow = container.querySelector<HTMLDivElement>('[data-year-index="0"]')
  if (firstRow && firstRow.offsetHeight > 0)
    selectorRowHeight.value = firstRow.offsetHeight
}

function centerYearByIndex(index: number, behavior: ScrollBehavior = 'auto') {
  const container = selectorContainerRef.value
  if (!container)
    return

  const rowHeight = selectorRowHeight.value || FALLBACK_ROW_HEIGHT
  const centeredScrollTop
    = selectorPaddingTop.value
      + (index * rowHeight)
      - container.clientHeight / 2
      + rowHeight / 2

  markProgrammaticScrollSync(behavior === 'smooth' ? SMOOTH_SCROLL_SYNC_MS : PROGRAMMATIC_SCROLL_SYNC_MS)
  container.scrollTo({
    top: Math.max(0, centeredScrollTop),
    behavior,
  })
}

function getYearFractionalOffset() {
  if (props.yearScrollMode !== 'fractional' || props.selectedMonth === null)
    return 0
  const monthIndex = clamp(props.selectedMonth, 0, 11)
  const JUNE_INDEX = 5
  return (monthIndex - JUNE_INDEX) / 12
}

function shouldSuppressSelectedYearSync() {
  return Date.now() < suppressSelectedYearSyncUntil
}

function getCenteredYear() {
  const years = props.years
  if (years.length === 0)
    return null

  const rowHeight = selectorRowHeight.value || FALLBACK_ROW_HEIGHT
  const viewportHeight = selectorViewportHeight.value || 256
  const centeredIndex = clamp(
    Math.round(
      (
        selectorScrollTop.value
        - selectorPaddingTop.value
        + (viewportHeight / 2)
        - (rowHeight / 2)
      ) / rowHeight,
    ),
    0,
    years.length - 1,
  )

  return years[centeredIndex] ?? null
}

function scrollSelectedYearIntoView(behavior: ScrollBehavior = 'auto') {
  if (!props.selectorMode || props.selectedYear === null)
    return

  const selectedYearIndex = props.years.findIndex(year => year === props.selectedYear)
  if (selectedYearIndex < 0)
    return

  updateSelectorMetrics()
  lastEmittedScrollYear = props.selectedYear
  centerYearByIndex(selectedYearIndex + getYearFractionalOffset(), behavior)
}

function onYearClick(year: number) {
  if (!props.selectorMode) {
    emit('updateYear', year)
    return
  }

  const targetIndex = props.years.findIndex(value => value === year)
  if (targetIndex >= 0) {
    updateSelectorMetrics()
    centerYearByIndex(targetIndex, 'smooth')
  }
  suppressSelectedYearSyncUntil = Date.now() + CLICK_SYNC_SUPPRESS_MS
  emit('updateYear', year)
}

function flushScrollYearUpdate() {
  scrollFrameId = null
  const centeredYear = getCenteredYear()
  if (centeredYear === null || centeredYear === props.selectedYear || centeredYear === lastEmittedScrollYear)
    return

  lastEmittedScrollYear = centeredYear
  emit('scrollYear', centeredYear)
}

function onSelectorScroll() {
  if (!props.selectorMode)
    return

  updateSelectorMetrics()
  // Ignore synthetic scroll events triggered by selected-year auto-centering.
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
  scrollFrameId = requestAnimationFrame(flushScrollYearUpdate)
}

watch(
  () => [
    props.selectorMode,
    props.selectedYear,
    props.selectedMonth,
    props.years[0],
    props.years[props.years.length - 1],
  ],
  (
    [isSelectorMode, selectedYear, selectedMonth, firstYear, lastYear],
    previous = [],
  ) => {
    if (!isSelectorMode || selectedYear === null)
      return

    const previousFirstYear = previous[3]
    const previousLastYear = previous[4]
    const previousSelectedYear = typeof previous[1] === 'number' ? previous[1] : null
    const previousSelectedMonth = typeof previous[2] === 'number' ? previous[2] : null
    const yearWindowChanged = firstYear !== previousFirstYear || lastYear !== previousLastYear
    const selectedYearNumber = typeof selectedYear === 'number' ? selectedYear : null
    const selectedMonthNumber = typeof selectedMonth === 'number' ? selectedMonth : null
    const monthDriftEnabled = props.yearScrollMode === 'fractional'
    if (!monthDriftEnabled && selectedYearNumber === previousSelectedYear && !yearWindowChanged)
      return
    const shouldSmoothSync
      = previousSelectedYear !== null
        && selectedYearNumber !== null
        && (
          (
            selectedYearNumber !== previousSelectedYear
            && Math.abs(selectedYearNumber - previousSelectedYear) <= 1
          )
          || (
            monthDriftEnabled
            && previousSelectedMonth !== null
            && selectedMonthNumber !== null
            && selectedMonthNumber !== previousSelectedMonth
          )
        )
        && !yearWindowChanged
    if (shouldSuppressSelectedYearSync() && !yearWindowChanged)
      return
    if (isUserScrolling.value && !yearWindowChanged)
      return
    nextTick(() => {
      scrollSelectedYearIntoView(shouldSmoothSync ? 'smooth' : 'auto')
    })
  },
  { immediate: true },
)

watch(
  () => props.selectedYear,
  (year) => {
    if (year !== null)
      lastEmittedScrollYear = year
  },
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
  <div :class="props.selectorMode ? 'mt-1.5 w-full min-w-0' : 'flex flex-wrap'">
    <template v-if="props.selectorMode">
      <div
        ref="selectorContainerRef"
        class="h-64 w-full min-w-0 overflow-y-scroll px-0.5 py-1"
        :class="isUserScrolling ? 'vtd-year-scrolling' : ''"
        role="listbox"
        aria-label="Year selector"
        @scroll.passive="onSelectorScroll"
      >
        <div v-for="(year, index) in years" :key="year" :data-year-index="index" class="h-11 flex items-center">
          <button
            type="button"
            :data-year="year"
            class="px-3 py-2 block w-full leading-6 rounded-md text-xs 2xl:text-sm tracking-wide tabular-nums font-medium transition-colors border shadow-[inset_0_0_0_1px_rgb(148_163_184/10%)] dark:shadow-[inset_0_0_0_1px_rgb(148_163_184/16%)] focus:outline-hidden"
            :class="[
              isSelectedYear(year)
                ? 'bg-vtd-primary-50 text-vtd-primary-700 border-vtd-primary-300 dark:bg-vtd-primary-500/20 dark:text-vtd-primary-200 dark:border-vtd-primary-500/40'
                : 'bg-white text-vtd-secondary-600 border-transparent hover:bg-vtd-secondary-100 hover:text-vtd-secondary-900 focus:bg-vtd-primary-50 focus:text-vtd-secondary-900 focus:border-vtd-primary-300 dark:bg-vtd-secondary-800 dark:hover:bg-vtd-secondary-700 dark:text-vtd-secondary-300 dark:hover:text-vtd-secondary-100 dark:focus:bg-vtd-secondary-700',
            ]"
            :aria-selected="isSelectedYear(year)"
            @click="onYearClick(year)"
            v-text="year"
          />
        </div>
      </div>
    </template>

    <template v-else>
      <div v-for="(year, key) in years" :key="key" class="w-1/2 px-0.5">
        <span class="flex rounded-md mt-1.5">
          <button
            type="button"
            class="px-3 py-2 block w-full leading-6 rounded-md bg-white text-xs 2xl:text-sm tracking-wide tabular-nums text-vtd-secondary-600 font-medium transition-colors border border-transparent hover:bg-vtd-secondary-100 hover:text-vtd-secondary-900 focus:bg-vtd-primary-50 focus:text-vtd-secondary-900 focus:border-vtd-primary-300 focus:ring-3 focus:ring-vtd-primary-500/10 focus:outline-hidden uppercase dark:bg-vtd-secondary-800 dark:hover:bg-vtd-secondary-700 dark:text-vtd-secondary-300 dark:hover:text-vtd-secondary-100 dark:focus:bg-vtd-secondary-700"
            @click="emit('updateYear', year)"
            v-text="year"
          />
        </span>
      </div>
    </template>
  </div>
</template>
