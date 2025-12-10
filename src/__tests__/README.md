# Tests

This directory contains unit tests for the loop machine project using Vitest and happy-dom.

## Running Tests

```bash
# Run tests in watch mode (default)
pnpm test

# Run tests once
pnpm test:run

# Run tests with UI
pnpm test:ui

# Run tests with coverage report
pnpm test:coverage
```

## Test Files

- `helpers.test.js` - Tests for state serialization and value conversion helper functions
  - `stateToHex()` - Converts boolean arrays to hex strings
  - `hexToState()` - Converts hex strings to boolean arrays
  - `valueToChar()` - Converts numeric values (0-10) to characters ('0'-'9', 'a')
  - `charToValue()` - Converts characters back to numeric values

## Test Coverage

The tests include:
- Edge cases (empty, null, invalid inputs)
- Boundary conditions (min/max values)
- Round-trip conversion tests
- Integration tests for combined operations
- Pattern matching tests for state serialization

## Adding New Tests

1. Create a new test file in `src/__tests__/` with the `.test.js` extension
2. Import the necessary test functions from vitest:
   ```javascript
   import { describe, it, expect } from 'vitest';
   ```
3. Import the functions you want to test
4. Write your test suites using `describe()` and `it()`

## Configuration

The test environment is configured in `/Users/brsbl/Documents/loop-machine/vitest.config.js`:
- Environment: happy-dom (lightweight DOM implementation)
- Globals: enabled (no need to import test functions in every file)
- Coverage: v8 provider with text, JSON, and HTML reporters
