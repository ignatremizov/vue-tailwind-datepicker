# Installation

Vue 3 and Day.js are required. The published stylesheet contains all datepicker
styles; Tailwind CSS and the forms plugin are build-time tools for maintainers,
not consumer requirements.

## Install via npm

```
$ npm install @ignatremizov/vue-tailwind-datepicker
```

## Install via yarn

```
$ yarn add @ignatremizov/vue-tailwind-datepicker
```

## How it works

Setup the component globally

```js
// main.js
import { createApp } from 'vue'
import VueTailwindDatepicker from '@ignatremizov/vue-tailwind-datepicker'
import '@ignatremizov/vue-tailwind-datepicker/style.css'
import App from '@/App.vue'
// ...

const app = createApp(App)

app.use(VueTailwindDatepicker)
app.mount('#app')
```

Setup as a single component

```vue
<!-- SFC file -->
<script setup>
import { ref } from 'vue'
import VueTailwindDatepicker from '@ignatremizov/vue-tailwind-datepicker'
import '@ignatremizov/vue-tailwind-datepicker/style.css'

const dateValue = ref([])
</script>

<template>
  <VueTailwindDatepicker v-model="dateValue" />
</template>
```

Import `@ignatremizov/vue-tailwind-datepicker/style.css` once in your app entry or alongside the first component usage so the published stylesheet is applied.

## Stylesheet isolation

No Tailwind configuration or scanning of the package is needed. You can import
the datepicker stylesheet before or after your application's CSS: its utility
classes and variables have a package namespace, and its control defaults apply
only inside datepicker roots. It does not export a global Preflight or form reset.

Remove package entries from your application's Tailwind content/source list when
upgrading from a source-scanning integration. Keep your `vtd-primary` and
`vtd-secondary` palettes and register the optional theme bridge to expose them
without rebuilding internal utilities; see [theming options](./theming-options.md).

Custom `inputClasses` and slot content still accept your application's classes.
Overrides that target internal utility classes need to move to semantic hooks or
the supported theme tokens.

## Setup in Nuxt3

1. Install Vue Tailwind Datepicker and Day.js.

2. Create a plugin for Vue Tailwind Datepicker in the plugins directory of your Nuxt project. For example, vue-tailwind-datepicker.js:

```js
import VueTailwindDatepicker from '@ignatremizov/vue-tailwind-datepicker'
import '@ignatremizov/vue-tailwind-datepicker/style.css'
import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('VueTailwindDatepicker', VueTailwindDatepicker)
})
```

3. Register the plugin in your nuxt.config.js:

```js
export default {
  plugins: ['~/plugins/vue-tailwind-datepicker.js'],
}
```

4. Ensure the published stylesheet is loaded once globally. You can keep the import in the plugin above, or add it through your Nuxt CSS configuration instead.

5. Now, you can use the `<vue-tailwind-datepicker>` component in any of your Nuxt pages or components.
