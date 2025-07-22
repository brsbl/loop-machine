/**
 * @jest-environment jsdom
 */

import { AudioManager } from '../src/audio/index.js';
import { INSTRUMENTS } from '../src/constants/index.js';

describe('AudioManager - Null Context Scenarios', () => {
  let audioManager;
  let originalAudioContext;

  beforeEach(() => {
    audioManager = new AudioManager();
    originalAudioContext = global.AudioContext;
  });

  afterEach(() => {
    global.AudioContext = originalAudioContext;
    jest.clearAllMocks();
  });

  describe('Initialization Failures', () => {
    test('should handle AudioContext creation failure', () => {
      // Mock AudioContext to throw an error
      global.AudioContext = jest.fn().mockImplementation(() => {
        throw new Error('AudioContext not supported');
      });

      const result = audioManager.init();
      
      expect(result).toBe(false);
      expect(audioManager.isInitialized()).toBe(false);
      expect(audioManager.getContext()).toBe(null);
    });

    test('should handle missing AudioContext API', () => {
      // Remove AudioContext from global
      delete global.AudioContext;
      delete global.webkitAudioContext;

      const result = audioManager.init();
      
      expect(result).toBe(false);
      expect(audioManager.isInitialized()).toBe(false);
    });
  });

  describe('Operations with Null Context', () => {
    test('isInitialized should return false when context is null', () => {
      expect(audioManager.isInitialized()).toBe(false);
    });

    test('isReady should return false when context is null', () => {
      expect(audioManager.isReady()).toBe(false);
    });

    test('loadSounds should throw when context is not initialized', async () => {
      await expect(audioManager.loadSounds()).rejects.toThrow(
        'AudioContext not initialized. Call init() first.'
      );
    });

    test('setupEffectNodes should handle null context gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Should not throw
      expect(() => {
        audioManager.setupEffectNodes('kick');
      }).not.toThrow();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Cannot setup effect nodes: AudioContext not initialized'
      );
      expect(audioManager.effectNodes.kick).toBeUndefined();
      
      consoleSpy.mockRestore();
    });

    test('updateEffect should handle null context gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Should not throw
      expect(() => {
        audioManager.updateEffect('kick', 'reverb', 5);
      }).not.toThrow();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Cannot update effect: AudioContext not initialized'
      );
      
      consoleSpy.mockRestore();
    });

    test('playSound should handle null context gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Should not throw
      expect(() => {
        audioManager.playSound('kick', 1.0);
      }).not.toThrow();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Cannot play sound: AudioContext not initialized'
      );
      
      consoleSpy.mockRestore();
    });

    test('resume should handle null context gracefully', async () => {
      // Should not throw
      await expect(audioManager.resume()).resolves.not.toThrow();
    });
  });

  describe('Context State Transitions', () => {
    test('should handle context becoming null after initialization', async () => {
      // Setup mock AudioContext
      const mockContext = {
        createGain: jest.fn(() => ({
          connect: jest.fn(),
          gain: { value: 0, setValueAtTime: jest.fn() },
        })),
        createDelay: jest.fn(() => ({
          connect: jest.fn(),
          delayTime: { value: 0, setValueAtTime: jest.fn() },
        })),
        createBufferSource: jest.fn(() => ({
          connect: jest.fn(),
          start: jest.fn(),
          buffer: null,
        })),
        decodeAudioData: jest.fn().mockResolvedValue({ duration: 1.0 }),
        currentTime: 0,
        destination: {},
        state: 'running',
        resume: jest.fn().mockResolvedValue(),
      };

      global.AudioContext = jest.fn().mockImplementation(() => mockContext);
      global.fetch = jest.fn().mockResolvedValue({
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      });

      // Initialize successfully
      expect(audioManager.init()).toBe(true);
      expect(audioManager.isInitialized()).toBe(true);

      // Load sounds successfully
      await audioManager.loadSounds();
      expect(audioManager.isReady()).toBe(true);

      // Simulate context becoming null (e.g., browser issue)
      audioManager.audioContext = null;

      // Operations should now handle null context gracefully
      expect(audioManager.isInitialized()).toBe(false);
      expect(audioManager.isReady()).toBe(false);
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      audioManager.playSound('kick', 1.0);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Cannot play sound: AudioContext not initialized'
      );
      consoleSpy.mockRestore();
    });
  });

  describe('Browser Compatibility', () => {
    test('should handle webkit prefix fallback failure', () => {
      // Remove standard AudioContext
      delete global.AudioContext;
      
      // Mock webkitAudioContext to also fail
      global.webkitAudioContext = jest.fn().mockImplementation(() => {
        throw new Error('webkitAudioContext not supported');
      });

      const result = audioManager.init();
      
      expect(result).toBe(false);
      expect(audioManager.isInitialized()).toBe(false);
    });
  });
});