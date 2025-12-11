import { memo } from 'react'
import Pad from './Pad'

/**
 * Arpeggiator track - 16-step gate pattern
 */
function ArpTrack({
  pattern,
  currentStep,
  onToggleStep,
  showLabel = true,
}) {
  // Group pads into groups of 4
  const padGroups = []
  for (let g = 0; g < 16; g += 4) {
    padGroups.push(Array.from({ length: 4 }, (_, i) => g + i))
  }

  return (
    <div className="notes-container arp-notes">
      {padGroups.map((group, groupIndex) => (
        <div key={groupIndex} className="pad-group bordered">
          {group.map((i) => (
            <Pad
              key={i}
              active={pattern[i]}
              playing={currentStep === i}
              isBeatStart={i % 4 === 0}
              onClick={() => onToggleStep(i)}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export default memo(ArpTrack)
