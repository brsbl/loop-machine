# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Loop Machine is a browser-based drum sequencer built with vanilla JavaScript and the Web Audio API. It features a 16-step sequencer with 3 instrument tracks (hi-hat, snare, kick), per-instrument reverb/delay effects, URL state persistence, and a JSON editor sidebar.

## Architecture

### Core Files

- `index.html` - Main HTML structure with sequencer grid, sidebar, and modal
- `script.js` - All application logic (audio, UI, state management)
- `style.css` - CSS Grid-based layout and styling

### Audio System

The application uses the Web Audio API with this signal flow per instrument:
```
BufferSource -> mainGain -> [dry path to output]
                         -> reverbNode -> output
                         -> delayNode -> feedbackNode -> delayNode (feedback loop)
                                      -> delayWetGain -> output
```

Key audio variables:
- `audioContext` - Main Web Audio context
- `audioBuffers` - Decoded audio samples per instrument
- `effectNodes` - Gain/effect nodes per instrument
- `sequenceState` - Boolean arrays (16 steps) per instrument

### State Management

State is persisted in the URL using a compact encoding:
- Notes: 4-char hex per instrument (16 boolean steps as binary)
- Effects: 2 chars per instrument (reverb/delay values 0-10)
- Sidebar: `1` if visible

Functions:
- `updateUrlState()` - Writes current state to URL
- `loadUrlState()` - Restores state from URL on load
- `getCurrentStateAsJson()` - Returns state for JSON editor

### Timing System

Uses a scheduler pattern for accurate audio timing:
- `scheduler()` - Schedules notes ahead of playback time
- `updatePlayheadVisuals()` - RAF loop for visual step highlighting
- `scheduleAheadTime` - How far ahead to schedule (100ms)
- `stepTime` - Duration of one 16th note at current BPM

## Development Commands

Serve locally:
```bash
npx serve .
```

No build step required - vanilla JS served directly.

## Common Tasks

### Adding a New Instrument

1. Add entry to `instrumentsData` array with `name`, `id`, and `path`
2. Place audio file in `808 Samples/` directory
3. UI is generated automatically from `instrumentsData`

### Modifying Effects

Effect parameters are in `updateEffect()`:
- Reverb: Simple gain control (0-1)
- Delay: Time (0-0.5s), feedback (0-0.7), wet gain (0-0.5)

### Changing BPM

Modify the `bpm` constant (line 14). `stepTime` is calculated from it.

## Testing

No automated tests currently. Manual testing:
1. Toggle notes and verify visual feedback
2. Start/stop playback
3. Adjust effect sliders
4. Reload page and verify URL state restoration
5. Edit JSON and apply changes
6. Test reset functionality
