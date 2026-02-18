<script setup>
  import DemoLayout from './DemoLayout.vue'
  import VueTailwindDatePicker from '../src/VueTailwindDatePicker.vue'
  import { ref } from 'vue'

  const dateValue1 = ref([])
  const dateValue2 = ref([])
  const dateValue3 = ref([])
  const dateValue4 = ref([])
  const dateValue5 = ref([])
  const dateValue6 = ref([])
  const dateValue7 = ref([])
  const dateValue8 = ref([])
  const dateValue9 = ref([])
  const dateValue10 = ref([])
  const dateValue11 = ref([])
  const dateValue12 = ref([])
  const dateValue13 = ref([])
  const dateValue14 = ref([])
  const dateValue15 = ref([])
  const dateValue16 = ref([])
  const dateValue17 = ref([])
  const formatter = ref({
    date: 'DD MMM YYYY',
    month: 'MMM'
  })
  const startFrom = new Date(2020, 0, 1)
  const dDate = (date) => {
    return date < new Date() || date > new Date(2023, 0, 8);
  }
  const options = ref({
    shortcuts: {
      today: 'Hari ini',
      yesterday: 'Kemarin',
      past: period => period + ' hari terakhir',
      currentMonth: 'Bulan ini',
      pastMonth: 'Bulan lalu',
      businessDays: period => `${period} hari kerja`,
      nextWeek: 'Minggu depan',
      nextMonth: 'Bulan depan',
    },
    footer: {
      apply: 'Terapkan',
      cancel: 'Batal'
    }
  })
</script>

# Props

All available `props`, to setting up Vue Tailwind Datepicker.

## Default Configuration

The datepicker if you don't set any `props`.

<DemoLayout>
  <VueTailwindDatePicker
    v-model="dateValue1"
  ></VueTailwindDatePicker>
</DemoLayout>

```vue
<script setup>
import { ref } from 'vue'

const dateValue = ref([])
</script>

<template>
  <vue-tailwind-datepicker v-model="dateValue" />
</template>
```

## Overlay

Using datepicker with backdrop, by default `overlay` is false.

<DemoLayout>
  <VueTailwindDatePicker
    :overlay="true"
    v-model="dateValue2"
  ></VueTailwindDatePicker>
</DemoLayout>

```vue
<script setup>
import { ref } from 'vue'

const dateValue = ref([])
</script>

<template>
  <vue-tailwind-datepicker v-model="dateValue" overlay />
</template>
```

## Input classes

You can apply apply your own input classes using Tailwind CSS.

<DemoLayout>
  <VueTailwindDatePicker
    input-classes="text-sm bg-red-100 border-red-200 rounded-xs text-slate-800 font-medium dark:bg-red-800 dark:text-slate-800 border border-solid dark:border-red-200"
    v-model="dateValue15"
  ></VueTailwindDatePicker>
</DemoLayout>

```vue
<script setup>
import { ref } from 'vue'

const dateValue = ref([])
</script>

<template>
  <vue-tailwind-datepicker
    v-model="dateValue"
    input-classes="block mb-2 text-sm font-medium text-green-700 dark:text-green-500"
  />
</template>
```

## Disabled

The datepicker can be fully disabled as well.

<DemoLayout>
  <VueTailwindDatePicker
    v-model="dateValue1"
		:disabled="true"
  ></VueTailwindDatePicker>
</DemoLayout>

```vue
<script setup>
import { ref } from 'vue'

const dateValue = ref([])
</script>

<template>
  <vue-tailwind-datepicker v-model="dateValue" :disabled="true" />
</template>
```

## Single Date

Using date picker as single date.

<DemoLayout>
  <VueTailwindDatePicker
    as-single
    v-model="dateValue3"
  />
</DemoLayout>

```vue
<script setup>
import { ref } from 'vue'

const dateValue = ref([])
</script>

<template>
  <vue-tailwind-datepicker v-model="dateValue" as-single />
</template>
```

## Use Range

Using date picker as single date, but datepicker with range.

<DemoLayout>
  <VueTailwindDatePicker
    as-single
    use-range
    v-model="dateValue4"
  />
</DemoLayout>

```vue
<script setup>
import { ref } from 'vue'

const dateValue = ref([])
</script>

<template>
  <vue-tailwind-datepicker v-model="dateValue" as-single use-range />
</template>
```

## Placeholder

Change placeholder, by default placeholder use `formatter.date` object.

<DemoLayout>
  <VueTailwindDatePicker
    placeholder="My Placeholder"
    v-model="dateValue5"
  />
</DemoLayout>

```vue
<script setup>
import { ref } from 'vue'

const dateValue = ref([])
</script>

<template>
  <vue-tailwind-datepicker v-model="dateValue" placeholder="My Placeholder" />
</template>
```

## Separator

Change placeholder, by default placeholder use `formatter.date` object.

<DemoLayout>
  <VueTailwindDatePicker
    separator=" to "
    v-model="dateValue6"
  />
</DemoLayout>

```vue
<script setup>
import { ref } from 'vue'

const dateValue = ref([])
</script>

<template>
  <vue-tailwind-datepicker v-model="dateValue" separator=" to " />
</template>
```

## Without Input

Display Datepicker only without input

<DemoLayout>
  <VueTailwindDatePicker
    :no-input="true"
    :as-single="true"
    v-model="dateValue13"
  ></VueTailwindDatePicker>
</DemoLayout>

```vue
<script setup>
import { ref } from 'vue'

const dateValue = ref([])
</script>

<template>
  <vue-tailwind-datepicker v-model="dateValue" no-input />
</template>
```

## Formatter

Change formatter, default `formatter`:

```js
  {
    date: 'YYYY-MM-DD HH:mm:ss',
    month: 'MMM'
  }
```

<DemoLayout>
  <VueTailwindDatePicker
    :formatter="formatter"
    v-model="dateValue7"
  />
</DemoLayout>

```vue
<script setup>
import { ref } from 'vue'

const dateValue = ref([])
const formatter = ref({
  date: 'DD MMM YYYY',
  month: 'MMM',
})
</script>

<template>
  <vue-tailwind-datepicker v-model="dateValue" :formatter="formatter" />
</template>
```

## Auto apply

Change auto apply, by default `autoApply` is true.

<DemoLayout>
  <VueTailwindDatePicker
    :auto-apply="false"
    v-model="dateValue8"
  />
</DemoLayout>

```vue
<script setup>
import { ref } from 'vue'

const dateValue = ref([])
</script>

<template>
  <vue-tailwind-datepicker v-model="dateValue" :auto-apply="false" />
</template>
```

## Close on range selection

Control whether popover mode closes immediately after selecting the second date in range mode.
Default is `true`.

When using `selector-mode`, set this to `false` if you want a fully native-like keep-open flow after second-date selection.

In `no-input` static mode this prop is a no-op because there is no popover to close.

```vue
<template>
  <vue-tailwind-datepicker
    v-model="dateValue"
    use-range
    :close-on-range-selection="false"
  />
</template>
```

## Start from

Change start from of datepicker, by default `startFrom` is new Date().

<DemoLayout>
  <VueTailwindDatePicker
    :start-from="startFrom"
    v-model="dateValue9"
  />
</DemoLayout>

```vue
<script setup>
import { ref } from 'vue'

const dateValue = ref([])
const startFrom = new Date(2020, 0, 1)
</script>

<template>
  <vue-tailwind-datepicker v-model="dateValue" :start-from="startFrom" />
</template>
```

## Weekdays size

If you need to use a minimum number of characters for the name of the days of the week (Sun -> Su, Mon -> Mo, etc.), use `min`, by default `weekdaysSize` is `short` (Sun, Mon, etc.).

<DemoLayout>
  <VueTailwindDatePicker
    weekdays-size="min"
    v-model="dateValue16"
  />
</DemoLayout>

```vue
<script setup>
import { ref } from 'vue'

const dateValue = ref([])
</script>

<template>
  <vue-tailwind-datepicker v-model="dateValue" weekdays-size="min" />
</template>
```

## Week number

If you want to show week number in the calendar

<DemoLayout>
  <VueTailwindDatePicker
    week-number
    v-model="dateValue16"
  />
</DemoLayout>


## Shortcuts

Display or hide shortcuts. Default value is `true`.

`shortcuts` accepts:

- `true`: show built-ins (from `shortcutPreset`)
- `false`: hide all shortcuts
- `ShortcutDefinition[]`: use custom shortcuts (replaces built-ins)
- `() => ShortcutDefinition[]`: lazy factory for custom shortcuts (replaces built-ins)

<DemoLayout>
  <VueTailwindDatePicker
    :shortcuts="false"
    v-model="dateValue10"
  />
</DemoLayout>

```vue
<script setup>
import { ref } from 'vue'

const dateValue = ref([])
</script>

<template>
  <vue-tailwind-datepicker v-model="dateValue" :shortcuts="false" />
</template>
```

## Shortcut Preset

Choose which built-in shortcut inventory is active when `shortcuts` is `true` and no custom shortcuts are provided.

- `legacy` (default): Today, Yesterday, Last 7 Days, Last 30 Days, This Month, Last Month
- `modern`: Today, 3 business days, Next week, Next month

Modern preset labels can be overridden via `options.shortcuts.today`, `options.shortcuts.businessDays(period)`, `options.shortcuts.nextWeek`, and `options.shortcuts.nextMonth`.

<DemoLayout>
  <VueTailwindDatePicker
    v-model="dateValue10"
    shortcut-preset="modern"
  />
</DemoLayout>

```vue
<template>
  <vue-tailwind-datepicker
    v-model="dateValue"
    shortcut-preset="modern"
    :shortcuts="true"
  />
</template>
```

## Disable date

Disable some dates in range.

<DemoLayout>
  <VueTailwindDatePicker
    :disable-date="dDate"
    v-model="dateValue14"
  />
</DemoLayout>

```vue
<script setup>
import { ref } from 'vue'

const dateValue = ref([])
function dDate(date) {
  return date < new Date() || date > new Date(2023, 0, 8)
}
</script>

<template>
  <vue-tailwind-datepicker v-model="dateValue" :disable-date="dDate" />
</template>
```

## Slot

Two slot are available, a global one that surround the full input and a smaller one just for the icon in the input

### Global slot

<DemoLayout>
  <div class="flex">
    <VueTailwindDatePicker
      v-model="dateValue11"
      v-slot="{ value, placeholder, clear }"
    >
      <div class="flex">
        <div class="flex-1">
          <button
            type="button"
            class="block w-full bg-gray-50 text-gray-400 hover:text-gray-900 leading-6 py-3 sm:px-6 border border-gray-200 rounded-xl items-center justify-center space-x-2 sm:space-x-4 focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-gray-300 focus:outline-hidden transition ease-out duration-300"
          >
            <span class="text-gray-900">
              {{ value || placeholder }}
            </span>
          </button>
        </div>
        <div class="shrink-0">
          <button
            type="button"
            class="ml-4 block px-3 flex-none bg-indigo-50 text-indigo-400 hover:text-indigo-900 leading-6 py-3 sm:px-6 border border-indigo-200 rounded-xl items-center justify-center space-x-2 sm:space-x-4 focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-indigo-300 focus:outline-hidden transition ease-out duration-300"
            @click="clear"
          >
            <svg
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>
      </div>
    </VueTailwindDatePicker>
  </div>
</DemoLayout>

```vue
<script setup>
import { ref } from 'vue'

const dateValue = ref([])
</script>

<template>
  <div class="flex">
    <vue-tailwind-datepicker
      v-slot="{ value, placeholder, clear }"
      v-model="dateValue"
    >
      <div class="flex">
        <div class="flex-1">
          <button
            type="button"
            class="block w-full bg-gray-50 text-gray-400 hover:text-gray-900 leading-6 py-3 sm:px-6 border border-gray-200 rounded-xl items-center justify-center space-x-2 sm:space-x-4 focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-gray-300 focus:outline-hidden transition ease-out duration-300"
          >
            <span class="text-gray-900">
              {{ value || placeholder }}
            </span>
          </button>
        </div>
        <div class="shrink-0">
          <button
            type="button"
            class="ml-4 block px-3 flex-none bg-indigo-50 text-indigo-400 hover:text-indigo-900 leading-6 py-3 sm:px-6 border border-indigo-200 rounded-xl items-center justify-center space-x-2 sm:space-x-4 focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-indigo-300 focus:outline-hidden transition ease-out duration-300"
            @click="clear"
          >
            <svg
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </vue-tailwind-datepicker>
  </div>
</template>
```

### inputIcon slot

<DemoLayout>
  <div class="flex">
    <VueTailwindDatePicker v-model="dateValue17">
      <template #inputIcon="{ value }">
        {{ value ? 'delete icon' : "calendar icon" }}
      </template>
    </VueTailwindDatePicker>
  </div>
</DemoLayout>

```vue
  <VueTailwindDatePicker
    v-model="dateValue"
  >
    <template #inputIcon="{ value }">
      {{ value ? 'delete icon' : "calendar icon" }}
    </template>
  </VueTailwindDatePicker>
```


## Options

Change default options

<DemoLayout>
  <VueTailwindDatePicker
    :options="options" :auto-apply="false"
    v-model="dateValue12"
  />
</DemoLayout>

```vue
<script setup>
import { ref } from 'vue'

const dateValue = ref([])
const options = ref({
  shortcuts: {
    today: 'Hari ini',
    yesterday: 'Kemarin',
    past: period => `${period} hari terakhir`,
    currentMonth: 'Bulan ini',
    pastMonth: 'Bulan lalu',
    businessDays: period => `${period} hari kerja`,
    nextWeek: 'Minggu depan',
    nextMonth: 'Bulan depan',
  },
  footer: {
    apply: 'Terapkan',
    cancel: 'Batal',
  },
})
</script>

<template>
  <vue-tailwind-datepicker
    v-model="dateValue"
    :options="options"
    :auto-apply="false"
  />
</template>
```

## Selector Mode

Enable native-like month/year wheel selectors. Default is `false`.

<DemoLayout>
  <VueTailwindDatePicker
    v-model="dateValue3"
    as-single
    :selector-mode="true"
  />
</DemoLayout>

```vue
<template>
  <vue-tailwind-datepicker
    v-model="dateValue"
    as-single
    :selector-mode="true"
  />
</template>
```

## Selector Year Scroll Mode

Choose year-wheel sync behavior when selector mode is enabled.

- `boundary` (default): year wheel moves discretely on year boundaries.
- `fractional`: year wheel drifts continuously with month progress.

<DemoLayout>
  <VueTailwindDatePicker
    v-model="dateValue4"
    as-single
    use-range
    :selector-mode="true"
    selector-year-scroll-mode="fractional"
  />
</DemoLayout>

```vue
<template>
  <vue-tailwind-datepicker
    v-model="dateValue"
    as-single
    use-range
    :selector-mode="true"
    selector-year-scroll-mode="boundary"
  />
</template>
```

## Selector Year Keyboard Jumps

Control keyboard jump distance (in years) for the selector year wheel.

- `selector-year-home-jump` and `selector-year-end-jump` default to `100`.
- `selector-year-page-jump` defaults to `10`.
- `selector-year-page-shift-jump` defaults to `100`.

```vue
<template>
  <vue-tailwind-datepicker
    v-model="dateValue"
    as-single
    :selector-mode="true"
    :selector-year-home-jump="50"
    :selector-year-end-jump="50"
    :selector-year-page-jump="12"
    :selector-year-page-shift-jump="120"
  />
</template>
```

## Selector Focus Tint

Control whether the active selector column receives extra focus tint styling.
Default is `true`.

```vue
<template>
  <vue-tailwind-datepicker
    v-model="dateValue"
    as-single
    :selector-mode="true"
    :selector-focus-tint="false"
  />
</template>
```

## timePickerStyle

Choose whether time is off, text input, or wheel-based.
Default is `none`.

- `none`: date-only mode.
- `input`: text input time below calendar.
- `wheel-inline`: wheel controls always visible below calendar.
- `wheel-page`: calendar and wheel controls are split into separate pages.

Any non-`none` value enables integrated date + time selection and requires explicit **Apply**.

```vue
<template>
  <vue-tailwind-datepicker
    v-model="dateValue"
    as-single
    :auto-apply="true"
    time-picker-style="input"
    :formatter="{ date: 'YYYY-MM-DD HH:mm', month: 'MMM' }"
  />
</template>
```

## timePageMode

Choose page-switch behavior when `timePickerStyle` is `wheel-page`.
Default is `toggle`.

- `toggle`: manual back-and-forth between calendar/time pages using the switch button.
- `after-date`: automatically switch to the time page after date selection.

```vue
<template>
  <vue-tailwind-datepicker
    v-model="dateValue"
    as-single
    time-picker-style="wheel-page"
    time-page-mode="after-date"
    :formatter="{ date: 'YYYY-MM-DD HH:mm', month: 'MMM' }"
  />
</template>
```

### Supported `formatter.date` time token families in time-enabled modes

- 24-hour: `HH:mm`, `HH:mm:ss`
- 12-hour: `h:mm A`, `h:mm:ss A`, `hh:mm A`, `hh:mm:ss A`, and lowercase meridiem variants (`a`)

Minutes are required. Seconds are optional.

## defaultTime

Optional default time used when a time-enabled mode hydrates an incoming value with date but no time.

- Applies to single mode and range start endpoint.
- Accepts both 24-hour and 12-hour inputs.
- Normalized to the active `formatter.date` time format before use.

```vue
<template>
  <vue-tailwind-datepicker
    v-model="dateValue"
    as-single
    time-picker-style="input"
    default-time="9:30 PM"
    :formatter="{ date: 'YYYY-MM-DD h:mm A', month: 'MMM' }"
  />
</template>
```

## defaultEndTime

Optional default time for range end hydration when a time-enabled mode is enabled.

- Used for range end endpoint.
- Falls back to `defaultTime` when `defaultEndTime` is not provided.
- If neither is set, fallback is `00:00` (or `00:00:00` when seconds are enabled).

```vue
<template>
  <vue-tailwind-datepicker
    v-model="rangeValue"
    use-range
    as-single
    time-picker-style="wheel-inline"
    default-time="09:00"
    default-end-time="17:30"
    :formatter="{ date: 'YYYY-MM-DD HH:mm', month: 'MMM' }"
  />
</template>
```

## timeWheelScrollMode

Choose wheel behavior when `timePickerStyle` is `wheel-inline` or `wheel-page`.
Default is `boundary`.

- `boundary`: wheel values change discretely at each row boundary.
- `fractional`: wheel position drifts continuously using lower-order progress (for example hour wheel drift by minute progress).

```vue
<template>
  <vue-tailwind-datepicker
    v-model="dateValue"
    as-single
    time-picker-style="wheel-page"
    time-page-mode="after-date"
    time-wheel-scroll-mode="fractional"
    :formatter="{ date: 'YYYY-MM-DD HH:mm:ss', month: 'MMM' }"
  />
</template>
```
