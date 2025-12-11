import { describe, it, expect } from 'vitest'
import { NOTES, QWERTY_MAP, NOTE_TO_KEY, getNoteByName, WAVEFORMS } from '../config/keyboard'

describe('keyboard config', () => {
  describe('NOTES', () => {
    it('has 24 notes (2 octaves)', () => {
      expect(NOTES).toHaveLength(24)
    })

    it('starts with C3 and ends with B4', () => {
      expect(NOTES[0].note).toBe('C3')
      expect(NOTES[23].note).toBe('B4')
    })

    it('has correct frequency for A4 (440Hz)', () => {
      const a4 = NOTES.find((n) => n.note === 'A4')
      expect(a4.freq).toBe(440.0)
    })

    it('has 14 white keys and 10 black keys', () => {
      const whiteKeys = NOTES.filter((n) => n.type === 'white')
      const blackKeys = NOTES.filter((n) => n.type === 'black')
      expect(whiteKeys).toHaveLength(14)
      expect(blackKeys).toHaveLength(10)
    })

    it('all notes have required properties', () => {
      NOTES.forEach((note) => {
        expect(note).toHaveProperty('note')
        expect(note).toHaveProperty('freq')
        expect(note).toHaveProperty('type')
        expect(typeof note.note).toBe('string')
        expect(typeof note.freq).toBe('number')
        expect(['white', 'black']).toContain(note.type)
      })
    })

    it('frequencies increase with each note', () => {
      for (let i = 1; i < NOTES.length; i++) {
        expect(NOTES[i].freq).toBeGreaterThan(NOTES[i - 1].freq)
      }
    })
  })

  describe('QWERTY_MAP', () => {
    it('maps lowercase keys to note names', () => {
      expect(QWERTY_MAP['a']).toBe('C3')
      expect(QWERTY_MAP['w']).toBe('C#3')
      expect(QWERTY_MAP['k']).toBe('C4')
    })

    it('all mapped notes exist in NOTES', () => {
      const noteNames = NOTES.map((n) => n.note)
      Object.values(QWERTY_MAP).forEach((noteName) => {
        expect(noteNames).toContain(noteName)
      })
    })
  })

  describe('NOTE_TO_KEY', () => {
    it('is reverse of QWERTY_MAP', () => {
      Object.entries(QWERTY_MAP).forEach(([key, note]) => {
        expect(NOTE_TO_KEY[note]).toBe(key)
      })
    })
  })

  describe('getNoteByName', () => {
    it('returns note data for valid note', () => {
      const c3 = getNoteByName('C3')
      expect(c3).toEqual({ note: 'C3', freq: 130.81, type: 'white' })
    })

    it('returns undefined for invalid note', () => {
      expect(getNoteByName('X9')).toBeUndefined()
    })
  })

  describe('WAVEFORMS', () => {
    it('contains all four waveform types', () => {
      expect(WAVEFORMS).toContain('sine')
      expect(WAVEFORMS).toContain('square')
      expect(WAVEFORMS).toContain('sawtooth')
      expect(WAVEFORMS).toContain('triangle')
    })

    it('has sawtooth as default (first)', () => {
      expect(WAVEFORMS[0]).toBe('sawtooth')
    })
  })
})
