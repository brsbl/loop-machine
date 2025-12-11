import { memo } from 'react'
import { WAVEFORMS } from '../config/keyboard'

const DIRECTIONS = [
  { id: 'up', label: '↑' },
  { id: 'down', label: '↓' },
  { id: 'up-down', label: '↕' },
]

const SPEEDS = [
  { id: '1/4', label: '1/4' },
  { id: '1/8', label: '1/8' },
  { id: '1/16', label: '1/16' },
]

/**
 * Combined keyboard controls - dir, speed, vol, wave
 * Layout: [DIR/SPEED stacked] [VOL] [WAVE] [Keyboard]
 */
function KeyboardControls({
  mode,
  rate,
  onModeChange,
  onRateChange,
  waveform,
  volume,
  onWaveformChange,
  onVolumeChange,
  children,
}) {
  return (
    <div className="keyboard-controls">
      {/* All synth controls in a container */}
      <div className="synth-controls-container">
        {/* DIR and SPEED stacked vertically */}
        <div className="control-stack">
          {/* DIRECTION control */}
          <div className="control-box control-box-half">
            <span className="control-box-label">DIRECTION</span>
            <div className="control-box-buttons">
              {DIRECTIONS.map((d) => (
                <button
                  key={d.id}
                  className={`control-btn ${mode === d.id ? 'active' : ''}`}
                  onClick={() => onModeChange(d.id)}
                  title={d.id}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* SPEED control */}
          <div className="control-box control-box-half">
            <span className="control-box-label">SPEED</span>
            <div className="control-box-buttons">
              {SPEEDS.map((s) => (
                <button
                  key={s.id}
                  className={`control-btn ${rate === s.id ? 'active' : ''}`}
                  onClick={() => onRateChange(s.id)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* VOL control - vertical slider */}
        <div className="control-box control-box-vertical">
          <span className="control-box-label">VOL</span>
          <div className="control-box-slider-vertical">
            <input
              type="range"
              className="vol-slider-vertical"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            />
          </div>
        </div>

        {/* WAVE control - vertical buttons */}
        <div className="control-box control-box-vertical">
          <span className="control-box-label">WAVE</span>
          <div className="control-box-buttons-vertical">
            {WAVEFORMS.map((type) => (
              <button
                key={type}
                className={`control-btn wave-btn ${waveform === type ? 'active' : ''}`}
                onClick={() => onWaveformChange(type)}
                title={type}
              >
                <WaveformIcon type={type} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Keyboard */}
      {children}
    </div>
  )
}

/**
 * SVG icons for waveform types
 */
function WaveformIcon({ type }) {
  const width = 20
  const height = 14

  switch (type) {
    case 'sine':
      return (
        <svg width={width} height={height} viewBox="0 0 24 16">
          <path
            d="M0 8 Q6 0 12 8 Q18 16 24 8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      )
    case 'square':
      return (
        <svg width={width} height={height} viewBox="0 0 24 16">
          <path
            d="M0 12 L0 4 L12 4 L12 12 L24 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      )
    case 'sawtooth':
      return (
        <svg width={width} height={height} viewBox="0 0 24 16">
          <path
            d="M0 12 L12 4 L12 12 L24 4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      )
    case 'triangle':
      return (
        <svg width={width} height={height} viewBox="0 0 24 16">
          <path
            d="M0 8 L6 4 L12 8 L18 12 L24 8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      )
    default:
      return null
  }
}

export default memo(KeyboardControls)
