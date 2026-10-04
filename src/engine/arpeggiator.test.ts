import { describe, expect, it } from 'vitest'
import { arpIndex, arpPlaysOnStep } from './arpeggiator'

const sequence = (mode: Parameters<typeof arpIndex>[0], length: number, count: number) =>
  Array.from({ length: count }, (_, i) => arpIndex(mode, i, length))

describe('arpeggiator', () => {
  it('walks held notes up, down, and up-down', () => {
    expect(sequence('up', 3, 6)).toEqual([0, 1, 2, 0, 1, 2])
    expect(sequence('down', 3, 6)).toEqual([2, 1, 0, 2, 1, 0])
    expect(sequence('up-down', 3, 8)).toEqual([0, 1, 2, 1, 0, 1, 2, 1])
    expect(sequence('up-down', 1, 3)).toEqual([0, 0, 0])
    expect(arpIndex('up', 0, 0)).toBe(-1)
  })

  it('plays only on gated steps that land on the rate grid', () => {
    expect(arpPlaysOnStep(4, true, '1/4')).toBe(true)
    expect(arpPlaysOnStep(5, true, '1/4')).toBe(false)
    expect(arpPlaysOnStep(2, true, '1/8')).toBe(true)
    expect(arpPlaysOnStep(3, true, '1/8')).toBe(false)
    expect(arpPlaysOnStep(3, true, '1/16')).toBe(true)
    expect(arpPlaysOnStep(3, false, '1/16')).toBe(false)
  })
})
