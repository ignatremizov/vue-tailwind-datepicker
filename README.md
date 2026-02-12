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
- `:selector-focus-tint="false"`: keeps selector containers neutral while preserving functionality.

```vue
<vue-tailwind-datepicker
  v-model="rangeDate"
  use-range
  :selector-mode="true"
  selector-year-scroll-mode="boundary"
  :selector-focus-tint="true"
/>
```

Selector wheel visuals are also themeable through CSS variables on `.vtd-datepicker` (month/year selected and hover colors, borders, typography, and wheel cell sizing). See `docs/theming-options.md` for examples.

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
