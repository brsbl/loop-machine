import { useRef, type CSSProperties, type PointerEvent } from 'react'
import { KNOB_NOTCHES, knobValueAt } from './notch'
import { useNotchedControl } from './useNotchedControl'
import styles from './Knob.module.css'

interface KnobProps {
  value: number
  onChange: (value: number) => void
  label: string
}

/** Pixels of vertical drag for the full sweep. */
const DRAG_RANGE = 150
/** Movement below this counts as a click, which jumps to the tick nearest the pointer. */
const CLICK_SLOP = 3

/** Chrome knob that clicks to its tick marks. Drag up/down, click a tick, scroll, or use the arrow keys. */
export function Knob({ value, onChange, label }: KnobProps) {
  const ref = useRef<HTMLDivElement>(null)
  const drag = useRef<{ y: number; start: number; moved: boolean } | null>(null)
  const { commit, onKeyDown } = useNotchedControl(ref, value, KNOB_NOTCHES, onChange)

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { y: e.clientY, start: value, moved: false }
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d) return
    const dy = d.y - e.clientY
    if (Math.abs(dy) >= CLICK_SLOP) d.moved = true
    if (d.moved) commit(d.start + dy / DRAG_RANGE)
  }

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    drag.current = null
    if (!d || d.moved) return
    const r = e.currentTarget.getBoundingClientRect()
    commit(knobValueAt(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2)))
  }

  return (
    <div
      ref={ref}
      className={styles.knob}
      style={{ '--v': value } as CSSProperties}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={10}
      aria-valuenow={Math.round(value * KNOB_NOTCHES)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (drag.current = null)}
      onKeyDown={onKeyDown}
    >
      <div className={styles.cap}>
        <i className={styles.pointer} />
      </div>
    </div>
  )
}
