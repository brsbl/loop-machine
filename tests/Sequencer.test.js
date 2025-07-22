/**
 * @jest-environment jsdom
 */

import { Sequencer } from '../src/core/index.js';
import { SEQUENCER, STEP_TIME, INSTRUMENTS } from '../src/constants/index.js';

describe('Sequencer', () => {
  let sequencer;
  let mockStateManager;
  let mockAudioManager;
  let mockUIManager;
  let mockAudioContext;

  beforeEach(() => {
    // Mock AudioContext
    mockAudioContext = {
      currentTime: 0,
      state: 'running',
      resume: jest.fn().mockResolvedValue(),
    };

    // Mock StateManager
    mockStateManager = {
      getState: jest.fn().mockReturnValue({
        hihat: new Array(16).fill(false),
        snare: new Array(16).fill(false),
        kick: new Array(16).fill(false),
      }),
    };

    // Mock AudioManager
    mockAudioManager = {
      getContext: jest.fn().mockReturnValue(mockAudioContext),
      isReady: jest.fn().mockReturnValue(true),
      resume: jest.fn().mockResolvedValue(),
      playSound: jest.fn(),
    };

    // Mock UIManager
    mockUIManager = {
      setPlayButtonState: jest.fn(),
      clearPlayhead: jest.fn(),
      updatePlayheadPosition: jest.fn(),
    };

    // Create Sequencer instance
    sequencer = new Sequencer(mockStateManager, mockAudioManager, mockUIManager);

    // Mock timers
    jest.useFakeTimers();
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => setTimeout(cb, 0));
    jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(id => clearTimeout(id));
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('Constructor', () => {
    test('should initialize with correct default values', () => {
      expect(sequencer.stateManager).toBe(mockStateManager);
      expect(sequencer.audioManager).toBe(mockAudioManager);
      expect(sequencer.uiManager).toBe(mockUIManager);
      expect(sequencer.currentStep).toBe(0);
      expect(sequencer.isPlaying).toBe(false);
      expect(sequencer.nextNoteTime).toBe(0.0);
      expect(sequencer.timerID).toBe(null);
      expect(sequencer.startTime).toBe(null);
      expect(sequencer.animationFrameId).toBe(null);
    });
  });

  describe('Start', () => {
    test('should start the sequencer successfully', async () => {
      await sequencer.start();

      expect(sequencer.isPlaying).toBe(true);
      expect(mockUIManager.setPlayButtonState).toHaveBeenCalledWith(true);
      expect(sequencer.currentStep).toBe(0);
      expect(sequencer.startTime).toBe(0);
      expect(sequencer.nextNoteTime).toBe(0);
    });

    test('should not start if already playing', async () => {
      sequencer.isPlaying = true;
      await sequencer.start();

      expect(mockUIManager.setPlayButtonState).not.toHaveBeenCalled();
    });

    test('should handle missing AudioContext', async () => {
      mockAudioManager.getContext.mockReturnValue(null);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await sequencer.start();

      expect(consoleSpy).toHaveBeenCalledWith('AudioContext not initialized');
      expect(sequencer.isPlaying).toBe(false);
      consoleSpy.mockRestore();
    });

    test('should handle audio buffers not ready', async () => {
      mockAudioManager.isReady.mockReturnValue(false);
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await sequencer.start();

      expect(consoleSpy).toHaveBeenCalledWith('Audio buffers not loaded yet');
      expect(sequencer.isPlaying).toBe(false);
      consoleSpy.mockRestore();
    });

    test('should resume suspended audio context', async () => {
      mockAudioContext.state = 'suspended';
      await sequencer.start();

      expect(mockAudioManager.resume).toHaveBeenCalled();
    });
  });

  describe('Stop', () => {
    test('should stop the sequencer', () => {
      sequencer.isPlaying = true;
      sequencer.timerID = setTimeout(() => {}, 100);
      sequencer.animationFrameId = 123;

      sequencer.stop();

      expect(sequencer.isPlaying).toBe(false);
      expect(mockUIManager.setPlayButtonState).toHaveBeenCalledWith(false);
      expect(mockUIManager.clearPlayhead).toHaveBeenCalled();
      expect(sequencer.timerID).toBe(null);
      expect(sequencer.animationFrameId).toBe(null);
    });

    test('should not stop if not playing', () => {
      sequencer.isPlaying = false;
      sequencer.stop();

      expect(mockUIManager.setPlayButtonState).not.toHaveBeenCalled();
    });
  });

  describe('Toggle', () => {
    test('should start when not playing', async () => {
      sequencer.isPlaying = false;
      await sequencer.toggle();

      expect(sequencer.isPlaying).toBe(true);
    });

    test('should stop when playing', async () => {
      sequencer.isPlaying = true;
      await sequencer.toggle();

      expect(sequencer.isPlaying).toBe(false);
    });
  });

  describe('Scheduler', () => {
    test('should schedule notes for active steps', () => {
      const mockState = {
        hihat: [true, false, true, false, false, false, false, false, false, false, false, false, false, false, false, false],
        snare: [false, false, false, false, true, false, false, false, false, false, false, false, false, false, false, false],
        kick: [true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false],
      };
      mockStateManager.getState.mockReturnValue(mockState);

      sequencer.isPlaying = true;
      sequencer.currentStep = 0;
      sequencer.nextNoteTime = 0;
      mockAudioContext.currentTime = 0;

      sequencer.scheduler();

      // Should schedule hihat and kick for step 0
      expect(mockAudioManager.playSound).toHaveBeenCalledWith('hihat', 0);
      expect(mockAudioManager.playSound).toHaveBeenCalledWith('kick', 0);
      expect(mockAudioManager.playSound).not.toHaveBeenCalledWith('snare', 0);

      // Timer should be set for next check
      expect(setTimeout).toHaveBeenCalledWith(
        expect.any(Function),
        SEQUENCER.SCHEDULER_INTERVAL
      );
    });

    test('should advance through multiple steps if needed', () => {
      mockStateManager.getState.mockReturnValue({
        hihat: new Array(16).fill(true), // All steps active
        snare: new Array(16).fill(false),
        kick: new Array(16).fill(false),
      });

      sequencer.isPlaying = true;
      sequencer.currentStep = 0;
      sequencer.nextNoteTime = 0;
      mockAudioContext.currentTime = STEP_TIME * 3; // 3 steps ahead

      sequencer.scheduler();

      // Should have scheduled multiple steps
      const playSoundCalls = mockAudioManager.playSound.mock.calls;
      expect(playSoundCalls.length).toBeGreaterThan(3);
    });

    test('should wrap around at step 16', () => {
      mockStateManager.getState.mockReturnValue({
        hihat: new Array(16).fill(false),
        snare: new Array(16).fill(false),
        kick: new Array(16).fill(false),
      });

      sequencer.isPlaying = true;
      sequencer.currentStep = 15;
      sequencer.nextNoteTime = 0;
      mockAudioContext.currentTime = 0;

      sequencer.scheduler();

      // Should wrap to step 0
      expect(sequencer.currentStep).toBe(0);
    });
  });

  describe('Update Visuals', () => {
    test('should update playhead position', () => {
      sequencer.isPlaying = true;
      sequencer.startTime = 0;
      mockAudioContext.currentTime = STEP_TIME * 2.5; // Between step 2 and 3

      sequencer.updateVisuals();

      expect(mockUIManager.updatePlayheadPosition).toHaveBeenCalledWith(2);
      
      // Should request next animation frame
      expect(requestAnimationFrame).toHaveBeenCalled();
    });

    test('should not update if not playing', () => {
      sequencer.isPlaying = false;
      sequencer.updateVisuals();

      expect(mockUIManager.updatePlayheadPosition).not.toHaveBeenCalled();
      expect(requestAnimationFrame).not.toHaveBeenCalled();
    });

    test('should handle loop wrapping correctly', () => {
      sequencer.isPlaying = true;
      sequencer.startTime = 0;
      // Time for 2 full loops + 3 steps
      mockAudioContext.currentTime = (SEQUENCER.STEPS * STEP_TIME * 2) + (STEP_TIME * 3.5);

      sequencer.updateVisuals();

      expect(mockUIManager.updatePlayheadPosition).toHaveBeenCalledWith(3);
    });
  });

  describe('Get Is Playing', () => {
    test('should return current playing state', () => {
      sequencer.isPlaying = false;
      expect(sequencer.getIsPlaying()).toBe(false);

      sequencer.isPlaying = true;
      expect(sequencer.getIsPlaying()).toBe(true);
    });
  });

  describe('Integration', () => {
    test('should handle full play/stop cycle', async () => {
      const mockState = {
        hihat: [true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
        snare: [false, false, false, false, true, false, false, false, false, false, false, false, false, false, false, false],
        kick: [true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false],
      };
      mockStateManager.getState.mockReturnValue(mockState);

      // Start sequencer
      await sequencer.start();
      expect(sequencer.isPlaying).toBe(true);

      // Let scheduler run
      jest.advanceTimersByTime(SEQUENCER.SCHEDULER_INTERVAL);

      // Should have scheduled some sounds
      expect(mockAudioManager.playSound).toHaveBeenCalled();

      // Stop sequencer
      sequencer.stop();
      expect(sequencer.isPlaying).toBe(false);
      expect(mockUIManager.clearPlayhead).toHaveBeenCalled();
    });
  });
});