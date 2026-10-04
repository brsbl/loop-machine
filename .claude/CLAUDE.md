# CLAUDE.md

Guidance for Claude Code working in this repository.

## Project

Loop Machine (LM-919) is a browser drum machine + synth: a 16-step drum sequencer (hi-hat, snare, kick) and an arpeggiated synth on a two-octave keyboard. React 19, TypeScript, Vite, Web Audio API. pnpm only.

## Architecture

```
src/instruments.ts   drum registry (id, label, synthesized voice, firing color) and keyboard notes
src/session/         Session types, pure commands (applyCommand), store, share-link format
src/engine/          audio engine; must not import React (ESLint enforces this)
src/ui/              React components, CSS Modules, tokens.css, vendored fonts
```

- **One session document** is the source of truth. UI dispatches `Command`s; `applyCommand` is pure and tested. The store keeps undo history (knob drags coalesce into one step), notifies the engine (`engine.apply`), and rewrites the share link.
- **Exploring:** `src/session/library.ts` holds the ready-made patterns (the app opens on the first) and the chords. Holding the first key with no synth steps fills in a default rhythm.
- **Engine:** `Clock` schedules 100 ms ahead, ticked from a Worker so background tabs keep time. The sound is aimed at dirty French electro (Justice, Daft Punk, a little disco). `mixer.ts` builds the whole signal chain once. Drums are synthesized per hit in `drums.ts` (808 kick with a 909-style snap, driven 909 snare, clean disco open hat; no samples), each with a DECAY tail multiplier, and run through a `ChannelStrip` (volume → mix bus, with a send to the stereo ping-pong delay in `delay.ts`). The `Synth` is a seven-voice detuned stereo unison plus a sub, through a plucked low-pass, light drive, and a 7 kHz high cut; it starts voices at scheduled times and releases the previous arp note at the next note's start. The synth, delay, and reverb run through the `Pump`, which ducks on every kick like a sidechain; drums bypass it. Everything meets in the mix bus (gentle glue compressor with headroom) before a safety limiter. The playhead (`step`, fired `note`) is published when each step actually sounds.
- **Share link (v2):** `?s=2~<bpm>~<drum>~…~syn.<…>`, keyed by drum id. See `src/session/url.ts`. Malformed parts fall back to defaults.

## Adding a drum

Write the voice in `src/engine/drums.ts`, then add an entry to `DRUMS` in `src/instruments.ts`. The step row, knobs, firing color, and link field follow.

## Design

The look is documented in the "Loop Machine Revival" proposal: TR-909 identity pieces (cream step keys with LEDs, chrome knobs, red 7-segment tempo, Michroma nameplate, navy Archivo labels) on modern glass surfaces. Tokens live in `src/ui/tokens.css`. Knobs snap to 11 notches and the fader to 9; both accept drag, click, wheel, and arrow keys.

## Commands

```bash
pnpm dev        # http://localhost:3000
pnpm build
pnpm lint
pnpm typecheck
pnpm test       # Vitest: logic and component tests (jsdom, no Web Audio)
pnpm test:e2e   # Playwright: the production build in real Chrome
```

CI runs lint, typecheck, test, build, and the browser smoke tests on every PR.
