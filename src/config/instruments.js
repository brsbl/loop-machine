/**
 * Instrument configuration for the drum machine.
 * Add new instruments by adding entries to this array.
 */

export const DEFAULT_INSTRUMENTS = [
  {
    id: 'hihat',
    name: 'HI-HAT',
    path: '/808 Samples/hi hat (30).wav',
    color: '#f5a623',
  },
  {
    id: 'snare',
    name: 'SNARE',
    path: '/808 Samples/snare.WAV',
    color: '#f5a623',
  },
  {
    id: 'kick',
    name: 'KICK',
    path: '/808 Samples/kick.WAV',
    color: '#f5a623',
  },
]

/**
 * Default track settings for each instrument
 */
export const DEFAULT_TRACK_SETTINGS = {
  volume: 0.8,
  muted: false,
  solo: false,
  reverb: 0,
  delay: 0,
}

/**
 * Sequencer configuration
 */
export const SEQUENCER_CONFIG = {
  steps: 12,
  bpm: 120,
  scheduleAheadTime: 0.1, // seconds
  schedulerInterval: 25,   // milliseconds
}

/**
 * Helper to create initial track settings for all instruments
 */
export function createInitialTrackSettings(instruments) {
  const settings = {}
  instruments.forEach(inst => {
    settings[inst.id] = { ...DEFAULT_TRACK_SETTINGS }
  })
  return settings
}

/**
 * Helper to create initial pattern state for all instruments
 */
export function createInitialPattern(instruments, steps) {
  const pattern = {}
  instruments.forEach(inst => {
    pattern[inst.id] = Array(steps).fill(false)
  })
  return pattern
}
