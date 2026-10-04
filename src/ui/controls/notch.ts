import { clamp01 } from '../../session/schema'

/** Knobs click to 11 tick marks (0–10); the fader to 9 marks. */
export const KNOB_NOTCHES = 10
export const FADER_NOTCHES = 8

export const snapToNotch = (value: number, notches: number): number => Math.round(clamp01(value) * notches) / notches

/** Knob sweep: 270° from 7:30 to 4:30, so 0 is down-left and 1 is down-right. */
export const KNOB_SWEEP = 270

/**
 * Value for a click at (dx, dy) from the knob's center. Clicks in the dead
 * zone at the bottom go to the nearer end.
 */
export function knobValueAt(dx: number, dy: number): number {
  const degrees = (Math.atan2(dx, -dy) * 180) / Math.PI
  return clamp01((degrees + KNOB_SWEEP / 2) / KNOB_SWEEP)
}

/** Value for a pointer at `y` on a vertical fader whose cap is `capHeight` tall. */
export function faderValueAt(y: number, top: number, height: number, capHeight: number): number {
  return clamp01(1 - (y - top - capHeight / 2) / (height - capHeight))
}

/** One notch per arrow key, the ends for Home and End. Returns null for other keys. */
export function valueForKey(key: string, value: number, notches: number): number | null {
  const step = 1 / notches
  switch (key) {
    case 'ArrowUp':
    case 'ArrowRight':
      return snapToNotch(value + step, notches)
    case 'ArrowDown':
    case 'ArrowLeft':
      return snapToNotch(value - step, notches)
    case 'Home':
      return 0
    case 'End':
      return 1
    default:
      return null
  }
}
