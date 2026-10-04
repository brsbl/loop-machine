import { useCallback, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react'
import { DRUMS, SYNTH_FIRE, type FireColor } from '../instruments'
import type { Playhead } from '../engine/engine'
import { CHORDS, chordFor, PRESETS } from '../session/library'
import { OCTAVES, type ArpMode, type ArpRate, type Waveform } from '../session/schema'
import { useSession, type SessionStore } from '../session/store'
import { decodeSession, encodeSession } from '../session/url'
import { Fader } from './controls/Fader'
import { Knob } from './controls/Knob'
import { LedChoice, PlainKey } from './controls/LedButton'
import { StepKey } from './controls/StepKey'
import { Keyboard } from './Keyboard'
import { TempoControl } from './TempoControl'
import styles from './LoopMachine.module.css'
import transport from './Transport.module.css'

interface LoopMachineProps {
  store: SessionStore
  playhead: Playhead
  isPlaying: boolean
  onStartStop: () => void
  onReset: () => void
}

const fireVars = (c: FireColor) => ({ '--fire-top': c.top, '--fire-bottom': c.bottom, '--fire-glow': c.glow }) as CSSProperties

/** Four groups of four steps, like the 909's beat groups. */
function StepGroups({ render }: { render: (step: number) => ReactNode }) {
  return (
    <div className={styles.seq}>
      {[0, 4, 8, 12].map((start) => (
        <div key={start} className={styles.group}>
          {Array.from({ length: 4 }, (_, i) => render(start + i))}
        </div>
      ))}
    </div>
  )
}

const MODES: ReadonlyArray<{ value: ArpMode; content: string; name: string }> = [
  { value: 'up', content: '↑', name: 'Up' },
  { value: 'down', content: '↓', name: 'Down' },
  { value: 'up-down', content: '↕', name: 'Up and down' },
]

const RATES: ReadonlyArray<{ value: ArpRate; content: string; name: string }> = [
  { value: '1/4', content: '1/4', name: 'Quarter notes' },
  { value: '1/8', content: '1/8', name: 'Eighth notes' },
  { value: '1/16', content: '1/16', name: 'Sixteenth notes' },
]

const OCTAVE_OPTIONS = OCTAVES.map((o) => ({
  value: String(o),
  content: o > 0 ? `+${o}` : o < 0 ? `−${-o}` : '0',
  name: o > 0 ? 'Octave up' : o < 0 ? 'Octave down' : 'Normal octave',
}))

const PATTERN_OPTIONS = PRESETS.map((p, i) => ({ value: p.link, content: String(i + 1), name: p.name }))

const CHORD_OPTIONS = CHORDS.map((c) => ({ value: c.name, content: c.name, name: c.name }))

const undoIcon = (
  <svg viewBox="0 0 20 14" aria-hidden>
    <path d="M7 2 L3 6 L7 10 M3 6 H12 A5 4 0 0 1 12 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

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

const wave = (d: string) => (
  <svg viewBox="0 0 24 14" aria-hidden>
    <path d={d} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
  </svg>
)

const WAVES: ReadonlyArray<{ value: Waveform; content: ReactNode; name: string }> = [
  { value: 'sawtooth', content: wave('M2 12 L12 2 L12 12 L22 2'), name: 'Sawtooth' },
  { value: 'square', content: wave('M2 12 V2 H12 V12 H22 V2'), name: 'Square' },
  { value: 'sine', content: wave('M2 7 C6 -1 8 -1 12 7 S18 15 22 7'), name: 'Sine' },
  { value: 'triangle', content: wave('M2 12 L7 2 L17 12 L22 2'), name: 'Triangle' },
]

/** The LM-919 panel. Every control dispatches a session command; the engine follows the session. */
export function LoopMachine({ store, playhead, isPlaying, onStartStop, onReset }: LoopMachineProps) {
  const session = useSession(store, (s) => s)
  const canUndo = useSyncExternalStore(store.subscribe, store.canUndo)
  const { dispatch } = store
  const now = playhead.step
  // A pattern's LED stays lit until you change something.
  const link = encodeSession(session)
  const preset = PRESETS.find((p) => p.link === link)

  const toggleSynthStep = useCallback((step: number) => dispatch({ type: 'toggleSynthStep', step }), [dispatch])
  const toggleNote = useCallback((note: string) => dispatch({ type: 'toggleNote', note }), [dispatch])

  return (
    <div className={styles.device}>
      <div className={styles.face}>
        <header className={styles.top}>
          <div className={styles.nameplate}>
            {carvedFilter}
            <span className={styles.descriptor}>DRUM MACHINE + SYNTH</span>
            <h1 className={styles.model}>LM-919</h1>
          </div>
          <div className={styles.globals}>
            <div className={styles.pattern}>
              <LedChoice
                label="PATTERN"
                options={PATTERN_OPTIONS}
                value={preset?.link ?? ''}
                onChange={(value) => dispatch({ type: 'loadSession', session: decodeSession(value) })}
              />
              <span className={styles.patternName}>{preset?.name ?? 'Your loop'}</span>
            </div>
            <div className={styles.undo}>
              <span className="label">UNDO</span>
              <PlainKey label="Undo" title={canUndo ? 'Undo (⌘Z)' : 'Nothing to undo yet'} disabled={!canUndo} onPress={store.undo}>
                {undoIcon}
              </PlainKey>
            </div>
          </div>
        </header>

        <div className={styles.cols}>
          <span />
          <div className={styles.beats} aria-hidden>
            {[0, 1, 2, 3].map((beat) => (
              <span key={beat} className={now >= 0 && Math.floor(now / 4) === beat ? `${styles.beat} ${styles.beatNow}` : styles.beat} />
            ))}
          </div>
          <span />

          <span />
          <StepGroups
            render={(step) => (
              <span key={step} className={step === now ? `${styles.num} ${styles.numNow}` : styles.num}>
                {step + 1}
              </span>
            )}
          />
          <div className={styles.mix}>
            <span className="label">VOL</span>
            <span className="label">DELAY</span>
            <span className="label">DECAY</span>
          </div>

          {DRUMS.map((drum) => {
            const track = session.drums[drum.id]
            const label = drum.label.toUpperCase()
            return (
              <DrumRow key={drum.id} id={drum.id} label={label} fire={drum.fire} steps={track.steps} now={now} store={store}>
                <Knob value={track.volume} label={`${drum.label} volume`} onChange={(value) => dispatch({ type: 'setDrumParam', drum: drum.id, param: 'volume', value })} />
                <Knob value={track.delay} label={`${drum.label} delay`} onChange={(value) => dispatch({ type: 'setDrumParam', drum: drum.id, param: 'delay', value })} />
                <Knob value={track.decay} label={`${drum.label} decay`} onChange={(value) => dispatch({ type: 'setDrumParam', drum: drum.id, param: 'decay', value })} />
              </DrumRow>
            )
          })}
        </div>

        <div className={`${styles.cols} ${styles.lower}`}>
          <div className={styles.faderColumn}>
            <span className="label">VOL</span>
            <Fader value={session.synth.volume} label="Synth volume" onChange={(value) => dispatch({ type: 'setSynthVolume', value })} />
          </div>

          <div className={styles.synth} style={fireVars(SYNTH_FIRE)}>
            <StepGroups
              render={(step) => (
                <StepKey key={step} step={step} on={session.synth.steps[step]} now={step === now} variant="synth" label={`Synth step ${step + 1}`} onToggle={toggleSynthStep} />
              )}
            />
            <Keyboard held={session.synth.notes} playing={playhead.note} octave={session.synth.octave} onToggle={toggleNote} />
          </div>

          <div className={transport.panel}>
            <span className="label">TEMPO</span>
            <TempoControl bpm={session.bpm} onChange={(bpm) => dispatch({ type: 'setBpm', bpm })} />
            <div className={transport.keys}>
              <div className={transport.control}>
                <span className="label">RESET</span>
                <button type="button" className={transport.big} aria-label="Reset pattern" onClick={onReset} />
              </div>
              <div className={transport.control}>
                <span className="label">{isPlaying ? 'STOP' : 'START'}</span>
                {/* The label already says what the key does next; aria-pressed on top would announce it twice. */}
                <button type="button" className={transport.big} aria-label={isPlaying ? 'Stop' : 'Start'} data-playing={isPlaying} onClick={onStartStop} />
              </div>
            </div>
          </div>

          <div className={styles.controls}>
            <LedChoice label="DIRECTION" options={MODES} value={session.synth.mode} onChange={(mode) => dispatch({ type: 'setArpMode', mode })} />
            <LedChoice label="SPEED" options={RATES} value={session.synth.rate} onChange={(rate) => dispatch({ type: 'setArpRate', rate })} />
            <LedChoice label="WAVE" options={WAVES} value={session.synth.waveform} onChange={(waveform) => dispatch({ type: 'setWaveform', waveform })} />
            <LedChoice
              label="OCTAVE"
              options={OCTAVE_OPTIONS}
              value={String(session.synth.octave)}
              onChange={(value) => {
                const octave = OCTAVES.find((o) => String(o) === value)
                if (octave !== undefined) dispatch({ type: 'setOctave', octave })
              }}
            />
          </div>

          <div className={styles.chordRow}>
            <LedChoice
              label="CHORD"
              options={CHORD_OPTIONS}
              value={chordFor(session.synth.notes)?.name ?? ''}
              onChange={(name) => {
                const chord = CHORDS.find((c) => c.name === name)
                if (chord) dispatch({ type: 'setNotes', notes: [...chord.notes] })
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

interface DrumRowProps {
  id: string
  label: string
  fire: FireColor
  steps: boolean[]
  now: number
  store: SessionStore
  children: ReactNode
}

function DrumRow({ id, label, fire, steps, now, store, children }: DrumRowProps) {
  const toggle = useCallback((step: number) => store.dispatch({ type: 'toggleDrumStep', drum: id, step }), [store, id])
  return (
    <>
      <span className={`label ${styles.rowLabel}`}>{label}</span>
      <div style={fireVars(fire)}>
        <StepGroups
          render={(step) => <StepKey key={step} step={step} on={steps[step]} now={step === now} label={`${label} step ${step + 1}`} onToggle={toggle} />}
        />
      </div>
      <div className={styles.mix}>{children}</div>
    </>
  )
}

