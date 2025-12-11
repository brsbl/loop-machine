import { useState, useRef, useCallback, useEffect } from 'react'
import { createInitialPattern, createInitialTrackSettings, SEQUENCER_CONFIG } from '../config/instruments'
import { decodeStateFromUrl, encodeStateToUrl } from '../utils/urlState'

/**
 * Custom hook for managing sequencer state and playback timing
 */
export function useSequencer(instruments, audioEngine, arpeggiator = null) {
  const { steps, bpm: defaultBpm, scheduleAheadTime, schedulerInterval } = SEQUENCER_CONFIG

  // Initialize state from URL if available
  const [pattern, setPattern] = useState(() => {
    const urlState = decodeStateFromUrl(instruments, steps)
    return urlState.pattern || createInitialPattern(instruments, steps)
  })
  const [trackSettings, setTrackSettings] = useState(() => {
    const urlState = decodeStateFromUrl(instruments, steps)
    return urlState.trackSettings || createInitialTrackSettings(instruments)
  })
  const [bpm, setBpmState] = useState(() => {
    const urlState = decodeStateFromUrl(instruments, steps)
    return urlState.bpm || defaultBpm
  })
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)

  // Compute stepTime dynamically from bpm
  const stepTime = 60 / bpm / 4 // Time per 16th note

  // Refs for playback timing (don't trigger re-renders)
  const nextNoteTimeRef = useRef(0)
  const currentStepRef = useRef(0)
  const timerIdRef = useRef(null)
  const startTimeRef = useRef(0)
  const animationFrameRef = useRef(null)
  const isPlayingRef = useRef(false)
  const patternRef = useRef(pattern)
  const trackSettingsRef = useRef(trackSettings)
  const bpmRef = useRef(bpm)
  const stepTimeRef = useRef(stepTime)
  const arpeggiatorRef = useRef(arpeggiator)

  // Keep refs in sync with state
  useEffect(() => {
    isPlayingRef.current = isPlaying
  }, [isPlaying])

  useEffect(() => {
    patternRef.current = pattern
  }, [pattern])

  useEffect(() => {
    trackSettingsRef.current = trackSettings
  }, [trackSettings])

  useEffect(() => {
    bpmRef.current = bpm
    stepTimeRef.current = 60 / bpm / 4
  }, [bpm])

  useEffect(() => {
    arpeggiatorRef.current = arpeggiator
  }, [arpeggiator])

  // Check if any track is soloed
  const hasSoloedTrack = useCallback(() => {
    return Object.values(trackSettingsRef.current).some(s => s.solo)
  }, [])

  // Check if a track should play (considering solo/mute)
  const shouldTrackPlay = useCallback((instrumentId) => {
    const settings = trackSettingsRef.current[instrumentId]
    if (!settings) return true

    if (settings.muted) return false
    if (hasSoloedTrack()) {
      return settings.solo
    }
    return true
  }, [hasSoloedTrack])

  // Scheduler function - schedules notes ahead of time
  const scheduler = useCallback(() => {
    const currentTime = audioEngine.getCurrentTime()

    while (nextNoteTimeRef.current < currentTime + scheduleAheadTime) {
      const step = currentStepRef.current

      // Schedule drum sounds
      instruments.forEach(instrument => {
        if (patternRef.current[instrument.id][step] && shouldTrackPlay(instrument.id)) {
          const settings = trackSettingsRef.current[instrument.id]
          audioEngine.playSound(instrument.id, nextNoteTimeRef.current, settings)
        }
      })

      // Schedule arpeggiator notes
      if (arpeggiatorRef.current) {
        arpeggiatorRef.current.scheduleArpNote(step, nextNoteTimeRef.current, stepTimeRef.current)
      }

      nextNoteTimeRef.current += stepTimeRef.current
      currentStepRef.current = (currentStepRef.current + 1) % steps
    }

    timerIdRef.current = setTimeout(scheduler, schedulerInterval)
  }, [instruments, audioEngine, steps, scheduleAheadTime, schedulerInterval, shouldTrackPlay])

  // Visual update loop - syncs UI with audio
  const updateVisuals = useCallback(() => {
    if (!isPlayingRef.current) return

    const currentTime = audioEngine.getCurrentTime()
    const currentStepTime = stepTimeRef.current
    const loopDuration = steps * currentStepTime
    const timeWithinLoop = (currentTime - startTimeRef.current) % loopDuration
    const visualStep = Math.floor(timeWithinLoop / currentStepTime)

    setCurrentStep(visualStep)
    animationFrameRef.current = requestAnimationFrame(updateVisuals)
  }, [audioEngine, steps])

  // Start playback
  const startPlayback = useCallback(async () => {
    await audioEngine.resumeContext()

    setIsPlaying(true)
    isPlayingRef.current = true
    currentStepRef.current = 0

    const currentTime = audioEngine.getCurrentTime()
    startTimeRef.current = currentTime
    nextNoteTimeRef.current = currentTime

    scheduler()
    requestAnimationFrame(updateVisuals)
  }, [audioEngine, scheduler, updateVisuals])

  // Stop playback
  const stopPlayback = useCallback(() => {
    setIsPlaying(false)
    isPlayingRef.current = false
    setCurrentStep(-1)

    if (timerIdRef.current) {
      clearTimeout(timerIdRef.current)
      timerIdRef.current = null
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    // Stop arpeggiator
    if (arpeggiatorRef.current) {
      arpeggiatorRef.current.stopArp()
    }
  }, [])

  // Toggle a step in the pattern
  const toggleStep = useCallback((instrumentId, stepIndex) => {
    setPattern(prev => ({
      ...prev,
      [instrumentId]: prev[instrumentId].map((val, i) =>
        i === stepIndex ? !val : val
      )
    }))
  }, [])

  // Reset pattern to empty
  const resetPattern = useCallback(() => {
    stopPlayback()
    setPattern(createInitialPattern(instruments, steps))
    // Also reset arpeggiator pattern
    if (arpeggiatorRef.current) {
      arpeggiatorRef.current.resetPattern()
    }
  }, [stopPlayback, instruments, steps])

  // Update track settings (volume, mute, solo)
  const updateTrackSettings = useCallback((instrumentId, updates) => {
    setTrackSettings(prev => ({
      ...prev,
      [instrumentId]: {
        ...prev[instrumentId],
        ...updates
      }
    }))
  }, [])

  // Add a new track
  const addTrack = useCallback((instrument) => {
    setPattern(prev => ({
      ...prev,
      [instrument.id]: Array(steps).fill(false)
    }))
    setTrackSettings(prev => ({
      ...prev,
      [instrument.id]: { volume: 0.8, muted: false, solo: false, reverb: 0, delay: 0 }
    }))
  }, [steps])

  // Update BPM with clamping
  const setBpm = useCallback((newBpm) => {
    const clampedBpm = Math.max(60, Math.min(200, Number(newBpm) || 120))
    setBpmState(clampedBpm)
  }, [])

  // Persist state to URL when pattern, trackSettings, or bpm changes
  useEffect(() => {
    encodeStateToUrl(pattern, trackSettings, instruments, bpm)
  }, [pattern, trackSettings, instruments, bpm])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIdRef.current) clearTimeout(timerIdRef.current)
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    }
  }, [])

  return {
    pattern,
    trackSettings,
    isPlaying,
    currentStep,
    steps,
    bpm,
    setBpm,
    toggleStep,
    startPlayback,
    stopPlayback,
    resetPattern,
    updateTrackSettings,
    addTrack,
  }
}

export default useSequencer
