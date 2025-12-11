/**
 * Keyboard configuration for 2-octave synth (C3-B4)
 * A4 = 440Hz standard tuning
 */

export const NOTES = [
  // Octave 3
  { note: 'C3', freq: 130.81, type: 'white' },
  { note: 'C#3', freq: 138.59, type: 'black' },
  { note: 'D3', freq: 146.83, type: 'white' },
  { note: 'D#3', freq: 155.56, type: 'black' },
  { note: 'E3', freq: 164.81, type: 'white' },
  { note: 'F3', freq: 174.61, type: 'white' },
  { note: 'F#3', freq: 185.0, type: 'black' },
  { note: 'G3', freq: 196.0, type: 'white' },
  { note: 'G#3', freq: 207.65, type: 'black' },
  { note: 'A3', freq: 220.0, type: 'white' },
  { note: 'A#3', freq: 233.08, type: 'black' },
  { note: 'B3', freq: 246.94, type: 'white' },
  // Octave 4
  { note: 'C4', freq: 261.63, type: 'white' },
  { note: 'C#4', freq: 277.18, type: 'black' },
  { note: 'D4', freq: 293.66, type: 'white' },
  { note: 'D#4', freq: 311.13, type: 'black' },
  { note: 'E4', freq: 329.63, type: 'white' },
  { note: 'F4', freq: 349.23, type: 'white' },
  { note: 'F#4', freq: 369.99, type: 'black' },
  { note: 'G4', freq: 392.0, type: 'white' },
  { note: 'G#4', freq: 415.3, type: 'black' },
  { note: 'A4', freq: 440.0, type: 'white' },
  { note: 'A#4', freq: 466.16, type: 'black' },
  { note: 'B4', freq: 493.88, type: 'white' },
]

// Map QWERTY keys to notes
// Layout:
//   W E   T Y U   O P
//  A S D F G H J K L ;
export const QWERTY_MAP = {
  // Bottom row - white keys (octave 3)
  a: 'C3',
  s: 'D3',
  d: 'E3',
  f: 'F3',
  g: 'G3',
  h: 'A3',
  j: 'B3',
  // Bottom row - white keys (octave 4)
  k: 'C4',
  l: 'D4',
  ';': 'E4',
  "'": 'F4',
  // Top row - black keys (octave 3)
  w: 'C#3',
  e: 'D#3',
  t: 'F#3',
  y: 'G#3',
  u: 'A#3',
  // Top row - black keys (octave 4)
  o: 'C#4',
  p: 'D#4',
  ']': 'F#4',
  // Additional keys for remaining notes
  z: 'G4',
  x: 'A4',
  c: 'B4',
  '[': 'G#4',
  '\\': 'A#4',
}

// Reverse lookup: note -> QWERTY key (for displaying hints)
export const NOTE_TO_KEY = Object.fromEntries(
  Object.entries(QWERTY_MAP).map(([key, note]) => [note, key])
)

// Get note data by note name
export const getNoteByName = (noteName) => NOTES.find((n) => n.note === noteName)

// Available waveforms
export const WAVEFORMS = ['sawtooth', 'square', 'sine', 'triangle']
