<script setup lang="ts">
import { computed, ref } from 'vue'

type PickerViewMode = 'calendar' | 'selector'
type SelectorFocus = 'month' | 'year'
type SelectionPanel = 'previous' | 'next'

const props = withDefaults(defineProps<{
  panel: {
    calendar: boolean
    month: boolean
    year: boolean
  }
  calendar: {
    date: () => any[]
    month: string
    year: number
    years: () => number[]
    onPrevious: () => void
    onNext: () => void
    onPreviousYear: () => void
    onNextYear: () => void
    openMonth: () => void
    setMonth: ($event: number) => void
    openYear: () => void
    setYear: ($event: number) => void
  }
  selectorMode?: boolean
  selectorFocus?: SelectorFocus
  pickerViewMode?: PickerViewMode
  panelName?: SelectionPanel
}>(), {
  selectorMode: false,
  selectorFocus: 'month',
  pickerViewMode: 'calendar',
  panelName: 'previous',
})

const emit = defineEmits<{
  (e: 'enter-selector-mode', payload: { panel: SelectionPanel; focus: SelectorFocus }): void
  (e: 'toggle-picker-view', payload: { panel: SelectionPanel; focus: SelectorFocus }): void
  (e: 'step-month', payload: { panel: SelectionPanel; delta: -1 | 1 }): void
}>()

const SIDE_NAV_BUTTON_CLASS
  = 'p-1.5 rounded-full bg-white text-vtd-secondary-600 transition-colors border border-transparent hover:bg-vtd-secondary-100 hover:text-vtd-secondary-900 focus:bg-vtd-primary-50 focus:text-vtd-secondary-900 focus:border-vtd-primary-300 focus:ring-3 focus:ring-vtd-primary-500/10 focus:outline-hidden dark:bg-vtd-secondary-800 dark:text-vtd-secondary-300 dark:hover:bg-vtd-secondary-700 dark:hover:text-vtd-secondary-300 dark:focus:bg-vtd-secondary-600/50 dark:focus:text-vtd-secondary-100 dark:focus:border-vtd-primary-500 dark:focus:ring-opacity-25'

const isSelectorWheelView = computed(() => {
  return props.selectorMode && props.pickerViewMode === 'selector'
})

function isMonthSideNavigation() {
  return props.selectorMode || props.panel.calendar
}

function sideButtonAriaLabel(direction: 'previous' | 'next') {
  const subject = isMonthSideNavigation() ? 'month' : 'year'
  const verb = direction === 'previous' ? 'Previous' : 'Next'
  return `${verb} ${subject}`
}

function sideButtonPath(direction: 'previous' | 'next') {
  if (isMonthSideNavigation())
    return direction === 'previous' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'
  return direction === 'previous'
    ? 'M11 19l-7-7 7-7m8 14l-7-7 7-7'
    : 'M13 5l7 7-7 7M5 5l7 7-7 7'
}

function onHeaderValueClick(focus: SelectorFocus) {
  const openLegacyPanel = () => {
    if (focus === 'month')
      props.calendar.openMonth()
    else
      props.calendar.openYear()
  }

  if (!props.selectorMode) {
    openLegacyPanel()
    return
  }

  if (props.pickerViewMode === 'selector') {
    emit('toggle-picker-view', { panel: props.panelName, focus })
    return
  }

  emit('enter-selector-mode', { panel: props.panelName, focus })
}

function onSelectorHeaderClick(focus: SelectorFocus = 'month') {
  onHeaderValueClick(focus)
}

const selectorMonthTextRef = ref<HTMLElement | null>(null)
const selectorYearTextRef = ref<HTMLElement | null>(null)

function resolveSelectorFocusFromClick(event: MouseEvent): SelectorFocus {
  // Keyboard-triggered click events (Enter/Space) report detail=0.
  if (event.detail === 0)
    return props.selectorFocus

  const target = event.target
  if (target instanceof Node) {
    if (selectorMonthTextRef.value?.contains(target))
      return 'month'
    if (selectorYearTextRef.value?.contains(target))
      return 'year'
  }

  const currentTarget = event.currentTarget
  if (currentTarget instanceof HTMLElement) {
    const rect = currentTarget.getBoundingClientRect()
    const clickX = event.clientX - rect.left
    if (clickX >= 0 && clickX <= rect.width)
      return clickX < (rect.width / 2) ? 'month' : 'year'
  }

  return props.selectorFocus
}

function onSelectorHeaderClickWithHeuristic(event: MouseEvent) {
  onSelectorHeaderClick(resolveSelectorFocusFromClick(event))
}

function onSidePreviousClick() {
  if (isSelectorWheelView.value) {
    emit('step-month', { panel: props.panelName, delta: -1 })
    return
  }

  if (isMonthSideNavigation()) {
    props.calendar.onPrevious()
    return
  }
  props.calendar.onPreviousYear()
}

function onSideNextClick() {
  if (isSelectorWheelView.value) {
    emit('step-month', { panel: props.panelName, delta: 1 })
    return
  }

  if (isMonthSideNavigation()) {
    props.calendar.onNext()
    return
  }
  props.calendar.onNextYear()
}
</script>

<template>
  <div class="flex justify-between items-center px-2 py-1.5">
    <div class="shrink-0">
      <span
        v-show="panel.calendar || panel.year"
        class="inline-flex rounded-full"
      >
        <button
          type="button"
          :aria-label="sideButtonAriaLabel('previous')"
          :class="[
            SIDE_NAV_BUTTON_CLASS,
            isSelectorWheelView
              ? 'opacity-65 hover:opacity-90'
              : '',
          ]"
          @click="onSidePreviousClick"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              :d="sideButtonPath('previous')"
            />
          </svg>
        </button>
      </span>
    </div>
    <div class="px-1.5 flex flex-1 min-w-0 items-center justify-center gap-1.5">
      <template v-if="props.selectorMode">
        <span class="flex rounded-md w-[10.5rem] shrink-0">
          <button
            :id="`vtd-header-${props.panelName}-month`"
            type="button"
            :aria-expanded="props.pickerViewMode === 'selector'"
            aria-label="Toggle month and year selector"
            class="group relative px-3 pl-8 pr-8 py-1.5 inline-flex items-center justify-center w-full leading-relaxed rounded-md text-xs 2xl:text-sm tracking-wide text-vtd-secondary-700 font-semibold sm:font-medium transition-colors border border-vtd-primary-300/65 bg-vtd-primary-50/45 hover:bg-vtd-primary-100/70 hover:text-vtd-secondary-900 focus:bg-vtd-primary-100/80 focus:text-vtd-secondary-900 focus:border-vtd-primary-400 focus:ring-3 focus:ring-vtd-primary-500/15 focus:outline-hidden uppercase truncate dark:bg-vtd-secondary-700/45 dark:text-vtd-secondary-100 dark:border-vtd-primary-500/35 dark:hover:bg-vtd-secondary-700/70 dark:focus:bg-vtd-secondary-700/75 dark:focus:border-vtd-primary-500 dark:focus:ring-opacity-25"
            @click="onSelectorHeaderClickWithHeuristic"
          >
            <span class="inline-flex items-center gap-1.5 text-center">
              <span ref="selectorMonthTextRef" @click.stop="onSelectorHeaderClick('month')">{{ calendar.month }}</span>
              <span ref="selectorYearTextRef" class="tabular-nums" @click.stop="onSelectorHeaderClick('year')">{{ calendar.year }}</span>
            </span>
            <svg
              class="pointer-events-none h-3.5 w-3.5 absolute right-3 top-1/2 -translate-y-1/2 transition-transform duration-150"
              :class="props.pickerViewMode === 'selector' ? 'rotate-180' : ''"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
            </svg>
          </button>
        </span>
      </template>
      <template v-else>
        <span class="flex rounded-md w-[4.75rem] shrink-0">
          <button
            :id="`vtd-header-${props.panelName}-month`"
            type="button"
            class="px-3 py-1.5 block w-full leading-relaxed rounded-md bg-white text-xs 2xl:text-sm tracking-wide text-vtd-secondary-600 font-semibold sm:font-medium transition-colors border border-transparent hover:bg-vtd-secondary-100 hover:text-vtd-secondary-900 focus:bg-vtd-primary-50 focus:text-vtd-secondary-900 focus:border-vtd-primary-300 focus:ring-3 focus:ring-vtd-primary-500/10 focus:outline-hidden uppercase truncate dark:bg-vtd-secondary-800 dark:text-vtd-secondary-300 dark:hover:bg-vtd-secondary-700 dark:hover:text-vtd-secondary-300 dark:focus:bg-vtd-secondary-600/50 dark:focus:text-vtd-secondary-100 dark:focus:border-vtd-primary-500 dark:focus:ring-opacity-25"
            @click="onHeaderValueClick('month')" v-text="calendar.month"
          />
        </span>
        <span class="flex rounded-md w-[4.75rem] shrink-0">
          <button
            :id="`vtd-header-${props.panelName}-year`"
            type="button"
            class="px-3 py-1.5 block w-full leading-relaxed rounded-md bg-white text-xs 2xl:text-sm tracking-wide text-vtd-secondary-600 font-semibold sm:font-medium transition-colors border border-transparent hover:bg-vtd-secondary-100 hover:text-vtd-secondary-900 focus:bg-vtd-primary-50 focus:text-vtd-secondary-900 focus:border-vtd-primary-300 focus:ring-3 focus:ring-vtd-primary-500/10 focus:outline-hidden uppercase truncate dark:bg-vtd-secondary-800 dark:text-vtd-secondary-300 dark:hover:bg-vtd-secondary-700 dark:hover:text-vtd-secondary-300 dark:focus:bg-vtd-secondary-600/50 dark:focus:text-vtd-secondary-100 dark:focus:border-vtd-primary-500 dark:focus:ring-opacity-25"
            @click="onHeaderValueClick('year')" v-text="calendar.year"
          />
        </span>
      </template>
    </div>
    <div class="shrink-0">
      <span
        v-show="panel.calendar || panel.year"
        class="inline-flex rounded-full"
      >
        <button
          type="button"
          :aria-label="sideButtonAriaLabel('next')"
          :class="[
            SIDE_NAV_BUTTON_CLASS,
            isSelectorWheelView
              ? 'opacity-65 hover:opacity-90'
              : '',
          ]"
          @click="onSideNextClick"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
              stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              :d="sideButtonPath('next')"
            />
          </svg>
        </button>
      </span>
    </div>
  </div>
</template>
