/**
 * @jest-environment jsdom
 */

import { AudioManager } from './AudioManager.js';
import { CONFIG } from './config.js';

// Mock AudioContext
global.AudioContext = jest.fn().mockImplementation(() => ({
  createGain: jest.fn(() => ({
    connect: jest.fn(),
    gain: { value: 0, setValueAtTime: jest.fn() },
  })),
  createDelay: jest.fn(() => ({
    connect: jest.fn(),
    delayTime: { value: 0, setValueAtTime: jest.fn() },
  })),
  decodeAudioData: jest.fn(),
  createBufferSource: jest.fn(() => ({
    connect: jest.fn(),
    start: jest.fn(),
    buffer: null,
  })),
  currentTime: 0,
  destination: {},
  state: 'running',
  resume: jest.fn().mockResolvedValue(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('AudioManager', () => {
  let audioManager;

  beforeEach(() => {
    audioManager = new AudioManager();
    jest.clearAllMocks();
    
    // Mock fetch responses
    fetch.mockResolvedValue({
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    });
  });

  describe('Initialization', () => {
    test('should create audio context on init', () => {
      const result = audioManager.init();
      
      expect(result).toBe(true);
      expect(audioManager.audioContext).toBeDefined();
      expect(global.AudioContext).toHaveBeenCalled();
    });

    test('should not recreate audio context if already exists', () => {
      audioManager.init();
      const firstContext = audioManager.audioContext;
      
      const result = audioManager.init();
      
      expect(result).toBe(false);
      expect(audioManager.audioContext).toBe(firstContext);
      expect(global.AudioContext).toHaveBeenCalledTimes(1);
    });
  });

  describe('Audio Loading', () => {
    beforeEach(() => {
      audioManager.init();
    });

    test('should load all instrument sounds', async () => {
      const mockAudioBuffer = { duration: 1.0 };
      audioManager.audioContext.decodeAudioData.mockResolvedValue(mockAudioBuffer);
      
      await audioManager.loadSounds();
      
      expect(fetch).toHaveBeenCalledTimes(CONFIG.INSTRUMENTS.length);
      CONFIG.INSTRUMENTS.forEach(instrument => {
        expect(fetch).toHaveBeenCalledWith(instrument.path);
        expect(audioManager.audioBuffers[instrument.id]).toBe(mockAudioBuffer);
      });
    });

    test('should setup effect nodes for each instrument', async () => {
      const mockAudioBuffer = { duration: 1.0 };
      audioManager.audioContext.decodeAudioData.mockResolvedValue(mockAudioBuffer);
      
      await audioManager.loadSounds();
      
      CONFIG.INSTRUMENTS.forEach(instrument => {
        expect(audioManager.effectNodes[instrument.id]).toBeDefined();
        expect(audioManager.effectNodes[instrument.id].mainGain).toBeDefined();
        expect(audioManager.effectNodes[instrument.id].reverb).toBeDefined();
        expect(audioManager.effectNodes[instrument.id].delay).toBeDefined();
      });
    });

    test('should handle audio loading failures', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));
      
      await expect(audioManager.loadSounds()).rejects.toThrow('Network error');
    });

    test('should report ready state correctly', async () => {
      expect(audioManager.isReady()).toBe(false);
      
      const mockAudioBuffer = { duration: 1.0 };
      audioManager.audioContext.decodeAudioData.mockResolvedValue(mockAudioBuffer);
      
      await audioManager.loadSounds();
      
      expect(audioManager.isReady()).toBe(true);
    });
  });

  describe('Effect Updates', () => {
    beforeEach(async () => {
      audioManager.init();
      const mockAudioBuffer = { duration: 1.0 };
      audioManager.audioContext.decodeAudioData.mockResolvedValue(mockAudioBuffer);
      await audioManager.loadSounds();
    });

    test('should update reverb effect correctly', () => {
      audioManager.updateEffect('kick', 'reverb', 5);
      
      const reverbNode = audioManager.effectNodes.kick.reverb;
      expect(reverbNode.gain.setValueAtTime).toHaveBeenCalledWith(
        0.5, // 5/10 * MAX_AMOUNT(1.0)
        audioManager.audioContext.currentTime
      );
    });

    test('should update delay effect correctly', () => {
      audioManager.updateEffect('snare', 'delay', 7);
      
      const nodes = audioManager.effectNodes.snare;
      expect(nodes.delay.delayTime.setValueAtTime).toHaveBeenCalledWith(
        0.35, // 7/10 * MAX_TIME(0.5)
        audioManager.audioContext.currentTime
      );
      expect(nodes.delayFeedback.gain.setValueAtTime).toHaveBeenCalledWith(
        0.49, // 7/10 * MAX_FEEDBACK(0.7)
        audioManager.audioContext.currentTime
      );
      expect(nodes.delayWet.gain.setValueAtTime).toHaveBeenCalledWith(
        0.35, // 7/10 * MAX_WET(0.5)
        audioManager.audioContext.currentTime
      );
    });

    test('should handle invalid instrument ID gracefully', () => {
      // Should not throw
      expect(() => {
        audioManager.updateEffect('invalid', 'reverb', 5);
      }).not.toThrow();
    });
  });

  describe('Sound Playback', () => {
    beforeEach(async () => {
      audioManager.init();
      const mockAudioBuffer = { duration: 1.0 };
      audioManager.audioContext.decodeAudioData.mockResolvedValue(mockAudioBuffer);
      await audioManager.loadSounds();
    });

    test('should play sound at specified time', () => {
      const mockSource = audioManager.audioContext.createBufferSource();
      
      audioManager.playSound('kick', 1.5);
      
      expect(audioManager.audioContext.createBufferSource).toHaveBeenCalled();
      expect(mockSource.buffer).toBe(audioManager.audioBuffers.kick);
      expect(mockSource.connect).toHaveBeenCalledWith(
        audioManager.effectNodes.kick.mainGain
      );
      expect(mockSource.start).toHaveBeenCalledWith(1.5);
    });

    test('should handle missing buffer gracefully', () => {
      delete audioManager.audioBuffers.kick;
      
      // Should not throw
      expect(() => {
        audioManager.playSound('kick', 1.0);
      }).not.toThrow();
    });
  });

  describe('Audio Context Management', () => {
    test('should resume suspended audio context', async () => {
      audioManager.init();
      audioManager.audioContext.state = 'suspended';
      
      await audioManager.resume();
      
      expect(audioManager.audioContext.resume).toHaveBeenCalled();
    });

    test('should not resume if context is not suspended', async () => {
      audioManager.init();
      audioManager.audioContext.state = 'running';
      
      await audioManager.resume();
      
      expect(audioManager.audioContext.resume).not.toHaveBeenCalled();
    });
  });
});