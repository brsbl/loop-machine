import {
  clamp01,
  clampBpm,
  emptySteps,
  normalizeNotes,
  OCTAVES,
  type ArpMode,
  type ArpRate,
  type Octave,
  type Session,
  type Waveform,
} from './schema'
import { DEFAULT_GATES } from './library'

export type DrumParam = 'volume' | 'delay' | 'decay'

export type Command =
  | { type: 'toggleDrumStep'; drum: string; step: number }
  | { type: 'setDrumParam'; drum: string; param: DrumParam; value: number }
  | { type: 'toggleSynthStep'; step: number }
  | { type: 'toggleNote'; note: string }
  /** Holds exactly these notes, e.g. a chord. */
  | { type: 'setNotes'; notes: string[] }
  /** Replaces the whole session, e.g. with a ready-made pattern. */
  | { type: 'loadSession'; session: Session }
  | { type: 'setArpMode'; mode: ArpMode }
  | { type: 'setArpRate'; rate: ArpRate }
  | { type: 'setWaveform'; waveform: Waveform }
  | { type: 'setOctave'; octave: Octave }
  | { type: 'setSynthVolume'; value: number }
  | { type: 'setBpm'; bpm: number }
  /** Clears the drum and synth steps. Held notes and knob settings stay. */
  | { type: 'reset' }

const toggleAt = (steps: boolean[], i: number): boolean[] => steps.map((on, j) => (j === i ? !on : on))

/**
 * New held notes. Holding the first key while no synth steps are set also
 * fills in a default rhythm that plays at the current SPEED, so the keyboard always makes a sound.
 */
function withNotes(session: Session, notes: Iterable<string>): Session {
  const synth = { ...session.synth, notes: normalizeNotes(notes) }
  if (session.synth.notes.length === 0 && synth.notes.length > 0 && !synth.steps.some(Boolean)) synth.steps = [...DEFAULT_GATES[synth.rate]]
  return { ...session, synth }
}

/** Pure state transition: every change to a session goes through here. */
export function applyCommand(session: Session, command: Command): Session {
  switch (command.type) {
    case 'toggleDrumStep': {
      const track = session.drums[command.drum]
      if (!track) return session
      return { ...session, drums: { ...session.drums, [command.drum]: { ...track, steps: toggleAt(track.steps, command.step) } } }
    }
    case 'setDrumParam': {
      const track = session.drums[command.drum]
      if (!track) return session
      return { ...session, drums: { ...session.drums, [command.drum]: { ...track, [command.param]: clamp01(command.value) } } }
    }
    case 'toggleSynthStep':
      return { ...session, synth: { ...session.synth, steps: toggleAt(session.synth.steps, command.step) } }
    case 'toggleNote': {
      const held = new Set(session.synth.notes)
      if (held.has(command.note)) held.delete(command.note)
      else held.add(command.note)
      return withNotes(session, held)
    }
    case 'setNotes':
      return withNotes(session, command.notes)
    case 'loadSession':
      return command.session
    case 'setArpMode':
      return { ...session, synth: { ...session.synth, mode: command.mode } }
    case 'setArpRate':
      return { ...session, synth: { ...session.synth, rate: command.rate } }
    case 'setWaveform':
      return { ...session, synth: { ...session.synth, waveform: command.waveform } }
    case 'setOctave':
      if (!OCTAVES.includes(command.octave)) return session
      return { ...session, synth: { ...session.synth, octave: command.octave } }
    case 'setSynthVolume':
      return { ...session, synth: { ...session.synth, volume: clamp01(command.value) } }
    case 'setBpm':
      return { ...session, bpm: clampBpm(command.bpm) }
    case 'reset':
      return {
        ...session,
        drums: Object.fromEntries(Object.entries(session.drums).map(([id, t]) => [id, { ...t, steps: emptySteps() }])),
        synth: { ...session.synth, steps: emptySteps() },
      }
  }
}
