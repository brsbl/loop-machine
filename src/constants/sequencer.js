export const SEQUENCER = {
  STEPS: 16,
  BPM: 120,
  SCHEDULE_AHEAD_TIME: 0.1, // How far ahead to schedule audio (sec)
  SCHEDULER_INTERVAL: 25.0, // Check scheduling buffer every 25ms
  BEATS_PER_MEASURE: 4,
};

// Derived values
export const STEP_TIME = 60 / SEQUENCER.BPM / 4; // Time per 16th note