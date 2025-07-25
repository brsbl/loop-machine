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
    
    this.init();
  }

  /**
   * Initialize the application
   */
  async init() {
    console.log("Initializing Loop Machine...");
    
    // Initialize audio context
    const audioInitialized = this.audioManager.init();
    if (!audioInitialized) {
      console.error("Failed to initialize AudioContext");
      alert("Failed to initialize audio. Your browser may not support Web Audio API.");
      return;
    }
    
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
    
    // Handle transport controls
    document.addEventListener("transport-play", () => {
      if (!this.sequencer.isPlaying) {
        this.sequencer.toggle();
      }
    });
    
    document.addEventListener("transport-stop", () => {
      if (this.sequencer.isPlaying) {
        this.sequencer.toggle();
      }
    });
    
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
}

// Initialize the application when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM Content Loaded - Starting Loop Machine");
  window.loopMachine = new LoopMachine();
});