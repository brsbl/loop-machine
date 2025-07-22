import { UrlStateHandler } from '../src/state/UrlStateHandler.js';
import { StateManager } from '../src/state/StateManager.js';
import { AudioManager } from '../src/audio/AudioManager.js';

describe('UrlStateHandler', () => {
  let urlStateHandler;
  let stateManager;
  let uiManager;
  let audioManager;
  let originalLocation;
  let originalHistory;

  beforeEach(() => {
    // Mock window.location
    originalLocation = window.location;
    delete window.location;
    window.location = {
      pathname: '/test',
      search: '',
      href: 'http://localhost/test'
    };

    // Mock window.history
    originalHistory = window.history.replaceState;
    window.history.replaceState = jest.fn();

    // Create mocks
    stateManager = new StateManager();
    audioManager = new AudioManager();
    uiManager = {
      audioManager,
      getSliderValues: jest.fn().mockReturnValue({
        bpm: 120,
        reverb: 50,
        delay: 30
      }),
      updateFromState: jest.fn()
    };

    // Mock audio manager methods
    audioManager.getContext = jest.fn().mockReturnValue({});
    audioManager.isReady = jest.fn().mockReturnValue(true);

    // Create instance
    urlStateHandler = new UrlStateHandler(stateManager, uiManager);
  });

  afterEach(() => {
    // Restore mocks
    window.location = originalLocation;
    window.history.replaceState = originalHistory;
    
    // Clear any pending operations
    urlStateHandler.cancelPendingOperations();
  });

  describe('Race Condition Prevention', () => {
    test('should cancel previous retry timeouts when new load is initiated', () => {
      const retryCallback = jest.fn();
      window.location.search = '?s=test';
      
      // Make audio not ready to trigger retry
      audioManager.isReady.mockReturnValue(false);
      
      // Start first load
      urlStateHandler.loadFromUrl(retryCallback);
      const firstTimeout = urlStateHandler.loadRetryTimeout;
      expect(firstTimeout).toBeTruthy();
      
      // Reset loading state to allow second load
      urlStateHandler.isLoadingState = false;
      
      // Start second load before first completes
      urlStateHandler.loadFromUrl(retryCallback);
      const secondTimeout = urlStateHandler.loadRetryTimeout;
      
      // First timeout should be different from second
      expect(firstTimeout).not.toBe(secondTimeout);
    });

    test('should prevent concurrent loads', () => {
      const retryCallback = jest.fn();
      
      // Set loading state manually
      urlStateHandler.isLoadingState = true;
      
      // Try to load - should skip
      const consoleSpy = jest.spyOn(console, 'log');
      urlStateHandler.loadFromUrl(retryCallback);
      
      expect(consoleSpy).toHaveBeenCalledWith('State loading already in progress, skipping...');
      consoleSpy.mockRestore();
    });

    test('should use cancellation tokens to prevent stale operations', async () => {
      const retryCallback = jest.fn();
      window.location.search = '?s=test';
      
      // Make audio not ready
      audioManager.isReady.mockReturnValue(false);
      
      // Start first load
      urlStateHandler.loadFromUrl(retryCallback);
      const firstToken = urlStateHandler.loadCancellationToken;
      
      // Start second load immediately
      urlStateHandler.loadFromUrl(retryCallback);
      const secondToken = urlStateHandler.loadCancellationToken;
      
      // First token should be cancelled
      expect(firstToken.cancelled).toBe(true);
      expect(secondToken.cancelled).toBe(false);
      
      // Cancel pending operations to clean up
      urlStateHandler.cancelPendingOperations();
    });

    test('should handle max retries correctly', () => {
      const retryCallback = jest.fn();
      const consoleSpy = jest.spyOn(console, 'error');
      window.location.search = '?s=test';
      
      // Make audio never ready
      audioManager.isReady.mockReturnValue(false);
      
      // Load with max retries = 0, already at max
      urlStateHandler.loadFromUrl(retryCallback, 0, 0);
      
      expect(consoleSpy).toHaveBeenCalledWith('Max retries reached or no retry callback provided');
      consoleSpy.mockRestore();
    });
  });

  describe('URL Update Debouncing', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should debounce URL updates', () => {
      jest.spyOn(stateManager, 'generateCompactState').mockReturnValue('test-state');
      
      // Call updateUrl multiple times rapidly
      urlStateHandler.updateUrl();
      urlStateHandler.updateUrl();
      urlStateHandler.updateUrl();
      
      // Should not update immediately
      expect(window.history.replaceState).not.toHaveBeenCalled();
      
      // Fast forward past debounce delay
      jest.advanceTimersByTime(150);
      
      // Should only update once after debounce delay
      expect(window.history.replaceState).toHaveBeenCalledTimes(1);
    });

    test('should cancel pending URL updates on clearUrl', () => {
      jest.spyOn(stateManager, 'generateCompactState').mockReturnValue('test-state');
      
      // Start update
      urlStateHandler.updateUrl();
      
      // Should have pending timeout
      expect(urlStateHandler.updateDebounceTimeout).toBeTruthy();
      
      // Clear immediately
      urlStateHandler.clearUrl();
      
      // Should have cleared the timeout
      expect(urlStateHandler.updateDebounceTimeout).toBeNull();
      
      // Fast forward time
      jest.advanceTimersByTime(150);
      
      // Should have cleared URL once, but no update with state
      expect(window.history.replaceState).toHaveBeenCalledTimes(1);
      expect(window.history.replaceState).toHaveBeenCalledWith(null, '', '/test');
    });
  });

  describe('State Loading', () => {
    test('should successfully load state when audio is ready', () => {
      const testState = { grid: [], bpm: 140, reverb: 60, delay: 40 };
      window.location.search = '?s=valid-state';
      
      jest.spyOn(stateManager, 'parseCompactState').mockReturnValue(testState);
      jest.spyOn(stateManager, 'applyParsedState');
      
      urlStateHandler.loadFromUrl();
      
      expect(stateManager.parseCompactState).toHaveBeenCalledWith('valid-state');
      expect(stateManager.applyParsedState).toHaveBeenCalledWith(testState);
      expect(uiManager.updateFromState).toHaveBeenCalledWith(testState);
    });

    test('should handle invalid state gracefully', () => {
      window.location.search = '?s=invalid-state';
      const consoleSpy = jest.spyOn(console, 'warn');
      
      jest.spyOn(stateManager, 'parseCompactState').mockReturnValue(null);
      
      urlStateHandler.loadFromUrl();
      
      expect(consoleSpy).toHaveBeenCalledWith('Invalid compact state in URL:', 'invalid-state');
      consoleSpy.mockRestore();
    });

    test('should load sidebar state independently of audio', () => {
      window.location.search = '?sidebar=1';
      audioManager.isReady.mockReturnValue(false);
      
      // Mock classList
      document.body.classList.add = jest.fn();
      
      urlStateHandler.loadFromUrl();
      
      expect(document.body.classList.add).toHaveBeenCalledWith('sidebar-visible');
    });
  });

  describe('Cleanup Operations', () => {
    test('should cancel all pending operations', () => {
      // Set up some pending operations
      urlStateHandler.loadRetryTimeout = setTimeout(() => {}, 1000);
      urlStateHandler.updateDebounceTimeout = setTimeout(() => {}, 1000);
      urlStateHandler.loadCancellationToken = { cancelled: false };
      urlStateHandler.isLoadingState = true;
      
      // Cancel all
      urlStateHandler.cancelPendingOperations();
      
      expect(urlStateHandler.loadRetryTimeout).toBeNull();
      expect(urlStateHandler.updateDebounceTimeout).toBeNull();
      expect(urlStateHandler.loadCancellationToken).toBeNull();
      expect(urlStateHandler.isLoadingState).toBe(false);
    });
  });
});