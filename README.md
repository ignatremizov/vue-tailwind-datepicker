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
import { ref } from "vue";
import VueTailwindDatepicker from "vue-tailwind-datepicker";

const dateValue = ref([]);
const formatter = ref({
  date: "DD MMM YYYY",
  month: "MMM",
});
</script>

<template>
  <div>
    <vue-tailwind-datepicker :formatter="formatter" v-model="dateValue" />
  </div>
</template>
```

## Native Scroll Selector Mode

Enable native-like month/year scrolling with `selectorMode` (use `:selector-mode` in templates). Default is `false`.

**Single date**

```vue
<script setup>
import { ref } from "vue";

const singleDate = ref("");
</script>

<template>
  <vue-tailwind-datepicker v-model="singleDate" as-single :selector-mode="true" />
</template>
```

**Range**

```vue
<script setup>
import { ref } from "vue";

const rangeDate = ref({
  startDate: "",
  endDate: "",
});
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
/>
```

Selector wheel visuals are also themeable through CSS variables on `.vtd-datepicker` (month/year selected and hover colors, borders, typography, and wheel cell sizing). Calendar range preview colors/opacity are exposed via `--vtd-calendar-range-preview-bg` and `--vtd-calendar-range-preview-bg-dark`. See `docs/theming-options.md` for examples.

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

## Theming options

**Light Mode**

![Light Mode](https://github.com/elreco/vue-tailwind-datepicker/blob/main/docs/light.png?raw=true)

**Dark Mode**

![Dark Mode](https://github.com/elreco/vue-tailwind-datepicker/blob/main/docs/dark.png?raw=true)

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
