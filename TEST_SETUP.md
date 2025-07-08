# Testing Suite and Pre-commit Hooks Setup

This document explains the testing framework and pre-commit hooks that have been set up for the Loop Machine project.

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Initialize Husky (one-time setup):
   ```bash
   npx husky install
   ```

## Testing Philosophy

Tests focus on **core functionality** rather than UI details that may change. The goal is maintainable tests that:
- Test business logic and critical functionality
- Are resilient to design changes
- Are easy to understand and update
- Provide meaningful feedback when they fail

### Running Tests

- Run all tests: `npm test`
- Run tests in watch mode: `npm run test:watch`
- Run tests with coverage: `npm run test:coverage`

### Test Structure

`script.test.js` - Tests for core loop machine functionality:
- **State Conversion Utilities** - Critical for URL state persistence
  - `stateToHex` - Converts sequencer patterns to compact hex strings
  - `hexToState` - Restores sequencer patterns from hex strings
- **Slider Value Encoding** - Encodes effect values for URL persistence
  - `valueToChar` - Converts slider values (0-10) to single characters
  - `charToValue` - Restores slider values from characters
- **Audio Loading** - Ensures samples load correctly
- **Sequencer Timing** - Validates BPM calculations for accurate playback

### Writing New Tests

Focus on testing **behavior**, not implementation. Good tests:

```javascript
describe("Feature being tested", () => {
  test("should handle specific scenario", () => {
    // Given - Set up test data
    const input = [true, false, true, false];
    
    // When - Execute the functionality
    const result = stateToHex(input);
    
    // Then - Verify the outcome
    expect(result).toBe("a000");
  });
});
```

Avoid testing:
- CSS classes or styling
- Exact HTML structure
- UI text that might change
- Implementation details

## Linting and Formatting

### Manual Commands

- Run ESLint: `npm run lint`
- Fix ESLint issues: `npm run lint:fix`
- Run Prettier: `npm run format`
- Check Prettier formatting: `npm run format:check`

### Configuration

- ESLint config: `.eslintrc.json`
- Prettier config: `.prettierrc`
- Ignored files: `.prettierignore`

## Pre-commit Hooks

Pre-commit hooks automatically run before each commit to ensure code quality.

### What Runs on Pre-commit

1. **Lint-staged** - Runs on staged files only:
   - ESLint with auto-fix for JavaScript files
   - Prettier formatting for all supported files

2. **Tests** - All tests must pass before commit

### Bypassing Hooks (Emergency Only)

If you need to commit without running hooks:
```bash
git commit --no-verify -m "your message"
```

**Note:** Use this sparingly as it bypasses quality checks.

## Test Coverage

While coverage metrics can be viewed with `npm run test:coverage`, the focus is on **quality over quantity**. Good tests that cover critical functionality are more valuable than hitting arbitrary coverage numbers.

View the coverage report in the `coverage/` directory after running the coverage command.

## Troubleshooting

### Tests Failing
- Ensure all dependencies are installed: `npm install`
- Clear Jest cache: `npx jest --clearCache`

### Pre-commit Hooks Not Running
- Ensure Husky is installed: `npx husky install`
- Check hook permissions: `chmod +x .husky/pre-commit`

### ESLint/Prettier Conflicts
- The configuration uses `eslint-config-prettier` to disable ESLint rules that conflict with Prettier
- Run `npm run format` followed by `npm run lint:fix` to resolve most issues