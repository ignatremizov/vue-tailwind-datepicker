<script setup lang="ts">
import type { Ref } from 'vue'
import { computed } from 'vue'
import { legacyShortcutFallbackId } from '../composables/shortcut'
import type { ShortcutDefinition, ShortcutFactory } from '../types'
import { injectStrict } from '../utils'
import {
  type BuiltInShortcutId,
  type ShortcutDisabledReason,
  activateShortcutKey,
  getShortcutDisabledStateKey,
} from '../keys'

const props = defineProps<{
  shortcuts: boolean | ShortcutDefinition[] | ShortcutFactory
  builtInShortcuts: { id: BuiltInShortcutId; label: string }[]
  close?: (ref?: Ref | HTMLElement) => void
  asRange: boolean
  asSingle: boolean
}>()

const activateShortcut = injectStrict(activateShortcutKey)
const getShortcutDisabledState = injectStrict(getShortcutDisabledStateKey)

defineSlots<{
  'shortcut-item': (props: {
    id: string
    label: string
    isDisabled: boolean
    disabledReason: ShortcutDisabledReason
    meta?: Record<string, unknown>
    activate: () => void
  }) => unknown
}>()

interface RenderShortcutItem {
  id: string
  label: string
  isDisabled: boolean
  disabledReason: ShortcutDisabledReason
  meta?: Record<string, unknown>
  activate: () => void
}

const withShortcut = computed(() => {
  if (typeof props.shortcuts === 'function')
    return props.shortcuts()

  if (Array.isArray(props.shortcuts))
    return props.shortcuts

  return false
})

const hasCustomShortcutSource = computed(() => {
  return typeof props.shortcuts === 'function' || Array.isArray(props.shortcuts)
})

function resolveCustomShortcutId(item: ShortcutDefinition, index: number) {
  if ('id' in item && typeof item.id === 'string' && item.id.trim().length > 0)
    return item.id.trim()

  return legacyShortcutFallbackId(item.label, index)
}

const customShortcutItems = computed<RenderShortcutItem[]>(() => {
  if (!withShortcut.value)
    return []

  return withShortcut.value.map((item, index) => ({
    ...getShortcutDisabledState(item, index),
    id: resolveCustomShortcutId(item, index),
    label: item.label,
    meta: 'meta' in item ? item.meta : undefined,
    activate: () => activateShortcut(item, props.close, index),
  }))
})

const builtInShortcutItems = computed<RenderShortcutItem[]>(() => {
  return props.builtInShortcuts.map(item => ({
    ...getShortcutDisabledState(item.id),
    id: item.id,
    label: item.label,
    activate: () => activateShortcut(item.id, props.close),
  }))
})

function onShortcutKeydown(event: KeyboardEvent) {
  const currentButton = event.currentTarget
  if (!(currentButton instanceof HTMLButtonElement))
    return

  if (
    event.key !== 'ArrowDown'
    && event.key !== 'ArrowUp'
    && event.key !== 'ArrowRight'
    && event.key !== 'ArrowLeft'
    && event.key !== 'Home'
    && event.key !== 'End'
  ) {
    return
  }

  const list = currentButton.closest('ol')
  if (!list)
    return

  const focusableButtons = Array.from(list.querySelectorAll<HTMLButtonElement>('button.vtd-shortcuts:not(:disabled)'))
  if (focusableButtons.length <= 1)
    return

  const currentIndex = focusableButtons.findIndex(button => button === currentButton)
  if (currentIndex < 0)
    return

  let nextIndex = currentIndex
  if (event.key === 'ArrowDown' || event.key === 'ArrowRight')
    nextIndex = (currentIndex + 1) % focusableButtons.length
  else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft')
    nextIndex = (currentIndex - 1 + focusableButtons.length) % focusableButtons.length
  else if (event.key === 'Home')
    nextIndex = 0
  else if (event.key === 'End')
    nextIndex = focusableButtons.length - 1

  if (nextIndex === currentIndex)
    return

  event.preventDefault()
  event.stopPropagation()
  focusableButtons[nextIndex]?.focus()
}
</script>

<template>
  <div
    v-if="(props.asRange && props.asSingle) || (props.asRange && !props.asSingle)
    "
    class="relative w-full border-t border-b-0 sm:border-t-0 sm:border-b lg:border-b-0 lg:border-r border-black/10 order-last sm:order-0 dark:border-vtd-secondary-700 sm:mt-1 lg:mr-1 sm:mb-1 lg:mb-0 sm:mx-1 lg:mx-0 sm:w-auto"
  >
    <ol
      v-if="hasCustomShortcutSource"
      class="grid grid-cols-2 sm:grid-cols-3 gap-1 lg:block w-full lg:w-auto pr-5 sm:pr-6 mt-1.5 sm:mt-0 sm:mb-1.5 lg:mb-0"
    >
      <li v-for="item in customShortcutItems" :key="item.id">
        <slot
          name="shortcut-item"
          v-bind="item"
        >
          <button
            type="button"
            :disabled="item.isDisabled"
            :aria-label="item.label"
            class="vtd-shortcuts block text-sm lg:text-xs px-2 py-2 sm:leading-4 whitespace-nowrap font-medium rounded-sm text-vtd-primary-600 hover:text-vtd-primary-700 transition-colors hover:bg-vtd-secondary-100 focus:bg-vtd-secondary-100 focus:text-vtd-primary-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-vtd-primary-600 dark:hover:bg-vtd-secondary-700 dark:hover:text-vtd-primary-300 dark:text-vtd-primary-400 dark:focus:bg-vtd-secondary-700 dark:focus:text-vtd-primary-300 dark:disabled:hover:bg-transparent dark:disabled:hover:text-vtd-primary-400"
            @click="item.activate"
            @keydown="onShortcutKeydown"
            @keydown.enter.prevent="item.activate"
            @keyup.space.prevent="item.activate"
            v-text="item.label"
          />
        </slot>
      </li>
    </ol>
    <ol
      v-else
      class="grid grid-cols-2 sm:grid-cols-3 gap-1 lg:block w-full lg:w-auto pr-5 sm:pr-6 mt-1.5 sm:mt-0 sm:mb-1.5 lg:mb-0"
    >
      <li v-for="item in builtInShortcutItems" :key="item.id">
        <slot
          name="shortcut-item"
          v-bind="item"
        >
          <button
            type="button"
            :disabled="item.isDisabled"
            :aria-label="item.label"
            class="vtd-shortcuts block text-sm lg:text-xs px-2 py-2 sm:leading-4 whitespace-nowrap font-medium rounded-sm text-vtd-primary-600 hover:text-vtd-primary-700 transition-colors hover:bg-vtd-secondary-100 focus:bg-vtd-secondary-100 focus:text-vtd-primary-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-vtd-primary-600 dark:hover:bg-vtd-secondary-700 dark:hover:text-vtd-primary-300 dark:text-vtd-primary-400 dark:focus:bg-vtd-secondary-700 dark:focus:text-vtd-primary-300 dark:disabled:hover:bg-transparent dark:disabled:hover:text-vtd-primary-400"
            @click="item.activate"
            @keydown="onShortcutKeydown"
            @keydown.enter.prevent="item.activate"
            @keyup.space.prevent="item.activate"
          >
            {{ item.label }}
          </button>
        </slot>
      </li>
    </ol>
  </div>
</template>
