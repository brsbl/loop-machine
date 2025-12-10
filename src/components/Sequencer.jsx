import Track from './Track'
import TransportControls from './TransportControls'

function Sequencer({
  instruments,
  steps,
  pattern,
  currentStep,
  onToggle,
  trackSettings,
  onTrackSettingsChange,
  isPlaying,
  isLoading,
  onPlayStop,
  onReset,
}) {
  return (
    <div className="sequencer-section">
      {/* Step numbers - top */}
      <div className="step-numbers-top">
        <div className="instrument-label-spacer"></div>
        <div className="step-numbers">
          {Array.from({ length: steps }, (_, i) => (
            <span key={i}>{i + 1}</span>
          ))}
        </div>
        <div className="controls-spacer"></div>
      </div>

      {/* Tracks and controls wrapper */}
      <div className="tracks-and-controls">
        <div className="instrument-tracks">
          {instruments.map(instrument => (
            <Track
              key={instrument.id}
              instrument={instrument}
              steps={steps}
              pattern={pattern[instrument.id]}
              currentStep={currentStep}
              onToggle={onToggle}
              trackSettings={trackSettings[instrument.id]}
              onTrackSettingsChange={onTrackSettingsChange}
            />
          ))}
        </div>

        <TransportControls
          isPlaying={isPlaying}
          isLoading={isLoading}
          onPlayStop={onPlayStop}
          onReset={onReset}
        />
      </div>

      {/* Step numbers - bottom */}
      <div className="step-numbers-bottom">
        <div className="instrument-label-spacer"></div>
        <div className="step-numbers">
          {Array.from({ length: steps + 1 }, (_, i) => (
            <span key={i}>{i + 1}</span>
          ))}
        </div>
        <div className="controls-spacer"></div>
      </div>
    </div>
  )
}

export default Sequencer
