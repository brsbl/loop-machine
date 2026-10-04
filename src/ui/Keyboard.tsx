import { memo, type CSSProperties } from 'react'
import { NOTES } from '../instruments'
import styles from './Keyboard.module.css'

interface KeyboardProps {
  held: readonly string[]
  /** The note the synth fired on the current step, if any. */
  playing: string | null
  /** The synth's octave shift; the C labels follow it. */
  octave: number
  onToggle: (note: string) => void
}

const WHITE = NOTES.filter((n) => !n.black)

/** Position of each black key, counted in white-key widths from the left edge. */
const BLACK = NOTES.flatMap((n, i) => (n.black ? [{ ...n, x: NOTES.slice(0, i).filter((m) => !m.black).length }] : []))

/**
 * Two-octave piano keyboard set in a keybed. Each key carries an LED: red for held
 * notes (the chord the arp plays), amber for the note the synth plays on this step.
 */
/** "C3" shifted by `octave`, e.g. "C2" at -1. */
const shifted = (note: string, octave: number) => note.replace(/\d+$/, (n) => String(Number(n) + octave))

export const Keyboard = memo(function Keyboard({ held, playing, octave, onToggle }: KeyboardProps) {
  const heldSet = new Set(held)
  const cls = (base: string, note: string) =>
    [base, heldSet.has(note) && styles.held, playing === note && styles.playing].filter(Boolean).join(' ')

  return (
    <div className={styles.bed}>
      <div className={styles.keys}>
        {WHITE.map((n) => (
          <button
            key={n.note}
            type="button"
            className={cls(styles.white, n.note)}
            aria-label={n.note}
            aria-pressed={heldSet.has(n.note)}
            onClick={() => onToggle(n.note)}
          >
            <span className={styles.led} />
            <span className={styles.name}>{n.note.startsWith('C') ? shifted(n.note, octave) : ''}</span>
            <span className={styles.hint}>{n.key.toUpperCase()}</span>
          </button>
        ))}
        {BLACK.map((n) => (
          <button
            key={n.note}
            type="button"
            className={cls(styles.black, n.note)}
            style={{ '--x': n.x } as CSSProperties}
            aria-label={n.note}
            aria-pressed={heldSet.has(n.note)}
            onClick={() => onToggle(n.note)}
          >
            <span className={styles.led} />
            <span className={styles.hint}>{n.key.toUpperCase()}</span>
          </button>
        ))}
      </div>
    </div>
  )
})
