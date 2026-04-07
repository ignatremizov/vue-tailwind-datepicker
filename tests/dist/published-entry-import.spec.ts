import { describe, expect, it } from 'vitest'

describe('published entry smoke test', () => {
  it('imports the built package entry without hanging', async () => {
    const mod = await import('../../dist/vue-tailwind-datepicker.js')

    expect(mod).toBeTruthy()
    expect(mod.default).toBeTruthy()
  })
})
