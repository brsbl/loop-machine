import DrumMachine from './components/DrumMachine'
import { DEFAULT_INSTRUMENTS } from './config/instruments'

function App() {
  return <DrumMachine instruments={DEFAULT_INSTRUMENTS} />
}

export default App
