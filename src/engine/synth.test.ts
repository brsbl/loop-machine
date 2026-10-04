import { describe, expect, it } from 'vitest'
import { envelopeAt } from './synth'

describe('envelopeAt', () => {
  it('follows the attack and decay segments noteOn schedules', () => {
    expect(envelopeAt(-0.1)).toBe(0)
    expect(envelopeAt(0)).toBe(0)
    expect(envelopeAt(0.004)).toBeCloseTo(0.5) // halfway up the 8 ms attack
    expect(envelopeAt(0.008)).toBeCloseTo(1)
    expect(envelopeAt(0.008 + 0.09)).toBeCloseTo(0.8) // halfway down the 180 ms decay to 0.6
    expect(envelopeAt(0.008 + 0.18)).toBeCloseTo(0.6)
  })

  it('holds the sustain level after the decay', () => {
    expect(envelopeAt(0.5)).toBe(0.6)
    expect(envelopeAt(60)).toBe(0.6)
  })

  it('only falls after the peak, so a pinned release never jumps back up', () => {
    let last = 1
    for (let t = 0.009; t < 1; t += 0.001) {
      const v = envelopeAt(t)
      expect(v).toBeLessThanOrEqual(last + 1e-9)
      last = v
    }
  })
})
