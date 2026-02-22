<script setup>
  import DemoLayout from './DemoLayout.vue'
  import VueTailwindDatePicker from '../src/VueTailwindDatePicker.vue'
  import { ref } from 'vue'

  const dateValue = ref('')
</script>

# Demo

::: tip
You can also test it with [the playground](https://stackblitz.com/edit/vue-tailwind-datepicker?file=src/components/Playground.vue)!
:::

See also: [Screenshot Gallery](./screenshot-gallery.md) for a curated matrix of UI states and settings.

<DemoLayout>
  <VueTailwindDatePicker
    v-model="dateValue"
  ></VueTailwindDatePicker>
</DemoLayout>

```vue
<script setup>
import { ref } from 'vue'
import VueTailwindDatePicker from 'vue-tailwind-datepicker'

const dateValue = ref('')
</script>

<template>
  <vue-tailwind-datepicker v-model="dateValue" />
</template>
```
