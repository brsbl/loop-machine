// Core audio engine logic extracted for better testability

class SequencerEngine {
  constructor(audioContext, instrumentsData, steps = 16, bpm = 120) {
    this.audioContext = audioContext;
    this.instrumentsData = instrumentsData;
    this.steps = steps;
    this.bpm = bpm;
    this.stepTime = 60 / bpm / 4; // Time per 16th note
    
    this.audioBuffers = {};
    this.effectNodes = {};
    this.sequenceState = {};
    this.currentStep = 0;
    this.isPlaying = false;
    this.nextNoteTime = 0.0;
    this.scheduleAheadTime = 0.1;
    
    // Initialize sequence state
    instrumentsData.forEach(instrument => {
      this.sequenceState[instrument.id] = Array(steps).fill(false);
    });
  }

  // Setup effect nodes for an instrument
  setupEffectNodes(instrumentId) {
    const gainNode = this.audioContext.createGain();
    const reverbNode = this.audioContext.createGain();
    const delayNode = this.audioContext.createDelay(1.0);
    const feedbackNode = this.audioContext.createGain();
    const delayWetGain = this.audioContext.createGain();

    // Initial settings
    delayNode.delayTime.value = 0;
    feedbackNode.gain.value = 0;
    delayWetGain.gain.value = 0;
    reverbNode.gain.value = 0;

    // Connect delay path
    gainNode.connect(delayNode);
    delayNode.connect(feedbackNode);
    feedbackNode.connect(delayNode);
    delayNode.connect(delayWetGain);

    // Connect reverb path
    gainNode.connect(reverbNode);

    // Connect to destination
    const mainOutputGain = this.audioContext.createGain();
    gainNode.connect(mainOutputGain);
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
  }

  // Load audio buffer for an instrument
  async loadAudioBuffer(instrumentId, audioBuffer) {
    this.audioBuffers[instrumentId] = audioBuffer;
    this.setupEffectNodes(instrumentId);
  }

  // Update effect parameters
  updateEffect(instrumentId, effectType, value) {
    if (!this.effectNodes[instrumentId]) return;
    
    const nodes = this.effectNodes[instrumentId];
    const sliderValue = parseInt(value, 10);

    if (effectType === 'reverb') {
      const reverbAmount = sliderValue / 10;
      nodes.reverb.gain.setValueAtTime(reverbAmount, this.audioContext.currentTime);
    } else if (effectType === 'delay') {
      const delayTime = (sliderValue / 10) * 0.5;
      const feedbackAmount = (sliderValue / 10) * 0.7;
      const wetAmount = (sliderValue / 10) * 0.5;
      
      nodes.delay.delayTime.setValueAtTime(delayTime, this.audioContext.currentTime);
      nodes.delayFeedback.gain.setValueAtTime(feedbackAmount, this.audioContext.currentTime);
      nodes.delayWet.gain.setValueAtTime(wetAmount, this.audioContext.currentTime);
    }
  }

  // Play a sound at a specific time
  playSound(instrumentId, time) {
    if (!this.audioBuffers[instrumentId] || !this.effectNodes[instrumentId]) {
      return false;
    }
    
    const source = this.audioContext.createBufferSource();
    source.buffer = this.audioBuffers[instrumentId];
    source.connect(this.effectNodes[instrumentId].mainGain);
    source.start(time);
    return true;
  }

  // Get notes to play at current step
  getNotesForStep(stepIndex) {
    const notes = [];
    this.instrumentsData.forEach(instrument => {
      if (this.sequenceState[instrument.id][stepIndex]) {
        notes.push(instrument.id);
      }
    });
    return notes;
  }

  // Calculate next step time
  calculateNextStepTime() {
    this.nextNoteTime += this.stepTime;
    this.currentStep = (this.currentStep + 1) % this.steps;
  }

  // Set sequence state for an instrument
  setSequenceState(instrumentId, pattern) {
    if (pattern.length !== this.steps) {
      throw new Error(`Pattern must have exactly ${this.steps} steps`);
    }
    this.sequenceState[instrumentId] = pattern;
  }

  // Get sequence state for an instrument
  getSequenceState(instrumentId) {
    return this.sequenceState[instrumentId];
  }

  // Start playback
  start() {
    if (this.isPlaying) return;
    
    this.isPlaying = true;
    this.currentStep = 0;
    this.nextNoteTime = this.audioContext.currentTime;
  }

  // Stop playback
  stop() {
    this.isPlaying = false;
  }

  // Check if all buffers are loaded
  areAllBuffersLoaded() {
    return this.instrumentsData.every(inst => 
      this.audioBuffers[inst.id] && this.effectNodes[inst.id]
    );
  }
}

// State serialization utilities
const StateSerializer = {
  // Convert boolean array to hex string
  stateToHex(stateArray) {
    const binaryString = stateArray.map(val => val ? '1' : '0').join('');
    return parseInt(binaryString, 2).toString(16).padStart(4, '0');
  },

  // Convert hex string to boolean array
  hexToState(hexString) {
    if (!hexString || hexString.length !== 4) return Array(16).fill(false);
    const binaryString = parseInt(hexString, 16).toString(2).padStart(16, '0');
    return binaryString.split('').map(char => char === '1');
  },

  // Convert slider value to character
  valueToChar(val) {
    const num = parseInt(val, 10);
    if (num >= 0 && num <= 9) return String(num);
    if (num === 10) return 'a';
    return '0';
  },

  // Convert character to slider value
  charToValue(char) {
    if (char >= '0' && char <= '9') return parseInt(char, 10);
    if (char === 'a') return 10;
    return 0;
  },

  // Serialize complete sequencer state
  serializeState(sequencerEngine, instrumentsData) {
    let notesHex = '';
    let slidersChars = '';
    
    instrumentsData.forEach(instrument => {
      // Serialize notes
      const state = sequencerEngine.getSequenceState(instrument.id);
      notesHex += this.stateToHex(state);
      
      // Get effect values (would come from UI in real app)
      // For testing, we'll track these separately
      slidersChars += '00'; // Placeholder for reverb/delay
    });
    
    return `${notesHex}_${slidersChars}`;
  },

  // Deserialize state string back to sequencer
  deserializeState(stateString, sequencerEngine, instrumentsData) {
    const expectedLength = instrumentsData.length * 4 + 1 + instrumentsData.length * 2;
    
    if (!stateString || stateString.length !== expectedLength || !stateString.includes('_')) {
      throw new Error('Invalid state string format');
    }
    
    const [notesPart, slidersPart] = stateString.split('_');
    let noteOffset = 0;
    let sliderOffset = 0;
    const result = {};
    
    instrumentsData.forEach(instrument => {
      // Deserialize notes
      const noteHex = notesPart.substring(noteOffset, noteOffset + 4);
      const loadedNotes = this.hexToState(noteHex);
      sequencerEngine.setSequenceState(instrument.id, loadedNotes);
      noteOffset += 4;
      
      // Deserialize sliders
      const reverbChar = slidersPart[sliderOffset];
      const delayChar = slidersPart[sliderOffset + 1];
      sliderOffset += 2;
      
      result[instrument.id] = {
        notes: loadedNotes,
        reverb: this.charToValue(reverbChar),
        delay: this.charToValue(delayChar)
      };
    });
    
    return result;
  }
};

// JSON state management
const JsonStateManager = {
  // Validate JSON state structure
  validateJsonState(jsonState, instrumentsData) {
    const errors = [];
    
    instrumentsData.forEach(instrument => {
      const instState = jsonState[instrument.id];
      
      if (!instState) {
        errors.push(`Missing data for instrument: ${instrument.id}`);
        return;
      }
      
      // Validate notes structure
      if (!instState.notes || typeof instState.notes !== 'object') {
        errors.push(`${instrument.id}: Invalid notes structure`);
      } else {
        // Check for grouped format
        for (let i = 1; i <= 4; i++) {
          const group = instState.notes[String(i)];
          if (!Array.isArray(group) || group.length !== 4) {
            errors.push(`${instrument.id}: Invalid notes group ${i}`);
          } else {
            // Validate each note value
            group.forEach((val, idx) => {
              if (val !== 0 && val !== 1) {
                errors.push(`${instrument.id}: Invalid note value ${val} in group ${i}, position ${idx}`);
              }
            });
          }
        }
      }
      
      // Validate effect values
      if (!instState.hasOwnProperty('reverb')) {
        errors.push(`${instrument.id}: Missing reverb value`);
      } else if (typeof instState.reverb !== 'number' || instState.reverb < 0 || instState.reverb > 10) {
        errors.push(`${instrument.id}: Invalid reverb value ${instState.reverb}`);
      }
      
      if (!instState.hasOwnProperty('delay')) {
        errors.push(`${instrument.id}: Missing delay value`);
      } else if (typeof instState.delay !== 'number' || instState.delay < 0 || instState.delay > 10) {
        errors.push(`${instrument.id}: Invalid delay value ${instState.delay}`);
      }
    });
    
    return errors;
  },

  // Apply JSON state to sequencer
  applyJsonState(jsonState, sequencerEngine, instrumentsData) {
    const errors = this.validateJsonState(jsonState, instrumentsData);
    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join('; ')}`);
    }
    
    instrumentsData.forEach(instrument => {
      const instState = jsonState[instrument.id];
      
      // Flatten notes from grouped format
      const flatNotes = [];
      for (let i = 1; i <= 4; i++) {
        flatNotes.push(...instState.notes[String(i)]);
      }
      
      // Convert to boolean array and apply
      const booleanNotes = flatNotes.map(val => val === 1);
      sequencerEngine.setSequenceState(instrument.id, booleanNotes);
      
      // Apply effects
      sequencerEngine.updateEffect(instrument.id, 'reverb', instState.reverb);
      sequencerEngine.updateEffect(instrument.id, 'delay', instState.delay);
    });
    
    return true;
  },

  // Convert sequencer state to JSON format
  exportToJson(sequencerEngine, instrumentsData, effectValues = {}) {
    const jsonState = {};
    
    instrumentsData.forEach(instrument => {
      const notes = sequencerEngine.getSequenceState(instrument.id);
      
      // Convert to grouped format with 0/1 values
      const notesGrouped = {
        '1': notes.slice(0, 4).map(v => v ? 1 : 0),
        '2': notes.slice(4, 8).map(v => v ? 1 : 0),
        '3': notes.slice(8, 12).map(v => v ? 1 : 0),
        '4': notes.slice(12, 16).map(v => v ? 1 : 0)
      };
      
      jsonState[instrument.id] = {
        notes: notesGrouped,
        reverb: effectValues[instrument.id]?.reverb || 0,
        delay: effectValues[instrument.id]?.delay || 0
      };
    });
    
    return jsonState;
  }
};

// Export for CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SequencerEngine, StateSerializer, JsonStateManager };
}