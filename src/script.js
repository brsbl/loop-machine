import { AudioManager } from './audio/index.js';
import { StateManager, UrlStateHandler } from './state/index.js';
import { UIManager, LoadingOverlay, ErrorNotification } from './ui/index.js';
import { Sequencer } from './core/index.js';
import { NetworkStatus } from './utils/index.js';
import { AudioErrorBoundary } from './audio/AudioErrorBoundary.js';

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
    this.loadingOverlay = new LoadingOverlay();
    this.errorNotification = new ErrorNotification();
    this.networkStatus = new NetworkStatus();
    this.audioErrorBoundary = new AudioErrorBoundary();
    
    this.init();
  }

  /**
   * Initialize the application
   */
  async init() {
    console.log("Initializing Loop Machine...");
    
    // Initialize error handling
    this.setupErrorHandling();
    
    // Initialize audio context
    this.audioManager.init();
    
    // Initialize UI components
    this.uiManager.init();
    this.uiManager.setPlayButtonEnabled(false);
    this.errorNotification.init();
    
    // Set up event handlers
    this.setupEventHandlers();
    
    // Set up network monitoring
    this.setupNetworkMonitoring();
    
    // Load audio samples with error recovery
    await this.loadAudioWithRecovery();
    
    // Load state from URL
    this.loadUrlState();
  }

  /**
   * Set up error handling for audio subsystem
   */
  setupErrorHandling() {
    // Set global error handler
    this.audioErrorBoundary.setGlobalHandler((errorInfo) => {
      console.error('Audio error:', errorInfo);
      
      // Show notification for critical errors
      if (errorInfo.context.includes('playSound')) {
        this.errorNotification.showWarning(
          'Playback Error',
          `Failed to play ${errorInfo.context.split('.')[1] || 'sound'}. Using fallback.`
        );
      }
    });

    // Wrap critical audio methods
    this.audioErrorBoundary.wrapMethod(this.audioManager, 'playSound', 'audio');
  }

  /**
   * Set up network status monitoring
   */
  setupNetworkMonitoring() {
    this.networkStatus.addListener((status) => {
      if (status === 'online') {
        this.errorNotification.show(
          'Connection Restored',
          'You are back online. You can retry loading any failed samples.',
          {
            actions: [{
              label: 'Retry Now',
              handler: () => this.retryFailedSamples()
            }]
          }
        );
      } else {
        this.errorNotification.showWarning(
          'Connection Lost',
          'You are offline. Some features may be limited.',
          { persistent: true }
        );
      }
    });
  }

  /**
   * Load audio with error recovery
   */
  async loadAudioWithRecovery() {
    // Show loading overlay
    this.loadingOverlay.show();
    this.loadingOverlay.onRetry = () => this.retryFailedSamples();
    
    try {
      // Check network status first
      if (!this.networkStatus.checkOnlineStatus()) {
        throw new Error('No internet connection');
      }
      
      // Load sounds with progress tracking
      await this.audioManager.loadSounds((progress) => {
        this.loadingOverlay.updateProgress(progress, `Loading audio samples... ${Math.round(progress)}%`);
      });
      
      // Check loading status
      const status = this.audioManager.getLoadingStatus();
      
      if (status.isPartiallyLoaded) {
        // Partial success
        this.loadingOverlay.showPartialSuccess(status.loaded, status.total);
        this.uiManager.setPlayButtonEnabled(true);
        
        // Show warning notification
        this.errorNotification.showWarning(
          'Partial Audio Load',
          `${status.failedInstruments.join(', ')} failed to load. Using synthesized sounds.`,
          {
            actions: [{
              label: 'Try Again',
              handler: () => this.retryFailedSamples()
            }]
          }
        );
        
        // Auto-hide overlay after 3 seconds
        setTimeout(() => this.loadingOverlay.hide(), 3000);
      } else {
        // Full success
        this.loadingOverlay.hide();
        this.uiManager.setPlayButtonEnabled(true);
        console.log("Audio loading complete");
      }
      
    } catch (error) {
      console.error("Failed to load audio:", error);
      
      if (error.message === 'No internet connection') {
        this.loadingOverlay.showError('No internet connection. Please check your connection and retry.');
      } else {
        this.loadingOverlay.showError('Failed to load audio samples. Please retry or continue with limited functionality.');
      }
      
      // Still enable play button if we have some sounds
      if (this.audioManager.getLoadingStatus().loaded > 0) {
        this.uiManager.setPlayButtonEnabled(true);
      }
    }
  }

  /**
   * Retry loading failed samples
   */
  async retryFailedSamples() {
    this.loadingOverlay.updateProgress(0, 'Retrying failed samples...');
    
    try {
      const { success } = await this.audioManager.retryFailedSamples((progress) => {
        this.loadingOverlay.updateProgress(progress, `Retrying... ${Math.round(progress)}%`);
      });
      
      if (success) {
        this.loadingOverlay.hide();
        this.errorNotification.show(
          'Success!',
          'All audio samples loaded successfully.',
          { persistent: false }
        );
      } else {
        const status = this.audioManager.getLoadingStatus();
        this.loadingOverlay.showPartialSuccess(status.loaded, status.total);
        
        setTimeout(() => this.loadingOverlay.hide(), 3000);
      }
    } catch (error) {
      console.error('Retry failed:', error);
      this.loadingOverlay.showError('Retry failed. Please check your connection.');
    }
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
    playButton.addEventListener("click", () => {
      this.sequencer.toggle();
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