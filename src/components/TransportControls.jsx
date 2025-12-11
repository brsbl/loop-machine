import { useState, useEffect } from 'react'

function TransportControls({ bpm, isPlaying, isLoading, onPlayStop, onReset, onBpmChange }) {
  const [inputValue, setInputValue] = useState(String(bpm))

  // Sync input when bpm prop changes externally
  useEffect(() => {
    setInputValue(String(bpm))
  }, [bpm])

  const handleChange = (e) => {
    setInputValue(e.target.value)
  }

  const handleBlur = () => {
    const parsed = parseInt(inputValue, 10)
    if (!isNaN(parsed) && parsed >= 60 && parsed <= 200) {
      onBpmChange(parsed)
    } else {
      // Reset to current bpm if invalid
      setInputValue(String(bpm))
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur()
    }
  }

  return (
    <div className="transport-controls">
      <div className="transport-top-row">
        <div className="reset-section">
          <span className="transport-label">RESET</span>
          <button id="reset-button" onClick={onReset}></button>
        </div>
        <div className="tempo-section">
          <span className="tempo-label">TEMPO</span>
          <div className="tempo-display">
            <input
              type="number"
              id="tempo-value"
              value={inputValue}
              onChange={handleChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              min={60}
              max={200}
              step={1}
            />
          </div>
        </div>
      </div>
      <button
        id="play-stop-button"
        onClick={onPlayStop}
        disabled={isLoading}
        className={isPlaying ? 'playing' : ''}
      >
        {isPlaying ? 'STOP' : 'START'}
      </button>
    </div>
  )
}

export default TransportControls
