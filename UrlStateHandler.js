import { CONFIG } from './config.js';

/**
 * Handles URL state persistence and loading
 */
export class UrlStateHandler {
  constructor(stateManager, uiManager) {
    this.stateManager = stateManager;
    this.uiManager = uiManager;
  }

  /**
   * Update URL with current state
   */
  updateUrl() {
    const sliderValues = this.uiManager.getSliderValues();
    const compactState = this.stateManager.generateCompactState(sliderValues);
    
    const params = new URLSearchParams();
    params.set(CONFIG.URL_PARAM_SEQUENCER, compactState);
    
    // Add sidebar state
    if (document.body.classList.contains("sidebar-visible")) {
      params.set(CONFIG.URL_PARAM_SIDEBAR, "1");
    }
    
    const newUrl = window.location.pathname + "?" + params.toString();
    window.history.replaceState(null, "", newUrl);
    console.log("URL State Updated:", params.toString());
  }

  /**
   * Load state from URL
   * @param {Function} retryCallback - Function to call if audio not ready
   */
  loadFromUrl(retryCallback) {
    console.log("Loading state from URL...");
    const params = new URLSearchParams(window.location.search);
    
    // Load sidebar state (doesn't depend on audio)
    if (params.get(CONFIG.URL_PARAM_SIDEBAR) === "1") {
      document.body.classList.add("sidebar-visible");
      console.log("Sidebar state loaded: visible");
    } else {
      document.body.classList.remove("sidebar-visible");
    }
    
    // Load sequencer state
    const compactState = params.get(CONFIG.URL_PARAM_SEQUENCER);
    if (!compactState) {
      console.log("No sequencer state found in URL");
      return;
    }
    
    // Check if audio is ready
    if (!this.uiManager.audioManager.getContext() || 
        !this.uiManager.audioManager.isReady()) {
      console.warn("Audio not ready, retrying URL state load...");
      if (retryCallback) {
        setTimeout(() => retryCallback(), 100);
      }
      return;
    }
    
    // Parse and apply state
    const parsedState = this.stateManager.parseCompactState(compactState);
    if (parsedState) {
      try {
        // Apply to state manager
        this.stateManager.applyParsedState(parsedState);
        
        // Update UI
        this.uiManager.updateFromState(parsedState);
        
        console.log("Successfully loaded state from URL");
      } catch (error) {
        console.error("Error applying state from URL:", error);
      }
    } else {
      console.warn("Invalid compact state in URL:", compactState);
    }
  }

  /**
   * Clear URL parameters
   */
  clearUrl() {
    window.history.replaceState(null, "", window.location.pathname);
  }
}