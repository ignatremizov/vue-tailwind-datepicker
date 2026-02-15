<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import VtdSelectorWheelStepButton from './SelectorWheelStepButton.vue'

type SelectorFocus = 'month' | 'year'

const props = withDefaults(defineProps<{
  years: number[]
  selectorMode?: boolean
  selectedYear?: number | null
  selectedMonth?: number | null
  selectorFocus?: SelectorFocus
  yearScrollMode?: 'boundary' | 'fractional'
  homeJump?: number
  endJump?: number
  pageJump?: number
  pageShiftJump?: number
}>(), {
  selectorMode: false,
  selectedYear: null,
  selectedMonth: null,
  selectorFocus: 'month',
  yearScrollMode: 'boundary',
  homeJump: 100,
  endJump: 100,
  pageJump: 10,
  pageShiftJump: 100,
})

const emit = defineEmits<{
  (e: 'updateYear', value: number): void
  (e: 'scrollYear', value: number): void
  (e: 'focusYear'): void
  (e: 'requestFocusMonth'): void
}>()

const selectorContainerRef = ref<HTMLDivElement | null>(null)
const selectorCanvasRef = ref<HTMLCanvasElement | null>(null)
const isUserScrolling = ref(false)
const isProgrammaticScrollSync = ref(false)
const selectorScrollTop = ref(0)
const selectorViewportHeight = ref(256)
const selectorViewportWidth = ref(0)
const selectorPaddingTop = ref(0)
const selectorRowHeight = ref(44)
let scrollFrameId: number | null = null
let drawFrameId: number | null = null
let scrollIdleTimeoutId: ReturnType<typeof setTimeout> | null = null
let programmaticSyncTimeoutId: ReturnType<typeof setTimeout> | null = null
let lastEmittedScrollYear: number | null = null
let suppressSelectedYearSyncUntil = 0
let resizeObserver: ResizeObserver | null = null
let pendingScrollYear: number | null = null
const previewYear = ref<number | null>(null)
let lastPreanchorEmitAt = 0
let awaitingPreanchor = false
let queuedPreanchorYear: number | null = null
const edgeLoadingSide = ref<'top' | 'bottom' | null>(null)
const hoveredYear = ref<number | null>(null)

const USER_SCROLL_IDLE_MS = 120
const PROGRAMMATIC_SCROLL_SYNC_MS = 180
const CLICK_SYNC_SUPPRESS_MS = 560
const SMOOTH_SCROLL_SYNC_MS = 520
const DEFAULT_ROW_HEIGHT = 44
const CONTENT_TOP_BOTTOM_PADDING = 4
const REANCHOR_SCROLL_DEADZONE_PX = 0.75
const EDGE_GUARD_ROWS = 140
const PREANCHOR_EDGE_ROWS = 90
const PREANCHOR_EMIT_COOLDOWN_MS = 90
const STEP_BUTTON_FOCUS_SUPPRESS_MS = 650
let suppressFocusAutoCenterUntil = 0

const yearAriaAnnouncement = computed(() => {
  if (props.selectedYear === null)
    return 'No year selected'
  return `Year ${props.selectedYear} selected`
})

const ariaYearMin = computed(() => {
  if (props.years.length === 0)
    return undefined
  return Math.min(...props.years)
})

const ariaYearMax = computed(() => {
  if (props.years.length === 0)
    return undefined
  return Math.max(...props.years)
})

const ariaYearNow = computed(() => {
  return props.selectedYear
    ?? previewYear.value
    ?? getCenteredYear()
    ?? undefined
})

const ariaYearText = computed(() => {
  if (ariaYearNow.value === undefined)
    return undefined
  return `Year ${ariaYearNow.value}`
})

function isSelectedYear(year: number) {
  const selected = isUserScrolling.value
    ? (previewYear.value ?? props.selectedYear)
    : props.selectedYear
  return selected === year
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function readCssNumber(value: string | undefined, fallback: number) {
  const parsed = Number.parseFloat(value ?? '')
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function readCssVariable(container: HTMLElement | null, variableName: string) {
  if (!container)
    return ''
  const computedValue = getComputedStyle(container).getPropertyValue(variableName).trim()
  if (computedValue)
    return computedValue
  return container.style.getPropertyValue(variableName).trim()
}

function resolveInheritedFontToken(token: string | undefined, inherited: string, fallback: string) {
  const normalized = (token ?? '').trim()
  if (!normalized || normalized === 'inherit')
    return inherited || fallback
  return normalized
}

function getCanvasDpr(container: HTMLElement | null) {
  const deviceDpr = Math.max(1, window.devicePixelRatio || 1)
  if (!container)
    return Math.min(4, deviceDpr)

  const cssDpr = readCssNumber(
    getComputedStyle(container).getPropertyValue('--vtd-selector-year-canvas-dpr').trim(),
    deviceDpr,
  )

  return Math.min(4, Math.max(1, cssDpr))
}

function getSelectorRowHeight() {
  return Math.max(1, selectorRowHeight.value || DEFAULT_ROW_HEIGHT)
}

function markProgrammaticScrollSync(durationMs = PROGRAMMATIC_SCROLL_SYNC_MS) {
  isProgrammaticScrollSync.value = true
  if (programmaticSyncTimeoutId !== null)
    clearTimeout(programmaticSyncTimeoutId)
  programmaticSyncTimeoutId = setTimeout(() => {
    isProgrammaticScrollSync.value = false
  }, durationMs)
}

function updateSelectorMetrics() {
  const container = selectorContainerRef.value
  if (!container)
    return

  // TODO: re-measure when `--vtd-selector-wheel-cell-height` changes at runtime
  // even if no focus/scroll/resize event occurs while selector mode stays open.
  const computedStyles = getComputedStyle(container)
  selectorViewportHeight.value = container.clientHeight || selectorViewportHeight.value
  selectorViewportWidth.value = container.clientWidth || selectorViewportWidth.value
  selectorScrollTop.value = container.scrollTop
  selectorPaddingTop.value = Number.parseFloat(computedStyles.paddingTop || '0') || 0
  selectorRowHeight.value = readCssNumber(
    readCssVariable(container, '--vtd-selector-wheel-cell-height'),
    DEFAULT_ROW_HEIGHT,
  )
}

function getYearFractionalOffset() {
  if (props.yearScrollMode !== 'fractional' || props.selectedMonth === null)
    return 0
  const monthIndex = clamp(props.selectedMonth, 0, 11)
  const JUNE_INDEX = 5
  return (monthIndex - JUNE_INDEX) / 12
}

function shouldSuppressSelectedYearSync() {
  return Date.now() < suppressSelectedYearSyncUntil
}

function shouldSuppressFocusAutoCenter() {
  return Date.now() < suppressFocusAutoCenterUntil
}

function getCenteredIndexFloat() {
  const viewportHeight = selectorViewportHeight.value || 256
  const rowHeight = getSelectorRowHeight()
  const guardOffsetPx = EDGE_GUARD_ROWS * rowHeight
  return (
    selectorScrollTop.value
    - selectorPaddingTop.value
    - guardOffsetPx
    + (viewportHeight / 2)
    - (rowHeight / 2)
  ) / rowHeight
}

function getCenteredYear() {
  const years = props.years
  if (years.length === 0)
    return null

  const centeredIndex = clamp(Math.round(getCenteredIndexFloat()), 0, years.length - 1)
  return years[centeredIndex] ?? null
}

function maybeEmitPreanchor(
  indexFloat: number,
  centeredYear: number | null,
  options: { force?: boolean } = {},
) {
  const { force = false } = options
  const years = props.years
  if (centeredYear === null || years.length === 0)
    return

  const maxIndex = years.length - 1
  const nearTop = indexFloat <= PREANCHOR_EDGE_ROWS
  const nearBottom = indexFloat >= maxIndex - PREANCHOR_EDGE_ROWS
  if (!nearTop && !nearBottom) {
    edgeLoadingSide.value = null
    return
  }
  edgeLoadingSide.value = nearTop ? 'top' : 'bottom'

  if (awaitingPreanchor) {
    queuedPreanchorYear = centeredYear
    return
  }

  const now = performance.now()
  if (!force && (now - lastPreanchorEmitAt) < PREANCHOR_EMIT_COOLDOWN_MS)
    return

  if (!force && centeredYear === lastEmittedScrollYear)
    return

  lastPreanchorEmitAt = now
  awaitingPreanchor = true
  queuedPreanchorYear = null
  lastEmittedScrollYear = centeredYear
  emit('scrollYear', centeredYear)
}

function getScrollContentHeight() {
  const rowHeight = getSelectorRowHeight()
  return Math.max(
    1,
    ((props.years.length + (EDGE_GUARD_ROWS * 2)) * rowHeight) + (CONTENT_TOP_BOTTOM_PADDING * 2),
  )
}

function centerIndexToScrollTop(index: number, container: HTMLDivElement) {
  const rowHeight = getSelectorRowHeight()
  return selectorPaddingTop.value
    + ((index + EDGE_GUARD_ROWS) * rowHeight)
    - (container.clientHeight / 2)
    + (rowHeight / 2)
}

function centerYearByIndex(index: number, behavior: ScrollBehavior = 'auto') {
  const container = selectorContainerRef.value
  if (!container)
    return

  const centeredScrollTop = centerIndexToScrollTop(index, container)
  const targetTop = Math.max(0, centeredScrollTop)
  if (Math.abs(container.scrollTop - targetTop) <= REANCHOR_SCROLL_DEADZONE_PX) {
    selectorScrollTop.value = container.scrollTop
    queueCanvasDraw()
    return
  }

  markProgrammaticScrollSync(behavior === 'smooth' ? SMOOTH_SCROLL_SYNC_MS : PROGRAMMATIC_SCROLL_SYNC_MS)
  container.scrollTo({
    top: targetTop,
    behavior,
  })
  selectorScrollTop.value = container.scrollTop
  queueCanvasDraw()
}

function lockScrollAtEdgeIfNeeded() {
  const container = selectorContainerRef.value
  if (!container || props.years.length === 0)
    return false

  const rawIndex = getCenteredIndexFloat()
  const minIndex = -1
  const maxIndex = props.years.length
  const lockedIndex = clamp(rawIndex, minIndex, maxIndex)
  if (Math.abs(rawIndex - lockedIndex) < 0.01)
    return false

  const maxScrollTop = Math.max(0, container.scrollHeight - container.clientHeight)
  const targetTop = clamp(centerIndexToScrollTop(lockedIndex, container), 0, maxScrollTop)
  if (Math.abs(container.scrollTop - targetTop) < REANCHOR_SCROLL_DEADZONE_PX)
    return false

  markProgrammaticScrollSync(90)
  container.scrollTop = targetTop
  selectorScrollTop.value = targetTop
  return true
}

interface ScrollSelectedYearOptions {
  includeFractionalOffset?: boolean
}

function scrollSelectedYearIntoView(
  behavior: ScrollBehavior = 'auto',
  options: ScrollSelectedYearOptions = {},
) {
  if (!props.selectorMode || props.selectedYear === null)
    return
  const { includeFractionalOffset = true } = options

  const selectedYearIndex = props.years.findIndex(year => year === props.selectedYear)
  if (selectedYearIndex < 0)
    return

  updateSelectorMetrics()
  lastEmittedScrollYear = props.selectedYear
  const fractionalOffset = includeFractionalOffset ? getYearFractionalOffset() : 0
  centerYearByIndex(selectedYearIndex + fractionalOffset, behavior)
}

function preserveOffsetAcrossYearWindowShift(previousFirstYear: number, nextFirstYear: number) {
  const container = selectorContainerRef.value
  if (!container)
    return

  const yearShift = nextFirstYear - previousFirstYear
  if (yearShift === 0)
    return

  const deltaPx = -yearShift * getSelectorRowHeight()
  if (Math.abs(deltaPx) <= 0.01)
    return

  markProgrammaticScrollSync(80)
  const maxScrollTop = Math.max(0, container.scrollHeight - container.clientHeight)
  container.scrollTop = clamp(container.scrollTop + deltaPx, 0, maxScrollTop)
  selectorScrollTop.value = container.scrollTop
  queueCanvasDraw()
}

function resizeCanvasToContainer() {
  const canvas = selectorCanvasRef.value
  const container = selectorContainerRef.value
  if (!canvas || !container)
    return

  const dpr = getCanvasDpr(container)
  const width = container.clientWidth
  const height = container.clientHeight

  if (width <= 0 || height <= 0)
    return

  const nextCanvasWidth = Math.floor(width * dpr)
  const nextCanvasHeight = Math.floor(height * dpr)

  if (canvas.width !== nextCanvasWidth || canvas.height !== nextCanvasHeight) {
    canvas.width = nextCanvasWidth
    canvas.height = nextCanvasHeight
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
  }

  selectorViewportWidth.value = width
  selectorViewportHeight.value = height
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + width, y, x + width, y + height, r)
  ctx.arcTo(x + width, y + height, x, y + height, r)
  ctx.arcTo(x, y + height, x, y, r)
  ctx.arcTo(x, y, x + width, y, r)
  ctx.closePath()
}

function strokeRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  lineWidth: number,
) {
  const lw = Math.max(0.5, lineWidth)
  const inset = lw / 2
  // Snap to half-pixels to reduce antialias bloom versus DOM borders.
  const sx = Math.round((x + inset) * 2) / 2
  const sy = Math.round((y + inset) * 2) / 2
  const sw = Math.max(0, width - lw)
  const sh = Math.max(0, height - lw)
  drawRoundedRectPath(ctx, sx, sy, sw, sh, Math.max(0, radius - inset))
  ctx.lineWidth = lw
  ctx.stroke()
}

function drawClockIcon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string,
  rotation = 0,
) {
  const r = size / 2
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = 1.9
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()

  ctx.translate(cx, cy)
  ctx.rotate(rotation)
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(0, -(r * 0.58))
  ctx.moveTo(0, 0)
  ctx.lineTo(r * 0.48, 0)
  ctx.stroke()
  ctx.beginPath()
  ctx.fillStyle = color
  ctx.arc(0, 0, 1.4, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawYearCanvas() {
  drawFrameId = null

  if (!props.selectorMode)
    return

  const canvas = selectorCanvasRef.value
  if (!canvas)
    return

  const ctx = canvas.getContext('2d')
  if (!ctx)
    return

  const years = props.years
  if (years.length === 0)
    return

  const width = canvas.clientWidth || selectorViewportWidth.value || 0
  const height = canvas.clientHeight || selectorViewportHeight.value || 0
  if (width <= 0 || height <= 0)
    return
  const dpr = canvas.width / width

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  const rawIndexFloat = getCenteredIndexFloat()
  const maxIndex = years.length - 1
  const nearTopEdge = rawIndexFloat <= PREANCHOR_EDGE_ROWS
  const nearBottomEdge = rawIndexFloat >= (maxIndex - PREANCHOR_EDGE_ROWS)
  const topEdgeActive = nearTopEdge || edgeLoadingSide.value === 'top'
  const bottomEdgeActive = nearBottomEdge || edgeLoadingSide.value === 'bottom'
  const shouldAnimateEdgeClocks = topEdgeActive || bottomEdgeActive
  const clockRotation = shouldAnimateEdgeClocks
    ? ((performance.now() / 650) % (Math.PI * 2))
    : 0
  const indexFloat = clamp(rawIndexFloat, -1, maxIndex + 1)
  const startIndex = Math.floor(indexFloat - 4)
  const endIndex = Math.ceil(indexFloat + 4)
  const rowHeight = getSelectorRowHeight()

  const centerY = height / 2
  const buttonX = 2
  const buttonWidth = Math.max(0, width - 4)
  const cssVars = selectorContainerRef.value ? getComputedStyle(selectorContainerRef.value) : null
  const buttonHeight = readCssNumber(
    readCssVariable(selectorContainerRef.value, '--vtd-selector-wheel-cell-height'),
    rowHeight,
  )
  const textCenterX = width / 2
  const hoverBg = cssVars?.getPropertyValue('--vtd-selector-year-hover-bg').trim() || 'rgba(30, 41, 59, 0.92)'
  const hoverBorder = cssVars?.getPropertyValue('--vtd-selector-year-hover-border').trim() || 'rgba(100, 116, 139, 0.5)'
  const borderWidthScale = clamp(
    readCssNumber(cssVars?.getPropertyValue('--vtd-selector-year-canvas-border-width-scale').trim(), 0.5),
    0.1,
    1,
  )
  const hoverBorderWidth = readCssNumber(cssVars?.getPropertyValue('--vtd-selector-year-hover-border-width').trim(), 0.85) * borderWidthScale
  const hoverText = cssVars?.getPropertyValue('--vtd-selector-year-hover-text').trim() || 'rgba(226, 232, 240, 0.96)'
  const selectedBg = cssVars?.getPropertyValue('--vtd-selector-year-selected-bg').trim() || 'rgba(14, 165, 233, 0.13)'
  const selectedBorder = cssVars?.getPropertyValue('--vtd-selector-year-selected-border').trim() || 'rgba(14, 165, 233, 0.62)'
  const selectedBorderWidth = readCssNumber(cssVars?.getPropertyValue('--vtd-selector-year-selected-border-width').trim(), 0.85) * borderWidthScale
  const selectedText = cssVars?.getPropertyValue('--vtd-selector-year-selected-text').trim() || 'rgba(56, 189, 248, 1)'
  const defaultText = cssVars?.getPropertyValue('--vtd-selector-year-text').trim() || 'rgba(82, 82, 91, 0.92)'
  const yearTextOffsetY = readCssNumber(cssVars?.getPropertyValue('--vtd-selector-year-text-offset-y').trim(), 0)
  const inheritedFontFamily = cssVars?.fontFamily?.trim() || 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif'
  const inheritedFontSize = cssVars?.fontSize?.trim() || '14px'
  const inheritedFontWeight = cssVars?.fontWeight?.trim() || '500'
  const yearFontFamily = resolveInheritedFontToken(
    cssVars?.getPropertyValue('--vtd-selector-year-font-family'),
    inheritedFontFamily,
    'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
  )
  const yearFontSize = resolveInheritedFontToken(
    cssVars?.getPropertyValue('--vtd-selector-year-font-size'),
    inheritedFontSize,
    '14px',
  )
  const yearFontWeight = resolveInheritedFontToken(
    cssVars?.getPropertyValue('--vtd-selector-year-font-weight'),
    inheritedFontWeight,
    '500',
  )

  ctx.textAlign = 'center'
  ctx.font = `${yearFontWeight} ${yearFontSize} ${yearFontFamily}`
  const textMetrics = ctx.measureText('0123456789')
  const hasBoundingMetrics
    = Number.isFinite(textMetrics.actualBoundingBoxAscent)
      && Number.isFinite(textMetrics.actualBoundingBoxDescent)
      && (textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent) > 0
  const baselineOffset = hasBoundingMetrics
    ? ((textMetrics.actualBoundingBoxAscent - textMetrics.actualBoundingBoxDescent) / 2)
    : 0
  ctx.textBaseline = hasBoundingMetrics ? 'alphabetic' : 'middle'

  for (let i = startIndex - 1; i <= endIndex + 1; i += 1) {
    const y = centerY + ((i - indexFloat) * rowHeight)

    if (y < -rowHeight || y > height + rowHeight)
      continue

    const top = y - (buttonHeight / 2)
    const isTopEdgeRow = i === -1
    const isBottomEdgeRow = i === (maxIndex + 1)
    const isEdgeRow = isTopEdgeRow || isBottomEdgeRow

    if (i < 0 || i > maxIndex) {
      if (!isEdgeRow)
        continue
    }

    if (isEdgeRow) {
      const active = isTopEdgeRow ? topEdgeActive : bottomEdgeActive
      drawRoundedRectPath(ctx, buttonX, top, buttonWidth, buttonHeight, 8)
      ctx.fillStyle = active ? 'rgba(56, 189, 248, 0.18)' : 'rgba(148, 163, 184, 0.08)'
      ctx.fill()
      ctx.strokeStyle = active ? 'rgba(56, 189, 248, 0.58)' : 'rgba(148, 163, 184, 0.34)'
      strokeRoundedRectPath(ctx, buttonX, top, buttonWidth, buttonHeight, 8, 1)
      const iconColor = active ? 'rgba(56, 189, 248, 1)' : 'rgba(148, 163, 184, 0.86)'
      drawClockIcon(ctx, textCenterX, y, 14, iconColor, clockRotation)
      continue
    }

    const year = years[i]
    if (typeof year !== 'number')
      continue
    const isSelected = isSelectedYear(year)
    const isHovered = hoveredYear.value === year

    if (isSelected) {
      drawRoundedRectPath(ctx, buttonX, top, buttonWidth, buttonHeight, 8)
      ctx.fillStyle = selectedBg
      ctx.fill()
      ctx.strokeStyle = selectedBorder
      strokeRoundedRectPath(ctx, buttonX, top, buttonWidth, buttonHeight, 8, selectedBorderWidth)
      ctx.fillStyle = selectedText
    }
    else if (isHovered) {
      drawRoundedRectPath(ctx, buttonX, top, buttonWidth, buttonHeight, 8)
      ctx.fillStyle = hoverBg
      ctx.fill()
      ctx.strokeStyle = hoverBorder
      strokeRoundedRectPath(ctx, buttonX, top, buttonWidth, buttonHeight, 8, hoverBorderWidth)
      ctx.fillStyle = hoverText
    }
    else {
      ctx.fillStyle = defaultText
    }

    ctx.fillText(String(year), textCenterX, y + baselineOffset + yearTextOffsetY)
  }

  if (shouldAnimateEdgeClocks)
    queueCanvasDraw()
}

function queueCanvasDraw() {
  if (drawFrameId !== null)
    return
  drawFrameId = requestAnimationFrame(drawYearCanvas)
}

function onYearCanvasClick(event: MouseEvent) {
  if (!props.selectorMode)
    return

  const container = selectorContainerRef.value
  if (!container)
    return

  const rect = container.getBoundingClientRect()
  const localY = event.clientY - rect.top
  const deltaRows = Math.round((localY - (rect.height / 2)) / getSelectorRowHeight())
  const targetIndex = clamp(
    Math.round(getCenteredIndexFloat()) + deltaRows,
    0,
    props.years.length - 1,
  )

  const year = props.years[targetIndex]
  if (typeof year !== 'number')
    return

  suppressSelectedYearSyncUntil = Date.now() + CLICK_SYNC_SUPPRESS_MS
  lastEmittedScrollYear = year
  previewYear.value = year
  pendingScrollYear = null
  emit('updateYear', year)
  centerYearByIndex(targetIndex, 'smooth')
}

function onSelectorPointerMove(event: MouseEvent) {
  if (!props.selectorMode || props.years.length === 0)
    return

  const container = selectorContainerRef.value
  if (!container)
    return

  const rect = container.getBoundingClientRect()
  const localY = event.clientY - rect.top
  const deltaRows = Math.round((localY - (rect.height / 2)) / getSelectorRowHeight())
  const targetIndex = clamp(
    Math.round(getCenteredIndexFloat()) + deltaRows,
    0,
    props.years.length - 1,
  )
  hoveredYear.value = props.years[targetIndex] ?? null
  queueCanvasDraw()
}

function clearHoveredYear() {
  if (hoveredYear.value === null)
    return
  hoveredYear.value = null
  queueCanvasDraw()
}

function flushScrollYearUpdate() {
  scrollFrameId = null
  const indexFloat = getCenteredIndexFloat()
  const centeredYear = getCenteredYear()
  queueCanvasDraw()

  if (centeredYear === null)
    return

  maybeEmitPreanchor(indexFloat, centeredYear)

  previewYear.value = centeredYear
  if (centeredYear === props.selectedYear || centeredYear === lastEmittedScrollYear) {
    pendingScrollYear = null
    return
  }

  pendingScrollYear = centeredYear
}

function onSelectorScroll() {
  if (!props.selectorMode)
    return

  updateSelectorMetrics()
  const edgeLocked = lockScrollAtEdgeIfNeeded()
  if (edgeLocked) {
    updateSelectorMetrics()
    maybeEmitPreanchor(getCenteredIndexFloat(), getCenteredYear(), { force: true })
  }
  queueCanvasDraw()

  if (isProgrammaticScrollSync.value && !edgeLocked)
    return

  isUserScrolling.value = true
  if (scrollIdleTimeoutId !== null)
    clearTimeout(scrollIdleTimeoutId)
  scrollIdleTimeoutId = setTimeout(() => {
    isUserScrolling.value = false
    if (pendingScrollYear !== null && pendingScrollYear !== props.selectedYear && pendingScrollYear !== lastEmittedScrollYear) {
      lastEmittedScrollYear = pendingScrollYear
      emit('scrollYear', lastEmittedScrollYear)
    }
    pendingScrollYear = null
    previewYear.value = props.selectedYear
  }, USER_SCROLL_IDLE_MS)

  if (scrollFrameId !== null)
    return
  scrollFrameId = requestAnimationFrame(flushScrollYearUpdate)
}

function getKeyboardBaseYear() {
  return props.selectedYear
    ?? previewYear.value
    ?? getCenteredYear()
    ?? props.years[Math.floor(props.years.length / 2)]
    ?? new Date().getFullYear()
}

function normalizeJump(value: number | undefined, fallback: number) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0)
    return fallback
  return Math.max(1, Math.trunc(parsed))
}

function applyKeyboardYearDelta(delta: number) {
  if (!props.selectorMode)
    return

  const targetYear = getKeyboardBaseYear() + delta
  suppressSelectedYearSyncUntil = Date.now() + CLICK_SYNC_SUPPRESS_MS
  lastEmittedScrollYear = targetYear
  previewYear.value = targetYear
  pendingScrollYear = null
  emit('updateYear', targetYear)

  const targetIndex = props.years.findIndex(year => year === targetYear)
  if (targetIndex >= 0)
    centerYearByIndex(targetIndex, 'smooth')
  else
    queueCanvasDraw()
}

function onSelectorKeydown(event: KeyboardEvent) {
  if (!props.selectorMode)
    return

  // Intentional: both Tab and Shift+Tab switch between year/month wheels.
  // Although this local handler always requests the sibling wheel, reverse
  // traversal is preserved at the picker level by the parent focus cycle logic.
  if (event.key === 'Tab' && !event.altKey && !event.ctrlKey && !event.metaKey) {
    event.preventDefault()
    emit('requestFocusMonth')
    return
  }

  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault()
    emit('requestFocusMonth')
    return
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    applyKeyboardYearDelta(1)
    return
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault()
    applyKeyboardYearDelta(-1)
    return
  }

  if (event.key === 'PageDown') {
    event.preventDefault()
    applyKeyboardYearDelta(event.shiftKey
      ? normalizeJump(props.pageShiftJump, 100)
      : normalizeJump(props.pageJump, 10))
    return
  }

  if (event.key === 'PageUp') {
    event.preventDefault()
    applyKeyboardYearDelta(event.shiftKey
      ? -normalizeJump(props.pageShiftJump, 100)
      : -normalizeJump(props.pageJump, 10))
    return
  }

  if (event.key === 'Home') {
    event.preventDefault()
    applyKeyboardYearDelta(-normalizeJump(props.homeJump, 100))
    return
  }

  if (event.key === 'End') {
    event.preventDefault()
    applyKeyboardYearDelta(normalizeJump(props.endJump, 100))
  }
}

function onSelectorFocus() {
  emit('focusYear')
  if (!props.selectorMode || props.selectedYear === null)
    return

  if (shouldSuppressFocusAutoCenter()) {
    queueCanvasDraw()
    return
  }

  // Browsers can nudge scroll position on focus/tab. Keep the wheel anchored
  // to the selected year and treat the resulting scroll as programmatic.
  markProgrammaticScrollSync(120)
  updateSelectorMetrics()
  scrollSelectedYearIntoView('auto', {
    includeFractionalOffset: props.yearScrollMode === 'fractional',
  })
  queueCanvasDraw()
}

function onSelectorStepClick(delta: number) {
  if (!props.selectorMode)
    return

  suppressFocusAutoCenterUntil = Date.now() + STEP_BUTTON_FOCUS_SUPPRESS_MS
  applyKeyboardYearDelta(delta)
  selectorContainerRef.value?.focus({ preventScroll: true })
}

watch(
  () => [
    props.selectorMode,
    props.selectedYear,
    props.selectedMonth,
    props.years[0],
    props.years[props.years.length - 1],
    props.years.length,
  ],
  (
    [isSelectorMode, selectedYear, selectedMonth, firstYear, lastYear, length],
    previous = [],
  ) => {
    if (!isSelectorMode || selectedYear === null)
      return

    const previousFirstYear = previous[3]
    const previousLastYear = previous[4]
    const previousLength = previous[5]
    const previousSelectedYear = typeof previous[1] === 'number' ? previous[1] : null
    const previousSelectedMonth = typeof previous[2] === 'number' ? previous[2] : null
    const yearWindowChanged
      = firstYear !== previousFirstYear
        || lastYear !== previousLastYear
        || length !== previousLength
    if (yearWindowChanged) {
      awaitingPreanchor = false
      if (queuedPreanchorYear !== null) {
        lastPreanchorEmitAt = 0
        if (queuedPreanchorYear !== lastEmittedScrollYear) {
          lastEmittedScrollYear = queuedPreanchorYear
          emit('scrollYear', queuedPreanchorYear)
        }
        queuedPreanchorYear = null
      }
      edgeLoadingSide.value = null
    }
    const selectedYearNumber = typeof selectedYear === 'number' ? selectedYear : null
    const selectedMonthNumber = typeof selectedMonth === 'number' ? selectedMonth : null
    const monthDriftEnabled = props.yearScrollMode === 'fractional'
    const monthChanged = selectedMonthNumber !== previousSelectedMonth

    const isScrollDrivenReanchor
      = yearWindowChanged
        && (
          selectedYearNumber === previousSelectedYear
          || selectedYearNumber === lastEmittedScrollYear
          || isUserScrolling.value
          || pendingScrollYear !== null
        )
    if (isScrollDrivenReanchor) {
      if (typeof previousFirstYear === 'number' && typeof firstYear === 'number') {
        nextTick(() => {
          preserveOffsetAcrossYearWindowShift(previousFirstYear, firstYear)
        })
      }
      else {
        queueCanvasDraw()
      }
      return
    }

    // If the parent value reflects our latest scroll emission, avoid re-centering
    // (especially when the year window is re-anchored), which causes visible snap.
    if (
      selectedYearNumber !== null
      && selectedYearNumber === lastEmittedScrollYear
      && !yearWindowChanged
      && !(monthDriftEnabled && monthChanged)
    ) {
      queueCanvasDraw()
      return
    }

    if (!monthDriftEnabled && selectedYearNumber === previousSelectedYear && !yearWindowChanged) {
      queueCanvasDraw()
      return
    }

    const shouldSmoothSync
      = previousSelectedYear !== null
        && selectedYearNumber !== null
        && (
          (
            selectedYearNumber !== previousSelectedYear
            && Math.abs(selectedYearNumber - previousSelectedYear) <= 1
          )
          || (
            monthDriftEnabled
            && previousSelectedMonth !== null
            && selectedMonthNumber !== null
            && selectedMonthNumber !== previousSelectedMonth
          )
        )
        && !yearWindowChanged

    if (shouldSuppressSelectedYearSync()) {
      queueCanvasDraw()
      return
    }
    if (isUserScrolling.value && !yearWindowChanged) {
      queueCanvasDraw()
      return
    }

    nextTick(() => {
      resizeCanvasToContainer()
      scrollSelectedYearIntoView(shouldSmoothSync ? 'smooth' : 'auto')
      queueCanvasDraw()
    })
  },
  { immediate: true },
)

watch(
  () => props.selectedYear,
  (year) => {
    if (year !== null)
      lastEmittedScrollYear = year
    if (!isUserScrolling.value)
      previewYear.value = year
    queueCanvasDraw()
  },
)

watch(
  () => props.selectorMode,
  (enabled) => {
    if (!enabled) {
      hoveredYear.value = null
      if (resizeObserver) {
        resizeObserver.disconnect()
        resizeObserver = null
      }
      return
    }

    nextTick(() => {
      updateSelectorMetrics()
      resizeCanvasToContainer()
      scrollSelectedYearIntoView('auto', { includeFractionalOffset: props.yearScrollMode === 'fractional' })
      queueCanvasDraw()

      const container = selectorContainerRef.value
      if (!container || typeof ResizeObserver === 'undefined')
        return

      if (resizeObserver)
        resizeObserver.disconnect()

      resizeObserver = new ResizeObserver(() => {
        updateSelectorMetrics()
        resizeCanvasToContainer()
        queueCanvasDraw()
      })
      resizeObserver.observe(container)
    })
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (scrollFrameId !== null)
    cancelAnimationFrame(scrollFrameId)
  if (drawFrameId !== null)
    cancelAnimationFrame(drawFrameId)
  if (scrollIdleTimeoutId !== null)
    clearTimeout(scrollIdleTimeoutId)
  if (programmaticSyncTimeoutId !== null)
    clearTimeout(programmaticSyncTimeoutId)
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})
</script>

<template>
  <div :class="props.selectorMode ? 'w-full min-w-0' : 'flex flex-wrap'">
    <template v-if="props.selectorMode">
      <div class="relative h-64 w-full min-w-0">
        <VtdSelectorWheelStepButton
          z-class="z-30"
          direction="up"
          label="Select previous year"
          @click="onSelectorStepClick(-1)"
        />
        <div
          ref="selectorContainerRef"
          class="h-full w-full min-w-0 overflow-y-scroll px-0.5 py-1 focus:outline-none focus-visible:outline-none"
          :class="isUserScrolling ? 'vtd-year-scrolling' : ''"
          role="spinbutton"
          aria-label="Year selector"
          :aria-valuemin="ariaYearMin"
          :aria-valuemax="ariaYearMax"
          :aria-valuenow="ariaYearNow"
          :aria-valuetext="ariaYearText"
          tabindex="0"
          @focus="onSelectorFocus"
          @click="onYearCanvasClick"
          @keydown="onSelectorKeydown"
          @mousemove.passive="onSelectorPointerMove"
          @mouseleave="clearHoveredYear"
          @scroll.passive="onSelectorScroll"
        >
          <div :style="{ height: `${getScrollContentHeight()}px` }" aria-hidden="true" />
        </div>
        <canvas
          ref="selectorCanvasRef"
          class="pointer-events-none absolute inset-0 z-10 block"
          aria-hidden="true"
        />
        <VtdSelectorWheelStepButton
          z-class="z-30"
          direction="down"
          label="Select next year"
          @click="onSelectorStepClick(1)"
        />
        <span class="sr-only" aria-live="polite">{{ yearAriaAnnouncement }}</span>
      </div>
    </template>

    <template v-else>
      <div v-for="(year, key) in years" :key="key" class="w-1/2 px-0.5">
        <span class="flex rounded-md mt-1.5">
          <button
            type="button"
            class="px-3 py-2 block w-full leading-6 rounded-md bg-white text-xs 2xl:text-sm tracking-wide tabular-nums text-vtd-secondary-600 font-medium transition-colors border border-transparent hover:bg-vtd-secondary-100 hover:text-vtd-secondary-900 focus:bg-vtd-primary-50 focus:text-vtd-secondary-900 focus:border-vtd-primary-300 focus:ring-3 focus:ring-vtd-primary-500/10 focus:outline-hidden uppercase dark:bg-vtd-secondary-800 dark:hover:bg-vtd-secondary-700 dark:text-vtd-secondary-300 dark:hover:text-vtd-secondary-100 dark:focus:bg-vtd-secondary-700"
            @click="emit('updateYear', year)"
            v-text="year"
          />
        </span>
      </div>
    </template>
  </div>
</template>
