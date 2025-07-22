import { URL_PARAMS } from '../constants/index.js';

/**
 * Handles URL state persistence and loading
 */
export class UrlStateHandler {
  constructor(stateManager, uiManager) {
    this.stateManager = stateManager;
    this.uiManager = uiManager;
    this.loadRetryTimeout = null;
    this.isLoadingState = false;
    this.updateDebounceTimeout = null;
    this.updateDebounceDelay = 100; // ms
    this.loadCancellationToken = null;
  }

  /**
   * Update URL with current state (debounced)
   */
  updateUrl() {
    // Clear any pending update
    if (this.updateDebounceTimeout) {
      clearTimeout(this.updateDebounceTimeout);
    }
    
    // Debounce the update
    this.updateDebounceTimeout = setTimeout(() => {
      const sliderValues = this.uiManager.getSliderValues();
      const compactState = this.stateManager.generateCompactState(sliderValues);
      
      const params = new URLSearchParams();
      params.set(URL_PARAMS.SEQUENCER, compactState);
      
      // Add sidebar state
      if (document.body.classList.contains("sidebar-visible")) {
        params.set(URL_PARAMS.SIDEBAR, "1");
      }
      
      const newUrl = window.location.pathname + "?" + params.toString();
      window.history.replaceState(null, "", newUrl);
      console.log("URL State Updated:", params.toString());
    }, this.updateDebounceDelay);
  }

  /**
   * Load state from URL
   * @param {Function} retryCallback - Function to call if audio not ready
   * @param {number} maxRetries - Maximum number of retries (default: 50)
   * @param {number} retryCount - Current retry count (internal use)
   */
  loadFromUrl(retryCallback, maxRetries = 50, retryCount = 0) {
    // Create a new cancellation token for this load operation
    const currentToken = { cancelled: false };
    
    // Cancel any previous load operation
    if (this.loadCancellationToken) {
      this.loadCancellationToken.cancelled = true;
    }
    this.loadCancellationToken = currentToken;
    
    // Prevent concurrent loads
    if (this.isLoadingState) {
      console.log("State loading already in progress, skipping...");
      return;
    }
    
    // Clear any pending retry
    if (this.loadRetryTimeout) {
      clearTimeout(this.loadRetryTimeout);
      this.loadRetryTimeout = null;
    }
    
    this.isLoadingState = true;
    
    try {
      console.log("Loading state from URL...");
      const params = new URLSearchParams(window.location.search);
      
      // Load sidebar state (doesn't depend on audio)
      if (params.get(URL_PARAMS.SIDEBAR) === "1") {
        document.body.classList.add("sidebar-visible");
        console.log("Sidebar state loaded: visible");
      } else {
        document.body.classList.remove("sidebar-visible");
      }
      
      // Load sequencer state
      const compactState = params.get(URL_PARAMS.SEQUENCER);
      if (!compactState) {
        console.log("No sequencer state found in URL");
        this.isLoadingState = false;
        return;
      }
      
      // Check if audio is ready
      if (!this.uiManager.audioManager.getContext() || 
          !this.uiManager.audioManager.isReady()) {
        console.warn(`Audio not ready, retrying URL state load... (attempt ${retryCount + 1}/${maxRetries})`);
        
        if (retryCallback && retryCount < maxRetries) {
          this.loadRetryTimeout = setTimeout(() => {
            // Check if this operation was cancelled
            if (currentToken.cancelled) {
              console.log("Load operation was cancelled during retry");
              this.isLoadingState = false;
              return;
            }
            
            this.isLoadingState = false;
            retryCallback(retryCount + 1);
          }, 100);
        } else {
          console.error("Max retries reached or no retry callback provided");
          this.isLoadingState = false;
        }
        return;
      }
      
      // Check if cancelled before applying state
      if (currentToken.cancelled) {
        console.log("Load operation was cancelled before applying state");
        this.isLoadingState = false;
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
    } finally {
      this.isLoadingState = false;
    }
  }

  /**
   * Clear URL parameters
   */
  clearUrl() {
    // Cancel any pending updates
    if (this.updateDebounceTimeout) {
      clearTimeout(this.updateDebounceTimeout);
      this.updateDebounceTimeout = null;
    }
    
    window.history.replaceState(null, "", window.location.pathname);
  }
  
  /**
   * Cancel any pending operations
   */
  cancelPendingOperations() {
    if (this.loadRetryTimeout) {
      clearTimeout(this.loadRetryTimeout);
      this.loadRetryTimeout = null;
    }
    
    if (this.updateDebounceTimeout) {
      clearTimeout(this.updateDebounceTimeout);
      this.updateDebounceTimeout = null;
    }
    
    if (this.loadCancellationToken) {
      this.loadCancellationToken.cancelled = true;
      this.loadCancellationToken = null;
    }
    
    this.isLoadingState = false;
  }
}