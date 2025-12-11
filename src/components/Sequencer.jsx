import Track from './Track'
import ArpTrack from './ArpTrack'
import TrackControls from './TrackControls'
import TransportControls from './TransportControls'
import AudioVisualizer from './AudioVisualizer'

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
  onBpmChange,
  isPlaying,
  isLoading,
  onPlayStop,
  onReset,
  arpeggiator,
  synth,
  analyser,
  children,
}) {
  // Group step numbers into groups of 4 to match pad groups
  const stepNumberGroups = []
  for (let g = 0; g < 16; g += 4) {
    stepNumberGroups.push(
      Array.from({ length: 4 }, (_, i) => g + i + 1)
    )
  }

  const handleVolumeChange = (instrumentId, volume) => {
    onTrackSettingsChange(instrumentId, { volume })
  }

  const handleReverbChange = (instrumentId, reverb) => {
    onTrackSettingsChange(instrumentId, { reverb })
    onEffectChange?.(instrumentId, 'reverb', reverb)
  }

  const handleFilterChange = (instrumentId, filter) => {
    onTrackSettingsChange(instrumentId, { filter })
    onEffectChange?.(instrumentId, 'filter', filter)
  }

  return (
    <div className="sequencer-section">
      {/* Drums section - step numbers + 3 drum rows + knobs */}
      <div className="drums-row">
        <div className="drums-grid-container">
          {/* Step numbers row */}
          <div className="step-numbers">
            {stepNumberGroups.map((group, groupIndex) => (
              <div
                key={groupIndex}
                className={`step-number-group ${groupIndex === 0 || groupIndex === 2 ? 'bordered' : ''}`}
              >
                {group.map(num => (
                  <span key={num}>{num}</span>
                ))}
              </div>
            ))}
          </div>

          {/* Instrument steps */}
          {instruments.map(instrument => (
            <Track
              key={instrument.id}
              instrument={instrument}
              steps={steps}
              pattern={pattern[instrument.id]}
              currentStep={currentStep}
              onToggle={onToggle}
              showLabel={false}
            />
          ))}
        </div>

        {/* Track controls (knobs) */}
        <div className="track-controls-column">
          {instruments.map(instrument => (
            <TrackControls
              key={instrument.id}
              volume={trackSettings[instrument.id].volume}
              reverb={trackSettings[instrument.id].reverb ?? 0}
              filter={trackSettings[instrument.id].filter ?? 1}
              onVolumeChange={(v) => handleVolumeChange(instrument.id, v)}
              onReverbChange={(v) => handleReverbChange(instrument.id, v)}
              onFilterChange={(v) => handleFilterChange(instrument.id, v)}
            />
          ))}
        </div>
      </div>

      {/* Synth section - arp steps + keyboard + vol slider + transport */}
      {arpeggiator && (
        <div className="synth-section">
          <div className="synth-row">
            {/* Volume slider on left */}
            <div className="synth-vol-container">
              <div className="control-box control-box-vertical">
                <span className="control-box-label">VOL</span>
                <div className="control-box-slider-vertical">
                  <input
                    type="range"
                    className="vol-slider-vertical"
                    min="0"
                    max="1"
                    step="0.01"
                    value={synth?.volume ?? 0.7}
                    onChange={(e) => synth?.setVolume?.(parseFloat(e.target.value))}
                  />
                </div>
              </div>
            </div>

            {/* Synth grid - arp steps + keyboard */}
            <div className="synth-grid-container">
              {/* Arpeggiator steps */}
              <ArpTrack
                pattern={arpeggiator.pattern}
                currentStep={currentStep}
                onToggleStep={arpeggiator.toggleStep}
                showLabel={false}
              />

              {/* Keyboard */}
              <div className="keyboard-section">
                {children}
              </div>
            </div>

            {/* Transport controls on right */}
            <div className="transport-section">
              <TransportControls
                bpm={bpm}
                onBpmChange={onBpmChange}
                isPlaying={isPlaying}
                isLoading={isLoading}
                onPlayStop={onPlayStop}
                onReset={onReset}
              />
            </div>
          </div>

          {/* Synth controls row - same 3-column layout as synth row */}
          <div className="synth-controls-row">
            {/* Left visualizer */}
            <div className="visualizer-container">
              <AudioVisualizer analyser={analyser} barCount={12} />
            </div>

            {/* Center - controls aligned with synth-grid-container */}
            <div className="synth-controls-center">
              <div className="synth-controls-container">
                {/* Direction control */}
                <div className="control-box">
                  <span className="control-box-label">DIRECTION</span>
                  <div className="control-box-buttons">
                    <button
                      className={`control-btn ${arpeggiator.mode === 'up' ? 'active' : ''}`}
                      onClick={() => arpeggiator.setMode('up')}
                    >↑</button>
                    <button
                      className={`control-btn ${arpeggiator.mode === 'down' ? 'active' : ''}`}
                      onClick={() => arpeggiator.setMode('down')}
                    >↓</button>
                    <button
                      className={`control-btn ${arpeggiator.mode === 'up-down' ? 'active' : ''}`}
                      onClick={() => arpeggiator.setMode('up-down')}
                    >↕</button>
                  </div>
                </div>

                {/* Speed control */}
                <div className="control-box">
                  <span className="control-box-label">SPEED</span>
                  <div className="control-box-buttons">
                    <button
                      className={`control-btn ${arpeggiator.rate === '1/4' ? 'active' : ''}`}
                      onClick={() => arpeggiator.setRate('1/4')}
                    >1/4</button>
                    <button
                      className={`control-btn ${arpeggiator.rate === '1/8' ? 'active' : ''}`}
                      onClick={() => arpeggiator.setRate('1/8')}
                    >1/8</button>
                    <button
                      className={`control-btn ${arpeggiator.rate === '1/16' ? 'active' : ''}`}
                      onClick={() => arpeggiator.setRate('1/16')}
                    >1/16</button>
                  </div>
                </div>

                {/* Wave control */}
                <div className="control-box">
                  <span className="control-box-label">WAVE</span>
                  <div className="control-box-buttons">
                    <button
                      className={`control-btn wave-btn ${synth?.waveform === 'sawtooth' ? 'active' : ''}`}
                      onClick={() => synth?.setWaveform?.('sawtooth')}
                    >
                      <svg width="16" height="12" viewBox="0 0 16 12">
                        <path d="M0 10 L8 2 L8 10 L16 2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                      </svg>
                    </button>
                    <button
                      className={`control-btn wave-btn ${synth?.waveform === 'square' ? 'active' : ''}`}
                      onClick={() => synth?.setWaveform?.('square')}
                    >
                      <svg width="16" height="12" viewBox="0 0 16 12">
                        <path d="M0 10 L0 2 L8 2 L8 10 L16 10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                      </svg>
                    </button>
                    <button
                      className={`control-btn wave-btn ${synth?.waveform === 'sine' ? 'active' : ''}`}
                      onClick={() => synth?.setWaveform?.('sine')}
                    >
                      <svg width="16" height="12" viewBox="0 0 16 12">
                        <path d="M0 6 Q4 0 8 6 Q12 12 16 6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                      </svg>
                    </button>
                    <button
                      className={`control-btn wave-btn ${synth?.waveform === 'triangle' ? 'active' : ''}`}
                      onClick={() => synth?.setWaveform?.('triangle')}
                    >
                      <svg width="16" height="12" viewBox="0 0 16 12">
                        <path d="M0 10 L4 2 L12 10 L16 2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right visualizer */}
            <div className="visualizer-container">
              <AudioVisualizer analyser={analyser} barCount={12} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Sequencer
