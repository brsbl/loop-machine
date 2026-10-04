import { DRUMS, SYNTH_FIRE } from '../instruments'
import type { Playhead } from '../engine/engine'
import { useSession, type SessionStore } from '../session/store'
import { decodeSession } from '../session/url'
import { LedChoice } from './controls/LedButton'
import { fireVars } from './fire'
import { Nameplate } from './Nameplate'
import { PATTERN_OPTIONS, presetFor } from './patterns'
import housing from './Housing.module.css'
import styles from './Player.module.css'
import transport from './Transport.module.css'

interface PlayerProps {
  store: SessionStore
  playhead: Playhead
  isPlaying: boolean
  onStartStop: () => void
}

/** Four beats of four steps, like the panel's beat groups. */
const BEATS = [0, 4, 8, 12].map((start) => [start, start + 1, start + 2, start + 3])

/**
 * The phone layout: a listening player, not an editor. It plays the loop a
 * link opened or one of the ready-made loops, and shows the pattern running.
 */
export function Player({ store, playhead, isPlaying, onStartStop }: PlayerProps) {
  const session = useSession(store, (s) => s)
  const preset = presetFor(session)
  const rows = [
    ...DRUMS.map((d) => ({ id: d.id, label: d.label.toUpperCase(), steps: session.drums[d.id].steps, fire: d.fire })),
    { id: 'synth', label: 'SYNTH', steps: session.synth.steps, fire: SYNTH_FIRE },
  ]

  return (
    <div className={`${housing.housing} ${styles.player}`}>
      <div className={`${housing.face} ${styles.face}`}>
        <Nameplate />

        <div className={styles.now}>
          <span className={`label ${styles.loopName}`}>{preset?.name ?? 'Shared loop'}</span>
          <div className={transport.window} aria-label={`Tempo ${session.bpm} BPM`} role="img">
            <span className={transport.ghost} aria-hidden>
              888
            </span>
            <span className={`${transport.digits} ${styles.digits}`} aria-hidden>
              {String(session.bpm).padStart(3, '0')}
            </span>
          </div>
        </div>

        <div className={styles.grid} aria-hidden>
          {rows.map((row) => (
            <div key={row.id} className={styles.row} style={fireVars(row.fire)}>
              <span className={styles.rowLabel}>{row.label}</span>
              <div className={styles.beats}>
                {BEATS.map((beat) => (
                  <div key={beat[0]} className={styles.beat}>
                    {beat.map((i) => (
                      <i key={i} className={styles.cell} data-on={row.steps[i]} data-now={i === playhead.step} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button type="button" className={styles.play} data-playing={isPlaying} onClick={onStartStop}>
          {isPlaying ? 'STOP' : 'START'}
        </button>

        <LedChoice
          label="LOOP"
          options={PATTERN_OPTIONS}
          value={preset?.link ?? ''}
          onChange={(link) => store.dispatch({ type: 'loadSession', session: decodeSession(link) })}
        />

        <p className={styles.hint}>Open on a computer to make your own loop.</p>
      </div>
    </div>
  )
}
