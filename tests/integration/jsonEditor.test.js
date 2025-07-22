import { UIManager } from '../../src/ui/UIManager.js';
import { StateManager } from '../../src/state/StateManager.js';
import { AudioManager } from '../../src/audio/AudioManager.js';
import { UrlStateHandler } from '../../src/state/UrlStateHandler.js';

// Mock modules
jest.mock('../../src/audio/AudioManager.js');
jest.mock('../../src/state/UrlStateHandler.js');

describe('JSON Editor Integration Tests', () => {
  let uiManager;
  let stateManager;
  let audioManager;
  let urlStateHandler;

  beforeEach(() => {
    // Set up DOM
    document.body.innerHTML = `
      <div id="sidebar">
        <div class="json-editor-title">JSON State</div>
        <pre><code id="json-editor" contenteditable="true" spellcheck="false"></code></pre>
        <button id="apply-json-button">Apply Changes</button>
      </div>
      <div class="main-container">
        <div class="loop-machine">
          <div class="settings-container">
            <button id="toggle-sidebar-button"></button>
            <button id="reset-button">RESET</button>
          </div>
          <div class="instrument-tracks"></div>
          <div class="controls">
            <div class="slider-container">
              <input type="range" id="bpm-slider" min="60" max="200" value="120">
              <input type="range" id="reverb-slider" min="0" max="100" value="0">
              <input type="range" id="delay-slider" min="0" max="100" value="0">
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Create real StateManager instance
    stateManager = new StateManager();
    
    // Mock audio manager
    audioManager = {
      setReverb: jest.fn(),
      setDelay: jest.fn(),
      init: jest.fn().mockResolvedValue(true),
      playSound: jest.fn()
    };
    
    // Mock URL state handler
    urlStateHandler = {
      updateUrlWithState: jest.fn(),
      getStateFromUrl: jest.fn()
    };
    
    // Create UIManager instance
    uiManager = new UIManager(stateManager, audioManager);
    uiManager.onUrlStateChange = urlStateHandler.updateUrlWithState;
    
    // Initialize UI
    uiManager.init();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  describe('XSS Protection in Real Usage', () => {
    test('should safely display malicious JSON without executing scripts', () => {
      const maliciousState = {
        notes: {
          '<script>alert("XSS")</script>': [true, false],
          'hihat": "test", "extra': [false, true],
          'kick': [true, true]
        },
        bpm: 120,
        reverb: '<img src=x onerror=alert("XSS")>',
        delay: 0
      };

      // Set malicious state
      stateManager.setState(maliciousState);
      
      // Update JSON editor
      uiManager.updateJsonEditor();
      
      const jsonEditor = document.getElementById('json-editor');
      const content = jsonEditor.innerHTML;
      
      // Verify no unescaped script tags
      expect(content).not.toContain('<script>');
      expect(content).not.toContain('</script>');
      expect(content).not.toContain('<img src=x');
      expect(content).not.toContain('onerror=');
      
      // Verify escaped content is present
      expect(content).toContain('&lt;script&gt;');
      expect(content).toContain('&lt;/script&gt;');
      expect(content).toContain('&lt;img');
      
      // Verify no scripts were executed (no console errors or alerts)
      expect(() => {
        const div = document.createElement('div');
        div.innerHTML = content;
      }).not.toThrow();
    });

    test('should handle malicious JSON input when applying state', () => {
      const jsonEditor = document.getElementById('json-editor');
      const applyButton = document.getElementById('apply-json-button');
      
      // Set malicious content in editor
      jsonEditor.textContent = `{
        "notes": {
          "<script>alert('XSS')</script>": [true, false],
          "hihat": [false, true],
          "kick": [true, true]
        },
        "bpm": 120,
        "reverb": 0,
        "delay": 0
      }`;
      
      // Mock console.error to check for parse errors
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Apply the state
      applyButton.click();
      
      // The state should be rejected due to invalid instrument names
      expect(jsonEditor.style.borderColor).toBe('#d85555');
      expect(consoleError).toHaveBeenCalled();
      
      consoleError.mockRestore();
    });
  });

  describe('Normal JSON Editor Functionality', () => {
    test('should display current state correctly', () => {
      const testState = {
        notes: {
          hihat: [true, false, true, false, false, false, false, false, 
                  false, false, false, false, false, false, false, false],
          snare: [false, false, false, false, true, false, false, false,
                  false, false, false, false, true, false, false, false],
          kick:  [true, false, false, false, false, false, true, false,
                  false, false, true, false, false, false, false, false]
        },
        bpm: 140,
        reverb: 30,
        delay: 15
      };

      stateManager.setState(testState);
      uiManager.updateJsonEditor();
      
      const jsonEditor = document.getElementById('json-editor');
      const content = jsonEditor.innerHTML;
      
      // Check for proper structure
      expect(content).toContain('json-key-hihat');
      expect(content).toContain('json-key-snare');
      expect(content).toContain('json-key-kick');
      expect(content).toContain('json-number">140');
      expect(content).toContain('json-number-effect">30');
      expect(content).toContain('json-number-effect">15');
    });

    test('should apply valid JSON state correctly', () => {
      const jsonEditor = document.getElementById('json-editor');
      const applyButton = document.getElementById('apply-json-button');
      
      const newState = {
        notes: {
          hihat: Array(16).fill(false),
          snare: Array(16).fill(false),
          kick: Array(16).fill(true)
        },
        bpm: 180,
        reverb: 50,
        delay: 25
      };
      
      // Set valid JSON in editor
      jsonEditor.textContent = JSON.stringify(newState, null, 2);
      
      // Apply the state
      applyButton.click();
      
      // Verify state was applied
      const currentState = stateManager.getState();
      expect(currentState.notes.kick.every(note => note === true)).toBe(true);
      expect(currentState.bpm).toBe(180);
      expect(currentState.reverb).toBe(50);
      expect(currentState.delay).toBe(25);
      
      // Verify UI was updated
      expect(jsonEditor.style.borderColor).toBe('#d8d8d8');
    });

    test('should handle malformed JSON gracefully', () => {
      const jsonEditor = document.getElementById('json-editor');
      const applyButton = document.getElementById('apply-json-button');
      
      // Set malformed JSON
      jsonEditor.textContent = '{ invalid json }';
      
      // Mock console.error
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Apply the state
      applyButton.click();
      
      // Should show error state
      expect(jsonEditor.style.borderColor).toBe('#d85555');
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('Error parsing JSON:'),
        expect.any(Error)
      );
      
      consoleError.mockRestore();
    });

    test('should preserve formatting while escaping', () => {
      const testState = {
        notes: {
          hihat: [true, false],
          snare: [false, true],
          kick: [true, true]
        },
        bpm: 120,
        reverb: 0,
        delay: 0
      };

      stateManager.setState(testState);
      uiManager.updateJsonEditor();
      
      const jsonEditor = document.getElementById('json-editor');
      const content = jsonEditor.innerHTML;
      
      // Should have proper indentation (via newlines)
      expect(content).toMatch(/\n\s+/);
      
      // Should have syntax highlighting
      expect(content).toContain('class="json-punctuation');
      expect(content).toContain('class="json-key');
      expect(content).toContain('class="json-number');
    });
  });
});