import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import VueTailwindDatePicker from '../../src/VueTailwindDatePicker.vue'
import 'dayjs/locale/de'

async function settle() {
  await vi.advanceTimersByTimeAsync(320)
  await nextTick()
  await nextTick()
}

function getHeaderMonthText(wrapper: ReturnType<typeof mount>) {
  return wrapper.get('#vtd-header-previous-month').text().trim().toLowerCase()
}

afterEach(() => {
  vi.useRealTimers()
})

describe.sequential('locale isolation between picker instances', () => {
  it('keeps month labels localized per instance when sibling picker updates', async () => {
    vi.useFakeTimers()

    const deWrapper = mount(VueTailwindDatePicker, {
      attachTo: document.body,
      props: {
        noInput: true,
        asSingle: true,
        useRange: false,
        i18n: 'de',
        modelValue: '2026-03-15 00:00:00',
      },
    })
    const enWrapper = mount(VueTailwindDatePicker, {
      attachTo: document.body,
      props: {
        noInput: true,
        asSingle: true,
        useRange: false,
        i18n: 'en',
        modelValue: '2026-03-15 00:00:00',
      },
    })

    await settle()

    expect(getHeaderMonthText(deWrapper)).toContain('märz')
    expect(getHeaderMonthText(enWrapper)).toContain('mar')

    await enWrapper.setProps({ modelValue: '2026-04-15 00:00:00' })
    await settle()

    await deWrapper.setProps({ modelValue: '2026-03-16 00:00:00' })
    await settle()

    expect(getHeaderMonthText(deWrapper)).toContain('märz')
    expect(getHeaderMonthText(enWrapper)).toContain('apr')

    deWrapper.unmount()
    enWrapper.unmount()
  })
})
