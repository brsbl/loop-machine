import { memo } from 'react'

/**
 * Individual piano key component
 * Click to toggle note on/off (like drum pads)
 */
function Key({ note, type, isHeld, isPlaying, keyHint, onToggle }) {
  const handleClick = (e) => {
    e.preventDefault()
    onToggle(note)
  }

  const classNames = [
    'key',
    type,
    isHeld ? 'held' : '',
    isPlaying ? 'playing' : '',
  ].filter(Boolean).join(' ')

  return (
    <div
      className={classNames}
      data-note={note}
      onClick={handleClick}
    >
      {keyHint && <span className="key-hint">{keyHint}</span>}
    </div>
  )
}

export default memo(Key)
