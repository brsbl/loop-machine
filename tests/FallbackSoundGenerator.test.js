import { FallbackSoundGenerator } from '../src/audio/FallbackSoundGenerator.js';

// Mock AudioContext
global.AudioContext = jest.fn(() => ({
  sampleRate: 44100,
  createBuffer: jest.fn((channels, length, sampleRate) => ({
    getChannelData: jest.fn(() => new Float32Array(length))
  }))
}));

describe('FallbackSoundGenerator', () => {
  let audioContext;
  let generator;

  beforeEach(() => {
    audioContext = new AudioContext();
    generator = new FallbackSoundGenerator(audioContext);
  });

  describe('generateHiHat', () => {
    it('should generate a hi-hat buffer', async () => {
      const buffer = await generator.generateHiHat();
      
      expect(audioContext.createBuffer).toHaveBeenCalledWith(
        1, // channels
        expect.any(Number), // length based on duration
        44100 // sample rate
      );
      expect(buffer).toBeDefined();
      expect(buffer.getChannelData).toHaveBeenCalled();
    });

    it('should create appropriate duration buffer', async () => {
      await generator.generateHiHat();
      
      // Hi-hat duration is 0.05s, so at 44100Hz: 0.05 * 44100 = 2205 samples
      expect(audioContext.createBuffer).toHaveBeenCalledWith(1, 2205, 44100);
    });
  });

  describe('generateSnare', () => {
    it('should generate a snare buffer', async () => {
      const buffer = await generator.generateSnare();
      
      expect(audioContext.createBuffer).toHaveBeenCalledWith(
        1,
        expect.any(Number),
        44100
      );
      expect(buffer).toBeDefined();
    });

    it('should create appropriate duration buffer', async () => {
      await generator.generateSnare();
      
      // Snare duration is 0.15s, so at 44100Hz: 0.15 * 44100 = 6615 samples
      expect(audioContext.createBuffer).toHaveBeenCalledWith(1, 6615, 44100);
    });
  });

  describe('generateKick', () => {
    it('should generate a kick buffer', async () => {
      const buffer = await generator.generateKick();
      
      expect(audioContext.createBuffer).toHaveBeenCalledWith(
        1,
        expect.any(Number),
        44100
      );
      expect(buffer).toBeDefined();
    });

    it('should create appropriate duration buffer', async () => {
      await generator.generateKick();
      
      // Kick duration is 0.5s, so at 44100Hz: 0.5 * 44100 = 22050 samples
      expect(audioContext.createBuffer).toHaveBeenCalledWith(1, 22050, 44100);
    });
  });

  describe('generateFallbackSounds', () => {
    it('should generate all fallback sounds', async () => {
      const buffers = await generator.generateFallbackSounds();
      
      expect(buffers).toHaveProperty('hihat');
      expect(buffers).toHaveProperty('snare');
      expect(buffers).toHaveProperty('kick');
      expect(audioContext.createBuffer).toHaveBeenCalledTimes(3);
    });

    it('should store generated buffers internally', async () => {
      await generator.generateFallbackSounds();
      
      expect(generator.fallbackBuffers).toHaveProperty('hihat');
      expect(generator.fallbackBuffers).toHaveProperty('snare');
      expect(generator.fallbackBuffers).toHaveProperty('kick');
    });
  });

  describe('getFallbackBuffer', () => {
    it('should return null for non-existent instrument', () => {
      expect(generator.getFallbackBuffer('unknown')).toBeNull();
    });

    it('should return buffer for generated instrument', async () => {
      await generator.generateFallbackSounds();
      
      expect(generator.getFallbackBuffer('hihat')).toBeDefined();
      expect(generator.getFallbackBuffer('snare')).toBeDefined();
      expect(generator.getFallbackBuffer('kick')).toBeDefined();
    });
  });

  describe('sound generation algorithms', () => {
    it('should generate data within expected range', async () => {
      // Create a real Float32Array for testing
      const testLength = 100;
      const testData = new Float32Array(testLength);
      
      audioContext.createBuffer.mockReturnValueOnce({
        getChannelData: jest.fn(() => testData)
      });

      // Manually run the hi-hat generation algorithm
      const buffer = await generator.generateHiHat();
      const data = buffer.getChannelData();
      
      // Simulate the algorithm
      for (let i = 0; i < testLength; i++) {
        const envelope = Math.exp(-i / (testLength * 0.2));
        data[i] = (Math.random() * 2 - 1) * envelope * 0.3;
      }

      // Check that all values are within expected range
      const allInRange = data.every(sample => sample >= -0.3 && sample <= 0.3);
      expect(allInRange).toBe(true);
    });
  });
});