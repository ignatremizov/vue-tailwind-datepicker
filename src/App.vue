<script setup lang="ts">
import dayjs from 'dayjs'
import { ref } from 'vue'
import type { Dayjs } from 'dayjs'
import type { InvalidShortcutEventPayload } from './types'
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
const shortcutDemoValue = ref(
  `${dayjs().format('YYYY-MM-DD HH:mm:ss')} ~ ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`,
)
const shortcutFailureLog = ref<string[]>([])

const currentLocale = ref('en')
const localeOptions = [
  { code: 'en', flag: '🇺🇸' },
  { code: 'es', flag: '🇪🇸' },
  { code: 'de', flag: '🇩🇪' },
]
const isDark = ref(false)

const shortcutDemoShortcuts = [
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
  {
    id: 'typed-range-invalid-single',
    label: 'Trigger invalid result',
    meta: { hint: 'invalid demo' },
    resolver: () => null as unknown as Date,
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
</script>

<template>
  <div :class="[isDark ? 'dark bg-slate-950' : 'bg-sky-50', 'min-h-screen px-10 pt-10 pb-[28rem]']">
    <div class="mb-3">
      <span class="text-sm text-slate-700 dark:text-slate-200">Choose one locale</span>
      <div class="mt-2 flex flex-wrap gap-2">
        <button
          v-for="locale in localeOptions"
          :key="locale.code"
          type="button"
          :aria-pressed="currentLocale === locale.code"
          :class="[
            'inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors',
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

    <label class="mb-6 inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
      <input v-model="isDark" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-sky-500 focus:ring-sky-400 dark:border-slate-600 dark:bg-slate-900">
      <span>Dark Theme</span>
    </label>

    <div class="grid gap-4">
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
          Custom shortcut + render extension (`activate()` flow)
        </p>
        <VueTailwindDatePicker
          v-model="shortcutDemoValue"
          as-single
          use-range
          :shortcuts="shortcutDemoShortcuts"
          shortcut-preset="modern"
          @invalid-shortcut="onInvalidShortcut"
        >
          <template #shortcut-item="{ id, label, meta, activate }">
            <button
              type="button"
              class="vtd-shortcuts mb-1 w-full rounded border border-indigo-300 bg-white px-2 py-1.5 text-left text-sm text-indigo-900 hover:bg-indigo-100"
              :data-shortcut-id="id"
              @click="activate"
            >
              {{ label }} <span v-if="meta?.hint" class="text-xs text-indigo-600">({{ meta.hint }})</span>
            </button>
          </template>
        </VueTailwindDatePicker>
        <p class="mt-3 text-xs text-indigo-800">
          Recent invalid-shortcut payloads: {{ shortcutFailureLog.join(' | ') || 'none' }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.weekend-tint-demo :deep(.vtd-datepicker-date.vtd-weekend:not(.vtd-datepicker-date-selected):not(:disabled)) {
  color: rgb(220 38 38 / 100%);
}

.weekend-tint-demo :deep(.vtd-datepicker-date.vtd-saturday:not(.vtd-datepicker-date-selected):not(:disabled)) {
  color: rgb(234 88 12 / 100%);
}

.weekend-tint-demo :deep(.vtd-datepicker-date.vtd-sunday:not(.vtd-datepicker-date-selected):not(:disabled)) {
  color: rgb(185 28 28 / 100%);
}
</style>
