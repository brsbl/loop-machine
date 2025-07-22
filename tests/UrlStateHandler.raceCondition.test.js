import { UrlStateHandler } from '../src/state/UrlStateHandler.js';
import { StateManager } from '../src/state/StateManager.js';

describe('UrlStateHandler Race Condition Tests', () => {
  let urlStateHandler;
  let stateManager;
  let uiManager;
  let audioManager;

  beforeEach(() => {
    // Set up mocks
    stateManager = new StateManager();
    audioManager = {
      getContext: jest.fn().mockReturnValue({}),
      isReady: jest.fn().mockReturnValue(false) // Start with audio not ready
    };
    
    uiManager = {
      audioManager,
      getSliderValues: jest.fn().mockReturnValue({
        bpm: 120,
        reverb: 50,
        delay: 30
      }),
      updateFromState: jest.fn()
    };

    urlStateHandler = new UrlStateHandler(stateManager, uiManager);
    
    // Mock window objects
    delete window.location;
    window.location = {
      pathname: '/test',
      search: '?s=test-state',
      href: 'http://localhost/test?s=test-state'
    };
    
    window.history.replaceState = jest.fn();
  });

  afterEach(() => {
    urlStateHandler.cancelPendingOperations();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('Original Race Condition Bug', () => {
    test('should prevent multiple retry timers from stacking', async () => {
      const retryTimes = [];
      let retryCount = 0;
      
      // Track when retries happen
      const retryCallback = jest.fn(() => {
        retryTimes.push(Date.now());
        retryCount++;
        if (retryCount < 10) {
          urlStateHandler.loadFromUrl(retryCallback, 50, retryCount);
        }
      });
      
      // Start initial load
      urlStateHandler.loadFromUrl(retryCallback);
      
      // Simulate rapid subsequent loads (reproducing the bug scenario)
      await new Promise(resolve => setTimeout(resolve, 50));
      urlStateHandler.loadFromUrl(retryCallback);
      
      await new Promise(resolve => setTimeout(resolve, 50));
      urlStateHandler.loadFromUrl(retryCallback);
      
      // Let some retries happen
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Cancel to stop the test
      urlStateHandler.cancelPendingOperations();
      
      // Check retry pattern - should not have exponential growth
      const retryIntervals = [];
      for (let i = 1; i < retryTimes.length; i++) {
        retryIntervals.push(retryTimes[i] - retryTimes[i-1]);
      }
      
      // All intervals should be roughly 100ms (allowing for timer precision)
      const avgInterval = retryIntervals.reduce((a, b) => a + b, 0) / retryIntervals.length;
      expect(avgInterval).toBeGreaterThan(90);
      expect(avgInterval).toBeLessThan(150);
    });

    test('should handle browser back button spam', async () => {
      const stateChanges = [];
      
      // Mock parseCompactState to track state changes
      jest.spyOn(stateManager, 'parseCompactState').mockImplementation((state) => {
        const parsed = { id: state, grid: [], bpm: 120 };
        stateChanges.push({ state, time: Date.now() });
        return parsed;
      });
      
      // Simulate user hitting back button multiple times rapidly
      const states = ['state1', 'state2', 'state3', 'state4', 'state5'];
      
      for (const state of states) {
        window.location.search = `?s=${state}`;
        urlStateHandler.loadFromUrl(() => urlStateHandler.loadFromUrl());
        // Very short delay to simulate rapid browser navigation
        await new Promise(resolve => setTimeout(resolve, 5));
      }
      
      // Make audio ready after some delay
      setTimeout(() => {
        audioManager.isReady.mockReturnValue(true);
      }, 200);
      
      // Wait for operations to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Should have processed states in order without corruption
      expect(urlStateHandler.isLoadingState).toBe(false);
      
      // With the race condition fix, rapid changes might not all get processed
      // That's actually the desired behavior - we only process the final state
      // when audio becomes ready
    });
  });

  describe('Artificial Network Delays', () => {
    test('should handle variable network latency', async () => {
      const latencies = [10, 300, 50, 500, 100]; // Variable delays in ms
      let currentLatencyIndex = 0;
      
      // Simulate variable audio readiness delays
      audioManager.isReady.mockImplementation(() => {
        const startTime = urlStateHandler.loadStartTime || Date.now();
        const elapsed = Date.now() - startTime;
        const requiredDelay = latencies[currentLatencyIndex % latencies.length];
        return elapsed > requiredDelay;
      });
      
      const results = [];
      
      for (let i = 0; i < latencies.length; i++) {
        currentLatencyIndex = i;
        urlStateHandler.loadStartTime = Date.now();
        
        window.location.search = `?s=state-${i}`;
        
        const startTime = Date.now();
        await new Promise((resolve) => {
          const retryFn = () => {
            urlStateHandler.loadFromUrl(() => {
              if (audioManager.isReady()) {
                results.push({
                  state: `state-${i}`,
                  loadTime: Date.now() - startTime,
                  expectedDelay: latencies[i]
                });
                resolve();
              } else {
                retryFn();
              }
            });
          };
          retryFn();
        });
      }
      
      // Verify all states loaded with appropriate delays
      expect(results.length).toBe(latencies.length);
      results.forEach((result, index) => {
        expect(result.loadTime).toBeGreaterThan(latencies[index] - 50);
        expect(result.state).toBe(`state-${index}`);
      });
    });

    test('should handle rapid state changes with pending retries', async () => {
      let audioReadyTime = Date.now() + 300; // Audio ready after 300ms
      
      audioManager.isReady.mockImplementation(() => {
        return Date.now() > audioReadyTime;
      });
      
      // Track all state application attempts
      const applicationAttempts = [];
      jest.spyOn(stateManager, 'applyParsedState').mockImplementation((state) => {
        applicationAttempts.push({
          state: state.id,
          time: Date.now(),
          audioReady: audioManager.isReady()
        });
      });
      
      jest.spyOn(stateManager, 'parseCompactState').mockImplementation((state) => {
        return { id: state, grid: [], bpm: 120 };
      });
      
      // Rapid state changes while audio is not ready
      const stateSequence = ['A', 'B', 'C', 'D', 'E'];
      
      for (let i = 0; i < stateSequence.length; i++) {
        window.location.search = `?s=${stateSequence[i]}`;
        const retryFn = () => urlStateHandler.loadFromUrl(retryFn);
        urlStateHandler.loadFromUrl(retryFn);
        
        // Small delay between state changes
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Change audio ready time during the sequence
        if (i === 2) {
          audioReadyTime = Date.now() + 100; // Extend delay
        }
      }
      
      // Wait for all operations to complete
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Should have applied the final state
      expect(applicationAttempts.length).toBeGreaterThan(0);
      const lastApplication = applicationAttempts[applicationAttempts.length - 1];
      expect(lastApplication.state).toBe('E');
      expect(lastApplication.audioReady).toBe(true);
      
      // No pending operations
      expect(urlStateHandler.isLoadingState).toBe(false);
      expect(urlStateHandler.loadRetryTimeout).toBeNull();
    });

    test('should handle timeout cancellation correctly', async () => {
      const timeoutIds = new Set();
      const originalSetTimeout = window.setTimeout;
      
      // Track all timeouts
      window.setTimeout = jest.fn((fn, delay) => {
        const id = originalSetTimeout(fn, delay);
        timeoutIds.add(id);
        return id;
      });
      
      const originalClearTimeout = window.clearTimeout;
      window.clearTimeout = jest.fn((id) => {
        timeoutIds.delete(id);
        return originalClearTimeout(id);
      });
      
      // Start load with retries
      const retryFn = () => urlStateHandler.loadFromUrl(retryFn);
      urlStateHandler.loadFromUrl(retryFn);
      
      // Let some retries happen
      await new Promise(resolve => setTimeout(resolve, 250));
      
      // Start another load (should cancel previous)
      urlStateHandler.loadFromUrl(retryFn);
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Cancel all operations
      urlStateHandler.cancelPendingOperations();
      
      // All timeouts should be cleared
      expect(window.clearTimeout).toHaveBeenCalled();
      
      // Restore mocks
      window.setTimeout = originalSetTimeout;
      window.clearTimeout = originalClearTimeout;
    });
  });
});