<script setup lang="ts">
import dayjs from 'dayjs'
import { ref } from 'vue'
import type { Dayjs } from 'dayjs'
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

const currentLocale = ref('en')
const locales = ['en', 'es', 'de']

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
</script>

<template>
  <div class="p-10 bg-sky-50 min-h-screen">
    <label class="block">
      <span class="text-sm text-slate-700">Choose one locale</span>
      <select v-model="currentLocale" name="language" class="mb-6 mt-2 block rounded border border-slate-300 bg-white px-3 py-1.5">
        <option v-for="locale in locales" :key="locale" :value="locale">
          {{ locale }}
        </option>
      </select>
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
    </div>
  </div>
</template>
