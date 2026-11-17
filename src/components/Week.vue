<script setup lang="ts">
import type { LengthArray } from '../types'

defineProps<{
  weeks: LengthArray<string, 7>
}>()
</script>

<template>
  <div class="vtd:grid vtd:grid-cols-7 vtd:py-2 vtd:mt-0.5">
    <div
      v-for="(day, keyDay) in weeks"
      :key="keyDay"
      class="vtd:text-vtd-secondary-500 vtd:text-xs vtd:2xl:text-sm vtd:tracking-wide vtd:font-medium vtd:text-center vtd:cursor-default vtd:dark:text-vtd-secondary-400"
    >
      <span v-text="day" />
    </div>
  </div>
</template>
