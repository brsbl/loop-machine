import { memo } from 'react'
import Key from './Key'
import { NOTES, NOTE_TO_KEY } from '../config/keyboard'

/**
 * 2-octave piano keyboard component (C3-B4)
 * Click keys to toggle them on/off for arpeggiator
 */
function Keyboard({ heldNotes, playingNote, onToggle, showKeyHints = true }) {
  return (
    <div className="keyboard-section">
      <div className="keyboard">
        {NOTES.map((noteData) => (
          <Key
            key={noteData.note}
            note={noteData.note}
            type={noteData.type}
            isHeld={heldNotes.has(noteData.note)}
            isPlaying={playingNote === noteData.note}
            keyHint={showKeyHints ? NOTE_TO_KEY[noteData.note] : null}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  )
}

export default memo(Keyboard)
