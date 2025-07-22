/**
 * Generates fallback sounds using Web Audio API oscillators
 */
export class FallbackSoundGenerator {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.fallbackBuffers = {};
  }

  /**
   * Generate all fallback sounds
   * @returns {Object} Map of instrument IDs to audio buffers
   */
  async generateFallbackSounds() {
    this.fallbackBuffers = {
      hihat: await this.generateHiHat(),
      snare: await this.generateSnare(),
      kick: await this.generateKick()
    };

    return this.fallbackBuffers;
  }

  /**
   * Generate a synthetic hi-hat sound
   * @returns {Promise<AudioBuffer>}
   */
  async generateHiHat() {
    const duration = 0.05; // 50ms
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    // White noise with envelope
    for (let i = 0; i < data.length; i++) {
      const envelope = Math.exp(-i / (data.length * 0.2));
      data[i] = (Math.random() * 2 - 1) * envelope * 0.3;
    }

    return buffer;
  }

  /**
   * Generate a synthetic snare sound
   * @returns {Promise<AudioBuffer>}
   */
  async generateSnare() {
    const duration = 0.15; // 150ms
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    // Mix of tone and noise
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 35);
      
      // Tone component (200Hz)
      const tone = Math.sin(2 * Math.PI * 200 * t);
      
      // Noise component
      const noise = (Math.random() * 2 - 1);
      
      // Mix tone and noise
      data[i] = (tone * 0.5 + noise * 0.5) * envelope * 0.4;
    }

    return buffer;
  }

  /**
   * Generate a synthetic kick drum sound
   * @returns {Promise<AudioBuffer>}
   */
  async generateKick() {
    const duration = 0.5; // 500ms
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    // Pitch sweep from 120Hz to 30Hz
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 5);
      const pitch = 120 * Math.exp(-t * 8) + 30;
      
      data[i] = Math.sin(2 * Math.PI * pitch * t) * envelope * 0.8;
    }

    return buffer;
  }

  /**
   * Get a fallback buffer for a specific instrument
   * @param {string} instrumentId 
   * @returns {AudioBuffer|null}
   */
  getFallbackBuffer(instrumentId) {
    return this.fallbackBuffers[instrumentId] || null;
  }
}