# Loop Machine - Ladle Stories

This directory contains visual regression testing stories for the Loop Machine project using Ladle.

## Overview

Even though this is a vanilla JavaScript project, we use Ladle (which requires React) for visual regression testing. The stories create React wrapper components that render the same DOM structure and CSS as the original vanilla implementation.

## Available Stories

### LoopMachine.stories.jsx

Full loop machine UI with various states:

- **Default** - Empty state with no notes active
- **WithPattern** - Example drum pattern with hi-hat, snare, and kick
- **WithEffects** - Pattern with reverb and delay effects enabled
- **Playing** - Shows the UI in playing state with step highlighting
- **WithSidebar** - Shows the sidebar JSON editor
- **ComplexPattern** - More complex drum pattern example
- **AllNotesActive** - All notes active with max effects
- **EmptyState** - Explicitly empty state

### Components.stories.jsx

Individual component stories for isolated testing:

#### Buttons
- **PlayButton** - Default play/stop button
- **PlayButtonPlaying** - Button in playing state
- **PlayButtonDisabled** - Disabled button state
- **ResetButtonComponent** - Reset button
- **ToggleButtonOff** - Sidebar toggle (off)
- **ToggleButtonOn** - Sidebar toggle (on)

#### Note Buttons
- **HiHatNotesInactive/Active/Playing** - Hi-hat note buttons in various states
- **SnareNotesInactive/Active/Playing** - Snare note buttons in various states
- **KickNotesInactive/Active/Playing** - Kick note buttons in various states

#### Sliders
- **SlidersZero** - Effects at 0
- **SlidersLow** - Low effect values (2-3)
- **SlidersMedium** - Medium effect values (5)
- **SlidersHigh** - High effect values (8-9)
- **SlidersMax** - Maximum effect values (10)

#### Labels
- **BeatAndStepLabels** - Beat (1-4) and step (1-16) labels
- **EffectLabelsComponent** - Reverb and delay labels
- **HiHatLabel/SnareLabel/KickLabel** - Instrument labels

## Running Ladle

### Development Server

Start the Ladle development server:

```bash
pnpm ladle:serve
```

This will start Ladle at http://localhost:61000 (default port).

### Build for Production

Build static stories for deployment:

```bash
pnpm ladle:build
```

The built files will be in the `ladle-build` directory.

### Preview Built Stories

Preview the built stories:

```bash
pnpm ladle:preview
```

## Using for Visual Regression Testing

### Manual Testing
1. Run `pnpm ladle:serve`
2. Open http://localhost:61000
3. Navigate through stories to visually inspect components
4. Use the width addon to test responsive behavior
5. Use the a11y addon to check accessibility

### Automated Testing
You can integrate visual regression tools like:
- **Percy** - Take screenshots of each story
- **Chromatic** - Automated visual testing
- **Playwright** - E2E tests with visual comparisons

### Taking Screenshots
With Ladle running, you can programmatically capture screenshots:

```javascript
// Example with Playwright
import { test } from '@playwright/test';

test('Loop Machine Default', async ({ page }) => {
  await page.goto('http://localhost:61000/?story=loopmachine--default');
  await page.screenshot({ path: 'screenshots/default.png' });
});
```

## Story Parameters

The main `LoopMachineUI` component accepts these props for testing different states:

```javascript
{
  // Note states (16-element boolean arrays)
  hihatNotes: [false, false, ...],
  snareNotes: [false, false, ...],
  kickNotes: [false, false, ...],

  // Effect values (0-10)
  hihatReverb: 0,
  hihatDelay: 0,
  snareReverb: 0,
  snareDelay: 0,
  kickReverb: 0,
  kickDelay: 0,

  // UI state
  isPlaying: false,
  sidebarVisible: false,
  currentStep: -1  // -1 means no step highlighted
}
```

## Configuration

The Ladle configuration is in `.ladle/config.mjs`. Key settings:

- Stories pattern: `stories/**/*.stories.{js,jsx,ts,tsx}`
- Output directory: `ladle-build`
- Enabled addons: a11y, action, control, theme, width, source
- Responsive widths: xsmall (414), small (640), medium (768), large (1024)

## Tips

1. **CSS Import**: Stories import `../style.css` directly to use the original styles
2. **Body Classes**: Some stories manipulate `document.body.classList` for sidebar visibility
3. **Read-only Inputs**: Sliders are set to `readOnly` in stories to prevent interaction warnings
4. **Data Attributes**: Stories preserve `data-instrument` and `data-step` attributes for CSS selectors
5. **Step Highlighting**: Use the `currentStep` prop to test playback visualization

## Adding New Stories

To add new stories:

1. Create a new `.stories.jsx` file in this directory
2. Import the CSS: `import '../style.css'`
3. Create React components that render the DOM structure
4. Export story functions and a default export with `title`
5. Ladle will automatically detect and load the stories

Example:

```javascript
import React from 'react';
import '../style.css';

const MyComponent = () => <div className="my-class">Content</div>;

export const Default = () => <MyComponent />;

export default {
  title: 'My Components',
};
```
