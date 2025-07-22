import { AudioLoader } from '../src/audio/AudioLoader.js';
import { INSTRUMENTS } from '../src/constants/index.js';

// Mock fetch and AudioContext
global.fetch = jest.fn();
global.AudioContext = jest.fn(() => ({
  decodeAudioData: jest.fn().mockResolvedValue({})
}));

describe('AudioLoader', () => {
  let audioContext;
  let audioLoader;

  beforeEach(() => {
    audioContext = new AudioContext();
    audioLoader = new AudioLoader(audioContext);
    fetch.mockClear();
    audioContext.decodeAudioData.mockClear();
  });

  describe('loadSample', () => {
    it('should successfully load a sample', async () => {
      const mockArrayBuffer = new ArrayBuffer(8);
      fetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(mockArrayBuffer)
      });

      const instrument = INSTRUMENTS[0];
      const result = await audioLoader.loadSample(instrument);

      expect(fetch).toHaveBeenCalledWith(instrument.path);
      expect(audioContext.decodeAudioData).toHaveBeenCalledWith(mockArrayBuffer);
      expect(result).toBeDefined();
    });

    it('should throw error on HTTP failure', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      const instrument = INSTRUMENTS[0];
      await expect(audioLoader.loadSample(instrument)).rejects.toThrow('HTTP error! status: 404');
    });
  });

  describe('loadSampleWithRetry', () => {
    it('should retry on failure and succeed', async () => {
      const mockArrayBuffer = new ArrayBuffer(8);
      
      // First attempt fails, second succeeds
      fetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: jest.fn().mockResolvedValue(mockArrayBuffer)
        });

      const instrument = INSTRUMENTS[0];
      const onProgress = jest.fn();
      
      const result = await audioLoader.loadSampleWithRetry(instrument, onProgress);

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(result).toBeDefined();
      expect(audioLoader.loadedBuffers[instrument.id]).toBeDefined();
      expect(onProgress).toHaveBeenCalled();
    });

    it('should fail after max retries', async () => {
      fetch.mockRejectedValue(new Error('Network error'));
      audioLoader.maxRetries = 2;
      audioLoader.baseRetryDelay = 10; // Fast retries for testing

      const instrument = INSTRUMENTS[0];
      const onProgress = jest.fn();

      await expect(
        audioLoader.loadSampleWithRetry(instrument, onProgress)
      ).rejects.toThrow('Network error');

      expect(fetch).toHaveBeenCalledTimes(2); // Initial + 1 retry
    });
  });

  describe('loadAllSamples', () => {
    it('should load all samples successfully', async () => {
      const mockArrayBuffer = new ArrayBuffer(8);
      fetch.mockResolvedValue({
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(mockArrayBuffer)
      });

      const onProgress = jest.fn();
      const result = await audioLoader.loadAllSamples(onProgress);

      expect(result.buffers).toHaveProperty('hihat');
      expect(result.buffers).toHaveProperty('snare');
      expect(result.buffers).toHaveProperty('kick');
      expect(result.errors).toHaveLength(0);
      expect(onProgress).toHaveBeenCalledWith(expect.any(Number));
    });

    it('should handle partial failures', async () => {
      const mockArrayBuffer = new ArrayBuffer(8);
      
      // First sample fails, others succeed
      fetch
        .mockRejectedValueOnce(new Error('Failed to load hihat'))
        .mockResolvedValue({
          ok: true,
          arrayBuffer: jest.fn().mockResolvedValue(mockArrayBuffer)
        });

      audioLoader.maxRetries = 1;
      audioLoader.baseRetryDelay = 10;

      const result = await audioLoader.loadAllSamples();

      expect(result.buffers).toHaveProperty('snare');
      expect(result.buffers).toHaveProperty('kick');
      expect(result.buffers).not.toHaveProperty('hihat');
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].instrument.id).toBe('hihat');
    });
  });

  describe('retryFailedSamples', () => {
    it('should retry only failed samples', async () => {
      const mockArrayBuffer = new ArrayBuffer(8);
      
      // Set up initial state with one failed sample
      audioLoader.failedLoads.add('hihat');
      audioLoader.loadedBuffers = { snare: {}, kick: {} };

      fetch.mockResolvedValue({
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(mockArrayBuffer)
      });

      const result = await audioLoader.retryFailedSamples();

      expect(fetch).toHaveBeenCalledTimes(1); // Only retry the failed one
      expect(result.buffers).toHaveProperty('hihat');
      expect(result.errors).toHaveLength(0);
      expect(audioLoader.failedLoads.has('hihat')).toBe(false);
    });
  });

  describe('utility methods', () => {
    it('should calculate exponential backoff correctly', () => {
      audioLoader.baseRetryDelay = 1000;
      
      expect(audioLoader.getRetryDelay(1)).toBe(1000);
      expect(audioLoader.getRetryDelay(2)).toBe(2000);
      expect(audioLoader.getRetryDelay(3)).toBe(4000);
    });

    it('should track loading progress correctly', () => {
      const onProgress = jest.fn();
      
      audioLoader.loadedBuffers = { hihat: {} };
      audioLoader.updateProgress(onProgress);
      expect(onProgress).toHaveBeenCalledWith(33.33333333333333);

      audioLoader.loadedBuffers = { hihat: {}, snare: {} };
      audioLoader.updateProgress(onProgress);
      expect(onProgress).toHaveBeenCalledWith(66.66666666666666);

      audioLoader.loadedBuffers = { hihat: {}, snare: {}, kick: {} };
      audioLoader.updateProgress(onProgress);
      expect(onProgress).toHaveBeenCalledWith(100);
    });

    it('should check load status correctly', () => {
      expect(audioLoader.isFullyLoaded()).toBe(false);
      expect(audioLoader.hasPartialLoad()).toBe(false);

      audioLoader.loadedBuffers = { hihat: {} };
      expect(audioLoader.isFullyLoaded()).toBe(false);
      expect(audioLoader.hasPartialLoad()).toBe(true);

      audioLoader.loadedBuffers = { hihat: {}, snare: {}, kick: {} };
      expect(audioLoader.isFullyLoaded()).toBe(true);
      expect(audioLoader.hasPartialLoad()).toBe(true);
    });
  });
});