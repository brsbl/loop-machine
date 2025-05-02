document.addEventListener("DOMContentLoaded", () => {
  const instrumentTracksContainer =
    document.querySelector(".instrument-tracks");
  const playButton = document.getElementById("play-button");
  const stopButton = document.getElementById("stop-button");
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
    // Enable play button only after sounds are loaded (or attempted)
    console.log("LOADSOUNDS: Setting playButton.disabled = false");
    playButton.disabled = false;
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
      playButton.disabled = true; // Ensure play stays disabled
      stopButton.disabled = true;
      return;
    }

    console.log("runScheduler: Starting the loop.");
    isPlaying = true;
    console.log(
      "runScheduler: Setting playButton.disabled=true, stopButton.disabled=false"
    );
    playButton.disabled = true; // Disable play when playing
    stopButton.disabled = false; // Enable stop when playing
    currentStep = 0;
    nextNoteTime = audioContext.currentTime + 0.1; // Start scheduling slightly ahead
    scheduler();
  }

  function startLoop() {
    console.log("STARTLOOP: Entered function. isPlaying:", isPlaying);
    if (isPlaying) return;

    // Ensure context exists first
    if (!audioContext) {
      console.error("STARTLOOP: AudioContext does not exist!");
      return;
    }

    // Check buffers are loaded (can be done here or in runScheduler)
    if (Object.keys(audioBuffers).length < instrumentsData.length) {
      console.warn("STARTLOOP: Audio buffers not loaded yet.");
      playButton.disabled = true;
      stopButton.disabled = true;
      return;
    }

    // Handle context state
    if (audioContext.state === "running") {
      console.log("STARTLOOP: Context already running. Calling runScheduler.");
      runScheduler();
    } else if (audioContext.state === "suspended") {
      console.log("STARTLOOP: Context suspended. Attempting resume...");
      audioContext
        .resume()
        .then(() => {
          console.log("STARTLOOP: Resume successful. Calling runScheduler.");
          runScheduler(); // Call the scheduler AFTER resume completes
        })
        .catch((err) => console.error("Error resuming AudioContext:", err));
    } else {
      console.error(
        `STARTLOOP: AudioContext in unexpected state: ${audioContext.state}`
      );
    }
  }

  function stopLoop() {
    console.log("STOPLOOP: Entered function. isPlaying:", isPlaying);
    if (!isPlaying) return;
    isPlaying = false;
    console.log(
      "STOPLOOP: Setting playButton.disabled=false, stopButton.disabled=true"
    );
    playButton.disabled = false; // Enable play when stopped
    stopButton.disabled = true; // Disable stop when stopped
    window.clearTimeout(timerID);
    // Optional: Stop any currently playing sounds immediately (can cause clicks)
    // instrumentsData.forEach(inst => effectNodes[inst.id]?.mainGain.gain.cancelScheduledValues(audioContext.currentTime));
    console.log("Loop stopped.");
    // Maybe suspend audio context if not needed?
    // if (audioContext) audioContext.suspend();
  }

  // --- Event Listeners ---
  playButton.addEventListener("click", startLoop);
  stopButton.addEventListener("click", stopLoop);

  // Disable play button initially until sounds are loaded
  playButton.disabled = true;
  stopButton.disabled = true; // Also disable stop initially
  console.log(
    "INIT: End of setup. Initial button states: play disabled=",
    playButton.disabled,
    "stop disabled=",
    stopButton.disabled
  );

  // Try to initialize audio context early if possible (might still require user gesture)
  // initAudio(); // OLD Position
  // Better to init on first play click. <== This comment was misleading!

  // Initialize audio immediately after UI setup
  initAudio(); // MOVED HERE
  console.log("INIT: Called initAudio() to start loading sounds."); // ADDED LOG
});
