# Loop Machine

A web-based drum sequencer and loop machine built with vanilla JavaScript and the Web Audio API.

## Features

- 16-step sequencer with 3 drum instruments
- Real-time playback with adjustable BPM
- Reverb and delay effects with adjustable parameters
- State persistence via URL parameters
- JSON state editor for advanced control
- Responsive design

## Project Structure

```
loop-machine/
├── src/                    # Source code
│   ├── components/         # Main application components
│   │   ├── AudioManager.js     # Web Audio API management
│   │   ├── Sequencer.js        # Playback timing and control
│   │   ├── StateManager.js     # Application state management
│   │   ├── UIManager.js        # User interface management
│   │   └── UrlStateHandler.js  # URL state persistence
│   ├── config/            # Configuration
│   │   └── config.js          # App configuration and constants
│   └── script.js          # Main application entry point
├── tests/                 # Test files
│   ├── AudioManager.test.js
│   ├── StateManager.test.js
│   └── script.test.js
├── public/                # Static files
│   ├── index.html
│   └── style.css
├── assets/                # Media assets
│   └── samples/           # Audio samples
│       ├── 808 Samples/
│       └── BPB Cassette 909/
└── docs/                  # Documentation
    ├── REFACTORING_SUMMARY.md
    └── TEST_SETUP.md
```

## Development

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

```bash
npm install
```

### Running Tests

```bash
npm test                # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage report
```

### Code Quality

```bash
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues
npm run format          # Format code with Prettier
npm run format:check    # Check code formatting
```

### Development Server

To run the application locally, use any static file server. For example:

```bash
cd public
python3 -m http.server 8000
# or
npx serve public
```

Then open `http://localhost:8000` in your browser.

## Usage

1. Click on the grid to create drum patterns
2. Press START/STOP to control playback
3. Adjust reverb and delay sliders for effects
4. Click the gear icon to access the JSON editor
5. Your patterns are automatically saved in the URL

## Architecture

The application follows a modular architecture with clear separation of concerns:

- **AudioManager**: Handles all Web Audio API interactions
- **StateManager**: Manages application state and transformations
- **UIManager**: Handles UI creation and user interactions
- **Sequencer**: Controls playback timing and scheduling
- **UrlStateHandler**: Manages URL-based state persistence

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.