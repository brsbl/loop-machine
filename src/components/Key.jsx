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

  // Format note name (e.g., "C#3" -> "C#")
  const noteName = note.replace(/\d+$/, '')

  return (
    <div
      className={classNames}
      data-note={note}
      onClick={handleClick}
    >
      <span className="note-name">{noteName}</span>
      {keyHint && (
        <span className="key-hint-container">
          <span className="key-hint">{keyHint}</span>
        </span>
      )}
    </div>
  )
}

export default memo(Key)
