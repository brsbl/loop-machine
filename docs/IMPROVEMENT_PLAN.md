# Loop Machine Improvement Plan

Based on comprehensive reviews across architecture, performance, maintainability, extensibility, and product design.

---

## Testing Strategy

### Test Infrastructure (Set up before Phase 1)
- **Unit tests**: Vitest + happy-dom for pure functions and DOM utilities
- **Visual regression**: Ladle for component stories + screenshot comparisons

### What to Test

| Category | Tool | Coverage |
|----------|------|----------|
| Pure functions | Vitest | `stateToHex`, `hexToState`, `valueToChar`, `charToValue`, validation logic |
| DOM utilities | Vitest + happy-dom | UI generators, state sync functions |
| Visual regression | Ladle | Component appearance, CSS changes |

### Web Audio Mocking
- Extract pure logic into testable modules (state, URL encoding, validation)
- Mock `AudioContext` for integration tests
- Manual browser testing for actual audio playback

### Manual Validation Checklist (Per PR)
```
[ ] Pattern plays at correct tempo
[ ] All 3 instruments trigger sounds
[ ] URL updates on note toggle
[ ] URL loads saved pattern correctly
[ ] JSON editor reflects state
[ ] No console errors
[ ] No memory growth during 60s playback
```

---

## PR Strategy

### Branching Model
- Base branch: `main`
- Feature branches: `feature/phase-X.Y-description` (e.g., `feature/phase-1.1-accessibility`)
- Each PR should be reviewable in <30 minutes

### PR Breakdown

| PR | Branch | Scope | Tests Required |
|----|--------|-------|----------------|
| **Phase 0** | `feature/test-infrastructure` | Vitest + Ladle setup | N/A |
| **Phase 1.1** | `feature/phase-1.1-accessibility` | Keyboard nav, ARIA, focus styles | Manual a11y check |
| **Phase 1.2** | `feature/phase-1.2-error-handling` | Loading states, error messages, confirmations | Unit tests for validation |
| **Phase 1.3** | `feature/phase-1.3-memory` | Audio node cleanup, unload handlers | Manual memory profiling |
| **Phase 2.1** | `feature/phase-2.1-dom-performance` | DOM caching, debounce | Unit tests for utilities |
| **Phase 2.2** | `feature/phase-2.2-resource-loading` | Parallel loading, preload hints | Manual load timing |
| **Phase 2.3** | `feature/phase-2.3-css-logging` | CSS animations, debug system | Ladle visual regression |
| **Phase 3.1** | `feature/phase-3.1-configuration` | Config objects, CSS custom properties | Unit tests for config |
| **Phase 3.2** | `feature/phase-3.2-deduplication` | Extract utilities, reduce repetition | Unit tests for utilities |
| **Phase 3.3** | `feature/phase-3.3-refactor` | Function decomposition | Existing tests pass |
| **Phase 4.1** | `feature/phase-4.1-discoverability` | Copy link, tooltips, slider values | Ladle stories |
| **Phase 4.2** | `feature/phase-4.2-json-editor` | Textarea, export/import buttons | Unit tests for JSON handling |
| **Phase 5.1** | `feature/phase-5.1-responsive` | Mobile breakpoints, touch targets | Ladle responsive stories |

### PR Requirements
1. **Before opening PR**:
   - Run manual validation checklist
   - All unit tests pass
   - Ladle stories render correctly (if UI changed)
   - No new console errors

2. **PR description must include**:
   - Which phase/section from this plan
   - Summary of changes
   - Manual testing steps performed
   - Screenshots for UI changes

3. **Merge criteria**:
   - Tests pass
   - Manual checklist verified
   - No regressions in existing functionality

---

## Phase 1: Critical Fixes (High Impact, Foundation)

### 1.1 Accessibility (Critical)
**Why**: Currently excludes keyboard-only users and screen reader users entirely.

- [ ] Add `tabindex="0"` to all note buttons
- [ ] Add `role="switch"` and `aria-pressed` attributes to note buttons
- [ ] Implement arrow key navigation (left/right for steps, up/down for instruments)
- [ ] Add Space/Enter to toggle notes
- [ ] Add visible `:focus-visible` styles with high-contrast focus rings
- [ ] Add ARIA landmarks (`<main>`, `<aside>`) and labels
- [ ] Add `aria-label` to play/stop button that changes with state
- [ ] Add `aria-label` to all sliders: `${instrument.name} reverb/delay`
- [ ] Add `aria-live="polite"` region for playback state announcements

**Files**: `index.html`, `script.js`, `style.css`

### 1.2 Error Handling & User Feedback
**Why**: Silent failures leave users confused.

- [ ] Add loading spinner/text during sound loading
- [ ] Show user-facing error if Web Audio API fails
- [ ] Show notification if sample fails to load
- [ ] Show toast if URL state loading fails
- [ ] Add reset confirmation dialog

**Files**: `script.js`, `style.css`

### 1.3 Memory Management
**Why**: Potential memory leaks from uncleaned audio nodes.

- [ ] Add `source.onended` cleanup in `playSound()` to disconnect buffer sources
- [ ] Add page unload cleanup for AudioContext

**Files**: `script.js:396-407`

---

## Phase 2: Performance & Code Quality

### 2.1 DOM Performance
**Why**: Excessive DOM queries in high-frequency functions.

- [ ] Cache DOM references during initialization (sliders, note buttons)
- [ ] Create utility function `getInstrumentSliders(instrumentId)`
- [ ] Pre-group note buttons by step for playhead updates
- [ ] Debounce URL/JSON updates (300ms after last interaction)

**Files**: `script.js`

### 2.2 Resource Loading
**Why**: Sequential loading is 3x slower than necessary.

- [ ] Implement parallel audio loading with `Promise.all()`
- [ ] Add loading progress indicator
- [ ] Add preload hints in HTML: `<link rel="preload" href="..." as="fetch">`

**Files**: `script.js:49-68`, `index.html`

### 2.3 CSS Performance
**Why**: Layout thrashing and expensive properties.

- [ ] Replace `margin-left` animation with `transform: translateX()` for sidebar
- [ ] Add `will-change: filter` to `.note-button.playing-step`

**Files**: `style.css:572-588, 234-239`

### 2.4 Debug Logging
**Why**: 50+ console.log statements pollute console and impact performance.

- [ ] Create debug configuration system with categories (audio, state, ui, scheduler)
- [ ] Gate all console.log behind debug flags
- [ ] Remove commented-out code

**Files**: `script.js` (throughout)

---

## Phase 3: Maintainability & Code Structure

### 3.1 Configuration Management
**Why**: Magic numbers scattered across 20+ locations.

- [ ] Create `AUDIO_CONFIG` object (steps, bpm, scheduleAheadTime, schedulerInterval)
- [ ] Create `EFFECT_CONFIG` object (max delay time, feedback, wet amounts)
- [ ] Create `SLIDER_CONFIG` object (min, max, default)
- [ ] Create CSS custom properties for dimensions and colors

**Files**: `script.js`, `style.css`

### 3.2 Code Deduplication
**Why**: 32+ duplicate lines in slider creation alone.

- [ ] Extract `createEffectSlider(instrumentId, effectType)` function
- [ ] Extract `getInstrumentSliders(instrumentId)` utility (used 8+ times)
- [ ] Extract `updateNoteButtonStates(instrumentId, states)` utility
- [ ] Extract `updateStateAndUI()` composite function

**Files**: `script.js:155-189, 237-244, etc.`

### 3.3 Function Decomposition
**Why**: Functions exceeding 100 lines are hard to maintain.

- [ ] Split `loadUrlState()` (102 lines) into: `loadSidebarState()`, `loadSequencerState()`, `parseCompactState()`, `applyInstrumentState()`
- [ ] Split `applyJsonState()` (153 lines) into validation and application functions
- [ ] Split UI builder loop (81 lines) into: `createInstrumentRow()`, `createNoteButtons()`, `createEffectSlider()`

**Files**: `script.js:114-194, 263-364, 671-823`

### 3.4 Documentation
**Why**: No JSDoc comments make function contracts unclear.

- [ ] Add JSDoc to all public functions
- [ ] Document URL state format
- [ ] Document effect parameter calculations

**Files**: `script.js`

---

## Phase 4: UX Improvements

### 4.1 Discoverability
**Why**: Key features are hidden or unclear.

- [ ] Add label/tooltip to sidebar toggle ("State Editor")
- [ ] Add "Copy Link" button for URL sharing with clipboard feedback
- [ ] Add help/info button with keyboard shortcuts reference
- [ ] Move effect labels closer to sliders
- [ ] Add numeric value display for sliders

**Files**: `index.html`, `script.js`, `style.css`

### 4.2 Keyboard Shortcuts
**Why**: Standard music software conventions not followed.

- [ ] Add spacebar for play/stop
- [ ] Add Ctrl/Cmd+Z for undo (requires implementing undo stack)

**Files**: `script.js`

### 4.3 JSON Editor Improvements
**Why**: ContentEditable is nearly unusable for actual editing.

- [ ] Replace contenteditable with textarea for editing
- [ ] Add "Copy JSON" button
- [ ] Add "Download JSON" button
- [ ] Add "Import JSON" file picker
- [ ] Replace alert() with inline error messages
- [ ] Make Apply button sticky at bottom

**Files**: `index.html`, `script.js`, `style.css`

### 4.4 Onboarding
**Why**: First-time users have no guidance.

- [ ] Add empty state guidance: "Click squares to add drum hits"
- [ ] Add first-run tooltip or hint

**Files**: `index.html`, `script.js`

---

## Phase 5: Responsive Design

### 5.1 Mobile Support
**Why**: Currently unusable on mobile (fixed 800px+ width, tiny touch targets).

- [ ] Implement mobile-first responsive breakpoints
- [ ] Increase touch targets to 44x44px minimum on mobile
- [ ] Stack instruments vertically on narrow screens
- [ ] Make sequencer horizontally scrollable with snap points
- [ ] Add touch event handlers for better mobile feel

**Files**: `style.css`, `script.js`

---

## Phase 6: Extensibility (Future)

### 6.1 Effect Plugin System
**Why**: Adding new effects requires changes in 10+ locations.

- [ ] Define effect interface/base class
- [ ] Extract reverb/delay into plugins
- [ ] Create effect registry
- [ ] Support dynamic effect registration

### 6.2 Instrument Configuration
**Why**: Adding instruments requires CSS/JS changes in multiple places.

- [ ] Move instrument colors from CSS to JS configuration
- [ ] Generate CSS dynamically or use inline styles
- [ ] Remove hardcoded instrument selectors

### 6.3 Dynamic Step Count
**Why**: Changing from 16 steps requires HTML/CSS/JS refactoring.

- [ ] Generate step labels dynamically in JS
- [ ] Generate beat labels dynamically
- [ ] Make CSS grid calculations dynamic
- [ ] Update URL encoding for variable step counts

### 6.4 State Format Versioning
**Why**: No migration path for URL format changes.

- [ ] Add version field to serialized state
- [ ] Create migration system for format changes

---

## Implementation Priority

| Phase | Effort | Impact | Priority |
|-------|--------|--------|----------|
| 1.1 Accessibility | Medium | Critical | **P0** |
| 1.2 Error Handling | Low | High | **P0** |
| 1.3 Memory Management | Low | Medium | **P1** |
| 2.1 DOM Performance | Medium | Medium | **P1** |
| 2.2 Resource Loading | Low | Medium | **P1** |
| 2.3 CSS Performance | Low | Low | **P2** |
| 2.4 Debug Logging | Low | Medium | **P1** |
| 3.1 Configuration | Medium | High | **P1** |
| 3.2 Deduplication | Medium | High | **P1** |
| 3.3 Function Decomposition | High | Medium | **P2** |
| 3.4 Documentation | Medium | Medium | **P2** |
| 4.1 Discoverability | Medium | High | **P1** |
| 4.2 Keyboard Shortcuts | Low | Medium | **P2** |
| 4.3 JSON Editor | Medium | Medium | **P2** |
| 4.4 Onboarding | Low | Medium | **P2** |
| 5.1 Mobile Support | High | High | **P1** |
| 6.x Extensibility | Very High | Medium | **P3** |

---

## Estimated Effort

- **Phase 1 (Critical)**: ~8-12 hours
- **Phase 2 (Performance)**: ~6-8 hours
- **Phase 3 (Maintainability)**: ~12-16 hours
- **Phase 4 (UX)**: ~8-12 hours
- **Phase 5 (Responsive)**: ~12-16 hours
- **Phase 6 (Extensibility)**: ~60-80 hours

**Total for Production-Ready (Phases 1-5)**: ~46-64 hours
**Total including Extensibility**: ~106-144 hours

---

## Quick Wins (< 1 hour each)

1. Add `source.onended` cleanup in `playSound()`
2. Add page unload cleanup
3. Add reset confirmation dialog
4. Add spacebar play/stop shortcut
5. Add Copy Link button
6. Replace alert() with inline messages
7. Add CSS custom properties for colors
8. Add preload hints to HTML
9. Remove console.log statements
10. Remove commented-out code

---

## Validation Feedback Summary

### Architecture Validator Adjustments:
- **Elevate Configuration Management to P0** - foundational for other refactoring
- **Add race condition fix** in `loadUrlState()` retry pattern (lines 276-284)
- **Add state machine abstraction** for playback controller
- **Consider TypeScript** for complex data structures
- **Add state format versioning early** before URL format changes

### Frontend/UX Validator Adjustments:
- **Elevate JSON Editor fix to P0** - currently broken/unusable
- **Add color contrast validation** to accessibility (WCAG AA)
- **Add iOS audio unlock handling** for mobile support
- **Add focus trap in sidebar** when open
- **Add `prefers-reduced-motion`** support
- **Fix sidebar to full-width overlay** on mobile
- **Remove fixed-width constraints** before responsive work
- **Expand CSS custom properties** to comprehensive token system

### Performance Validator Adjustments:
- **CRITICAL: Cache note buttons by step index** for playhead animation (60fps querySelectorAll)
- **Remove console.logs from scheduler** (lines 414-420) - affects playback
- **Reduce debounce to 100-150ms** for JSON editor only, not URL
- **Use `Promise.allSettled()`** instead of `Promise.all()` for audio loading
- **Fix sidebar animation target** - animate `#sidebar` with transform, not `.main-container` margin
- **Add dynamic `will-change`** - don't keep permanently on all buttons

### Revised Priority Matrix:

| Item | Original | Validated |
|------|----------|-----------|
| Configuration Management | P1 | **P0** |
| JSON Editor fix | P2 | **P0** |
| Playhead DOM caching | P1 | **P0** |
| Console.log in scheduler | P1 | **P0** |
| Memory cleanup | P1 | P1 |
| iOS audio unlock | Missing | **P0** |
| Color contrast | Missing | **P0** |
| URL debounce | P1 | **P2** |
| Mobile responsive | P1 | P1 |

### Effort Adjustment:
- Original: 46-64 hours
- Validated: **55-75 hours** (adding iOS support, expanded CSS tokens, sidebar mobile)
