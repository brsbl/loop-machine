# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Loop Machine - Project Context

## Overview
Loop Machine is a web-based drum sequencer and loop machine built with vanilla JavaScript and the Web Audio API. It provides a 16-step sequencer with drum instruments, real-time audio effects, and state persistence through URL parameters.

## Tech Stack
- **Frontend**: Vanilla JavaScript (ES6 modules)
- **Audio**: Web Audio API
- **Testing**: Jest with jsdom environment
- **Code Quality**: ESLint, Prettier, Husky with lint-staged
- **Development Server**: serve (npm package)
- **Build Tools**: Babel for test transpilation only

## Architecture

### Core Modules
1. **AudioManager** (`src/audio/AudioManager.js`)
   - Manages Web Audio API context and audio nodes
   - Handles sample loading and playback
   - Controls reverb and delay effects
   - Creates and configures all audio nodes

2. **StateManager** (`src/state/StateManager.js`)
   - Central state management for the application
   - Handles state transformations and updates
   - Manages grid state for the sequencer
   - All state changes go through defined methods

3. **UIManager** (`src/ui/UIManager.js`)
   - Creates and manages all UI elements
   - Handles user interactions
   - Updates visual feedback for sequencer steps
   - No direct state manipulation - uses callbacks

4. **Sequencer** (`src/core/Sequencer.js`)
   - Controls playback timing and scheduling
   - Manages BPM and step progression
   - Coordinates with AudioManager for sample triggering
   - Uses setInterval for timing

5. **UrlStateHandler** (`src/state/UrlStateHandler.js`)
   - Persists application state in URL parameters
   - Handles state serialization/deserialization
   - Enables sharing of patterns via URLs
   - Uses hexadecimal encoding for compact URLs

### Key Architectural Patterns
- **Dependency Injection**: All classes receive dependencies via constructor
- **No Build Step**: Direct ES6 module usage in browser (type="module")
- **Event-driven**: UI communicates via callbacks
- **Centralized State**: All state managed by StateManager
- **Index Exports**: Each directory has index.js for clean imports

## Development Commands

### Running the Application
- `npm start` or `npm run dev` - Start development server on port 3000

### Testing
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report
- To run a single test file: `npm test -- AudioManager.test.js`
- To run tests matching a pattern: `npm test -- --testNamePattern="should handle"`

### Code Quality
- `npm run lint` - Check code with ESLint
- `npm run lint:fix` - Auto-fix linting issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check if formatting is needed
- `npm run check` - Run all checks (format, lint, test)
- `npm run clean` - Remove coverage reports and node_modules

## State Management Details
The application state structure:
```javascript
{
  grid: boolean[16][3],  // 16 steps × 3 instruments
  bpm: number,           // 60-200
  reverb: number,        // 0-100
  delay: number,         // 0-100
  isPlaying: boolean
}
```

State encoding in URL:
- Grid is converted to hexadecimal string for compact URLs
- Example: `?grid=ffff00008888&bpm=120&reverb=20&delay=15`

## Testing Patterns
- **Mocking**: Comprehensive mocks for Web Audio API in tests
- **Setup**: Use `beforeEach` for test isolation
- **Cleanup**: Always clean up mocks and timers
- **Integration Tests**: Separate files for testing component interactions
- **Edge Cases**: Test both success and failure paths

## Audio Implementation
- **Sample Loading**: Loads from `/assets/samples/808/` and `/assets/samples/909/`
- **Effects Chain**: Source → Gain → Effects → Destination
- **Error Handling**: Graceful fallback if AudioContext unavailable
- **Sample Triggering**: Creates new source node for each trigger

## Important Conventions
- **No Local Storage**: State persisted only through URL parameters
- **Error Messages**: Use console.warn for non-critical issues
- **DOM Queries**: All DOM manipulation through UIManager
- **Constants**: All magic numbers in `/src/constants/`
- **Module Imports**: Use relative paths with .js extensions