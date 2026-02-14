<script setup lang="ts">
import type { Ref } from 'vue'
import { computed } from 'vue'
import type { ShortcutDefinition, ShortcutFactory } from '../types'
import { injectStrict } from '../utils'
import {
  type BuiltInShortcutId,
  activateShortcutKey,
} from '../keys'

const props = defineProps<{
  shortcuts: boolean | ShortcutDefinition[] | ShortcutFactory
  builtInShortcuts: { id: BuiltInShortcutId; label: string }[]
  close?: (ref?: Ref | HTMLElement) => void
  asRange: boolean
  asSingle: boolean
}>()

const activateShortcut = injectStrict(activateShortcutKey)

defineSlots<{
  'shortcut-item': (props: {
    id: string
    label: string
    isDisabled: boolean
    meta?: Record<string, unknown>
    activate: () => void
  }) => unknown
}>()

const withShortcut = computed(() => {
  if (typeof props.shortcuts === 'function')
    return props.shortcuts()

  if (Array.isArray(props.shortcuts))
    return props.shortcuts

  return false
})

function toLegacyFallbackId(label: string, index: number) {
  const normalizedLabel = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `legacy-${index}-${normalizedLabel || 'shortcut'}`
}

function resolveCustomShortcutId(item: ShortcutDefinition, index: number) {
  if ('id' in item && typeof item.id === 'string' && item.id.trim().length > 0)
    return item.id

  return toLegacyFallbackId(item.label, index)
}
</script>

<template>
  <div
    v-if="(props.asRange && props.asSingle) || (props.asRange && !props.asSingle)
    "
    class="relative w-full border-t border-b-0 sm:border-t-0 sm:border-b lg:border-b-0 lg:border-r border-black/10 order-last sm:order-0 dark:border-vtd-secondary-700 sm:mt-1 lg:mr-1 sm:mb-1 lg:mb-0 sm:mx-1 lg:mx-0 sm:w-auto"
  >
    <ol
      v-if="withShortcut"
      class="grid grid-cols-2 sm:grid-cols-3 gap-1 lg:block w-full pr-5 sm:pr-6 mt-1.5 sm:mt-0 sm:mb-1.5 lg:mb-0"
    >
      <li v-for="(item, i) in withShortcut" :key="i">
        <slot
          name="shortcut-item"
          v-bind="{
            id: resolveCustomShortcutId(item, i),
            label: item.label,
            isDisabled: false,
            meta: 'meta' in item ? item.meta : undefined,
            activate: () => activateShortcut(item, close, i),
          }"
        >
          <button
            type="button"
            :aria-label="item.label"
            class="vtd-shortcuts block text-sm lg:text-xs px-2 py-2 sm:leading-4 whitespace-nowrap font-medium rounded-sm text-vtd-primary-600 hover:text-vtd-primary-700 transition-colors hover:bg-vtd-secondary-100 focus:bg-vtd-secondary-100 focus:text-vtd-primary-600 dark:hover:bg-vtd-secondary-700 dark:hover:text-vtd-primary-300 dark:text-vtd-primary-400 dark:focus:bg-vtd-secondary-700 dark:focus:text-vtd-primary-300"
            @click="activateShortcut(item, close, i)"
            @keydown.enter.prevent="activateShortcut(item, close, i)"
            @keydown.space.prevent="activateShortcut(item, close, i)"
            v-text="item.label"
          />
        </slot>
      </li>
    </ol>
    <ol
      v-else
      class="grid grid-cols-2 sm:grid-cols-3 gap-1 lg:block w-full pr-5 sm:pr-6 mt-1.5 sm:mt-0 sm:mb-1.5 lg:mb-0"
    >
      <li v-for="item in props.builtInShortcuts" :key="item.id">
        <slot
          name="shortcut-item"
          v-bind="{
            id: item.id,
            label: item.label,
            isDisabled: false,
            meta: undefined,
            activate: () => activateShortcut(item.id, close),
          }"
        >
          <button
            type="button"
            :aria-label="item.label"
            class="vtd-shortcuts block text-sm lg:text-xs px-2 py-2 sm:leading-4 whitespace-nowrap font-medium rounded-sm text-vtd-primary-600 hover:text-vtd-primary-700 transition-colors hover:bg-vtd-secondary-100 focus:bg-vtd-secondary-100 focus:text-vtd-primary-600 dark:hover:bg-vtd-secondary-700 dark:hover:text-vtd-primary-300 dark:text-vtd-primary-400 dark:focus:bg-vtd-secondary-700 dark:focus:text-vtd-primary-300"
            @click="activateShortcut(item.id, close)"
            @keydown.enter.prevent="activateShortcut(item.id, close)"
            @keydown.space.prevent="activateShortcut(item.id, close)"
          >
            {{ item.label }}
          </button>
        </slot>
      </li>
    </ol>
  </div>
</template>
