# Loop Machine PRD

## Overview
**Product**: Loop Machine — browser-based drum sequencer & arpeggiator
**Target Users**: Beginner musicians and hobbyist producers
**Purpose**: Personal roadmap for feature development

## Current State (v1)
- 16-step sequencer with 3 tracks (kick, snare, hi-hat)
- Per-track reverb effects
- Volume per instrument
- URL state persistence (shareable patterns)
- 120 BPM fixed tempo

## Goals
- Keep it simple — fun to use in under 30 seconds
- Low latency (<50ms response time)
- Works offline after initial load

## Non-Goals
- ❌ Full DAW (no recording, arrangement, mixing)


## Roadmap

### P0 — Must Have
- **Tempo control** — editable BPM input field
- **Playable keyboard** — activate piano keys for melodic input
- **Arpeggiator** — auto-cycle held notes, synced to sequencer tempo
  - Direction (up/down/up-down)
  - Rate (1/4, 1/8, 1/16)

### P1 — Should Have
- **Pitch bend** — slide synth pitch up/down
- **Filter** — hi-pass/lo-pass sweep for synth
- **Visual waveform** — real-time audio visualization

### P2 — Nice to Have
- **More instruments** — bass, claps, toms from existing 808 samples
- **Preset patterns** — built-in starter beats

## Technical Constraints
- Web Audio API only (no external audio libs)
- Must maintain <50ms latency
- URL state encoding must stay compact
- No build-time dependencies beyond Vite/React