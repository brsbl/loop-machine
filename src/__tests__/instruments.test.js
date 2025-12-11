import { describe, it, expect } from 'vitest'
import {
  DEFAULT_INSTRUMENTS,
  DEFAULT_TRACK_SETTINGS,
  SEQUENCER_CONFIG,
  createInitialTrackSettings,
  createInitialPattern,
} from '../config/instruments'

describe('instruments config', () => {
  describe('DEFAULT_INSTRUMENTS', () => {
    it('contains 3 instruments', () => {
      expect(DEFAULT_INSTRUMENTS).toHaveLength(3)
    })

    it('has hihat, snare, and kick', () => {
      const ids = DEFAULT_INSTRUMENTS.map(i => i.id)
      expect(ids).toContain('hihat')
      expect(ids).toContain('snare')
      expect(ids).toContain('kick')
    })

    it('each instrument has required properties', () => {
      DEFAULT_INSTRUMENTS.forEach(instrument => {
        expect(instrument).toHaveProperty('id')
        expect(instrument).toHaveProperty('name')
        expect(instrument).toHaveProperty('path')
        expect(instrument).toHaveProperty('color')
      })
    })

    it('each instrument has a valid audio path', () => {
      DEFAULT_INSTRUMENTS.forEach(instrument => {
        expect(instrument.path).toMatch(/\.wav$/i)
      })
    })
  })

  describe('DEFAULT_TRACK_SETTINGS', () => {
    it('has default volume of 0.8', () => {
      expect(DEFAULT_TRACK_SETTINGS.volume).toBe(0.8)
    })

    it('has default reverb of 0', () => {
      expect(DEFAULT_TRACK_SETTINGS.reverb).toBe(0)
    })

    it('has default filter of 1', () => {
      expect(DEFAULT_TRACK_SETTINGS.filter).toBe(1)
    })

    it('is not muted by default', () => {
      expect(DEFAULT_TRACK_SETTINGS.muted).toBe(false)
    })

    it('is not solo by default', () => {
      expect(DEFAULT_TRACK_SETTINGS.solo).toBe(false)
    })
  })

  describe('SEQUENCER_CONFIG', () => {
    it('has 16 steps', () => {
      expect(SEQUENCER_CONFIG.steps).toBe(16)
    })

    it('has default BPM of 120', () => {
      expect(SEQUENCER_CONFIG.bpm).toBe(120)
    })

    it('has scheduleAheadTime', () => {
      expect(SEQUENCER_CONFIG.scheduleAheadTime).toBeDefined()
      expect(typeof SEQUENCER_CONFIG.scheduleAheadTime).toBe('number')
    })

    it('has schedulerInterval', () => {
      expect(SEQUENCER_CONFIG.schedulerInterval).toBeDefined()
      expect(typeof SEQUENCER_CONFIG.schedulerInterval).toBe('number')
    })
  })

  describe('createInitialTrackSettings', () => {
    it('creates settings for each instrument', () => {
      const instruments = [{ id: 'test1' }, { id: 'test2' }]
      const settings = createInitialTrackSettings(instruments)

      expect(settings).toHaveProperty('test1')
      expect(settings).toHaveProperty('test2')
    })

    it('applies default settings to each instrument', () => {
      const instruments = [{ id: 'test' }]
      const settings = createInitialTrackSettings(instruments)

      expect(settings.test.volume).toBe(DEFAULT_TRACK_SETTINGS.volume)
      expect(settings.test.reverb).toBe(DEFAULT_TRACK_SETTINGS.reverb)
      expect(settings.test.filter).toBe(DEFAULT_TRACK_SETTINGS.filter)
      expect(settings.test.muted).toBe(DEFAULT_TRACK_SETTINGS.muted)
      expect(settings.test.solo).toBe(DEFAULT_TRACK_SETTINGS.solo)
    })

    it('creates independent settings objects', () => {
      const instruments = [{ id: 'a' }, { id: 'b' }]
      const settings = createInitialTrackSettings(instruments)

      settings.a.volume = 0.5
      expect(settings.b.volume).toBe(0.8)
    })

    it('returns empty object for empty instruments array', () => {
      const settings = createInitialTrackSettings([])
      expect(settings).toEqual({})
    })
  })

  describe('createInitialPattern', () => {
    it('creates pattern for each instrument', () => {
      const instruments = [{ id: 'test1' }, { id: 'test2' }]
      const pattern = createInitialPattern(instruments, 16)

      expect(pattern).toHaveProperty('test1')
      expect(pattern).toHaveProperty('test2')
    })

    it('creates arrays with correct number of steps', () => {
      const instruments = [{ id: 'test' }]
      const pattern = createInitialPattern(instruments, 16)

      expect(pattern.test).toHaveLength(16)
    })

    it('initializes all steps to false', () => {
      const instruments = [{ id: 'test' }]
      const pattern = createInitialPattern(instruments, 8)

      pattern.test.forEach(step => {
        expect(step).toBe(false)
      })
    })

    it('creates independent pattern arrays', () => {
      const instruments = [{ id: 'a' }, { id: 'b' }]
      const pattern = createInitialPattern(instruments, 4)

      pattern.a[0] = true
      expect(pattern.b[0]).toBe(false)
    })

    it('returns empty object for empty instruments array', () => {
      const pattern = createInitialPattern([], 16)
      expect(pattern).toEqual({})
    })
  })
})
