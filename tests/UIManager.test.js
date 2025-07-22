import { UIManager } from '../src/ui/UIManager.js';
import { StateManager } from '../src/state/StateManager.js';
import { AudioManager } from '../src/audio/AudioManager.js';
import { INSTRUMENTS, SEQUENCER } from '../src/constants/index.js';

// Mock dependencies
jest.mock('../src/state/StateManager.js');
jest.mock('../src/audio/AudioManager.js');

describe('UIManager', () => {
  let uiManager;
  let stateManager;
  let audioManager;
  let container;

  beforeEach(() => {
    // Set up DOM
    document.body.innerHTML = `
      <div class="instrument-tracks"></div>
      <button id="toggle-sidebar-button">Toggle</button>
      <button id="apply-json-button">Apply</button>
      <button id="reset-button">Reset</button>
      <button id="play-stop-button">Play</button>
      <div id="json-editor"></div>
    `;

    container = document.querySelector('.instrument-tracks');
    
    // Create mock instances
    stateManager = new StateManager();
    audioManager = new AudioManager();
    
    // Mock StateManager methods
    stateManager.toggleStep = jest.fn().mockReturnValue(true);
    stateManager.getStateAsJson = jest.fn().mockReturnValue({
      hihat: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      snare: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      kick: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false]
    });
    stateManager.applyJsonState = jest.fn().mockReturnValue({ success: true, appliedState: {} });
    stateManager.reset = jest.fn();
    
    // Mock AudioManager methods
    audioManager.updateEffect = jest.fn();
    
    uiManager = new UIManager(stateManager, audioManager);
  });

  afterEach(() => {
    // Clean up
    if (uiManager) {
      uiManager.destroy();
    }
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    test('should create UI elements correctly', () => {
      uiManager.init();
      
      // Check that instrument tracks were created
      const tracks = container.querySelectorAll('.instrument-track-row');
      expect(tracks).toHaveLength(INSTRUMENTS.length);
      
      // Check that each track has the correct number of buttons
      tracks.forEach(track => {
        const buttons = track.querySelectorAll('.note-button');
        expect(buttons).toHaveLength(SEQUENCER.STEPS);
      });
    });

    test('should store event listener references', () => {
      uiManager.init();
      
      // Check that event listeners map is populated
      expect(uiManager.eventListeners.size).toBeGreaterThan(0);
    });
  });

  describe('event listener cleanup', () => {
    test('should remove all event listeners on destroy', () => {
      uiManager.init();
      
      // Get references to elements before destroy
      const instrumentTracks = container;
      const sliders = container.querySelectorAll('.effect-slider');
      const toggleButton = document.getElementById('toggle-sidebar-button');
      const applyButton = document.getElementById('apply-json-button');
      const resetButton = document.getElementById('reset-button');
      
      // Add spy on removeEventListener
      instrumentTracks.removeEventListener = jest.fn();
      sliders.forEach(slider => {
        slider.removeEventListener = jest.fn();
      });
      toggleButton.removeEventListener = jest.fn();
      applyButton.removeEventListener = jest.fn();
      resetButton.removeEventListener = jest.fn();
      
      // Destroy UIManager
      uiManager.destroy();
      
      // Check that removeEventListener was called for all elements
      expect(instrumentTracks.removeEventListener).toHaveBeenCalledWith('click', expect.any(Function));
      sliders.forEach(slider => {
        expect(slider.removeEventListener).toHaveBeenCalledWith('input', expect.any(Function));
      });
      expect(toggleButton.removeEventListener).toHaveBeenCalledWith('click', expect.any(Function));
      expect(applyButton.removeEventListener).toHaveBeenCalledWith('click', expect.any(Function));
      expect(resetButton.removeEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });

    test('should clear event listeners map on destroy', () => {
      uiManager.init();
      
      expect(uiManager.eventListeners.size).toBeGreaterThan(0);
      
      uiManager.destroy();
      
      expect(uiManager.eventListeners.size).toBe(0);
    });

    test('should clear callbacks on destroy', () => {
      uiManager.init();
      
      // Set callbacks
      uiManager.onStepToggle = jest.fn();
      uiManager.onSliderChange = jest.fn();
      uiManager.onUrlStateChange = jest.fn();
      
      uiManager.destroy();
      
      expect(uiManager.onStepToggle).toBeNull();
      expect(uiManager.onSliderChange).toBeNull();
      expect(uiManager.onUrlStateChange).toBeNull();
    });

    test('should clear DOM elements on destroy', () => {
      uiManager.init();
      
      expect(container.innerHTML).not.toBe('');
      
      uiManager.destroy();
      
      expect(container.innerHTML).toBe('');
    });
  });

  describe('event handlers functionality', () => {
    test('note button click should trigger state update via event delegation', () => {
      uiManager.init();
      
      const noteButton = container.querySelector('.note-button');
      const clickEvent = new MouseEvent('click', { bubbles: true });
      noteButton.dispatchEvent(clickEvent);
      
      expect(stateManager.toggleStep).toHaveBeenCalled();
    });

    test('slider input should update audio effect', () => {
      uiManager.init();
      
      const slider = container.querySelector('.effect-slider');
      const event = new Event('input');
      Object.defineProperty(event, 'target', { value: { value: '50' } });
      slider.dispatchEvent(event);
      
      expect(audioManager.updateEffect).toHaveBeenCalled();
    });

    test('sidebar toggle should toggle body class', () => {
      uiManager.init();
      
      const toggleButton = document.getElementById('toggle-sidebar-button');
      toggleButton.click();
      
      expect(document.body.classList.contains('sidebar-visible')).toBe(true);
      
      toggleButton.click();
      
      expect(document.body.classList.contains('sidebar-visible')).toBe(false);
    });
  });

  describe('memory leak prevention', () => {
    test('should not accumulate event listeners on multiple init calls', () => {
      // First init
      uiManager.init();
      const firstListenerCount = uiManager.eventListeners.size;
      
      // Destroy and re-init
      uiManager.destroy();
      uiManager.init();
      const secondListenerCount = uiManager.eventListeners.size;
      
      expect(secondListenerCount).toBe(firstListenerCount);
    });

    test('destroyed instance should not respond to events', () => {
      uiManager.init();
      
      const noteButton = container.querySelector('.note-button');
      
      uiManager.destroy();
      
      // Click should not trigger state update after destroy
      noteButton.click();
      
      expect(stateManager.toggleStep).not.toHaveBeenCalled();
    });
  });

  describe('addEventListenerRecord', () => {
    test('should handle null elements gracefully', () => {
      expect(() => {
        uiManager.addEventListenerRecord(null, 'click', jest.fn());
      }).not.toThrow();
    });

    test('should group listeners by key', () => {
      const button1 = document.createElement('button');
      button1.className = 'test-button';
      const button2 = document.createElement('button');
      button2.className = 'test-button';
      
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      uiManager.addEventListenerRecord(button1, 'click', handler1);
      uiManager.addEventListenerRecord(button2, 'click', handler2);
      
      const key = 'BUTTON_test-button_click';
      expect(uiManager.eventListeners.has(key)).toBe(true);
      expect(uiManager.eventListeners.get(key)).toHaveLength(2);
    });
  });
});