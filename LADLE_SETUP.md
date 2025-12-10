# Ladle Visual Regression Testing Setup

This document describes the Ladle setup for visual regression testing in the Loop Machine project.

## Overview

Ladle has been successfully set up for visual regression testing of the Loop Machine UI components. Even though this is a vanilla JavaScript project, we use Ladle (React-based) to create testable component snapshots that match the original DOM structure and styling.

## Installation

The following dependencies have been installed:

```bash
pnpm add -D @ladle/react react react-dom
```

## Project Structure

```
/Users/brsbl/Documents/loop-machine/
├── .ladle/
│   └── config.mjs              # Ladle configuration
├── stories/
│   ├── LoopMachine.stories.jsx # Full UI stories
│   ├── Components.stories.jsx  # Individual component stories
│   └── README.md               # Story documentation
├── style.css                   # Original CSS (imported by stories)
├── index.html                  # Original vanilla HTML
├── script.js                   # Original vanilla JavaScript
└── package.json                # Updated with Ladle scripts
```

## Configuration Files

### .ladle/config.mjs

The Ladle configuration includes:

- **Stories pattern**: `stories/**/*.stories.{js,jsx,ts,tsx}`
- **Output directory**: `ladle-build`
- **Enabled addons**:
  - **a11y**: Accessibility testing
  - **action**: Action logging
  - **control**: Component controls
  - **theme**: Light/dark mode switching
  - **width**: Responsive width testing
  - **source**: View component source
- **Responsive breakpoints**:
  - xsmall: 414px
  - small: 640px
  - medium: 768px
  - large: 1024px

### package.json Scripts

Three new scripts have been added:

```json
{
  "scripts": {
    "ladle:serve": "ladle serve",
    "ladle:build": "ladle build",
    "ladle:preview": "ladle preview"
  }
}
```

## Stories Created

### 1. LoopMachine.stories.jsx

Full loop machine UI with 8 different states:

| Story | Description |
|-------|-------------|
| `Default` | Empty state with no notes active |
| `WithPattern` | Basic drum pattern (hi-hat on 8ths, snare on 2&4, kick on 1&3) |
| `WithEffects` | Pattern with various reverb and delay settings |
| `Playing` | UI in playing state with step 4 highlighted |
| `WithSidebar` | Shows sidebar JSON editor visible |
| `ComplexPattern` | More intricate drum pattern with multiple effects |
| `AllNotesActive` | All 16 steps active on all instruments, max effects |
| `EmptyState` | Explicitly empty state (same as Default) |

### 2. Components.stories.jsx

Individual component stories for granular testing:

**Buttons** (7 stories):
- Play/Stop button: default, playing, disabled
- Reset button
- Sidebar toggle: off, on

**Note Buttons** (9 stories):
- Hi-hat, Snare, Kick notes: inactive, active, playing states

**Sliders** (5 stories):
- Effect sliders at: 0, low (2-3), medium (5), high (8-9), max (10)

**Labels** (7 stories):
- Beat and step labels
- Effect labels (Reverb/Delay)
- Individual instrument labels (Hi-hat, Snare, Kick)

**Total**: 28 individual component stories + 8 full UI stories = **36 visual test cases**

## Running Ladle

### Development Mode

Start the Ladle development server:

```bash
pnpm ladle:serve
```

This will start Ladle at http://localhost:61000 by default. The server supports:
- Hot module reloading
- Story navigation
- Addon controls
- Responsive preview

### Production Build

Build static HTML for deployment:

```bash
pnpm ladle:build
```

Output will be in `ladle-build/` directory. You can deploy this to any static hosting service.

### Preview Production Build

Preview the built stories locally:

```bash
pnpm ladle:preview
```

## Implementation Details

### React Wrapper Approach

Since the original project is vanilla JavaScript, the stories create React components that:

1. **Render identical DOM structure** - Match `index.html` exactly
2. **Import original CSS** - Use `import '../style.css'`
3. **Preserve data attributes** - Keep `data-instrument`, `data-step`, etc.
4. **Apply original class names** - Match CSS selectors precisely
5. **Support state props** - Allow testing different UI states

Example:

```jsx
import React from 'react';
import '../style.css';

const LoopMachineUI = ({
  hihatNotes = Array(16).fill(false),
  isPlaying = false,
  currentStep = -1
}) => (
  <div className="loop-machine">
    {/* DOM structure matching index.html */}
  </div>
);

export const Default = () => <LoopMachineUI />;
```

### State Management

The `LoopMachineUI` component accepts props to control:

- **Note states**: 16-element boolean arrays for each instrument
- **Effect values**: 0-10 for reverb/delay per instrument
- **UI state**: playing status, current step, sidebar visibility

This allows comprehensive testing of all visual states without needing the audio engine or event handlers.

### CSS Considerations

- Stories import the original `style.css` directly
- No CSS-in-JS or style modifications
- Sidebar visibility uses `document.body.classList` manipulation
- All original selectors and pseudo-classes work

## Visual Regression Testing Workflow

### Manual Testing

1. Start Ladle: `pnpm ladle:serve`
2. Open browser to http://localhost:61000
3. Navigate through stories in the sidebar
4. Use width addon to test responsive behavior
5. Use a11y addon to check accessibility issues
6. Use theme addon to test light/dark modes

### Automated Visual Testing

Integrate with visual regression tools:

#### Option 1: Percy

```bash
npm install --save-dev @percy/cli
npx percy snapshot ladle-build
```

#### Option 2: Chromatic

```bash
npx chromatic --project-token=<token>
```

#### Option 3: Playwright

```javascript
import { test } from '@playwright/test';

test('visual regression', async ({ page }) => {
  await page.goto('http://localhost:61000/?story=loopmachine--default');
  await expect(page).toHaveScreenshot('loop-machine-default.png');
});
```

### CI/CD Integration

Add to your CI pipeline:

```yaml
# Example GitHub Actions workflow
- name: Build Ladle
  run: pnpm ladle:build

- name: Visual Tests
  run: npx percy snapshot ladle-build
```

## Customization

### Adding New Stories

1. Create a new `.stories.jsx` file in `stories/`
2. Import CSS: `import '../style.css'`
3. Create React components
4. Export story functions
5. Add default export with `title`:

```javascript
export default {
  title: 'New Category',
};
```

### Modifying Configuration

Edit `.ladle/config.mjs` to:
- Change story pattern
- Adjust responsive breakpoints
- Enable/disable addons
- Customize hotkeys
- Set default theme/width

### Story Parameters

Control story behavior with Ladle parameters:

```javascript
export const MyStory = () => <Component />;
MyStory.storyName = 'Custom Name';
MyStory.parameters = {
  // Custom parameters
};
```

## Troubleshooting

### Stories Not Loading

- Check that files match pattern: `stories/**/*.stories.{js,jsx,ts,tsx}`
- Ensure default export exists with `title` property
- Check console for import errors

### CSS Not Applied

- Verify import path: `import '../style.css'` is correct
- Check that original `style.css` exists
- Look for CSS conflicts or specificity issues

### React Version Warnings

- Ladle requires React 16.8+
- Current installation uses React 19.2.1
- Some peer dependency warnings are expected but won't affect functionality

### Port Already in Use

Change the default port:

```bash
pnpm ladle:serve --port 3000
```

## Benefits for Loop Machine

1. **Visual Regression Testing**: Catch unintended UI changes
2. **Component Isolation**: Test individual elements independently
3. **State Testing**: Verify all UI states without audio setup
4. **Responsive Testing**: Check layout at different screen sizes
5. **Accessibility**: Built-in a11y testing with addon
6. **Documentation**: Stories serve as visual component documentation
7. **Design Review**: Share UI variations with stakeholders
8. **Cross-browser Testing**: Test visual consistency across browsers

## Next Steps

1. **Run Ladle**: Try `pnpm ladle:serve` to see all stories
2. **Add More Stories**: Create stories for edge cases or new features
3. **Integrate Visual Testing**: Set up Percy, Chromatic, or Playwright
4. **CI/CD**: Add visual regression tests to your pipeline
5. **Accessibility**: Use the a11y addon to improve WCAG compliance
6. **Documentation**: Keep stories updated as UI evolves

## Resources

- [Ladle Documentation](https://ladle.dev/)
- [Visual Regression Testing Guide](https://ladle.dev/docs/testing)
- [Addons Documentation](https://ladle.dev/docs/addons)
- [Vite Configuration](https://vitejs.dev/config/)

## File Locations

All Ladle-related files:

- Configuration: `/Users/brsbl/Documents/loop-machine/.ladle/config.mjs`
- Stories: `/Users/brsbl/Documents/loop-machine/stories/`
- Story docs: `/Users/brsbl/Documents/loop-machine/stories/README.md`
- Package.json: `/Users/brsbl/Documents/loop-machine/package.json`

---

**Setup completed successfully!** You can now run `pnpm ladle:serve` to start visual regression testing.
