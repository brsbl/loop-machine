function TransportControls({ bpm, isPlaying, isLoading, onPlayStop, onReset }) {
  return (
    <div className="transport-controls">
      <span className="transport-label">TEMPO</span>
      <div className="transport-display">
        <span className="transport-value">{bpm}</span>
      </div>
      <div className="transport-buttons">
        <button className="transport-button" onClick={onReset}>
          Reset
        </button>
        <button
          className={`transport-button ${isPlaying ? 'active' : ''}`}
          onClick={onPlayStop}
          disabled={isLoading}
        >
          {isPlaying ? 'Stop' : 'Start'}
        </button>
      </div>
    </div>
  )
}

export default TransportControls
