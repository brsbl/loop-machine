import { useRef, useState } from 'react'
import { ArrowKey } from './controls/LedButton'
import styles from './Transport.module.css'

interface TempoControlProps {
  bpm: number
  onChange: (bpm: number) => void
}

/** Red 7-segment tempo window. Type a value, or step it with ▲▼. */
export function TempoControl({ bpm, onChange }: TempoControlProps) {
  const [draft, setDraft] = useState<string | null>(null)
  const shown = draft ?? String(bpm).padStart(3, '0')
  // Escape blurs the field, and blur commits; this tells that commit to drop the draft instead.
  const cancelled = useRef(false)

  const commit = () => {
    const cancel = cancelled.current
    cancelled.current = false
    if (draft !== null && !cancel) {
      const parsed = parseInt(draft, 10)
      if (!Number.isNaN(parsed)) onChange(parsed)
    }
    setDraft(null)
  }

  return (
    <div className={styles.tempo}>
      <label className={styles.window}>
        <span className={styles.ghost} aria-hidden>
          888
        </span>
        <input
          className={styles.digits}
          aria-label="Tempo in BPM"
          inputMode="numeric"
          maxLength={3}
          value={shown}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => setDraft(e.target.value.replace(/\D/g, ''))}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
            if (e.key === 'Escape') {
              cancelled.current = true
              e.currentTarget.blur()
            }
          }}
        />
      </label>
      <div className={styles.arrows}>
        <ArrowKey label="Tempo up" onPress={() => onChange(bpm + 1)}>
          ▲
        </ArrowKey>
        <ArrowKey label="Tempo down" onPress={() => onChange(bpm - 1)}>
          ▼
        </ArrowKey>
      </div>
    </div>
  )
}
