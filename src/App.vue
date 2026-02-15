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

const currentLocale = ref('en')
const localeOptions = [
  { code: 'en', flag: '🇺🇸' },
  { code: 'es', flag: '🇪🇸' },
  { code: 'de', flag: '🇩🇪' },
]
const isDark = ref(false)

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
              {{ label }} <span v-if="meta?.hint" class="text-xs text-indigo-600">({{ meta.hint }})</span>
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
              {{ label }} <span v-if="meta?.hint" class="text-xs text-fuchsia-600">({{ meta.hint }})</span>
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
                :class="isDisabled
                  ? (disabledReason === 'blocked-date' ? 'bg-amber-100 text-amber-700' : 'bg-teal-100 text-teal-700')
                  : 'bg-teal-600 text-white'"
              >
                {{ isDisabled ? (disabledReason === 'blocked-date' ? 'Blocked' : 'Disabled') : 'Active' }}
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
