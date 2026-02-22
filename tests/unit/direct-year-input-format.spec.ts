import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import {
  formatModelDateWithDirectYear,
  parseModelDateWithDirectYear,
} from '../../src/composables/directYearInput'

const FORMAT = 'YYYY-MM-DD HH:mm:ss'

describe('direct-year model serialization bounds', () => {
  it('bounds positive overflow years to parser-supported max', () => {
    const overflow = dayjs('2000-02-29 12:34:56', FORMAT, true).year(100000)
    const formatted = formatModelDateWithDirectYear(overflow, FORMAT)

    expect(formatted.startsWith('99999-')).toBe(true)
    expect(parseModelDateWithDirectYear(formatted, FORMAT)).not.toBeNull()
  })

  it('bounds negative overflow years to parser-supported min', () => {
    const underflow = dayjs('2000-01-15 08:15:42', FORMAT, true).year(-100000)
    const formatted = formatModelDateWithDirectYear(underflow, FORMAT)

    expect(formatted.startsWith('-99999-')).toBe(true)
    expect(parseModelDateWithDirectYear(formatted, FORMAT)).not.toBeNull()
  })
})
