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
  onEffectChange,
}) {
  const handleVolumeChange = useCallback((volume) => {
    onTrackSettingsChange(instrument.id, { volume })
    onEffectChange?.(instrument.id, 'volume', volume)
  }, [instrument.id, onTrackSettingsChange, onEffectChange])

  const handleReverbChange = useCallback((reverb) => {
    onTrackSettingsChange(instrument.id, { reverb })
    onEffectChange?.(instrument.id, 'reverb', reverb)
  }, [instrument.id, onTrackSettingsChange, onEffectChange])

  const handleFilterChange = useCallback((filter) => {
    onTrackSettingsChange(instrument.id, { filter })
    onEffectChange?.(instrument.id, 'filter', filter)
  }, [instrument.id, onTrackSettingsChange, onEffectChange])

  // Group pads into groups of 4
  const padGroups = []
  for (let g = 0; g < steps; g += 4) {
    padGroups.push(
      Array.from({ length: 4 }, (_, i) => g + i)
    )
  }

  return (
    <div className="instrument-track-row">
      <div className="instrument-label">{instrument.name}</div>
      <div className="notes-container">
        {padGroups.map((group, groupIndex) => (
          <div
            key={groupIndex}
            className="pad-group bordered"
          >
            {group.map(i => (
              <Pad
                key={i}
                active={pattern[i]}
                playing={currentStep === i}
                isBeatStart={i % 4 === 0}
                onClick={() => onToggle(instrument.id, i)}
              />
            ))}
          </div>
        ))}
      </div>
      <TrackControls
        volume={trackSettings.volume}
        reverb={trackSettings.reverb ?? 0}
        filter={trackSettings.filter ?? 1}
        onVolumeChange={handleVolumeChange}
        onReverbChange={handleReverbChange}
        onFilterChange={handleFilterChange}
      />
    </div>
  )
})

export default Track
