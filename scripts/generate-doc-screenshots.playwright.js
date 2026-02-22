async (page) => {
  const browser = page.context().browser()
  if (!browser)
    throw new Error('Browser instance is unavailable for screenshot capture.')

  const baseUrl = page.url().startsWith('http') ? page.url() : 'http://127.0.0.1:4180/'
  const viewportWidth = Number.parseInt('__DOC_SCREENSHOT_VIEWPORT_WIDTH__', 10)
  const viewportHeight = Number.parseInt('__DOC_SCREENSHOT_VIEWPORT_HEIGHT__', 10)
  const deviceScaleFactor = Number.parseFloat('__DOC_SCREENSHOT_DEVICE_SCALE__')
  const pageZoom = Number.parseFloat('__DOC_SCREENSHOT_ZOOM__')

  const screenshotContext = await browser.newContext({
    viewport: { width: viewportWidth, height: viewportHeight },
    deviceScaleFactor,
    reducedMotion: 'no-preference',
  })
  page = await screenshotContext.newPage()
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  if (Number.isFinite(pageZoom) && pageZoom > 0 && pageZoom !== 1) {
    await page.evaluate((zoom) => {
      document.documentElement.style.zoom = String(zoom)
    }, pageZoom)
    await page.waitForTimeout(180)
  }

  const getCard = () =>
    page.locator('div.rounded-lg').filter({ hasText: 'All-features playground' }).first()
  await getCard().scrollIntoViewIfNeeded()

  async function clickLocale(code) {
    const localeRow = page.locator('div').filter({ hasText: 'Choose one locale' }).first()
    const button = localeRow.locator('button').filter({ hasText: code.toUpperCase() }).first()
    if (await button.count()) {
      await button.click()
      await page.waitForTimeout(120)
    }
  }

  async function setSelect(labelText, value) {
    const card = getCard()
    const label = card.locator('label').filter({ hasText: labelText }).first()
    const select = label.locator('select').first()
    if ((await select.count()) && (await select.isEnabled())) {
      await select.selectOption(value)
      await page.waitForTimeout(120)
    }
  }

  async function setCheckbox(labelText, checked) {
    const card = getCard()
    const label = card.locator('label').filter({ hasText: labelText }).first()
    const checkbox = label.locator('input[type="checkbox"]').first()
    if ((await checkbox.count()) && (await checkbox.isEnabled())) {
      await checkbox.setChecked(checked)
      await page.waitForTimeout(80)
    }
  }

  async function resetAllFeaturesRangeInput(seedValue) {
    const card = getCard()
    const input = card.locator('input[type="text"]').first()
    // Keep each scenario deterministic and avoid state carry-over from
    // previous captures (for example astronomical year selector screenshots).
    await input.click({ force: true })
    await input.fill(seedValue)
    await page.waitForTimeout(120)
  }

  async function setRangeLayout(layout) {
    const card = getCard()
    const targetText = layout === 'single' ? 'Single page' : 'Double page'
    const label = card.locator('label').filter({ hasText: targetText }).first()
    const radio = label.locator('input[type="radio"]').first()
    if (await radio.count()) {
      await radio.check({ force: true })
      await page.waitForTimeout(120)
    }
  }

  async function closePickerIfOpen() {
    const openPicker = page.locator('.vtd-datepicker:visible').first()
    if (await openPicker.count()) {
      await page.keyboard.press('Escape')
      await page.waitForTimeout(220)
    }
  }

  async function openPicker() {
    const card = getCard()
    const input = card.locator('input[type="text"]').first()
    await input.click({ force: true })
    await page.waitForTimeout(320)
    let picker = page.locator('.vtd-datepicker:visible').first()
    if (!(await picker.count())) {
      await input.click({ force: true })
      await page.waitForTimeout(320)
      picker = page.locator('.vtd-datepicker:visible').first()
    }
    return picker
  }

  async function ensureCalendarView(picker) {
    const switchToCalendar = picker
      .locator('button.away-cancel-picker')
      .filter({ hasText: /^Calendar$/ })
      .first()
    if (await switchToCalendar.count()) {
      await switchToCalendar.click()
      await page.waitForTimeout(300)
    }
  }

  async function ensureTimeView(picker) {
    const switchToTime = picker
      .locator('button.away-cancel-picker')
      .filter({ hasText: /^Time$/ })
      .first()
    if (await switchToTime.count()) {
      await switchToTime.click()
      await page.waitForTimeout(320)
    }
  }

  async function moveYearSelectorToBottomEdge(picker) {
    const yearSelector = picker.locator('[aria-label="Year selector"]').first()
    if (!(await yearSelector.count()))
      return

    const pinToBottomEdge = async () => {
      await yearSelector.evaluate(async (element) => {
        const guardRows = 140
        const nearBottomOffset = 0.25
        const computedStyles = getComputedStyle(element)
        const rowHeight
          = Number.parseFloat(
            computedStyles.getPropertyValue('--vtd-selector-wheel-cell-height') || '',
          ) || 44
        const paddingTop = Number.parseFloat(computedStyles.paddingTop || '0') || 0
        const minYear = Number.parseInt(element.getAttribute('aria-valuemin') || '0', 10)
        const maxYear = Number.parseInt(element.getAttribute('aria-valuemax') || '0', 10)
        const yearCount
          = Number.isFinite(minYear) && Number.isFinite(maxYear)
            ? Math.max(1, maxYear - minYear + 1)
            : 401
        const targetIndexFloat = Math.max(0, yearCount - 1 - nearBottomOffset)
        const target
          = paddingTop
            + (targetIndexFloat + guardRows) * rowHeight
            - element.clientHeight / 2
            + rowHeight / 2
        element.scrollTop = target
        element.dispatchEvent(new Event('scroll', { bubbles: true }))
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      })
    }

    await pinToBottomEdge()
    await page.waitForTimeout(40)
    await pinToBottomEdge()
  }

  const base = {
    locale: 'en',
    shortcutsMode: 'custom',
    selectorStyle: 'wheel',
    yearMode: 'historical',
    timeStyle: 'wheel-page',
    wheelMode: 'fractional',
    timeFormat: 'hh:mm:ss A',
    inlinePos: 'below',
    pageMode: 'toggle',
    rangeLayout: 'single',
    weekend: true,
    directYear: true,
    closeOnRange: false,
  }

  async function applySettings(
    overrides = {},
    seedRangeValue = '2026-02-15 09:45:00 AM ~ 2026-02-25 05:30:00 PM',
  ) {
    const s = { ...base, ...overrides }
    await clickLocale(s.locale)
    await setSelect('Shortcuts panel mode', s.shortcutsMode)
    await setSelect('Month/year selector style', s.selectorStyle)
    await setCheckbox('Direct year input', s.directYear)
    await setSelect('Year numbering mode', s.yearMode)
    await setSelect('Time picker style', s.timeStyle)
    await setSelect('Wheel scroll mode (selector + time)', s.wheelMode)
    await setSelect('Time wheel format', s.timeFormat)
    await setSelect('Wheel-inline position', s.inlinePos)
    await setSelect('Page mode', s.pageMode)
    await setRangeLayout(s.rangeLayout)
    await setCheckbox('Weekend red styling', s.weekend)
    await setCheckbox('Auto-close after selecting range end', s.closeOnRange)
    await resetAllFeaturesRangeInput(seedRangeValue)
    await page.waitForTimeout(260)
  }

  async function triggerAfterDateAutoSwitch(picker) {
    const dateButtons = picker.locator('.vtd-calendar .vtd-datepicker-date:not(:disabled)')
    const count = await dateButtons.count()
    if (count < 18)
      return

    // Pick a deterministic in-month range so page-mode "after-date" opens the
    // time panel via normal selection flow (instead of using the Time button).
    await dateButtons.nth(10).click()
    await page.waitForTimeout(140)
    await dateButtons.nth(17).click()
    await page.waitForTimeout(340)
  }

  async function capture(name, opts = {}) {
    await closePickerIfOpen()
    let picker = await openPicker()

    await ensureCalendarView(picker)

    if (opts.view === 'time') {
      if (opts.autoSwitchAfterDate) {
        await triggerAfterDateAutoSwitch(picker)
        const hourWheel = picker.locator('[aria-label="Hour wheel"]').first()
        if (!(await hourWheel.count()))
          await ensureTimeView(picker)
      } else {
        await ensureTimeView(picker)
      }
    } else if (opts.view === 'selector') {
      const header = picker.locator('#vtd-header-previous-month').first()
      if (await header.count()) {
        await header.click()
        await page.waitForTimeout(280)
      }

      if (opts.selectorBottomEdgeClock)
        await moveYearSelectorToBottomEdge(picker)
    }

    if (opts.view === 'selector' && opts.yearValue === 0) {
      const yearSelector = picker.locator('[aria-label="Year selector"]').first()
      await yearSelector.focus()
      await yearSelector.press('0')
      await yearSelector.press('0')
      await yearSelector.press('0')
      await yearSelector.press('0')
      await page.waitForTimeout(350)
    }

    const pickerFile = `docs/assets/screenshots/all-features-${name}.png`
    if (opts.selectorBottomEdgeClock) {
      // Capture immediately after edge positioning before parent re-anchor
      // can recenter the year wheel.
      await page.waitForTimeout(1)
      await picker.screenshot({ path: pickerFile })
    } else {
      await picker.scrollIntoViewIfNeeded()
      const pickerBox = await picker.boundingBox()
      if (pickerBox) {
        const currentViewport = page.viewportSize()
        const requiredWidth = Math.ceil(pickerBox.x + pickerBox.width + 24)
        if (currentViewport && requiredWidth > currentViewport.width) {
          await page.setViewportSize({
            width: requiredWidth,
            height: currentViewport.height,
          })
          await page.waitForTimeout(160)
          picker = page.locator('.vtd-datepicker:visible').first()
          await picker.scrollIntoViewIfNeeded()
        }
      }

      await page.waitForTimeout(120)
      await picker.screenshot({ path: pickerFile })
    }

    const cardForWidth = getCard()
    const cardBox = await cardForWidth.boundingBox()
    if (cardBox) {
      const currentViewport = page.viewportSize()
      const requiredWidth = Math.ceil(cardBox.x + cardBox.width + 24)
      if (currentViewport && requiredWidth > currentViewport.width) {
        await page.setViewportSize({
          width: requiredWidth,
          height: currentViewport.height,
        })
        await page.waitForTimeout(160)
      }
    }
    const cardForCapture = getCard()
    await cardForCapture.scrollIntoViewIfNeeded()
    await page.waitForTimeout(80)
    const contextFile = `docs/assets/screenshots/context/all-features-${name}-context.png`
    await cardForCapture.screenshot({ path: contextFile })

    return {
      picker: pickerFile,
      context: contextFile,
    }
  }

  const scenarios = [
    { name: 'wheel-page-single-calendar', settings: {}, view: 'calendar' },
    { name: 'wheel-page-single-selector', settings: {}, view: 'selector' },
    { name: 'wheel-page-single-time', settings: {}, view: 'time' },
    {
      name: 'wheel-page-single-time-after-date',
      settings: { pageMode: 'after-date' },
      seedRangeValue: '2026-02-12 11:11:11 AM ~ 2026-02-20 02:22:22 PM',
      autoSwitchAfterDate: true,
      view: 'time',
    },
    { name: 'wheel-page-dual-calendar', settings: { rangeLayout: 'double' }, view: 'calendar' },
    { name: 'wheel-page-dual-time', settings: { rangeLayout: 'double' }, view: 'time' },
    {
      name: 'wheel-inline-below-single',
      settings: { timeStyle: 'wheel-inline', inlinePos: 'below' },
      view: 'calendar',
    },
    {
      name: 'wheel-inline-below-dual',
      settings: { timeStyle: 'wheel-inline', inlinePos: 'below', rangeLayout: 'double' },
      view: 'calendar',
    },
    {
      name: 'wheel-inline-right-single',
      settings: { timeStyle: 'wheel-inline', inlinePos: 'right' },
      view: 'calendar',
    },
    {
      name: 'wheel-inline-right-dual',
      settings: { timeStyle: 'wheel-inline', inlinePos: 'right', rangeLayout: 'double' },
      view: 'calendar',
    },
    { name: 'time-input-single', settings: { timeStyle: 'input' }, view: 'calendar' },
    { name: 'time-none-single', settings: { timeStyle: 'none' }, view: 'calendar' },
    {
      name: 'selector-page-calendar',
      settings: { selectorStyle: 'page', timeStyle: 'none' },
      view: 'calendar',
    },
    {
      name: 'selector-page-month-view',
      settings: { selectorStyle: 'page', timeStyle: 'none' },
      view: 'selector',
    },
    { name: 'shortcuts-off', settings: { shortcutsMode: 'off' }, view: 'calendar' },
    { name: 'shortcuts-modern-preset', settings: { shortcutsMode: 'preset' }, view: 'calendar' },
    { name: 'shortcuts-legacy-preset', settings: { shortcutsMode: 'legacy' }, view: 'calendar' },
    {
      name: 'shortcuts-off-dual-page-below',
      settings: {
        shortcutsMode: 'off',
        rangeLayout: 'double',
        timeStyle: 'wheel-page',
        inlinePos: 'below',
      },
      view: 'calendar',
    },
    {
      name: 'shortcuts-off-dual-input-below',
      settings: {
        shortcutsMode: 'off',
        rangeLayout: 'double',
        timeStyle: 'input',
        inlinePos: 'below',
      },
      view: 'calendar',
    },
    {
      name: 'shortcuts-off-dual-inline-below',
      settings: {
        shortcutsMode: 'off',
        rangeLayout: 'double',
        timeStyle: 'wheel-inline',
        inlinePos: 'below',
      },
      view: 'calendar',
    },
    {
      name: 'shortcuts-legacy-dual-page-below',
      settings: {
        shortcutsMode: 'legacy',
        rangeLayout: 'double',
        timeStyle: 'wheel-page',
        inlinePos: 'below',
      },
      view: 'calendar',
    },
    {
      name: 'shortcuts-legacy-dual-input-below',
      settings: {
        shortcutsMode: 'legacy',
        rangeLayout: 'double',
        timeStyle: 'input',
        inlinePos: 'below',
      },
      view: 'calendar',
    },
    {
      name: 'shortcuts-legacy-dual-inline-below',
      settings: {
        shortcutsMode: 'legacy',
        rangeLayout: 'double',
        timeStyle: 'wheel-inline',
        inlinePos: 'below',
      },
      view: 'calendar',
    },
    {
      name: 'shortcuts-modern-dual-page-below',
      settings: {
        shortcutsMode: 'preset',
        rangeLayout: 'double',
        timeStyle: 'wheel-page',
        inlinePos: 'below',
      },
      view: 'calendar',
    },
    {
      name: 'shortcuts-modern-dual-input-below',
      settings: {
        shortcutsMode: 'preset',
        rangeLayout: 'double',
        timeStyle: 'input',
        inlinePos: 'below',
      },
      view: 'calendar',
    },
    {
      name: 'shortcuts-modern-dual-inline-below',
      settings: {
        shortcutsMode: 'preset',
        rangeLayout: 'double',
        timeStyle: 'wheel-inline',
        inlinePos: 'below',
      },
      view: 'calendar',
    },
    { name: 'weekend-styling-off', settings: { weekend: false }, view: 'calendar' },
    { name: 'direct-year-input-off-selector', settings: { directYear: false }, view: 'selector' },
    {
      name: 'year-astronomical-selector',
      settings: { yearMode: 'astronomical', timeStyle: 'none' },
      view: 'selector',
      yearValue: 0,
    },
    {
      name: 'wheel-scroll-boundary-selector',
      settings: { wheelMode: 'boundary' },
      view: 'selector',
    },
    {
      name: 'selector-year-bottom-edge-clock',
      settings: { selectorStyle: 'wheel', timeStyle: 'none' },
      view: 'selector',
      selectorBottomEdgeClock: true,
    },
    { name: 'locale-de-calendar', settings: { locale: 'de' }, view: 'calendar' },
    { name: 'format-hh-mm-time', settings: { timeFormat: 'HH:mm' }, view: 'time' },
    { name: 'format-hh-mm-a-time', settings: { timeFormat: 'hh:mm A' }, view: 'time' },
    { name: 'format-hh-mm-ss-time', settings: { timeFormat: 'HH:mm:ss' }, view: 'time' },
    { name: 'format-hh-mm-ss-a-time', settings: { timeFormat: 'hh:mm:ss A' }, view: 'time' },
  ]

  const saved = []
  for (const scenario of scenarios) {
    await applySettings(scenario.settings, scenario.seedRangeValue)
    const files = await capture(scenario.name, {
      view: scenario.view,
      yearValue: scenario.yearValue,
      autoSwitchAfterDate: !!scenario.autoSwitchAfterDate,
      selectorBottomEdgeClock: !!scenario.selectorBottomEdgeClock,
    })
    saved.push(files)
  }

  await closePickerIfOpen()
  const result = {
    total: saved.length,
    pickerFiles: saved.map(item => item.picker),
    contextFiles: saved.map(item => item.context),
  }
  await screenshotContext.close()
  return result
}
