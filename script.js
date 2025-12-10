document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM Content Loaded - Script starting...");
  const instrumentTracksContainer =
    document.querySelector(".instrument-tracks");
  // const playButton = document.getElementById("play-button"); // Remove old ref
  // const stopButton = document.getElementById("stop-button"); // Remove old ref
  const playStopButton = document.getElementById("play-stop-button"); // Corrected ID
  const instrumentsData = [
    { name: "hi hat", id: "hihat", path: "808 Samples/hi hat (30).wav" },
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

  const sidebar = document.getElementById("sidebar");
  const toggleSidebarButton = document.getElementById("toggle-sidebar-button");
  const jsonEditor = document.getElementById("json-editor");
  const applyJsonButton = document.getElementById("apply-json-button");
  const resetButton = document.getElementById("reset-button"); // Added
  console.log("Reset Button Element:", resetButton); // Check if element was found

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
      button.dataset.instrument = instrument.id;
      // Add visual grouping for beats
      if (i % 4 === 0) {
        button.classList.add("beat-start");
      }

      // Accessibility attributes
      button.setAttribute("tabindex", "0");
      button.setAttribute("role", "switch");
      button.setAttribute("aria-pressed", "false");
      button.setAttribute("aria-label", `${instrument.name}, step ${i + 1}`);

      button.addEventListener("click", () => {
        toggleNote(instrument.id, i, button);
      });

      // Keyboard navigation handler
      button.addEventListener("keydown", (e) => {
        handleNoteButtonKeydown(e, instrument.id, i);
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
    reverbSlider.setAttribute("aria-label", `${instrument.name} reverb`);
    reverbSlider.addEventListener("input", (e) => {
      updateEffect(instrument.id, "reverb", e.target.value);
      updateUrlState();
      updateJsonEditor();
    });
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
    delaySlider.setAttribute("aria-label", `${instrument.name} delay`);
    delaySlider.addEventListener("input", (e) => {
      updateEffect(instrument.id, "delay", e.target.value);
      updateUrlState();
      updateJsonEditor();
    });
    delaySliderContainer.appendChild(delaySlider);
    slidersContainer.appendChild(delaySliderContainer);

    trackRow.appendChild(slidersContainer);

    instrumentTracksContainer.appendChild(trackRow);
  });

  // --- Helper Functions for Accessibility ---

  // Toggle note state and update aria-pressed
  function toggleNote(instrumentId, stepIndex, button) {
    sequenceState[instrumentId][stepIndex] = !sequenceState[instrumentId][stepIndex];
    const isActive = sequenceState[instrumentId][stepIndex];
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
    updateUrlState();
    updateJsonEditor();
  }

  // Keyboard navigation for note buttons
  function handleNoteButtonKeydown(e, instrumentId, stepIndex) {
    const button = e.target;
    const allButtons = Array.from(document.querySelectorAll('.note-button'));
    const currentIndex = allButtons.indexOf(button);

    switch (e.key) {
      case ' ':
      case 'Enter':
        e.preventDefault();
        toggleNote(instrumentId, stepIndex, button);
        break;

      case 'ArrowRight':
        e.preventDefault();
        if (currentIndex < allButtons.length - 1) {
          allButtons[currentIndex + 1].focus();
        }
        break;

      case 'ArrowLeft':
        e.preventDefault();
        if (currentIndex > 0) {
          allButtons[currentIndex - 1].focus();
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        // Move to same step in next instrument (16 steps forward)
        if (currentIndex + 16 < allButtons.length) {
          allButtons[currentIndex + 16].focus();
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        // Move to same step in previous instrument (16 steps backward)
        if (currentIndex - 16 >= 0) {
          allButtons[currentIndex - 16].focus();
        }
        break;
    }
  }

  // Update play/stop button aria-label based on state
  function updatePlayStopAriaLabel() {
    const ariaLiveRegion = document.getElementById('playback-announcer');
    if (isPlaying) {
      playStopButton.setAttribute('aria-label', 'Stop playback');
      if (ariaLiveRegion) {
        ariaLiveRegion.textContent = 'Playback started';
      }
    } else {
      playStopButton.setAttribute('aria-label', 'Start playback');
      if (ariaLiveRegion) {
        ariaLiveRegion.textContent = 'Playback stopped';
      }
    }
  }

  // --- URL State Handling (Compact Custom String + Sidebar) ---

  // Helper: Boolean array (16 steps) to 4-char hex string
  function stateToHex(stateArray) {
    const binaryString = stateArray.map((val) => (val ? "1" : "0")).join("");
    return parseInt(binaryString, 2).toString(16).padStart(4, "0");
  }

  // Helper: Convert 4-char hex string back to boolean array (16 steps)
  function hexToState(hexString) {
    if (!hexString || hexString.length !== 4) return Array(steps).fill(false);
    const binaryString = parseInt(hexString, 16)
      .toString(2)
      .padStart(steps, "0");
    return binaryString.split("").map((char) => char === "1");
  }

  // Helper: Convert slider value (0-10) to char ('0'-'9', 'a')
  function valueToChar(val) {
    const num = parseInt(val, 10);
    if (num >= 0 && num <= 9) return String(num);
    if (num === 10) return "a";
    return "0"; // Default fallback
  }

  // Helper: Convert char ('0'-'9', 'a') back to slider value (0-10)
  function charToValue(char) {
    if (char >= "0" && char <= "9") return parseInt(char, 10);
    if (char === "a") return 10;
    return 0; // Default fallback
  }

  // Reads current state (sequencer + sidebar), creates compact string, and updates URL
  function updateUrlState() {
    let notesHex = "";
    let slidersChars = "";

    instrumentsData.forEach((instrument) => {
      // Notes
      notesHex += stateToHex(sequenceState[instrument.id]);
      // Sliders
      const reverbSlider = document.querySelector(
        `.instrument-track-row[data-instrument="${instrument.id}"] .reverb-slider`
      );
      const delaySlider = document.querySelector(
        `.instrument-track-row[data-instrument="${instrument.id}"] .delay-slider`
      );
      slidersChars += valueToChar(reverbSlider ? reverbSlider.value : "0");
      slidersChars += valueToChar(delaySlider ? delaySlider.value : "0");
    });

    const compactState = `${notesHex}_${slidersChars}`;
    const params = new URLSearchParams();
    params.set("s", compactState); // Set sequencer state

    // Add sidebar state
    if (document.body.classList.contains("sidebar-visible")) {
      params.set("sidebar", "1");
    }
    // No need for else, absence means closed

    const newUrl = window.location.pathname + "?" + params.toString();
    window.history.replaceState(null, "", newUrl);
    console.log("URL State Updated:", params.toString());
  }

  // Loads state (sidebar + sequencer) from URL query parameters
  function loadUrlState() {
    console.log("Attempting to load state from URL...");
    const params = new URLSearchParams(window.location.search);

    // --- Load Sidebar State FIRST (doesn't depend on audio) ---
    if (params.get("sidebar") === "1") {
      document.body.classList.add("sidebar-visible");
      console.log("Sidebar state loaded: visible");
    } else {
      document.body.classList.remove("sidebar-visible"); // Ensure it's closed if param absent/0
    }

    // --- Load Sequencer State (checks for audio context/nodes) ---
    if (
      !audioContext ||
      !instrumentsData.every((inst) => effectNodes[inst.id])
    ) {
      console.warn(
        "loadUrlState: Audio context/nodes not ready for sequencer, retrying..."
      );
      setTimeout(loadUrlState, 100);
      return; // Return here, sidebar state is already handled
    }

    const compactState = params.get("s");
    const expectedLength =
      instrumentsData.length * 4 + 1 + instrumentsData.length * 2;

    if (
      compactState &&
      compactState.length === expectedLength &&
      compactState.includes("_")
    ) {
      try {
        const [notesPart, slidersPart] = compactState.split("_");
        let noteOffset = 0;
        let sliderOffset = 0;

        instrumentsData.forEach((instrument) => {
          // Load Notes
          const noteHex = notesPart.substring(noteOffset, noteOffset + 4);
          const loadedNotes = hexToState(noteHex);
          sequenceState[instrument.id] = loadedNotes;
          document
            .querySelectorAll(
              `.instrument-track-row[data-instrument="${instrument.id}"] .note-button`
            )
            .forEach((button, i) => {
              button.classList.toggle("active", loadedNotes[i]);
              button.setAttribute("aria-pressed", loadedNotes[i] ? "true" : "false");
            });
          noteOffset += 4;
          console.log(`Loaded notes for ${instrument.id}: ${noteHex}`);

          // Load Sliders
          const reverbChar = slidersPart[sliderOffset];
          const delayChar = slidersPart[sliderOffset + 1];
          const reverbVal = charToValue(reverbChar);
          const delayVal = charToValue(delayChar);
          sliderOffset += 2;

          const reverbSlider = document.querySelector(
            `.instrument-track-row[data-instrument="${instrument.id}"] .reverb-slider`
          );
          const delaySlider = document.querySelector(
            `.instrument-track-row[data-instrument="${instrument.id}"] .delay-slider`
          );

          if (reverbSlider) {
            reverbSlider.value = reverbVal;
            updateEffect(instrument.id, "reverb", reverbVal);
            console.log(
              `Loaded reverb for ${instrument.id}: ${reverbVal} ('${reverbChar}')`
            );
          }
          if (delaySlider) {
            delaySlider.value = delayVal;
            updateEffect(instrument.id, "delay", delayVal);
            console.log(
              `Loaded delay for ${instrument.id}: ${delayVal} ('${delayChar}')`
            );
          }
        });
        console.log(
          "Finished applying sequencer state from compact URL string."
        );
        updateJsonEditor(); // Update editor after loading state from URL
      } catch (error) {
        console.error(
          "Error loading or parsing compact sequencer state from URL:",
          error
        );
        updateJsonEditor(); // Update editor even if load fails
      }
    } else {
      if (compactState) {
        console.warn(`Invalid compact state string found: ${compactState}`);
      } else {
        console.log("No 's' parameter found in URL for sequencer state.");
      }
      updateJsonEditor(); // Update editor with default state if URL load fails
    }
  }

  // --- Update Effects ---
  function updateEffect(instrumentId, effectType, value) {
    if (!effectNodes[instrumentId]) return;
    const nodes = effectNodes[instrumentId];
    const sliderValue = parseInt(value, 10);

    if (effectType === "reverb") {
      const reverbAmount = sliderValue / 10;
      nodes.reverb.gain.setValueAtTime(reverbAmount, audioContext.currentTime);
      console.log(`${instrumentId} reverb set to ${reverbAmount}`);
    }
    if (effectType === "delay") {
      const delayTime = (sliderValue / 10) * 0.5;
      const feedbackAmount = (sliderValue / 10) * 0.7;
      const wetAmount = (sliderValue / 10) * 0.5;
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
    updatePlayStopAriaLabel(); // Update accessibility attributes
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
    updatePlayStopAriaLabel(); // Update accessibility attributes
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
  // Load state from URL after basic setup and audio init attempt
  loadUrlState();
  // console.log("INIT: Called initAudio() and attempted loadStateFromUrl().");

  // Initialize play/stop button aria-label
  updatePlayStopAriaLabel();

  // --- Sidebar Toggle Logic ---
  toggleSidebarButton.addEventListener("click", () => {
    document.body.classList.toggle("sidebar-visible");
    updateUrlState(); // Update URL when sidebar is toggled
  });

  // --- JSON Editor Functions ---

  // Generates the current state as a structured JSON object FOR EDITOR DISPLAY
  function getCurrentStateAsJson() {
    const currentState = {};
    instrumentsData.forEach((instrument) => {
      const reverbSlider = document.querySelector(
        `.instrument-track-row[data-instrument="${instrument.id}"] .reverb-slider`
      );
      const delaySlider = document.querySelector(
        `.instrument-track-row[data-instrument="${instrument.id}"] .delay-slider`
      );

      // Get the flat boolean state
      const notesState = sequenceState[instrument.id];
      // Create the grouped object with 0/1 for display
      const notesGroupedForDisplay = {
        1: notesState.slice(0, 4).map((v) => (v ? 1 : 0)),
        2: notesState.slice(4, 8).map((v) => (v ? 1 : 0)),
        3: notesState.slice(8, 12).map((v) => (v ? 1 : 0)),
        4: notesState.slice(12, 16).map((v) => (v ? 1 : 0)),
      };

      currentState[instrument.id] = {
        notes: notesGroupedForDisplay, // Use the grouped object for display
        reverb: reverbSlider ? parseInt(reverbSlider.value, 10) : 0,
        delay: delaySlider ? parseInt(delaySlider.value, 10) : 0,
      };
    });
    return currentState;
  }

  // Updates the JSON editor with the current state (formatted, highlighted, specific colors)
  function updateJsonEditor() {
    try {
      const currentState = getCurrentStateAsJson(); // Uses 0/1 for notes

      // Recursive function to build styled HTML string
      function formatValue(value, indentLevel, parentKey = null) {
        const indent = "  ".repeat(indentLevel);
        const nextIndent = "  ".repeat(indentLevel + 1);
        const punc = (char) => {
          let cls = "json-punctuation"; // Default for comma, colon
          if (char === "[" || char === "]") cls += " json-punctuation-bracket";
          else if (char === "{" || char === "}")
            cls += " json-punctuation-brace";
          return `<span class="${cls}">${char}</span>`;
        };

        if (typeof value === "number") {
          const numberClass =
            parentKey === "reverb" || parentKey === "delay"
              ? "json-number-effect" // Navy for effect values
              : "json-number"; // Purple for note values (0/1)
          return `<span class="${numberClass}">${value}</span>`;
        } else if (typeof value === "string") {
          return `<span class="json-string">"${value}"</span>`;
        } else if (Array.isArray(value)) {
          if (value.length === 0) return `${punc("[")}${punc("]")}`;
          const items = value.map((item) => formatValue(item, 0, null));
          return `${punc("[")}${items.join(punc(",") + " ")}${punc("]")}`;
        } else if (typeof value === "object" && value !== null) {
          const keys = Object.keys(value);
          if (keys.length === 0) return `${punc("{")}${punc("}")}`;

          const isTopLevelOrNotesObj =
            parentKey === null || parentKey === "notes";

          const items = keys.map((key) => {
            let keyClass = "json-key"; // Default
            if (parentKey === null) {
              if (key === "hihat") keyClass += " json-key-hihat";
              else if (key === "snare") keyClass += " json-key-snare";
              else if (key === "kick") keyClass += " json-key-kick";
            }
            const formattedKey = `<span class="${keyClass}">"${key}"</span>`;
            const formattedValue = formatValue(
              value[key],
              indentLevel + 1,
              key
            );
            return `\n${nextIndent}${formattedKey}${punc(
              ":"
            )} ${formattedValue}`;
          });
          return `${punc("{")}${items.join(punc(","))}\n${indent}${punc("}")}`;
        }

        return String(value); // Fallback
      }

      const highlightedHtml = formatValue(currentState, 0);
      jsonEditor.innerHTML = highlightedHtml;
      jsonEditor.style.borderColor = "#d8d8d8"; // Reset border
    } catch (error) {
      console.error("Error updating JSON editor:", error);
      jsonEditor.textContent = "Error generating state JSON.";
    }
  }

  // Applies state from the JSON editor
  function applyJsonState() {
    let newState;
    try {
      // Read text content, as innerHTML might contain spans
      newState = JSON.parse(jsonEditor.textContent);
      jsonEditor.style.borderColor = "#d8d8d8"; // Reset border
    } catch (error) {
      console.error("Invalid JSON entered:", error);
      alert("Invalid JSON format. Please correct and try again.");
      jsonEditor.style.borderColor = "red";
      return;
    }

    console.log("Applying state from JSON editor...");
    let stateApplied = false;
    let validationError = null; // Track validation errors

    instrumentsData.forEach((instrument) => {
      if (validationError) return; // Stop processing if an error occurred

      const instState = newState[instrument.id];
      if (instState) {
        // --- Validate and apply notes ---
        if (
          instState.notes &&
          typeof instState.notes === "object" &&
          instState.notes["1"]?.length === 4 &&
          instState.notes["2"]?.length === 4 &&
          instState.notes["3"]?.length === 4 &&
          instState.notes["4"]?.length === 4
        ) {
          try {
            const flattenedNotes = [
              ...instState.notes["1"],
              ...instState.notes["2"],
              ...instState.notes["3"],
              ...instState.notes["4"],
            ];
            if (flattenedNotes.length !== steps)
              throw new Error(
                `Instrument ${instrument.id}: Incorrect total note count.`
              );

            const notesAsBooleans = flattenedNotes.map((val, index) => {
              if (val !== 0 && val !== 1) {
                throw new Error(
                  `Instrument ${
                    instrument.id
                  }, Notes: Invalid value (${val}) at step ${
                    index + 1
                  }. Only 0 or 1 allowed.`
                );
              }
              return val === 1;
            });

            sequenceState[instrument.id] = notesAsBooleans;
            document
              .querySelectorAll(
                `.instrument-track-row[data-instrument="${instrument.id}"] .note-button`
              )
              .forEach((button, i) => {
                button.classList.toggle("active", notesAsBooleans[i]);
                button.setAttribute("aria-pressed", notesAsBooleans[i] ? "true" : "false");
              });
            stateApplied = true;
          } catch (e) {
            validationError = e.message; // Store the first validation error
            console.warn(`Validation Error: ${validationError}`);
          }
        } else {
          validationError = `Instrument ${instrument.id}: Invalid or missing notes structure.`;
          console.warn(validationError);
        }

        if (validationError) return; // Stop processing this instrument if notes failed

        // --- Validate and apply sliders ---
        const reverbSlider = document.querySelector(
          `.instrument-track-row[data-instrument="${instrument.id}"] .reverb-slider`
        );
        const delaySlider = document.querySelector(
          `.instrument-track-row[data-instrument="${instrument.id}"] .delay-slider`
        );

        // Reverb Validation
        if (instState.hasOwnProperty("reverb")) {
          // Check if key exists
          const reverbVal = instState.reverb;
          if (
            typeof reverbVal === "number" &&
            reverbVal >= 0 &&
            reverbVal <= 10
          ) {
            if (reverbSlider) {
              reverbSlider.value = reverbVal;
              updateEffect(instrument.id, "reverb", reverbVal);
              stateApplied = true;
            }
          } else {
            validationError = `Instrument ${instrument.id}, Reverb: Invalid value (${reverbVal}). Must be a number between 0 and 10.`;
            console.warn(validationError);
            if (validationError) return; // Stop this instrument
          }
        } else {
          validationError = `Instrument ${instrument.id}: Missing 'reverb' key.`;
          console.warn(validationError);
          if (validationError) return; // Stop this instrument
        }

        // Delay Validation
        if (instState.hasOwnProperty("delay")) {
          // Check if key exists
          const delayVal = instState.delay;
          if (typeof delayVal === "number" && delayVal >= 0 && delayVal <= 10) {
            if (delaySlider) {
              delaySlider.value = delayVal;
              updateEffect(instrument.id, "delay", delayVal);
              stateApplied = true;
            }
          } else {
            validationError = `Instrument ${instrument.id}, Delay: Invalid value (${delayVal}). Must be a number between 0 and 10.`;
            console.warn(validationError);
            if (validationError) return; // Stop this instrument
          }
        } else {
          validationError = `Instrument ${instrument.id}: Missing 'delay' key.`;
          console.warn(validationError);
          if (validationError) return; // Stop this instrument
        }
      } else {
        validationError = `No data found for instrument ${instrument.id} in JSON.`;
        console.warn(validationError);
      }
    });

    // --- Final Handling ---
    if (validationError) {
      // If any validation failed, show the first error and don't update URL
      alert(`Error applying JSON state: \n${validationError}`);
      jsonEditor.style.borderColor = "red"; // Indicate error on editor
    } else if (stateApplied) {
      // Only update URL and editor if something valid was applied
      console.log("Finished applying valid state from JSON editor.");
      updateUrlState();
      updateJsonEditor();
    } else {
      // JSON was parseable, but structure didn't match or no changes needed
      console.warn(
        "Could not apply any state from the provided JSON (structure mismatch or no changes?)."
      );
      alert("Could not apply state. Check JSON structure and instrument IDs.");
    }
  }

  // Add listener for the Apply button
  applyJsonButton.addEventListener("click", applyJsonState);

  // --- Reset Function ---
  function resetState() {
    console.log("--- RESET BUTTON CLICKED ---");
    console.log("Resetting state...");
    stopLoop(); // Stop playback if running

    instrumentsData.forEach((instrument) => {
      // Reset internal note state
      sequenceState[instrument.id] = Array(steps).fill(false);

      // Reset UI note buttons
      document
        .querySelectorAll(
          `.instrument-track-row[data-instrument="${instrument.id}"] .note-button`
        )
        .forEach((button) => {
          button.classList.remove("active");
          button.setAttribute("aria-pressed", "false");
        });

      // Reset sliders
      const reverbSlider = document.querySelector(
        `.instrument-track-row[data-instrument="${instrument.id}"] .reverb-slider`
      );
      const delaySlider = document.querySelector(
        `.instrument-track-row[data-instrument="${instrument.id}"] .delay-slider`
      );
      if (reverbSlider) {
        reverbSlider.value = 0;
        updateEffect(instrument.id, "reverb", 0); // Update audio node
      }
      if (delaySlider) {
        delaySlider.value = 0;
        updateEffect(instrument.id, "delay", 0); // Update audio node
      }
    });

    updateUrlState(); // Update URL to reflect cleared state
    updateJsonEditor(); // Update JSON editor
    console.log("State reset.");
  }

  // Add listener for the Reset button
  if (resetButton) {
    resetButton.addEventListener("click", resetState);
    console.log("Reset button event listener attached."); // Check if listener was attached
  } else {
    console.error("Could not find reset button element to attach listener.");
  }
});
