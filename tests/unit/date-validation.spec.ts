import { describe, expect, it } from 'vitest'
import useDate from '../../src/composables/date'

describe.sequential('date validation DST behavior', () => {
  it('detects ambiguous local times for non-60-minute DST fallback transitions', () => {
    const previousTimeZone = process.env.TZ
    process.env.TZ = 'Australia/Lord_Howe'

    try {
      const { useValidateLocalDateTime } = useDate()
      const result = useValidateLocalDateTime({
        year: 2024,
        month: 4,
        day: 7,
        hour: 1,
        minute: 45,
        second: 0,
      })

      expect(result.isValid).toBe(true)
      expect(result.isDstNonexistent).toBe(false)
      expect(result.isAmbiguous).toBe(true)
    }
    finally {
      if (previousTimeZone === undefined)
        delete process.env.TZ
      else
        process.env.TZ = previousTimeZone
    }
  })
})
