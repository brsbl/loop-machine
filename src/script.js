import { AudioManager } from './audio/index.js';
import { StateManager, UrlStateHandler } from './state/index.js';
import { UIManager } from './ui/index.js';
import { Sequencer } from './core/index.js';

/**
 * Main application class that coordinates all components
 */
class LoopMachine {
  constructor() {
    this.audioManager = new AudioManager();
    this.stateManager = new StateManager();
    this.uiManager = new UIManager(this.stateManager, this.audioManager);
    this.sequencer = new Sequencer(this.stateManager, this.audioManager, this.uiManager);
    this.urlStateHandler = new UrlStateHandler(this.stateManager, this.uiManager);
    
    // Store event handler for cleanup
    this.playButtonHandler = null;
    
    this.init();
  }

  /**
   * Initialize the application
   */
  async init() {
    console.log("Initializing Loop Machine...");
    
    // Initialize audio context
    this.audioManager.init();
    
    // Initialize UI
    this.uiManager.init();
    this.uiManager.setPlayButtonEnabled(false);
    
    // Set up event handlers
    this.setupEventHandlers();
    
    // Load audio samples
    try {
      await this.audioManager.loadSounds();
      this.uiManager.setPlayButtonEnabled(true);
      console.log("Audio loading complete");
    } catch (error) {
      console.error("Failed to load audio:", error);
      alert("Failed to load audio samples. Please refresh the page.");
      return;
    }
    
    // Load state from URL
    this.loadUrlState();
  }

  /**
   * Set up event handlers for UI callbacks
   */
  setupEventHandlers() {
    // Handle URL state changes
    this.uiManager.onUrlStateChange = () => {
      this.urlStateHandler.updateUrl();
    };
    
    // Handle play/stop button
    const playButton = document.getElementById("play-stop-button");
    this.playButtonHandler = () => {
      this.sequencer.toggle();
    };
    playButton.addEventListener("click", this.playButtonHandler);
    
    // Handle reset functionality in UI
    const originalReset = this.uiManager.reset.bind(this.uiManager);
    this.uiManager.reset = () => {
      this.sequencer.stop();
      originalReset();
    };
  }

  /**
   * Load state from URL with retry logic
   */
  loadUrlState() {
    this.urlStateHandler.loadFromUrl(() => this.loadUrlState());
  }
  
  /**
   * Clean up all resources and event listeners
   */
  destroy() {
    // Stop sequencer if playing
    this.sequencer.stop();
    
    // Remove play button event listener
    const playButton = document.getElementById("play-stop-button");
    if (playButton && this.playButtonHandler) {
      playButton.removeEventListener("click", this.playButtonHandler);
    }
    
    // Clean up UI Manager
    this.uiManager.destroy();
    
    // Clean up other managers if they have destroy methods
    if (this.audioManager.destroy) {
      this.audioManager.destroy();
    }
    if (this.sequencer.destroy) {
      this.sequencer.destroy();
    }
    if (this.urlStateHandler.destroy) {
      this.urlStateHandler.destroy();
    }
  }
}

// Initialize the application when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM Content Loaded - Starting Loop Machine");
  window.loopMachine = new LoopMachine();
});