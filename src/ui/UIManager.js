import { INSTRUMENTS, SEQUENCER, EFFECTS } from '../constants/index.js';
import { 
  safeQuerySelector, 
  safeGetElementById, 
  safeQuerySelectorAll,
  safeAddEventListener,
  safeClassListAdd,
  safeClassListRemove 
} from '../utils/domHelpers.js';

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
  }

  /**
   * Initialize the UI
   */
  init() {
    this.createInstrumentTracks();
    this.setupSidebar();
    this.updateJsonEditor();
  }

  /**
   * Create instrument track UI
   */
  createInstrumentTracks() {
    const instrumentTracksContainer = safeQuerySelector(".instrument-tracks", document, true);
    
    if (!instrumentTracksContainer) {
      console.error("Failed to find instrument tracks container");
      return;
    }
    
    INSTRUMENTS.forEach((instrument) => {
      const trackRow = this.createTrackRow(instrument);
      instrumentTracksContainer.appendChild(trackRow);
    });
  }

  /**
   * Create a single track row
   * @param {Object} instrument 
   * @returns {HTMLElement}
   */
  createTrackRow(instrument) {
    const trackRow = document.createElement("div");
    trackRow.classList.add("instrument-track-row");
    trackRow.dataset.instrument = instrument.id;

    // Instrument Label
    const label = document.createElement("div");
    label.classList.add("instrument-label");
    label.textContent = instrument.name;
    trackRow.appendChild(label);

    // Note Buttons Container
    const notesContainer = this.createNotesContainer(instrument);
    trackRow.appendChild(notesContainer);

    // Effects Sliders Container
    const slidersContainer = this.createSlidersContainer(instrument);
    trackRow.appendChild(slidersContainer);

    return trackRow;
  }

  /**
   * Create notes container with buttons
   * @param {Object} instrument 
   * @returns {HTMLElement}
   */
  createNotesContainer(instrument) {
    const notesContainer = document.createElement("div");
    notesContainer.classList.add("notes-container");

    for (let i = 0; i < SEQUENCER.STEPS; i++) {
      const button = document.createElement("button");
      button.classList.add("note-button");
      button.dataset.step = i;
      
      // Add visual grouping for beats
      if (i % SEQUENCER.BEATS_PER_MEASURE === 0) {
        button.classList.add("beat-start");
      }

      button.addEventListener("click", () => {
        const active = this.stateManager.toggleStep(instrument.id, i);
        button.classList.toggle("active", active);
        
        if (this.onStepToggle) {
          this.onStepToggle(instrument.id, i, active);
        }
        if (this.onUrlStateChange) {
          this.onUrlStateChange();
        }
        this.updateJsonEditor();
      });
      
      notesContainer.appendChild(button);
    }

    return notesContainer;
  }

  /**
   * Create sliders container
   * @param {Object} instrument 
   * @returns {HTMLElement}
   */
  createSlidersContainer(instrument) {
    const slidersContainer = document.createElement("div");
    slidersContainer.classList.add("sliders-container");

    // Reverb Slider
    const reverbSlider = this.createSlider(instrument, "reverb");
    slidersContainer.appendChild(reverbSlider);

    // Delay Slider
    const delaySlider = this.createSlider(instrument, "delay");
    slidersContainer.appendChild(delaySlider);

    return slidersContainer;
  }

  /**
   * Create a slider element
   * @param {Object} instrument 
   * @param {string} effectType 
   * @returns {HTMLElement}
   */
  createSlider(instrument, effectType) {
    const sliderContainer = document.createElement("div");
    sliderContainer.classList.add("slider-wrapper");
    
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = EFFECTS.SLIDER_MIN;
    slider.max = EFFECTS.SLIDER_MAX;
    slider.value = 0;
    slider.classList.add("effect-slider", `${effectType}-slider`);
    slider.dataset.effect = effectType;
    
    slider.addEventListener("input", (e) => {
      this.audioManager.updateEffect(instrument.id, effectType, e.target.value);
      
      if (this.onSliderChange) {
        this.onSliderChange(instrument.id, effectType, e.target.value);
      }
      if (this.onUrlStateChange) {
        this.onUrlStateChange();
      }
      this.updateJsonEditor();
    });
    
    sliderContainer.appendChild(slider);
    return sliderContainer;
  }

  /**
   * Setup sidebar functionality
   */
  setupSidebar() {
    const toggleButton = safeGetElementById("toggle-sidebar-button", true);
    const applyButton = safeGetElementById("apply-json-button", true);
    const resetButton = safeGetElementById("reset-button", false);

    if (toggleButton) {
      safeAddEventListener(toggleButton, "click", () => {
        document.body.classList.toggle("sidebar-visible");
        if (this.onUrlStateChange) {
          this.onUrlStateChange();
        }
      });
    }

    if (applyButton) {
      safeAddEventListener(applyButton, "click", () => {
        this.applyJsonState();
      });
    }

    if (resetButton) {
      safeAddEventListener(resetButton, "click", () => {
        this.reset();
      });
    }
  }

  /**
   * Update all UI elements from state
   * @param {Object} parsedState 
   */
  updateFromState(parsedState) {
    if (!parsedState) return;

    // Update note buttons
    if (parsedState.notes) {
      Object.keys(parsedState.notes).forEach(instrumentId => {
        const buttons = safeQuerySelectorAll(
          `.instrument-track-row[data-instrument="${instrumentId}"] .note-button`
        );
        buttons.forEach((button, i) => {
          if (button && parsedState.notes[instrumentId]) {
            button.classList.toggle("active", parsedState.notes[instrumentId][i]);
          }
        });
      });
    }

    // Update sliders
    if (parsedState.sliders) {
      Object.keys(parsedState.sliders).forEach(instrumentId => {
        const values = parsedState.sliders[instrumentId];
        
        const reverbSlider = safeQuerySelector(
          `.instrument-track-row[data-instrument="${instrumentId}"] .reverb-slider`
        );
        const delaySlider = safeQuerySelector(
          `.instrument-track-row[data-instrument="${instrumentId}"] .delay-slider`
        );

        if (reverbSlider && values.reverb !== undefined) {
          reverbSlider.value = values.reverb;
          this.audioManager.updateEffect(instrumentId, "reverb", values.reverb);
        }
        if (delaySlider && values.delay !== undefined) {
          delaySlider.value = values.delay;
          this.audioManager.updateEffect(instrumentId, "delay", values.delay);
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
    
    INSTRUMENTS.forEach((instrument) => {
      const reverbSlider = safeQuerySelector(
        `.instrument-track-row[data-instrument="${instrument.id}"] .reverb-slider`
      );
      const delaySlider = safeQuerySelector(
        `.instrument-track-row[data-instrument="${instrument.id}"] .delay-slider`
      );
      
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
    const jsonEditor = safeGetElementById("json-editor");
    if (!jsonEditor) {
      console.warn("JSON editor element not found");
      return;
    }
    
    const currentState = this.stateManager.getStateAsJson(this.getSliderValues());
    
    try {
      const highlightedHtml = this.formatJsonForDisplay(currentState, 0);
      jsonEditor.innerHTML = highlightedHtml;
      jsonEditor.style.borderColor = "#d8d8d8";
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
    const jsonEditor = safeGetElementById("json-editor");
    if (!jsonEditor) {
      console.error("JSON editor element not found");
      return;
    }
    
    let newState;
    
    try {
      newState = JSON.parse(jsonEditor.textContent);
      jsonEditor.style.borderColor = "#d8d8d8";
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
      console.log("Successfully applied state from JSON editor.");
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
    
    // Reset all note buttons
    safeQuerySelectorAll(".note-button").forEach(button => {
      safeClassListRemove(button, "active");
    });
    
    // Reset all sliders
    safeQuerySelectorAll(".effect-slider").forEach(slider => {
      if (slider) {
        slider.value = 0;
        const trackRow = slider.closest(".instrument-track-row");
        if (trackRow && trackRow.dataset.instrument) {
          const instrumentId = trackRow.dataset.instrument;
          const effectType = slider.dataset.effect;
          this.audioManager.updateEffect(instrumentId, effectType, 0);
        }
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
    if (stepIndex < 0) return;
    safeQuerySelectorAll(`.note-button[data-step="${stepIndex}"]`)
      .forEach((btn) => safeClassListRemove(btn, "playing-step"));
  }

  /**
   * Highlight a step
   * @param {number} stepIndex 
   */
  highlightStep(stepIndex) {
    safeQuerySelectorAll(`.note-button[data-step="${stepIndex}"]`)
      .forEach((btn) => safeClassListAdd(btn, "playing-step"));
  }

  /**
   * Enable/disable play button
   * @param {boolean} enabled 
   */
  setPlayButtonEnabled(enabled) {
    const playButton = safeGetElementById("play-stop-button");
    if (playButton) {
      playButton.disabled = !enabled;
    }
  }

  /**
   * Update play button state
   * @param {boolean} isPlaying 
   */
  setPlayButtonState(isPlaying) {
    const playButton = safeGetElementById("play-stop-button");
    if (playButton) {
      playButton.classList.toggle("playing", isPlaying);
    }
  }
}