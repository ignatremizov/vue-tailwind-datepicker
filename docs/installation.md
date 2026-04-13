# Installation

::: warning
⚠️ Vue Tailwind Datepicker uses Tailwind CSS (with the @tailwindcss/forms plugin) & Day.js under the hood, **you must install those packages** before.
See this repository's docs for integration examples and configuration guidance.
:::

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

## Add Tailwind CSS configuration

```js
// tailwind.config.js
const colors = require('tailwindcss/colors')

module.exports = {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
    './node_modules/@ignatremizov/vue-tailwind-datepicker/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        'vtd-primary': colors.sky, // Light mode Datepicker color
        'vtd-secondary': colors.gray, // Dark mode Datepicker color
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
```

## Setup in Nuxt3

1. Install Vue Tailwind Datepicker along with Tailwind CSS and Day.js.

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
