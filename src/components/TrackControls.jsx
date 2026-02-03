import { memo } from 'react'
import Knob from './ui/Knob'

const TrackControls = memo(function TrackControls({
  volume,
  reverb,
  filter,
  onVolumeChange,
  onReverbChange,
  onFilterChange,
}) {
  return (
    <div className="track-controls">
      <Knob
        value={volume}
        onChange={onVolumeChange}
        min={0}
        max={1}
        step={0.01}
        size={52}
      />
      <Knob
        value={reverb}
        onChange={onReverbChange}
        min={0}
        max={1}
        step={0.01}
        size={52}
      />
      <Knob
        value={filter}
        onChange={onFilterChange}
        min={0}
        max={1}
        step={0.01}
        size={52}
      />
    </div>
  )
})

export default TrackControls
