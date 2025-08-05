# Loop Machine - Project Context

## Overview
Loop Machine is a web-based drum sequencer and loop machine built with vanilla JavaScript and the Web Audio API. It provides a 16-step sequencer with drum instruments, real-time audio effects, and state persistence through URL parameters.

## Tech Stack
- **Frontend**: Vanilla JavaScript (ES6 modules)
- **Audio**: Web Audio API with fallback handling
- **Testing**: Jest with jsdom environment
- **Code Quality**: ESLint, Prettier, Husky (partial setup)
- **Development Server**: serve (npm package)
- **Build Tools**: Babel for test transpilation
- **Deployment**: Vercel-ready configuration

## Architecture

### Core Modules
1. **AudioManager** (`src/audio/AudioManager.js`)
   - Manages Web Audio API context and audio nodes
   - Handles sample loading and playback
   - Controls reverb and delay effects
   - Robust error handling for unsupported browsers

2. **StateManager** (`src/state/StateManager.js`)
   - Central state management for the application
   - Handles state transformations and updates
   - Manages grid state for the sequencer
   - Validates state integrity

3. **UIManager** (`src/ui/UIManager.js`)
   - Creates and manages all UI elements
   - Handles user interactions
   - Updates visual feedback for sequencer steps
   - Manages JSON state editor modal

4. **Sequencer** (`src/core/Sequencer.js`)
   - Controls playback timing and scheduling
   - Manages BPM and step progression
   - Coordinates with AudioManager for sample triggering
   - Comprehensive timer cleanup for memory leak prevention

5. **UrlStateHandler** (`src/state/UrlStateHandler.js`)
   - Persists application state in URL parameters
   - Handles state serialization/deserialization
   - Enables sharing of patterns via URLs

### Directory Structure
```
/root/repo/
├── src/                        # Source code (15 JS files)
│   ├── audio/                  # Audio processing
│   │   ├── AudioManager.js     # Web Audio API management
│   │   └── index.js           # Module exports
│   ├── constants/              # Configuration constants
│   │   ├── effects.js         # Effect settings
│   │   ├── instruments.js     # Instrument definitions
│   │   ├── sequencer.js       # Sequencer configuration
│   │   ├── url.js            # URL parameter constants
│   │   └── index.js          # Centralized exports
│   ├── core/                  # Core sequencer logic
│   │   ├── Sequencer.js       # Timing and playback control
│   │   └── index.js
│   ├── state/                 # State management
│   │   ├── StateManager.js    # Application state
│   │   ├── UrlStateHandler.js # URL persistence
│   │   └── index.js
│   ├── ui/                    # User interface
│   │   ├── UIManager.js       # UI creation and updates
│   │   └── index.js
│   └── script.js              # Main application entry point
├── tests/                     # Test suite (24 test files)
├── public/                    # Static assets
│   ├── index.html            # Main HTML file
│   └── style.css             # Styling
├── assets/samples/            # Audio samples
│   ├── 808/                  # TR-808 drum samples
│   └── 909/                  # TR-909 drum samples
├── docs/                     # Documentation
└── vercel.json              # Deployment configuration
```

## Key Features
- 16-step drum sequencer with 3 instrument tracks
- Real-time audio effects (reverb and delay)
- BPM control (60-200 BPM)
- Pattern persistence via URL
- JSON state editor for advanced control
- Responsive grid-based UI
- Memory leak prevention with proper timer cleanup
- Graceful degradation for unsupported browsers

## Development Workflow

### Commands
- `npm start` / `npm run dev` - Start development server on port 3000
- `npm test` - Run test suite (102 passing, 2 failing)
- `npm run lint` - Check code style (currently 76 errors, 18 warnings)
- `npm run format` - Auto-format code with Prettier
- `npm run check` - Run all quality checks
- `npm run test:coverage` - Generate test coverage report

### Code Style
- ESLint for JavaScript linting (needs attention: 94 issues)
- Prettier for code formatting (30 files need formatting)
- Husky pre-commit hooks (setup incomplete)

## State Management
The application state includes:
- Grid pattern (16x3 boolean array)
- BPM (beats per minute)
- Reverb amount (0-100)
- Delay amount (0-100)
- Playing state (boolean)

State is automatically serialized to URL parameters for persistence and sharing.

## Testing Coverage
- **Overall Coverage**: 58.82% statement coverage
- **Core Components**:
  - AudioManager: 100% coverage
  - Sequencer: 96.77% coverage
  - StateManager: 91.6% coverage
  - UIManager: 9.59% coverage (UI testing challenges)
- **Test Types**:
  - Unit tests for core functionality
  - Integration tests for module interactions
  - Null context tests for audio failures
  - Memory leak tests for timer cleanup

## Audio Samples
The project includes two drum machine sample libraries:
- 808 samples: Classic TR-808 drum sounds (kick, snare, hi-hat)
- 909 samples: TR-909 drum sounds (multiple variations per instrument)

## Recent Development
- **Memory Leak Fix**: Comprehensive timer tracking and cleanup in Sequencer
- **Deployment Setup**: Added Vercel configuration with CORS headers
- **Audio Context Resilience**: Robust handling of initialization failures
- **Test Expansion**: Added memory leak and null context tests
- **Code Organization**: Refactored from 875-line monolith to modular architecture

## Known Issues
1. **Code Quality**: 94 ESLint violations need resolution
2. **Test Reliability**: 2 timing-related tests are failing
3. **UI Test Coverage**: Low coverage (9.59%) for UIManager
4. **Pre-commit Hooks**: Husky setup is incomplete

## Future Considerations
- Additional instrument tracks
- More audio effects (filter, distortion, compression)
- Pattern save/load functionality
- MIDI support
- Visual waveform display
- Pattern variations and song mode
- Improved UI test coverage
- Complete Husky pre-commit hook setup