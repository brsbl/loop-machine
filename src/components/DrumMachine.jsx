import { useAudioEngine } from '../hooks/useAudioEngine'
import { useSequencer } from '../hooks/useSequencer'
import LoadingOverlay from './LoadingOverlay'
import Header from './Header'
import Sequencer from './Sequencer'
import Keyboard from './Keyboard'

function DrumMachine({ instruments }) {
  const audioEngine = useAudioEngine(instruments)
  const sequencer = useSequencer(instruments, audioEngine)

  const handlePlayStop = () => {
    if (sequencer.isPlaying) {
      sequencer.stopPlayback()
    } else {
      sequencer.startPlayback()
    }
  }

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
          isPlaying={sequencer.isPlaying}
          isLoading={audioEngine.isLoading}
          onPlayStop={handlePlayStop}
          onReset={sequencer.resetPattern}
        >
          <Keyboard />
        </Sequencer>
      </div>
    </div>
  )
}

export default DrumMachine
