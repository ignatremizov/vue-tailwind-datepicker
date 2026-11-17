<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    direction: 'up' | 'down'
    label: string
    zClass?: string
    disabled?: boolean
  }>(),
  {
    zClass: 'vtd:z-20',
    disabled: false,
  },
)

const emit = defineEmits<{
  (e: 'click'): void
}>()
</script>

<template>
  <button
    type="button"
    :aria-label="props.label"
    :disabled="props.disabled"
    class="vtd:absolute vtd:left-1/2 vtd:-translate-x-1/2 vtd:inline-flex vtd:h-10 vtd:w-10 vtd:items-center vtd:justify-center vtd:rounded-full vtd:border vtd:border-vtd-secondary-300/80 vtd:bg-white/90 vtd:text-vtd-secondary-500 vtd:transition-colors vtd:focus:outline-hidden vtd:focus:ring-2 vtd:focus:ring-vtd-primary-400/40 vtd:touch-manipulation vtd:dark:border-vtd-secondary-600 vtd:dark:bg-vtd-secondary-800/90 vtd:dark:text-vtd-secondary-300"
    :class="[
      props.disabled
        ? 'vtd:cursor-not-allowed vtd:opacity-50'
        : 'vtd:hover:bg-vtd-secondary-100 vtd:hover:text-vtd-secondary-700 vtd:dark:hover:bg-vtd-secondary-700',
      props.direction === 'up' ? 'vtd:top-0 vtd:-translate-y-1/2' : 'vtd:bottom-0 vtd:translate-y-1/2',
      props.zClass,
    ]"
    @click="emit('click')"
  >
    <svg
      class="vtd:h-3.5 vtd:w-3.5"
      :class="props.direction === 'up' ? 'vtd:rotate-180' : ''"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fill-rule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clip-rule="evenodd"
      />
    </svg>
  </button>
</template>
