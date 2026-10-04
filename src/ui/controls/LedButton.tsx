import { useId, type ReactNode } from 'react'
import styles from './LedButton.module.css'

interface LedChoiceProps<T extends string> {
  label: string
  options: ReadonlyArray<{ value: T; content: ReactNode; name: string }>
  value: T
  onChange: (value: T) => void
}

/** A row of small keys with an LED over the selected one, like the 909's mode buttons. */
export function LedChoice<T extends string>({ label, options, value, onChange }: LedChoiceProps<T>) {
  const labelId = useId()
  return (
    <div className={styles.group}>
      <span className="label" id={labelId}>
        {label}
      </span>
      <div className={styles.row} role="radiogroup" aria-labelledby={labelId}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={o.value === value}
            aria-label={o.name}
            title={o.name}
            className={styles.button}
            onClick={() => onChange(o.value)}
          >
            <b className={styles.led} />
            <span className={styles.face}>{o.content}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

interface ArrowKeyProps {
  label: string
  children: ReactNode
  onPress: () => void
}

/** Small momentary key with a 909 bezel and no LED, used for the tempo arrows. */
export function ArrowKey({ label, children, onPress }: ArrowKeyProps) {
  return (
    <button type="button" className={`${styles.button} ${styles.arrow}`} aria-label={label} onClick={onPress}>
      <span className={styles.face}>{children}</span>
    </button>
  )
}

interface PlainKeyProps {
  label: string
  title: string
  disabled?: boolean
  children: ReactNode
  onPress: () => void
}

/** A momentary key with the mode buttons' cream face and no LED, for one-shot actions like undo. */
export function PlainKey({ label, title, disabled, children, onPress }: PlainKeyProps) {
  return (
    <button type="button" className={styles.button} aria-label={label} title={title} disabled={disabled} onClick={onPress}>
      <span className={styles.face}>{children}</span>
    </button>
  )
}
