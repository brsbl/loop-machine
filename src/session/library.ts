import type { ArpRate } from './schema'

/**
 * Starting material for exploring: ready-made loops and chords that work
 * together. Everything here sits in house music (four-on-the-floor, claps on
 * 2 and 4, off-beat hats) with a French touch, so trying things never lands
 * on noise.
 */

/**
 * Ready-made house loops, stored as share-link payloads, one per CHORD key:
 * deep, jackin', French, piano, tech, and garage house. The first one plays
 * when the app opens without a link.
 */
export const PRESETS: ReadonlyArray<{ name: string; link: string }> = [
  { name: 'Deep Night', link: '2~122~hihat.2222.990066~snare.0808.b33380~kick.8888.e60066~syn.2222.244800.u.16.t.9f.0' },
  { name: 'Jack Box', link: '2~124~hihat.ffff.80001a~snare.0809.b30066~kick.8888.e6004d~syn.9249.004890.u.16.q.9f.-1' },
  { name: 'French Filter', link: '2~124~hihat.2222.990099~snare.0808.cc3380~kick.8888.e60066~syn.db6d.044880.b.16.s.9f.0' },
  { name: 'Piano Hands', link: '2~123~hihat.2223.990066~snare.0808.cc4d80~kick.8888.e60066~syn.a2a2.891000.b.8.t.80.1' },
  { name: 'Warehouse', link: '2~125~hihat.3333.800033~snare.0808.99004d~kick.8888.ff004d~syn.7777.091200.d.16.i.bf.-1' },
  { name: 'Sunday Garage', link: '2~122~hihat.2222.9900b3~snare.080a.b34d80~kick.8888.e60066~syn.aaaa.011240.u.8.s.80.0' },
]

/** Seven-chords from one key (A minor / C major), so switching between any of them always works. */
export const CHORDS: ReadonlyArray<{ name: string; notes: readonly string[] }> = [
  { name: 'Am7', notes: ['A3', 'C4', 'E4', 'G4'] },
  { name: 'Cmaj7', notes: ['C3', 'E3', 'G3', 'B3'] },
  { name: 'Dm7', notes: ['D3', 'F3', 'A3', 'C4'] },
  { name: 'Em7', notes: ['E3', 'G3', 'B3', 'D4'] },
  { name: 'Fmaj7', notes: ['F3', 'A3', 'C4', 'E4'] },
  { name: 'G7', notes: ['G3', 'B3', 'D4', 'F4'] },
]

const toSteps = (on: readonly number[]): boolean[] => Array.from({ length: 16 }, (_, i) => on.includes(i + 1))

/** The synth's steps when you first hold a key with none set: off-beat stabs, so the keyboard always answers. */
export const DEFAULT_GATE: readonly boolean[] = toSteps([3, 7, 11, 15])

/** At 1/4 the arp only sounds on the beat, where off-beat stabs never land, so it gets the four beats instead. */
const QUARTER_GATE: readonly boolean[] = toSteps([1, 5, 9, 13])

/** The gate to fill in at each SPEED, so the first held key sounds at any rate. */
export const DEFAULT_GATES: Readonly<Record<ArpRate, readonly boolean[]>> = {
  '1/4': QUARTER_GATE,
  '1/8': DEFAULT_GATE,
  '1/16': DEFAULT_GATE,
}

const sameNotes = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((n, i) => n === b[i])

/** The chord exactly matching the held notes, if any. */
export const chordFor = (notes: readonly string[]) => CHORDS.find((c) => sameNotes(c.notes, notes))
