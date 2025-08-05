import { SEQUENCER, STEP_TIME, INSTRUMENTS } from '../constants/index.js';

/**
 * Manages sequencer playback and timing
 */
export class Sequencer {
  constructor(stateManager, audioManager, uiManager) {
    this.stateManager = stateManager;
    this.audioManager = audioManager;
    this.uiManager = uiManager;
    
    this.currentStep = 0;
    this.isPlaying = false;
    this.nextNoteTime = 0.0;
    this.timerID = null;
    this.startTime = null;
    this.animationFrameId = null;
    
    // Track all active timers to ensure proper cleanup
    this.activeTimers = new Set();
    this.activeAnimationFrames = new Set();
  }

  /**
   * Start the sequencer
   */
  async start() {
    if (this.isPlaying) {
      return;
    }
    
    const audioContext = this.audioManager.getContext();
    if (!audioContext) {
      console.error("AudioContext not initialized");
      return;
    }

    if (!this.audioManager.isReady()) {
      console.warn("Audio buffers not loaded yet");
      return;
    }

    // Resume audio context if needed
    if (audioContext.state === 'suspended') {
      await this.audioManager.resume();
    }

    // Starting sequencer
    this.isPlaying = true;
    this.uiManager.setPlayButtonState(true);
    
    this.currentStep = 0;
    this.startTime = audioContext.currentTime;
    this.nextNoteTime = this.startTime;
    
    this.scheduler();
    this.updateVisuals();
  }

  /**
   * Stop the sequencer
   */
  stop() {
    if (!this.isPlaying) {
      return;
    }
    
    // Stopping sequencer
    this.isPlaying = false;
    this.uiManager.setPlayButtonState(false);
    
    // Clear main timer
    if (this.timerID) {
      window.clearTimeout(this.timerID);
      this.timerID = null;
    }
    
    // Clear all active timers
    this.activeTimers.forEach(timerId => {
      window.clearTimeout(timerId);
    });
    this.activeTimers.clear();
    
    // Clear main animation frame
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Clear all active animation frames
    this.activeAnimationFrames.forEach(frameId => {
      cancelAnimationFrame(frameId);
    });
    this.activeAnimationFrames.clear();
    
    this.uiManager.clearPlayhead();
  }

  /**
   * Toggle play/stop
   */
  toggle() {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.start();
    }
  }

  /**
   * Audio scheduling loop
   */
  scheduler() {
    // Check if we should continue
    if (!this.isPlaying) {
      return;
    }
    
    try {
      const audioContext = this.audioManager.getContext();
      if (!audioContext) {
        console.error("AudioContext lost during scheduling");
        this.stop();
        return;
      }
      
      const state = this.stateManager.getState();
      
      while (this.nextNoteTime < audioContext.currentTime + SEQUENCER.SCHEDULE_AHEAD_TIME) {
        // Schedule notes for the current step
        INSTRUMENTS.forEach((instrument) => {
          if (state[instrument.id][this.currentStep]) {
            // Scheduling instrument at specific time
            this.audioManager.playSound(instrument.id, this.nextNoteTime);
          }
        });

        // Advance to the next step
        this.nextNoteTime += STEP_TIME;
        this.currentStep = (this.currentStep + 1) % SEQUENCER.STEPS;
      }
      
      // Only schedule next check if still playing
      if (this.isPlaying) {
        // Clear previous timer from tracking
        if (this.timerID) {
          this.activeTimers.delete(this.timerID);
        }
        
        // Schedule next check
        this.timerID = window.setTimeout(() => this.scheduler(), SEQUENCER.SCHEDULER_INTERVAL);
        this.activeTimers.add(this.timerID);
      }
    } catch (error) {
      console.error("Error in scheduler:", error);
      this.stop();
    }
  }

  /**
   * Visual update loop
   */
  updateVisuals() {
    // Check if we should continue
    if (!this.isPlaying) {
      return;
    }
    
    try {
      const audioContext = this.audioManager.getContext();
      if (!audioContext) {
        console.error("AudioContext lost during visual update");
        this.stop();
        return;
      }
      
      const loopDuration = SEQUENCER.STEPS * STEP_TIME;
      const timeWithinLoop = (audioContext.currentTime - this.startTime) % loopDuration;
      const visualStep = Math.floor(timeWithinLoop / STEP_TIME);
      
      this.uiManager.updatePlayheadPosition(visualStep);
      
      // Only continue the loop if still playing
      if (this.isPlaying) {
        // Clear previous animation frame from tracking
        if (this.animationFrameId) {
          this.activeAnimationFrames.delete(this.animationFrameId);
        }
        
        // Continue the loop
        this.animationFrameId = requestAnimationFrame(() => this.updateVisuals());
        this.activeAnimationFrames.add(this.animationFrameId);
      }
    } catch (error) {
      console.error("Error in updateVisuals:", error);
      this.stop();
    }
  }

  /**
   * Check if sequencer is playing
   * @returns {boolean}
   */
  getIsPlaying() {
    return this.isPlaying;
  }
}