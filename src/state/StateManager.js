import { INSTRUMENTS, SEQUENCER } from '../constants/index.js';

/**
 * Manages sequencer state and URL persistence
 */
export class StateManager {
  constructor() {
    this.sequenceState = {};
    this.initializeState();
  }

  /**
   * Initialize empty state for all instruments
   */
  initializeState() {
    INSTRUMENTS.forEach((instrument) => {
      this.sequenceState[instrument.id] = Array(SEQUENCER.STEPS).fill(false);
    });
  }

  /**
   * Get the current sequence state
   * @returns {Object}
   */
  getState() {
    return this.sequenceState;
  }

  /**
   * Update a specific step for an instrument
   * @param {string} instrumentId 
   * @param {number} step 
   * @param {boolean} active 
   */
  updateStep(instrumentId, step, active) {
    if (this.sequenceState[instrumentId]) {
      this.sequenceState[instrumentId][step] = active;
    }
  }

  /**
   * Toggle a specific step
   * @param {string} instrumentId 
   * @param {number} step 
   * @returns {boolean} New state
   */
  toggleStep(instrumentId, step) {
    if (this.sequenceState[instrumentId]) {
      this.sequenceState[instrumentId][step] = !this.sequenceState[instrumentId][step];
      return this.sequenceState[instrumentId][step];
    }
    return false;
  }

  /**
   * Convert boolean array to hex string
   * @param {boolean[]} stateArray 
   * @returns {string}
   */
  stateToHex(stateArray) {
    const binaryString = stateArray.map((val) => (val ? "1" : "0")).join("");
    return parseInt(binaryString, 2).toString(16).padStart(4, "0");
  }

  /**
   * Convert hex string to boolean array
   * @param {string} hexString 
   * @returns {boolean[]}
   */
  hexToState(hexString) {
    if (!hexString || hexString.length !== 4) return Array(SEQUENCER.STEPS).fill(false);
    const binaryString = parseInt(hexString, 16)
      .toString(2)
      .padStart(SEQUENCER.STEPS, "0");
    return binaryString.split("").map((char) => char === "1");
  }

  /**
   * Convert slider value to character
   * @param {number} val 
   * @returns {string}
   */
  valueToChar(val) {
    const num = parseInt(val, 10);
    if (num >= 0 && num <= 9) return String(num);
    if (num === 10) return "a";
    return "0";
  }

  /**
   * Convert character to slider value
   * @param {string} char 
   * @returns {number}
   */
  charToValue(char) {
    if (char >= "0" && char <= "9") return parseInt(char, 10);
    if (char === "a") return 10;
    return 0;
  }

  /**
   * Generate compact state string for URL
   * @param {Object} sliderValues - Object with instrumentId -> {reverb, delay} values
   * @returns {string}
   */
  generateCompactState(sliderValues) {
    let notesHex = "";
    let slidersChars = "";

    INSTRUMENTS.forEach((instrument) => {
      // Notes
      notesHex += this.stateToHex(this.sequenceState[instrument.id]);
      
      // Sliders
      const values = sliderValues[instrument.id] || { reverb: 0, delay: 0 };
      slidersChars += this.valueToChar(values.reverb);
      slidersChars += this.valueToChar(values.delay);
    });

    return `${notesHex}_${slidersChars}`;
  }

  /**
   * Parse compact state string from URL
   * @param {string} compactState 
   * @returns {Object|null} Parsed state or null if invalid
   */
  parseCompactState(compactState) {
    const expectedLength = INSTRUMENTS.length * 4 + 1 + INSTRUMENTS.length * 2;
    
    if (!compactState || compactState.length !== expectedLength || !compactState.includes("_")) {
      return null;
    }

    try {
      const [notesPart, slidersPart] = compactState.split("_");
      const result = {
        notes: {},
        sliders: {}
      };
      
      let noteOffset = 0;
      let sliderOffset = 0;

      INSTRUMENTS.forEach((instrument) => {
        // Parse notes
        const noteHex = notesPart.substring(noteOffset, noteOffset + 4);
        result.notes[instrument.id] = this.hexToState(noteHex);
        noteOffset += 4;

        // Parse sliders
        const reverbChar = slidersPart[sliderOffset];
        const delayChar = slidersPart[sliderOffset + 1];
        result.sliders[instrument.id] = {
          reverb: this.charToValue(reverbChar),
          delay: this.charToValue(delayChar)
        };
        sliderOffset += 2;
      });

      return result;
    } catch (error) {
      console.error("Error parsing compact state:", error);
      return null;
    }
  }

  /**
   * Apply parsed state
   * @param {Object} parsedState 
   */
  applyParsedState(parsedState) {
    if (parsedState && parsedState.notes) {
      Object.keys(parsedState.notes).forEach(instrumentId => {
        if (this.sequenceState[instrumentId]) {
          this.sequenceState[instrumentId] = parsedState.notes[instrumentId];
        }
      });
    }
  }

  /**
   * Reset all state
   */
  reset() {
    this.initializeState();
  }

  /**
   * Get current state as JSON for editor
   * @param {Object} sliderValues 
   * @returns {Object}
   */
  getStateAsJson(sliderValues) {
    const currentState = {};
    
    INSTRUMENTS.forEach((instrument) => {
      const notesState = this.sequenceState[instrument.id];
      const values = sliderValues[instrument.id] || { reverb: 0, delay: 0 };
      
      // Group notes by beat for display
      const notesGrouped = {
        1: notesState.slice(0, 4).map((v) => (v ? 1 : 0)),
        2: notesState.slice(4, 8).map((v) => (v ? 1 : 0)),
        3: notesState.slice(8, 12).map((v) => (v ? 1 : 0)),
        4: notesState.slice(12, 16).map((v) => (v ? 1 : 0)),
      };

      currentState[instrument.id] = {
        notes: notesGrouped,
        reverb: parseInt(values.reverb, 10),
        delay: parseInt(values.delay, 10),
      };
    });
    
    return currentState;
  }

  /**
   * Apply state from JSON
   * @param {Object} jsonState 
   * @returns {Object} Validation result {success, error, appliedState}
   */
  applyJsonState(jsonState) {
    const result = {
      success: false,
      error: null,
      appliedState: {
        notes: {},
        sliders: {}
      }
    };

    try {
      INSTRUMENTS.forEach((instrument) => {
        const instState = jsonState[instrument.id];
        if (!instState) {
          throw new Error(`No data found for instrument ${instrument.id}`);
        }

        // Validate and apply notes
        if (!instState.notes || typeof instState.notes !== 'object') {
          throw new Error(`Instrument ${instrument.id}: Invalid or missing notes structure`);
        }

        const beats = ['1', '2', '3', '4'];
        for (const beat of beats) {
          if (!instState.notes[beat] || instState.notes[beat].length !== 4) {
            throw new Error(`Instrument ${instrument.id}: Invalid notes for beat ${beat}`);
          }
        }

        // Flatten and validate notes
        const flattenedNotes = [
          ...instState.notes['1'],
          ...instState.notes['2'],
          ...instState.notes['3'],
          ...instState.notes['4'],
        ];

        const notesAsBooleans = flattenedNotes.map((val, index) => {
          if (val !== 0 && val !== 1) {
            throw new Error(
              `Instrument ${instrument.id}, Notes: Invalid value (${val}) at step ${index + 1}. Only 0 or 1 allowed.`
            );
          }
          return val === 1;
        });

        // Validate sliders
        if (!Object.prototype.hasOwnProperty.call(instState, 'reverb')) {
          throw new Error(`Instrument ${instrument.id}: Missing 'reverb' key`);
        }
        if (!Object.prototype.hasOwnProperty.call(instState, 'delay')) {
          throw new Error(`Instrument ${instrument.id}: Missing 'delay' key`);
        }

        const reverbVal = instState.reverb;
        const delayVal = instState.delay;

        if (typeof reverbVal !== 'number' || reverbVal < 0 || reverbVal > 10) {
          throw new Error(
            `Instrument ${instrument.id}, Reverb: Invalid value (${reverbVal}). Must be 0-10.`
          );
        }
        if (typeof delayVal !== 'number' || delayVal < 0 || delayVal > 10) {
          throw new Error(
            `Instrument ${instrument.id}, Delay: Invalid value (${delayVal}). Must be 0-10.`
          );
        }

        // If we get here, validation passed
        result.appliedState.notes[instrument.id] = notesAsBooleans;
        result.appliedState.sliders[instrument.id] = {
          reverb: reverbVal,
          delay: delayVal
        };
      });

      // Apply the validated state
      Object.keys(result.appliedState.notes).forEach(instrumentId => {
        this.sequenceState[instrumentId] = result.appliedState.notes[instrumentId];
      });

      result.success = true;
    } catch (error) {
      result.error = error.message;
    }

    return result;
  }
}