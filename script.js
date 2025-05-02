document.addEventListener("DOMContentLoaded", () => {
  const instrumentTracksContainer =
    document.querySelector(".instrument-tracks");
  // const playButton = document.getElementById("play-button"); // Remove old ref
  // const stopButton = document.getElementById("stop-button"); // Remove old ref
  const playStopButton = document.getElementById("play-stop-button"); // New ref
  const instrumentsData = [
    { name: "hi hat", id: "hihat", path: "808 Samples/hi hat.wav" },
    { name: "snare", id: "snare", path: "808 Samples/snare.wav" },
    { name: "kick", id: "kick", path: "808 Samples/kick.wav" },
  ];
  const steps = 16;
  const bpm = 120;
  const stepTime = 60 / bpm / 4; // Time per 16th note

  let audioContext;
  let audioBuffers = {};
  let effectNodes = {}; // To store gain, delay, reverb nodes per instrument
  let sequenceState = {};
  let currentStep = 0;
  let isPlaying = false;
  let nextNoteTime = 0.0;
  let scheduleAheadTime = 0.1; // How far ahead to schedule audio (sec)
  let timerID;
  // New variables for visual playhead
  let startTime;
  let lastVisualStep = -1;
  let animationFrameId;

  // --- Initialize Audio Context --- (Must be started by user gesture, e.g., play button)
  function initAudio() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      console.log("AudioContext created.");
      // Load sounds after context is created
      loadSounds();
    }
  }

  // --- Load Audio Samples ---
  async function loadSounds() {
    console.log("Loading sounds...");
    playStopButton.disabled = true; // Ensure disabled while loading
    for (const instrument of instrumentsData) {
      try {
        const response = await fetch(instrument.path);
        const arrayBuffer = await response.arrayBuffer();
        audioBuffers[instrument.id] = await audioContext.decodeAudioData(
          arrayBuffer
        );
        console.log(`Loaded: ${instrument.name}`);
        setupEffectNodes(instrument.id);
      } catch (error) {
        console.error(`Error loading sound ${instrument.name}:`, error);
      }
    }
    console.log("All sounds loaded (or attempted).");
    console.log("LOADSOUNDS: Setting playStopButton.disabled = false");
    playStopButton.disabled = false;
  }

  // --- Setup Gain/Effect Nodes (Initial Setup) ---
  function setupEffectNodes(instrumentId) {
    const gainNode = audioContext.createGain();
    const reverbNode = audioContext.createGain(); // Placeholder for Reverb (Wet Gain)
    const delayNode = audioContext.createDelay(1.0); // Max delay 1 sec
    const feedbackNode = audioContext.createGain(); // Delay feedback
    const delayWetGain = audioContext.createGain(); // Delay Wet amount control

    // Initial settings
    delayNode.delayTime.value = 0;
    feedbackNode.gain.value = 0;
    delayWetGain.gain.value = 0; // Start with dry signal for delay
    reverbNode.gain.value = 0; // Start with dry signal for reverb

    // Connect delay path: gain -> delay -> feedback -> delay
    //                  -> delayWetGain -> main output gain
    gainNode.connect(delayNode);
    delayNode.connect(feedbackNode);
    feedbackNode.connect(delayNode);
    delayNode.connect(delayWetGain);

    // Connect reverb path: gain -> reverbNode -> main output gain
    gainNode.connect(reverbNode);

    // Connect dry path + effect sends to destination
    const mainOutputGain = audioContext.createGain();
    gainNode.connect(mainOutputGain); // Dry Signal
    reverbNode.connect(mainOutputGain);
    delayWetGain.connect(mainOutputGain);

    mainOutputGain.connect(audioContext.destination);

    effectNodes[instrumentId] = {
      mainGain: gainNode,
      reverb: reverbNode,
      delay: delayNode,
      delayFeedback: feedbackNode,
      delayWet: delayWetGain,
      output: mainOutputGain, // Keep reference if needed
    };
    console.log(`Effect nodes created for ${instrumentId}`);
  }

  // --- Build UI ---
  instrumentsData.forEach((instrument) => {
    sequenceState[instrument.id] = Array(steps).fill(false);

    const trackRow = document.createElement("div");
    trackRow.classList.add("instrument-track-row");
    trackRow.dataset.instrument = instrument.id;

    // Instrument Label
    const label = document.createElement("div");
    label.classList.add("instrument-label");
    label.textContent = instrument.name;
    trackRow.appendChild(label);

    // Note Buttons Container
    const notesContainer = document.createElement("div");
    notesContainer.classList.add("notes-container");

    // Note Buttons
    for (let i = 0; i < steps; i++) {
      const button = document.createElement("button");
      button.classList.add("note-button");
      button.dataset.step = i;
      // Add visual grouping for beats
      if (i % 4 === 0) {
        button.classList.add("beat-start");
      }

      button.addEventListener("click", () => {
        const state = !sequenceState[instrument.id][i];
        sequenceState[instrument.id][i] = state;
        button.classList.toggle("active", state);
      });
      notesContainer.appendChild(button);
    }
    trackRow.appendChild(notesContainer);

    // Effects Sliders Container
    const slidersContainer = document.createElement("div");
    slidersContainer.classList.add("sliders-container");

    // Reverb Slider
    const reverbSliderContainer = document.createElement("div");
    reverbSliderContainer.classList.add("slider-wrapper");
    const reverbSlider = document.createElement("input");
    reverbSlider.type = "range";
    reverbSlider.min = 0;
    reverbSlider.max = 10;
    reverbSlider.value = 0;
    reverbSlider.classList.add("effect-slider", "reverb-slider");
    reverbSlider.dataset.effect = "reverb";
    reverbSlider.addEventListener("input", (e) =>
      updateEffect(instrument.id, "reverb", e.target.value)
    );
    reverbSliderContainer.appendChild(reverbSlider);
    slidersContainer.appendChild(reverbSliderContainer);

    // Delay Slider
    const delaySliderContainer = document.createElement("div");
    delaySliderContainer.classList.add("slider-wrapper");
    const delaySlider = document.createElement("input");
    delaySlider.type = "range";
    delaySlider.min = 0;
    delaySlider.max = 10;
    delaySlider.value = 0;
    delaySlider.classList.add("effect-slider", "delay-slider");
    delaySlider.dataset.effect = "delay";
    delaySlider.addEventListener("input", (e) =>
      updateEffect(instrument.id, "delay", e.target.value)
    );
    delaySliderContainer.appendChild(delaySlider);
    slidersContainer.appendChild(delaySliderContainer);

    trackRow.appendChild(slidersContainer);

    instrumentTracksContainer.appendChild(trackRow);
  });

  // --- Update Effects ---
  function updateEffect(instrumentId, effectType, value) {
    if (!effectNodes[instrumentId]) return;
    const nodes = effectNodes[instrumentId];
    const sliderValue = parseInt(value, 10);

    if (effectType === "reverb") {
      // Map slider 0-10 to gain 0-1 (adjust max gain as needed)
      const reverbAmount = sliderValue / 10;
      nodes.reverb.gain.setValueAtTime(reverbAmount, audioContext.currentTime);
      console.log(`${instrumentId} reverb set to ${reverbAmount}`);
      // TODO: Implement actual reverb logic if desired
    }
    if (effectType === "delay") {
      // Map slider 0-10 to delay time (e.g., 0-0.5s) and feedback (e.g., 0-0.7)
      // Simple mapping for now
      const delayTime = (sliderValue / 10) * 0.5; // Max 0.5 seconds delay
      const feedbackAmount = (sliderValue / 10) * 0.7; // Max 70% feedback
      const wetAmount = (sliderValue / 10) * 0.5; // Max 50% wet signal

      nodes.delay.delayTime.setValueAtTime(delayTime, audioContext.currentTime);
      nodes.delayFeedback.gain.setValueAtTime(
        feedbackAmount,
        audioContext.currentTime
      );
      nodes.delayWet.gain.setValueAtTime(wetAmount, audioContext.currentTime);
      console.log(
        `${instrumentId} delay set to time: ${delayTime.toFixed(
          2
        )}s, feedback: ${feedbackAmount.toFixed(2)}`
      );
    }
  }

  // --- Playback Logic ---
  function playSound(instrumentId, time) {
    if (!audioBuffers[instrumentId] || !effectNodes[instrumentId]) {
      console.log(`Buffer or nodes missing for ${instrumentId}`);
      return;
    }
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffers[instrumentId];
    // Connect source to the instrument's gain node (which routes to effects/output)
    source.connect(effectNodes[instrumentId].mainGain);
    source.start(time);
    // console.log(`Playing ${instrumentId} at ${time}`);
  }

  function scheduler() {
    while (nextNoteTime < audioContext.currentTime + scheduleAheadTime) {
      // Schedule notes for the current step
      instrumentsData.forEach((instrument) => {
        if (sequenceState[instrument.id][currentStep]) {
          console.log(
            `Scheduler: Found active note for ${
              instrument.id
            } at step ${currentStep}. Scheduling at time ${nextNoteTime.toFixed(
              3
            )}`
          );
          playSound(instrument.id, nextNoteTime);
        }
      });

      // Advance to the next step and time
      nextNoteTime += stepTime;
      currentStep = (currentStep + 1) % steps;
    }
    timerID = window.setTimeout(scheduler, 25.0); // Check scheduling buffer every 25ms
  }

  // Helper function to contain the core starting logic
  function runScheduler() {
    if (Object.keys(audioBuffers).length < instrumentsData.length) {
      console.warn("runScheduler: Buffers not loaded yet.");
      playStopButton.disabled = true; // Ensure playStopButton is disabled
      return;
    }
    if (isPlaying) return; // Prevent starting if already playing

    console.log("runScheduler: Starting the loop.");
    isPlaying = true;
    playStopButton.classList.add("playing");
    currentStep = 0; // Reset sequence position
    startTime = audioContext.currentTime; // Record start time for visual sync
    nextNoteTime = startTime; // Start scheduling immediately
    lastVisualStep = -1; // Reset visual step tracker
    scheduler(); // Start audio scheduling loop
    requestAnimationFrame(updatePlayheadVisuals); // Start visual loop
  }

  function startLoop() {
    // This function is now less necessary, logic moved to runScheduler and the click handler
    // but we keep it conceptually for now if needed elsewhere.
    // The main logic is now in the click handler.
    console.log("startLoop called (mostly handled by click listener now)");
  }

  function stopLoop() {
    console.log("STOPLOOP: Entered function. isPlaying:", isPlaying);
    if (!isPlaying) return;
    isPlaying = false;
    playStopButton.classList.remove("playing");
    window.clearTimeout(timerID); // Stop audio scheduling
    cancelAnimationFrame(animationFrameId); // Stop visual loop
    // Clear the last highlighted step
    if (lastVisualStep !== -1) {
      clearStepHighlight(lastVisualStep);
    }
    console.log("Loop stopped.");
  }

  function clearStepHighlight(stepIndex) {
    document
      .querySelectorAll(`.note-button[data-step="${stepIndex}"]`)
      .forEach((btn) => {
        btn.classList.remove("playing-step");
      });
  }

  function highlightStep(stepIndex) {
    document
      .querySelectorAll(`.note-button[data-step="${stepIndex}"]`)
      .forEach((btn) => {
        btn.classList.add("playing-step");
      });
  }

  // Visual update loop using requestAnimationFrame
  function updatePlayheadVisuals() {
    if (!isPlaying) return;

    const loopDuration = steps * stepTime;
    const timeWithinLoop =
      (audioContext.currentTime - startTime) % loopDuration;
    const visualStep = Math.floor(timeWithinLoop / stepTime);

    if (visualStep !== lastVisualStep) {
      if (lastVisualStep !== -1) {
        clearStepHighlight(lastVisualStep);
      }
      highlightStep(visualStep);
      lastVisualStep = visualStep;
    }

    // Continue the loop
    animationFrameId = requestAnimationFrame(updatePlayheadVisuals);
  }

  // Single Event Listener for the new button
  playStopButton.addEventListener("click", () => {
    if (isPlaying) {
      stopLoop();
    } else {
      // Logic from the old startLoop, ensuring context is ready/resumed
      console.log("PlayStop Click: Attempting to start.");
      if (!audioContext) {
        console.error("PlayStop Click: AudioContext does not exist!");
        return;
      }
      if (Object.keys(audioBuffers).length < instrumentsData.length) {
        console.warn("PlayStop Click: Audio buffers not loaded yet.");
        return; // Don't start if buffers aren't loaded
      }

      if (audioContext.state === "running") {
        console.log("PlayStop Click: Context running. Calling runScheduler.");
        runScheduler();
      } else if (audioContext.state === "suspended") {
        console.log("PlayStop Click: Context suspended. Attempting resume...");
        audioContext
          .resume()
          .then(() => {
            console.log(
              "PlayStop Click: Resume successful. Calling runScheduler."
            );
            runScheduler();
          })
          .catch((err) => console.error("Error resuming AudioContext:", err));
      } else {
        console.error(
          `PlayStop Click: AudioContext in unexpected state: ${audioContext.state}`
        );
      }
    }
  });

  // Disable button initially until sounds are loaded
  // playButton.disabled = true; // Remove old logic
  // stopButton.disabled = true; // Remove old logic
  playStopButton.disabled = true; // Disable the new button initially
  // console.log("INIT: End of setup. Initial button states: play disabled=", playButton.disabled, "stop disabled=", stopButton.disabled); // Remove old log
  console.log(
    "INIT: End of setup. Initial button state: playStop disabled=",
    playStopButton.disabled
  );

  // Initialize audio immediately after UI setup
  initAudio();
  // console.log("INIT: Called initAudio() to start loading sounds."); // Keep or remove as needed
});
