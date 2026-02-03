# Loop Machine

A browser-based drum sequencer/loop machine built with vanilla JavaScript and the Web Audio API.

<img width="1547" height="919" alt="Screenshot 2026-02-02 at 11 09 54 PM" src="https://github.com/user-attachments/assets/96332914-ee74-40f1-830d-249a67b5ba21" />

## Features

- **16-step sequencer** with 3 instrument tracks (hi-hat, snare, kick)
- **Real-time playback** with visual step indicator
- **Per-instrument effects**: Reverb and Delay with adjustable levels (0-10)
- **URL state persistence**: Share patterns via URL
- **JSON editor sidebar**: View and edit sequencer state directly as JSON
- **Reset functionality**: Clear all patterns and effects with confirmation modal

## Getting Started

### Prerequisites

- A modern web browser with Web Audio API support
- A local web server (for loading audio samples)

### Running Locally

1. Clone the repository
2. Serve the directory with any static file server:
   ```bash
   npx serve .
   ```
3. Open `http://localhost:3000` in your browser

### Audio Samples

The project uses 808 drum samples located in the `808 Samples/` directory:
- `hi hat (30).wav`
- `snare.wav`
- `kick.wav`

## Usage

1. Click **START/STOP** to begin/stop playback
2. Click on sequencer pads to toggle notes on/off
3. Adjust **REVERB** and **DELAY** sliders for each instrument
4. Use the sidebar toggle to open the JSON editor for direct state manipulation
5. Click **RESET** to clear all patterns (requires confirmation)

## URL State Format

The sequencer state is encoded in the URL using a compact format:
- `s` parameter: `{notes_hex}_{sliders_chars}`
  - Notes: 4-character hex per instrument (16 steps as binary)
  - Sliders: 2 characters per instrument (reverb + delay, 0-9 or 'a' for 10)
- `sidebar` parameter: `1` if sidebar is visible

## Project Structure

```
loop-machine/
├── index.html          # Main HTML structure
├── script.js           # Core application logic
├── style.css           # Styling
├── 808 Samples/        # Drum audio samples
└── src/
    └── utils/          # Utility functions
```

## Tech Stack

- Vanilla JavaScript (ES6+)
- Web Audio API for audio playback and effects
- CSS Grid for layout
- No external dependencies

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines. For bugs or feature requests, please [open an issue](https://github.com/brsbl/loop-machine/issues/new).

## License

MIT
