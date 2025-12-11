import { useState, useEffect, useCallback } from 'react'
import { useAudioEngine } from '../hooks/useAudioEngine'
import { useSequencer } from '../hooks/useSequencer'
import { useSynthEngine } from '../hooks/useSynthEngine'
import { useArpeggiator } from '../hooks/useArpeggiator'
import LoadingOverlay from './LoadingOverlay'
import Header from './Header'
import Sequencer from './Sequencer'
import Keyboard from './Keyboard'
import { QWERTY_MAP } from '../config/keyboard'

function DrumMachine({ instruments }) {
  const audioEngine = useAudioEngine(instruments)
  const synth = useSynthEngine(audioEngine.audioContext, audioEngine.masterGain)
  const arpeggiator = useArpeggiator(synth)
  const sequencer = useSequencer(instruments, audioEngine, arpeggiator)

  // Track which note the arpeggiator is currently playing (for keyboard highlight)
  const [currentArpNote, setCurrentArpNote] = useState(null)

  // Update current arp note for keyboard highlighting
  useEffect(() => {
    arpeggiator.setOnNoteChange(setCurrentArpNote)
  }, [arpeggiator])

  const handlePlayStop = () => {
    if (sequencer.isPlaying) {
      sequencer.stopPlayback()
      setCurrentArpNote(null)
    } else {
      sequencer.startPlayback()
    }
  }

  // Toggle note on/off (click to toggle, like drum pads)
  const handleNoteToggle = useCallback(
    (noteName) => {
      arpeggiator.toggleNote(noteName)
    },
    [arpeggiator]
  )

  // QWERTY keyboard toggles notes
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      // Ignore repeat events (key held down)
      if (e.repeat) return

      const noteName = QWERTY_MAP[e.key.toLowerCase()]
      if (noteName) {
        e.preventDefault()
        handleNoteToggle(noteName)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleNoteToggle])

  return (
    <div className="app-container">
      <div className="drum-machine">
        <LoadingOverlay isLoading={audioEngine.isLoading} />

        <Header />

        <Sequencer
          instruments={instruments}
          steps={sequencer.steps}
          pattern={sequencer.pattern}
          currentStep={sequencer.currentStep}
          onToggle={sequencer.toggleStep}
          trackSettings={sequencer.trackSettings}
          onTrackSettingsChange={sequencer.updateTrackSettings}
          onEffectChange={audioEngine.setEffect}
          bpm={sequencer.bpm}
          onBpmChange={sequencer.setBpm}
          isPlaying={sequencer.isPlaying}
          isLoading={audioEngine.isLoading}
          onPlayStop={handlePlayStop}
          onReset={sequencer.resetPattern}
          arpeggiator={arpeggiator}
          synth={synth}
          analyser={audioEngine.analyser}
        >
          <Keyboard
            heldNotes={arpeggiator.heldNotes}
            playingNote={currentArpNote}
            onToggle={handleNoteToggle}
          />
        </Sequencer>
      </div>
    </div>
  )
}

export default DrumMachine
