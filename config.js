// Configuration constants for the loop machine
export const CONFIG = {
  // Sequencer settings
  STEPS: 16,
  BPM: 120,
  SCHEDULE_AHEAD_TIME: 0.1, // How far ahead to schedule audio (sec)
  SCHEDULER_INTERVAL: 25.0, // Check scheduling buffer every 25ms
  
  // Effect ranges
  SLIDER_MIN: 0,
  SLIDER_MAX: 10,
  
  // Effect parameters
  REVERB: {
    MAX_AMOUNT: 1.0,
  },
  DELAY: {
    MAX_TIME: 0.5,
    MAX_FEEDBACK: 0.7,
    MAX_WET: 0.5,
  },
  
  // Instrument definitions
  INSTRUMENTS: [
    { name: "hi hat", id: "hihat", path: "808 Samples/hi hat (30).wav" },
    { name: "snare", id: "snare", path: "808 Samples/snare.wav" },
    { name: "kick", id: "kick", path: "808 Samples/kick.wav" },
  ],
  
  // UI Configuration
  BEATS_PER_MEASURE: 4,
  
  // URL State
  URL_PARAM_SEQUENCER: 's',
  URL_PARAM_SIDEBAR: 'sidebar',
};

// Derived values
export const STEP_TIME = 60 / CONFIG.BPM / 4; // Time per 16th note