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
  }

  /**
   * Start the sequencer
   */
  async start() {
    if (this.isPlaying) return;
    
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

    console.log("Starting sequencer");
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
    if (!this.isPlaying) return;
    
    console.log("Stopping sequencer");
    this.isPlaying = false;
    this.uiManager.setPlayButtonState(false);
    
    if (this.timerID) {
      window.clearTimeout(this.timerID);
      this.timerID = null;
    }
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
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
    const audioContext = this.audioManager.getContext();
    const state = this.stateManager.getState();
    
    while (this.nextNoteTime < audioContext.currentTime + SEQUENCER.SCHEDULE_AHEAD_TIME) {
      // Schedule notes for the current step
      INSTRUMENTS.forEach((instrument) => {
        if (state[instrument.id][this.currentStep]) {
          console.log(
            `Scheduling ${instrument.id} at step ${this.currentStep}, ` +
            `time ${this.nextNoteTime.toFixed(3)}`
          );
          this.audioManager.playSound(instrument.id, this.nextNoteTime);
        }
      });

      // Advance to the next step
      this.nextNoteTime += STEP_TIME;
      this.currentStep = (this.currentStep + 1) % SEQUENCER.STEPS;
    }
    
    // Schedule next check
    this.timerID = window.setTimeout(() => this.scheduler(), SEQUENCER.SCHEDULER_INTERVAL);
  }

  /**
   * Visual update loop
   */
  updateVisuals() {
    if (!this.isPlaying) return;
    
    const audioContext = this.audioManager.getContext();
    const loopDuration = SEQUENCER.STEPS * STEP_TIME;
    const timeWithinLoop = (audioContext.currentTime - this.startTime) % loopDuration;
    const visualStep = Math.floor(timeWithinLoop / STEP_TIME);
    
    this.uiManager.updatePlayheadPosition(visualStep);
    
    // Continue the loop
    this.animationFrameId = requestAnimationFrame(() => this.updateVisuals());
  }

  /**
   * Check if sequencer is playing
   * @returns {boolean}
   */
  getIsPlaying() {
    return this.isPlaying;
  }
}