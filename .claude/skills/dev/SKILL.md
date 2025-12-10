---
name: dev
description: Development workflow for the Loop Machine drum sequencer. Use when implementing features, fixing bugs, working on the improvement plan, creating PRs, or running tests.
---

# Loop Machine Development

## Project Overview

Browser-based 16-step drum machine with vanilla HTML/CSS/JS and Web Audio API.

**Key files:**
- `script.js` - All application logic (875 lines)
- `style.css` - Styling with CSS Grid
- `index.html` - Single page structure

## Running the Project

```bash
npx serve . -l 3000
```

Open http://localhost:3000

## Improvement Plan

The project has a comprehensive improvement plan at `docs/IMPROVEMENT_PLAN.md`. Before starting work:

1. Read the current phase being worked on
2. Check the PR breakdown table for branch naming
3. Review the validation feedback section for priority adjustments

## PR Workflow

### Branch Naming
```
feature/phase-X.Y-description
```

Examples:
- `feature/phase-1.1-accessibility`
- `feature/phase-2.1-dom-performance`
- `feature/test-infrastructure`

### Before Opening PR

Run this manual checklist:
- [ ] Pattern plays at correct tempo
- [ ] All 3 instruments trigger sounds
- [ ] URL updates on note toggle
- [ ] URL loads saved pattern correctly
- [ ] JSON editor reflects state
- [ ] No console errors
- [ ] No memory growth during 60s playback

### PR Description Template

```markdown
## Phase X.Y: [Title]

### Changes
- Change 1
- Change 2

### Manual Testing
- Tested: [what you verified]

### Screenshots
[If UI changed]
```

## Testing

### Unit Tests (Vitest)
```bash
pnpm test
```

Test pure functions: `stateToHex`, `hexToState`, `valueToChar`, `charToValue`, validation logic.

### Visual Regression (Ladle)
```bash
pnpm ladle serve
```

Create stories for UI components. Screenshot comparisons catch CSS regressions.

### Web Audio
Cannot be unit tested. Always manually verify:
- Audio plays at correct timing
- Effects (reverb/delay) apply correctly
- No audio glitches during playback

## Code Architecture

### State Flow
```
User Action -> sequenceState -> UI Update -> URL/JSON sync
```

### Audio Flow
```
BufferSource -> mainGain -> [effects] -> destination
```

### Key Functions
- `loadSounds()` - Loads audio samples
- `playSound()` - Triggers instrument at scheduled time
- `scheduler()` - Lookahead audio scheduling (25ms intervals)
- `updatePlayheadVisuals()` - RAF-based visual sync
- `updateUrlState()` - Serializes state to URL
- `loadUrlState()` - Deserializes state from URL

## Common Tasks

### Adding to the Improvement Plan
1. Add task to appropriate phase in `docs/IMPROVEMENT_PLAN.md`
2. Update the PR breakdown table if new PR needed
3. Update effort estimates if significant

### Implementing a Phase
1. Create branch: `git checkout -b feature/phase-X.Y-description`
2. Implement changes following the checklist in the plan
3. Run tests and manual validation
4. Open PR with template

### Debugging Audio Issues
1. Check `audioContext.state` (must be 'running')
2. Verify `audioBuffers` has all instruments loaded
3. Check scheduler timing in console (if debug enabled)
4. Profile memory for buffer source leaks

## Priority Reference (from Validation)

**P0 (Critical):**
- Configuration management (foundational)
- JSON editor fix (currently broken)
- Playhead DOM caching (60fps performance)
- Console.log in scheduler (affects playback)
- iOS audio unlock (mobile support)
- Color contrast (accessibility)

**P1 (High):**
- Memory cleanup, DOM performance, resource loading
- Mobile responsive, discoverability

**P2 (Medium):**
- URL debounce, CSS animations, function decomposition
