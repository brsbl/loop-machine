# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A browser-based 16-step drum machine/loop sequencer with 3 instruments (hi-hat, snare, kick). Built with vanilla HTML, CSS, and JavaScript using the Web Audio API.

## Running the Project

Serve the project with any static file server:
```bash
npx serve . -l 3000
```

Then open http://localhost:3000 in a browser.

## Architecture

### Core Files
- `index.html` - Single page app structure with sequencer grid, sidebar, and controls
- `script.js` - All application logic (audio, UI, state management)
- `style.css` - Styling with CSS Grid layout for the sequencer

### Audio System
- Uses Web Audio API with `AudioContext`
- Each instrument has its own audio routing chain: source -> gainNode -> effects -> destination
- Effects per instrument: reverb (gain-based wet/dry) and delay (with feedback loop)
- Scheduling uses a lookahead scheduler pattern (`scheduler()` function) with 25ms intervals

### State Management
- `sequenceState` object holds boolean arrays (16 steps) per instrument
- URL-based state persistence using compact encoding:
  - Notes: 16 booleans encoded as 4-char hex per instrument
  - Sliders: single char ('0'-'9', 'a' for 10) per slider
  - Format: `?s={notes}_{sliders}&sidebar=1`
- Sidebar contains a JSON editor for direct state manipulation

### UI Components
- Sequencer grid: 16-step buttons per instrument with visual beat grouping (4 beats)
- Effect sliders: reverb and delay per instrument (0-10 range)
- Play/Stop toggle button with visual playhead animation using `requestAnimationFrame`
- Collapsible sidebar with JSON state editor

### Audio Samples
Audio files are located in `808 Samples/` directory:
- `hi hat (30).wav`
- `snare.wav`
- `kick.wav`
