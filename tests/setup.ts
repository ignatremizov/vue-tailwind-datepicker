import { afterEach } from 'vitest'

function createMockRect() {
  return {
    x: 0,
    y: 0,
    width: 100,
    height: 40,
    top: 0,
    right: 100,
    bottom: 40,
    left: 0,
    toJSON: () => ({}),
  }
}

if (typeof window !== 'undefined' && !window.requestAnimationFrame) {
  window.requestAnimationFrame = callback => window.setTimeout(() => callback(performance.now()), 0)
  window.cancelAnimationFrame = handle => window.clearTimeout(handle)
}

Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
  configurable: true,
  writable: true,
  value(optionsOrX?: ScrollToOptions | number, y?: number) {
    if (typeof optionsOrX === 'number') {
      this.scrollLeft = optionsOrX
      this.scrollTop = typeof y === 'number' ? y : this.scrollTop
      return
    }

    if (optionsOrX && typeof optionsOrX === 'object') {
      if (typeof optionsOrX.left === 'number')
        this.scrollLeft = optionsOrX.left
      if (typeof optionsOrX.top === 'number')
        this.scrollTop = optionsOrX.top
    }
  },
})

Object.defineProperty(HTMLElement.prototype, 'getClientRects', {
  configurable: true,
  writable: true,
  value(this: HTMLElement) {
    const style = window.getComputedStyle(this)

    if (!style || style.display === 'none' || style.visibility === 'hidden')
      return [] as unknown as DOMRectList

    return [createMockRect()] as unknown as DOMRectList
  },
})

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  configurable: true,
  writable: true,
  value() {
    return {
      setTransform: () => {},
      clearRect: () => {},
      beginPath: () => {},
      moveTo: () => {},
      arcTo: () => {},
      closePath: () => {},
      stroke: () => {},
      save: () => {},
      restore: () => {},
      arc: () => {},
      translate: () => {},
      rotate: () => {},
      fill: () => {},
      fillText: () => {},
      measureText: () => ({
        width: 12,
        actualBoundingBoxAscent: 8,
        actualBoundingBoxDescent: 3,
      }),
      textAlign: 'center',
      font: '500 14px sans-serif',
      textBaseline: 'alphabetic',
      lineWidth: 1,
      strokeStyle: '#000',
      fillStyle: '#000',
    }
  },
})

afterEach(() => {
  document.body.innerHTML = ''
})
