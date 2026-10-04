import { DRUMS, NOTES } from '../instruments'

export const STEPS = 16
export const BPM_MIN = 60
export const BPM_MAX = 200
export const DEFAULT_BPM = 120

export const WAVEFORMS = ['sawtooth', 'square', 'sine', 'triangle'] as const
export const ARP_MODES = ['up', 'down', 'up-down'] as const
export const ARP_RATES = ['1/4', '1/8', '1/16'] as const
/** Octave shift for the synth, applied on top of the keyboard's C3–B4. */
export const OCTAVES = [-1, 0, 1] as const

export type Waveform = (typeof WAVEFORMS)[number]
export type ArpMode = (typeof ARP_MODES)[number]
export type ArpRate = (typeof ARP_RATES)[number]
export type Octave = (typeof OCTAVES)[number]

/** Knob values are 0–1. Delay is the echo send; decay scales how long each hit rings, 0.5 being the voice's own length. */
export interface DrumTrack {
  steps: boolean[]
  volume: number
  delay: number
  decay: number
}

export interface SynthTrack {
  steps: boolean[]
  /** Held notes by name, e.g. "C4". */
  notes: string[]
  mode: ArpMode
  rate: ArpRate
  waveform: Waveform
  octave: Octave
  volume: number
}

export interface Session {
  version: 2
  bpm: number
  drums: Record<string, DrumTrack>
  synth: SynthTrack
}

export const emptySteps = (): boolean[] => Array<boolean>(STEPS).fill(false)

export const defaultDrumTrack = (): DrumTrack => ({ steps: emptySteps(), volume: 0.8, delay: 0, decay: 0.5 })

export const defaultSynthTrack = (): SynthTrack => ({
  steps: emptySteps(),
  notes: [],
  mode: 'up',
  rate: '1/16',
  waveform: 'sawtooth',
  octave: 0,
  volume: 0.5,
})

export const defaultSession = (): Session => ({
  version: 2,
  bpm: DEFAULT_BPM,
  drums: Object.fromEntries(DRUMS.map((d) => [d.id, defaultDrumTrack()])),
  synth: defaultSynthTrack(),
})

export const clamp01 = (v: number): number => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0)

export const clampBpm = (bpm: number): number =>
  Number.isFinite(bpm) ? Math.round(Math.min(BPM_MAX, Math.max(BPM_MIN, bpm))) : DEFAULT_BPM

const NOTE_ORDER = new Map(NOTES.map((n, i) => [n.note, i]))

/** Held notes in pitch order, dropping unknown names and duplicates. */
export const normalizeNotes = (notes: Iterable<string>): string[] =>
  [...new Set(notes)].filter((n) => NOTE_ORDER.has(n)).sort((a, b) => NOTE_ORDER.get(a)! - NOTE_ORDER.get(b)!)
