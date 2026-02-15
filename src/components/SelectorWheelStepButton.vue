<script setup lang="ts">
const props = withDefaults(defineProps<{
  direction: 'up' | 'down'
  label: string
  zClass?: string
  disabled?: boolean
}>(), {
  zClass: 'z-20',
  disabled: false,
})

const emit = defineEmits<{
  (e: 'click'): void
}>()
</script>

<template>
  <button
    type="button"
    :aria-label="props.label"
    :disabled="props.disabled"
    :class="[
      'absolute left-1/2 -translate-x-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full border border-vtd-secondary-300/80 bg-white/90 text-vtd-secondary-500 transition-colors focus:outline-hidden focus:ring-2 focus:ring-vtd-primary-400/40 touch-manipulation dark:border-vtd-secondary-600 dark:bg-vtd-secondary-800/90 dark:text-vtd-secondary-300',
      props.disabled
        ? 'cursor-not-allowed opacity-50'
        : 'hover:bg-vtd-secondary-100 hover:text-vtd-secondary-700 dark:hover:bg-vtd-secondary-700',
      props.direction === 'up' ? 'top-0 -translate-y-1/2' : 'bottom-0 translate-y-1/2',
      props.zClass,
    ]"
    @click="emit('click')"
  >
    <svg
      class="h-3.5 w-3.5"
      :class="props.direction === 'up' ? 'rotate-180' : ''"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
    </svg>
  </button>
</template>
