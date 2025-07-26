import { INSTRUMENTS, SEQUENCER } from '../constants/index.js';

/**
 * Manages UI creation and updates
 */
export class UIManager {
  constructor(stateManager, audioManager) {
    this.stateManager = stateManager;
    this.audioManager = audioManager;
    this.onStepToggle = null;
    this.onSliderChange = null;
    this.onUrlStateChange = null;
    this.lastVisualStep = -1;
    this.activeChord = null;
  }

  /**
   * Initialize the UI
   */
  init() {
    this.createDrumTracks();
    this.createChordTracks();
    this.setupTransportControls();
    this.setupActionButtons();
    this.setupSidebar();
    this.updateJsonEditor();
  }

  /**
   * Create drum track UI
   */
  createDrumTracks() {
    const drumTracksContainer = document.querySelector(".drum-tracks");
    
    INSTRUMENTS.forEach((instrument, index) => {
      const trackRow = this.createDrumTrackRow(instrument, index);
      drumTracksContainer.appendChild(trackRow);
    });
  }

  /**
   * Create a single drum track row
   * @param {Object} instrument 
   * @param {number} index
   * @returns {HTMLElement}
   */
  createDrumTrackRow(instrument, index) {
    const trackRow = document.createElement("div");
    trackRow.classList.add("drum-track");
    trackRow.dataset.instrument = instrument.id;

    // Track Label
    const label = document.createElement("div");
    label.classList.add("track-label");
    label.textContent = instrument.name.toUpperCase().replace("HI-HAT", "HI HAT");
    trackRow.appendChild(label);

    // Track Steps
    const stepsContainer = document.createElement("div");
    stepsContainer.classList.add("track-steps", `track-${index}`);

    for (let i = 0; i < SEQUENCER.STEPS; i++) {
      const step = document.createElement("button");
      step.classList.add("step");
      step.dataset.step = i;
      
      step.addEventListener("click", () => {
        const active = this.stateManager.toggleStep(instrument.id, i);
        step.classList.toggle("active", active);
        
        if (this.onStepToggle) {
          this.onStepToggle(instrument.id, i, active);
        }
        if (this.onUrlStateChange) {
          this.onUrlStateChange();
        }
        this.updateJsonEditor();
      });
      
      stepsContainer.appendChild(step);
    }

    trackRow.appendChild(stepsContainer);
    return trackRow;
  }

  /**
   * Create chord progression tracks
   */
  createChordTracks() {
    const chordSequencerContainer = document.querySelector(".chord-sequencer");
    const chords = ['G', 'D', 'C'];
    
    chords.forEach((chord, index) => {
      const chordTrack = document.createElement("div");
      chordTrack.classList.add("chord-track", `chord-track-${index}`);
      chordTrack.dataset.chord = chord;
      
      for (let i = 0; i < SEQUENCER.STEPS; i++) {
        const step = document.createElement("button");
        step.classList.add("chord-step");
        step.dataset.step = i;
        step.dataset.chord = chord;
        
        step.addEventListener("click", () => {
          // Toggle chord step
          step.classList.toggle("active");
          if (this.onUrlStateChange) {
            this.onUrlStateChange();
          }
          this.updateJsonEditor();
        });
        
        chordTrack.appendChild(step);
      }
      
      chordSequencerContainer.appendChild(chordTrack);
    });

    // Setup chord control buttons
    this.setupChordControls();
  }

  /**
   * Setup chord control buttons
   */
  setupChordControls() {
    const chordButtons = document.querySelectorAll(".chord-btn");
    
    chordButtons.forEach(button => {
      button.addEventListener("click", () => {
        // Toggle active state
        chordButtons.forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");
        
        this.activeChord = button.textContent;
        
        if (this.onUrlStateChange) {
          this.onUrlStateChange();
        }
        this.updateJsonEditor();
      });
    });
  }

  /**
   * Setup transport controls
   */
  setupTransportControls() {
    const playButton = document.getElementById("play-button");
    const stopButton = document.getElementById("stop-button");
    const recordButton = document.getElementById("record-button");

    if (playButton) {
      playButton.addEventListener("click", () => {
        const event = new CustomEvent('transport-play');
        document.dispatchEvent(event);
      });
    }

    if (stopButton) {
      stopButton.addEventListener("click", () => {
        const event = new CustomEvent('transport-stop');
        document.dispatchEvent(event);
      });
    }

    if (recordButton) {
      recordButton.addEventListener("click", () => {
        recordButton.classList.toggle("active");
        // Recording functionality to be implemented
      });
    }

    // Secondary controls
    const loopButton = document.getElementById("loop-button");
    const reverseButton = document.getElementById("reverse-button");
    const settingsButton = document.getElementById("settings-button");

    if (loopButton) {
      loopButton.addEventListener("click", () => {
        loopButton.classList.toggle("active");
        // Loop functionality to be implemented
      });
    }

    if (reverseButton) {
      reverseButton.addEventListener("click", () => {
        // Reverse functionality to be implemented
      });
    }

    if (settingsButton) {
      settingsButton.addEventListener("click", () => {
        document.getElementById("sidebar").classList.toggle("open");
      });
    }
  }

  /**
   * Setup action buttons
   */
  setupActionButtons() {
    const saveButton = document.getElementById("save-button");
    const deleteButton = document.getElementById("delete-button");

    if (saveButton) {
      saveButton.addEventListener("click", () => {
        // Save functionality to be implemented
      });
    }

    if (deleteButton) {
      deleteButton.addEventListener("click", () => {
        this.reset();
      });
    }
  }

  /**
   * Setup sidebar functionality
   */
  setupSidebar() {
    const applyButton = document.getElementById("apply-json-button");

    applyButton.addEventListener("click", () => {
      this.applyJsonState();
    });

    // Setup effect sliders
    this.setupEffectSliders();
  }

  /**
   * Setup effect sliders
   */
  setupEffectSliders() {
    const reverbSliders = document.querySelectorAll(".reverb-slider");
    const delaySliders = document.querySelectorAll(".delay-slider");

    reverbSliders.forEach((slider) => {
      const trackIndex = parseInt(slider.dataset.track);
      if (trackIndex < INSTRUMENTS.length) {
        slider.addEventListener("input", (e) => {
          const instrument = INSTRUMENTS[trackIndex];
          this.audioManager.updateEffect(instrument.id, "reverb", e.target.value);
          
          if (this.onSliderChange) {
            this.onSliderChange(instrument.id, "reverb", e.target.value);
          }
          if (this.onUrlStateChange) {
            this.onUrlStateChange();
          }
          this.updateJsonEditor();
        });
      }
    });

    delaySliders.forEach((slider) => {
      const trackIndex = parseInt(slider.dataset.track);
      if (trackIndex < INSTRUMENTS.length) {
        slider.addEventListener("input", (e) => {
          const instrument = INSTRUMENTS[trackIndex];
          this.audioManager.updateEffect(instrument.id, "delay", e.target.value);
          
          if (this.onSliderChange) {
            this.onSliderChange(instrument.id, "delay", e.target.value);
          }
          if (this.onUrlStateChange) {
            this.onUrlStateChange();
          }
          this.updateJsonEditor();
        });
      }
    });
  }

  /**
   * Update all UI elements from state
   * @param {Object} parsedState 
   */
  updateFromState(parsedState) {
    if (!parsedState) {
      return;
    }

    // Update drum steps
    if (parsedState.notes) {
      Object.keys(parsedState.notes).forEach(instrumentId => {
        const buttons = document.querySelectorAll(
          `.drum-track[data-instrument="${instrumentId}"] .step`
        );
        buttons.forEach((button, i) => {
          button.classList.toggle("active", parsedState.notes[instrumentId][i]);
        });
      });
    }

    // Update sliders
    if (parsedState.sliders) {
      Object.keys(parsedState.sliders).forEach((instrumentId) => {
        const values = parsedState.sliders[instrumentId];
        const instrumentIndex = INSTRUMENTS.findIndex(inst => inst.id === instrumentId);
        
        if (instrumentIndex !== -1) {
          const reverbSlider = document.querySelector(`.reverb-slider[data-track="${instrumentIndex}"]`);
          const delaySlider = document.querySelector(`.delay-slider[data-track="${instrumentIndex}"]`);

          if (reverbSlider && values.reverb !== undefined) {
            reverbSlider.value = values.reverb;
            this.audioManager.updateEffect(instrumentId, "reverb", values.reverb);
          }
          if (delaySlider && values.delay !== undefined) {
            delaySlider.value = values.delay;
            this.audioManager.updateEffect(instrumentId, "delay", values.delay);
          }
        }
      });
    }

    this.updateJsonEditor();
  }

  /**
   * Get current slider values
   * @returns {Object}
   */
  getSliderValues() {
    const values = {};
    
    INSTRUMENTS.forEach((instrument, index) => {
      const reverbSlider = document.querySelector(`.reverb-slider[data-track="${index}"]`);
      const delaySlider = document.querySelector(`.delay-slider[data-track="${index}"]`);
      
      values[instrument.id] = {
        reverb: reverbSlider ? parseInt(reverbSlider.value, 10) : 0,
        delay: delaySlider ? parseInt(delaySlider.value, 10) : 0
      };
    });
    
    return values;
  }

  /**
   * Update JSON editor with current state
   */
  updateJsonEditor() {
    const jsonEditor = document.getElementById("json-editor");
    const currentState = this.stateManager.getStateAsJson(this.getSliderValues());
    
    try {
      const highlightedHtml = this.formatJsonForDisplay(currentState, 0);
      jsonEditor.innerHTML = highlightedHtml;
      jsonEditor.style.borderColor = "#444";
    } catch (error) {
      console.error("Error updating JSON editor:", error);
      jsonEditor.textContent = "Error generating state JSON.";
    }
  }

  /**
   * Format JSON for display with syntax highlighting
   * @param {*} value 
   * @param {number} indentLevel 
   * @param {string} parentKey 
   * @returns {string}
   */
  formatJsonForDisplay(value, indentLevel, parentKey = null) {
    const indent = "  ".repeat(indentLevel);
    const nextIndent = "  ".repeat(indentLevel + 1);
    
    const punc = (char) => {
      let cls = "json-punctuation";
      if (char === "[" || char === "]") cls += " json-punctuation-bracket";
      else if (char === "{" || char === "}") cls += " json-punctuation-brace";
      return `<span class="${cls}">${char}</span>`;
    };

    if (typeof value === "number") {
      const numberClass = (parentKey === "reverb" || parentKey === "delay")
        ? "json-number-effect"
        : "json-number";
      return `<span class="${numberClass}">${value}</span>`;
    } else if (typeof value === "string") {
      return `<span class="json-string">"${value}"</span>`;
    } else if (Array.isArray(value)) {
      if (value.length === 0) return `${punc("[")}${punc("]")}`;
      const items = value.map((item) => this.formatJsonForDisplay(item, 0, null));
      return `${punc("[")}${items.join(punc(",") + " ")}${punc("]")}`;
    } else if (typeof value === "object" && value !== null) {
      const keys = Object.keys(value);
      if (keys.length === 0) return `${punc("{")}${punc("}")}`;

      const items = keys.map((key) => {
        let keyClass = "json-key";
        if (parentKey === null) {
          if (key === "hihat") keyClass += " json-key-hihat";
          else if (key === "snare") keyClass += " json-key-snare";
          else if (key === "kick") keyClass += " json-key-kick";
        }
        const formattedKey = `<span class="${keyClass}">"${key}"</span>`;
        const formattedValue = this.formatJsonForDisplay(value[key], indentLevel + 1, key);
        return `\n${nextIndent}${formattedKey}${punc(":")} ${formattedValue}`;
      });
      return `${punc("{")}${items.join(punc(","))}\n${indent}${punc("}")}`;
    }

    return String(value);
  }

  /**
   * Apply state from JSON editor
   */
  applyJsonState() {
    const jsonEditor = document.getElementById("json-editor");
    let newState;
    
    try {
      newState = JSON.parse(jsonEditor.textContent);
      jsonEditor.style.borderColor = "#444";
    } catch (error) {
      console.error("Invalid JSON entered:", error);
      alert("Invalid JSON format. Please correct and try again.");
      jsonEditor.style.borderColor = "red";
      return;
    }

    const result = this.stateManager.applyJsonState(newState);
    
    if (result.success) {
      this.updateFromState(result.appliedState);
      if (this.onUrlStateChange) {
        this.onUrlStateChange();
      }
      // Successfully applied state from JSON editor
    } else {
      alert(`Error applying JSON state:\n${result.error}`);
      jsonEditor.style.borderColor = "red";
    }
  }

  /**
   * Reset all UI elements
   */
  reset() {
    this.stateManager.reset();
    
    // Reset all drum steps
    document.querySelectorAll(".step").forEach(button => {
      button.classList.remove("active");
    });

    // Reset all chord steps
    document.querySelectorAll(".chord-step").forEach(button => {
      button.classList.remove("active");
    });
    
    // Reset all sliders
    document.querySelectorAll(".effect-slider").forEach((slider) => {
      slider.value = 0;
      const trackIndex = parseInt(slider.dataset.track);
      if (trackIndex < INSTRUMENTS.length) {
        const instrument = INSTRUMENTS[trackIndex];
        const effectType = slider.classList.contains("reverb-slider") ? "reverb" : "delay";
        this.audioManager.updateEffect(instrument.id, effectType, 0);
      }
    });
    
    if (this.onUrlStateChange) {
      this.onUrlStateChange();
    }
    this.updateJsonEditor();
  }

  /**
   * Update playhead visual position
   * @param {number} currentStep 
   */
  updatePlayheadPosition(currentStep) {
    if (currentStep !== this.lastVisualStep) {
      this.clearStepHighlight(this.lastVisualStep);
      this.highlightStep(currentStep);
      this.lastVisualStep = currentStep;
    }
  }

  /**
   * Clear playhead visuals
   */
  clearPlayhead() {
    if (this.lastVisualStep !== -1) {
      this.clearStepHighlight(this.lastVisualStep);
      this.lastVisualStep = -1;
    }
  }

  /**
   * Clear highlight from a step
   * @param {number} stepIndex 
   */
  clearStepHighlight(stepIndex) {
    if (stepIndex < 0) {
      return;
    }
    document
      .querySelectorAll(`.step[data-step="${stepIndex}"], .chord-step[data-step="${stepIndex}"]`)
      .forEach((btn) => btn.classList.remove("current"));
  }

  /**
   * Highlight a step
   * @param {number} stepIndex 
   */
  highlightStep(stepIndex) {
    document
      .querySelectorAll(`.step[data-step="${stepIndex}"], .chord-step[data-step="${stepIndex}"]`)
      .forEach((btn) => btn.classList.add("current"));
  }

  /**
   * Enable/disable play button
   * @param {boolean} enabled 
   */
  setPlayButtonEnabled(enabled) {
    const playButton = document.getElementById("play-button");
    if (playButton) {
      playButton.disabled = !enabled;
    }
  }

  /**
   * Update play button state
   * @param {boolean} isPlaying 
   */
  setPlayButtonState(isPlaying) {
    const playButton = document.getElementById("play-button");
    const stopButton = document.getElementById("stop-button");
    
    if (playButton) {
      playButton.classList.toggle("active", isPlaying);
    }
    if (stopButton) {
      stopButton.classList.toggle("active", !isPlaying);
    }
  }
}