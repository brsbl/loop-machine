import { useState, useRef, useCallback, useEffect } from 'react'

/**
 * Custom hook for managing Web Audio API
 * Handles loading sounds, playback, and per-track volume/effects
 */
export function useAudioEngine(instruments) {
  const [isLoading, setIsLoading] = useState(true)
  const audioContextRef = useRef(null)
  const audioBuffersRef = useRef({})
  const gainNodesRef = useRef({})
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

        // Create gain nodes for each instrument
        instruments.forEach(instrument => {
          const gainNode = ctx.createGain()
          gainNode.connect(ctx.destination)
          gainNodesRef.current[instrument.id] = gainNode
        })

        // Load all samples
        for (const instrument of instruments) {
          // Check if this init is still current
          if (currentInit !== initCountRef.current) return

          try {
            const response = await fetch(instrument.path)
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }
            const arrayBuffer = await response.arrayBuffer()

            // Check again before decode
            if (currentInit !== initCountRef.current || ctx.state === 'closed') return

            audioBuffersRef.current[instrument.id] = await ctx.decodeAudioData(arrayBuffer)
          } catch (error) {
            // Swallow load errors to allow remaining samples to continue
          }
        }

        // Only set loading false if this init is still current
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

    // Check mute/solo
    if (trackSettings?.muted) return

    const source = audioContextRef.current.createBufferSource()
    source.buffer = audioBuffersRef.current[instrumentId]

    // Connect through gain node for volume control
    const gainNode = gainNodesRef.current[instrumentId]
    if (gainNode) {
      gainNode.gain.value = trackSettings?.volume ?? 0.8
      source.connect(gainNode)
    } else {
      source.connect(audioContextRef.current.destination)
    }

    source.start(time)
  }, [])

  // Set volume for a specific track
  const setTrackVolume = useCallback((instrumentId, volume) => {
    const gainNode = gainNodesRef.current[instrumentId]
    if (gainNode && audioContextRef.current) {
      gainNode.gain.setValueAtTime(volume, audioContextRef.current.currentTime)
    }
  }, [])

  // Resume audio context (needed for browser autoplay policies)
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

    try {
      // Create gain node
      const gainNode = audioContextRef.current.createGain()
      gainNode.connect(audioContextRef.current.destination)
      gainNodesRef.current[instrument.id] = gainNode

      // Load sample
      const response = await fetch(instrument.path)
      const arrayBuffer = await response.arrayBuffer()
      audioBuffersRef.current[instrument.id] = await audioContextRef.current.decodeAudioData(arrayBuffer)

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
