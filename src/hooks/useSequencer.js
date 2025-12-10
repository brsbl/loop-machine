import { useState, useRef, useCallback, useEffect } from 'react'
import { createInitialPattern, createInitialTrackSettings, SEQUENCER_CONFIG } from '../config/instruments'

/**
 * Custom hook for managing sequencer state and playback timing
 */
export function useSequencer(instruments, audioEngine) {
  const { steps, bpm, scheduleAheadTime, schedulerInterval } = SEQUENCER_CONFIG
  const stepTime = 60 / bpm / 4 // Time per 16th note

  const [pattern, setPattern] = useState(() => createInitialPattern(instruments, steps))
  const [trackSettings, setTrackSettings] = useState(() => createInitialTrackSettings(instruments))
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)

  // Refs for playback timing (don't trigger re-renders)
  const nextNoteTimeRef = useRef(0)
  const currentStepRef = useRef(0)
  const timerIdRef = useRef(null)
  const startTimeRef = useRef(0)
  const animationFrameRef = useRef(null)
  const isPlayingRef = useRef(false)
  const patternRef = useRef(pattern)
  const trackSettingsRef = useRef(trackSettings)

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

      instruments.forEach(instrument => {
        if (patternRef.current[instrument.id][step] && shouldTrackPlay(instrument.id)) {
          const settings = trackSettingsRef.current[instrument.id]
          audioEngine.playSound(instrument.id, nextNoteTimeRef.current, settings)
        }
      })

      nextNoteTimeRef.current += stepTime
      currentStepRef.current = (currentStepRef.current + 1) % steps
    }

    timerIdRef.current = setTimeout(scheduler, schedulerInterval)
  }, [instruments, audioEngine, steps, stepTime, scheduleAheadTime, schedulerInterval, shouldTrackPlay])

  // Visual update loop - syncs UI with audio
  const updateVisuals = useCallback(() => {
    if (!isPlayingRef.current) return

    const currentTime = audioEngine.getCurrentTime()
    const loopDuration = steps * stepTime
    const timeWithinLoop = (currentTime - startTimeRef.current) % loopDuration
    const visualStep = Math.floor(timeWithinLoop / stepTime)

    setCurrentStep(visualStep)
    animationFrameRef.current = requestAnimationFrame(updateVisuals)
  }, [audioEngine, steps, stepTime])

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
    toggleStep,
    startPlayback,
    stopPlayback,
    resetPattern,
    updateTrackSettings,
    addTrack,
  }
}

export default useSequencer
