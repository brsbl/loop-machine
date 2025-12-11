/**
 * URL State utilities for persisting sequencer state in URL
 * Uses compact encoding: notes as hex, settings encoded
 */

// Helper: Boolean array to hex string (4 chars for 16 steps)
function stateToHex(stateArray) {
  const binaryString = stateArray.map(val => val ? '1' : '0').join('')
  return parseInt(binaryString, 2).toString(16).padStart(4, '0')
}

// Helper: Convert hex string back to boolean array
function hexToState(hexString, steps) {
  if (!hexString || hexString.length !== 4) return Array(steps).fill(false)
  const binaryString = parseInt(hexString, 16).toString(2).padStart(steps, '0')
  return binaryString.split('').map(char => char === '1')
}

// Helper: Encode float 0-1 to 2 hex chars (0-255)
function floatToHex(val) {
  const clamped = Math.max(0, Math.min(1, val))
  const int = Math.round(clamped * 255)
  return int.toString(16).padStart(2, '0')
}

// Helper: Decode 2 hex chars to float 0-1
function hexToFloat(hex, defaultValue = 0.8) {
  if (!hex || hex.length !== 2) return defaultValue
  // Validate hex characters before parsing
  if (!/^[0-9a-fA-F]{2}$/.test(hex)) return defaultValue
  const int = parseInt(hex, 16)
  // Safety check for NaN (shouldn't happen after regex, but defensive)
  if (Number.isNaN(int)) return defaultValue
  return int / 255
}

/**
 * Encode current state to URL
 * Format: notes_settings
 * - notes: 4 hex chars per instrument (16 steps)
 * - settings: 6 hex chars per instrument (volume 2, attack 2, decay 2)
 */
export function encodeStateToUrl(pattern, trackSettings, instruments) {
  let notesHex = ''
  let settingsHex = ''

  instruments.forEach(instrument => {
    // Notes (16 steps -> 4 hex chars)
    notesHex += stateToHex(pattern[instrument.id] || [])
    // Settings (volume, reverb, filter as 2 hex chars each)
    const settings = trackSettings[instrument.id] || {}
    settingsHex += floatToHex(settings.volume ?? 0.8)
    settingsHex += floatToHex(settings.reverb ?? 0)
    settingsHex += floatToHex(settings.filter ?? 1)
  })

  const compactState = `${notesHex}_${settingsHex}`
  const newUrl = window.location.pathname + '?s=' + compactState
  window.history.replaceState(null, '', newUrl)
}

/**
 * Decode state from URL
 */
export function decodeStateFromUrl(instruments, steps) {
  const params = new URLSearchParams(window.location.search)

  const result = {
    pattern: null,
    trackSettings: null,
  }

  const compactState = params.get('s')
  // Expected: 4 hex per instrument for notes + _ + 6 hex per instrument for settings
  const expectedLength = instruments.length * 4 + 1 + instruments.length * 6

  if (compactState && compactState.length === expectedLength && compactState.includes('_')) {
    try {
      const [notesPart, settingsPart] = compactState.split('_')
      const pattern = {}
      const trackSettings = {}
      let noteOffset = 0
      let settingsOffset = 0

      instruments.forEach(instrument => {
        // Load Notes
        const noteHex = notesPart.substring(noteOffset, noteOffset + 4)
        pattern[instrument.id] = hexToState(noteHex, steps)
        noteOffset += 4

        // Load Settings (volume, reverb, filter)
        const volumeHex = settingsPart.substring(settingsOffset, settingsOffset + 2)
        const reverbHex = settingsPart.substring(settingsOffset + 2, settingsOffset + 4)
        const filterHex = settingsPart.substring(settingsOffset + 4, settingsOffset + 6)
        trackSettings[instrument.id] = {
          volume: hexToFloat(volumeHex, 0.8),
          reverb: hexToFloat(reverbHex, 0),
          filter: hexToFloat(filterHex, 1),
          muted: false,
          solo: false,
        }
        settingsOffset += 6
      })

      result.pattern = pattern
      result.trackSettings = trackSettings
    } catch (error) {
      console.error('Error parsing URL state:', error)
    }
  }

  return result
}
