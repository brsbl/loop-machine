function TransportControls({ isPlaying, isLoading, onPlayStop, onReset }) {
  return (
    <div className="right-controls">
      <button id="reset-button" onClick={onReset}>
        RESET
      </button>
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
