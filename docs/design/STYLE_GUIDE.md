# Loop Machine Style Guide

> **DEPRECATED:** This file documents the original implementation. For the canonical design system, see **`DESIGN_SYSTEM.md`** which defines "The 1984 Digital Control System" - the unified design language for this project.

---

## Status

This style guide reflects the **current CSS implementation** in `src/index.css`. It will be replaced during the Tailwind migration (see `../ROADMAP.md` Phase 1).

**For new development, use:**
- `./DESIGN_SYSTEM.md` - Color tokens, typography, component specs
- `../ROADMAP.md` - Implementation plan with Tailwind classes

---

## Legacy Design Principles

1. **Hardware Authenticity:** The interface emulates classic drum machines and synthesizers. Gradients, shadows, and textures create tactile depth that invites interaction.
2. **Visual Rhythm:** The 16-step grid with 4-pad groupings reinforces musical structure. Beat markers and step numbers maintain spatial orientation during playback.
3. **Immediate Feedback:** Every interaction produces visible response within one frame. Active states glow, playing steps brighten, and held notes illuminate.
4. **Focused Workflow:** Controls are positioned close to the elements they affect. Track controls sit adjacent to their pads; transport controls anchor the bottom-right corner.

---

## Color System

Colors are defined directly in `src/index.css`. The palette draws from vintage hardware aesthetics with warm neutrals and accent highlights.

### Core Palette

| Name | Hex | Primary Uses |
|------|-----|--------------|
| `machine-light` | `#e8e4dc` | Gradient start for main container |
| `machine-mid` | `#d4d0c8` | Primary surface color, gradient midpoint |
| `machine-dark` | `#c8c4bc` | Gradient end, inset backgrounds |
| `control-surface` | `#d8d4cc` → `#c8c4bc` | Track controls, control boxes |
| `dark-surface` | `#3a3a3a` → `#2a2a2a` | Transport controls, keyboard section |
| `ink-primary` | `#1a1a1a` | Primary text, borders |
| `ink-secondary` | `#222` | Instrument labels |
| `ink-muted` | `#444` | Step numbers |
| `ink-faint` | `#555` | Control box labels |

### Accent Colors

| Name | Hex | Primary Uses |
|------|-----|--------------|
| `accent-orange` | `#f5a623` | Active pads, held keys, fader indicators |
| `accent-orange-dark` | `#e08a00` | Orange gradient endpoints |
| `accent-green` | `#27ae60` | Arpeggiator active pads |
| `accent-green-light` | `#2ecc71` | Arpeggiator hover states |
| `mute-red` | `#e74c3c` | Mute button (CSS defined, UI not implemented) |
| `solo-yellow` | `#f39c12` | Solo button (CSS defined, UI not implemented) |

### State Colors

| State | Color Treatment |
|-------|-----------------|
| Inactive pad | `#6a6a6a` → `#525252` gradient |
| Beat-start pad | `#a8a8a8` → `#8a8a8a` gradient (lighter) |
| Active pad | `#f5a623` → `#e08a00` gradient with glow |
| Playing step | `brightness(1.3)` filter with white glow |
| Held key | Orange gradient with `0 0 12px` glow |
| Playing key | White-to-orange gradient with `0 0 20px` glow |

### Usage Guidelines

- Use gradients consistently: lighter color at top (0%), darker at bottom (100%)
- Glow effects use `box-shadow` with color at 40-50% opacity
- Inset shadows create depth on recessed elements (fader tracks, tempo display)
- Border colors are typically `rgba(0, 0, 0, 0.15)` for subtle definition
- Never use pure white (`#fff`) for surfaces; use off-white tones
- Body background `#8a9a9c` provides contrast for the main container

---

## Typography

### Font Stacks

**Primary (UI):**
```css
font-family: "Helvetica Neue", Arial, sans-serif;
```

**Display (Tempo):**
```css
font-family: "LCD", "Digital-7", "Courier New", monospace;
```

### Type Scale

| Element | Size | Weight | Letter Spacing | Usage |
|---------|------|--------|----------------|-------|
| Title | 2.7em (~43px) | 900 | 3px | Main "LOOP MACHINE" header |
| Instrument Label | 1.125em (18px) | 700 | 0.75px | Track names (HI-HAT, SNARE, KICK) |
| Step Number | 1.05em (~17px) | 600 | — | Sequencer step indicators |
| Transport Label | 0.9em (~14px) | 600 | 1.5px | TEMPO, RESET labels |
| Control Label | 9px | 700 | 1px | DIR, SPEED, VOL, WAVE labels |
| Tempo Display | 2em (32px) | bold | 2px | BPM value |
| Button Text | 1.1em (18px) | 700 | 1px | START/STOP button |
| Track Button | 0.825em (~13px) | 700 | — | Small control buttons |

### Text Treatments

- Instrument labels: `text-transform: uppercase`
- Control labels: `text-transform: uppercase`
- Transport labels: `text-transform: uppercase`
- Title: `text-shadow: 1px 1px 0 rgba(255, 255, 255, 0.3)`

---

## Spacing System

Base unit: **6px** for component gaps, **4px** for internal padding.

| Context | Value | Usage |
|---------|-------|-------|
| Pad gap | 6px | Space between sequencer pads |
| Track gap | 12px | Vertical space between instrument tracks |
| Control gap | 8px | Space between track control faders |
| Section margin | 16px | Arp track section top margin/padding |
| Container padding | 38px 45px 30px 45px | Main drum machine padding |
| Bottom row margin | 24px | Space above keyboard/transport row |
| Control box padding | 8px 10px | Internal padding for control groups |

### Fixed Widths

| Element | Width | Notes |
|---------|-------|-------|
| Instrument label | 90px | Fixed width for alignment |
| Controls spacer | 240px | Aligns step numbers with pads |
| Fader wrapper | 60px | Horizontal fader track width |
| Fader thumb | 24px × 24px | Circular drag handle |
| Note button | 36px × 42px | Standard drum pad |
| Hi-hat pad | 36px × 24px | Shorter pads for hi-hat row |
| Key (white) | 48px × 150px | Piano white keys |
| Key (black) | 36px × 90px | Piano black keys |
| Min container | 1080px | Minimum width for layout |

---

## Layout

### Main Container Structure

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER                                                       │
│   Title: "LOOP MACHINE"                                      │
├─────────────────────────────────────────────────────────────┤
│ SEQUENCER SECTION                                            │
│   ┌──────────────────────────────────────────────────────┐  │
│   │ Step Numbers (1-16)                                   │  │
│   ├──────────────────────────────────────────────────────┤  │
│   │ HI-HAT  │ [pads 1-16]                    │ [controls] │  │
│   │ SNARE   │ [pads 1-16]                    │ [controls] │  │
│   │ KICK    │ [pads 1-16]                    │ [controls] │  │
│   ├──────────────────────────────────────────────────────┤  │
│   │ ARP TRACK (green accents)                             │  │
│   │ ARP     │ [pads 1-16]                                 │  │
│   └──────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│ BOTTOM ROW                                                   │
│   [Spacer] [Keyboard Controls + Keyboard]  [Transport]       │
└─────────────────────────────────────────────────────────────┘
```

### Pad Groups

Pads are grouped into sets of 4, with alternating bordered groups:

```
[1-2-3-4] [5-6-7-8] [9-10-11-12] [13-14-15-16]
 bordered            bordered
```

Bordered groups use:
```css
border: 1px solid rgba(0, 0, 0, 0.25);
border-radius: 4px;
padding: 3px;
margin: -3px; /* compensate for padding */
```

### Flexbox Patterns

- Tracks: `flex-direction: column` with `gap: 12px`
- Track row: `flex` with `align-items: center` and `gap: 12px`
- Control boxes: `flex-direction: column` with `align-items: center`
- Bottom row: `flex` with `align-items: flex-end`

---

## Components

### Note Button (Pad)

Standard sequencer step button.

```css
.note-button {
  width: 36px;
  height: 42px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.08s ease;
}
```

**States:**
- Default: Dark gray gradient (`#6a6a6a` → `#525252`)
- Beat-start: Light gray gradient (`#a8a8a8` → `#8a8a8a`)
- Active: Orange gradient with 12px glow
- Playing: `brightness(1.3)` with white 18px glow
- Arp active: Green gradient (`#27ae60` → `#1e8449`)

### Track Controls

Horizontal fader group for volume, reverb, delay.

```css
.track-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: linear-gradient(180deg, #d8d4cc 0%, #c8c4bc 100%);
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.15);
}
```

### Fader

Horizontal slider with circular thumb.

**Track:**
```css
.fader-track {
  width: 100%;
  height: 10px;
  background: linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%);
  border-radius: 5px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.5);
}
```

**Thumb:**
```css
.fader-thumb {
  width: 24px;
  height: 24px;
  cursor: grab;
}

.fader-thumb-grip {
  background: linear-gradient(180deg, #5a5a5a 0%, #3a3a3a 50%, #2a2a2a 100%);
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
}

.fader-thumb-indicator {
  width: 4px;
  height: 14px;
  background: linear-gradient(180deg, #f5a623 0%, #e08a00 100%);
  border-radius: 2px;
}
```

### Control Box

Container for arpeggiator and synth controls.

```css
.control-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  background: linear-gradient(180deg, #d8d4cc 0%, #c8c4bc 100%);
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.15);
}

.control-box-label {
  font-size: 9px;
  font-weight: 700;
  color: #555;
  letter-spacing: 1px;
  text-transform: uppercase;
}
```

### Control Button

Small buttons within control boxes (DIR, SPEED, WAVE).

```css
.control-btn {
  width: 32px;
  height: 26px;
  font-size: 11px;
  font-weight: 700;
  border: 1px solid #444;
  border-radius: 4px;
  background: linear-gradient(180deg, #5a5a5a 0%, #3a3a3a 100%);
  color: #aaa;
}

.control-btn.active {
  background: linear-gradient(180deg, #f5a623 0%, #e08a00 100%);
  border-color: #f5a623;
  color: #fff;
  box-shadow: 0 0 8px rgba(245, 166, 35, 0.4);
}
```

### Piano Keys

**White Key:**
```css
.key.white {
  width: 48px;
  height: 150px;
  background: linear-gradient(180deg, #fafafa 0%, #e8e8e8 100%);
  border: 1px solid #ccc;
  border-radius: 0 0 6px 6px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
}

.key.white.held {
  background: linear-gradient(180deg, #f5a623 0%, #e08a00 100%);
  box-shadow: 0 0 12px rgba(245, 166, 35, 0.4);
}
```

**Black Key:**
```css
.key.black {
  width: 36px;
  height: 90px;
  background: linear-gradient(180deg, #3a3a3a 0%, #1a1a1a 100%);
  border-radius: 0 0 4px 4px;
  margin-left: -18px;
  margin-right: -18px;
  z-index: 2;
}

.key.black.held {
  background: linear-gradient(180deg, #f5a623 0%, #c07000 100%);
}
```

**Key Hints:**
```css
.key-hint {
  position: absolute;
  bottom: 8px;
  font-size: 10px;
  font-weight: 600;
  opacity: 0.5;
  text-transform: uppercase;
}
```

### Transport Controls

Play/stop and reset section.

```css
.transport-controls {
  background: linear-gradient(180deg, #3a3a3a 0%, #2a2a2a 100%);
  padding: 14px 16px;
  border-radius: 8px;
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.4);
}

#play-stop-button {
  width: 100%;
  padding: 14px 6px;
  font-size: 1.1em;
  font-weight: 700;
  text-transform: uppercase;
  background: linear-gradient(180deg, #4a4a4a 0%, #2a2a2a 100%);
  border: 2px solid #1a1a1a;
  color: #e0e0e0;
}
```

### Tempo Display

LCD-style BPM input.

```css
.tempo-display {
  background: #c5c8b8;
  padding: 8px 14px;
  border-radius: 4px;
  border: 3px solid #1a1a1a;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
}

#tempo-value {
  font-family: "LCD", "Digital-7", "Courier New", monospace;
  font-size: 2em;
  color: #1a1a1a;
  letter-spacing: 2px;
  font-weight: bold;
  background: transparent;
  border: none;
  width: 3.5ch;
}
```

### Loading Overlay

Full-screen loading state.

```css
.loading-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(145deg, #e8e4dc 0%, #d4d0c8 50%, #c8c4bc 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 22px;
  z-index: 100;
  border-radius: 18px;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 6px solid #c8c4bc;
  border-top: 6px solid #f5a623;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
```

---

## Shadows & Depth

### Shadow Hierarchy

| Depth Level | Box Shadow | Usage |
|-------------|------------|-------|
| Elevated | `0 12px 48px rgba(0,0,0,0.3), 0 3px 12px rgba(0,0,0,0.2)` | Main container |
| Surface | `0 3px 6px rgba(0,0,0,0.3)` | Pads, buttons |
| Recessed | `inset 0 2px 6px rgba(0,0,0,0.4)` | Transport section, keyboard container |
| Glow | `0 0 12px rgba(245,166,35,0.4)` | Active states |

### Inset Highlights

Add subtle top highlights and bottom shadows to create physicality:

```css
/* Top highlight */
inset 0 1px 0 rgba(255, 255, 255, 0.15)

/* Bottom shadow */
inset 0 -1px 0 rgba(0, 0, 0, 0.2)
```

---

## Animation & Transitions

### Standard Transitions

| Element | Duration | Easing |
|---------|----------|--------|
| Buttons | 0.1s | ease |
| Pads | 0.08s | ease |
| Keys | 0.05s | ease |

### Keyframe Animations

**Spin (loading):**
```css
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

**Pulse (loading text):**
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

---

## Accessibility

### Current Implementation

- Fader has `role="slider"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- Fader has `tabIndex={0}` for keyboard focus
- Components use `memo()` for performance

### Required Improvements

- Add `aria-label` to all interactive elements without visible text
- Add `aria-pressed` to toggle buttons (mute, solo, pads)
- Add keyboard event handlers to Fader (`onKeyDown` for arrow keys)
- Add visible focus indicators:
  ```css
  :focus-visible {
    outline: 3px solid #f5a623;
    outline-offset: 2px;
  }
  ```
- Improve color contrast on labels (current `#555` on `#d4d0c8` fails WCAG AA)
- Increase key hint opacity from 0.5 to 0.7+

---

## React Component Patterns

### Memoization

All leaf components use `React.memo()`:
- `Pad`
- `Key`
- `Keyboard`
- `Track`
- `TrackControls`
- `Fader`
- `KeyboardControls`

### Event Handlers

Use `useCallback` for handlers passed to child components:

```jsx
const handleVolumeChange = useCallback((volume) => {
  onTrackSettingsChange(instrument.id, { volume })
}, [instrument.id, onTrackSettingsChange])
```

### Class Name Composition

Build class names with array filter pattern:

```jsx
const classNames = [
  'note-button',
  active ? 'active' : '',
  playing ? 'playing-step' : '',
  isBeatStart ? 'beat-start' : '',
].filter(Boolean).join(' ')
```

---

## File Organization

```
src/
├── components/
│   ├── ui/
│   │   └── Fader.jsx          # Reusable slider component
│   ├── ArpTrack.jsx           # Arpeggiator step track
│   ├── DrumMachine.jsx        # Main orchestrating component
│   ├── Header.jsx             # Title header
│   ├── Key.jsx                # Individual piano key
│   ├── Keyboard.jsx           # Piano keyboard container
│   ├── KeyboardControls.jsx   # DIR/SPEED/VOL/WAVE controls
│   ├── LoadingOverlay.jsx     # Loading state overlay
│   ├── Pad.jsx                # Sequencer step button
│   ├── Sequencer.jsx          # Main sequencer layout
│   ├── Track.jsx              # Instrument track row
│   ├── TrackControls.jsx      # Volume/reverb/delay faders
│   └── TransportControls.jsx  # Play/stop, reset, tempo
├── config/
│   ├── instruments.js         # Instrument definitions
│   └── keyboard.js            # Note mappings, QWERTY map
├── hooks/
│   ├── useArpeggiator.js      # Arpeggiator state/logic
│   ├── useAudioEngine.js      # Sample playback engine
│   ├── useSequencer.js        # Pattern/playback state
│   └── useSynthEngine.js      # Oscillator synth engine
├── utils/
│   └── urlState.js            # URL state persistence
├── App.jsx                    # Root component
├── index.css                  # All styles (no CSS modules)
└── main.jsx                   # Entry point
```

---

## Proposed Design System: 80s Synth Aesthetic

The current design captures vintage hardware feel. This section proposes a refined color palette and design tokens inspired by iconic 80s synthesizers and drum machines (Roland TR-808, Yamaha DX7, Sequential Circuits Prophet-5, Oberheim OB-Xa).

### Reference Hardware Aesthetics

| Device | Key Visual Elements |
|--------|---------------------|
| **Roland TR-808** | Cream/beige chassis, orange/red/yellow accent buttons, LCD green display |
| **Roland Juno-106** | Dark gray body, orange sliders, red/green LEDs |
| **Yamaha DX7** | Teal/cyan LCD, brown wood panels, gray buttons |
| **Oberheim OB-Xa** | Black chassis, wood end caps, orange/red knob caps |
| **Sequential Prophet-5** | Dark wood, cream panel, red/blue LEDs |

### Proposed Color Palette

#### Surface Colors (Chassis)

| Token | Hex | Inspiration | Usage |
|-------|-----|-------------|-------|
| `--surface-cream` | `#E8E4DC` | TR-808 body | Main container background |
| `--surface-warm` | `#D4D0C8` | Vintage equipment bezel | Secondary surfaces |
| `--surface-dark` | `#2A2A2A` | Juno-106 panels | Transport section, keyboard housing |
| `--surface-charcoal` | `#1A1A1A` | Control panels | Borders, deep recesses |

#### Accent Colors (Controls & Indicators)

| Token | Hex | Inspiration | Usage |
|-------|-----|-------------|-------|
| `--accent-orange` | `#F5A623` | TR-808 accent buttons | Active pads, primary actions |
| `--accent-red` | `#E74C3C` | LED indicators | Mute, recording, warnings |
| `--accent-amber` | `#F39C12` | Warm LEDs | Solo, secondary highlights |
| `--accent-green` | `#27AE60` | Arp/sequencer LEDs | Arpeggiator track, success states |
| `--accent-cyan` | `#00BCD4` | DX7 LCD | Display elements, focus rings |
| `--accent-magenta` | `#E91E63` | Neon accents | Hover states, special modes |

#### Display Colors (LCD/LED)

| Token | Hex | Inspiration | Usage |
|-------|-----|-------------|-------|
| `--lcd-green` | `#7FCD91` | Classic LCD segments | Tempo display, meters |
| `--lcd-background` | `#C5C8B8` | LCD backing | Display backgrounds |
| `--led-on` | `#FF5722` | Lit LED | Step indicators when playing |
| `--led-off` | `#4A4A4A` | Unlit LED | Inactive indicators |

#### Text Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--text-primary` | `#1A1A1A` | Labels, titles |
| `--text-secondary` | `#444444` | Step numbers, metadata |
| `--text-muted` | `#666666` | Hints, disabled text |
| `--text-on-dark` | `#E0E0E0` | Text on dark surfaces |
| `--text-display` | `#1A1A1A` | LCD/display text |

### Proposed Design Tokens (CSS Custom Properties)

```css
:root {
  /* Surfaces */
  --surface-cream: #E8E4DC;
  --surface-warm: #D4D0C8;
  --surface-cool: #C8C4BC;
  --surface-dark: #2A2A2A;
  --surface-charcoal: #1A1A1A;

  /* Accents */
  --accent-orange: #F5A623;
  --accent-orange-dark: #E08A00;
  --accent-red: #E74C3C;
  --accent-amber: #F39C12;
  --accent-green: #27AE60;
  --accent-green-light: #2ECC71;
  --accent-cyan: #00BCD4;
  --accent-magenta: #E91E63;

  /* LCD/Display */
  --lcd-green: #7FCD91;
  --lcd-background: #C5C8B8;
  --lcd-text: #1A1A1A;

  /* Text */
  --text-primary: #1A1A1A;
  --text-secondary: #444444;
  --text-muted: #666666;
  --text-on-dark: #E0E0E0;

  /* Shadows */
  --shadow-elevated: 0 12px 48px rgba(0,0,0,0.3), 0 3px 12px rgba(0,0,0,0.2);
  --shadow-surface: 0 3px 6px rgba(0,0,0,0.3);
  --shadow-inset: inset 0 2px 6px rgba(0,0,0,0.4);
  --shadow-glow-orange: 0 0 12px rgba(245,166,35,0.4);
  --shadow-glow-green: 0 0 12px rgba(39,174,96,0.4);
  --shadow-glow-cyan: 0 0 12px rgba(0,188,212,0.4);

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 6px;
  --space-md: 8px;
  --space-lg: 12px;
  --space-xl: 16px;
  --space-2xl: 24px;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 18px;

  /* Transitions */
  --transition-fast: 0.05s ease;
  --transition-normal: 0.08s ease;
  --transition-slow: 0.1s ease;
}
```

### 80s Typography Recommendations

| Element | Font | Fallback | Notes |
|---------|------|----------|-------|
| Display (BPM) | "LCD", "Digital-7" | "Courier New", monospace | 7-segment style |
| Labels | "Helvetica Neue" | Arial, sans-serif | Clean, technical |
| Alternative | "Eurostile" | "Microgramma", sans-serif | Retro-futuristic option |
| Accent | "Orbitron" | sans-serif | For special headers (optional) |

### Visual Effects for 80s Feel

#### Glow Effects
```css
/* Orange glow (active state) */
box-shadow: 0 0 12px rgba(245, 166, 35, 0.5),
            0 0 24px rgba(245, 166, 35, 0.2);

/* Cyan glow (focus/hover) */
box-shadow: 0 0 8px rgba(0, 188, 212, 0.6),
            0 0 16px rgba(0, 188, 212, 0.3);

/* Red LED glow */
box-shadow: 0 0 6px rgba(231, 76, 60, 0.8),
            inset 0 0 4px rgba(255, 255, 255, 0.3);
```

#### Gradient Buttons (Hardware Style)
```css
/* Raised button */
background: linear-gradient(180deg,
  rgba(255,255,255,0.15) 0%,
  transparent 50%,
  rgba(0,0,0,0.15) 100%),
  linear-gradient(180deg, #5a5a5a 0%, #3a3a3a 100%);

/* Pressed button */
background: linear-gradient(180deg,
  rgba(0,0,0,0.1) 0%,
  transparent 50%,
  rgba(255,255,255,0.05) 100%),
  linear-gradient(180deg, #3a3a3a 0%, #2a2a2a 100%);
```

#### LCD Display Effect
```css
.lcd-display {
  background: var(--lcd-background);
  border: 3px solid var(--surface-charcoal);
  border-radius: var(--radius-sm);
  box-shadow:
    inset 0 2px 4px rgba(0,0,0,0.3),
    inset 0 0 20px rgba(127, 205, 145, 0.1);
  font-family: "LCD", "Digital-7", monospace;
  color: var(--lcd-text);
  text-shadow: 0 0 2px rgba(0,0,0,0.2);
}
```

### Wood Accent Option

For a Prophet-5/OB-Xa inspired variant, add wood end caps:

```css
.drum-machine::before,
.drum-machine::after {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  width: 24px;
  background: linear-gradient(90deg,
    #5D4037 0%,
    #6D4C41 20%,
    #5D4037 40%,
    #4E342E 60%,
    #5D4037 80%,
    #6D4C41 100%);
  border-radius: var(--radius-xl);
}

.drum-machine::before { left: -24px; }
.drum-machine::after { right: -24px; }
```

---

## Implementation Status

### Currently Implemented
- Cream/beige chassis gradient
- Orange accent for active states
- Green accent for arpeggiator
- LCD-style tempo display
- Hardware-style gradients and shadows
- Texture overlay for surface

### Not Yet Implemented (CSS exists, no UI)
- Mute/Solo buttons (`.mute-button`, `.solo-button`)
- Track button styles (`.track-button`)

### Planned Improvements
- Extract colors to CSS custom properties
- Add section headers with visual dividers
- Implement `:focus-visible` styles
- Add error boundaries and visual feedback
- Responsive breakpoints (1280px, 1440px, 1920px)
- Optional wood panel accents
- Cyan focus ring alternative to orange

---

## Future Patterns

Document any new component guidelines here as features are added to maintain consistency.
