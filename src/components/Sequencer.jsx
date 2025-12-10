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
  onEffectChange,
  bpm,
  isPlaying,
  isLoading,
  onPlayStop,
  onReset,
  children,
}) {
  return (
    <div className="sequencer-section">
      {/* Step numbers and slider labels - top */}
      <div className="step-numbers-top">
        <div className="instrument-label-spacer"></div>
        <div className="step-numbers">
          {Array.from({ length: 16 }, (_, i) => (
            <span key={i}>{i + 1}</span>
          ))}
        </div>
        <div className="slider-labels">
          <span className="slider-label">VOL</span>
          <span className="slider-label">REV</span>
          <span className="slider-label">DLY</span>
        </div>
      </div>

      {/* Tracks */}
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
            onEffectChange={onEffectChange}
          />
        ))}
      </div>

      {/* Transport controls row - under sliders */}
      <div className="transport-row">
        <div className="transport-spacer"></div>
        <TransportControls
          bpm={bpm}
          isPlaying={isPlaying}
          isLoading={isLoading}
          onPlayStop={onPlayStop}
          onReset={onReset}
        />
      </div>

      {/* Keyboard wrapper - centers keyboard with pads */}
      <div className="keyboard-wrapper">
        <div className="instrument-label-spacer"></div>
        <div className="keyboard-center">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Sequencer
