const KEYBOARD_PATTERN = [
  'white', 'black', 'white', 'black', 'white',
  'white', 'black', 'white', 'black', 'white', 'black', 'white',
  'white', 'black', 'white', 'black', 'white',
  'white', 'black', 'white', 'black', 'white', 'black', 'white',
]

function Keyboard() {
  return (
    <div className="keyboard-section">
      <div className="keyboard">
        {KEYBOARD_PATTERN.map((keyType, i) => (
          <div key={i} className={`key ${keyType}`}></div>
        ))}
      </div>
    </div>
  )
}

export default Keyboard
