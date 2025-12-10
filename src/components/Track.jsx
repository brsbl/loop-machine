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
  }, [instrument.id, onTrackSettingsChange])

  const handleReverbChange = useCallback((reverb) => {
    onTrackSettingsChange(instrument.id, { reverb })
    onEffectChange?.(instrument.id, 'reverb', reverb)
  }, [instrument.id, onTrackSettingsChange, onEffectChange])

  const handleDelayChange = useCallback((delay) => {
    onTrackSettingsChange(instrument.id, { delay })
    onEffectChange?.(instrument.id, 'delay', delay)
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
            className={`pad-group ${groupIndex === 0 || groupIndex === 2 ? 'bordered' : ''}`}
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
        delay={trackSettings.delay ?? 0}
        onVolumeChange={handleVolumeChange}
        onReverbChange={handleReverbChange}
        onDelayChange={handleDelayChange}
      />
    </div>
  )
})

export default Track
