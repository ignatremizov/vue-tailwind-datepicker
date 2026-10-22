// Copyright © 2026 Zolvat Ltd
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'

const ReportingDateFixture = defineComponent({
  render() {
    return h('section', { 'aria-label': 'Period & account' }, [
      h('label', { for: 'reporting-date' }, ['Reporting ', h('strong', 'date')]),
      h('input', {
        'id': 'reporting-date',
        'value': '2026-10-22',
        'aria-describedby': 'format-hint',
      }),
      h('p', { id: 'format-hint' }, [
        'Keep ',
        h('code', 'YYYY-MM-DD'),
        ' and ',
        h('em', 'local time'),
        '.',
      ]),
    ])
  },
})

describe('test-utils HTML formatting contract', () => {
  it('preserves escaped attributes, inline text spacing, and readable nested markup', () => {
    const wrapper = mount(ReportingDateFixture)

    try {
      expect(wrapper.html()).toBe(
        '<section aria-label="Period &amp; account">'
        + '<label for="reporting-date">Reporting <strong>date</strong></label>'
        + '<input id="reporting-date" aria-describedby="format-hint" value="2026-10-22">\n'
        + '  <p id="format-hint">Keep <code>YYYY-MM-DD</code> and <em>local time</em>.</p>\n'
        + '</section>',
      )
      expect(wrapper.html({ raw: true })).toBe(
        '<section aria-label="Period &amp; account">'
        + '<label for="reporting-date">Reporting <strong>date</strong></label>'
        + '<input id="reporting-date" aria-describedby="format-hint" value="2026-10-22">'
        + '<p id="format-hint">Keep <code>YYYY-MM-DD</code> and <em>local time</em>.</p>'
        + '</section>',
      )
    } finally {
      wrapper.unmount()
    }
  })

  it('includes the same readable markup when a missing selector reports the mounted tree', () => {
    const wrapper = mount(ReportingDateFixture)

    try {
      expect(() => wrapper.get('#missing')).toThrowError(
        `Unable to get #missing within: ${wrapper.html()}`,
      )
    } finally {
      wrapper.unmount()
    }
  })
})
