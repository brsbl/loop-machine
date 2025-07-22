import { INSTRUMENTS, EFFECTS } from '../constants/index.js';

/**
 * Manages audio context, buffer loading, and effect nodes
 */
export class AudioManager {
  constructor() {
    this.audioContext = null;
    this.audioBuffers = {};
    this.effectNodes = {};
  }

  /**
   * Initialize the audio context
   * @returns {boolean} Whether initialization was successful
   */
  init() {
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log("AudioContext created.");
        return true;
      } catch (error) {
        console.error("Failed to create AudioContext:", error);
        this.audioContext = null;
        return false;
      }
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
   * Check if audio context is initialized
   * @returns {boolean}
   */
  isInitialized() {
    return this.audioContext !== null;
  }

  /**
   * Check if audio is ready
   * @returns {boolean}
   */
  isReady() {
    return this.audioContext !== null && 
           Object.keys(this.audioBuffers).length === INSTRUMENTS.length;
  }

  /**
   * Load all audio samples
   * @returns {Promise<void>}
   */
  async loadSounds() {
    if (!this.isInitialized()) {
      throw new Error("AudioContext not initialized. Call init() first.");
    }
    
    console.log("Loading sounds...");
    
    const loadPromises = INSTRUMENTS.map(async (instrument) => {
      try {
        const response = await fetch(instrument.path);
        const arrayBuffer = await response.arrayBuffer();
        this.audioBuffers[instrument.id] = await this.audioContext.decodeAudioData(
          arrayBuffer
        );
        console.log(`Loaded: ${instrument.name}`);
        this.setupEffectNodes(instrument.id);
      } catch (error) {
        console.error(`Error loading sound ${instrument.name}:`, error);
        throw error;
      }
    });

    await Promise.all(loadPromises);
    console.log("All sounds loaded.");
  }

  /**
   * Setup effect nodes for an instrument
   * @param {string} instrumentId 
   */
  setupEffectNodes(instrumentId) {
    if (!this.isInitialized()) {
      console.error("Cannot setup effect nodes: AudioContext not initialized");
      return;
    }
    
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
    if (!this.isInitialized()) {
      console.warn("Cannot update effect: AudioContext not initialized");
      return;
    }
    
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
    if (!this.isInitialized()) {
      console.warn("Cannot play sound: AudioContext not initialized");
      return;
    }
    
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