import styles from './Nameplate.module.css'

/**
 * Makes the wordmark look cut into the panel: a shadow inside each stroke
 * along its upper wall, and light catching the lower lip just outside it.
 */
const carvedFilter = (
  <svg className={styles.defs} aria-hidden>
    <filter id="carved" x="-5%" y="-20%" width="110%" height="140%">
      <feOffset in="SourceAlpha" dy="2.2" result="shifted" />
      <feGaussianBlur in="shifted" stdDeviation="0.9" result="shiftedSoft" />
      <feComposite in="SourceAlpha" in2="shiftedSoft" operator="out" result="upperWall" />
      <feFlood floodColor="#05070d" floodOpacity="0.85" />
      <feComposite in2="upperWall" operator="in" result="wallShadow" />
      <feComposite in="wallShadow" in2="SourceGraphic" operator="over" result="cut" />
      <feOffset in="SourceAlpha" dy="1.2" result="lowered" />
      <feComposite in="lowered" in2="SourceAlpha" operator="out" result="lowerLip" />
      <feFlood floodColor="#fff" floodOpacity="0.95" />
      <feComposite in2="lowerLip" operator="in" result="lipLight" />
      <feMerge>
        <feMergeNode in="lipLight" />
        <feMergeNode in="cut" />
      </feMerge>
    </filter>
  </svg>
)

/** The LM-919 nameplate: the descriptor over the carved, paint-filled wordmark. */
export function Nameplate() {
  return (
    <div className={styles.nameplate}>
      {carvedFilter}
      <span className={styles.descriptor}>DRUM MACHINE + SYNTH</span>
      <h1 className={styles.model}>LM-919</h1>
    </div>
  )
}
