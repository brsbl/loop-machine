# Ladle Quick Start Guide

## Get Started in 3 Steps

### 1. Start Ladle Development Server

```bash
pnpm ladle:serve
```

Open http://localhost:61000 in your browser.

### 2. Navigate Stories

Use the sidebar to browse:
- **Loop Machine** - Full UI with 8 different states
- **Components** - 28 individual component stories

### 3. Use Addons

Click addon icons in the toolbar:
- **Width** (W) - Test responsive layouts
- **Theme** (D) - Toggle light/dark mode
- **A11y** - Check accessibility
- **Source** - View component code

## Available Stories

### Full UI States
```
Loop Machine
├── Default              (Empty state)
├── WithPattern          (Basic drum pattern)
├── WithEffects          (Pattern + effects)
├── Playing              (Playback visualization)
├── WithSidebar          (JSON editor visible)
├── ComplexPattern       (Advanced pattern)
├── AllNotesActive       (Everything on)
└── EmptyState           (Clean slate)
```

### Individual Components
```
Components
├── Buttons
│   ├── PlayButton
│   ├── PlayButtonPlaying
│   ├── PlayButtonDisabled
│   ├── ResetButtonComponent
│   ├── ToggleButtonOff
│   └── ToggleButtonOn
├── Note Buttons (Hi-hat, Snare, Kick)
│   ├── *Inactive
│   ├── *Active
│   └── *Playing
├── Sliders
│   ├── SlidersZero
│   ├── SlidersLow
│   ├── SlidersMedium
│   ├── SlidersHigh
│   └── SlidersMax
└── Labels
    ├── BeatAndStepLabels
    ├── EffectLabelsComponent
    ├── HiHatLabel
    ├── SnareLabel
    └── KickLabel
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `/` | Search stories |
| `↓` | Next story |
| `↑` | Previous story |
| `→` | Next component |
| `←` | Previous component |
| `F` | Toggle fullscreen |
| `W` | Toggle width addon |
| `D` | Toggle dark mode |
| `C` | Toggle controls |
| `R` | Toggle RTL |

## Build for Production

```bash
# Build static files
pnpm ladle:build

# Preview the build
pnpm ladle:preview
```

Output: `ladle-build/` directory

## Testing Workflow

### Visual Inspection
1. Run `pnpm ladle:serve`
2. Click through all stories
3. Use width addon for responsive testing
4. Check a11y addon for accessibility issues

### Screenshots
Take screenshots of each story:
```bash
# Navigate to story URL
http://localhost:61000/?story=loopmachine--default
http://localhost:61000/?story=components--playbutton
```

### Automated Testing
Integrate with visual regression tools:
- Percy: `npx percy snapshot ladle-build`
- Chromatic: `npx chromatic`
- Playwright: Write visual comparison tests

## Responsive Testing

Use the **Width** addon to test:
- **XSmall**: 414px (mobile)
- **Small**: 640px (tablet portrait)
- **Medium**: 768px (tablet landscape)
- **Large**: 1024px (desktop)
- **Full**: No width constraint

## Adding Stories

Create `stories/NewStory.stories.jsx`:

```jsx
import React from 'react';
import '../style.css';

const MyComponent = () => (
  <div className="my-class">Content</div>
);

export const Default = () => <MyComponent />;
export const Variant = () => <MyComponent />;

export default {
  title: 'My Category',
};
```

Ladle auto-detects new stories!

## Troubleshooting

**Stories not loading?**
- Check file matches pattern: `*.stories.{js,jsx}`
- Verify default export with `title`

**CSS not working?**
- Confirm import: `import '../style.css'`
- Check CSS file path

**Port in use?**
```bash
pnpm ladle:serve --port 3000
```

## Next Steps

1. Review all stories visually
2. Test responsive behavior
3. Check a11y addon warnings
4. Set up visual regression testing
5. Add stories for new features

---

**Need more details?** See `LADLE_SETUP.md` for comprehensive documentation.
