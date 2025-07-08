# Refactoring Guide: Integrating Core Business Logic

This guide shows how to integrate the extracted `audio-engine.js` module into your existing `script.js` file to make the core business logic testable.

## Key Benefits

1. **Testable Business Logic**: Core sequencer, audio, and state management logic can be unit tested without UI dependencies
2. **Separation of Concerns**: Business logic is separated from DOM manipulation
3. **Maintainable Code**: Changes to business logic don't require understanding UI code
4. **Reusable Components**: The engine can be used in different UI contexts

## Integration Steps

### 1. Import the Audio Engine Module

Add this to the top of your `script.js`:

```javascript
import { SequencerEngine, StateSerializer, JsonStateManager } from './audio-engine.js';
```

### 2. Initialize the Engine

Replace the global variables with an engine instance:

```javascript
// Instead of:
// let audioContext;
// let audioBuffers = {};
// let effectNodes = {};
// let sequenceState = {};
// etc...

// Use:
let sequencerEngine;

function initAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    sequencerEngine = new SequencerEngine(audioContext, instrumentsData);
    loadSounds();
  }
}
```

### 3. Update Audio Loading

Replace the loadSounds function to use the engine:

```javascript
async function loadSounds() {
  playStopButton.disabled = true;
  
  for (const instrument of instrumentsData) {
    try {
      const response = await fetch(instrument.path);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Use the engine's method
      await sequencerEngine.loadAudioBuffer(instrument.id, audioBuffer);
      
    } catch (error) {
      console.error(`Error loading sound ${instrument.name}:`, error);
    }
  }
  
  playStopButton.disabled = false;
}
```

### 4. Update State Management

Use the engine's methods for sequence state:

```javascript
// When toggling a note button:
button.addEventListener("click", () => {
  const currentState = sequencerEngine.getSequenceState(instrument.id);
  currentState[i] = !currentState[i];
  sequencerEngine.setSequenceState(instrument.id, currentState);
  
  button.classList.toggle("active", currentState[i]);
  updateUrlState();
  updateJsonEditor();
});
```

### 5. Update Effect Controls

Use the engine's effect methods:

```javascript
reverbSlider.addEventListener("input", (e) => {
  sequencerEngine.updateEffect(instrument.id, "reverb", e.target.value);
  updateUrlState();
  updateJsonEditor();
});
```

### 6. Update URL State Handling

Use the StateSerializer for URL state:

```javascript
function updateUrlState() {
  let notesHex = "";
  let slidersChars = "";
  
  instrumentsData.forEach((instrument) => {
    // Use StateSerializer
    const state = sequencerEngine.getSequenceState(instrument.id);
    notesHex += StateSerializer.stateToHex(state);
    
    // Get slider values from UI
    const reverbSlider = document.querySelector(
      `.instrument-track-row[data-instrument="${instrument.id}"] .reverb-slider`
    );
    const delaySlider = document.querySelector(
      `.instrument-track-row[data-instrument="${instrument.id}"] .delay-slider`
    );
    
    slidersChars += StateSerializer.valueToChar(reverbSlider?.value || "0");
    slidersChars += StateSerializer.valueToChar(delaySlider?.value || "0");
  });
  
  const compactState = `${notesHex}_${slidersChars}`;
  // ... rest of URL update logic
}
```

### 7. Update Playback Logic

Use the engine's playback methods:

```javascript
function scheduler() {
  while (sequencerEngine.nextNoteTime < audioContext.currentTime + sequencerEngine.scheduleAheadTime) {
    // Get notes for current step
    const notesToPlay = sequencerEngine.getNotesForStep(sequencerEngine.currentStep);
    
    // Play each note
    notesToPlay.forEach(instrumentId => {
      sequencerEngine.playSound(instrumentId, sequencerEngine.nextNoteTime);
    });
    
    // Advance to next step
    sequencerEngine.calculateNextStepTime();
  }
  
  timerID = window.setTimeout(scheduler, 25.0);
}
```

### 8. Update JSON State Handling

Use JsonStateManager for JSON operations:

```javascript
function applyJsonState() {
  let newState;
  try {
    newState = JSON.parse(jsonEditor.textContent);
    jsonEditor.style.borderColor = "#d8d8d8";
  } catch (error) {
    console.error("Invalid JSON entered:", error);
    alert("Invalid JSON format. Please correct and try again.");
    jsonEditor.style.borderColor = "red";
    return;
  }
  
  try {
    // Use JsonStateManager
    JsonStateManager.applyJsonState(newState, sequencerEngine, instrumentsData);
    
    // Update UI to reflect new state
    updateUIFromEngine();
    updateUrlState();
    updateJsonEditor();
  } catch (error) {
    alert(`Error applying JSON state: ${error.message}`);
    jsonEditor.style.borderColor = "red";
  }
}
```

## Testing the Refactored Code

After refactoring, you can run the comprehensive tests:

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode for development
npm run test:watch
```

The tests cover:
- Sequencer timing and BPM calculations
- Audio buffer loading and management
- Sequence state management
- Effect processing (reverb/delay)
- State serialization/deserialization
- JSON import/export validation

## Benefits of This Architecture

1. **Unit Testing**: Test complex timing logic without dealing with setTimeout/setInterval
2. **Integration Testing**: Test audio processing without actual audio files
3. **State Management**: Test state persistence without URL manipulation
4. **Effect Processing**: Test audio node connections and parameter changes
5. **Error Handling**: Test edge cases and invalid inputs systematically

This refactoring enables you to maintain high confidence in your core business logic while keeping the UI flexible for future changes.