<script setup lang="ts">
import { computed, ref } from 'vue'

type PickerViewMode = 'calendar' | 'selector'
type SelectorFocus = 'month' | 'year'
type SelectionPanel = 'previous' | 'next'

const props = withDefaults(
  defineProps<{
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
      stepPreviousYear: () => void
      stepNextYear: () => void
      openMonth: () => void
      setMonth: ($event: number) => void
      openYear: () => void
      setYear: ($event: number) => void
    }
    selectorMode?: boolean
    selectorFocus?: SelectorFocus
    pickerViewMode?: PickerViewMode
    panelName?: SelectionPanel
  }>(),
  {
    selectorMode: false,
    selectorFocus: 'month',
    pickerViewMode: 'calendar',
    panelName: 'previous',
  },
)

const emit = defineEmits<{
  (e: 'enter-selector-mode', payload: { panel: SelectionPanel, focus: SelectorFocus }): void
  (e: 'toggle-picker-view', payload: { panel: SelectionPanel, focus: SelectorFocus }): void
  (e: 'focus-selector-column', payload: { panel: SelectionPanel, focus: SelectorFocus }): void
  (e: 'step-month', payload: { panel: SelectionPanel, delta: -1 | 1 }): void
}>()

const SIDE_NAV_BUTTON_CLASS
  = 'vtd:p-1.5 vtd:rounded-full vtd:bg-white vtd:text-vtd-secondary-600 vtd:transition-colors vtd:border vtd:border-transparent vtd:hover:bg-vtd-secondary-100 vtd:hover:text-vtd-secondary-900 vtd:focus:bg-vtd-primary-50 vtd:focus:text-vtd-secondary-900 vtd:focus:border-vtd-primary-300 vtd:focus:ring-3 vtd:focus:ring-vtd-primary-500/10 vtd:focus:outline-hidden vtd:dark:bg-vtd-secondary-800 vtd:dark:text-vtd-secondary-300 vtd:dark:hover:bg-vtd-secondary-700 vtd:dark:hover:text-vtd-secondary-300 vtd:dark:focus:bg-vtd-secondary-600/50 vtd:dark:focus:text-vtd-secondary-100 vtd:dark:focus:border-vtd-primary-500 vtd:dark:focus:ring-vtd-primary-500/25'

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
  return direction === 'previous' ? 'M11 19l-7-7 7-7m8 14l-7-7 7-7' : 'M13 5l7 7-7 7M5 5l7 7-7 7'
}

function onHeaderValueClick(focus: SelectorFocus) {
  const openLegacyPanel = () => {
    if (focus === 'month')
      props.calendar.openMonth()
    else props.calendar.openYear()
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
      return clickX < rect.width / 2 ? 'month' : 'year'
  }

  return props.selectorFocus
}

function onSelectorHeaderClickWithHeuristic(event: MouseEvent) {
  onSelectorHeaderClick(resolveSelectorFocusFromClick(event))
}

function resolveArrowMonthDelta(key: string): -1 | 1 | null {
  if (key === 'ArrowRight')
    return 1
  if (key === 'ArrowLeft')
    return -1
  return null
}

function focusCalendarDateFromHeader(target: EventTarget | null) {
  if (!(target instanceof HTMLElement))
    return false

  const panelRoot = target.closest<HTMLElement>('[data-vtd-selector-panel]')
  if (!panelRoot)
    return false

  const calendarTarget
    = panelRoot.querySelector<HTMLElement>('.vtd-calendar-focus-target')
      ?? panelRoot.querySelector<HTMLElement>('.vtd-datepicker-date:not(:disabled)')
  if (!(calendarTarget instanceof HTMLElement))
    return false

  calendarTarget.focus()
  return true
}

function shouldHandleHeaderArrowMonthStep() {
  if (!props.selectorMode)
    return true
  return props.pickerViewMode === 'calendar'
}

function onMonthHeaderKeydown(event: KeyboardEvent) {
  if (props.selectorMode && props.pickerViewMode === 'selector') {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault()
      event.stopPropagation()
      emit('focus-selector-column', {
        panel: props.panelName,
        focus: props.selectorFocus,
      })
      return
    }

    const delta = resolveArrowMonthDelta(event.key)
    if (delta) {
      event.preventDefault()
      event.stopPropagation()
      emit('step-month', { panel: props.panelName, delta })
      return
    }

    if (
      event.key === 'Enter'
      || event.key === 'Escape'
      || event.key === ' '
      || event.key === 'Spacebar'
    ) {
      event.preventDefault()
      event.stopPropagation()
      emit('toggle-picker-view', {
        panel: props.panelName,
        focus: props.selectorFocus,
      })
    }
    return
  }

  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    if (focusCalendarDateFromHeader(event.currentTarget)) {
      event.preventDefault()
      event.stopPropagation()
    }
    return
  }

  const delta = resolveArrowMonthDelta(event.key)
  if (!delta || !shouldHandleHeaderArrowMonthStep())
    return

  event.preventDefault()
  event.stopPropagation()

  if (props.selectorMode) {
    emit('step-month', { panel: props.panelName, delta })
    return
  }

  if (delta > 0) {
    props.calendar.onNext()
    return
  }

  props.calendar.onPrevious()
}

function onYearHeaderKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowRight') {
    event.preventDefault()
    event.stopPropagation()
    props.calendar.stepNextYear()
    return
  }

  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    event.stopPropagation()
    props.calendar.stepPreviousYear()
  }
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
  <div class="vtd:flex vtd:min-h-[3.25rem] vtd:justify-between vtd:items-center vtd:px-2 vtd:py-1.5">
    <div class="vtd:shrink-0">
      <span
        v-show="panel.calendar || panel.year"
        class="vtd:inline-flex vtd:rounded-full"
      >
        <button
          type="button"
          :aria-label="sideButtonAriaLabel('previous')"
          :class="[
            SIDE_NAV_BUTTON_CLASS,
            isSelectorWheelView
              ? 'vtd:opacity-65 vtd:hover:opacity-90'
              : '',
          ]"
          @click="onSidePreviousClick"
        >
          <svg
            class="vtd:w-5 vtd:h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
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
    <div class="vtd:px-1.5 vtd:flex vtd:flex-1 vtd:min-w-0 vtd:items-center vtd:justify-center vtd:gap-1.5">
      <template v-if="props.selectorMode">
        <span class="vtd:flex vtd:rounded-md vtd:w-[10.5rem] vtd:shrink-0">
          <button
            :id="`vtd-header-${props.panelName}-month`"
            type="button"
            :aria-expanded="props.pickerViewMode === 'selector'"
            aria-label="Toggle month and year selector"
            class="group vtd:relative vtd:px-3 vtd:pl-8 vtd:pr-8 vtd:py-1.5 vtd:inline-flex vtd:items-center vtd:justify-center vtd:w-full vtd:leading-relaxed vtd:rounded-md vtd:text-xs vtd:2xl:text-sm vtd:tracking-wide vtd:text-vtd-secondary-700 vtd:font-semibold vtd:sm:font-medium vtd:transition-colors vtd:border vtd:border-vtd-primary-300/65 vtd:bg-vtd-primary-50/45 vtd:hover:bg-vtd-primary-100/70 vtd:hover:text-vtd-secondary-900 vtd:focus:bg-vtd-primary-100/80 vtd:focus:text-vtd-secondary-900 vtd:focus:border-vtd-primary-400 vtd:focus:ring-3 vtd:focus:ring-vtd-primary-500/15 vtd:focus:outline-hidden vtd:uppercase vtd:truncate vtd:dark:bg-vtd-secondary-700/45 vtd:dark:text-vtd-secondary-100 vtd:dark:border-vtd-primary-500/35 vtd:dark:hover:bg-vtd-secondary-700/70 vtd:dark:focus:bg-vtd-secondary-700/75 vtd:dark:focus:border-vtd-primary-500 vtd:dark:focus:ring-vtd-primary-500/25"
            @click="onSelectorHeaderClickWithHeuristic"
            @keydown="onMonthHeaderKeydown"
          >
            <span class="vtd:inline-flex vtd:items-center vtd:gap-1.5 vtd:text-center">
              <span ref="selectorMonthTextRef" @click.stop="onSelectorHeaderClick('month')">
                {{ calendar.month }}
              </span>
              <span
                ref="selectorYearTextRef"
                class="vtd:tabular-nums"
                @click.stop="onSelectorHeaderClick('year')"
              >{{ calendar.year }}</span>
            </span>
            <svg
              class="vtd:pointer-events-none vtd:h-3.5 vtd:w-3.5 vtd:absolute vtd:right-3 vtd:top-1/2 vtd:-translate-y-1/2 vtd:transition-transform vtd:duration-150"
              :class="props.pickerViewMode === 'selector' ? 'vtd:rotate-180' : ''"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </span>
      </template>
      <template v-else>
        <span class="vtd:flex vtd:rounded-md vtd:w-[4.75rem] vtd:shrink-0">
          <button
            :id="`vtd-header-${props.panelName}-month`"
            type="button"
            class="vtd:px-3 vtd:py-1.5 vtd:block vtd:w-full vtd:leading-relaxed vtd:rounded-md vtd:bg-white vtd:text-xs vtd:2xl:text-sm vtd:tracking-wide vtd:text-vtd-secondary-600 vtd:font-semibold vtd:sm:font-medium vtd:transition-colors vtd:border vtd:border-transparent vtd:hover:bg-vtd-secondary-100 vtd:hover:text-vtd-secondary-900 vtd:focus:bg-vtd-primary-50 vtd:focus:text-vtd-secondary-900 vtd:focus:border-vtd-primary-300 vtd:focus:ring-3 vtd:focus:ring-vtd-primary-500/10 vtd:focus:outline-hidden vtd:uppercase vtd:truncate vtd:dark:bg-vtd-secondary-800 vtd:dark:text-vtd-secondary-300 vtd:dark:hover:bg-vtd-secondary-700 vtd:dark:hover:text-vtd-secondary-300 vtd:dark:focus:bg-vtd-secondary-600/50 vtd:dark:focus:text-vtd-secondary-100 vtd:dark:focus:border-vtd-primary-500 vtd:dark:focus:ring-vtd-primary-500/25"
            @click="onHeaderValueClick('month')"
            @keydown="onMonthHeaderKeydown"
            v-text="calendar.month"
          />
        </span>
        <span class="vtd:flex vtd:rounded-md vtd:w-[4.75rem] vtd:shrink-0">
          <button
            :id="`vtd-header-${props.panelName}-year`"
            type="button"
            class="vtd:px-3 vtd:py-1.5 vtd:block vtd:w-full vtd:leading-relaxed vtd:rounded-md vtd:bg-white vtd:text-xs vtd:2xl:text-sm vtd:tracking-wide vtd:text-vtd-secondary-600 vtd:font-semibold vtd:sm:font-medium vtd:transition-colors vtd:border vtd:border-transparent vtd:hover:bg-vtd-secondary-100 vtd:hover:text-vtd-secondary-900 vtd:focus:bg-vtd-primary-50 vtd:focus:text-vtd-secondary-900 vtd:focus:border-vtd-primary-300 vtd:focus:ring-3 vtd:focus:ring-vtd-primary-500/10 vtd:focus:outline-hidden vtd:uppercase vtd:truncate vtd:dark:bg-vtd-secondary-800 vtd:dark:text-vtd-secondary-300 vtd:dark:hover:bg-vtd-secondary-700 vtd:dark:hover:text-vtd-secondary-300 vtd:dark:focus:bg-vtd-secondary-600/50 vtd:dark:focus:text-vtd-secondary-100 vtd:dark:focus:border-vtd-primary-500 vtd:dark:focus:ring-vtd-primary-500/25"
            @click="onHeaderValueClick('year')"
            @keydown="onYearHeaderKeydown"
            v-text="calendar.year"
          />
        </span>
      </template>
    </div>
    <div class="vtd:shrink-0">
      <span v-show="panel.calendar || panel.year" class="vtd:inline-flex vtd:rounded-full">
        <button
          type="button"
          :aria-label="sideButtonAriaLabel('next')"
          :class="[SIDE_NAV_BUTTON_CLASS, isSelectorWheelView ? 'vtd:opacity-65 vtd:hover:opacity-90' : '']"
          @click="onSideNextClick"
        >
          <svg
            class="vtd:w-5 vtd:h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              :d="sideButtonPath('next')"
            />
          </svg>
        </button>
      </span>
    </div>
  </div>
</template>
