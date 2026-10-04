# Loop Machine · LM-919

A drum machine + synth in your browser, styled after the Roland TR-909. Program a beat, hold a chord, and share the whole loop as a link.

## Features

- **Drums:** 16-step sequencer for hi-hat, snare, and kick, synthesized 909-style in the browser (no samples), each with volume, reverb, and tone knobs
- **Synth:** arpeggiator over a two-octave keyboard, with a detuned two-oscillator voice, a sub, and a plucked filter. Keys choose which notes play; the synth's step row chooses when. Direction (up, down, up-down), speed (1/4, 1/8, 1/16), and four waveforms
- **Playback:** on steps carry a soft tint of their instrument's color and light up fully when they fire; a beat band marks the four beats; the synth's key flashes with its step
- **Controls:** knobs click to 11 notches and the fader to 9. Drag, click a notch, scroll, or use the arrow keys
- **Computer keyboard:** A–C and W–\ toggle notes, like a piano layout
- **Share links:** the URL holds the whole loop, drums and synth included

## Run it

```bash
pnpm install
pnpm dev
```

Then open http://localhost:3000.

## Project layout

```
src/
  instruments.ts     registry: drums (id, label, voice, color) and keyboard notes
  engine/            audio engine, no React: clock, channel strips, reverb, drum voices, synth, arpeggiator
  session/           session types, commands, store, and share-link format
  ui/                React components, design tokens, and fonts
```

The UI only renders the session and dispatches commands. The engine follows the session and reports the playhead back.

Adding a drum: write its voice in `src/engine/drums.ts`, then add one entry in `src/instruments.ts`:

```ts
{ id: 'clap', label: 'Clap', voice: 'clap', fire: { top: '…', bottom: '…', glow: '…' } }
```

Its step row, knobs, firing color, and share-link field follow automatically.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Dev server on port 3000 |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript |
| `pnpm test` | Vitest |

## Credits

- Fonts: Michroma, Archivo, and DSEG7 Classic, under the SIL Open Font License (see `src/ui/fonts/`)

## License

MIT
