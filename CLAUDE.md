# Loop Machine - Project Context

## Overview
Loop Machine is a web-based drum sequencer and loop machine built with vanilla JavaScript and the Web Audio API. It provides a 16-step sequencer with drum instruments, real-time audio effects, and state persistence through URL parameters.

## Tech Stack
- **Frontend**: Vanilla JavaScript (ES6 modules)
- **Audio**: Web Audio API
- **Testing**: Jest with jsdom environment
- **Code Quality**: ESLint, Prettier, Husky with lint-staged
- **Development Server**: serve (npm package)
- **Build Tools**: Babel for test transpilation
- **Deployment**: Vercel (with custom configuration for static site hosting)

## Architecture

### Core Modules
1. **AudioManager** (`src/audio/AudioManager.js`)
   - Manages Web Audio API context and audio nodes
   - Handles sample loading and playback
   - Controls reverb and delay effects

2. **StateManager** (`src/state/StateManager.js`)
   - Central state management for the application
   - Handles state transformations and updates
   - Manages grid state for the sequencer

3. **UIManager** (`src/ui/UIManager.js`)
   - Creates and manages all UI elements
   - Handles user interactions
   - Updates visual feedback for sequencer steps

4. **Sequencer** (`src/core/Sequencer.js`)
   - Controls playback timing and scheduling
   - Manages BPM and step progression
   - Coordinates with AudioManager for sample triggering

5. **UrlStateHandler** (`src/state/UrlStateHandler.js`)
   - Persists application state in URL parameters
   - Handles state serialization/deserialization
   - Enables sharing of patterns via URLs

### Directory Structure
```
/src
  /audio         - Audio processing and sample management
  /core          - Core sequencer logic
  /state         - State management and persistence
  /ui            - User interface components
  /constants     - Application constants and configuration
  script.js      - Main application entry point

/tests          - Jest test files (including null context tests)
/public         - Static HTML and CSS
/assets/samples - Audio sample libraries (808, 909 drums)
/docs           - Documentation (refactoring summary, test setup)
```

## Key Features
- 16-step drum sequencer with 3 instrument tracks
- Real-time audio effects (reverb and delay)
- BPM control (60-200 BPM)
- Pattern persistence via URL
- JSON state editor for advanced control
- Responsive grid-based UI

## Development Workflow

### Commands
- `npm start` / `npm run dev` - Start development server on port 3000
- `npm test` - Run test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run lint` - Check code style with ESLint
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run format` - Auto-format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run check` - Run all quality checks (format, lint, test)
- `npm run clean` - Remove coverage and node_modules directories

### Code Style
- ESLint for JavaScript linting (with specific rules for strict equality, curly braces, etc.)
- Prettier for code formatting
- Husky pre-commit hooks with lint-staged ensure code quality
- Lint-staged configuration automatically runs ESLint and Prettier on staged files

## State Management
The application state includes:
- Grid pattern (16x3 boolean array)
- BPM (beats per minute)
- Reverb amount (0-100)
- Delay amount (0-100)
- Playing state (boolean)

State is automatically serialized to URL parameters for persistence and sharing.

## Audio Samples
The project includes two drum machine sample libraries:
- 808 samples: Classic TR-808 drum sounds (kick, snare, hi-hat, clap, cymbal, tom, bass)
- 909 samples: TR-909 drum sounds in three variations (clean, cassette 1, cassette 2)

## Recent Development
- Refactored from monolithic script to modular ES6 architecture
- Added comprehensive test coverage including null AudioContext handling
- Implemented proper separation of concerns
- Enhanced state management with URL persistence
- Added JSON state editor for advanced control
- Added Vercel deployment configuration for hosting
- Improved error handling for AudioContext initialization failures

## Testing Strategy
- Unit tests for core modules (AudioManager, StateManager, Sequencer, UrlStateHandler)
- Mock Web Audio API for audio-related tests
- Test coverage includes state transformations and UI interactions
- Specific tests for null AudioContext scenarios to ensure graceful degradation
- Integration tests for audio initialization

## Project Configuration

### ESLint Configuration (.eslintrc.json)
- Browser and ES2021 environment with Jest support
- Extends eslint:recommended, jest/recommended, and prettier configs
- Custom rules for code quality (no-console warnings, strict equality, mandatory curly braces)
- Ignores node_modules, coverage, dist, and build directories

### Vercel Configuration (vercel.json)
- Static site hosting with no build command required
- Custom rewrites to serve public/index.html and style.css
- CORS headers configured for all routes

### Package Configuration
- Type: ES6 module
- Main entry: script.js
- Version: 1.0.0

## Future Considerations
- Additional instrument tracks
- More audio effects (filter, distortion)
- Pattern save/load functionality
- MIDI support
- Visual waveform display
- Pattern variations and song mode