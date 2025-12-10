import { memo } from 'react'

const TrackControls = memo(function TrackControls({
  volume,
  reverb,
  delay,
  onVolumeChange,
  onReverbChange,
  onDelayChange,
}) {
  return (
    <div className="track-controls">
      <input
        type="range"
        className="volume-slider"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
        title={`Volume: ${Math.round(volume * 100)}%`}
      />
      <div className="effect-sliders">
        <input
          type="range"
          className="effect-slider reverb-slider"
          min="0"
          max="10"
          step="1"
          value={reverb}
          onChange={(e) => onReverbChange(parseInt(e.target.value, 10))}
          title={`Reverb: ${reverb}`}
        />
        <input
          type="range"
          className="effect-slider delay-slider"
          min="0"
          max="10"
          step="1"
          value={delay}
          onChange={(e) => onDelayChange(parseInt(e.target.value, 10))}
          title={`Delay: ${delay}`}
        />
      </div>
    </div>
  )
})

export default TrackControls
