import { useEffect, useRef, type KeyboardEvent, type RefObject } from 'react'
import { snapToNotch, valueForKey } from './notch'

/**
 * Scroll distance per notch. A wheel click (about 100 px, or 3 lines in Firefox) moves one notch;
 * a trackpad's many small deltas add up to a few notches per swipe.
 */
const WHEEL_NOTCH_PX = 40
/** Pixels per line for wheels that report in lines. */
const WHEEL_LINE_PX = 16

/**
 * Shared behavior for knobs and faders: the value snaps to notches, arrow keys
 * move one notch, and scrolling moves one notch per wheel click.
 */
export function useNotchedControl<T extends HTMLElement>(
  ref: RefObject<T | null>,
  value: number,
  notches: number,
  onChange: (value: number) => void,
) {
  const latest = useRef({ value, onChange })
  useEffect(() => {
    latest.current = { value, onChange }
  })

  const commit = (next: number) => {
    const snapped = snapToNotch(next, notches)
    if (snapped !== latest.current.value) latest.current.onChange(snapped)
  }

  // React attaches wheel listeners as passive, so preventDefault needs a native listener.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Scroll gathered toward the next notch, in pixels; negative is up.
    let travel = 0
    const onWheel = (e: WheelEvent) => {
      // Sideways swipes leave the value alone, and keep the page's own horizontal gestures.
      if (e.deltaY === 0) return
      e.preventDefault()
      const unit =
        e.deltaMode === WheelEvent.DOM_DELTA_LINE ? WHEEL_LINE_PX : e.deltaMode === WheelEvent.DOM_DELTA_PAGE ? el.clientHeight || 400 : 1
      const dy = e.deltaY * unit
      if (Math.sign(dy) !== Math.sign(travel)) travel = 0
      travel += dy
      if (Math.abs(travel) < WHEEL_NOTCH_PX) return
      // At most one notch per event, so a single wheel click never skips one; the remainder carries on.
      const direction = Math.sign(travel)
      travel %= WHEEL_NOTCH_PX
      const { value: v, onChange: change } = latest.current
      const next = snapToNotch(v - direction / notches, notches)
      if (next !== v) change(next)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [ref, notches])

  const onKeyDown = (e: KeyboardEvent) => {
    const next = valueForKey(e.key, latest.current.value, notches)
    if (next === null) return
    e.preventDefault()
    commit(next)
  }

  return { commit, onKeyDown }
}
