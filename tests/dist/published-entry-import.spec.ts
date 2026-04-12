import path from 'node:path'
import { readFile, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

const testFilePath = fileURLToPath(import.meta.url)
const testDir = path.dirname(testFilePath)
const repoRoot = path.resolve(testDir, '../..')
const packageJsonPath = path.join(repoRoot, 'package.json')
const publishedStylesheetExportPath = './style.css'

async function resolvePublishedStylesheetPath() {
  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'))
  const stylesheetExportTarget = packageJson.exports?.[publishedStylesheetExportPath]

  expect(typeof stylesheetExportTarget).toBe('string')

  const resolvedPath = path.resolve(repoRoot, stylesheetExportTarget)
  const relativeToDist = path.relative(path.join(repoRoot, 'dist'), resolvedPath)

  expect(relativeToDist).not.toBe('')
  expect(relativeToDist.startsWith('..')).toBe(false)
  expect(path.isAbsolute(relativeToDist)).toBe(false)
  expect(path.extname(relativeToDist)).toBe('.css')

  return resolvedPath
}

async function attachPublishedStylesheet() {
  const builtCssPath = await resolvePublishedStylesheetPath()
  const builtCss = await readFile(builtCssPath, 'utf8')
  const styleElement = document.createElement('style')

  styleElement.dataset.testid = 'published-vtd-styles'
  styleElement.textContent = builtCss
  document.head.appendChild(styleElement)

  return { builtCss, styleElement }
}

describe('published entry smoke test', () => {
  it('imports the built package entry without hanging', async () => {
    const mod = await import('../../dist/vue-tailwind-datepicker.js')

    expect(mod).toBeTruthy()
    expect(mod.default).toBeTruthy()
  })

  it('publishes the stylesheet declared in package exports as a non-empty explicit asset', async () => {
    const builtCssPath = await resolvePublishedStylesheetPath()
    const cssStats = await stat(builtCssPath)

    expect(cssStats.isFile()).toBe(true)
    expect(cssStats.size).toBeGreaterThan(0)
  })

  it('keeps month button defaults before focus utilities in the exported built stylesheet', async () => {
    const builtCssPath = await resolvePublishedStylesheetPath()
    const builtCss = await readFile(builtCssPath, 'utf8')
    const defaultMonthColorRule = '.vtd-datepicker .vtd-month-selector-btn-default{color:var(--vtd-selector-month-text,var(--color-vtd-secondary-600))}'
    const focusBackgroundUtilityRule = '.focus\\:bg-vtd-primary-50:focus'
    const focusTextUtilityRule = '.focus\\:text-vtd-secondary-900:focus'

    const defaultMonthColorRuleIndex = builtCss.indexOf(defaultMonthColorRule)
    const focusBackgroundUtilityRuleIndex = builtCss.indexOf(focusBackgroundUtilityRule)
    const focusTextUtilityRuleIndex = builtCss.indexOf(focusTextUtilityRule)

    expect(defaultMonthColorRuleIndex).toBeGreaterThan(-1)
    expect(focusBackgroundUtilityRuleIndex).toBeGreaterThan(-1)
    expect(focusTextUtilityRuleIndex).toBeGreaterThan(-1)
    expect(defaultMonthColorRuleIndex).toBeLessThan(focusBackgroundUtilityRuleIndex)
    expect(defaultMonthColorRuleIndex).toBeLessThan(focusTextUtilityRuleIndex)
  })

  it('keeps visible keyboard focus for packaged month selector buttons when the published stylesheet is applied', async () => {
    vi.useFakeTimers()

    const { builtCss, styleElement } = await attachPublishedStylesheet()

    try {
      const mod = await import('../../dist/vue-tailwind-datepicker.js')
      const VueTailwindDatePicker = mod.default

      const wrapper = mount(VueTailwindDatePicker, {
        attachTo: document.body,
        props: {
          noInput: true,
          selectorMode: true,
          useRange: false,
          asSingle: true,
          shortcuts: false,
          autoApply: true,
          modelValue: '2025-01-15 00:00:00',
        },
      })

      try {
        vi.advanceTimersByTime(260)
        await nextTick()
        await wrapper.get('#vtd-header-previous-month').trigger('click')
        await nextTick()

        const monthSelector = wrapper.get('[aria-label="Month selector"]')
        expect(monthSelector.attributes('role')).toBe('listbox')
        expect(monthSelector.attributes('tabindex')).toBe('0')

        const monthButton = wrapper.get(
          '[aria-label="Month selector"] button[aria-selected="false"]',
        )
        expect(monthButton.attributes('role')).toBe('option')
        expect(monthButton.attributes('tabindex')).toBe('-1')
        expect(monthButton.classes()).toContain('vtd-month-selector-btn')
        expect(monthButton.classes()).toContain('vtd-month-selector-btn-default')
        expect(monthButton.classes()).toContain('focus:bg-vtd-primary-50')
        expect(monthButton.classes()).toContain('focus:text-vtd-secondary-900')
        expect(monthButton.classes()).toContain('focus:border-vtd-primary-300')

        expect(builtCss.includes('.focus\\:bg-vtd-primary-50:focus')).toBe(true)
        expect(builtCss.includes('.focus\\:text-vtd-secondary-900:focus')).toBe(true)
        expect(builtCss.includes('.focus\\:border-vtd-primary-300:focus')).toBe(true)
        expect(
          builtCss.includes('.vtd-datepicker [role=listbox] button[aria-selected]:focus-visible'),
        ).toBe(true)

        monthButton.element.focus()
        await nextTick()

        expect(document.activeElement).toBe(monthButton.element)
        expect(monthButton.element.matches(':focus')).toBe(true)
      }
      finally {
        wrapper.unmount()
      }
    }
    finally {
      styleElement.remove()
      vi.useRealTimers()
    }
  })
})
