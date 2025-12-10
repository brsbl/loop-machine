import { useState, useRef, useCallback, useEffect } from 'react'

/**
 * Custom hook for managing Web Audio API
 * Handles loading sounds, playback with reverb and lowpass filter
 */
export function useAudioEngine(instruments) {
  const [isLoading, setIsLoading] = useState(true)
  const audioContextRef = useRef(null)
  const audioBuffersRef = useRef({})
  const effectNodesRef = useRef({})
  const initCountRef = useRef(0)

  // Initialize audio context and load all instrument samples
  useEffect(() => {
    const currentInit = ++initCountRef.current

    const initAudio = async () => {
      try {
        // Close any existing context first
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close()
        }

        const ctx = new (window.AudioContext || window.webkitAudioContext)()
        audioContextRef.current = ctx

        // Create effect nodes for each instrument
        instruments.forEach(instrument => {
          const mainGain = ctx.createGain()
          const reverbGain = ctx.createGain()
          const outputGain = ctx.createGain()
          const lowpassFilter = ctx.createBiquadFilter()

          // Create delay-based reverb effect
          const delay1 = ctx.createDelay(1.0)
          const delay2 = ctx.createDelay(1.0)
          const feedback = ctx.createGain()

          // Set delay times for reverb-like effect
          delay1.delayTime.value = 0.05
          delay2.delayTime.value = 0.08
          feedback.gain.value = 0.4

          // Configure lowpass filter
          lowpassFilter.type = 'lowpass'
          lowpassFilter.frequency.value = 20000 // Start fully open
          lowpassFilter.Q.value = 1

          // Initial settings
          reverbGain.gain.value = 0

          // Signal routing:
          // mainGain -> lowpassFilter -> outputGain (dry)
          // mainGain -> delay1 -> delay2 -> reverbGain -> outputGain (wet)
          //                    -> feedback -> delay1 (feedback loop)
          mainGain.connect(lowpassFilter)
          lowpassFilter.connect(outputGain)
          mainGain.connect(delay1)
          delay1.connect(delay2)
          delay2.connect(feedback)
          feedback.connect(delay1)
          delay2.connect(reverbGain)
          reverbGain.connect(outputGain)
          outputGain.connect(ctx.destination)

          effectNodesRef.current[instrument.id] = {
            mainGain,
            reverbGain,
            outputGain,
            lowpassFilter,
            delay1,
            delay2,
            feedback,
          }
        })

        // Load all samples
        for (const instrument of instruments) {
          if (currentInit !== initCountRef.current) return

          try {
            const response = await fetch(instrument.path)
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }
            const arrayBuffer = await response.arrayBuffer()

            if (currentInit !== initCountRef.current || ctx.state === 'closed') return

            audioBuffersRef.current[instrument.id] = await ctx.decodeAudioData(arrayBuffer)
          } catch (error) {
            // Swallow load errors
          }
        }

        if (currentInit === initCountRef.current) {
          setIsLoading(false)
        }
      } catch (error) {
        if (currentInit === initCountRef.current) {
          setIsLoading(false)
        }
      }
    }

    initAudio()

    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close()
      }
    }
  }, [])

  // Play a sound at a specific time
  const playSound = useCallback((instrumentId, time, trackSettings) => {
    if (!audioBuffersRef.current[instrumentId] || !audioContextRef.current) return

    if (trackSettings?.muted) return

    const ctx = audioContextRef.current
    const source = ctx.createBufferSource()
    source.buffer = audioBuffersRef.current[instrumentId]

    const volume = trackSettings?.volume ?? 0.8
    const reverb = trackSettings?.reverb ?? 0
    const filter = trackSettings?.filter ?? 1

    const nodes = effectNodesRef.current[instrumentId]
    if (nodes) {
      // Set reverb wet amount
      nodes.reverbGain.gain.setValueAtTime(reverb, time)

      // Set filter cutoff (0 = 200Hz dark, 1 = 20000Hz bright)
      // Using exponential mapping for more musical response
      const minFreq = 200
      const maxFreq = 20000
      const cutoff = minFreq * Math.pow(maxFreq / minFreq, filter)
      nodes.lowpassFilter.frequency.setValueAtTime(cutoff, time)

      // Set volume
      nodes.mainGain.gain.setValueAtTime(volume, time)

      source.connect(nodes.mainGain)
    } else {
      source.connect(ctx.destination)
    }

    source.start(time)
  }, [])

  // Set volume for a specific track
  const setTrackVolume = useCallback((instrumentId, volume) => {
    const nodes = effectNodesRef.current[instrumentId]
    if (nodes && audioContextRef.current) {
      nodes.mainGain.gain.setValueAtTime(volume, audioContextRef.current.currentTime)
    }
  }, [])

  // Resume audio context
  const resumeContext = useCallback(async () => {
    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume()
    }
  }, [])

  // Get current audio context time
  const getCurrentTime = useCallback(() => {
    return audioContextRef.current?.currentTime ?? 0
  }, [])

  // Load a new instrument dynamically
  const loadInstrument = useCallback(async (instrument) => {
    if (!audioContextRef.current) return false
    const ctx = audioContextRef.current

    try {
      const mainGain = ctx.createGain()
      const reverbGain = ctx.createGain()
      const outputGain = ctx.createGain()
      const lowpassFilter = ctx.createBiquadFilter()
      const delay1 = ctx.createDelay(1.0)
      const delay2 = ctx.createDelay(1.0)
      const feedback = ctx.createGain()

      delay1.delayTime.value = 0.05
      delay2.delayTime.value = 0.08
      feedback.gain.value = 0.4
      reverbGain.gain.value = 0

      lowpassFilter.type = 'lowpass'
      lowpassFilter.frequency.value = 20000
      lowpassFilter.Q.value = 1

      mainGain.connect(lowpassFilter)
      lowpassFilter.connect(outputGain)
      mainGain.connect(delay1)
      delay1.connect(delay2)
      delay2.connect(feedback)
      feedback.connect(delay1)
      delay2.connect(reverbGain)
      reverbGain.connect(outputGain)
      outputGain.connect(ctx.destination)

      effectNodesRef.current[instrument.id] = {
        mainGain, reverbGain, outputGain, lowpassFilter, delay1, delay2, feedback,
      }

      const response = await fetch(instrument.path)
      const arrayBuffer = await response.arrayBuffer()
      audioBuffersRef.current[instrument.id] = await ctx.decodeAudioData(arrayBuffer)

      return true
    } catch (error) {
      return false
    }
  }, [])

  return {
    isLoading,
    playSound,
    setTrackVolume,
    resumeContext,
    getCurrentTime,
    loadInstrument,
  }
}

export default useAudioEngine
