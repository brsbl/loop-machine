import { memo, useCallback } from 'react'
import Pad from './Pad'
import TrackControls from './TrackControls'

const Track = memo(function Track({
  instrument,
  steps,
  pattern,
  currentStep,
  onToggle,
  trackSettings,
  onTrackSettingsChange,
}) {
  const handleVolumeChange = useCallback((volume) => {
    onTrackSettingsChange(instrument.id, { volume })
  }, [instrument.id, onTrackSettingsChange])

  const handleMuteToggle = useCallback(() => {
    onTrackSettingsChange(instrument.id, { muted: !trackSettings.muted })
  }, [instrument.id, trackSettings.muted, onTrackSettingsChange])

  const handleSoloToggle = useCallback(() => {
    onTrackSettingsChange(instrument.id, { solo: !trackSettings.solo })
  }, [instrument.id, trackSettings.solo, onTrackSettingsChange])

  return (
    <div className="instrument-track-row">
      <div className="instrument-label">{instrument.name}</div>
      <div className="notes-container">
        {Array.from({ length: steps }, (_, i) => (
          <Pad
            key={i}
            active={pattern[i]}
            playing={currentStep === i}
            isBeatStart={i % 4 === 0}
            onClick={() => onToggle(instrument.id, i)}
          />
        ))}
      </div>
      <TrackControls
        volume={trackSettings.volume}
        muted={trackSettings.muted}
        solo={trackSettings.solo}
        onVolumeChange={handleVolumeChange}
        onMuteToggle={handleMuteToggle}
        onSoloToggle={handleSoloToggle}
      />
    </div>
  )
})

export default Track
