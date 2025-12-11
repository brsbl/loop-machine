import { useState, useRef, useCallback, useEffect } from 'react'

/**
 * Creates an algorithmic reverb using Schroeder design
 * Uses 4 parallel comb filters + 2 series allpass filters
 * @param {AudioContext} ctx - Web Audio context
 * @returns {Object} Reverb nodes with control methods
 */
function createAlgorithmicReverb(ctx) {
  const input = ctx.createGain()
  const output = ctx.createGain()
  const wetGain = ctx.createGain()
  wetGain.gain.value = 0

  // Comb filter delay times (prime-number-based for natural sound)
  const combTimes = [0.0297, 0.0371, 0.0411, 0.0437]
  const combFilters = combTimes.map((time, i) => {
    const delay = ctx.createDelay(0.1)
    const feedback = ctx.createGain()
    delay.delayTime.value = time
    feedback.gain.value = 0.7
    // Feedback loop
    delay.connect(feedback)
    feedback.connect(delay)
    return { delay, feedback }
  })

  // Sum comb filter outputs
  const combSum = ctx.createGain()
  combSum.gain.value = 0.25

  // Connect combs in parallel from input
  combFilters.forEach(comb => {
    input.connect(comb.delay)
    comb.delay.connect(combSum)
  })

  // Allpass filters for diffusion
  const allpass1Delay = ctx.createDelay(0.01)
  const allpass1Gain = ctx.createGain()
  const allpass2Delay = ctx.createDelay(0.01)
  const allpass2Gain = ctx.createGain()

  allpass1Delay.delayTime.value = 0.005
  allpass1Gain.gain.value = 0.7
  allpass2Delay.delayTime.value = 0.0017
  allpass2Gain.gain.value = 0.7

  // Simple allpass approximation: comb sum -> delays -> wet
  combSum.connect(allpass1Delay)
  allpass1Delay.connect(allpass1Gain)
  allpass1Gain.connect(allpass2Delay)
  allpass2Delay.connect(allpass2Gain)
  allpass2Gain.connect(wetGain)

  // Dry path (input passes through)
  input.connect(output)
  // Wet path
  wetGain.connect(output)

  return { input, output, wetGain, combFilters }
}

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
          const reverb = createAlgorithmicReverb(ctx)
          const delayNode = ctx.createDelay(1.0)
          const delayFeedback = ctx.createGain()
          const delayWetGain = ctx.createGain()
          // Tempo-synced delay nodes
          const tempoDelayNode = ctx.createDelay(2.0)
          const tempoDelayFeedback = ctx.createGain()
          const tempoDelayWetGain = ctx.createGain()
          const outputGain = ctx.createGain()

          // Initial settings
          delayNode.delayTime.value = 0
          delayFeedback.gain.value = 0
          delayWetGain.gain.value = 0
          tempoDelayNode.delayTime.value = 0
          tempoDelayFeedback.gain.value = 0.35
          tempoDelayWetGain.gain.value = 0

          // Signal routing:
          // mainGain -> outputGain (dry)
          // mainGain -> reverb.input -> reverb.output -> outputGain
          // mainGain -> delayNode -> delayFeedback -> delayNode (feedback loop)
          //                       -> delayWetGain -> outputGain
          // mainGain -> tempoDelayNode -> tempoDelayFeedback -> tempoDelayNode (feedback)
          //                            -> tempoDelayWetGain -> outputGain
          mainGain.connect(outputGain) // Dry signal
          mainGain.connect(reverb.input)
          reverb.output.connect(outputGain)
          mainGain.connect(delayNode)
          delayNode.connect(delayFeedback)
          delayFeedback.connect(delayNode)
          delayNode.connect(delayWetGain)
          delayWetGain.connect(outputGain)
          mainGain.connect(tempoDelayNode)
          tempoDelayNode.connect(tempoDelayFeedback)
          tempoDelayFeedback.connect(tempoDelayNode)
          tempoDelayNode.connect(tempoDelayWetGain)
          tempoDelayWetGain.connect(outputGain)
          outputGain.connect(masterGain) // Route through master for visualization

          effectNodesRef.current[instrument.id] = {
            mainGain,
            reverb,
            delayNode,
            delayFeedback,
            delayWetGain,
            tempoDelayNode,
            tempoDelayFeedback,
            tempoDelayWetGain,
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
  const setEffect = useCallback((instrumentId, effectType, value, bpm = 120) => {
    const nodes = effectNodesRef.current[instrumentId]
    if (!nodes || !audioContextRef.current) return

    const currentTime = audioContextRef.current.currentTime

    if (effectType === 'reverb') {
      const amount = parseFloat(value)
      // Control wet amount and feedback decay
      nodes.reverb.wetGain.gain.setValueAtTime(amount * 0.6, currentTime)
      nodes.reverb.combFilters.forEach(comb => {
        comb.feedback.gain.setValueAtTime(0.5 + amount * 0.35, currentTime)
      })
    }

    if (effectType === 'delay') {
      const sliderValue = parseInt(value, 10)
      const delayTime = (sliderValue / 10) * 0.5
      const feedbackAmount = (sliderValue / 10) * 0.7
      const wetAmount = (sliderValue / 10) * 0.5
      nodes.delayNode.delayTime.setValueAtTime(delayTime, currentTime)
      nodes.delayFeedback.gain.setValueAtTime(feedbackAmount, currentTime)
      nodes.delayWetGain.gain.setValueAtTime(wetAmount, currentTime)
    }

    if (effectType === 'filter') {
      // Tempo-synced delay: knob position determines note division and wet amount
      const knobValue = parseFloat(value)
      const sixteenthNote = 60 / bpm / 4

      let delayTime, wetAmount

      if (knobValue < 0.33) {
        // 1/16 note
        delayTime = sixteenthNote
        wetAmount = knobValue * 3 * 0.5
      } else if (knobValue < 0.66) {
        // 1/8 note
        delayTime = sixteenthNote * 2
        wetAmount = (knobValue - 0.33) * 3 * 0.5 + 0.15
      } else {
        // 1/4 note
        delayTime = sixteenthNote * 4
        wetAmount = (knobValue - 0.66) * 3 * 0.5 + 0.3
      }

      // Turn off if knob at 0
      if (knobValue === 0) {
        wetAmount = 0
      }

      nodes.tempoDelayNode.delayTime.setValueAtTime(delayTime, currentTime)
      nodes.tempoDelayWetGain.gain.setValueAtTime(wetAmount, currentTime)
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
      const reverb = createAlgorithmicReverb(ctx)
      const delayNode = ctx.createDelay(1.0)
      const delayFeedback = ctx.createGain()
      const delayWetGain = ctx.createGain()
      const tempoDelayNode = ctx.createDelay(2.0)
      const tempoDelayFeedback = ctx.createGain()
      const tempoDelayWetGain = ctx.createGain()
      const outputGain = ctx.createGain()

      delayNode.delayTime.value = 0
      delayFeedback.gain.value = 0
      delayWetGain.gain.value = 0
      tempoDelayNode.delayTime.value = 0
      tempoDelayFeedback.gain.value = 0.35
      tempoDelayWetGain.gain.value = 0

      mainGain.connect(outputGain)
      mainGain.connect(reverb.input)
      reverb.output.connect(outputGain)
      mainGain.connect(delayNode)
      delayNode.connect(delayFeedback)
      delayFeedback.connect(delayNode)
      delayNode.connect(delayWetGain)
      delayWetGain.connect(outputGain)
      mainGain.connect(tempoDelayNode)
      tempoDelayNode.connect(tempoDelayFeedback)
      tempoDelayFeedback.connect(tempoDelayNode)
      tempoDelayNode.connect(tempoDelayWetGain)
      tempoDelayWetGain.connect(outputGain)
      outputGain.connect(masterGainRef.current || ctx.destination)

      effectNodesRef.current[instrument.id] = {
        mainGain,
        reverb,
        delayNode,
        delayFeedback,
        delayWetGain,
        tempoDelayNode,
        tempoDelayFeedback,
        tempoDelayWetGain,
        outputGain,
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
