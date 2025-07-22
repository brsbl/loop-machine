import { INSTRUMENTS, EFFECTS } from '../constants/index.js';
import { AudioLoader } from './AudioLoader.js';
import { FallbackSoundGenerator } from './FallbackSoundGenerator.js';

/**
 * Manages audio context, buffer loading, and effect nodes
 */
export class AudioManager {
  constructor() {
    this.audioContext = null;
    this.audioBuffers = {};
    this.effectNodes = {};
    this.loader = null;
    this.fallbackGenerator = null;
    this.loadingErrors = [];
    this.isPartiallyLoaded = false;
    this.onLoadProgress = null;
  }

  /**
   * Initialize the audio context
   * @returns {boolean} Whether initialization was successful
   */
  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.loader = new AudioLoader(this.audioContext);
      this.fallbackGenerator = new FallbackSoundGenerator(this.audioContext);
      console.log("AudioContext created.");
      return true;
    }
    return false;
  }

  /**
   * Get the current audio context
   * @returns {AudioContext}
   */
  getContext() {
    return this.audioContext;
  }

  /**
   * Check if audio is ready
   * @returns {boolean}
   */
  isReady() {
    return this.audioContext && 
           (Object.keys(this.audioBuffers).length === INSTRUMENTS.length || this.isPartiallyLoaded);
  }

  /**
   * Load all audio samples with error recovery
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<void>}
   */
  async loadSounds(onProgress = null) {
    console.log("Loading sounds...");
    this.onLoadProgress = onProgress;
    
    // Try to load samples with retry logic
    const { buffers, errors } = await this.loader.loadAllSamples(onProgress);
    
    // Store successfully loaded buffers
    Object.assign(this.audioBuffers, buffers);
    this.loadingErrors = errors;
    
    // Setup effect nodes for loaded instruments
    Object.keys(buffers).forEach(instrumentId => {
      this.setupEffectNodes(instrumentId);
    });
    
    // If some samples failed, try to generate fallback sounds
    if (errors.length > 0) {
      console.warn(`Failed to load ${errors.length} samples, generating fallback sounds...`);
      await this.generateFallbacksForFailed();
      this.isPartiallyLoaded = true;
    }
    
    // If no samples loaded at all, throw error
    if (Object.keys(this.audioBuffers).length === 0) {
      throw new Error("Failed to load any audio samples");
    }
    
    console.log(`Loaded ${Object.keys(this.audioBuffers).length}/${INSTRUMENTS.length} sounds.`);
  }

  /**
   * Generate fallback sounds for failed samples
   */
  async generateFallbacksForFailed() {
    const fallbacks = await this.fallbackGenerator.generateFallbackSounds();
    
    this.loadingErrors.forEach(({ instrument }) => {
      const fallbackBuffer = fallbacks[instrument.id];
      if (fallbackBuffer) {
        this.audioBuffers[instrument.id] = fallbackBuffer;
        this.setupEffectNodes(instrument.id);
        console.log(`Using fallback sound for ${instrument.name}`);
      }
    });
  }

  /**
   * Retry loading failed samples
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<{success: boolean, errors: Array}>}
   */
  async retryFailedSamples(onProgress = null) {
    if (!this.loader || this.loadingErrors.length === 0) {
      return { success: true, errors: [] };
    }
    
    const { buffers, errors } = await this.loader.retryFailedSamples(onProgress);
    
    // Update loaded buffers
    Object.assign(this.audioBuffers, buffers);
    
    // Setup effect nodes for newly loaded instruments
    Object.keys(buffers).forEach(instrumentId => {
      if (!this.effectNodes[instrumentId]) {
        this.setupEffectNodes(instrumentId);
      }
    });
    
    this.loadingErrors = errors;
    
    // Update partial load status
    if (errors.length === 0) {
      this.isPartiallyLoaded = false;
    }
    
    return {
      success: errors.length === 0,
      errors
    };
  }

  /**
   * Get loading status
   * @returns {Object}
   */
  getLoadingStatus() {
    return {
      loaded: Object.keys(this.audioBuffers).length,
      total: INSTRUMENTS.length,
      errors: this.loadingErrors,
      isPartiallyLoaded: this.isPartiallyLoaded,
      failedInstruments: this.loadingErrors.map(e => e.instrument.name)
    };
  }

  /**
   * Setup effect nodes for an instrument
   * @param {string} instrumentId 
   */
  setupEffectNodes(instrumentId) {
    const gainNode = this.audioContext.createGain();
    const reverbNode = this.audioContext.createGain(); // Placeholder for Reverb (Wet Gain)
    const delayNode = this.audioContext.createDelay(1.0); // Max delay 1 sec
    const feedbackNode = this.audioContext.createGain(); // Delay feedback
    const delayWetGain = this.audioContext.createGain(); // Delay Wet amount control

    // Initial settings
    delayNode.delayTime.value = 0;
    feedbackNode.gain.value = 0;
    delayWetGain.gain.value = 0; // Start with dry signal for delay
    reverbNode.gain.value = 0; // Start with dry signal for reverb

    // Connect delay path
    gainNode.connect(delayNode);
    delayNode.connect(feedbackNode);
    feedbackNode.connect(delayNode);
    delayNode.connect(delayWetGain);

    // Connect reverb path
    gainNode.connect(reverbNode);

    // Connect dry path + effect sends to destination
    const mainOutputGain = this.audioContext.createGain();
    gainNode.connect(mainOutputGain); // Dry Signal
    reverbNode.connect(mainOutputGain);
    delayWetGain.connect(mainOutputGain);

    mainOutputGain.connect(this.audioContext.destination);

    this.effectNodes[instrumentId] = {
      mainGain: gainNode,
      reverb: reverbNode,
      delay: delayNode,
      delayFeedback: feedbackNode,
      delayWet: delayWetGain,
      output: mainOutputGain,
    };
    
    console.log(`Effect nodes created for ${instrumentId}`);
  }

  /**
   * Update effect parameters
   * @param {string} instrumentId 
   * @param {string} effectType - 'reverb' or 'delay'
   * @param {number} value - 0-10
   */
  updateEffect(instrumentId, effectType, value) {
    if (!this.effectNodes[instrumentId]) {
      return;
    }
    
    const nodes = this.effectNodes[instrumentId];
    const sliderValue = parseInt(value, 10);

    if (effectType === 'reverb') {
      const reverbAmount = sliderValue / EFFECTS.SLIDER_MAX * EFFECTS.REVERB.MAX_AMOUNT;
      nodes.reverb.gain.setValueAtTime(reverbAmount, this.audioContext.currentTime);
      console.log(`${instrumentId} reverb set to ${reverbAmount}`);
    } else if (effectType === 'delay') {
      const delayTime = (sliderValue / EFFECTS.SLIDER_MAX) * EFFECTS.DELAY.MAX_TIME;
      const feedbackAmount = (sliderValue / EFFECTS.SLIDER_MAX) * EFFECTS.DELAY.MAX_FEEDBACK;
      const wetAmount = (sliderValue / EFFECTS.SLIDER_MAX) * EFFECTS.DELAY.MAX_WET;
      
      nodes.delay.delayTime.setValueAtTime(delayTime, this.audioContext.currentTime);
      nodes.delayFeedback.gain.setValueAtTime(feedbackAmount, this.audioContext.currentTime);
      nodes.delayWet.gain.setValueAtTime(wetAmount, this.audioContext.currentTime);
      
      console.log(
        `${instrumentId} delay set to time: ${delayTime.toFixed(2)}s, ` +
        `feedback: ${feedbackAmount.toFixed(2)}`
      );
    }
  }

  /**
   * Play a sound at a specific time
   * @param {string} instrumentId 
   * @param {number} time - AudioContext time
   */
  playSound(instrumentId, time) {
    if (!this.audioBuffers[instrumentId] || !this.effectNodes[instrumentId]) {
      console.log(`Buffer or nodes missing for ${instrumentId}`);
      return;
    }
    
    const source = this.audioContext.createBufferSource();
    source.buffer = this.audioBuffers[instrumentId];
    source.connect(this.effectNodes[instrumentId].mainGain);
    source.start(time);
  }

  /**
   * Resume audio context if suspended
   * @returns {Promise<void>}
   */
  async resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
      console.log('AudioContext resumed');
    }
  }
}