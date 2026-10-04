import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import styles from './LedButton.module.css'

interface LedChoiceProps<T extends string> {
  label: string
  options: ReadonlyArray<{ value: T; content: ReactNode; name: string }>
  value: T
  onChange: (value: T) => void
}

/** Where each key moves the selection in a group of `count`, wrapping at the ends like native radios; null for other keys. */
function radioTarget(key: string, index: number, count: number): number | null {
  switch (key) {
    case 'ArrowLeft':
    case 'ArrowUp':
      return (index - 1 + count) % count
    case 'ArrowRight':
    case 'ArrowDown':
      return (index + 1) % count
    case 'Home':
      return 0
    case 'End':
      return count - 1
    default:
      return null
  }
}

/**
 * A row of small keys with an LED over the selected one, like the 909's mode buttons.
 * One Tab stop per group (the lit key, or the first when none is lit); arrows, Home, and End pick.
 */
export function LedChoice<T extends string>({ label, options, value, onChange }: LedChoiceProps<T>) {
  const labelId = useId()
  const keys = useRef<(HTMLButtonElement | null)[]>([])
  const selected = options.findIndex((o) => o.value === value)
  const tabStop = selected === -1 ? 0 : selected

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const to = radioTarget(e.key, index, options.length)
    if (to === null) return
    e.preventDefault()
    keys.current[to]?.focus()
    onChange(options[to].value)
  }

  return (
    <div className={styles.group}>
      <span className="label" id={labelId}>
        {label}
      </span>
      <div className={styles.row} role="radiogroup" aria-labelledby={labelId}>
        {options.map((o, i) => (
          <button
            key={o.value}
            ref={(el) => {
              keys.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={o.value === value}
            aria-label={o.name}
            title={o.name}
            tabIndex={i === tabStop ? 0 : -1}
            className={styles.button}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
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

/**
 * A momentary key with the mode buttons' cream face and no LED, for one-shot actions like undo.
 * Disabled with aria-disabled rather than the native attribute, so the key keeps focus when it runs out of work.
 */
export function PlainKey({ label, title, disabled = false, children, onPress }: PlainKeyProps) {
  return (
    <button
      type="button"
      className={styles.button}
      aria-label={label}
      title={title}
      aria-disabled={disabled}
      onClick={() => {
        if (!disabled) onPress()
      }}
    >
      <span className={styles.face}>{children}</span>
    </button>
  )
}
