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

## Testing

### Running Tests

- Run all tests: `npm test`
- Run tests in watch mode: `npm run test:watch`
- Run tests with coverage: `npm run test:coverage`

### Test Structure

- `script.test.js` - Tests for the main JavaScript functionality including:
  - Utility functions (hex/state conversions)
  - DOM interactions
  - URL state management
  - Audio context mocking

- `style.test.js` - Tests for CSS styling verification

### Writing New Tests

Tests use Jest with jsdom environment. Example test:

```javascript
test("description of what should happen", () => {
  // Arrange
  const input = "test";
  
  // Act
  const result = functionToTest(input);
  
  // Assert
  expect(result).toBe("expected output");
});
```

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

## Coverage Requirements

The project has the following coverage thresholds:
- Branches: 80%
- Functions: 80%
- Lines: 80%
- Statements: 80%

View coverage report after running `npm run test:coverage` in the `coverage/` directory.

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