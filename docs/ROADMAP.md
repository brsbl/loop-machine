# Loop Machine Style Guide Implementation Roadmap

## Overview

This roadmap outlines the implementation strategy for transforming the Loop Machine into a fully polished, accessible, and responsive application based on **The 1984 Digital Control System** documented in `./design/DESIGN_SYSTEM.md`.

**Total Estimated Effort:** 44-62 hours (6-8 days)

**Tech Stack:**
- Tailwind CSS v4 (already installed via `@tailwindcss/vite`)
- Radix UI primitives (for accessible slider/toggle components)

---

## Executive Summary

| Phase | Focus Area | Effort | Priority |
|-------|-----------|--------|----------|
| 1 | Tailwind Theme Configuration | 10-14 hrs | P0 |
| 2 | Accessibility Remediation | 24-34 hrs | P0 |
| 3 | Responsive Design | 10-14 days | P1 |

---

## Phase 1: Tailwind Theme Configuration

**Goal:** Configure Tailwind with custom design tokens and migrate from hardcoded CSS values to utility classes where appropriate.

### Statistics
- Total hex color values: 103
- Unique colors: 77
- Gradients to tokenize: 38
- Shadow declarations: 15+
- Spacing values: 20+
- Border-radius values: 33+

### Implementation Steps

#### Step 1.1: Create Tailwind Config (1-2 hrs)

Create `tailwind.config.js` with the 1984 Digital Control System tokens (see `./design/DESIGN_SYSTEM.md`):

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
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

        // LED Display
        led: {
          red: '#E34234',
          bg: '#151515',
        },
      },
      boxShadow: {
        surface: '0 2px 4px rgba(0,0,0,0.2)',
        'inset-subtle': 'inset 0 1px 2px rgba(0,0,0,0.3)',
        'glow-orange': '0 0 8px rgba(237,122,36,0.4)',
        'glow-mint': '0 0 8px rgba(155,243,211,0.4)',
      },
      fontFamily: {
        display: ['Eurostile', 'Microgramma', 'sans-serif'],
        sans: ['DIN', 'Roboto Condensed', 'sans-serif'],
        led: ['DSEG7', 'Digital-7', 'monospace'],
      },
      fontSize: {
        micro: ['9px', { lineHeight: '1' }],
        xs: ['10px', { lineHeight: '1.2' }],
        sm: ['12px', { lineHeight: '1.3' }],
      },
      letterSpacing: {
        display: '0.15em',
        header: '0.1em',
        label: '0.05em',
      },
      spacing: {
        '4.5': '18px',
        '7.5': '30px',
        '9.5': '38px',
      },
    },
  },
  plugins: [],
}
```

#### Step 1.2: Add CSS Variables via @theme (1 hr)

In `src/index.css`, use Tailwind v4's `@theme` directive for gradients and complex values:

```css
@import "tailwindcss";

@theme {
  /* Surface Gradients */
  --gradient-surface: linear-gradient(180deg, #E7DFD1 0%, #D8CFBF 100%);
  --gradient-panel: linear-gradient(180deg, #1F2021 0%, #151515 100%);

  /* Pad States */
  --gradient-pad-inactive: linear-gradient(180deg, #A9A9A9 0%, #8A8A8A 100%);
  --gradient-pad-active: linear-gradient(180deg, #ED7A24 0%, #D66A1A 100%);

  /* Synth Section */
  --gradient-synth-blue: linear-gradient(180deg, #4A70A8 0%, #3A5A88 100%);
  --gradient-synth-teal: linear-gradient(180deg, #3F8F8C 0%, #2F7F7C 100%);

  /* Keyboard */
  --gradient-key-white: linear-gradient(180deg, #F5F5F5 0%, #E0E0E0 100%);
  --gradient-key-black: linear-gradient(180deg, #1F2021 0%, #0A0A0A 100%);

  /* Minimal depth effects */
  --highlight-subtle: inset 0 1px 0 rgba(255,255,255,0.1);
  --shadow-inset: inset 0 1px 2px rgba(0,0,0,0.2);
}
```

#### Step 1.3: Migrate Component Styles (6-8 hrs)

**Strategy:** Hybrid approach - use Tailwind utilities for common patterns, keep custom CSS for complex component-specific styles.

**Migrate to Tailwind utilities:**
- Colors: `bg-cream`, `bg-graphite`, `text-graphite`, `border-pad-outline`
- Accents: `bg-accent-orange`, `text-accent-amber`
- Synth: `bg-synth-blue`, `bg-synth-teal`, `bg-synth-mint`
- LED: `bg-led-bg`, `text-led-red`
- Typography: `font-display`, `font-led`, `tracking-display`
- Focus states: `focus-visible:ring-2 focus-visible:ring-synth-mint`

**Keep as custom CSS (gradients):**
- Pad gradients (inactive/active states)
- Surface gradients
- Keyboard key gradients

#### Step 1.4: Component Class Updates (4-6 hrs)

Example component migration:

**Before (Pad.jsx):**
```jsx
<button className={`note-button ${active ? 'active' : ''}`}>
```

**After:**
```jsx
<button
  className={cn(
    'w-11 h-11 rounded-sm border border-pad-outline',
    'transition-colors duration-75',
    active
      ? 'bg-accent-orange shadow-glow-orange'
      : 'bg-pad-grey hover:bg-accent-amber/20'
  )}
>
```

**Utility function (create `src/lib/utils.js`):**
```js
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
```

**Install dependencies:**
```bash
pnpm add clsx tailwind-merge @radix-ui/react-slider @radix-ui/react-toggle
```

### Testing Strategy
- Visual regression testing at each step
- Check all gradients render correctly
- Verify responsive utilities work at each breakpoint

### Files Modified
- `tailwind.config.js` (new - tokens from ./design/DESIGN_SYSTEM.md)
- `/src/index.css` (add @theme, migrate styles)
- `/src/lib/utils.js` (new)
- All component files (className updates)

### Reference
See `./design/DESIGN_SYSTEM.md` for complete color palette, typography specs, and component patterns.

---

## Phase 2: Accessibility Remediation

**Goal:** Achieve WCAG AA compliance with keyboard navigation, screen reader support, and proper color contrast.

### Focus Areas

#### 2.1: Focus-Visible Styles (2-3 hrs)

Use Tailwind's built-in focus-visible utilities with the Soft Mint accent from the design system:

```jsx
// All interactive elements get:
className="focus-visible:ring-2 focus-visible:ring-synth-mint focus-visible:ring-offset-1"
```

| Component | Tailwind Classes |
|-----------|-----------------|
| Pads | `focus-visible:ring-2 focus-visible:ring-synth-mint focus-visible:ring-offset-1` |
| Buttons | `focus-visible:ring-2 focus-visible:ring-synth-mint` |
| Faders | `focus-visible:ring-2 focus-visible:ring-synth-mint` |
| Piano Keys | `focus-visible:ring-2 focus-visible:ring-synth-mint focus-visible:ring-offset-1` |

The mint color (`#9BF3D3`) provides high contrast against both cream and graphite surfaces.

#### 2.2: ARIA Labels (4-6 hrs)
Add descriptive labels to all interactive elements:

**Pad Component** (`Pad.jsx`) - Use Radix Toggle:
```jsx
import * as Toggle from '@radix-ui/react-toggle'

function Pad({ active, onToggle, stepNumber, instrumentName }) {
  return (
    <Toggle.Root
      pressed={active}
      onPressedChange={onToggle}
      aria-label={`Step ${stepNumber}, ${instrumentName}`}
      className={cn(
        'w-10 h-10 rounded-sm border border-pad-outline',
        'transition-colors duration-75',
        'focus-visible:ring-2 focus-visible:ring-synth-mint focus-visible:ring-offset-1',
        active
          ? 'bg-accent-orange shadow-glow-orange'
          : 'bg-pad-grey hover:bg-accent-amber/20'
      )}
    />
  )
}
```
- `aria-pressed` handled automatically by Radix
- Keyboard support (Space/Enter) built-in

**Button Component** (`Button.jsx`):
- Add optional `ariaLabel` prop
- Add `aria-pressed` for toggle buttons

**Fader Component** (`Fader.jsx`):
- Add `label` prop for `aria-label`
- Add `aria-orientation="horizontal"`

**Key Component** (`Key.jsx`):
- Convert `<div>` to `<button>`
- Add `aria-label={note}`
- Add `aria-pressed={isHeld}`

#### 2.3: Replace Fader with Radix Slider (2-3 hrs)

Replace custom Fader with `@radix-ui/react-slider` for built-in accessibility:

```jsx
// Fader.jsx - Replace with Radix Slider
import * as Slider from '@radix-ui/react-slider'

function Fader({ value, onChange, min = 0, max = 1, step = 0.01, label }) {
  return (
    <Slider.Root
      className="relative flex items-center select-none touch-none w-16 h-5"
      value={[value]}
      onValueChange={([v]) => onChange(v)}
      min={min}
      max={max}
      step={step}
      aria-label={label}
    >
      <Slider.Track className="relative grow rounded-full h-2 bg-graphite shadow-inset-subtle">
        <Slider.Range className="absolute rounded-full h-full bg-accent-orange" />
      </Slider.Track>
      <Slider.Thumb className={cn(
        'block w-5 h-5 rounded-full',
        'bg-beige border border-pad-outline shadow-surface',
        'focus-visible:ring-2 focus-visible:ring-synth-mint'
      )} />
    </Slider.Root>
  )
}
```

**Built-in accessibility (no custom implementation needed):**
- Arrow keys: Increase/decrease by step
- Home/End: Jump to min/max
- Page Up/Down: Large increments (10%)
- Touch and pointer support
- ARIA attributes automatic

#### 2.4: Color Contrast Fixes (2-3 hrs)
Fix elements below WCAG AA 4.5:1 ratio using design system colors:

| Element | Current | Tailwind Fix |
|---------|---------|--------------|
| Tempo display | Light text | `text-led-red` on `bg-led-bg` (LED style) |
| Step numbers | Grey | `text-graphite` on `bg-cream` |
| Control labels | Grey | `text-graphite` (uppercase, tracking-label) |
| Button text | Low contrast | `text-cream` on `bg-graphite` |

The design system's high-contrast palette (Cream `#E7DFD1` vs Graphite `#1F2021`) ensures WCAG AA compliance.

#### 2.5: Screen Reader Announcements (4-6 hrs)
Create `ScreenReaderAnnouncer` component with Tailwind's `sr-only`:

```jsx
function ScreenReaderAnnouncer({ message }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  )
}
```

**Announcements needed:**
- Playback started/stopped
- BPM changes (debounced)
- Pattern reset
- Loading complete
- Fader value changes (debounced)

#### 2.6: Landmark Regions (1 hr)
Add semantic regions to `Sequencer.jsx`:
- `role="region" aria-label="Drum sequencer"`
- `role="region" aria-label="Arpeggiator"`
- `role="region" aria-label="Transport controls"`

#### 2.7: Reduced Motion Support (0.5 hr)
Use Tailwind's `motion-reduce` variant:

```jsx
className="transition-all motion-reduce:transition-none"
```

Or in CSS:
```css
@media (prefers-reduced-motion: reduce) {
  .animate-spin {
    animation: none;
  }
}
```

### Testing
- Keyboard-only navigation test
- Screen reader testing (VoiceOver, NVDA)
- Color contrast verification with WebAIM

### Files Modified
- All component files (ARIA attributes, focus classes)
- `tailwind.config.js` (ring colors)
- `/src/components/Pad.jsx` - Replace with Radix Toggle
- `/src/components/ui/Fader.jsx` - Replace with Radix Slider
- New: `/src/components/ScreenReaderAnnouncer.jsx`

---

## Phase 3: Responsive Design

**Goal:** Support 1280px to 1920px+ displays with touch-friendly targets.

### Tailwind Breakpoint Strategy

Use Tailwind's responsive prefixes:

| Tailwind | Width | Purpose |
|----------|-------|---------|
| Default | < 1280px | Current baseline |
| `xl:` | 1280px | Desktop with 44px touch targets |
| `2xl:` | 1536px | Large desktop |
| Custom `3xl:` | 1920px | Ultra-wide cap |

Add custom breakpoint in `tailwind.config.js`:
```js
screens: {
  '3xl': '1920px',
},
```

### Touch Target Fixes with Responsive Classes

```jsx
// Pad.jsx
<button
  className={cn(
    'w-9 h-10.5',           // Default (36x42)
    'xl:w-11 xl:h-12',      // 1280px+ (44x48)
    '2xl:w-12 2xl:h-13',    // 1536px+ (48x52)
    // ... other classes
  )}
>
```

### Implementation Steps

#### Step 3.1: 1280px Baseline (1-2 days)

```jsx
// Container
className="min-w-[1080px] xl:min-w-[1200px] xl:max-w-[1240px]"

// Pads
className="w-9 h-10.5 xl:w-11 xl:h-12"

// Gaps
className="gap-1.5 xl:gap-2"
```

#### Step 3.2: 1536px Enhancement (1 day)

```jsx
// Pads
className="2xl:w-12 2xl:h-13"

// Keys
className="w-12 2xl:w-14" // white keys
className="w-9 2xl:w-10"  // black keys
```

#### Step 3.3: 1920px+ Cap (0.5 day)

```jsx
// Container
className="3xl:max-w-[1400px] 3xl:mx-auto"
```

#### Step 3.4: Tablet 1024px (2-3 days) - Future
Add `lg:` breakpoint overrides for condensed layout

#### Step 3.5: Mobile 768px (5-7 days) - Future
Add `md:` and below for vertical layout, tabs

### Testing Matrix

| Device | Resolution | Tailwind Prefix |
|--------|-----------|-----------------|
| Desktop | 1280×720 | `xl:` |
| Desktop | 1440×900 | `xl:` / `2xl:` |
| Desktop | 1920×1080 | `3xl:` |
| Tablet | 1024×768 | `lg:` (future) |
| Mobile | 393×852 | default (future) |

---

## Implementation Schedule

### Week 1: Foundation
- [ ] Create `tailwind.config.js` with theme
- [ ] Add `@theme` variables for gradients
- [ ] Install `clsx` and `tailwind-merge`
- [ ] Migrate Pad component to Tailwind
- [ ] Add focus-visible utilities

### Week 2: Component Migration & Accessibility
- [ ] Migrate Button, Fader, Key components
- [ ] Add ARIA labels to all components
- [ ] Implement keyboard navigation for Fader
- [ ] Fix color contrast issues

### Week 3: Accessibility & Responsive
- [ ] Add ScreenReaderAnnouncer
- [ ] Add responsive classes for 1280px
- [ ] Add responsive classes for 1536px
- [ ] Add 1920px cap styles

### Week 4: Testing & Polish
- [ ] Testing across all breakpoints
- [ ] Cross-browser testing
- [ ] Screen reader testing
- [ ] Final visual regression testing

### Future Sprints
- [ ] Tablet layout (1024px)
- [ ] Mobile layout (768px and below)

---

## Success Criteria

### Phase 1: Tailwind Migration
- [ ] `tailwind.config.js` contains all design tokens
- [ ] Gradients defined in `@theme`
- [ ] Components use Tailwind utilities
- [ ] Zero visual regression

### Phase 2: Accessibility
- [ ] All elements keyboard navigable
- [ ] `focus-visible:` styles on all interactive elements
- [ ] Screen reader announces state changes
- [ ] Color contrast meets WCAG AA (4.5:1)

### Phase 3: Responsive
- [ ] Touch targets 44px minimum at `xl:` breakpoint
- [ ] No horizontal overflow at any breakpoint
- [ ] Content centered at `3xl:` breakpoint

---

## Files Reference

### Core Files to Create/Modify
- `tailwind.config.js` (new)
- `/src/lib/utils.js` (new - cn utility)
- `/src/index.css` (add @theme, keep complex styles)
- `/src/components/Pad.jsx` - Tailwind classes
- `/src/components/ui/Fader.jsx` - Tailwind + keyboard nav
- `/src/components/ui/Button.jsx` - Tailwind classes
- `/src/components/Key.jsx` - Convert to button, Tailwind
- `/src/components/TrackControls.jsx` - Tailwind classes
- `/src/components/Track.jsx` - Pass new props
- `/src/components/Sequencer.jsx` - Tailwind classes
- `/src/components/DrumMachine.jsx` - Responsive container

### New Files to Create
- `/src/components/ScreenReaderAnnouncer.jsx`

### Dependencies to Add
```bash
pnpm add clsx tailwind-merge @radix-ui/react-slider @radix-ui/react-toggle
```

---

## Radix UI Primitives

**Approach:** Use Radix unstyled primitives for accessibility, apply custom 80s synth styling with Tailwind.

### Components Using Radix

| Component | Radix Primitive | Why |
|-----------|----------------|-----|
| Fader | `@radix-ui/react-slider` | Full keyboard nav, touch support, ARIA |
| Pad | `@radix-ui/react-toggle` | `aria-pressed` state, keyboard support |

### Benefits
- **Accessibility built-in:** No manual ARIA implementation needed
- **Keyboard navigation:** Arrow keys, Home/End, Tab focus
- **Touch support:** Works on mobile/tablet out of the box
- **Unstyled:** Full control over appearance with Tailwind classes
- **Small bundle:** Only import what you use (~3-5KB per primitive)

### Styling Pattern
Radix components expose parts that can be styled individually:

```jsx
<Slider.Root className="...">      {/* Container */}
  <Slider.Track className="...">   {/* Track background */}
    <Slider.Range className="..." /> {/* Filled portion */}
  </Slider.Track>
  <Slider.Thumb className="..." />  {/* Draggable thumb */}
</Slider.Root>
```

### Components Staying Custom
- **Key.jsx** - Piano keys (simple button, custom layout)
- **Button.jsx** - Transport buttons (simple, no toggle state complexity)

---

## Tailwind v4 Notes

Tailwind CSS v4 (currently in beta) uses:
- CSS-first configuration with `@theme`
- No `tailwind.config.js` required (but can still use one)
- Native CSS cascade layers
- Lightning CSS for processing

If using v4's CSS-first approach, define tokens directly in CSS:

```css
@import "tailwindcss";

@theme {
  --color-surface-cream: #E8E4DC;
  --color-accent-orange: #F5A623;
  /* ... */
}
```

For compatibility, this roadmap assumes hybrid approach (config + @theme).

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Class name conflicts | Use `tailwind-merge` via `cn()` utility |
| Gradient rendering | Keep gradients in @theme CSS variables |
| Bundle size increase | Tailwind purges unused classes in production |
| Migration complexity | Hybrid approach - migrate incrementally |
| v4 breaking changes | Pin to specific version, test thoroughly |

---

## Dependencies

```
Phase 1 (Tailwind) ─┬─> Phase 2 (A11y)
                    └─> Phase 3 (Responsive)

Phase 1 (Config) ─> Phase 1 (Component Migration)
Phase 2 (Focus) ─> Phase 2 (Keyboard nav)
Phase 3 (xl:) ─> Phase 3 (2xl:) ─> Phase 3 (3xl:)
```

---

*Generated from comprehensive analysis by specialized subagents, updated to use Tailwind CSS v4 utility-first approach.*
