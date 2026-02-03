import { useState, useEffect } from 'react'
import Button from './ui/Button'

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

  const increment = () => {
    const newValue = Math.min(200, bpm + 1)
    onBpmChange(newValue)
  }

  const decrement = () => {
    const newValue = Math.max(60, bpm - 1)
    onBpmChange(newValue)
  }

  return (
    <div className="transport-controls">
      <div className="tempo-section">
        <span className="tempo-label">TEMPO</span>
        <div className="tempo-input-group">
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
          <div className="tempo-btn-stack">
            <button className="tempo-btn" onClick={increment}>▲</button>
            <button className="tempo-btn" onClick={decrement}>▼</button>
          </div>
        </div>
      </div>
      <div className="transport-buttons">
        <Button variant="transport reset" onClick={onReset}>
          RESET
        </Button>
        <Button
          variant="transport play"
          onClick={onPlayStop}
          disabled={isLoading}
          active={isPlaying}
        >
          {isPlaying ? 'STOP' : 'START'}
        </Button>
      </div>
    </div>
  )
}

export default TransportControls
