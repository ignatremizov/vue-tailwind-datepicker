<script setup lang="ts">
import type { DatePickerDay } from '../types'
import { computed, ref, watch } from 'vue'
import {
  atMouseOverKey,
  betweenRangeClassesKey,
  datepickerClassesKey,
  isBetweenRangeKey,
} from '../keys'
import { injectStrict } from '../utils'

const props = defineProps<{
  calendar: {
    date: () => DatePickerDay[]
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
  (e: 'updateDate', event: { date: DatePickerDay, source: 'keyboard' | 'pointer', activationKey?: string }): void
}>()

const isBetweenRange = injectStrict(isBetweenRangeKey)
const betweenRangeClasses = injectStrict(betweenRangeClassesKey)
const datepickerClasses = injectStrict(datepickerClassesKey)
const atMouseOver = injectStrict(atMouseOverKey)

const calendarDates = computed(() => props.calendar.date())
const focusedDateKey = ref<string | null>(null)
const calendarRootRef = ref<HTMLElement | null>(null)

function getDateKey(date: DatePickerDay) {
  return date.format('YYYY-MM-DD')
}

function resolveDateFlag(date: DatePickerDay, key: string) {
  const value = (date as Record<string, unknown>)?.[key]
  if (typeof value === 'function')
    return !!value.call(date)
  return !!value
}

function isDateDisabled(date: DatePickerDay) {
  return resolveDateFlag(date, 'disabled')
}

function isDateInRange(date: DatePickerDay) {
  return resolveDateFlag(date, 'inRange')
}

function isDateActive(date: DatePickerDay) {
  return resolveDateFlag(date, 'active')
}

function isDateToday(date: DatePickerDay) {
  return resolveDateFlag(date, 'today')
}

function isDateFocusable(date: DatePickerDay) {
  return !isDateDisabled(date) && !isDateInRange(date)
}

function resolveDefaultFocusKey(dates = calendarDates.value) {
  const activeDate = dates.find((date: DatePickerDay) => isDateFocusable(date) && isDateActive(date))
  if (activeDate)
    return getDateKey(activeDate)

  const todayDate = dates.find((date: DatePickerDay) => isDateFocusable(date) && isDateToday(date))
  if (todayDate)
    return getDateKey(todayDate)

  const firstFocusable = dates.find((date: DatePickerDay) => isDateFocusable(date))
  return firstFocusable ? getDateKey(firstFocusable) : null
}

function ensureFocusedDateKey(dates = calendarDates.value) {
  if (!focusedDateKey.value) {
    focusedDateKey.value = resolveDefaultFocusKey(dates)
    return
  }

  const stillFocusable = dates.some(
    (date: DatePickerDay) => getDateKey(date) === focusedDateKey.value && isDateFocusable(date),
  )
  if (!stillFocusable)
    focusedDateKey.value = resolveDefaultFocusKey(dates)
}

function isCalendarFocusTarget(date: DatePickerDay) {
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

function findFocusableIndexInWeek(currentIndex: number, fromStart: boolean) {
  const dates = calendarDates.value
  const rowStart = Math.floor(currentIndex / 7) * 7
  const rowEnd = Math.min(rowStart + 6, dates.length - 1)

  if (fromStart) {
    for (let index = rowStart; index <= rowEnd; index += 1) {
      if (isDateFocusable(dates[index]))
        return index
    }
  } else {
    for (let index = rowEnd; index >= rowStart; index -= 1) {
      if (isDateFocusable(dates[index]))
        return index
    }
  }

  return -1
}

function hasDateDuration(date: DatePickerDay) {
  return resolveDateFlag(date, 'duration')
}

function getDateDurationLabel(date: DatePickerDay) {
  const durationValue = (date as Record<string, unknown>).duration
  const resolvedValue
    = typeof durationValue === 'function'
      ? durationValue.call(date)
      : durationValue
  return `${resolvedValue ?? ''}`
}

function focusHeaderFromCalendar(target: EventTarget | null) {
  if (!(target instanceof HTMLElement))
    return false

  const panelRoot = target.closest<HTMLElement>('[data-vtd-selector-panel]')
  if (!panelRoot)
    return false

  const panelName = panelRoot.getAttribute('data-vtd-selector-panel')
  const headerSelector
    = panelName === 'previous' || panelName === 'next'
      ? `#vtd-header-${panelName}-month`
      : '[id^="vtd-header-"][id$="-month"]'
  const headerButton = panelRoot.querySelector<HTMLElement>(headerSelector)
  if (!(headerButton instanceof HTMLElement))
    return false

  headerButton.focus()
  return true
}

function onDateFocus(date: DatePickerDay) {
  if (!isDateFocusable(date))
    return
  focusedDateKey.value = getDateKey(date)
  // Mirror mouse range-preview behavior for keyboard navigation.
  atMouseOver(date)
}

function getRangePreviewClass(date: DatePickerDay) {
  const classes = betweenRangeClasses(date).trim()
  const isActiveRangePreview = isBetweenRange(date) || resolveDateFlag(date, 'hovered')
  const hasEdgeClass = classes.includes('vtd-datepicker-range-preview-edge')
  if (classes.length > 0 && !hasEdgeClass)
    return 'inset-0 opacity-100'
  if (isActiveRangePreview && !hasEdgeClass)
    return 'inset-0 opacity-100'
  return 'opacity-0 pointer-events-none'
}

function getRangePreviewEdgeClass(date: DatePickerDay) {
  const classes = betweenRangeClasses(date).trim()
  if (!classes.includes('vtd-datepicker-range-preview-edge'))
    return ''
  return classes
}

function weekendHookClasses(date: DatePickerDay) {
  const classes = []

  if (resolveDateFlag(date, 'weekend'))
    classes.push('vtd-weekend')
  if (resolveDateFlag(date, 'saturday'))
    classes.push('vtd-saturday')
  if (resolveDateFlag(date, 'sunday'))
    classes.push('vtd-sunday')

  return classes.join(' ')
}

function onDateKeydown(event: KeyboardEvent, date: DatePickerDay) {
  const currentKey = getDateKey(date)
  const currentIndex = calendarDates.value.findIndex(
    (entry: DatePickerDay) => getDateKey(entry) === currentKey,
  )
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
    else
      focusHeaderFromCalendar(event.currentTarget)
    return
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault()
    const nextIndex = findFocusableIndexFrom(currentIndex, -7)
    if (nextIndex >= 0)
      focusDateByIndex(nextIndex)
    else
      focusHeaderFromCalendar(event.currentTarget)
    return
  }

  if (event.key === 'Home') {
    event.preventDefault()
    const nextIndex = findFocusableIndexInWeek(currentIndex, true)
    if (nextIndex >= 0)
      focusDateByIndex(nextIndex)
    return
  }

  if (event.key === 'End') {
    event.preventDefault()
    const nextIndex = findFocusableIndexInWeek(currentIndex, false)
    if (nextIndex >= 0)
      focusDateByIndex(nextIndex)
    return
  }

  if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
    event.preventDefault()
    emit('updateDate', {
      date,
      source: 'keyboard',
      activationKey: event.key,
    })
  }
}

function onDateClick(date: DatePickerDay) {
  emit('updateDate', {
    date,
    source: 'pointer',
  })
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
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      enter-active-class="transition-opacity ease-out duration-300"
      leave-active-class="transition-opacity ease-in duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <template v-for="(date, keyDate) in calendarDates" :key="keyDate">
        <div
          v-if="keyDate % 7 === 0 && weekNumber"
          class="col-span-7 border-b relative dark:border-vtd-secondary-600"
        >
          <span
            class="absolute -left-2 top-1/2 -translate-y-2/4 bg-white dark:bg-vtd-secondary-800 text-[8px] pr-2 text-vtd-secondary-400"
          >{{ date.week() }}</span>
        </div>
        <div
          class="relative"
          :class="{ 'vtd-tooltip': asRange && hasDateDuration(date) }"
          :data-tooltip="getDateDurationLabel(date)"
        >
          <span class="vtd-datepicker-range-preview absolute" :class="getRangePreviewClass(date)" />
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
              class="vtd-datepicker-range-preview absolute"
              :class="getRangePreviewEdgeClass(date)"
            />
          </transition>
          <button
            type="button"
            class="vtd-datepicker-date relative w-[2.7rem] h-[2.7rem] lg:w-10 lg:h-10 flex justify-center items-center text-xs 2xl:text-sm focus:outline-none focus-visible:outline-none"
            :class="[
              datepickerClasses(date),
              weekendHookClasses(date),
              asRange ? 'transition-[color] duration-120 ease-out' : 'transition-colors',
              isCalendarFocusTarget(date) ? 'vtd-calendar-focus-target' : '',
            ]"
            :disabled="isDateDisabled(date) || isDateInRange(date)"
            :data-date="date.toDate()"
            :data-date-key="getDateKey(date)"
            :tabindex="isCalendarFocusTarget(date) ? 0 : -1"
            @click="onDateClick(date)"
            @mouseenter="atMouseOver(date)"
            @focusin="onDateFocus(date)"
            @keydown="onDateKeydown($event, date)"
            v-text="date.date()"
          />
        </div>
      </template>
    </transition-group>
  </div>
</template>
