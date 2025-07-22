# Race Condition Fix in URL State Loading

## Summary

Fixed a race condition in UrlStateHandler that could cause multiple retry timers to stack up, leading to unpredictable state updates when the application loaded state from URLs.

## Issue

The original implementation had several problems:
1. Multiple retry timers could run simultaneously without cancellation
2. No debouncing for URL updates
3. No prevention of concurrent state loads
4. No cancellation mechanism for obsolete operations

## Solution

### 1. Timeout Management
- Store timeout IDs (`loadRetryTimeout`, `updateDebounceTimeout`)
- Clear previous timeouts before creating new ones
- Proper cleanup in `cancelPendingOperations()`

### 2. Singleton Pattern for State Loading
- Added `isLoadingState` flag to prevent concurrent loads
- Only one state loading operation can run at a time

### 3. Cancellation Tokens
- Implemented cancellation token system (`loadCancellationToken`)
- Cancel previous operations when new ones start
- Check token status before applying state changes

### 4. URL Update Debouncing
- Added 100ms debounce for URL updates
- Prevents rapid URL history changes
- Cancellable via `clearUrl()`

### 5. Improved Retry Logic
- Pass retry count through callbacks
- Limit maximum retries (default: 50)
- Proper error handling when max retries reached

## Files Modified

### src/state/UrlStateHandler.js
- Added timeout and state tracking properties
- Implemented cancellation token system
- Added debouncing for URL updates
- Enhanced retry logic with proper cleanup

### src/script.js
- Updated `loadUrlState()` to pass retry count
- Added cleanup on page unload

### tests/UrlStateHandler.test.js
- Unit tests for timeout management
- Tests for concurrent load prevention
- Tests for cancellation tokens
- Tests for URL update debouncing

### tests/UrlStateHandler.integration.test.js
- Integration tests for rapid navigation
- Tests for network delay scenarios
- State consistency verification

### tests/UrlStateHandler.raceCondition.test.js
- Specific tests for the original race condition
- Tests with artificial network delays
- Browser back button spam simulation
- Timeout cancellation verification

## Testing

All tests pass successfully, including:
- 10 unit tests
- 6 integration tests  
- 5 race condition specific tests

The fix ensures that:
- Only one state load can happen at a time
- Previous retry timers are cancelled
- URL updates are debounced
- State remains consistent during rapid navigation