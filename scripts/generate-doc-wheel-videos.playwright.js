async (page) => {
  const browser = page.context().browser()
  if (!browser)
    throw new Error('Browser instance is unavailable for video recording.')

  const baseUrl = page.url().startsWith('http') ? page.url() : 'http://127.0.0.1:5173/'
  const recordDir = '/tmp/vtd-doc-video-recordings'

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

  async function withRecordedScenario(name, run) {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      reducedMotion: 'no-preference',
      recordVideo: {
        dir: recordDir,
        size: { width: 1280, height: 900 },
      },
    })
    const scenarioPage = await context.newPage()
    await scenarioPage.goto(baseUrl, { waitUntil: 'domcontentloaded' })
    await scenarioPage.waitForTimeout(220)
    const video = scenarioPage.video()
    const details = await run(scenarioPage)
    await scenarioPage.waitForTimeout(320)
    await scenarioPage.close()
    await context.close()
    const path = video ? await video.path() : null
    return { name, path, ...details }
  }

  async function clickLocale(scenarioPage, code) {
    const localeRow = scenarioPage.locator('div').filter({ hasText: 'Choose one locale' }).first()
    const button = localeRow.locator('button').filter({ hasText: code.toUpperCase() }).first()
    if (await button.count()) {
      await button.click({ force: true })
      await scenarioPage.waitForTimeout(120)
    }
  }

  async function setSelect(scenarioPage, card, labelText, value) {
    const label = card.locator('label').filter({ hasText: labelText }).first()
    const select = label.locator('select').first()
    if (!(await select.count()) || !(await select.isEnabled()))
      return false
    await select.selectOption(value)
    await scenarioPage.waitForTimeout(120)
    return true
  }

  async function getSelectValue(card, labelText) {
    const label = card.locator('label').filter({ hasText: labelText }).first()
    const select = label.locator('select').first()
    if (!(await select.count()))
      return null
    return await select.inputValue()
  }

  async function setCheckbox(scenarioPage, card, labelText, checked) {
    const label = card.locator('label').filter({ hasText: labelText }).first()
    const checkbox = label.locator('input[type="checkbox"]').first()
    if ((await checkbox.count()) && (await checkbox.isEnabled())) {
      await checkbox.setChecked(checked)
      await scenarioPage.waitForTimeout(80)
    }
  }

  async function setRangeLayout(scenarioPage, card, layout) {
    const targetText = layout === 'single' ? 'Single page' : 'Double page'
    const label = card.locator('label').filter({ hasText: targetText }).first()
    const radio = label.locator('input[type="radio"]').first()
    if (await radio.count()) {
      await radio.check({ force: true })
      await scenarioPage.waitForTimeout(120)
    }
  }

  async function resetAllFeaturesRangeInput(scenarioPage, card, seedValue) {
    const input = card.locator('input[type="text"]').first()
    await input.click({ force: true })
    await input.fill(seedValue)
    await scenarioPage.waitForTimeout(120)
  }

  async function applySettings(
    scenarioPage,
    card,
    overrides = {},
    seedRangeValue = '2026-02-15 09:45:00 AM ~ 2026-02-25 05:30:00 PM',
  ) {
    const s = { ...base, ...overrides }
    await clickLocale(scenarioPage, s.locale)
    await setSelect(scenarioPage, card, 'Shortcuts panel mode', s.shortcutsMode)
    await setSelect(scenarioPage, card, 'Month/year selector style', s.selectorStyle)
    await setCheckbox(scenarioPage, card, 'Direct year input', s.directYear)
    await setSelect(scenarioPage, card, 'Year numbering mode', s.yearMode)

    let wheelModeApplied = await setSelect(
      scenarioPage,
      card,
      'Wheel scroll mode (selector + time)',
      s.wheelMode,
    )
    if (!wheelModeApplied) {
      await setSelect(scenarioPage, card, 'Time picker style', 'wheel-page')
      wheelModeApplied = await setSelect(
        scenarioPage,
        card,
        'Wheel scroll mode (selector + time)',
        s.wheelMode,
      )
    }
    await setSelect(scenarioPage, card, 'Time picker style', s.timeStyle)
    await setSelect(scenarioPage, card, 'Time wheel format', s.timeFormat)
    await setSelect(scenarioPage, card, 'Wheel-inline position', s.inlinePos)
    await setSelect(scenarioPage, card, 'Page mode', s.pageMode)
    await setRangeLayout(scenarioPage, card, s.rangeLayout)
    await setCheckbox(scenarioPage, card, 'Weekend red styling', s.weekend)
    await setCheckbox(scenarioPage, card, 'Auto-close after selecting range end', s.closeOnRange)
    await resetAllFeaturesRangeInput(scenarioPage, card, seedRangeValue)
    await scenarioPage.waitForTimeout(220)

    const appliedWheelMode = await getSelectValue(card, 'Wheel scroll mode (selector + time)')
    if (!wheelModeApplied)
      throw new Error(`Wheel scroll mode control unavailable for value=${s.wheelMode}`)
    if (appliedWheelMode !== s.wheelMode) {
      throw new Error(
        `Wheel scroll mode mismatch: expected=${s.wheelMode} actual=${appliedWheelMode ?? 'null'}`,
      )
    }

    return { appliedWheelMode }
  }

  async function openPicker(scenarioPage, card) {
    const input = card.locator('input[type="text"]').first()
    await input.click({ force: true })
    await scenarioPage.waitForTimeout(320)
    return scenarioPage.locator('.vtd-datepicker:visible').first()
  }

  async function ensureTimeView(scenarioPage, picker) {
    const switchToTime = picker
      .locator('button.away-cancel-picker:visible')
      .filter({ hasText: /^Time$/ })
      .last()
    if (await switchToTime.count()) {
      await switchToTime.click({ force: true })
      await scenarioPage.waitForTimeout(320)
    }
  }

  async function ensureStartEndpointActive(scenarioPage, picker) {
    const startButton = picker
      .locator('button')
      .filter({ hasText: /^Start$/ })
      .first()
    if (!(await startButton.count()))
      return

    const startClass = (await startButton.getAttribute('class')) || ''
    if (startClass.includes('bg-vtd-primary-600'))
      return

    await startButton.click({ force: true })
    await scenarioPage.waitForTimeout(220)
  }

  async function ensureSelectorView(scenarioPage, picker) {
    const monthWheel = picker.locator('[aria-label="Month selector"]').first()
    if (await monthWheel.count())
      return

    const toggle = picker.locator('#vtd-header-previous-month').first()
    if (await toggle.count()) {
      await toggle.click({ force: true })
      await scenarioPage.waitForTimeout(320)
    }
  }

  async function smoothWheelDrift(scenarioPage, wheel, steps, deltaY, intervalMs) {
    await wheel.hover()
    for (let index = 0; index < steps; index += 1) {
      await wheel.evaluate((el, delta) => {
        el.scrollTop += delta
      }, deltaY)
      await scenarioPage.waitForTimeout(intervalMs)
    }
  }

  async function wheelGestureFlick(scenarioPage, wheel, deltas, intervalMs = 24) {
    await wheel.hover()
    const box = await wheel.boundingBox()
    if (!box)
      throw new Error('Unable to resolve wheel bounding box for gesture capture.')
    await scenarioPage.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    for (const delta of deltas) {
      await scenarioPage.mouse.wheel(0, delta)
      await scenarioPage.waitForTimeout(intervalMs)
    }
  }

  async function selectedWheelText(wheel) {
    const selected = wheel.locator('[role="option"][aria-selected="true"]').first()
    const text = (await selected.textContent()) || ''
    return text.trim()
  }

  async function measureSelectedOffsetRows(wheel) {
    return await wheel.evaluate((element) => {
      const selected = element.querySelector('[role="option"][aria-selected="true"]')
      if (!(selected instanceof HTMLElement))
        return null
      const selectedRect = selected.getBoundingClientRect()
      const wheelRect = element.getBoundingClientRect()
      const rowHeight = selectedRect.height || 1
      const selectedCenter = selectedRect.top + selectedRect.height / 2
      const wheelCenter = wheelRect.top + wheelRect.height / 2
      return (selectedCenter - wheelCenter) / rowHeight
    })
  }

  async function measureWheelCenterFractionalPart(wheel, fallbackRowHeight = 40) {
    return await wheel.evaluate((element, fallback) => {
      const styles = getComputedStyle(element)
      const paddingTop = Number.parseFloat(styles.paddingTop || '0') || 0
      const cssRowHeight = Number.parseFloat(
        styles.getPropertyValue('--vtd-selector-wheel-cell-height') || '',
      )
      const rowHeight = Number.isFinite(cssRowHeight) && cssRowHeight > 0 ? cssRowHeight : fallback
      const centeredIndexFloat
        = (element.scrollTop - paddingTop + element.clientHeight / 2 - rowHeight / 2) / rowHeight
      return Math.abs(centeredIndexFloat - Math.round(centeredIndexFloat))
    }, fallbackRowHeight)
  }

  const captures = []

  captures.push(
    await withRecordedScenario('time-wheel-boundary-noon-flip', async (scenarioPage) => {
      const card = scenarioPage
        .locator('div.rounded-lg')
        .filter({ hasText: 'All-features playground' })
        .first()
      await card.scrollIntoViewIfNeeded()
      const settings = await applySettings(
        scenarioPage,
        card,
        {
          selectorStyle: 'wheel',
          timeStyle: 'wheel-page',
          wheelMode: 'boundary',
          timeFormat: 'hh:mm:ss A',
        },
        '2026-02-15 11:59:57 AM ~ 2026-02-15 11:59:57 AM',
      )
      const picker = await openPicker(scenarioPage, card)
      await ensureTimeView(scenarioPage, picker)
      await ensureStartEndpointActive(scenarioPage, picker)
      const secondWheel = picker.locator('[aria-label="Second wheel"]').first()
      const minuteWheel = picker.locator('[aria-label="Minute wheel"]').first()
      const hourWheel = picker.locator('[aria-label="Hour wheel"]').first()
      const dayPeriodWheel = picker.locator('[aria-label="Meridiem wheel"]').first()
      const startSecondText = await selectedWheelText(secondWheel)
      const startMinuteText = await selectedWheelText(minuteWheel)
      const startHourText = await selectedWheelText(hourWheel)
      const startDayPeriodText = await selectedWheelText(dayPeriodWheel)
      if (
        startSecondText !== '57'
        || startMinuteText !== '59'
        || startHourText !== '11'
        || startDayPeriodText !== 'AM'
      ) {
        throw new Error(
          `Boundary seed mismatch: hour=${startHourText} minute=${startMinuteText} `
          + `second=${startSecondText} dayPeriod=${startDayPeriodText}`,
        )
      }
      await secondWheel.focus()
      await scenarioPage.waitForTimeout(180)
      await smoothWheelDrift(scenarioPage, secondWheel, 78, 2.2, 18)
      await scenarioPage.waitForTimeout(220)
      const minuteSelectedOffsetRows = await measureSelectedOffsetRows(minuteWheel)
      return {
        appliedWheelMode: settings.appliedWheelMode,
        minuteSelectedOffsetRows,
      }
    }),
  )

  captures.push(
    await withRecordedScenario('time-wheel-fractional-noon-flip', async (scenarioPage) => {
      const card = scenarioPage
        .locator('div.rounded-lg')
        .filter({ hasText: 'All-features playground' })
        .first()
      await card.scrollIntoViewIfNeeded()
      const settings = await applySettings(
        scenarioPage,
        card,
        {
          selectorStyle: 'wheel',
          timeStyle: 'wheel-page',
          wheelMode: 'fractional',
          timeFormat: 'hh:mm:ss A',
        },
        '2026-02-15 11:59:52 AM ~ 2026-02-15 11:59:52 AM',
      )
      const picker = await openPicker(scenarioPage, card)
      await ensureTimeView(scenarioPage, picker)
      await ensureStartEndpointActive(scenarioPage, picker)
      const secondWheel = picker.locator('[aria-label="Second wheel"]').first()
      const minuteWheel = picker.locator('[aria-label="Minute wheel"]').first()
      const hourWheel = picker.locator('[aria-label="Hour wheel"]').first()
      const dayPeriodWheel = picker.locator('[aria-label="Meridiem wheel"]').first()
      const startSecondText = await selectedWheelText(secondWheel)
      const startMinuteText = await selectedWheelText(minuteWheel)
      const startHourText = await selectedWheelText(hourWheel)
      const startDayPeriodText = await selectedWheelText(dayPeriodWheel)
      if (
        startSecondText !== '52'
        || startMinuteText !== '59'
        || startHourText !== '11'
        || startDayPeriodText !== 'AM'
      ) {
        throw new Error(
          `Fractional seed mismatch: hour=${startHourText} minute=${startMinuteText} `
          + `second=${startSecondText} dayPeriod=${startDayPeriodText}`,
        )
      }

      // Phase 1: slow, readable noon-boundary rollover in fractional mode.
      await secondWheel.focus()
      await scenarioPage.waitForTimeout(420)
      for (let index = 0; index < 10; index += 1) {
        await scenarioPage.keyboard.press('ArrowDown')
        await scenarioPage.waitForTimeout(420)
      }
      await scenarioPage.waitForTimeout(420)
      const boundaryHourText = await selectedWheelText(hourWheel)
      const boundaryDayPeriodText = await selectedWheelText(dayPeriodWheel)
      if (boundaryHourText === startHourText && boundaryDayPeriodText === startDayPeriodText)
        throw new Error('Fractional boundary step did not advance hour/day-period as expected.')

      // Phase 2: continue with aggressive flicks on seconds and minutes so the
      // clip demonstrates cross-wheel carry behavior under heavier interaction.
      await scenarioPage.waitForTimeout(420)
      await wheelGestureFlick(
        scenarioPage,
        secondWheel,
        [130, 120, 135, 125, 140, 130, 120, 135, 125, 130],
        72,
      )
      await minuteWheel.focus()
      await scenarioPage.waitForTimeout(240)
      await wheelGestureFlick(
        scenarioPage,
        minuteWheel,
        [125, 135, 120, 130, 140, 125, 135, 120],
        72,
      )
      await scenarioPage.waitForTimeout(320)
      const minuteSelectedOffsetRows = await measureSelectedOffsetRows(minuteWheel)
      const endMinuteText = await selectedWheelText(minuteWheel)
      if (endMinuteText === startMinuteText)
        throw new Error('Fractional aggressive scroll did not change minute selection.')
      return {
        appliedWheelMode: settings.appliedWheelMode,
        minuteSelectedOffsetRows,
      }
    }),
  )

  captures.push(
    await withRecordedScenario('selector-wheel-boundary-year-rollover', async (scenarioPage) => {
      const card = scenarioPage
        .locator('div.rounded-lg')
        .filter({ hasText: 'All-features playground' })
        .first()
      await card.scrollIntoViewIfNeeded()
      const settings = await applySettings(
        scenarioPage,
        card,
        {
          selectorStyle: 'wheel',
          timeStyle: 'none',
          wheelMode: 'boundary',
        },
        '2026-12-15 09:45:00 AM ~ 2026-12-25 05:30:00 PM',
      )
      const picker = await openPicker(scenarioPage, card)
      await ensureSelectorView(scenarioPage, picker)
      const monthWheel = picker.locator('[aria-label="Month selector"]').first()
      const yearWheel = picker.locator('[aria-label="Year selector"]').first()
      await monthWheel.focus()
      await scenarioPage.waitForTimeout(180)
      await smoothWheelDrift(scenarioPage, monthWheel, 64, 2.2, 18)
      await smoothWheelDrift(scenarioPage, monthWheel, 24, -2.2, 18)
      await scenarioPage.waitForTimeout(220)
      const yearCenterFractionalPart = await measureWheelCenterFractionalPart(yearWheel)
      return {
        appliedWheelMode: settings.appliedWheelMode,
        yearCenterFractionalPart,
      }
    }),
  )

  captures.push(
    await withRecordedScenario('selector-wheel-fractional-year-rollover', async (scenarioPage) => {
      const card = scenarioPage
        .locator('div.rounded-lg')
        .filter({ hasText: 'All-features playground' })
        .first()
      await card.scrollIntoViewIfNeeded()
      const settings = await applySettings(
        scenarioPage,
        card,
        {
          selectorStyle: 'wheel',
          timeStyle: 'none',
          wheelMode: 'fractional',
        },
        '2026-12-15 09:45:00 AM ~ 2026-12-25 05:30:00 PM',
      )
      const picker = await openPicker(scenarioPage, card)
      await ensureSelectorView(scenarioPage, picker)
      const monthWheel = picker.locator('[aria-label="Month selector"]').first()
      const yearWheel = picker.locator('[aria-label="Year selector"]').first()
      await monthWheel.focus()
      await scenarioPage.waitForTimeout(180)
      await smoothWheelDrift(scenarioPage, monthWheel, 64, 2.2, 18)
      await smoothWheelDrift(scenarioPage, monthWheel, 24, -2.2, 18)
      await scenarioPage.waitForTimeout(220)
      const yearCenterFractionalPart = await measureWheelCenterFractionalPart(yearWheel)
      return {
        appliedWheelMode: settings.appliedWheelMode,
        yearCenterFractionalPart,
      }
    }),
  )

  return {
    baseUrl,
    recordDir,
    captures,
  }
}
