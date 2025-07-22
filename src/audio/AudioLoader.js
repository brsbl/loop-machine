import { INSTRUMENTS } from '../constants/index.js';

/**
 * Handles audio sample loading with retry logic and error recovery
 */
export class AudioLoader {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.loadedBuffers = {};
    this.failedLoads = new Set();
    this.loadingProgress = 0;
    this.retryAttempts = {};
    this.maxRetries = 3;
    this.baseRetryDelay = 1000; // 1 second
  }

  /**
   * Load all audio samples with error recovery
   * @param {Function} onProgress - Progress callback (0-100)
   * @returns {Promise<{buffers: Object, errors: Array}>}
   */
  async loadAllSamples(onProgress = () => {}) {
    const results = await Promise.allSettled(
      INSTRUMENTS.map(instrument => this.loadSampleWithRetry(instrument, onProgress))
    );

    const errors = [];
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        errors.push({
          instrument: INSTRUMENTS[index],
          error: result.reason
        });
        this.failedLoads.add(INSTRUMENTS[index].id);
      }
    });

    return {
      buffers: this.loadedBuffers,
      errors
    };
  }

  /**
   * Load a single sample with retry logic
   * @param {Object} instrument 
   * @param {Function} onProgress 
   * @returns {Promise<AudioBuffer>}
   */
  async loadSampleWithRetry(instrument, onProgress) {
    const instrumentId = instrument.id;
    this.retryAttempts[instrumentId] = 0;

    while (this.retryAttempts[instrumentId] < this.maxRetries) {
      try {
        const buffer = await this.loadSample(instrument);
        this.loadedBuffers[instrumentId] = buffer;
        this.updateProgress(onProgress);
        return buffer;
      } catch (error) {
        this.retryAttempts[instrumentId]++;
        
        if (this.retryAttempts[instrumentId] >= this.maxRetries) {
          console.error(`Failed to load ${instrument.name} after ${this.maxRetries} attempts:`, error);
          throw error;
        }

        const delay = this.getRetryDelay(this.retryAttempts[instrumentId]);
        console.warn(`Retrying ${instrument.name} in ${delay}ms (attempt ${this.retryAttempts[instrumentId]}/${this.maxRetries})`);
        await this.sleep(delay);
      }
    }
  }

  /**
   * Load a single audio sample
   * @param {Object} instrument 
   * @returns {Promise<AudioBuffer>}
   */
  async loadSample(instrument) {
    const response = await fetch(instrument.path);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    console.log(`Loaded: ${instrument.name}`);
    return audioBuffer;
  }

  /**
   * Retry loading failed samples
   * @param {Function} onProgress 
   * @returns {Promise<{buffers: Object, errors: Array}>}
   */
  async retryFailedSamples(onProgress = () => {}) {
    const failedInstruments = INSTRUMENTS.filter(inst => this.failedLoads.has(inst.id));
    
    if (failedInstruments.length === 0) {
      return { buffers: this.loadedBuffers, errors: [] };
    }

    // Reset retry attempts for failed samples
    failedInstruments.forEach(inst => {
      this.retryAttempts[inst.id] = 0;
      this.failedLoads.delete(inst.id);
    });

    const results = await Promise.allSettled(
      failedInstruments.map(instrument => this.loadSampleWithRetry(instrument, onProgress))
    );

    const errors = [];
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        errors.push({
          instrument: failedInstruments[index],
          error: result.reason
        });
        this.failedLoads.add(failedInstruments[index].id);
      }
    });

    return {
      buffers: this.loadedBuffers,
      errors
    };
  }

  /**
   * Get exponential backoff delay
   * @param {number} attempt 
   * @returns {number}
   */
  getRetryDelay(attempt) {
    return this.baseRetryDelay * Math.pow(2, attempt - 1);
  }

  /**
   * Update loading progress
   * @param {Function} onProgress 
   */
  updateProgress(onProgress) {
    const loaded = Object.keys(this.loadedBuffers).length;
    const total = INSTRUMENTS.length;
    this.loadingProgress = (loaded / total) * 100;
    onProgress(this.loadingProgress);
  }

  /**
   * Sleep utility
   * @param {number} ms 
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if all samples are loaded
   * @returns {boolean}
   */
  isFullyLoaded() {
    return Object.keys(this.loadedBuffers).length === INSTRUMENTS.length;
  }

  /**
   * Check if partial functionality is available
   * @returns {boolean}
   */
  hasPartialLoad() {
    return Object.keys(this.loadedBuffers).length > 0;
  }

  /**
   * Get loaded instrument IDs
   * @returns {Array<string>}
   */
  getLoadedInstruments() {
    return Object.keys(this.loadedBuffers);
  }

  /**
   * Get failed instrument IDs
   * @returns {Array<string>}
   */
  getFailedInstruments() {
    return Array.from(this.failedLoads);
  }
}