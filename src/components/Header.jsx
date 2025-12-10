function Header({ title, bpm }) {
  return (
    <div className="header">
      <h1 className="title">{title}</h1>
      <div className="tempo-section">
        <span className="tempo-label">TEMPO</span>
        <div className="tempo-display">
          <span id="tempo-value">{bpm}</span>
        </div>
      </div>
    </div>
  )
}

export default Header
