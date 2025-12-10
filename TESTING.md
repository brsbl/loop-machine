# Testing Setup Guide

This document describes the Vitest testing setup for the loop-machine project.

## Overview

The project now uses Vitest with happy-dom for fast, modern JavaScript testing. Helper functions have been extracted from `script.js` into a testable module.

## What Was Set Up

### 1. Dependencies
- **vitest** (v4.0.15) - Fast unit test framework
- **happy-dom** (v20.0.11) - Lightweight DOM implementation for testing

### 2. Configuration Files

#### `/Users/brsbl/Documents/loop-machine/vitest.config.js`
Configures Vitest with:
- happy-dom environment
- Global test functions (describe, it, expect)
- v8 coverage provider
- HTML, JSON, and text coverage reports

#### `/Users/brsbl/Documents/loop-machine/package.json`
Added:
- `"type": "module"` for ES modules support
- Test scripts:
  - `pnpm test` - Run in watch mode
  - `pnpm test:run` - Run once
  - `pnpm test:ui` - Run with UI
  - `pnpm test:coverage` - Run with coverage report

### 3. Source Files

#### `/Users/brsbl/Documents/loop-machine/src/helpers.js`
Extracted helper functions from script.js:
- `stateToHex(stateArray)` - Convert boolean array to hex string
- `hexToState(hexString)` - Convert hex string to boolean array
- `valueToChar(val)` - Convert 0-10 to '0'-'9','a'
- `charToValue(char)` - Convert '0'-'9','a' to 0-10

All functions are exported for testing and include JSDoc comments with examples.

### 4. Test Files

#### `/Users/brsbl/Documents/loop-machine/src/__tests__/helpers.test.js`
Comprehensive test suite with 29 tests covering:

**stateToHex tests (5 tests)**
- All false → "0000"
- All true → "ffff"
- Alternating patterns
- Zero padding
- Specific bit patterns

**hexToState tests (8 tests)**
- Valid hex conversions
- Invalid input handling (empty, wrong length, null/undefined)
- Round-trip verification with stateToHex

**valueToChar tests (7 tests)**
- Individual value conversions (0-10)
- String input handling
- Invalid input fallback
- Complete range validation

**charToValue tests (6 tests)**
- Individual char conversions
- Invalid input fallback
- Complete range validation
- Round-trip verification with valueToChar

**Integration tests (3 tests)**
- Round-trip conversions
- Various state patterns

## Running Tests

```bash
# Watch mode (recommended during development)
pnpm test

# Run once (for CI or quick check)
pnpm test:run

# Coverage report
pnpm test:coverage
```

## Test Results

All 29 tests are passing:
```
✓ src/__tests__/helpers.test.js (29 tests) 12ms

Test Files  1 passed (1)
     Tests  29 passed (29)
  Start at  18:29:47
  Duration  452ms
```

## Next Steps

### To use the extracted helpers in script.js:
1. Import the helpers at the top of script.js:
   ```javascript
   import { stateToHex, hexToState, valueToChar, charToValue } from './src/helpers.js';
   ```

2. Remove the duplicate function definitions from script.js (lines 198-226)

3. Add `type="module"` to the script tag in index.html:
   ```html
   <script type="module" src="script.js"></script>
   ```

### To add more tests:
1. Create new `.test.js` files in `src/__tests__/`
2. Import test functions and modules to test
3. Write describe/it blocks
4. Run `pnpm test` to see results in real-time

### To extract and test more functions:
Consider extracting these for testing:
- Audio context initialization
- Sample loading logic
- State serialization/deserialization
- URL hash management
- UI state synchronization

## Benefits

- Fast test execution (29 tests in 12ms)
- Hot reload in watch mode
- Type-safe helper functions with JSDoc
- Easy to add new tests
- CI/CD ready with `pnpm test:run`
- Coverage reporting available
