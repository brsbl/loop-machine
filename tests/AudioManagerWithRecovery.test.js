import { AudioManager } from '../src/audio/AudioManager.js';
import { INSTRUMENTS } from '../src/constants/index.js';

// Mock fetch
global.fetch = jest.fn();

// Mock Audio Context and nodes
const mockAudioNode = {
  connect: jest.fn(),
  gain: { value: 0, setValueAtTime: jest.fn() },
  delayTime: { value: 0, setValueAtTime: jest.fn() }
};

const createMockAudioContext = () => ({
  createGain: jest.fn(() => ({ ...mockAudioNode })),
  createDelay: jest.fn(() => ({ ...mockAudioNode })),
  decodeAudioData: jest.fn(),
  destination: {},
  currentTime: 0
});

global.AudioContext = jest.fn(() => createMockAudioContext());

describe('AudioManager with Error Recovery', () => {
  let audioManager;
  let mockContext;

  beforeEach(() => {
    audioManager = new AudioManager();
    fetch.mockClear();
    AudioContext.mockClear();
  });

  describe('initialization', () => {
    it('should initialize with loader and fallback generator', () => {
      audioManager.init();
      
      expect(audioManager.audioContext).toBeDefined();
      expect(audioManager.loader).toBeDefined();
      expect(audioManager.fallbackGenerator).toBeDefined();
    });
  });

  describe('loadSounds with recovery', () => {
    beforeEach(() => {
      audioManager.init();
      mockContext = audioManager.audioContext;
    });

    it('should handle successful loading', async () => {
      const mockBuffer = { duration: 1.0 };
      mockContext.decodeAudioData.mockResolvedValue(mockBuffer);
      fetch.mockResolvedValue({
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8))
      });

      const onProgress = jest.fn();
      await audioManager.loadSounds(onProgress);

      expect(audioManager.isPartiallyLoaded).toBe(false);
      expect(audioManager.loadingErrors).toHaveLength(0);
      expect(Object.keys(audioManager.audioBuffers)).toHaveLength(INSTRUMENTS.length);
      expect(onProgress).toHaveBeenCalledWith(100);
    });

    it('should handle partial loading with fallback sounds', async () => {
      // First sample fails, others succeed
      fetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue({
          ok: true,
          arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8))
        });
      
      mockContext.decodeAudioData.mockResolvedValue({ duration: 1.0 });
      
      // Mock fallback sound generation
      audioManager.fallbackGenerator = {
        generateFallbackSounds: jest.fn().mockResolvedValue({
          hihat: { duration: 0.05 },
          snare: { duration: 0.15 },
          kick: { duration: 0.5 }
        })
      };

      await audioManager.loadSounds();

      expect(audioManager.isPartiallyLoaded).toBe(true);
      expect(audioManager.loadingErrors).toHaveLength(1);
      expect(Object.keys(audioManager.audioBuffers)).toHaveLength(INSTRUMENTS.length);
      expect(audioManager.fallbackGenerator.generateFallbackSounds).toHaveBeenCalled();
    });

    it('should throw error if no samples can be loaded', async () => {
      fetch.mockRejectedValue(new Error('Network error'));
      
      audioManager.fallbackGenerator = {
        generateFallbackSounds: jest.fn().mockResolvedValue({})
      };

      await expect(audioManager.loadSounds()).rejects.toThrow('Failed to load any audio samples');
    });
  });

  describe('retryFailedSamples', () => {
    beforeEach(() => {
      audioManager.init();
      mockContext = audioManager.audioContext;
    });

    it('should retry failed samples successfully', async () => {
      // Setup initial state with failed samples
      audioManager.loadingErrors = [
        { instrument: INSTRUMENTS[0], error: new Error('Initial failure') }
      ];
      audioManager.audioBuffers = {
        snare: { duration: 1.0 },
        kick: { duration: 1.0 }
      };

      // Mock successful retry
      fetch.mockResolvedValue({
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8))
      });
      mockContext.decodeAudioData.mockResolvedValue({ duration: 1.0 });

      const onProgress = jest.fn();
      const result = await audioManager.retryFailedSamples(onProgress);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(audioManager.isPartiallyLoaded).toBe(false);
      expect(Object.keys(audioManager.audioBuffers)).toHaveLength(INSTRUMENTS.length);
    });

    it('should handle retry failures', async () => {
      audioManager.loadingErrors = [
        { instrument: INSTRUMENTS[0], error: new Error('Initial failure') }
      ];

      fetch.mockRejectedValue(new Error('Still failing'));

      const result = await audioManager.retryFailedSamples();

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('getLoadingStatus', () => {
    beforeEach(() => {
      audioManager.init();
    });

    it('should return correct loading status', () => {
      audioManager.audioBuffers = {
        hihat: { duration: 0.1 },
        snare: { duration: 0.2 }
      };
      audioManager.loadingErrors = [
        { instrument: INSTRUMENTS[2], error: new Error('Failed') }
      ];
      audioManager.isPartiallyLoaded = true;

      const status = audioManager.getLoadingStatus();

      expect(status.loaded).toBe(2);
      expect(status.total).toBe(INSTRUMENTS.length);
      expect(status.errors).toHaveLength(1);
      expect(status.isPartiallyLoaded).toBe(true);
      expect(status.failedInstruments).toContain('kick');
    });
  });

  describe('isReady', () => {
    beforeEach(() => {
      audioManager.init();
    });

    it('should be ready with full load', () => {
      audioManager.audioBuffers = {
        hihat: {}, snare: {}, kick: {}
      };
      expect(audioManager.isReady()).toBe(true);
    });

    it('should be ready with partial load', () => {
      audioManager.audioBuffers = { hihat: {} };
      audioManager.isPartiallyLoaded = true;
      expect(audioManager.isReady()).toBe(true);
    });

    it('should not be ready without any buffers', () => {
      expect(audioManager.isReady()).toBe(false);
    });
  });
});