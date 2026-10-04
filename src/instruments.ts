import type { DrumVoice } from './engine/drums'

/**
 * The instrument registry. Adding a drum is one entry here: the step row,
 * mixer knobs, playback color, and share link follow.
 */

export interface FireColor {
  /** Gradient top and bottom of a pad that fires, and its glow as `r,g,b`. */
  top: string
  bottom: string
  glow: string
}

export interface DrumDefinition {
  id: string
  label: string
  /** Which synthesized voice plays it. */
  voice: DrumVoice
  fire: FireColor
}

export const DRUMS: readonly DrumDefinition[] = [
  {
    id: 'hihat',
    label: 'Hi-hat',
    voice: 'hihat',
    fire: { top: '#d2ad70', bottom: '#a07733', glow: '160,119,51' },
  },
  {
    id: 'snare',
    label: 'Snare',
    voice: 'snare',
    fire: { top: '#e39c82', bottom: '#b4664a', glow: '180,102,74' },
  },
  {
    id: 'kick',
    label: 'Kick',
    voice: 'kick',
    fire: { top: '#91a7d0', bottom: '#58719f', glow: '88,113,159' },
  },
]

/** The synth's pads and keys share one color so a step and the note it plays read together. */
export const SYNTH_FIRE: FireColor = { top: '#9fba88', bottom: '#68864e', glow: '104,134,78' }

export interface NoteDefinition {
  note: string
  freq: number
  black: boolean
  /** Computer key that toggles the note. */
  key: string
}

/** Two octaves, C3 to B4, A4 = 440 Hz. */
export const NOTES: readonly NoteDefinition[] = [
  { note: 'C3', freq: 130.81, black: false, key: 'a' },
  { note: 'C#3', freq: 138.59, black: true, key: 'w' },
  { note: 'D3', freq: 146.83, black: false, key: 's' },
  { note: 'D#3', freq: 155.56, black: true, key: 'e' },
  { note: 'E3', freq: 164.81, black: false, key: 'd' },
  { note: 'F3', freq: 174.61, black: false, key: 'f' },
  { note: 'F#3', freq: 185.0, black: true, key: 't' },
  { note: 'G3', freq: 196.0, black: false, key: 'g' },
  { note: 'G#3', freq: 207.65, black: true, key: 'y' },
  { note: 'A3', freq: 220.0, black: false, key: 'h' },
  { note: 'A#3', freq: 233.08, black: true, key: 'u' },
  { note: 'B3', freq: 246.94, black: false, key: 'j' },
  { note: 'C4', freq: 261.63, black: false, key: 'k' },
  { note: 'C#4', freq: 277.18, black: true, key: 'o' },
  { note: 'D4', freq: 293.66, black: false, key: 'l' },
  { note: 'D#4', freq: 311.13, black: true, key: 'p' },
  { note: 'E4', freq: 329.63, black: false, key: ';' },
  { note: 'F4', freq: 349.23, black: false, key: "'" },
  { note: 'F#4', freq: 369.99, black: true, key: ']' },
  { note: 'G4', freq: 392.0, black: false, key: 'z' },
  { note: 'G#4', freq: 415.3, black: true, key: '[' },
  { note: 'A4', freq: 440.0, black: false, key: 'x' },
  { note: 'A#4', freq: 466.16, black: true, key: '\\' },
  { note: 'B4', freq: 493.88, black: false, key: 'c' },
]

const NOTE_BY_NAME = new Map(NOTES.map((n) => [n.note, n]))
const NOTE_BY_KEY = new Map(NOTES.map((n) => [n.key, n.note]))

export const noteByName = (note: string): NoteDefinition | undefined => NOTE_BY_NAME.get(note)
export const noteForKey = (key: string): string | undefined => NOTE_BY_KEY.get(key.toLowerCase())
