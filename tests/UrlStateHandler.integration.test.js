import { UrlStateHandler } from '../src/state/UrlStateHandler.js';
import { StateManager } from '../src/state/StateManager.js';
import { AudioManager } from '../src/audio/AudioManager.js';

describe('UrlStateHandler Integration Tests', () => {
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

    // Create real instances
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

    urlStateHandler = new UrlStateHandler(stateManager, uiManager);
  });

  afterEach(() => {
    window.location = originalLocation;
    window.history.replaceState = originalHistory;
    urlStateHandler.cancelPendingOperations();
  });

  describe('Rapid Navigation Scenarios', () => {
    test('should handle rapid back/forward navigation', async () => {
      const states = ['state1', 'state2', 'state3', 'state4'];
      const loadedStates = [];
      
      // Mock parseCompactState to track which states are loaded
      jest.spyOn(stateManager, 'parseCompactState').mockImplementation((state) => {
        if (states.includes(state)) {
          const mockState = { id: state, grid: [], bpm: 120 };
          loadedStates.push(state);
          return mockState;
        }
        return null;
      });

      // Simulate rapid navigation
      for (const state of states) {
        window.location.search = `?s=${state}`;
        urlStateHandler.loadFromUrl();
        // Small delay to simulate browser navigation timing
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Wait for all operations to complete
      await new Promise(resolve => setTimeout(resolve, 200));

      // Should have loaded the final state
      expect(loadedStates[loadedStates.length - 1]).toBe('state4');
      expect(urlStateHandler.isLoadingState).toBe(false);
    });

    test('should handle URL updates during state loading', async () => {
      let audioReady = false;
      audioManager.isReady.mockImplementation(() => audioReady);
      
      // Start loading with audio not ready
      window.location.search = '?s=initial-state';
      urlStateHandler.loadFromUrl(() => urlStateHandler.loadFromUrl());
      
      // Immediately trigger URL updates
      for (let i = 0; i < 5; i++) {
        urlStateHandler.updateUrl();
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      
      // Make audio ready
      audioReady = true;
      
      // Wait for operations to complete
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Should have completed without errors
      expect(urlStateHandler.isLoadingState).toBe(false);
      // URL should have been updated (debounced)
      expect(window.history.replaceState).toHaveBeenCalled();
    });
  });

  describe('Network Delay Simulation', () => {
    test('should handle slow audio initialization', async () => {
      const loadStartTime = Date.now();
      let audioInitTime = 0;
      
      // Simulate slow audio initialization
      audioManager.isReady.mockImplementation(() => {
        return Date.now() - loadStartTime > 500; // 500ms delay
      });
      
      window.location.search = '?s=test-state';
      jest.spyOn(stateManager, 'parseCompactState').mockReturnValue({ 
        grid: [], 
        bpm: 120 
      });
      
      // Track when audio becomes ready
      const checkInterval = setInterval(() => {
        if (audioManager.isReady()) {
          audioInitTime = Date.now() - loadStartTime;
          clearInterval(checkInterval);
        }
      }, 50);
      
      // Start loading with retry
      const retryFn = (count) => urlStateHandler.loadFromUrl(retryFn, 50, count);
      urlStateHandler.loadFromUrl(retryFn);
      
      // Wait for loading to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Should have eventually loaded the state
      expect(uiManager.updateFromState).toHaveBeenCalled();
      expect(audioInitTime).toBeGreaterThan(450);
      expect(urlStateHandler.isLoadingState).toBe(false);
    });

    test('should timeout after max retries with slow network', async () => {
      const consoleSpy = jest.spyOn(console, 'error');
      
      // Audio never becomes ready
      audioManager.isReady.mockReturnValue(false);
      
      window.location.search = '?s=test-state';
      
      // Load with limited retries
      const maxRetries = 5;
      const retryFn = (count) => urlStateHandler.loadFromUrl(retryFn, maxRetries, count);
      urlStateHandler.loadFromUrl(retryFn, maxRetries);
      
      // Wait for all retries
      await new Promise(resolve => setTimeout(resolve, (maxRetries + 2) * 100));
      
      // Should have logged error after max retries
      expect(consoleSpy).toHaveBeenCalledWith('Max retries reached or no retry callback provided');
      expect(urlStateHandler.isLoadingState).toBe(false);
      
      consoleSpy.mockRestore();
    });
  });

  describe('State Consistency', () => {
    test('should maintain state consistency with rapid changes', async () => {
      const appliedStates = [];
      
      // Track state applications
      jest.spyOn(stateManager, 'applyParsedState').mockImplementation((state) => {
        appliedStates.push(state);
        // Call original implementation
        Object.keys(state).forEach(key => {
          stateManager[key] = state[key];
        });
      });
      
      // Generate different valid states
      const testStates = [
        { grid: [[true]], bpm: 100, reverb: 20, delay: 10 },
        { grid: [[false]], bpm: 150, reverb: 50, delay: 30 },
        { grid: [[true]], bpm: 200, reverb: 80, delay: 60 }
      ];
      
      jest.spyOn(stateManager, 'parseCompactState')
        .mockImplementation((state) => {
          const index = parseInt(state.split('-')[1]);
          return testStates[index] || null;
        });
      
      // Rapidly change states
      for (let i = 0; i < testStates.length; i++) {
        window.location.search = `?s=state-${i}`;
        urlStateHandler.loadFromUrl();
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // Wait for operations to settle
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Final state should match the last test state
      const finalState = appliedStates[appliedStates.length - 1];
      expect(finalState).toEqual(testStates[testStates.length - 1]);
      
      // State manager should have the correct values
      expect(stateManager.bpm).toBe(200);
      expect(stateManager.reverb).toBe(80);
      expect(stateManager.delay).toBe(60);
    });

    test('should handle concurrent load and update operations', async () => {
      const operations = [];
      
      // Track all operations
      const originalLoad = urlStateHandler.loadFromUrl;
      urlStateHandler.loadFromUrl = function(...args) {
        operations.push({ type: 'load', time: Date.now() });
        return originalLoad.apply(this, args);
      };
      
      const originalUpdate = urlStateHandler.updateUrl;
      urlStateHandler.updateUrl = function(...args) {
        operations.push({ type: 'update', time: Date.now() });
        return originalUpdate.apply(this, args);
      };
      
      // Simulate concurrent operations
      window.location.search = '?s=test-state';
      
      // Start multiple operations concurrently
      const promises = [
        urlStateHandler.loadFromUrl(),
        urlStateHandler.updateUrl(),
        urlStateHandler.loadFromUrl(),
        urlStateHandler.updateUrl(),
        new Promise(resolve => {
          setTimeout(() => {
            urlStateHandler.updateUrl();
            resolve();
          }, 50);
        })
      ];
      
      await Promise.all(promises);
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Should have handled all operations without deadlock
      expect(urlStateHandler.isLoadingState).toBe(false);
      expect(urlStateHandler.loadRetryTimeout).toBeNull();
      expect(urlStateHandler.updateDebounceTimeout).toBeTruthy(); // Last update might still be pending
      
      // Verify operations were tracked
      expect(operations.length).toBeGreaterThan(0);
      expect(operations.some(op => op.type === 'load')).toBe(true);
      expect(operations.some(op => op.type === 'update')).toBe(true);
    });
  });
});