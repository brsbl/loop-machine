import { useState, useRef, useCallback, useEffect } from 'react'

/**
 * Custom hook for managing Web Audio API
 * Handles loading sounds, playback, and per-track volume/effects
 */
export function useAudioEngine(instruments) {
  const [isLoading, setIsLoading] = useState(true)
  const [analyser, setAnalyser] = useState(null)
  const audioContextRef = useRef(null)
  const audioBuffersRef = useRef({})
  const effectNodesRef = useRef({})
  const masterGainRef = useRef(null)
  const analyserRef = useRef(null)
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

        // Create master gain and analyser for visualization
        const masterGain = ctx.createGain()
        const analyserNode = ctx.createAnalyser()
        analyserNode.fftSize = 256
        analyserNode.smoothingTimeConstant = 0.8

        masterGain.connect(analyserNode)
        analyserNode.connect(ctx.destination)

        masterGainRef.current = masterGain
        analyserRef.current = analyserNode
        setAnalyser(analyserNode)

        // Create effect nodes for each instrument
        instruments.forEach(instrument => {
          const mainGain = ctx.createGain()
          const lowpassFilter = ctx.createBiquadFilter()
          const reverbGain = ctx.createGain()
          const delayNode = ctx.createDelay(1.0)
          const delayFeedback = ctx.createGain()
          const delayWetGain = ctx.createGain()
          const outputGain = ctx.createGain()

          // Initial settings
          lowpassFilter.type = 'lowpass'
          lowpassFilter.frequency.value = 20000  // Start fully open
          lowpassFilter.Q.value = 1
          delayNode.delayTime.value = 0
          delayFeedback.gain.value = 0
          delayWetGain.gain.value = 0
          reverbGain.gain.value = 0

          // Signal routing:
          // mainGain -> lowpassFilter -> outputGain (dry)
          // mainGain -> reverbGain -> outputGain
          // mainGain -> delayNode -> delayFeedback -> delayNode (feedback loop)
          //                       -> delayWetGain -> outputGain
          mainGain.connect(lowpassFilter)
          lowpassFilter.connect(outputGain) // Dry signal with filter
          mainGain.connect(reverbGain)
          reverbGain.connect(outputGain)
          mainGain.connect(delayNode)
          delayNode.connect(delayFeedback)
          delayFeedback.connect(delayNode)
          delayNode.connect(delayWetGain)
          delayWetGain.connect(outputGain)
          outputGain.connect(masterGain) // Route through master for visualization

          effectNodesRef.current[instrument.id] = {
            mainGain,
            lowpassFilter,
            reverbGain,
            delayNode,
            delayFeedback,
            delayWetGain,
            outputGain,
          }
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

    // Connect through effect chain
    const nodes = effectNodesRef.current[instrumentId]
    if (nodes) {
      nodes.mainGain.gain.value = trackSettings?.volume ?? 0.8
      source.connect(nodes.mainGain)
    } else {
      source.connect(audioContextRef.current.destination)
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

  // Set effect parameters for a track
  const setEffect = useCallback((instrumentId, effectType, value) => {
    const nodes = effectNodesRef.current[instrumentId]
    if (!nodes || !audioContextRef.current) return

    const sliderValue = parseFloat(value)
    const currentTime = audioContextRef.current.currentTime

    if (effectType === 'reverb') {
      const reverbAmount = sliderValue
      nodes.reverbGain.gain.setValueAtTime(reverbAmount, currentTime)
    }

    if (effectType === 'delay') {
      const delayTime = sliderValue * 0.5
      const feedbackAmount = sliderValue * 0.7
      const wetAmount = sliderValue * 0.5
      nodes.delayNode.delayTime.setValueAtTime(delayTime, currentTime)
      nodes.delayFeedback.gain.setValueAtTime(feedbackAmount, currentTime)
      nodes.delayWetGain.gain.setValueAtTime(wetAmount, currentTime)
    }

    if (effectType === 'filter') {
      const minFreq = 200
      const maxFreq = 20000
      const cutoff = minFreq * Math.pow(maxFreq / minFreq, sliderValue)
      nodes.lowpassFilter.frequency.setValueAtTime(cutoff, currentTime)
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
    const ctx = audioContextRef.current

    try {
      // Create effect nodes
      const mainGain = ctx.createGain()
      const lowpassFilter = ctx.createBiquadFilter()
      const reverbGain = ctx.createGain()
      const delayNode = ctx.createDelay(1.0)
      const delayFeedback = ctx.createGain()
      const delayWetGain = ctx.createGain()
      const outputGain = ctx.createGain()

      lowpassFilter.type = 'lowpass'
      lowpassFilter.frequency.value = 20000  // Start fully open
      lowpassFilter.Q.value = 1
      delayNode.delayTime.value = 0
      delayFeedback.gain.value = 0
      delayWetGain.gain.value = 0
      reverbGain.gain.value = 0

      mainGain.connect(lowpassFilter)
      lowpassFilter.connect(outputGain)
      mainGain.connect(reverbGain)
      reverbGain.connect(outputGain)
      mainGain.connect(delayNode)
      delayNode.connect(delayFeedback)
      delayFeedback.connect(delayNode)
      delayNode.connect(delayWetGain)
      delayWetGain.connect(outputGain)
      outputGain.connect(masterGainRef.current || ctx.destination)

      effectNodesRef.current[instrument.id] = {
        mainGain, lowpassFilter, reverbGain, delayNode, delayFeedback, delayWetGain, outputGain,
      }

      // Load sample
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
    analyser,
    audioContext: audioContextRef.current,
    masterGain: masterGainRef.current,
    playSound,
    setTrackVolume,
    setEffect,
    resumeContext,
    getCurrentTime,
    loadInstrument,
  }
}

export default useAudioEngine
