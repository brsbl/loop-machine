# The 1984 Digital Control System

A unified design language for retro-inspired musical interfaces—drum machines, synth modules, sequencers, and hybrid workstations. It blends the visual DNA of Roland TR-707, Oberheim OB-series, and early digital lab equipment into a clean, modern, production-ready UI system.

![1984 Digital Control System](./1984-digital-control-system.png)

---

## 1. Visual Philosophy

A crisp, minimal, industrial 1980s aesthetic:

- Flat surfaces with subtle depth (not cartoonish)
- Strict geometry and modular spacing
- High-contrast labeling for instant legibility
- A color system that honors vintage plastics, painted metal, and LED displays
- Hardware realism without clutter or over-nostalgia

The system must feel **precise, functional, and instrument-grade**, not skeuomorphic or toy-like.

---

## 2. Core Color System

Warm ABS neutrals form the base; TR-707 greys and oranges define interaction; synth-section colors add expressive but controlled contrast.

### Core Neutrals

| Token | Hex | Usage |
|-------|-----|-------|
| Cream | `#E7DFD1` | Primary housing |
| Warm Beige | `#D8CFBF` | Secondary surface |
| Dark Graphite | `#1F2021` | Panels & deep contrast |

### Pads & Drum Controls

| Token | Hex | Usage |
|-------|-----|-------|
| Pad Grey 1 | `#A9A9A9` | Inactive pads |
| Outline Grey | `#676F6F` | Borders, outlines |
| Accent Orange | `#ED7A24` | Active state, primary accent |
| Accent Amber | `#F2A33C` | Secondary accent, hover states |

### Synth Section Additions

| Token | Hex | Usage |
|-------|-----|-------|
| Oberheim Blue | `#4A70A8` | Oscillators, filters |
| Teal Circuit | `#3F8F8C` | Modulation, routing |
| Warm Yellow | `#E5C26E` | Envelope stages |
| Slate Violet | `#6E5A86` | Advanced functions |
| Soft Mint | `#9BF3D3` | Indicator LEDs, highlights |

### LED Display

| Token | Hex | Usage |
|-------|-----|-------|
| LED Red | `#E34234` | Active LED segments |
| LED Background | `#151515` | Display background |

The palette is intentionally **muted, technical, and cohesive**, supporting complex interfaces without visual noise.

---

## 3. Typography

Typography anchors the system in the industrial 80s aesthetic:

| Font | Usage |
|------|-------|
| **Eurostile / Microgramma** | Device titles & section headers |
| **DIN / Roboto Condensed** | Labels, step numbers, UI text |
| **DSEG7 / Digital-7** | Tempo displays & numeric LEDs |

### Guiding Principles

- Use **Eurostile Extended** for identity (e.g., `DIGITAL DRUM SYNTHESISER DS-02`)
- Use **DIN** for functional clarity
- Maintain generous tracking and consistent uppercase usage

### Type Scale

```
Title:    Eurostile Extended, 18-24px, tracking 0.15em
Header:   Eurostile, 12-14px, tracking 0.1em, uppercase
Label:    DIN/Roboto Condensed, 10-12px, tracking 0.05em, uppercase
Step:     DIN, 9-10px, tracking 0.02em
LED:      DSEG7, 24-32px, monospace
```

---

## 4. Components & Interaction Model

### Pads (Drum Steps)

- TR-707-inspired square pads
- Flat or minimally raised
- Grey for inactive, Orange/Amber for active
- Step numbers above or below using DIN

```
┌────┐ ┌────┐ ┌────┐ ┌────┐
│    │ │████│ │    │ │████│  ← Active pads filled
└────┘ └────┘ └────┘ └────┘
  1      2      3      4
```

### Buttons

- Larger rectangular buttons for START, RESET, MODE
- Dark or cream backgrounds with high-contrast labels
- Minimal beveling (1–2px) for tactile realism

### Instrument Selectors

- Vertical left-side cluster (HI-HAT, SNARE, KICK, etc.)
- Black or charcoal base with gold/orange text

```
┌─────────────┐
│  HI-HAT     │
├─────────────┤
│  SNARE      │
├─────────────┤
│  KICK       │
└─────────────┘
```

### Keyboard (Synth Input)

- Oberheim-style thin rectangular keys
- Minimal shadows
- Consistent width and alignment

### LED & Status Indicators

- Always red or mint
- Monospaced seven-segment style
- No glows except extremely subtle bloom

```
┌─────────────┐
│  ▓▓▓   ▓▓▓ │
│ █   █ █   █│  ← Seven-segment display
│  ▓▓▓   ▓▓▓ │
│ █   █ █   █│
│  ▓▓▓ . ▓▓▓ │
└─────────────┘
    1 2 0  BPM
```

### Spacing & Layout

- Everything aligns to a strict grid
- Equal horizontal rhythms across pads
- Vertical stacks for sections (Instruments → Sequencer → Synth → Keyboard)
- Icons minimized; text-first labeling

---

## 5. Tailwind Token Mapping

```js
// tailwind.config.js
colors: {
  // Core Neutrals
  cream: '#E7DFD1',
  beige: '#D8CFBF',
  graphite: '#1F2021',

  // Pads & Drums
  pad: {
    grey: '#A9A9A9',
    outline: '#676F6F',
  },
  accent: {
    orange: '#ED7A24',
    amber: '#F2A33C',
  },

  // Synth Section
  synth: {
    blue: '#4A70A8',
    teal: '#3F8F8C',
    yellow: '#E5C26E',
    violet: '#6E5A86',
    mint: '#9BF3D3',
  },

  // LED
  led: {
    red: '#E34234',
    bg: '#151515',
  },
}
```

---

## 6. System Goals

The system enables:

- A cohesive family of drum/synth products
- Clear, functional musical interfaces
- Scalable UI (1–16+ rows, expanded synth modules)
- A modern digital app that still feels instrument-grade
- A consistent visual identity across hardware, software, marketing

---

## 7. Summary

The 1984 Digital Control System is a complete visual framework that merges:

- **Vintage instrument authenticity**
- **Modern usability**
- **A unique brand identity** built on flat geometry, warm neutrals, modular components, and disciplined typography

It is intentionally **timeless**: retro in style, modern in precision, and fully extensible across drums, synthesis, sequencing, and performance tools.

---

## Quick Reference

| Element | Inactive | Active | Accent |
|---------|----------|--------|--------|
| Pad | `#A9A9A9` | `#ED7A24` | `#F2A33C` |
| Button | `#1F2021` | `#ED7A24` | — |
| LED | `#151515` | `#E34234` | `#9BF3D3` |
| Surface | `#E7DFD1` | — | `#D8CFBF` |

| Typography | Font | Size | Tracking |
|------------|------|------|----------|
| Title | Eurostile Extended | 18-24px | 0.15em |
| Label | DIN | 10-12px | 0.05em |
| LED | DSEG7 | 24-32px | 0 |
