import { describe, it, expect, beforeEach, vi } from 'vitest'
import { encodeStateToUrl, decodeStateFromUrl } from '../utils/urlState'

const mockInstruments = [
  { id: 'hihat', name: 'HI-HAT' },
  { id: 'snare', name: 'SNARE' },
  { id: 'kick', name: 'KICK' },
]

describe('urlState', () => {
  beforeEach(() => {
    // Reset URL before each test
    window.history.replaceState(null, '', '/')
  })

  describe('encodeStateToUrl', () => {
    it('encodes empty pattern correctly', () => {
      const pattern = {
        hihat: Array(16).fill(false),
        snare: Array(16).fill(false),
        kick: Array(16).fill(false),
      }
      const trackSettings = {
        hihat: { reverb: 0, delay: 0 },
        snare: { reverb: 0, delay: 0 },
        kick: { reverb: 0, delay: 0 },
      }

      encodeStateToUrl(pattern, trackSettings, mockInstruments, 120)

      expect(window.location.search).toBe('?s=000000000000_000000_120')
    })

    it('encodes pattern with active steps correctly', () => {
      const pattern = {
        hihat: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
        snare: Array(16).fill(false),
        kick: Array(16).fill(false),
      }
      const trackSettings = {
        hihat: { reverb: 0, delay: 0 },
        snare: { reverb: 0, delay: 0 },
        kick: { reverb: 0, delay: 0 },
      }

      encodeStateToUrl(pattern, trackSettings, mockInstruments, 120)

      // 1000100010001000 in binary = 0x8888
      expect(window.location.search).toContain('8888')
    })

    it('encodes BPM correctly', () => {
      const pattern = {
        hihat: Array(16).fill(false),
        snare: Array(16).fill(false),
        kick: Array(16).fill(false),
      }
      const trackSettings = {
        hihat: { reverb: 0, delay: 0 },
        snare: { reverb: 0, delay: 0 },
        kick: { reverb: 0, delay: 0 },
      }

      encodeStateToUrl(pattern, trackSettings, mockInstruments, 85)

      expect(window.location.search).toContain('_085')
    })

    it('encodes effects correctly', () => {
      const pattern = {
        hihat: Array(16).fill(false),
        snare: Array(16).fill(false),
        kick: Array(16).fill(false),
      }
      const trackSettings = {
        hihat: { reverb: 5, delay: 3 },
        snare: { reverb: 0, delay: 0 },
        kick: { reverb: 10, delay: 7 },
      }

      encodeStateToUrl(pattern, trackSettings, mockInstruments, 120)

      // hihat: 53, snare: 00, kick: a7
      expect(window.location.search).toContain('_5300a7_')
    })
  })

  describe('decodeStateFromUrl', () => {
    it('returns null values for empty URL', () => {
      const result = decodeStateFromUrl(mockInstruments, 16)

      expect(result.pattern).toBeNull()
      expect(result.trackSettings).toBeNull()
      expect(result.bpm).toBeNull()
    })

    it('decodes pattern correctly', () => {
      // Set URL with encoded state
      window.history.replaceState(null, '', '/?s=8888000000000000_000000_120')

      const result = decodeStateFromUrl(mockInstruments, 16)

      expect(result.pattern.hihat[0]).toBe(true)
      expect(result.pattern.hihat[4]).toBe(true)
      expect(result.pattern.hihat[8]).toBe(true)
      expect(result.pattern.hihat[12]).toBe(true)
      expect(result.pattern.hihat[1]).toBe(false)
    })

    it('decodes BPM correctly', () => {
      window.history.replaceState(null, '', '/?s=000000000000_000000_085')

      const result = decodeStateFromUrl(mockInstruments, 16)

      expect(result.bpm).toBe(85)
    })

    it('handles old URL format without BPM (backwards compatibility)', () => {
      window.history.replaceState(null, '', '/?s=000000000000_000000')

      const result = decodeStateFromUrl(mockInstruments, 16)

      expect(result.pattern).not.toBeNull()
      expect(result.bpm).toBeNull()
    })

    it('rejects BPM outside valid range', () => {
      window.history.replaceState(null, '', '/?s=000000000000_000000_300')

      const result = decodeStateFromUrl(mockInstruments, 16)

      expect(result.bpm).toBeNull()
    })

    it('decodes effects correctly', () => {
      window.history.replaceState(null, '', '/?s=000000000000_5300a7_120')

      const result = decodeStateFromUrl(mockInstruments, 16)

      expect(result.trackSettings.hihat.reverb).toBe(5)
      expect(result.trackSettings.hihat.delay).toBe(3)
      expect(result.trackSettings.snare.reverb).toBe(0)
      expect(result.trackSettings.kick.reverb).toBe(10)
      expect(result.trackSettings.kick.delay).toBe(7)
    })
  })

  describe('round-trip encoding/decoding', () => {
    it('preserves state through encode/decode cycle', () => {
      const originalPattern = {
        hihat: [true, true, false, false, true, true, false, false, true, true, false, false, true, true, false, false],
        snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
        kick: [true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false],
      }
      const originalSettings = {
        hihat: { reverb: 3, delay: 5 },
        snare: { reverb: 0, delay: 2 },
        kick: { reverb: 8, delay: 0 },
      }
      const originalBpm = 140

      encodeStateToUrl(originalPattern, originalSettings, mockInstruments, originalBpm)
      const decoded = decodeStateFromUrl(mockInstruments, 16)

      expect(decoded.pattern.hihat).toEqual(originalPattern.hihat)
      expect(decoded.pattern.snare).toEqual(originalPattern.snare)
      expect(decoded.pattern.kick).toEqual(originalPattern.kick)
      expect(decoded.trackSettings.hihat.reverb).toBe(originalSettings.hihat.reverb)
      expect(decoded.trackSettings.hihat.delay).toBe(originalSettings.hihat.delay)
      expect(decoded.bpm).toBe(originalBpm)
    })
  })
})
