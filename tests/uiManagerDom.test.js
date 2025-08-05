import { UIManager } from '../src/ui/UIManager.js';
import { StateManager } from '../src/state/StateManager.js';
import { AudioManager } from '../src/audio/AudioManager.js';
import '../src/constants/index.js';

describe('UIManager DOM Resilience', () => {
  let uiManager;
  let stateManager;
  let audioManager;
  let consoleWarnSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    stateManager = new StateManager();
    audioManager = new AudioManager();
    uiManager = new UIManager(stateManager, audioManager);
    
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Missing essential elements', () => {
    it('should handle missing instrument tracks container', () => {
      document.body.innerHTML = `
        <button id="play-stop-button">Play</button>
        <button id="toggle-sidebar-button">Toggle</button>
        <button id="apply-json-button">Apply</button>
        <div id="json-editor"></div>
      `;

      expect(() => {
        uiManager.init();
      }).toThrow('Required DOM element not found: .instrument-tracks');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Required element not found: .instrument-tracks');
    });

    it('should handle missing play button', () => {
      document.body.innerHTML = `
        <div class="instrument-tracks"></div>
        <button id="toggle-sidebar-button">Toggle</button>
        <button id="apply-json-button">Apply</button>
        <div id="json-editor"></div>
      `;

      uiManager.init();
      
      // These methods should handle missing play button gracefully
      uiManager.setPlayButtonEnabled(true);
      expect(consoleWarnSpy).toHaveBeenCalledWith('Element not found with ID: play-stop-button');
      
      uiManager.setPlayButtonState(true);
      expect(consoleWarnSpy).toHaveBeenCalledWith('Element not found with ID: play-stop-button');
    });

    it('should handle missing sidebar buttons', () => {
      document.body.innerHTML = `
        <div class="instrument-tracks"></div>
        <div id="json-editor"></div>
      `;

      expect(() => {
        uiManager.init();
      }).toThrow('Required DOM element not found with ID: toggle-sidebar-button');
    });

    it('should handle missing json editor', () => {
      document.body.innerHTML = `
        <div class="instrument-tracks"></div>
        <button id="toggle-sidebar-button">Toggle</button>
        <button id="apply-json-button">Apply</button>
      `;

      uiManager.init();
      
      // updateJsonEditor should handle missing element gracefully
      uiManager.updateJsonEditor();
      expect(consoleWarnSpy).toHaveBeenCalledWith('JSON editor element not found');
    });
  });

  describe('Partial DOM structure', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div class="instrument-tracks">
          <div class="instrument-track-row" data-instrument="kick">
            <div class="note-button" data-step="0"></div>
            <div class="note-button" data-step="1"></div>
          </div>
        </div>
        <button id="play-stop-button">Play</button>
        <button id="toggle-sidebar-button">Toggle</button>
        <button id="apply-json-button">Apply</button>
        <div id="json-editor"></div>
      `;
    });

    it('should handle missing sliders gracefully', () => {
      uiManager.init();
      
      const sliderValues = uiManager.getSliderValues();
      expect(sliderValues.kick).toEqual({ reverb: 0, delay: 0 });
    });

    it('should handle highlight operations on missing elements', () => {
      uiManager.highlightStep(5); // Step that doesn't exist
      expect(consoleWarnSpy).toHaveBeenCalledWith('No elements found for selector: .note-button[data-step="5"]');
      
      uiManager.clearStepHighlight(5);
      expect(consoleWarnSpy).toHaveBeenCalledWith('No elements found for selector: .note-button[data-step="5"]');
    });

    it('should handle reset with partial DOM', () => {
      uiManager.init();
      
      // Add active class to existing button
      const noteButton = document.querySelector('.note-button');
      noteButton.classList.add('active');
      
      uiManager.reset();
      
      // Should remove active class from existing buttons
      expect(noteButton.classList.contains('active')).toBe(false);
      
      // Should have warnings from missing elements
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });

  describe('Dynamic element removal', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div class="instrument-tracks">
          <div class="instrument-track-row" data-instrument="kick">
            <div class="note-button" data-step="0"></div>
            <input class="reverb-slider effect-slider" data-effect="reverb" />
          </div>
        </div>
        <button id="play-stop-button">Play</button>
        <button id="toggle-sidebar-button">Toggle</button>
        <button id="apply-json-button">Apply</button>
        <div id="json-editor"></div>
      `;
      
      uiManager.init();
    });

    it('should handle element removal after initialization', () => {
      // Remove play button after init
      const playButton = document.getElementById('play-stop-button');
      playButton.remove();
      
      // Should handle gracefully
      uiManager.setPlayButtonState(true);
      expect(consoleWarnSpy).toHaveBeenCalledWith('Element not found with ID: play-stop-button');
    });

    it('should handle JSON editor removal', () => {
      // Remove JSON editor after init
      const jsonEditor = document.getElementById('json-editor');
      jsonEditor.remove();
      
      // Should handle gracefully
      uiManager.updateJsonEditor();
      expect(consoleWarnSpy).toHaveBeenCalledWith('JSON editor element not found');
      
      // Apply should also handle gracefully
      uiManager.applyJsonState();
      expect(consoleErrorSpy).toHaveBeenCalledWith('JSON editor element not found');
    });
  });

  describe('Invalid DOM queries', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div class="instrument-tracks"></div>
        <button id="play-stop-button">Play</button>
        <button id="toggle-sidebar-button">Toggle</button>
        <button id="apply-json-button">Apply</button>
        <div id="json-editor"></div>
      `;
      
      uiManager.init();
    });

    it('should handle state updates with non-existent instruments', () => {
      const invalidState = {
        notes: {
          'non-existent-instrument': [true, false, true]
        },
        sliders: {
          'non-existent-instrument': { reverb: 50, delay: 30 }
        }
      };
      
      // Should not throw
      expect(() => {
        uiManager.updateFromState(invalidState);
      }).not.toThrow();
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'No elements found for selector: .instrument-track-row[data-instrument="non-existent-instrument"] .note-button'
      );
    });
  });
});