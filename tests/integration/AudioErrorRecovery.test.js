/**
 * Integration test for audio error recovery functionality
 */

// Mock global objects
global.fetch = jest.fn();
global.AudioContext = jest.fn(() => ({
  createGain: jest.fn(() => ({
    connect: jest.fn(),
    gain: { value: 0, setValueAtTime: jest.fn() }
  })),
  createDelay: jest.fn(() => ({
    connect: jest.fn(),
    delayTime: { value: 0, setValueAtTime: jest.fn() }
  })),
  createBuffer: jest.fn((channels, length) => ({
    getChannelData: jest.fn(() => new Float32Array(length))
  })),
  decodeAudioData: jest.fn(),
  destination: {},
  currentTime: 0,
  sampleRate: 44100
}));

// Import modules after mocking
import { AudioManager } from '../../src/audio/AudioManager.js';
import { LoadingOverlay } from '../../src/ui/LoadingOverlay.js';
import { ErrorNotification } from '../../src/ui/ErrorNotification.js';
import { NetworkStatus } from '../../src/utils/NetworkStatus.js';

describe('Audio Error Recovery Integration', () => {
  let audioManager;
  let loadingOverlay;
  let errorNotification;
  let networkStatus;

  beforeEach(() => {
    // Clear mocks
    fetch.mockClear();
    
    // Create instances
    audioManager = new AudioManager();
    loadingOverlay = new LoadingOverlay();
    errorNotification = new ErrorNotification();
    networkStatus = new NetworkStatus();
    
    // Initialize
    audioManager.init();
    
    // Mock DOM elements
    document.body.innerHTML = '';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful loading scenario', () => {
    it('should load all samples without errors', async () => {
      // Mock successful fetch responses
      fetch.mockResolvedValue({
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8))
      });
      
      audioManager.audioContext.decodeAudioData.mockResolvedValue({
        duration: 1.0
      });

      const onProgress = jest.fn();
      await audioManager.loadSounds(onProgress);

      expect(audioManager.isPartiallyLoaded).toBe(false);
      expect(audioManager.getLoadingStatus().loaded).toBe(3); // All 3 instruments
      expect(onProgress).toHaveBeenCalledWith(100);
    });
  });

  describe('Partial failure scenario', () => {
    it('should handle partial failures with fallback sounds', async () => {
      // First sample fails, others succeed
      fetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue({
          ok: true,
          arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8))
        });
      
      audioManager.audioContext.decodeAudioData.mockResolvedValue({
        duration: 1.0
      });

      await audioManager.loadSounds();

      const status = audioManager.getLoadingStatus();
      expect(status.loaded).toBe(3); // All should be loaded (2 real + 1 fallback)
      expect(status.isPartiallyLoaded).toBe(true);
      expect(status.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Network failure scenario', () => {
    it('should detect offline status and provide retry option', async () => {
      // Mock offline status
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: false
      });

      const isOnline = networkStatus.checkOnlineStatus();
      expect(isOnline).toBe(false);

      // Mock network failure
      fetch.mockRejectedValue(new Error('Network error'));

      try {
        await audioManager.loadSounds();
      } catch (error) {
        expect(error.message).toBe('Failed to load any audio samples');
      }
    });
  });

  describe('Retry mechanism', () => {
    it('should successfully retry failed samples', async () => {
      // Initial partial failure
      fetch
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValue({
          ok: true,
          arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8))
        });
      
      audioManager.audioContext.decodeAudioData.mockResolvedValue({
        duration: 1.0
      });

      // Load with failures
      await audioManager.loadSounds();
      expect(audioManager.isPartiallyLoaded).toBe(true);

      // Clear fetch mock for retry
      fetch.mockClear();
      fetch.mockResolvedValue({
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8))
      });

      // Retry failed samples
      const result = await audioManager.retryFailedSamples();
      
      expect(result.success).toBe(true);
      expect(audioManager.isPartiallyLoaded).toBe(false);
      expect(audioManager.getLoadingStatus().loaded).toBe(3);
    });
  });

  describe('UI integration', () => {
    it('should show loading overlay during load', () => {
      const show = jest.spyOn(loadingOverlay, 'show');
      const hide = jest.spyOn(loadingOverlay, 'hide');
      
      loadingOverlay.show();
      expect(show).toHaveBeenCalled();
      expect(document.querySelector('.loading-overlay')).toBeTruthy();
      
      loadingOverlay.hide();
      expect(hide).toHaveBeenCalled();
    });

    it('should display error notifications', () => {
      errorNotification.init();
      
      const notification = errorNotification.show(
        'Test Error',
        'This is a test error message'
      );
      
      expect(notification).toBeTruthy();
      expect(document.querySelector('.error-notification')).toBeTruthy();
    });
  });
});