import { memo } from 'react'
import Pad from './Pad'

const Track = memo(function Track({
  instrument,
  steps,
  pattern,
  currentStep,
  onToggle,
  showLabel = true,
}) {
  // Group pads into groups of 4
  const padGroups = []
  for (let g = 0; g < steps; g += 4) {
    padGroups.push(
      Array.from({ length: 4 }, (_, i) => g + i)
    )
  }

  return (
    <div className="track-row">
      <span className="track-label">{instrument.name}</span>
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
    </div>
  )
})

export default Track
