import { memo } from 'react'

const TrackControls = memo(function TrackControls({
  volume,
  muted,
  solo,
  onVolumeChange,
  onMuteToggle,
  onSoloToggle,
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
      <button
        className={`track-button mute-button ${muted ? 'active' : ''}`}
        onClick={onMuteToggle}
        title="Mute"
      >
        M
      </button>
      <button
        className={`track-button solo-button ${solo ? 'active' : ''}`}
        onClick={onSoloToggle}
        title="Solo"
      >
        S
      </button>
    </div>
  )
})

export default TrackControls
