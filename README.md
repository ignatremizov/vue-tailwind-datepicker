# Vue Tailwind Datepicker

<p align="center">
    <a href="https://vue-tailwind-datepicker.com" target="_blank">
      <img alt="Vue Tailwind Datepicker" width="100" style="border-radius: 100%;" src="https://github.com/elreco/vue-tailwind-datepicker/blob/main/docs/logo.png?raw=true">
    </a><br><br>
    A Datepicker component for Vue 3 using Tailwind and dayjs.
</p>

[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

## Documentation

Go to [full documentation](https://vue-tailwind-datepicker.com)

## Installation

⚠️ Vue Tailwind Datepicker uses Tailwind CSS (with the @tailwindcss/forms plugin) & Day.js under the hood, **you must install those packages** before.
You can follow [this tutorial](https://dev.to/elreco/add-a-tailwind-datepicker-to-your-vue-3-application-57j2).

### Install via npm

```
npm install vue-tailwind-datepicker
```

### Install via yarn

```
yarn add vue-tailwind-datepicker
```

## Simple Usage

How it works,

```vue
<script setup>
import { ref } from 'vue'
import VueTailwindDatepicker from 'vue-tailwind-datepicker'

const dateValue = ref([])
const formatter = ref({
  date: 'DD MMM YYYY',
  month: 'MMM',
})
</script>

<template>
  <div>
    <VueTailwindDatepicker v-model="dateValue" :formatter="formatter" />
  </div>
</template>
```

## Time Picker Modes

Use `timePickerStyle` to control whether time is disabled, text input, or wheel UI.

- `timePickerStyle="none"` (default): date-only mode.
- `timePickerStyle="input"`: text input time under the calendar.
- `timePickerStyle="wheel-inline"`: wheel controls always visible under the calendar.
- `timePickerStyle="wheel-page"`: calendar and wheel shown as separate pages.
- `timePageMode="toggle"` (default): manual page switching.
- `timePageMode="after-date"`: automatically switch from calendar to time after date selection.
- For any non-`none` mode, commit requires explicit **Apply** even when `autoApply=true`.
- `formatter.date` remains the source of truth for date/time parse and format behavior.

### Input mode

```vue
<script setup>
import { ref } from 'vue'

const value = ref('')
</script>

<template>
  <vue-tailwind-datepicker
    v-model="value"
    as-single
    time-picker-style="input"
    :auto-apply="true"
    :formatter="{ date: 'YYYY-MM-DD HH:mm', month: 'MMM' }"
  />
</template>
```

### Range with defaults

```vue
<script setup>
import { ref } from 'vue'

const value = ref({
  startDate: '',
  endDate: '',
})
</script>

<template>
  <vue-tailwind-datepicker
    v-model="value"
    use-range
    as-single
    time-picker-style="wheel-inline"
    default-time="09:00"
    default-end-time="17:00"
    :formatter="{ date: 'YYYY-MM-DD h:mm A', month: 'MMM' }"
  />
</template>
```

### Notes

- Existing date-only integrations do not need changes.
- If you enable a time mode (`input`, `wheel-inline`, `wheel-page`), ensure `formatter.date` includes time tokens (`HH:mm`, `HH:mm:ss`, or 12-hour equivalents with meridiem).
- If incoming model values do not include time, hydration uses `defaultTime` / `defaultEndTime` then falls back to `00:00[:00]`.

### Wheel modes

- `timePickerStyle="wheel-inline"`: native-like wheel selectors (`hh/mm[/ss]`, plus meridiem in 12-hour mode), always visible.
- `timePickerStyle="wheel-page"` with `timePageMode="toggle"`: manual back-and-forth using the switch button.
- `timePickerStyle="wheel-page"` with `timePageMode="after-date"`: flow is `calendar -> time -> apply`.
- `timeWheelScrollMode="boundary"` (default): wheels snap discretely at each unit.
- `timeWheelScrollMode="fractional"`: wheels drift continuously based on lower-order units (for example hour drift by minute progress).

```vue
<vue-tailwind-datepicker
  v-model="value"
  as-single
  time-picker-style="wheel-page"
  time-page-mode="after-date"
  time-wheel-scroll-mode="fractional"
  :formatter="{ date: 'YYYY-MM-DD HH:mm', month: 'MMM' }"
/>
```

## Native Scroll Selector Mode

Enable native-like month/year scrolling with `selectorMode` (use `:selector-mode` in templates). Default is `false`.

**Single date**

```vue
<script setup>
import { ref } from 'vue'

const singleDate = ref('')
</script>

<template>
  <vue-tailwind-datepicker v-model="singleDate" as-single :selector-mode="true" />
</template>
```

**Range**

```vue
<script setup>
import { ref } from 'vue'

const rangeDate = ref({
  startDate: '',
  endDate: '',
})
</script>

<template>
  <vue-tailwind-datepicker v-model="rangeDate" use-range :selector-mode="true" />
</template>
```

**Selector behavior options**

- `selector-year-scroll-mode="boundary"`: clarity-first default; year wheel advances discretely.
- `selector-year-scroll-mode="fractional"`: continuous month-synced year-wheel drift.
- `:selector-year-home-jump="100"`: Home key jump size (years) in year wheel mode.
- `:selector-year-end-jump="100"`: End key jump size (years) in year wheel mode.
- `:selector-year-page-jump="10"`: PageUp/PageDown jump size (years) in year wheel mode.
- `:selector-year-page-shift-jump="100"`: Shift+PageUp/Shift+PageDown jump size (years).
- `:selector-focus-tint="false"`: keeps selector containers neutral while preserving functionality.
- `:close-on-range-selection="false"`: keeps the popover open after selecting the second range date.
  Recommended with `selector-mode` when you want a fully native-like keep-open flow.
  In `no-input` static mode this option is a no-op because there is no popover to close.

**Popover behavior options**

- `open-focus-target="input" | "calendar"`: controls where focus lands after popover open.
- `:popover-transition="true|false"`: toggles enter/leave transition classes.
- `:popover-restore-focus="false"` (default): prevents automatic refocus of the input/trigger when the popover closes.
  Set `:popover-restore-focus="true"` to restore legacy trigger-refocus behavior.

```vue
<vue-tailwind-datepicker
  v-model="rangeDate"
  use-range
  :selector-mode="true"
  selector-year-scroll-mode="boundary"
  :selector-year-home-jump="100"
  :selector-year-end-jump="100"
  :selector-year-page-jump="10"
  :selector-year-page-shift-jump="100"
  :selector-focus-tint="true"
  :close-on-range-selection="false"
  open-focus-target="input"
  :popover-transition="true"
  :popover-restore-focus="false"
/>
```

Selector wheel visuals are also themeable through CSS variables on `.vtd-datepicker` (month/year selected and hover colors, borders, typography, wheel cell sizing, and shared selected/unselected wheel text tokens used by selector + time wheels). Calendar range preview colors/opacity are exposed via `--vtd-calendar-range-preview-bg` and `--vtd-calendar-range-preview-bg-dark`. See `docs/theming-options.md` for examples.

## Shortcut Layout Customization

Shortcut sizing can be customized through the `shortcut-item` slot and host CSS.

```vue
<vue-tailwind-datepicker v-model="dateValue" :shortcuts="typedShortcuts">
  <template #shortcut-item="{ id, label, isDisabled, disabledReason, activate }">
    <button
      type="button"
      class="vtd-shortcuts w-[10.5rem] rounded border px-2 py-1.5 text-left text-sm"
      :data-shortcut-id="id"
      :disabled="isDisabled"
      @click="activate"
    >
      {{ label }}
    </button>
    <small v-if="disabledReason === 'blocked-date'">blocked by disableDate</small>
  </template>
</vue-tailwind-datepicker>
```

- Control width/spacing/typography with slot classes.
- Use `.vtd-shortcuts` for host-level CSS overrides.
- Use `disabledReason` (`explicit` | `blocked-date`) to show user-facing status badges.
- There is no dedicated `shortcutPanelWidth` prop yet; panel width follows rendered shortcut content.

## Weekend Day Styling Hooks

Day cells now expose stable weekend hooks so host apps can apply weekend tinting without patching component internals:

- `vtd-weekend` for Saturday and Sunday
- `vtd-saturday` for Saturday only
- `vtd-sunday` for Sunday only

```css
/* Base weekend tint */
.vtd-datepicker-date.vtd-weekend {
  color: #dc2626;
}

/* Optional split palette */
.vtd-datepicker-date.vtd-saturday {
  color: #ea580c;
}

.vtd-datepicker-date.vtd-sunday {
  color: #b91c1c;
}
```

Hooks are stable across locales and also apply when `selector-mode` is enabled:

```vue
<vue-tailwind-datepicker v-model="rangeEn" use-range i18n="en" />

<vue-tailwind-datepicker v-model="rangeDe" use-range i18n="de" />

<vue-tailwind-datepicker
  v-model="rangeSelector"
  use-range
  as-single
  :selector-mode="true"
  i18n="en"
/>
```

Hooks are additive: selected/range/disabled/today semantics remain unchanged unless your host CSS explicitly overrides them.

## Direct Year Input (Selector Mode)

Use `directYearInput` to allow typing a year directly in selector mode. The feature is opt-in and defaults to `false`.

```vue
<script setup>
import { ref } from 'vue'

const value = ref({
  startDate: '',
  endDate: '',
})
</script>

<template>
  <vue-tailwind-datepicker
    v-model="value"
    use-range
    :selector-mode="true"
    :direct-year-input="true"
    year-numbering-mode="historical"
  />
</template>
```

Behavior summary:

- Valid typed tokens commit immediately to selector/calendar state and emit `update:modelValue` for the active context.
- Year parsing supports signed `-99999..99999`; `year-numbering-mode="historical"` rejects `0`, while `astronomical` accepts `0`.
- Typeahead intentionally supports historical/fantasy/scientific timelines (not only modern Gregorian UI assumptions):
  - Prefix `1` anchors to `1950` for 1-digit starts.
  - Prefix `2` anchors to the current year suffix for 1-digit starts.
  - 2-digit tokens use a mid-century suffix (`xx50`).
  - 3-digit non-zero prefixes use a mid-decade suffix (`xxx5`).
  - Up to 5 digits are accepted before the token resets.
  - `+` / `-` set explicit sign, `Backspace` edits the active token, and `Escape` clears it.
  - Typeahead state auto-resets after 900 ms of idle time.
- Enter confirms in place and keeps selector mode open.
- Escape and invalid blur revert to the last valid year text.
- In range mode, temporary `start > end` from live typing is allowed and is normalized only at explicit persist boundaries (`Apply` or close-with-persist toggle).
- Cancel-like exits (Escape, Cancel button, backdrop dismiss) do not trigger range normalization.

## Theming options

**Light Mode**

![Light Mode](https://github.com/elreco/vue-tailwind-datepicker/blob/main/docs/light.png?raw=true)

**Dark Mode**

![Dark Mode](https://github.com/elreco/vue-tailwind-datepicker/blob/main/docs/dark.png?raw=true)

## Local Dev Ports

- `npm run dev` uses Vite dev-server defaults (typically `http://127.0.0.1:5173/` unless overridden).
- `npm run preview` runs on `http://127.0.0.1:4173/` (configured in `package.json`).
- `npm run docs:screenshots` accepts a base URL argument, for example:
  - `npm run docs:screenshots -- http://127.0.0.1:5173/`
  - `npm run docs:screenshots -- http://127.0.0.1:4180/` (useful when working across multiple worktrees).
  - Screenshot quality is configurable via env vars:
    - `DOC_SCREENSHOT_VIEWPORT_WIDTH` (default `1800`)
    - `DOC_SCREENSHOT_VIEWPORT_HEIGHT` (default `1300`)
    - `DOC_SCREENSHOT_DEVICE_SCALE` (default `2`)
    - `DOC_SCREENSHOT_ZOOM` (default `1.0`)
- `npm run docs:videos` generates MP4 animation captures (same URL argument pattern):
  - `npm run docs:videos -- http://127.0.0.1:5173/`
  - `npm run docs:videos -- http://127.0.0.1:4180/`

## Dependency Pins (Dev)

- `@headlessui/vue` is pinned to a GitHub release tarball from the fork to include Vue fixes not yet available in the upstream npm line used by this repo.
- `js-beautify` is pinned via `overrides` to a fork tarball commit to break an upstream dev-only audit chain (through `@vue/test-utils`), until upstream publishes an equivalent fix.
- When updating either pin, prefer a tagged release or commit SHA URL and run:
  - `npm install`
  - `npm run test:unit`
  - `npm run build`
  - `npm audit`

## Changelog

All notable changes to this project will be documented in the [Releases Page](https://github.com/elreco/vue-tailwind-datepicker/releases).

## Sponsors

- [Open Source AI Tools](https://ai.coderocket.app)
- [www.coderocket.app](https://www.coderocket.app)

## License

The [MIT](LICENSE) License. Please [see](http://opensource.org/licenses/MIT) for more information.

## Thanks to

- [kenhyuwa](https://github.com/kenhyuwa)
- [Vue](https://v3.vuejs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [day.js](https://day.js.org/)
- and other support...
