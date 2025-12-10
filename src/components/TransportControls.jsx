function TransportControls({ bpm, isPlaying, isLoading, onPlayStop, onReset }) {
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
            <span id="tempo-value">{bpm}</span>
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
