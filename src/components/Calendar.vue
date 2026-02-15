<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { injectStrict } from '../utils'
import {
  atMouseOverKey,
  betweenRangeClassesKey,
  datepickerClassesKey,
  isBetweenRangeKey,
} from '../keys'

const props = defineProps<{
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
  weeks: string[]
  weekNumber: boolean
  asRange: boolean
}>()

const emit = defineEmits<{
  (e: 'updateDate', event: any): void
}>()

const isBetweenRange = injectStrict(isBetweenRangeKey)
const betweenRangeClasses = injectStrict(betweenRangeClassesKey)
const datepickerClasses = injectStrict(datepickerClassesKey)
const atMouseOver = injectStrict(atMouseOverKey)

const calendarDates = computed(() => props.calendar.date())
const focusedDateKey = ref<string | null>(null)
const calendarRootRef = ref<HTMLElement | null>(null)

function getDateKey(date: any) {
  return date.format('YYYY-MM-DD')
}

function resolveDateFlag(date: any, key: string) {
  const value = date?.[key]
  if (typeof value === 'function')
    return !!value.call(date)
  return !!value
}

function isDateDisabled(date: any) {
  return resolveDateFlag(date, 'disabled')
}

function isDateInRange(date: any) {
  return resolveDateFlag(date, 'inRange')
}

function isDateActive(date: any) {
  return resolveDateFlag(date, 'active')
}

function isDateToday(date: any) {
  return resolveDateFlag(date, 'today')
}

function isDateFocusable(date: any) {
  return !isDateDisabled(date) && !isDateInRange(date)
}

function resolveDefaultFocusKey(dates = calendarDates.value) {
  const activeDate = dates.find((date: any) => isDateFocusable(date) && isDateActive(date))
  if (activeDate)
    return getDateKey(activeDate)

  const todayDate = dates.find((date: any) => isDateFocusable(date) && isDateToday(date))
  if (todayDate)
    return getDateKey(todayDate)

  const firstFocusable = dates.find((date: any) => isDateFocusable(date))
  return firstFocusable ? getDateKey(firstFocusable) : null
}

function ensureFocusedDateKey(dates = calendarDates.value) {
  if (!focusedDateKey.value) {
    focusedDateKey.value = resolveDefaultFocusKey(dates)
    return
  }

  const stillFocusable = dates.some((date: any) => getDateKey(date) === focusedDateKey.value && isDateFocusable(date))
  if (!stillFocusable)
    focusedDateKey.value = resolveDefaultFocusKey(dates)
}

function isCalendarFocusTarget(date: any) {
  if (!isDateFocusable(date))
    return false
  if (!focusedDateKey.value)
    ensureFocusedDateKey()
  return focusedDateKey.value === getDateKey(date)
}

function focusDateByIndex(index: number) {
  const dates = calendarDates.value
  const targetDate = dates[index]
  if (!targetDate || !isDateFocusable(targetDate))
    return

  focusedDateKey.value = getDateKey(targetDate)
  const root = calendarRootRef.value
  if (!root)
    return
  const selector = `[data-date-key="${focusedDateKey.value}"]`
  const targetButton = root.querySelector<HTMLButtonElement>(selector)
  targetButton?.focus()
}

function findFocusableIndexFrom(startIndex: number, step: number) {
  const dates = calendarDates.value
  let nextIndex = startIndex + step
  while (nextIndex >= 0 && nextIndex < dates.length) {
    if (isDateFocusable(dates[nextIndex]))
      return nextIndex
    nextIndex += step
  }
  return -1
}

function onDateFocus(date: any) {
  if (!isDateFocusable(date))
    return
  focusedDateKey.value = getDateKey(date)
  // Mirror mouse range-preview behavior for keyboard navigation.
  atMouseOver(date)
}

function getRangePreviewClass(date: any) {
  const classes = betweenRangeClasses(date).trim()
  const isActiveRangePreview = isBetweenRange(date) || date.hovered()
  const hasEdgeClass = classes.includes('vtd-datepicker-range-preview-edge')
  if (classes.length > 0 && !hasEdgeClass)
    return 'inset-0 opacity-100'
  if (isActiveRangePreview && !hasEdgeClass)
    return 'inset-0 opacity-100'
  return 'opacity-0 pointer-events-none'
}

function getRangePreviewEdgeClass(date: any) {
  const classes = betweenRangeClasses(date).trim()
  if (!classes.includes('vtd-datepicker-range-preview-edge'))
    return ''
  return classes
}

function onDateKeydown(event: KeyboardEvent, date: any) {
  const currentKey = getDateKey(date)
  const currentIndex = calendarDates.value.findIndex((entry: any) => getDateKey(entry) === currentKey)
  if (currentIndex < 0)
    return

  if (event.key === 'ArrowRight') {
    event.preventDefault()
    const nextIndex = findFocusableIndexFrom(currentIndex, 1)
    if (nextIndex >= 0)
      focusDateByIndex(nextIndex)
    return
  }

  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    const nextIndex = findFocusableIndexFrom(currentIndex, -1)
    if (nextIndex >= 0)
      focusDateByIndex(nextIndex)
    return
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    const nextIndex = findFocusableIndexFrom(currentIndex, 7)
    if (nextIndex >= 0)
      focusDateByIndex(nextIndex)
    return
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault()
    const nextIndex = findFocusableIndexFrom(currentIndex, -7)
    if (nextIndex >= 0)
      focusDateByIndex(nextIndex)
    return
  }

}

watch(
  () => calendarDates.value,
  (dates) => {
    ensureFocusedDateKey(dates)
  },
  { immediate: true },
)
</script>

<template>
  <div ref="calendarRootRef" class="grid grid-cols-7 gap-y-0.5 my-1">
    <transition-group
      enter-from-class="opacity-0" enter-to-class="opacity-100"
      enter-active-class="transition-opacity ease-out duration-300"
      leave-active-class="transition-opacity ease-in duration-200" leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <template v-for="(date, keyDate) in calendarDates" :key="keyDate">
        <div v-if="keyDate % 7 === 0 && weekNumber" class="col-span-7 border-b relative dark:border-vtd-secondary-600">
          <span class="absolute -left-2 top-1/2 -translate-y-2/4 bg-white dark:bg-vtd-secondary-800 text-[8px] pr-2 text-vtd-secondary-400">{{ date.week() }}</span>
        </div>
        <div class="relative" :class="{ 'vtd-tooltip': asRange && date.duration() }" :data-tooltip="`${date.duration()}`">
          <span
            class="vtd-datepicker-range-preview absolute bg-vtd-primary-100/60 dark:bg-vtd-secondary-700/50"
            :class="getRangePreviewClass(date)"
          />
          <transition
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            enter-active-class="transition-opacity ease-out duration-[140ms]"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
            leave-active-class="transition-opacity ease-out duration-[140ms]"
          >
            <span
              v-if="getRangePreviewEdgeClass(date)"
              class="vtd-datepicker-range-preview absolute bg-vtd-primary-100/60 dark:bg-vtd-secondary-700/50"
              :class="getRangePreviewEdgeClass(date)"
            />
          </transition>
          <button
            type="button"
            class="vtd-datepicker-date relative w-[2.7rem] h-[2.7rem] lg:w-10 lg:h-10 flex justify-center items-center text-xs 2xl:text-sm focus:outline-none focus-visible:outline-none"
            :class="[
              datepickerClasses(date),
              asRange ? 'transition-[color] duration-120 ease-out' : 'transition-colors',
              isCalendarFocusTarget(date) ? 'vtd-calendar-focus-target' : '',
            ]" :disabled="isDateDisabled(date) || isDateInRange(date)" :data-date="date.toDate()" @click="emit('updateDate', date)"
            :data-date-key="getDateKey(date)"
            :tabindex="isCalendarFocusTarget(date) ? 0 : -1"
            @mouseenter="atMouseOver(date)" @focusin="onDateFocus(date)" @keydown="onDateKeydown($event, date)" v-text="date.date()"
          />
        </div>
      </template>
    </transition-group>
  </div>
</template>
