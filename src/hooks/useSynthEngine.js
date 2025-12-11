import { useState, useRef, useCallback, useEffect } from 'react'

/**
 * Custom hook for oscillator-based synthesis
 * Manages note playback with ADSR envelope and waveform selection
 */
export function useSynthEngine() {
  const [waveform, setWaveformState] = useState('sawtooth')
  const [volume, setVolumeState] = useState(0.5)

  const audioContextRef = useRef(null)
  const masterGainRef = useRef(null)
  const limiterRef = useRef(null)
  const activeNotesRef = useRef(new Map()) // noteId -> { oscillator, gainNode }
  const waveformRef = useRef('sawtooth')
  const volumeRef = useRef(0.5)

  // Keep refs in sync with state
  useEffect(() => {
    waveformRef.current = waveform
  }, [waveform])

  useEffect(() => {
    volumeRef.current = volume
    if (masterGainRef.current && audioContextRef.current) {
      masterGainRef.current.gain.setValueAtTime(
        volume,
        audioContextRef.current.currentTime
      )
    }
  }, [volume])

  // Initialize audio context lazily (on first user interaction)
  const ensureContext = useCallback(() => {
    if (audioContextRef.current) return audioContextRef.current

    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    audioContextRef.current = ctx

    // Create master gain
    const masterGain = ctx.createGain()
    masterGain.gain.value = volumeRef.current
    masterGainRef.current = masterGain

    // Create limiter to prevent clipping
    const limiter = ctx.createDynamicsCompressor()
    limiter.threshold.value = -3
    limiter.knee.value = 0
    limiter.ratio.value = 20
    limiter.attack.value = 0.001
    limiter.release.value = 0.1
    limiterRef.current = limiter

    // Connect: masterGain -> limiter -> destination
    masterGain.connect(limiter)
    limiter.connect(ctx.destination)

    return ctx
  }, [])

  // Resume context if suspended (browser autoplay policy)
  const resumeContext = useCallback(async () => {
    const ctx = ensureContext()
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }
  }, [ensureContext])

  // ADSR envelope parameters
  const envelope = {
    attack: 0.01, // 10ms
    decay: 0.1, // 100ms
    sustain: 0.7, // 70% of max
    release: 0.2, // 200ms
  }

  // Play a note by frequency
  const playNote = useCallback(
    (noteId, frequency) => {
      const ctx = ensureContext()
      if (ctx.state === 'suspended') {
        ctx.resume()
      }

      // Don't play if already playing
      if (activeNotesRef.current.has(noteId)) return

      const now = ctx.currentTime

      // Create oscillator
      const oscillator = ctx.createOscillator()
      oscillator.type = waveformRef.current
      oscillator.frequency.setValueAtTime(frequency, now)

      // Create gain for envelope
      const gainNode = ctx.createGain()
      gainNode.gain.setValueAtTime(0, now)

      // Attack
      gainNode.gain.linearRampToValueAtTime(1, now + envelope.attack)
      // Decay to sustain level
      gainNode.gain.linearRampToValueAtTime(
        envelope.sustain,
        now + envelope.attack + envelope.decay
      )

      // Connect: oscillator -> gainNode -> masterGain
      oscillator.connect(gainNode)
      gainNode.connect(masterGainRef.current)

      // Start oscillator
      oscillator.start(now)

      // Store reference for stopping later
      activeNotesRef.current.set(noteId, { oscillator, gainNode })
    },
    [ensureContext]
  )

  // Stop a note
  const stopNote = useCallback((noteId) => {
    const noteData = activeNotesRef.current.get(noteId)
    if (!noteData) return

    const { oscillator, gainNode } = noteData
    const ctx = audioContextRef.current
    if (!ctx) return

    const now = ctx.currentTime

    // Release envelope
    gainNode.gain.cancelScheduledValues(now)
    gainNode.gain.setValueAtTime(gainNode.gain.value, now)
    gainNode.gain.linearRampToValueAtTime(0, now + envelope.release)

    // Stop oscillator after release
    oscillator.stop(now + envelope.release + 0.01)

    // Remove from active notes
    activeNotesRef.current.delete(noteId)
  }, [])

  // Stop all notes
  const stopAllNotes = useCallback(() => {
    for (const noteId of activeNotesRef.current.keys()) {
      stopNote(noteId)
    }
  }, [stopNote])

  // Set waveform type
  const setWaveform = useCallback((type) => {
    setWaveformState(type)
    // Update any currently playing oscillators
    for (const { oscillator } of activeNotesRef.current.values()) {
      oscillator.type = type
    }
  }, [])

  // Set master volume
  const setVolume = useCallback((value) => {
    setVolumeState(value)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllNotes()
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close()
      }
    }
  }, [stopAllNotes])

  return {
    playNote,
    stopNote,
    stopAllNotes,
    setWaveform,
    setVolume,
    waveform,
    volume,
    resumeContext,
  }
}

export default useSynthEngine
