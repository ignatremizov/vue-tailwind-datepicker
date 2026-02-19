import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Month from '../../src/components/Month.vue'
import VueTailwindDatePicker from '../../src/VueTailwindDatePicker.vue'

afterEach(() => {
  vi.useRealTimers()
})

async function mountSelectorPicker(selectorFocusTint: boolean) {
  vi.useFakeTimers()
  const wrapper = mount(VueTailwindDatePicker, {
    attachTo: document.body,
    props: {
      noInput: true,
      selectorMode: true,
      selectorFocusTint,
      useRange: false,
      asSingle: true,
      shortcuts: false,
      autoApply: true,
      modelValue: '2025-01-15 00:00:00',
    },
  })

  vi.advanceTimersByTime(260)
  await nextTick()
  await wrapper.get('#vtd-header-previous-month').trigger('click')
  await nextTick()

  return wrapper
}

function getSelectorColumns(wrapper: ReturnType<typeof mount>) {
  const columns = wrapper.findAll('div.rounded-md.border.p-1.min-w-0')
    .filter((column) => {
      return column.find('[aria-label="Month selector"]').exists()
        || column.find('[aria-label="Year selector"]').exists()
    })
  expect(columns).toHaveLength(2)
  return columns
}

describe('selectorFocusTint behavior', () => {
  it('applies tint classes to the active selector column when enabled', async () => {
    const wrapper = await mountSelectorPicker(true)

    let [monthColumn, yearColumn] = getSelectorColumns(wrapper)
    expect(monthColumn.classes()).toContain('bg-vtd-primary-50/40')
    expect(monthColumn.classes()).toContain('ring-2')
    expect(yearColumn.classes()).not.toContain('bg-vtd-primary-50/40')
    expect(yearColumn.classes()).not.toContain('ring-2')

    await wrapper.get('[aria-label="Year selector"]').trigger('focus')
    await nextTick()

    ;[monthColumn, yearColumn] = getSelectorColumns(wrapper)
    expect(yearColumn.classes()).toContain('bg-vtd-primary-50/40')
    expect(yearColumn.classes()).toContain('ring-2')
    expect(monthColumn.classes()).not.toContain('bg-vtd-primary-50/40')

    wrapper.unmount()
  })

  it('keeps neutral background when tint is disabled while preserving active border', async () => {
    const wrapper = await mountSelectorPicker(false)

    let [monthColumn, yearColumn] = getSelectorColumns(wrapper)
    expect(monthColumn.classes()).toContain('border-vtd-primary-300')
    expect(monthColumn.classes()).not.toContain('bg-vtd-primary-50/40')
    expect(monthColumn.classes()).not.toContain('ring-2')

    await wrapper.get('[aria-label="Year selector"]').trigger('focus')
    await nextTick()

    ;[monthColumn, yearColumn] = getSelectorColumns(wrapper)
    expect(yearColumn.classes()).toContain('border-vtd-primary-300')
    expect(yearColumn.classes()).not.toContain('bg-vtd-primary-50/40')
    expect(yearColumn.classes()).not.toContain('ring-2')

    wrapper.unmount()
  })

  it('keeps year focus styling when month scroll updates while year stays focused', async () => {
    const wrapper = await mountSelectorPicker(true)

    await wrapper.get('[aria-label="Year selector"]').trigger('focus')
    await nextTick()

    const monthComponent = wrapper.findComponent(Month)
    monthComponent.vm.$emit('scrollMonth', { month: 2, year: 2025 })
    await nextTick()

    const [monthColumn, yearColumn] = getSelectorColumns(wrapper)
    expect(yearColumn.classes()).toContain('bg-vtd-primary-50/40')
    expect(yearColumn.classes()).toContain('ring-2')
    expect(monthColumn.classes()).not.toContain('bg-vtd-primary-50/40')

    wrapper.unmount()
  })

  it('clears selector column focus styling when a time wheel is focused in wheel-inline selector view', async () => {
    vi.useFakeTimers()
    const wrapper = mount(VueTailwindDatePicker, {
      attachTo: document.body,
      props: {
        noInput: true,
        selectorMode: true,
        selectorFocusTint: true,
        useRange: true,
        asSingle: true,
        shortcuts: false,
        autoApply: true,
        timePickerStyle: 'wheel-inline',
        timeInlinePosition: 'right',
        modelValue: {
          startDate: '2026-02-14 09:08:33 PM',
          endDate: '2026-02-24 12:00:00 AM',
        },
      },
    })

    vi.advanceTimersByTime(260)
    await nextTick()
    await wrapper.get('#vtd-header-previous-month').trigger('click')
    await nextTick()

    await wrapper.get('[aria-label="Year selector"]').trigger('focus')
    await nextTick()

    let [monthColumn, yearColumn] = getSelectorColumns(wrapper)
    expect(yearColumn.classes()).toContain('ring-2')
    expect(monthColumn.classes()).not.toContain('ring-2')

    const hourWheel = wrapper.get('.vtd-time-wheel[aria-label="Hour wheel"]')
    await hourWheel.trigger('pointerdown')
    await nextTick()

    ;[monthColumn, yearColumn] = getSelectorColumns(wrapper)
    expect(monthColumn.classes()).not.toContain('ring-2')
    expect(yearColumn.classes()).not.toContain('ring-2')

    await wrapper.get('[aria-label="Month selector"]').trigger('focus')
    await nextTick()

    ;[monthColumn, yearColumn] = getSelectorColumns(wrapper)
    expect(monthColumn.classes()).toContain('ring-2')
    expect(yearColumn.classes()).not.toContain('ring-2')

    wrapper.unmount()
  })
})
