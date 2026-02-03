import { useState, useRef, useCallback, useEffect } from 'react'

/**
 * Custom hook for oscillator-based synthesis
 * Manages note playback with ADSR envelope and waveform selection
 * @param {AudioContext} sharedContext - Optional shared AudioContext from drum engine
 * @param {GainNode} sharedMasterGain - Optional shared master gain node for routing audio
 */
export function useSynthEngine(sharedContext = null, sharedMasterGain = null) {
  const [waveform, setWaveformState] = useState('sawtooth')
  const [volume, setVolumeState] = useState(0.5)

  const audioContextRef = useRef(null)
  const masterGainRef = useRef(null)
  const limiterRef = useRef(null)
  const activeNotesRef = useRef(new Map()) // noteId -> { oscillator, gainNode }
  const waveformRef = useRef('sawtooth')
  const volumeRef = useRef(0.5)
  const isUsingSharedContext = useRef(false)

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

    // Use shared context if provided, otherwise create our own
    const ctx = sharedContext || new (window.AudioContext || window.webkitAudioContext)()
    audioContextRef.current = ctx
    isUsingSharedContext.current = !!sharedContext

    // Create master gain
    const masterGain = ctx.createGain()
    masterGain.gain.value = volumeRef.current
    masterGainRef.current = masterGain

    if (sharedContext && sharedMasterGain) {
      // If using shared context, connect our master gain to the shared master gain
      // This routes synth audio through the same analyser as drums
      masterGain.connect(sharedMasterGain)
    } else {
      // Create limiter to prevent clipping (only for standalone mode)
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
    }

    return ctx
  }, [sharedContext, sharedMasterGain])

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

  // Get filter cutoff based on waveform type
  const getFilterCutoff = (waveformType) => {
    switch (waveformType) {
      case 'sawtooth':
      case 'square':
        return 2500
      case 'triangle':
      case 'sine':
      default:
        return 8000
    }
  }

  // Play a note by frequency
  const playNote = useCallback(
    (noteId, frequency, time) => {
      const ctx = ensureContext()
      if (ctx.state === 'suspended') {
        ctx.resume()
      }

      // Don't play if already playing
      if (activeNotesRef.current.has(noteId)) return

      const now = time ?? ctx.currentTime

      // Create oscillator
      const oscillator = ctx.createOscillator()
      oscillator.type = waveformRef.current
      oscillator.frequency.setValueAtTime(frequency, now)

      // Create low-pass filter to tame harsh high frequencies
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(getFilterCutoff(waveformRef.current), now)
      filter.Q.setValueAtTime(0.7, now)

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

      // Connect: oscillator -> filter -> gainNode -> masterGain
      oscillator.connect(filter)
      filter.connect(gainNode)
      gainNode.connect(masterGainRef.current)

      // Start oscillator
      oscillator.start(now)

      // Store reference for stopping later
      activeNotesRef.current.set(noteId, { oscillator, gainNode, filter })
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
    // Update any currently playing oscillators and their filters
    const ctx = audioContextRef.current
    for (const { oscillator, filter } of activeNotesRef.current.values()) {
      oscillator.type = type
      if (filter && ctx) {
        filter.frequency.setValueAtTime(getFilterCutoff(type), ctx.currentTime)
      }
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
      // Only close context if we created it ourselves (not shared)
      if (!isUsingSharedContext.current && audioContextRef.current && audioContextRef.current.state !== 'closed') {
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
