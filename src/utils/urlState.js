/**
 * URL State utilities for persisting sequencer state in URL
 * Uses compact encoding: notes as hex, effects as single chars
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

// Helper: Convert slider value (0-10) to char ('0'-'9', 'a')
function valueToChar(val) {
  const num = parseInt(val, 10)
  if (num >= 0 && num <= 9) return String(num)
  if (num === 10) return 'a'
  return '0'
}

// Helper: Convert char back to slider value (0-10)
function charToValue(char) {
  if (char >= '0' && char <= '9') return parseInt(char, 10)
  if (char === 'a') return 10
  return 0
}

/**
 * Encode current state to URL
 */
export function encodeStateToUrl(pattern, trackSettings, instruments) {
  let notesHex = ''
  let effectsChars = ''

  instruments.forEach(instrument => {
    // Notes (16 steps -> 4 hex chars)
    notesHex += stateToHex(pattern[instrument.id] || [])
    // Effects (reverb, delay as single chars each)
    const settings = trackSettings[instrument.id] || {}
    effectsChars += valueToChar(settings.reverb || 0)
    effectsChars += valueToChar(settings.delay || 0)
  })

  const compactState = `${notesHex}_${effectsChars}`
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
  const expectedLength = instruments.length * 4 + 1 + instruments.length * 2 // 4 hex + _ + 2 chars per instrument

  if (compactState && compactState.length === expectedLength && compactState.includes('_')) {
    try {
      const [notesPart, effectsPart] = compactState.split('_')
      const pattern = {}
      const trackSettings = {}
      let noteOffset = 0
      let effectOffset = 0

      instruments.forEach(instrument => {
        // Load Notes
        const noteHex = notesPart.substring(noteOffset, noteOffset + 4)
        pattern[instrument.id] = hexToState(noteHex, steps)
        noteOffset += 4

        // Load Effects
        const reverbChar = effectsPart[effectOffset]
        const delayChar = effectsPart[effectOffset + 1]
        trackSettings[instrument.id] = {
          volume: 0.8,
          muted: false,
          solo: false,
          reverb: charToValue(reverbChar),
          delay: charToValue(delayChar)
        }
        effectOffset += 2
      })

      result.pattern = pattern
      result.trackSettings = trackSettings
    } catch (error) {
      console.error('Error parsing URL state:', error)
    }
  }

  return result
}
