/**
 * @jest-environment jsdom
 */

import { Sequencer } from '../src/core/index.js';
import { AudioManager } from '../src/audio/index.js';
import { StateManager } from '../src/state/index.js';
import { UIManager } from '../src/ui/index.js';

describe('Sequencer - Null Context Scenarios', () => {
  let sequencer;
  let audioManager;
  let stateManager;
  let uiManager;

  beforeEach(() => {
    // Create mocks
    audioManager = {
      getContext: jest.fn(),
      isInitialized: jest.fn(),
      isReady: jest.fn(),
      resume: jest.fn().mockResolvedValue(),
      playSound: jest.fn(),
    };

    stateManager = {
      getState: jest.fn().mockReturnValue({
        kick: new Array(16).fill(false),
        snare: new Array(16).fill(false),
        hihat: new Array(16).fill(false),
      }),
    };

    uiManager = {
      setPlayButtonState: jest.fn(),
      clearPlayhead: jest.fn(),
      updatePlayheadPosition: jest.fn(),
    };

    sequencer = new Sequencer(stateManager, audioManager, uiManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
    if (sequencer.timerID) {
      clearTimeout(sequencer.timerID);
    }
    if (sequencer.animationFrameId) {
      cancelAnimationFrame(sequencer.animationFrameId);
    }
  });

  describe('Start with null context', () => {
    test('should not start when getContext returns null', async () => {
      audioManager.getContext.mockReturnValue(null);
      audioManager.isReady.mockReturnValue(true);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await sequencer.start();
      
      expect(consoleSpy).toHaveBeenCalledWith('AudioContext not initialized');
      expect(sequencer.isPlaying).toBe(false);
      expect(uiManager.setPlayButtonState).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    test('should handle context becoming null during scheduler', () => {
      const mockContext = {
        currentTime: 0,
        state: 'running',
      };

      // First call returns context, subsequent calls return null
      audioManager.getContext
        .mockReturnValueOnce(mockContext)
        .mockReturnValue(null);
      
      audioManager.isReady.mockReturnValue(true);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      jest.spyOn(console, 'log').mockImplementation(); // Suppress logs

      // Mock window.setTimeout to execute callback immediately
      const originalSetTimeout = window.setTimeout;
      window.setTimeout = jest.fn((cb) => cb());

      // Start sequencer
      sequencer.isPlaying = true;
      sequencer.nextNoteTime = 0;
      sequencer.scheduler();

      expect(consoleSpy).toHaveBeenCalledWith('AudioContext lost during scheduling');
      expect(sequencer.isPlaying).toBe(false);
      expect(uiManager.clearPlayhead).toHaveBeenCalled();

      window.setTimeout = originalSetTimeout;
      consoleSpy.mockRestore();
    });

    test('should handle context becoming null during visual update', () => {
      const mockContext = {
        currentTime: 1.5,
      };

      // Return null on getContext calls
      audioManager.getContext.mockReturnValue(null);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Start visual update
      sequencer.isPlaying = true;
      sequencer.startTime = 0;
      sequencer.updateVisuals();

      expect(consoleSpy).toHaveBeenCalledWith('AudioContext lost during visual update');
      expect(sequencer.isPlaying).toBe(false);
      expect(uiManager.clearPlayhead).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Suspended context handling', () => {
    test('should handle suspended context that fails to resume', async () => {
      const mockContext = {
        currentTime: 0,
        state: 'suspended',
      };

      audioManager.getContext.mockReturnValue(mockContext);
      audioManager.isReady.mockReturnValue(true);
      audioManager.resume.mockRejectedValue(new Error('Resume failed'));

      await expect(sequencer.start()).rejects.toThrow('Resume failed');
      expect(sequencer.isPlaying).toBe(false);
    });
  });

  describe('Edge cases', () => {
    test('should handle rapid start/stop calls with null context', async () => {
      audioManager.getContext.mockReturnValue(null);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Rapid calls
      await sequencer.start();
      sequencer.stop();
      await sequencer.start();
      sequencer.stop();

      expect(sequencer.isPlaying).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('AudioContext not initialized');

      consoleSpy.mockRestore();
    });

    test('toggle should handle null context', async () => {
      audioManager.getContext.mockReturnValue(null);
      audioManager.isReady.mockReturnValue(true);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await sequencer.toggle(); // Should try to start
      expect(consoleSpy).toHaveBeenCalledWith('AudioContext not initialized');
      expect(sequencer.isPlaying).toBe(false);

      consoleSpy.mockRestore();
    });
  });

  describe('Graceful degradation', () => {
    test('should stop cleanly when context is lost mid-playback', () => {
      const mockContext = {
        currentTime: 5.0,
        state: 'running',
      };

      audioManager.getContext.mockReturnValue(mockContext);
      audioManager.isReady.mockReturnValue(true);

      // Start playing
      sequencer.isPlaying = true;
      sequencer.timerID = setTimeout(() => {}, 1000);
      sequencer.animationFrameId = 123;

      // Simulate context loss
      audioManager.getContext.mockReturnValue(null);

      // Scheduler detects null context
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      sequencer.scheduler();

      expect(consoleSpy).toHaveBeenCalledWith('AudioContext lost during scheduling');
      expect(sequencer.isPlaying).toBe(false);
      expect(sequencer.timerID).toBe(null);
      expect(sequencer.animationFrameId).toBe(null);

      consoleSpy.mockRestore();
    });
  });
});