import { useEffect, useRef, type KeyboardEvent, type RefObject } from 'react'
import { snapToNotch, valueForKey } from './notch'

/**
 * Shared behavior for knobs and faders: the value snaps to notches, arrow keys
 * move one notch, and the mouse wheel moves one notch per tick.
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
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const { value: v, onChange: change } = latest.current
      const next = snapToNotch(v + (e.deltaY < 0 ? 1 : -1) / notches, notches)
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
