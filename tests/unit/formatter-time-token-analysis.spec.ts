import { describe, expect, it } from 'vitest'
import {
  analyzeFormatterTimeTokens,
  normalizeDefaultTimeInput,
} from '../../src/utils'

describe('formatter time token analysis', () => {
  it('ignores escaped literal time-like tokens', () => {
    const analysis = analyzeFormatterTimeTokens('YYYY-MM-DD[HH:mm]')
    expect(analysis.hasTimeTokens).toBe(false)
    expect(analysis.isValid).toBe(false)
    expect(analysis.normalizedTimeFormat).toBeNull()
    expect(normalizeDefaultTimeInput('09:15', 'YYYY-MM-DD[HH:mm]')).toBeNull()
  })

  it('detects real time tokens after escaped [T] delimiters', () => {
    const analysis = analyzeFormatterTimeTokens('YYYY-MM-DD[T]HH:mm:ss')
    expect(analysis.hasTimeTokens).toBe(true)
    expect(analysis.isValid).toBe(true)
    expect(analysis.uses12Hour).toBe(false)
    expect(analysis.usesSeconds).toBe(true)
    expect(analysis.normalizedTimeFormat).toBe('HH:mm:ss')
  })
})
