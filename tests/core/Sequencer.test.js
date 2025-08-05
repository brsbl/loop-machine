import { Sequencer } from '../../src/core/Sequencer.js';
import { SEQUENCER, STEP_TIME } from '../../src/constants/index.js';

// Mock dependencies
const mockStateManager = {
  getState: jest.fn(() => ({
    kick: Array(16).fill(false),
    snare: Array(16).fill(false),
    hihat: Array(16).fill(false)
  }))
};

const mockAudioManager = {
  getContext: jest.fn(),
  playSound: jest.fn(),
  isReady: jest.fn(() => true),
  resume: jest.fn()
};

const mockUiManager = {
  setPlayButtonState: jest.fn(),
  clearPlayhead: jest.fn(),
  updatePlayheadPosition: jest.fn()
};

// Mock Audio Context
const mockAudioContext = {
  currentTime: 0,
  state: 'running'
};

describe('Sequencer', () => {
  let sequencer;
  let originalSetTimeout;
  let originalClearTimeout;
  let originalRequestAnimationFrame;
  let originalCancelAnimationFrame;
  let activeTimeouts;
  let activeAnimationFrames;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    mockAudioContext.currentTime = 0;
    mockAudioContext.state = 'running';
    mockAudioManager.getContext.mockReturnValue(mockAudioContext);
    
    // Track active timers
    activeTimeouts = new Set();
    activeAnimationFrames = new Set();
    
    // Mock timer functions to track their usage
    originalSetTimeout = global.setTimeout;
    originalClearTimeout = global.clearTimeout;
    originalRequestAnimationFrame = global.requestAnimationFrame;
    originalCancelAnimationFrame = global.cancelAnimationFrame;
    
    let timeoutId = 1;
    let frameId = 1;
    
    const pendingTimeouts = new Map();
    
    global.setTimeout = jest.fn((callback, delay) => {
      const id = timeoutId++;
      activeTimeouts.add(id);
      // Store the timeout handle
      const handle = originalSetTimeout(() => {
        if (activeTimeouts.has(id)) {
          activeTimeouts.delete(id);
          pendingTimeouts.delete(id);
          callback();
        }
      }, 0);
      pendingTimeouts.set(id, handle);
      return id;
    });
    
    global.clearTimeout = jest.fn((id) => {
      activeTimeouts.delete(id);
      // Clear the actual timeout
      const handle = pendingTimeouts.get(id);
      if (handle) {
        originalClearTimeout(handle);
        pendingTimeouts.delete(id);
      }
    });
    
    const pendingFrames = new Map();
    
    global.requestAnimationFrame = jest.fn((callback) => {
      const id = frameId++;
      activeAnimationFrames.add(id);
      // Simulate the animation frame
      const handle = originalSetTimeout(() => {
        if (activeAnimationFrames.has(id)) {
          activeAnimationFrames.delete(id);
          pendingFrames.delete(id);
          callback();
        }
      }, 0);
      pendingFrames.set(id, handle);
      return id;
    });
    
    global.cancelAnimationFrame = jest.fn((id) => {
      activeAnimationFrames.delete(id);
      // Clear the actual timeout
      const handle = pendingFrames.get(id);
      if (handle) {
        originalClearTimeout(handle);
        pendingFrames.delete(id);
      }
    });
    
    // Create new sequencer instance
    sequencer = new Sequencer(mockStateManager, mockAudioManager, mockUiManager);
  });

  afterEach(() => {
    // Restore original functions
    global.setTimeout = originalSetTimeout;
    global.clearTimeout = originalClearTimeout;
    global.requestAnimationFrame = originalRequestAnimationFrame;
    global.cancelAnimationFrame = originalCancelAnimationFrame;
  });

  describe('Timer cleanup', () => {
    test('should clear all timers when stopped', async () => {
      await sequencer.start();
      
      // Wait for timers to be created
      await new Promise(resolve => originalSetTimeout(resolve, 50));
      
      // Verify timers are active
      expect(activeTimeouts.size).toBeGreaterThan(0);
      expect(activeAnimationFrames.size).toBeGreaterThan(0);
      
      // Stop the sequencer
      sequencer.stop();
      
      // Verify all timers are cleared
      expect(activeTimeouts.size).toBe(0);
      expect(activeAnimationFrames.size).toBe(0);
      expect(sequencer.activeTimers.size).toBe(0);
      expect(sequencer.activeAnimationFrames.size).toBe(0);
    });

    test('should not create new timers after stop', async () => {
      await sequencer.start();
      sequencer.stop();
      
      // Clear the mock calls
      global.setTimeout.mockClear();
      global.requestAnimationFrame.mockClear();
      
      // Wait to see if any timers are created
      await new Promise(resolve => originalSetTimeout(resolve, 100));
      
      // Verify no new timers were created
      expect(global.setTimeout).not.toHaveBeenCalled();
      expect(global.requestAnimationFrame).not.toHaveBeenCalled();
    });

    test('should handle rapid play/stop cycles without leaking timers', async () => {
      for (let i = 0; i < 10; i++) {
        await sequencer.start();
        await new Promise(resolve => originalSetTimeout(resolve, 10));
        sequencer.stop();
      }
      
      // Verify no timers are left active
      expect(activeTimeouts.size).toBe(0);
      expect(activeAnimationFrames.size).toBe(0);
      expect(sequencer.activeTimers.size).toBe(0);
      expect(sequencer.activeAnimationFrames.size).toBe(0);
    });

    test('should not execute scheduler callback if stopped before timeout', async () => {
      await sequencer.start();
      
      // Mock the scheduler method to track calls
      const schedulerSpy = jest.spyOn(sequencer, 'scheduler');
      
      // Stop immediately
      sequencer.stop();
      
      // Clear previous calls
      schedulerSpy.mockClear();
      
      // Wait for any pending timeouts
      await new Promise(resolve => originalSetTimeout(resolve, SEQUENCER.SCHEDULER_INTERVAL + 50));
      
      // Verify scheduler was not called after stop
      expect(schedulerSpy).not.toHaveBeenCalled();
    });

    test('should not execute updateVisuals callback if stopped before animation frame', async () => {
      await sequencer.start();
      
      // Mock the updateVisuals method to track calls
      const updateVisualsSpy = jest.spyOn(sequencer, 'updateVisuals');
      
      // Stop immediately
      sequencer.stop();
      
      // Clear previous calls
      updateVisualsSpy.mockClear();
      
      // Wait for any pending animation frames
      await new Promise(resolve => originalSetTimeout(resolve, 50));
      
      // Verify updateVisuals was not called after stop
      expect(updateVisualsSpy).not.toHaveBeenCalled();
    });

    test('should properly track and clean up multiple concurrent timers', async () => {
      // Start the sequencer
      await sequencer.start();
      
      // Let it run for a bit to create multiple timers
      await new Promise(resolve => originalSetTimeout(resolve, SEQUENCER.SCHEDULER_INTERVAL * 3));
      
      // Check that we're tracking timers
      expect(sequencer.activeTimers.size).toBeGreaterThan(0);
      expect(sequencer.activeAnimationFrames.size).toBeGreaterThan(0);
      
      // Stop and verify cleanup
      sequencer.stop();
      
      expect(sequencer.activeTimers.size).toBe(0);
      expect(sequencer.activeAnimationFrames.size).toBe(0);
      expect(activeTimeouts.size).toBe(0);
      expect(activeAnimationFrames.size).toBe(0);
    });

    test('should handle errors in scheduler without leaking timers', async () => {
      // Make getContext throw an error after start
      let callCount = 0;
      mockAudioManager.getContext.mockImplementation(() => {
        callCount++;
        if (callCount > 2) {
          throw new Error('Audio context error');
        }
        return mockAudioContext;
      });
      
      await sequencer.start();
      
      // Wait for error to occur
      await new Promise(resolve => originalSetTimeout(resolve, 100));
      
      // Verify sequencer stopped and cleaned up
      expect(sequencer.isPlaying).toBe(false);
      expect(sequencer.activeTimers.size).toBe(0);
      expect(sequencer.activeAnimationFrames.size).toBe(0);
    });

    test('should handle errors in updateVisuals without leaking timers', async () => {
      // Make updatePlayheadPosition throw an error
      mockUiManager.updatePlayheadPosition.mockImplementation(() => {
        throw new Error('UI update error');
      });
      
      await sequencer.start();
      
      // Wait for error to occur
      await new Promise(resolve => originalSetTimeout(resolve, 50));
      
      // Verify sequencer stopped and cleaned up
      expect(sequencer.isPlaying).toBe(false);
      expect(sequencer.activeTimers.size).toBe(0);
      expect(sequencer.activeAnimationFrames.size).toBe(0);
    });
  });

  describe('Edge cases', () => {
    test('should handle stop called multiple times', () => {
      sequencer.start();
      sequencer.stop();
      sequencer.stop();
      sequencer.stop();
      
      expect(sequencer.isPlaying).toBe(false);
      expect(sequencer.activeTimers.size).toBe(0);
      expect(sequencer.activeAnimationFrames.size).toBe(0);
    });

    test('should not start if audio context is null', async () => {
      mockAudioManager.getContext.mockReturnValue(null);
      
      await sequencer.start();
      
      expect(sequencer.isPlaying).toBe(false);
      expect(global.setTimeout).not.toHaveBeenCalled();
      expect(global.requestAnimationFrame).not.toHaveBeenCalled();
    });

    test('should handle toggle during rapid calls', async () => {
      // Rapidly toggle
      sequencer.toggle();
      sequencer.toggle();
      sequencer.toggle();
      sequencer.toggle();
      
      // Should end in stopped state (4 toggles)
      expect(sequencer.isPlaying).toBe(false);
      
      // Wait and verify no leaked timers
      await new Promise(resolve => originalSetTimeout(resolve, 100));
      
      expect(activeTimeouts.size).toBe(0);
      expect(activeAnimationFrames.size).toBe(0);
    });
  });
});