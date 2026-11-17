// Copyright © 2026 Ignat Remizov

import tailwind from '@tailwindcss/postcss'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import path from 'node:path'
import { after, before, it } from 'node:test'
import { chromium } from 'playwright'
import postcss from 'postcss'

const root = process.cwd()
let browser
let server
let origin
let pickerCss
let hostCss

before(async () => {
  pickerCss = await readFile(path.join(root, 'dist/vue-tailwind-datepicker.css'), 'utf8')
  const host = await postcss([tailwind()]).process(`
    @import "tailwindcss" source(none);
    @plugin "@tailwindcss/forms";
    @plugin "./tailwind-theme.cjs";
    @theme {
      --color-vtd-primary-500: #a020c0;
      --color-vtd-secondary-600: #604020;
      --color-vtd-secondary-800: #201030;
    }
    @source inline("flex flex-col sm:flex-row gap-4 p-4 rounded border");
    :root { --spacing: 0.5rem; }
  `, { from: path.join(root, 'host-fixture.css') })
  hostCss = host.css
  server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url, 'http://localhost')
      if (url.pathname === '/') {
        response.setHeader('Content-Type', 'text/html')
        response.end('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><script type="importmap">{"imports":{"vue":"/node_modules/vue/dist/vue.esm-browser.prod.js"}}</script></head><body></body></html>')
        return
      }
      const file = path.resolve(root, `.${decodeURIComponent(url.pathname)}`)
      if (!file.startsWith(`${root}${path.sep}`)) {
        response.writeHead(403).end()
        return
      }
      response.setHeader('Content-Type', 'text/javascript')
      response.end(await readFile(file))
    } catch {
      response.writeHead(404).end()
    }
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  origin = `http://127.0.0.1:${server.address().port}`
  browser = await chromium.launch()
})

after(async () => {
  await browser?.close()
  await new Promise(resolve => server?.close(resolve))
})

async function hostSnapshot(page) {
  return page.locator('#host').evaluate(element => [
    element,
    ...element.querySelectorAll('*'),
  ].map((node) => {
    const style = getComputedStyle(node)
    return Object.fromEntries([
      'display',
      'flexDirection',
      'padding',
      'margin',
      'border',
      'borderRadius',
      'backgroundColor',
      'color',
      'fontFamily',
      'fontSize',
      'lineHeight',
      'boxSizing',
    ].map(name => [name, style[name]]))
  }))
}

for (const width of [390, 1440]) {
  it(`preserves host and picker styles in either import order at ${width}px`, async () => {
    const pickerSnapshots = new Map()
    for (const order of ['standalone', 'picker-first', 'picker-last']) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } })
      try {
        await page.goto(origin)
        await page.setContent(`
          <section id="host" class="flex flex-col sm:flex-row gap-4 p-4">
            <button>Host button</button><input placeholder="Host input"><select><option>Host select</option></select>
          </section>
          <main id="pickers"></main>
        `)
        // setContent retains the document URL but replaces its import map.
        await page.addScriptTag({ type: 'importmap', content: '{"imports":{"vue":"/node_modules/vue/dist/vue.esm-browser.prod.js"}}' })
        if (order !== 'standalone')
          await page.addStyleTag({ content: hostCss })
        const baseline = await hostSnapshot(page)
        const vendor = await page.addStyleTag({ content: pickerCss })
        if (order === 'picker-first') {
          await vendor.evaluate(style => document.head.prepend(style))
        }
        assert.deepEqual(await hostSnapshot(page), baseline)
        await page.evaluate(async () => {
          const { createApp, h } = await import('vue')
          const { default: Picker } = await import('/dist/vue-tailwind-datepicker.js')
          const common = { noInput: true, shortcuts: false, autoApply: true, formatter: { date: 'YYYY-MM-DD', month: 'MMM' } }
          createApp({
            render: () => h('div', [
              h('section', { id: 'single' }, [h(Picker, { ...common, 'asSingle': true, 'modelValue': '2026-10-15', 'onUpdate:modelValue': value => document.querySelector('#single').dataset.selected = value })]),
              h('section', { id: 'range' }, [h(Picker, { ...common, asSingle: true, useRange: true, modelValue: { startDate: '2026-10-12', endDate: '2026-10-16' } })]),
              h('section', { id: 'selector' }, [h(Picker, { ...common, asSingle: true, selectorMode: true, modelValue: '2026-10-15' })]),
              h('section', { id: 'time' }, [h(Picker, { ...common, asSingle: true, timePickerStyle: 'wheel-inline', modelValue: '2026-10-15 09:30', formatter: { date: 'YYYY-MM-DD HH:mm', month: 'MMM' } })]),
              h('section', { id: 'popover' }, [h(Picker, { asSingle: true, modelValue: '2026-10-15', ...{ formatter: common.formatter } })]),
            ]),
          }).mount('#pickers')
        })
        const day = page.locator('#single [data-date-key="2026-10-17"]')
        await day.waitFor({ state: 'visible' })
        const calendar = await page.locator('#single [data-date-key]').evaluateAll(nodes => nodes.slice(0, 7).map((node) => {
          const { x, y, width, height } = node.getBoundingClientRect()
          return { x, y, width, height }
        }))
        assert.equal(calendar.length, 7)
        assert.ok(calendar.every(cell => cell.width > 20 && cell.height > 20))
        assert.ok(calendar.every(cell => Math.abs(cell.y - calendar[0].y) < 1))
        assert.equal(new Set(calendar.map(cell => Math.round(cell.x))).size, 7)
        if (order !== 'standalone') {
          const unselected = page.locator('#single [data-date-key="2026-10-17"]')
          assert.equal(await unselected.evaluate(node => getComputedStyle(node).color), 'rgb(96, 64, 32)')
          assert.equal(await page.locator('#single .vtd-datepicker-date-selected').evaluate(node => getComputedStyle(node).backgroundColor), 'rgb(160, 32, 192)')
          await page.addStyleTag({ content: '#single { --color-vtd-primary-500: rgb(0, 100, 80); --color-vtd-secondary-600: rgb(80, 40, 100); }' })
          await page.waitForFunction(() =>
            getComputedStyle(document.querySelector('#single [data-date-key="2026-10-17"]')).color === 'rgb(80, 40, 100)'
            && getComputedStyle(document.querySelector('#single .vtd-datepicker-date-selected')).backgroundColor === 'rgb(0, 100, 80)',
          )
        }
        await day.click()
        assert.equal(await page.locator('#single').getAttribute('data-selected'), '2026-10-17')
        assert.ok(await page.locator('#time [aria-label="Hour wheel"]').isVisible())
        await page.locator('#selector #vtd-header-previous-month').click()
        assert.ok(await page.locator('#selector [aria-label="Month selector"]').isVisible())
        await page.locator('#popover input').click()
        assert.ok(await page.locator('#popover .vtd-datepicker').isVisible())
        await page.keyboard.press('Escape')
        // Public theme tokens keep working with either import order.
        await page.addStyleTag({ content: '.vtd-datepicker { --vtd-calendar-day-selected-bg: rgb(120, 20, 180); }' })
        const selected = page.locator('#single .vtd-datepicker-date-selected')
        await page.waitForFunction(() => getComputedStyle(document.querySelector('#single .vtd-datepicker-date-selected')).backgroundColor === 'rgb(120, 20, 180)')
        assert.equal(await selected.evaluate(node => getComputedStyle(node).backgroundColor), 'rgb(120, 20, 180)')
        for (const dark of [false, true]) {
          await page.evaluate(dark => document.documentElement.classList.toggle('dark', dark), dark)
          await page.evaluate(async () => {
            // Flush the theme change before waiting for finite CSS transitions.
            document.body.getBoundingClientRect()
            await Promise.all(document.getAnimations().map(animation => animation.finished.catch(() => {})))
          })
          const background = await page.locator('#single .vtd-datepicker').evaluate(node => getComputedStyle(node).backgroundColor)
          assert.notEqual(background, 'rgba(0, 0, 0, 0)')
          if (order !== 'standalone') {
            if (dark)
              assert.equal(background, 'rgb(32, 16, 48)')
            const key = `${width}-${dark}`
            const snapshot = await page.locator('#pickers').evaluate(element =>
              ['#single .vtd-datepicker', '#single .vtd-datepicker-date-selected', '#popover input', '#time [aria-label="Hour wheel"]'].map((selector) => {
                const node = element.querySelector(selector)
                const style = getComputedStyle(node)
                const { width, height } = node.getBoundingClientRect()
                return { width, height, background: style.backgroundColor, color: style.color, border: style.border, font: style.font, padding: style.padding }
              }),
            )
            if (pickerSnapshots.has(key))
              assert.deepEqual(snapshot, pickerSnapshots.get(key))
            else
              pickerSnapshots.set(key, snapshot)
          }
        }
        assert.deepEqual(await hostSnapshot(page), baseline)
        await vendor.dispose()
      } finally {
        await page.close()
      }
    }
  })
}
