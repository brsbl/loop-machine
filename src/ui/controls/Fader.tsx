import { useRef, type CSSProperties, type PointerEvent } from 'react'
import { FADER_NOTCHES, faderValueAt } from './notch'
import { useNotchedControl } from './useNotchedControl'
import styles from './Fader.module.css'

interface FaderProps {
  value: number
  onChange: (value: number) => void
  label: string
}

const CAP_HEIGHT = 16

/** Vertical fader that clicks to its marks. Click or drag along the track, scroll, or use the arrow keys. */
export function Fader({ value, onChange, label }: FaderProps) {
  const ref = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const { commit, onKeyDown } = useNotchedControl(ref, value, FADER_NOTCHES, onChange)

  const follow = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    commit(faderValueAt(e.clientY, r.top, r.height, CAP_HEIGHT))
  }

  return (
    <div
      ref={ref}
      className={styles.fader}
      style={{ '--v': value } as CSSProperties}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-orientation="vertical"
      aria-valuemin={0}
      aria-valuemax={FADER_NOTCHES}
      aria-valuenow={Math.round(value * FADER_NOTCHES)}
      onPointerDown={(e) => {
        if (e.button !== 0) return
        e.currentTarget.setPointerCapture(e.pointerId)
        dragging.current = true
        follow(e)
      }}
      onPointerMove={(e) => dragging.current && follow(e)}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
      onKeyDown={onKeyDown}
    >
      <i className={styles.cap} />
    </div>
  )
}
