# Loop Machine

A browser-based 16-step drum machine/loop sequencer built with vanilla JavaScript and the Web Audio API.

## Features

- **3 Instruments**: Hi-hat, snare, and kick drum with 808 samples
- **16-Step Sequencer**: Visual grid with beat grouping (4 beats per measure)
- **Per-Instrument Effects**: Reverb and delay controls for each track
- **URL State Persistence**: Share your patterns via URL
- **JSON Editor**: Direct state manipulation through sidebar panel
- **Visual Playhead**: Real-time step highlighting during playback

## Quick Start

```bash
npx serve . -l 3000
```

Open http://localhost:3000 in your browser.

## Usage

1. Click the step buttons to toggle notes on/off
2. Adjust reverb and delay sliders for each instrument
3. Press START/STOP to control playback
4. Toggle the sidebar to view/edit state as JSON
5. Share your pattern by copying the URL

## Tech Stack

- Vanilla HTML/CSS/JavaScript
- Web Audio API for audio playback and effects
- CSS Grid for sequencer layout
