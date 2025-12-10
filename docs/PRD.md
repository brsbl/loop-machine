# Loop Machine PRD

## Overview
**Product**: Loop Machine — browser-based drum sequencer & arpeggiator
**Target Users**: Beginner musicians and hobbyist producers
**Purpose**: Personal roadmap for feature development

## Current State (v1)
- 16-step sequencer with 3 tracks (kick, snare, hi-hat)
- Per-track volume slider
- URL state persistence (shareable patterns)
- 120 BPM fixed tempo
- Decorative piano keyboard (non-functional)

## Goals
- Keep it simple — fun to use in under 30 seconds
- Low latency (<50ms response time)
- Works offline after initial load

## Non-Goals
- ❌ Full DAW (no recording, arrangement, mixing)


## Roadmap

### P0 — Must Have

**Sequencer Controls**
- **Knob controls** — replace sliders with rotary knobs
  - Volume
  - Attack
  - Decay

**Synth Keyboard**
- **Playable synth** — piano keys trigger oscillator-based synth
- **Waveform display** — container above keyboard visualizing pitch waveform
- **LFO slider** — control pitch modulation
- **Arpeggiator** — auto-cycle held notes, synced to sequencer
  - Direction (up/down/up-down)
  - Rate (1/4, 1/8, 1/16)

**Filter Control**
- **XY pad** — 2x2 draggable dot control
  - X-axis: low-pass filter cutoff
  - Y-axis: high-pass filter cutoff

**Other**
- **Tempo control** — editable BPM input field

## Technical Constraints
- Tone.js for audio (see TECH_STACK.md)
- Must maintain <50ms latency
- URL state encoding must stay compact
