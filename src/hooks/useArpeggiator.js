import { useState, useCallback, useRef } from 'react'
import { getNoteByName } from '../config/keyboard'

/**
 * Arpeggiator hook - cycles through held notes in a pattern
 */
export function useArpeggiator(synth) {
  // 16-step gate pattern
  const [pattern, setPattern] = useState(() => Array(16).fill(false))
  // Notes currently held (toggled on)
  const [heldNotes, setHeldNotes] = useState(() => new Set())
  // Arpeggiator mode: 'up', 'down', 'up-down'
  const [mode, setMode] = useState('up')
  // Rate: '1/4', '1/8', '1/16'
  const [rate, setRate] = useState('1/16')

  // Refs for scheduling (don't trigger re-renders)
  const arpStepRef = useRef(0)
  const lastPlayedNoteRef = useRef(null)
  const directionRef = useRef(1) // 1 = up, -1 = down (for up-down mode)
  const onNoteChangeRef = useRef(null)

  // Toggle a step in the gate pattern
  const toggleStep = useCallback((index) => {
    setPattern((prev) =>
      prev.map((val, i) => (i === index ? !val : val))
    )
  }, [])

  // Toggle a note on/off
  const toggleNote = useCallback((noteName) => {
    setHeldNotes((prev) => {
      const next = new Set(prev)
      if (next.has(noteName)) {
        next.delete(noteName)
      } else {
        next.add(noteName)
      }
      return next
    })
  }, [])

  // Clear all held notes
  const clearNotes = useCallback(() => {
    setHeldNotes(new Set())
  }, [])

  // Set callback for note change (for keyboard highlighting)
  const setOnNoteChange = useCallback((callback) => {
    onNoteChangeRef.current = callback
  }, [])

  // Get sorted notes by frequency (low to high)
  const getSortedNotes = useCallback(() => {
    return [...heldNotes].sort((a, b) => {
      const freqA = getNoteByName(a)?.freq || 0
      const freqB = getNoteByName(b)?.freq || 0
      return freqA - freqB
    })
  }, [heldNotes])

  // Calculate which note to play based on mode
  const getNextNoteIndex = useCallback((sortedNotes) => {
    const len = sortedNotes.length
    if (len === 0) return -1

    const step = arpStepRef.current

    if (mode === 'up') {
      return step % len
    } else if (mode === 'down') {
      return (len - 1) - (step % len)
    } else if (mode === 'up-down') {
      if (len === 1) return 0
      // Ping-pong: 0,1,2,1,0,1,2,1...
      const cycle = len * 2 - 2
      const pos = step % cycle
      if (pos < len) {
        return pos
      } else {
        return cycle - pos
      }
    }
    return 0
  }, [mode])

  // Schedule arp notes - called by sequencer
  const scheduleArpNote = useCallback((currentStep, noteTime, stepTime) => {
    // Check if gate is open for this step
    if (!pattern[currentStep]) {
      return
    }

    // Rate determines how often we advance the arp
    const stepsPerArpNote = { '1/4': 4, '1/8': 2, '1/16': 1 }
    const skipSteps = stepsPerArpNote[rate] || 1

    // Only play on matching steps
    if (currentStep % skipSteps !== 0) {
      return
    }

    const sortedNotes = getSortedNotes()
    if (sortedNotes.length === 0) return

    const noteIndex = getNextNoteIndex(sortedNotes)
    if (noteIndex < 0) return

    const noteName = sortedNotes[noteIndex]
    const noteData = getNoteByName(noteName)
    if (!noteData) return

    // Stop previous note
    if (lastPlayedNoteRef.current) {
      synth.stopNote('arp-' + lastPlayedNoteRef.current)
    }

    // Play new note
    synth.playNote('arp-' + noteName, noteData.freq, noteTime)
    lastPlayedNoteRef.current = noteName

    // Notify keyboard of current note
    if (onNoteChangeRef.current) {
      onNoteChangeRef.current(noteName)
    }

    // Advance arp step
    arpStepRef.current++
  }, [pattern, rate, getSortedNotes, getNextNoteIndex, synth])

  // Stop current arp note (called when playback stops)
  const stopArp = useCallback(() => {
    if (lastPlayedNoteRef.current) {
      synth.stopNote('arp-' + lastPlayedNoteRef.current)
      lastPlayedNoteRef.current = null
    }
    arpStepRef.current = 0
    directionRef.current = 1
    if (onNoteChangeRef.current) {
      onNoteChangeRef.current(null)
    }
  }, [synth])

  // Reset pattern
  const resetPattern = useCallback(() => {
    setPattern(Array(16).fill(false))
  }, [])

  return {
    // State
    pattern,
    heldNotes,
    mode,
    rate,

    // Actions
    toggleStep,
    toggleNote,
    clearNotes,
    setMode,
    setRate,
    resetPattern,
    setOnNoteChange,

    // Scheduling
    scheduleArpNote,
    stopArp,
  }
}

export default useArpeggiator
