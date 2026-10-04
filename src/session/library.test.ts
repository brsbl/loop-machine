import { describe, expect, it } from 'vitest'
import { NOTES } from '../instruments'
import { CHORDS, chordFor, PRESETS } from './library'
import { decodeSession, encodeSession } from './url'

describe('library', () => {
  it('stores every pattern as a valid, canonical share link', () => {
    for (const p of PRESETS) expect(encodeSession(decodeSession(p.link))).toBe(p.link)
  })

  it('builds chords only from keys on the keyboard', () => {
    const keys = new Set(NOTES.map((n) => n.note))
    for (const c of CHORDS) expect(c.notes.every((n) => keys.has(n))).toBe(true)
    expect(chordFor(['A3', 'C4', 'E4', 'G4'])?.name).toBe('Am7')
  })
})
