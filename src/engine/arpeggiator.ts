import type { ArpMode, ArpRate } from '../session/schema'

/** How many 16th-note steps each arp note lasts. */
export const STEPS_PER_NOTE: Record<ArpRate, number> = { '1/4': 4, '1/8': 2, '1/16': 1 }

/** The arp plays on a step when its gate pad is on and the step lands on the rate's grid. */
export const arpPlaysOnStep = (step: number, gateOn: boolean, rate: ArpRate): boolean =>
  gateOn && step % STEPS_PER_NOTE[rate] === 0

/**
 * Which held note (in pitch order) plays for the `count`-th arp note.
 * up: 0 1 2 0 1 2 · down: 2 1 0 2 1 0 · up-down: 0 1 2 1 0 1 2 1
 */
export function arpIndex(mode: ArpMode, count: number, length: number): number {
  if (length <= 0) return -1
  if (mode === 'up') return count % length
  if (mode === 'down') return length - 1 - (count % length)
  if (length === 1) return 0
  const cycle = length * 2 - 2
  const pos = count % cycle
  return pos < length ? pos : cycle - pos
}
