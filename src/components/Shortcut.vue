<script setup lang="ts">
import { computed, type Ref } from 'vue'
import type { ShortcutDefinition, ShortcutFactory } from '../types'
import { legacyShortcutFallbackId } from '../composables/shortcut'
import {
  activateShortcutKey,
  getShortcutDisabledStateKey,
  type BuiltInShortcutId,
  type ShortcutDisabledReason,
} from '../keys'
import { injectStrict } from '../utils'

const props = defineProps<{
  shortcuts: boolean | ShortcutDefinition[] | ShortcutFactory
  builtInShortcuts: { id: BuiltInShortcutId, label: string }[]
  close?: (ref?: Ref | HTMLElement) => void
  asRange: boolean
  asSingle: boolean
}>()

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
const activateShortcut = injectStrict(activateShortcutKey)
const getShortcutDisabledState = injectStrict(getShortcutDisabledStateKey)

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

const hasShortcutItems = computed(() => {
  if (hasCustomShortcutSource.value)
    return customShortcutItems.value.length > 0

  return builtInShortcutItems.value.length > 0
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

  const focusableButtons = Array.from(
    list.querySelectorAll<HTMLButtonElement>('button.vtd-shortcuts:not(:disabled)'),
  )
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
    v-if="hasShortcutItems"
    class="vtd:relative vtd:w-full vtd:border-t vtd:border-b-0 vtd:sm:border-t-0 vtd:sm:border-b vtd:lg:border-b-0 vtd:lg:border-r vtd:border-black/10 vtd:order-last vtd:sm:order-0 vtd:dark:border-vtd-secondary-700 vtd:sm:mt-1 vtd:lg:mr-1 vtd:sm:mb-1 vtd:lg:mb-0 vtd:sm:mx-1 vtd:lg:mx-0 vtd:sm:w-auto"
  >
    <ol
      v-if="hasCustomShortcutSource"
      class="vtd:grid vtd:grid-cols-2 vtd:sm:grid-cols-3 vtd:gap-1 vtd:lg:block vtd:w-full vtd:lg:w-auto vtd:pr-5 vtd:sm:pr-6 vtd:mt-1.5 vtd:sm:mt-0 vtd:sm:mb-1.5 vtd:lg:mb-0"
    >
      <li v-for="item in customShortcutItems" :key="item.id">
        <slot name="shortcut-item" v-bind="item">
          <button
            type="button"
            :disabled="item.isDisabled"
            :aria-label="item.label"
            class="vtd-shortcuts vtd:block vtd:text-sm vtd:lg:text-xs vtd:px-2 vtd:py-2 vtd:sm:leading-4 vtd:whitespace-nowrap vtd:font-medium vtd:rounded-sm vtd:text-vtd-primary-600 vtd:hover:text-vtd-primary-700 vtd:transition-colors vtd:hover:bg-vtd-secondary-100 vtd:focus:bg-vtd-secondary-100 vtd:focus:text-vtd-primary-600 vtd:disabled:cursor-not-allowed vtd:disabled:opacity-50 vtd:disabled:hover:bg-transparent vtd:disabled:hover:text-vtd-primary-600 vtd:dark:hover:bg-vtd-secondary-700 vtd:dark:hover:text-vtd-primary-300 vtd:dark:text-vtd-primary-400 vtd:dark:focus:bg-vtd-secondary-700 vtd:dark:focus:text-vtd-primary-300 vtd:dark:disabled:hover:bg-transparent vtd:dark:disabled:hover:text-vtd-primary-400"
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
      class="vtd:grid vtd:grid-cols-2 vtd:sm:grid-cols-3 vtd:gap-1 vtd:lg:block vtd:w-full vtd:lg:w-auto vtd:pr-5 vtd:sm:pr-6 vtd:mt-1.5 vtd:sm:mt-0 vtd:sm:mb-1.5 vtd:lg:mb-0"
    >
      <li v-for="item in builtInShortcutItems" :key="item.id">
        <slot name="shortcut-item" v-bind="item">
          <button
            type="button"
            :disabled="item.isDisabled"
            :aria-label="item.label"
            class="vtd-shortcuts vtd:block vtd:text-sm vtd:lg:text-xs vtd:px-2 vtd:py-2 vtd:sm:leading-4 vtd:whitespace-nowrap vtd:font-medium vtd:rounded-sm vtd:text-vtd-primary-600 vtd:hover:text-vtd-primary-700 vtd:transition-colors vtd:hover:bg-vtd-secondary-100 vtd:focus:bg-vtd-secondary-100 vtd:focus:text-vtd-primary-600 vtd:disabled:cursor-not-allowed vtd:disabled:opacity-50 vtd:disabled:hover:bg-transparent vtd:disabled:hover:text-vtd-primary-600 vtd:dark:hover:bg-vtd-secondary-700 vtd:dark:hover:text-vtd-primary-300 vtd:dark:text-vtd-primary-400 vtd:dark:focus:bg-vtd-secondary-700 vtd:dark:focus:text-vtd-primary-300 vtd:dark:disabled:hover:bg-transparent vtd:dark:disabled:hover:text-vtd-primary-400"
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
