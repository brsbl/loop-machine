import { memo } from 'react'
import styles from './StepKey.module.css'

interface StepKeyProps {
  step: number
  on: boolean
  /** The playhead is on this step. */
  now: boolean
  variant?: 'drum' | 'synth'
  label: string
  onToggle: (step: number) => void
}

/**
 * A 909 step key: cream key with an LED above it. Under the playhead it takes
 * a faint grey shade; if it's on, it fires in its row's color and fades out.
 */
export const StepKey = memo(function StepKey({ step, on, now, variant = 'drum', label, onToggle }: StepKeyProps) {
  const className = [styles.step, variant === 'synth' && styles.synth, now && styles.now].filter(Boolean).join(' ')
  return (
    <button type="button" className={className} aria-pressed={on} aria-current={now ? 'step' : undefined} aria-label={label} onClick={() => onToggle(step)}>
      <b className={styles.led} />
      <span className={styles.key} />
    </button>
  )
})
