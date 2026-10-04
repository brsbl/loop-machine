import { describe, expect, it } from 'vitest'
import { faderValueAt, knobValueAt, snapToNotch, valueForKey } from './notch'

describe('notched controls', () => {
  it('snaps to the nearest notch', () => {
    expect(snapToNotch(0.62, 10)).toBe(0.6)
    expect(snapToNotch(0.66, 10)).toBe(0.7)
    expect(snapToNotch(0.55, 8)).toBe(0.5)
    expect(snapToNotch(1.4, 10)).toBe(1)
  })

  it('maps a click around the knob to a value', () => {
    expect(knobValueAt(0, -10)).toBeCloseTo(0.5) // straight up
    expect(knobValueAt(-10, 10)).toBeCloseTo(0) // down-left, start of the sweep
    expect(knobValueAt(10, 10)).toBeCloseTo(1) // down-right, end of the sweep
    expect(knobValueAt(-1, 20)).toBe(0) // bottom dead zone goes to the nearer end
    expect(knobValueAt(1, 20)).toBe(1)
  })

  it('maps a click on the fader track to a value', () => {
    expect(faderValueAt(8, 0, 116, 16)).toBe(1)
    expect(faderValueAt(108, 0, 116, 16)).toBe(0)
    expect(faderValueAt(58, 0, 116, 16)).toBeCloseTo(0.5)
  })

  it('moves one notch per arrow key', () => {
    expect(valueForKey('ArrowUp', 0.5, 10)).toBe(0.6)
    expect(valueForKey('ArrowLeft', 0.5, 8)).toBe(0.375)
    expect(valueForKey('End', 0.2, 8)).toBe(1)
    expect(valueForKey('a', 0.2, 8)).toBeNull()
  })
})
