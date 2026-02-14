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
const shortcutDemoValue = ref(
  `${dayjs().format('YYYY-MM-DD HH:mm:ss')} ~ ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`,
)
const shortcutFailureLog = ref<string[]>([])

const currentLocale = ref('en')
const locales = ['en', 'es', 'de']
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
    <label class="block">
      <span class="text-sm text-slate-700 dark:text-slate-200">Choose one locale</span>
      <select
        v-model="currentLocale"
        name="language"
        class="mb-3 mt-2 block rounded border border-slate-300 bg-white px-3 py-1.5 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
      >
        <option v-for="locale in locales" :key="locale" :value="locale">
          {{ locale }}
        </option>
      </select>
    </label>

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
