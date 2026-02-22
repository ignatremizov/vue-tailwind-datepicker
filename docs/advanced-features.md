<script setup>
  import DemoLayout from './DemoLayout.vue'
  import VueTailwindDatePicker from '../src/VueTailwindDatePicker.vue'
  import { ref } from 'vue'

  const dateValue1 = ref([])
  const dateValue2 = ref({
    startDate: '',
    endDate: ''
  })
  const dateValue3 = ref('')
  const dateValue4 = ref([])
  const dateValue5 = ref([])
  const customShortcuts = () => {
    return [
      {
        label: 'Last 15 Days',
        atClick: () => {
          const date = new Date();
          return [
            new Date(date.setDate(date.getDate() - 14)),
            new Date()
          ];
        }
      },
      {
        label: 'Last Years',
        atClick: () => {
          const date = new Date();
          return [
            new Date(date.setFullYear(date.getFullYear() - 1)),
            new Date()
          ];
        }
      }
    ];
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

# Advanced Features

You can also access to advanced features like if you need different `model` values, apply a different language or customizing your shortcuts.

## Keyboard map

| Context | Keys | Result |
| --- | --- | --- |
| Text input (popover open) | `Tab` | Moves focus into the picker focus cycle (calendar first). |
| Text input (popover open) | `Escape` | Closes popover and keeps focus on text input. |
| Calendar day | `ArrowLeft` / `ArrowRight` | Moves focus to previous/next focusable day. |
| Calendar day | `ArrowUp` / `ArrowDown` | Moves focus by week; at top/bottom edge moves to header month control. |
| Calendar day | `Home` / `End` | Jumps to first/last focusable day in the current week row. |
| Calendar day | `Enter` / `Space` | Selects focused date. |
| Shortcuts list | `ArrowUp` / `ArrowDown` / `ArrowLeft` / `ArrowRight` / `Home` / `End` | Moves focus across shortcut buttons. |
| Header (legacy page mode) | `ArrowLeft` / `ArrowRight` | Month/year stepping (month on month header, year on year header). |
| Header (selector wheels open) | `ArrowLeft` / `ArrowRight` | Steps month while keeping focus on header toggle. |
| Header (selector wheels open) | `ArrowUp` / `ArrowDown` | Moves focus into selector wheel column. |
| Header (selector wheels open) | `Enter` / `Space` / `Escape` | Closes wheels and returns to calendar view. |
| Time wheel (`HH/mm/ss`, meridiem) | `ArrowUp` / `ArrowDown` | Moves one option backward/forward in the active wheel. |
| Time wheel (`HH/mm/ss`, meridiem) | `Home` / `End` | Jumps to cycle boundaries (with rollover behavior at edges). |
| Time wheel (`HH/mm/ss`, meridiem) | `Tab` / `Shift+Tab` / `ArrowLeft` / `ArrowRight` | Moves focus across visible time-wheel columns. |
| Time wheel (`HH/mm/ss`, meridiem) | `PageUp` / `PageDown` | Applies wheel-specific coarse steps (for faster traversal). |

## Use Array

<DemoLayout>
  <VueTailwindDatePicker
    v-model="dateValue1"
  ></VueTailwindDatePicker>
</DemoLayout>

```vue
<script setup>
import { ref } from 'vue'
// use Array as model
const dateValue = ref([])
</script>

<template>
  <vue-tailwind-datepicker v-model="dateValue" />
</template>
```

## Use Object

<DemoLayout>
  <VueTailwindDatePicker
    v-model="dateValue2"
  ></VueTailwindDatePicker>
</DemoLayout>

```vue
<script setup>
import { ref } from 'vue'
// use Object as model
const dateValue = ref({
  startDate: '',
  endDate: '',
})
</script>

<template>
  <vue-tailwind-datepicker v-model="dateValue" />
</template>
```

## Use String

<DemoLayout>
  <VueTailwindDatePicker
    v-model="dateValue3"
  ></VueTailwindDatePicker>
</DemoLayout>

```vue
<script setup>
import { ref } from 'vue'
// use String as model
const dateValue = ref('')
</script>

<template>
  <vue-tailwind-datepicker v-model="dateValue" />
</template>
```

## Custom shortcuts

Create your custom shortcuts.

<DemoLayout>
  <VueTailwindDatePicker
    :shortcuts="customShortcuts"
    v-model="dateValue4"
  ></VueTailwindDatePicker>
</DemoLayout>

```vue
<script setup>
import { ref } from 'vue'

const dateValue = ref([])
function customShortcuts() {
  return [
    {
      label: 'Last 15 Days',
      atClick: () => {
        const date = new Date()
        return [new Date(date.setDate(date.getDate() + 1)), date]
      },
    },
    {
      label: 'Last Years',
      atClick: () => {
        const date = new Date()
        return [new Date(date.setFullYear(date.getFullYear() - 1)), new Date()]
      },
    },
  ]
}
</script>

<template>
  <vue-tailwind-datepicker v-model="dateValue" :shortcuts="customShortcuts" />
</template>
```

Custom shortcuts replace built-ins by default (no implicit merge).

## Typed shortcuts

Typed shortcuts support resolver context and deterministic shortcut ids.

```vue
<script setup lang="ts">
const dateValue = ref('')
const typedShortcuts = [
  {
    id: 'next-billing-cycle',
    label: 'Next billing cycle',
    disabled: false,
    resolver: ({ now }) => {
      const date = new Date(now)
      date.setMonth(date.getMonth() + 1)
      return date
    },
  },
]
</script>

<template>
  <vue-tailwind-datepicker
    v-model="dateValue"
    :shortcuts="typedShortcuts"
    shortcut-preset="modern"
  />
</template>
```

## Shortcut item render extension

Use the `shortcut-item` slot to customize each shortcut while preserving library-owned activation/event behavior through `activate()`.

```vue
<template>
  <vue-tailwind-datepicker v-model="dateValue" :shortcuts="typedShortcuts">
    <template #shortcut-item="{ id, label, isDisabled, disabledReason, meta, activate }">
      <button
        type="button"
        class="my-shortcut-button"
        :data-shortcut-id="id"
        :disabled="isDisabled"
        @click="activate"
      >
        {{ label }}{{ meta?.hint ? ` (${meta.hint})` : '' }}
      </button>
      <small v-if="disabledReason === 'blocked-date'">blocked by disableDate</small>
    </template>
  </vue-tailwind-datepicker>
</template>
```

`isDisabled` is `true` when:

- a custom shortcut declares `disabled: true` (or `disabled(context)` returns `true`)
- a built-in shortcut resolves to a blocked date under current `disableDate` constraints
- a typed custom shortcut resolver output is blocked by current `disableDate` constraints

`disabledReason` exposes why it is disabled:

- `explicit`: shortcut-level disabled flag/predicate
- `blocked-date`: resolver output is blocked by current `disableDate` constraints

## Shortcut layout customization

Shortcut sizing is currently content-driven and can be customized through the `shortcut-item` slot/CSS.

```vue
<template>
  <vue-tailwind-datepicker v-model="dateValue" :shortcuts="typedShortcuts">
    <template #shortcut-item="{ id, label, isDisabled, activate }">
      <button
        type="button"
        class="vtd-shortcuts w-[10.5rem] rounded border px-2 py-1.5 text-left text-sm"
        :data-shortcut-id="id"
        :disabled="isDisabled"
        @click="activate"
      >
        {{ label }}
      </button>
    </template>
  </vue-tailwind-datepicker>
</template>
```

- Use slot button classes (for example `w-[10.5rem]`, padding, typography) to control item width and visual density.
- The `.vtd-shortcuts` class is available for host CSS overrides.
- There is no dedicated prop for shortcut panel width yet; panel width follows rendered shortcut content and layout mode.

## Localization (i18n)

Vue Tailwind Datepicker extend to day.js<br>
[List of supported locales](https://github.com/iamkun/dayjs/tree/dev/src/locale)

<DemoLayout>
  <VueTailwindDatePicker
    i18n="fr"
    :auto-apply="false"
    :options="options"
    v-model="dateValue5"
  ></VueTailwindDatePicker>
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
    i18n="id"
    :auto-apply="false"
    :options="options"
  />
</template>
```
