<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import VtdSelectorWheelStepButton from './SelectorWheelStepButton.vue'

interface TimeWheelItem {
  label: string
  value: number | string
}

interface VirtualTimeWheelItem {
  item: TimeWheelItem
  index: number
  absoluteIndex: number
  key: string
}

interface TimeWheelStepPayload {
  value: number | string
  previousValue: number | string | null
  absoluteIndex: number
  previousAbsoluteIndex: number | null
  delta: number
}

const props = withDefaults(
  defineProps<{
    items: TimeWheelItem[]
    modelValue: number | string | null
    ariaLabel?: string
    disabled?: boolean
    scrollMode?: 'boundary' | 'fractional'
    fractionalOffset?: number
    syncDirection?: -1 | 0 | 1
  }>(),
  {
    ariaLabel: 'Time wheel',
    disabled: false,
    scrollMode: 'boundary',
    fractionalOffset: 0,
    syncDirection: 0,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | string): void
  (e: 'step', payload: TimeWheelStepPayload): void
}>()

const WHEEL_VISIBLE_RADIUS = 180
const WHEEL_CENTER_INDEX = WHEEL_VISIBLE_RADIUS
const EDGE_REBASE_THRESHOLD = 42
const EDGE_REBASE_DEADZONE_PX = 1
const USER_SCROLL_IDLE_MS = 90
const PROGRAMMATIC_SCROLL_SYNC_MS = 120
const SMOOTH_SCROLL_SYNC_MS = 420
const SMOOTH_SCROLL_SYNC_MAX_MS = 1200
const FALLBACK_ROW_HEIGHT = 44
const INITIAL_VISIBLE_SYNC_MAX_RETRIES = 12

const containerRef = ref<HTMLDivElement | null>(null)
const wheelScrollTop = ref(0)
const wheelViewportHeight = ref(176)
const wheelRowHeight = ref(FALLBACK_ROW_HEIGHT)
const wheelPaddingTop = ref(0)
const anchorAbsoluteIndex = ref(0)
const activeAbsoluteIndex = ref<number | null>(null)
const isUserScrolling = ref(false)
const isProgrammaticScrollSync = ref(false)

const itemsSignature = computed(() => {
  return props.items.map(item => String(item.value)).join('|')
})

const normalizedAriaLabel = computed(() => {
  const label = props.ariaLabel.trim()
  return label.length > 0 ? label : 'Time wheel'
})

const centeredIndexFloat = computed(() => {
  const rowHeight = wheelRowHeight.value || FALLBACK_ROW_HEIGHT
  const viewportHeight = wheelViewportHeight.value || 176
  return (
    wheelScrollTop.value
    - wheelPaddingTop.value
    + (viewportHeight / 2)
    - (rowHeight / 2)
  ) / rowHeight
})

const wheelItems = computed<VirtualTimeWheelItem[]>(() => {
  if (props.items.length === 0)
    return []

  const items: VirtualTimeWheelItem[] = []
  const count = props.items.length

  for (let offset = -WHEEL_VISIBLE_RADIUS; offset <= WHEEL_VISIBLE_RADIUS; offset += 1) {
    const absoluteIndex = anchorAbsoluteIndex.value + offset
    const itemIndex = positiveModulo(absoluteIndex, count)
    const item = props.items[itemIndex]
    if (!item)
      continue
    items.push({
      item,
      index: offset + WHEEL_VISIBLE_RADIUS,
      absoluteIndex,
      key: `${item.value}-${absoluteIndex}`,
    })
  }

  return items
})

let scrollFrameId: number | null = null
let scrollIdleTimeoutId: ReturnType<typeof setTimeout> | null = null
let programmaticSyncTimeoutId: ReturnType<typeof setTimeout> | null = null
let pendingModelSyncFrameId: number | null = null
let lastEmittedValue: number | string | null = null
let edgeRebasePending = false
let hasPendingModelSync = false
let pendingModelSyncForce = false
let needsIdleRealign = false
let resizeObserver: ResizeObserver | null = null
let lastObservedViewportHeight = 0
let mountVisibleSyncFrameId: number | null = null

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function positiveModulo(value: number, modulus: number) {
  if (modulus <= 0)
    return 0
  return ((value % modulus) + modulus) % modulus
}

function normalizeFractionalOffset() {
  if (props.scrollMode !== 'fractional')
    return 0
  if (!Number.isFinite(props.fractionalOffset))
    return 0
  // Avoid exact half-row offsets to prevent ambiguous rounding at boundaries.
  return clamp(props.fractionalOffset, -0.49, 0.49)
}

function resolveModelItemIndex() {
  if (props.modelValue === null)
    return -1
  return props.items.findIndex(item => item.value === props.modelValue)
}

function resolveValueAtAbsoluteIndex(absoluteIndex: number) {
  const count = props.items.length
  if (count === 0)
    return undefined
  const item = props.items[positiveModulo(absoluteIndex, count)]
  return item?.value
}

function normalizeSyncDirectionHint() {
  if (props.syncDirection === 1 || props.syncDirection === -1)
    return props.syncDirection
  return 0
}

function getNearestAbsoluteIndexForItemIndex(
  itemIndex: number,
  baseAbsoluteIndex = anchorAbsoluteIndex.value,
  directionHint = 0,
) {
  const count = props.items.length
  if (count === 0)
    return 0

  const anchorIndex = positiveModulo(baseAbsoluteIndex, count)
  let delta = itemIndex - anchorIndex

  if (delta > count / 2)
    delta -= count
  if (delta < -(count / 2))
    delta += count

  // For even cycles, opposite values can be equidistant in either direction
  // (notably AM/PM with 2 items). Respect explicit carry direction hints.
  if (directionHint !== 0 && count % 2 === 0 && Math.abs(delta) === count / 2) {
    const normalizedDirection = directionHint > 0 ? 1 : -1
    if (Math.sign(delta) !== normalizedDirection)
      delta = normalizedDirection * (count / 2)
  }

  return baseAbsoluteIndex + delta
}

function updateWheelMetrics() {
  const container = containerRef.value
  if (!container)
    return

  wheelViewportHeight.value = container.clientHeight || wheelViewportHeight.value
  wheelScrollTop.value = container.scrollTop
  wheelPaddingTop.value = Number.parseFloat(getComputedStyle(container).paddingTop || '0') || 0

  const firstRow = container.querySelector<HTMLDivElement>('[data-time-index="0"]')
  if (firstRow && firstRow.offsetHeight > 0)
    wheelRowHeight.value = firstRow.offsetHeight
}

function getCenteredItem() {
  const items = wheelItems.value
  if (items.length === 0)
    return null

  const index = clamp(Math.round(centeredIndexFloat.value), 0, items.length - 1)
  return items[index]
}

function resolveSmoothSyncDuration(targetIndex: number) {
  const distanceInRows = Math.abs(targetIndex - centeredIndexFloat.value)
  return clamp(
    Math.round(SMOOTH_SCROLL_SYNC_MS + distanceInRows * 5),
    SMOOTH_SCROLL_SYNC_MS,
    SMOOTH_SCROLL_SYNC_MAX_MS,
  )
}

function markProgrammaticScrollSync(
  durationMs = PROGRAMMATIC_SCROLL_SYNC_MS,
  emitAfterSync = true,
) {
  isProgrammaticScrollSync.value = true
  if (programmaticSyncTimeoutId !== null)
    clearTimeout(programmaticSyncTimeoutId)
  programmaticSyncTimeoutId = setTimeout(() => {
    isProgrammaticScrollSync.value = false
    updateWheelMetrics()
    const centeredItem = getCenteredItem()
    if (emitAfterSync)
      emitSelectionFromItem(centeredItem)

    // Under rapid consecutive boundary updates, overlapping smooth scrolls can
    // leave the selected row slightly off-center. Realign to the active value
    // once animation settles without emitting extra carry events.
    if (!isUserScrolling.value && activeAbsoluteIndex.value !== null) {
      const activeItem = wheelItems.value.find(
        item => item.absoluteIndex === activeAbsoluteIndex.value,
      )
      if (activeItem) {
        const expectedIndex = activeItem.index + normalizeFractionalOffset()
        if (Math.abs(centeredIndexFloat.value - expectedIndex) > 0.12) {
          scrollToIndex(expectedIndex, 'auto')
          updateWheelMetrics()
        }
      }
      needsIdleRealign = false
    } else if (activeAbsoluteIndex.value !== null) {
      // A carry update may finish while momentum scrolling is still active.
      // Defer center correction until the wheel goes idle.
      needsIdleRealign = true
    }

    if (hasPendingModelSync)
      requestModelSync(pendingModelSyncForce)
  }, durationMs)
}

function scrollToIndex(index: number, behavior: ScrollBehavior = 'auto') {
  const container = containerRef.value
  if (!container)
    return

  const rowHeight = wheelRowHeight.value || FALLBACK_ROW_HEIGHT
  const centeredScrollTop
    = wheelPaddingTop.value
      + (index * rowHeight)
      - (container.clientHeight / 2)
      + (rowHeight / 2)

  container.scrollTo({
    top: Math.max(0, centeredScrollTop),
    behavior,
  })
  wheelScrollTop.value = container.scrollTop
}

function rebaseWindowAround(item: VirtualTimeWheelItem) {
  if (edgeRebasePending)
    return false

  const container = containerRef.value
  if (!container)
    return false

  edgeRebasePending = true
  const previousScrollTop = container.scrollTop
  const rowHeight = wheelRowHeight.value || FALLBACK_ROW_HEIGHT
  const rowDelta = item.index - WHEEL_CENTER_INDEX

  anchorAbsoluteIndex.value = item.absoluteIndex
  activeAbsoluteIndex.value = item.absoluteIndex

  nextTick(() => {
    markProgrammaticScrollSync(PROGRAMMATIC_SCROLL_SYNC_MS, false)
    updateWheelMetrics()
    container.scrollTop = Math.max(0, previousScrollTop - (rowDelta * rowHeight))
    wheelScrollTop.value = container.scrollTop
    requestAnimationFrame(() => {
      updateWheelMetrics()
      emitSelectionFromItem(getCenteredItem())
    })
    edgeRebasePending = false
  })
  return true
}

function rebaseAtHardEdgeIfNeeded() {
  const container = containerRef.value
  if (!container || wheelItems.value.length === 0)
    return false

  const maxScrollTop = Math.max(0, container.scrollHeight - container.clientHeight)
  if (maxScrollTop <= EDGE_REBASE_DEADZONE_PX)
    return false

  const atTop = container.scrollTop <= EDGE_REBASE_DEADZONE_PX
  const atBottom = container.scrollTop >= maxScrollTop - EDGE_REBASE_DEADZONE_PX
  if (!atTop && !atBottom)
    return false

  const centered = getCenteredItem()
  if (!centered)
    return false

  emitSelectionFromItem(centered)
  return rebaseWindowAround(centered)
}

function syncWheelToModel(force = false) {
  if (props.items.length === 0)
    return

  if (!force && isUserScrolling.value)
    return

  const modelItemIndex = resolveModelItemIndex()
  if (modelItemIndex < 0)
    return

  const syncBaseAbsoluteIndex = activeAbsoluteIndex.value ?? anchorAbsoluteIndex.value
  const targetAbsoluteIndex = getNearestAbsoluteIndexForItemIndex(
    modelItemIndex,
    syncBaseAbsoluteIndex,
    normalizeSyncDirectionHint(),
  )
  activeAbsoluteIndex.value = targetAbsoluteIndex
  lastEmittedValue = props.items[modelItemIndex]?.value ?? null

  if (!force) {
    const targetItem = wheelItems.value.find(item => item.absoluteIndex === targetAbsoluteIndex)
    if (targetItem) {
      nextTick(() => {
        updateWheelMetrics()
        const targetIndex = targetItem.index + normalizeFractionalOffset()
        markProgrammaticScrollSync(resolveSmoothSyncDuration(targetIndex), false)
        scrollToIndex(targetIndex, 'smooth')
      })
      return
    }
  }

  anchorAbsoluteIndex.value = targetAbsoluteIndex
  nextTick(() => {
    updateWheelMetrics()
    const targetIndex = WHEEL_CENTER_INDEX + normalizeFractionalOffset()
    const behavior: ScrollBehavior = force ? 'auto' : 'smooth'
    const duration = force
      ? PROGRAMMATIC_SCROLL_SYNC_MS
      : resolveSmoothSyncDuration(targetIndex)
    markProgrammaticScrollSync(duration, false)
    scrollToIndex(targetIndex, behavior)
  })
}

function flushPendingModelSync() {
  pendingModelSyncFrameId = null
  if (!hasPendingModelSync)
    return

  if (isUserScrolling.value && !pendingModelSyncForce)
    return

  // Keep linked-wheel carries responsive in both scroll modes by allowing new
  // model syncs to preempt an in-flight programmatic animation.

  const force = pendingModelSyncForce
  hasPendingModelSync = false
  pendingModelSyncForce = false
  syncWheelToModel(force)
}

function requestModelSync(force = false) {
  hasPendingModelSync = true
  pendingModelSyncForce = pendingModelSyncForce || force
  if (pendingModelSyncFrameId !== null)
    return
  pendingModelSyncFrameId = requestAnimationFrame(flushPendingModelSync)
}

function queueVisibleModelSync(force = true, attempt = 0) {
  const container = containerRef.value
  if (!container)
    return

  if (container.clientHeight <= 0 && attempt < INITIAL_VISIBLE_SYNC_MAX_RETRIES) {
    mountVisibleSyncFrameId = requestAnimationFrame(() => {
      mountVisibleSyncFrameId = null
      queueVisibleModelSync(force, attempt + 1)
    })
    return
  }

  requestModelSync(force)
}

function primeSelectionFromModel(alignAnchor = false) {
  if (props.items.length === 0)
    return

  const modelItemIndex = resolveModelItemIndex()
  if (modelItemIndex < 0)
    return

  const syncBaseAbsoluteIndex = activeAbsoluteIndex.value ?? anchorAbsoluteIndex.value
  const targetAbsoluteIndex = getNearestAbsoluteIndexForItemIndex(
    modelItemIndex,
    syncBaseAbsoluteIndex,
    normalizeSyncDirectionHint(),
  )
  activeAbsoluteIndex.value = targetAbsoluteIndex
  if (alignAnchor)
    anchorAbsoluteIndex.value = targetAbsoluteIndex
}

function emitSelectionFromItem(item: VirtualTimeWheelItem | null) {
  if (!item || props.items.length === 0)
    return

  const previousAbsoluteIndex = activeAbsoluteIndex.value
  if (previousAbsoluteIndex === item.absoluteIndex)
    return

  activeAbsoluteIndex.value = item.absoluteIndex

  const value = item.item.value
  const previousValue
    = previousAbsoluteIndex === null
      ? null
      : (resolveValueAtAbsoluteIndex(previousAbsoluteIndex) ?? null)
  emit('step', {
    value,
    previousValue,
    absoluteIndex: item.absoluteIndex,
    previousAbsoluteIndex,
    delta: previousAbsoluteIndex === null ? 0 : item.absoluteIndex - previousAbsoluteIndex,
  })

  if (value === props.modelValue)
    return

  lastEmittedValue = value
  emit('update:modelValue', value)
}

function flushScrollSelection() {
  scrollFrameId = null

  const centered = getCenteredItem()
  if (!centered || props.disabled)
    return

  emitSelectionFromItem(centered)

  if (
    centered.index <= EDGE_REBASE_THRESHOLD
    || centered.index >= wheelItems.value.length - 1 - EDGE_REBASE_THRESHOLD
  ) {
    rebaseWindowAround(centered)
  }
}

function onSelectorScroll() {
  if (props.disabled || props.items.length === 0)
    return

  updateWheelMetrics()
  // Ignore edge rebasing while a programmatic smooth sync is active to avoid
  // visible snapping during linked-wheel carry updates (e.g. sec -> min).
  if (isProgrammaticScrollSync.value)
    return

  if (rebaseAtHardEdgeIfNeeded())
    return

  isUserScrolling.value = true
  if (scrollIdleTimeoutId !== null)
    clearTimeout(scrollIdleTimeoutId)

  scrollIdleTimeoutId = setTimeout(() => {
    isUserScrolling.value = false
    if (needsIdleRealign && activeAbsoluteIndex.value !== null) {
      const activeItem = wheelItems.value.find(
        item => item.absoluteIndex === activeAbsoluteIndex.value,
      )
      if (activeItem) {
        const expectedIndex = activeItem.index + normalizeFractionalOffset()
        if (Math.abs(centeredIndexFloat.value - expectedIndex) > 0.12) {
          markProgrammaticScrollSync(PROGRAMMATIC_SCROLL_SYNC_MS, false)
          scrollToIndex(expectedIndex, 'auto')
          updateWheelMetrics()
        }
      }
      needsIdleRealign = false
    }
    if (hasPendingModelSync)
      requestModelSync(pendingModelSyncForce)
  }, USER_SCROLL_IDLE_MS)

  if (scrollFrameId !== null)
    return

  scrollFrameId = requestAnimationFrame(flushScrollSelection)
}

function getKeyboardBaseAbsoluteIndex() {
  if (activeAbsoluteIndex.value !== null)
    return activeAbsoluteIndex.value

  const modelItemIndex = resolveModelItemIndex()
  if (modelItemIndex >= 0)
    return getNearestAbsoluteIndexForItemIndex(modelItemIndex)

  return anchorAbsoluteIndex.value
}

function getVisibleSiblingWheelTargets() {
  const container = containerRef.value
  if (!container)
    return []

  const grid = container.closest('.vtd-time-wheel-grid')
  if (!grid)
    return []

  return Array.from(grid.querySelectorAll<HTMLElement>('.vtd-time-wheel[role="listbox"]'))
    .filter(target => target.getClientRects().length > 0)
}

function focusAdjacentWheel(delta: number) {
  const container = containerRef.value
  if (!container)
    return false

  const targets = getVisibleSiblingWheelTargets()
  if (targets.length <= 1)
    return false

  const currentIndex = targets.findIndex(target => target === container)
  if (currentIndex < 0)
    return false

  const nextIndex = (currentIndex + delta + targets.length) % targets.length
  const target = targets[nextIndex]
  if (!target)
    return false

  target.focus({ preventScroll: true })
  return true
}

function applyKeyboardDelta(delta: number) {
  if (props.disabled || props.items.length === 0)
    return

  const targetAbsoluteIndex = getKeyboardBaseAbsoluteIndex() + delta
  const targetValue = resolveValueAtAbsoluteIndex(targetAbsoluteIndex)
  if (targetValue === undefined)
    return

  const previousAbsoluteIndex = activeAbsoluteIndex.value
  activeAbsoluteIndex.value = targetAbsoluteIndex

  emit('step', {
    value: targetValue,
    previousValue:
      previousAbsoluteIndex === null
        ? null
        : (resolveValueAtAbsoluteIndex(previousAbsoluteIndex) ?? null),
    absoluteIndex: targetAbsoluteIndex,
    previousAbsoluteIndex,
    delta: previousAbsoluteIndex === null ? 0 : targetAbsoluteIndex - previousAbsoluteIndex,
  })

  if (targetValue !== props.modelValue) {
    lastEmittedValue = targetValue
    emit('update:modelValue', targetValue)
  }

  const targetItem = wheelItems.value.find(item => item.absoluteIndex === targetAbsoluteIndex)
  if (targetItem) {
    markProgrammaticScrollSync(SMOOTH_SCROLL_SYNC_MS, false)
    scrollToIndex(targetItem.index + normalizeFractionalOffset(), 'smooth')
    return
  }

  anchorAbsoluteIndex.value = targetAbsoluteIndex
  nextTick(() => {
    markProgrammaticScrollSync(SMOOTH_SCROLL_SYNC_MS, false)
    updateWheelMetrics()
    scrollToIndex(WHEEL_CENTER_INDEX + normalizeFractionalOffset(), 'smooth')
  })
}

function applyKeyboardBoundaryJump(toStart: boolean) {
  if (props.disabled || props.items.length === 0)
    return

  const count = props.items.length
  const baseAbsoluteIndex = getKeyboardBaseAbsoluteIndex()
  const currentIndex = positiveModulo(baseAbsoluteIndex, count)

  const delta = toStart
    ? (currentIndex === 0 ? -count : -currentIndex)
    : (currentIndex === count - 1 ? count : (count - 1 - currentIndex))

  applyKeyboardDelta(delta)
}

function onKeydown(event: KeyboardEvent) {
  if (props.disabled)
    return

  if (event.key === 'Tab' && !event.altKey && !event.ctrlKey && !event.metaKey) {
    const moved = focusAdjacentWheel(event.shiftKey ? -1 : 1)
    if (moved)
      event.preventDefault()
    return
  }

  if (event.key === 'ArrowRight') {
    event.preventDefault()
    focusAdjacentWheel(1)
    return
  }

  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    focusAdjacentWheel(-1)
    return
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    applyKeyboardDelta(1)
    return
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault()
    applyKeyboardDelta(-1)
    return
  }

  if (event.key === 'PageDown') {
    event.preventDefault()
    applyKeyboardDelta(5)
    return
  }

  if (event.key === 'PageUp') {
    event.preventDefault()
    applyKeyboardDelta(-5)
    return
  }

  if (event.key === 'Home') {
    event.preventDefault()
    applyKeyboardBoundaryJump(true)
    return
  }

  if (event.key === 'End') {
    event.preventDefault()
    applyKeyboardBoundaryJump(false)
  }
}

function onOptionClick(item: VirtualTimeWheelItem) {
  if (props.disabled)
    return

  markProgrammaticScrollSync(SMOOTH_SCROLL_SYNC_MS, false)
  const targetIndex = item.index + normalizeFractionalOffset()
  scrollToIndex(targetIndex, 'smooth')
  emitSelectionFromItem(item)
  containerRef.value?.focus({ preventScroll: true })
}

function onStepButtonClick(delta: number) {
  if (props.disabled)
    return

  applyKeyboardDelta(delta)
  containerRef.value?.focus({ preventScroll: true })
}

watch(
  () => ({
    modelValue: props.modelValue,
    itemCount: props.items.length,
    signature: itemsSignature.value,
    scrollMode: props.scrollMode,
    fractionalOffset: props.fractionalOffset,
    syncDirection: props.syncDirection,
  }),
  (current, previous) => {
    if (current.itemCount === 0)
      return

    const forceSync
      = !previous
        || current.itemCount !== previous.itemCount
        || current.signature !== previous.signature
    const modelChanged = current.modelValue !== previous?.modelValue
    const scrollModeChanged = current.scrollMode !== previous?.scrollMode
    const fractionalOffsetChanged = current.fractionalOffset !== previous?.fractionalOffset
    const syncDirectionChanged = current.syncDirection !== previous?.syncDirection
    const syncDirectionHintChanged = syncDirectionChanged && current.syncDirection !== 0
    const modeChanged = scrollModeChanged || fractionalOffsetChanged || syncDirectionHintChanged

    if (!forceSync && !modelChanged && !modeChanged)
      return

    // Fractional offset updates should preserve smooth alignment behavior.
    // Only force anchor realignment for structural/model sync changes.
    primeSelectionFromModel(forceSync || scrollModeChanged)

    if (!forceSync && modelChanged && current.modelValue === lastEmittedValue && !modeChanged)
      return

    requestModelSync(forceSync || scrollModeChanged)
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (scrollFrameId !== null)
    cancelAnimationFrame(scrollFrameId)
  if (scrollIdleTimeoutId !== null)
    clearTimeout(scrollIdleTimeoutId)
  if (programmaticSyncTimeoutId !== null)
    clearTimeout(programmaticSyncTimeoutId)
  if (pendingModelSyncFrameId !== null)
    cancelAnimationFrame(pendingModelSyncFrameId)
  if (mountVisibleSyncFrameId !== null)
    cancelAnimationFrame(mountVisibleSyncFrameId)
})

onMounted(() => {
  if (typeof ResizeObserver === 'undefined')
    return

  const container = containerRef.value
  if (!container)
    return

  resizeObserver = new ResizeObserver(() => {
    const viewportHeight = container.clientHeight
    const becameVisible = lastObservedViewportHeight <= 0 && viewportHeight > 0
    const resizedWhileVisible
      = lastObservedViewportHeight > 0
        && viewportHeight > 0
        && Math.abs(viewportHeight - lastObservedViewportHeight) > 1
    lastObservedViewportHeight = viewportHeight

    if (!becameVisible && !resizedWhileVisible)
      return

    // Keep wheel panels in sync when toggled from display:none or resized by
    // panel lock updates so the selected option remains centered.
    requestModelSync(true)
  })

  resizeObserver.observe(container)
  lastObservedViewportHeight = container.clientHeight

  // On some hide/show paths (notably Firefox + popover transitions),
  // ResizeObserver may not emit a visibility restoration callback in time.
  // Force one mount-time sync once the wheel has a measurable viewport.
  queueVisibleModelSync(true)
})
</script>

<template>
  <div
    class="vtd-time-wheel-shell relative flex h-full w-full min-w-0 flex-col overflow-visible rounded-md border border-black/[.08] p-1 transition-colors focus-within:border-vtd-primary-300 dark:border-vtd-secondary-700/[1] dark:focus-within:border-vtd-primary-500"
  >
    <VtdSelectorWheelStepButton
      z-class="z-30"
      direction="up"
      :label="`Select previous ${normalizedAriaLabel.toLowerCase()}`"
      :disabled="props.disabled"
      @click="onStepButtonClick(-1)"
    />
    <div
      ref="containerRef"
      class="vtd-time-wheel h-full min-h-0 flex-1 overflow-y-auto rounded-md px-0.5 py-1 focus:outline-none focus-visible:outline-none"
      role="listbox"
      :aria-label="normalizedAriaLabel"
      :aria-disabled="props.disabled ? 'true' : 'false'"
      :tabindex="props.disabled ? -1 : 0"
      @scroll.passive="onSelectorScroll"
      @keydown="onKeydown"
    >
      <div
        v-for="item in wheelItems"
        :key="item.key"
        :data-time-index="item.index"
        class="h-11 flex items-center"
      >
        <button
          type="button"
          role="option"
          :aria-selected="item.absoluteIndex === activeAbsoluteIndex"
          class="w-full rounded-[8px] border px-2 py-1 text-sm font-medium tabular-nums transition-colors focus:outline-none focus-visible:outline-none"
          :class="[
            item.absoluteIndex === activeAbsoluteIndex
              ? 'vtd-time-wheel-option-selected border-vtd-primary-400 bg-vtd-primary-100 dark:border-vtd-primary-500 dark:bg-vtd-primary-500/20'
              : 'vtd-time-wheel-option-default border-transparent hover:bg-vtd-secondary-100 dark:hover:bg-vtd-secondary-700',
            props.disabled ? 'opacity-50 cursor-not-allowed' : '',
          ]"
          :disabled="props.disabled"
          @click="onOptionClick(item)"
        >
          {{ item.item.label }}
        </button>
      </div>
    </div>
    <VtdSelectorWheelStepButton
      z-class="z-30"
      direction="down"
      :label="`Select next ${normalizedAriaLabel.toLowerCase()}`"
      :disabled="props.disabled"
      @click="onStepButtonClick(1)"
    />
  </div>
</template>

<style scoped>
.vtd-time-wheel-option-selected {
  color: var(
    --vtd-time-wheel-selected-text,
    var(--vtd-wheel-selected-text, rgb(56 189 248 / 100%))
  );
}

.vtd-time-wheel-option-default {
  color: var(--vtd-time-wheel-text, var(--vtd-wheel-text, rgb(163 163 163 / 100%)));
}
</style>
