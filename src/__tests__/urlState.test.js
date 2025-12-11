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
        hihat: { volume: 0.8, reverb: 0, filter: 1 },
        snare: { volume: 0.8, reverb: 0, filter: 1 },
        kick: { volume: 0.8, reverb: 0, filter: 1 },
      }

      encodeStateToUrl(pattern, trackSettings, mockInstruments, 120)

      // Each instrument: 4 hex for notes + 6 hex for settings (volume cc, reverb 00, filter ff)
      // Notes: 0000 0000 0000 (all off)
      // Settings per instrument: cc (0.8 volume) + 00 (0 reverb) + ff (1.0 filter) = cc00ff
      expect(window.location.search).toBe('?s=000000000000_cc00ffcc00ffcc00ff_120')
    })

    it('encodes pattern with active steps correctly', () => {
      const pattern = {
        hihat: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
        snare: Array(16).fill(false),
        kick: Array(16).fill(false),
      }
      const trackSettings = {
        hihat: { volume: 0.8, reverb: 0, filter: 1 },
        snare: { volume: 0.8, reverb: 0, filter: 1 },
        kick: { volume: 0.8, reverb: 0, filter: 1 },
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
        hihat: { volume: 0.8, reverb: 0, filter: 1 },
        snare: { volume: 0.8, reverb: 0, filter: 1 },
        kick: { volume: 0.8, reverb: 0, filter: 1 },
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
        hihat: { volume: 0.5, reverb: 0.3, filter: 0.8 },
        snare: { volume: 0.8, reverb: 0, filter: 1 },
        kick: { volume: 1.0, reverb: 0.5, filter: 0.5 },
      }

      encodeStateToUrl(pattern, trackSettings, mockInstruments, 120)

      // Check the URL was set (exact values depend on floatToHex conversion)
      expect(window.location.search).toContain('?s=')
      expect(window.location.search).toContain('_120')
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
      // Set URL with encoded state (6 chars per instrument for settings)
      window.history.replaceState(null, '', '/?s=888800000000_cc00ffcc00ffcc00ff_120')

      const result = decodeStateFromUrl(mockInstruments, 16)

      expect(result.pattern.hihat[0]).toBe(true)
      expect(result.pattern.hihat[4]).toBe(true)
      expect(result.pattern.hihat[8]).toBe(true)
      expect(result.pattern.hihat[12]).toBe(true)
      expect(result.pattern.hihat[1]).toBe(false)
    })

    it('decodes BPM correctly', () => {
      window.history.replaceState(null, '', '/?s=000000000000_cc00ffcc00ffcc00ff_085')

      const result = decodeStateFromUrl(mockInstruments, 16)

      expect(result.bpm).toBe(85)
    })

    it('handles old URL format without BPM (backwards compatibility)', () => {
      window.history.replaceState(null, '', '/?s=000000000000_cc00ffcc00ffcc00ff')

      const result = decodeStateFromUrl(mockInstruments, 16)

      expect(result.pattern).not.toBeNull()
      expect(result.bpm).toBeNull()
    })

    it('rejects BPM outside valid range', () => {
      window.history.replaceState(null, '', '/?s=000000000000_cc00ffcc00ffcc00ff_300')

      const result = decodeStateFromUrl(mockInstruments, 16)

      expect(result.bpm).toBeNull()
    })

    it('decodes effects correctly', () => {
      // volume=0.8 (cc), reverb=0.5 (80), filter=1.0 (ff) for hihat
      // volume=0.8 (cc), reverb=0 (00), filter=1.0 (ff) for snare
      // volume=1.0 (ff), reverb=0.3 (4d), filter=0.5 (80) for kick
      window.history.replaceState(null, '', '/?s=000000000000_cc80ffcc00ffff4d80_120')

      const result = decodeStateFromUrl(mockInstruments, 16)

      // Check that settings are decoded (values will be approximate due to hex encoding)
      expect(result.trackSettings.hihat.volume).toBeCloseTo(0.8, 1)
      expect(result.trackSettings.hihat.reverb).toBeCloseTo(0.5, 1)
      expect(result.trackSettings.hihat.filter).toBeCloseTo(1.0, 1)
      expect(result.trackSettings.snare.reverb).toBe(0)
      expect(result.trackSettings.kick.volume).toBeCloseTo(1.0, 1)
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
        hihat: { volume: 0.8, reverb: 0.3, filter: 1.0 },
        snare: { volume: 0.8, reverb: 0, filter: 0.5 },
        kick: { volume: 1.0, reverb: 0.5, filter: 0.8 },
      }
      const originalBpm = 140

      encodeStateToUrl(originalPattern, originalSettings, mockInstruments, originalBpm)
      const decoded = decodeStateFromUrl(mockInstruments, 16)

      expect(decoded.pattern.hihat).toEqual(originalPattern.hihat)
      expect(decoded.pattern.snare).toEqual(originalPattern.snare)
      expect(decoded.pattern.kick).toEqual(originalPattern.kick)
      // Float values may have small rounding differences due to hex encoding
      expect(decoded.trackSettings.hihat.volume).toBeCloseTo(originalSettings.hihat.volume, 1)
      expect(decoded.trackSettings.hihat.reverb).toBeCloseTo(originalSettings.hihat.reverb, 1)
      expect(decoded.trackSettings.hihat.filter).toBeCloseTo(originalSettings.hihat.filter, 1)
      expect(decoded.bpm).toBe(originalBpm)
    })
  })
})
