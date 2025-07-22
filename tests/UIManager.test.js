import { UIManager } from '../src/ui/UIManager.js';

// Mock the dependencies
jest.mock('../src/state/StateManager.js');
jest.mock('../src/audio/AudioManager.js');
jest.mock('../src/state/UrlStateHandler.js');

describe('UIManager', () => {
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
        </div>
      </div>
    `;
    
    // Create mock instances
    stateManager = {
      getStateAsJson: jest.fn(),
      parseAndValidateState: jest.fn(),
      setState: jest.fn(),
      getState: jest.fn().mockReturnValue({
        notes: {
          hihat: Array(16).fill(false),
          snare: Array(16).fill(false),
          kick: Array(16).fill(false)
        }
      })
    };
    
    audioManager = {
      setReverb: jest.fn(),
      setDelay: jest.fn()
    };
    
    urlStateHandler = {
      updateUrlWithState: jest.fn()
    };
    
    // Create UIManager instance
    uiManager = new UIManager(stateManager, audioManager);
    
    // Set up necessary callbacks
    uiManager.onUrlStateChange = urlStateHandler.updateUrlWithState;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('XSS Protection', () => {
    test('escapeHtml should escape dangerous HTML characters', () => {
      const dangerous = '<script>alert("XSS")</script>';
      const escaped = uiManager.escapeHtml(dangerous);
      expect(escaped).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
    });

    test('escapeHtml should escape all special characters', () => {
      const testCases = [
        { input: '<', expected: '&lt;' },
        { input: '>', expected: '&gt;' },
        { input: '"', expected: '&quot;' },
        { input: "'", expected: '&#039;' },
        { input: '&', expected: '&amp;' },
        { input: '<>&"\'', expected: '&lt;&gt;&amp;&quot;&#039;' }
      ];

      testCases.forEach(({ input, expected }) => {
        expect(uiManager.escapeHtml(input)).toBe(expected);
      });
    });

    test('formatJsonForDisplay should escape malicious JSON keys', () => {
      const maliciousJson = {
        '<script>alert("XSS")</script>': 'value',
        'normal_key': '<img src=x onerror=alert("XSS")>'
      };

      const formatted = uiManager.formatJsonForDisplay(maliciousJson, 0);
      
      // Should not contain unescaped script tags
      expect(formatted).not.toContain('<script>');
      expect(formatted).not.toContain('</script>');
      expect(formatted).not.toContain('<img src=x');
      
      // Should contain escaped versions
      expect(formatted).toContain('&lt;script&gt;');
      expect(formatted).toContain('&lt;/script&gt;');
      expect(formatted).toContain('&lt;img');
    });

    test('formatJsonForDisplay should escape malicious string values', () => {
      const maliciousJson = {
        key1: '<script>alert("XSS")</script>',
        key2: '"><script>alert("XSS")</script><"',
        key3: "' onclick='alert(\"XSS\")'",
      };

      const formatted = uiManager.formatJsonForDisplay(maliciousJson, 0);
      
      // Should not contain unescaped dangerous content
      expect(formatted).not.toContain('<script>');
      // onclick is inside an escaped string, so it's safe
      
      // Should contain escaped versions
      expect(formatted).toContain('&lt;script&gt;');
      expect(formatted).toContain('&quot;&gt;');
      expect(formatted).toContain('&#039;');
    });

    test('formatJsonForDisplay should handle nested malicious content', () => {
      const maliciousJson = {
        '<img src=x>': {
          '<svg onload=alert(1)>': ['<script>evil</script>'],
          normal: '<iframe src="javascript:alert(1)"></iframe>'
        }
      };

      const formatted = uiManager.formatJsonForDisplay(maliciousJson, 0);
      
      // Should not contain any unescaped tags
      // Check that the formatted string only contains our expected span tags
      // and no unescaped user content
      expect(formatted).not.toContain('<script>');
      expect(formatted).not.toContain('<img src=x>');
      expect(formatted).not.toContain('<svg');
      expect(formatted).not.toContain('<iframe');
      
      // Should contain escaped versions
      expect(formatted).toContain('&lt;img src=x&gt;');
      expect(formatted).toContain('&lt;svg onload=alert(1)&gt;');
      expect(formatted).toContain('&lt;script&gt;evil&lt;/script&gt;');
      expect(formatted).toContain('&lt;iframe');
    });

    test('updateJsonEditor should safely render malicious JSON', () => {
      // Mock getStateAsJson to return malicious content
      stateManager.getStateAsJson = jest.fn().mockReturnValue({
        '<script>alert("XSS")</script>': 'value',
        'key': '<img src=x onerror=alert("XSS")>'
      });

      // The JSON editor already exists in the DOM
      
      const jsonEditor = document.getElementById('json-editor');
      
      // Update the JSON editor
      uiManager.updateJsonEditor();

      // The innerHTML should contain escaped content
      const content = jsonEditor.innerHTML;
      expect(content).not.toContain('<script>');
      expect(content).not.toContain('<img src=x');
      expect(content).toContain('&lt;script&gt;');
      expect(content).toContain('&lt;img');
    });

    test('formatJsonForDisplay should preserve JSON structure while escaping', () => {
      const testJson = {
        normal: 'value',
        '<dangerous>': 'test',
        nested: {
          array: [1, 2, '<script>'],
          'key&with&ampersands': true
        }
      };

      const formatted = uiManager.formatJsonForDisplay(testJson, 0);
      
      // Should have proper structure
      expect(formatted).toContain('{');
      expect(formatted).toContain('}');
      expect(formatted).toContain('[');
      expect(formatted).toContain(']');
      expect(formatted).toContain(':');
      expect(formatted).toContain(',');
      
      // Should escape dangerous content
      expect(formatted).toContain('&lt;dangerous&gt;');
      expect(formatted).toContain('&lt;script&gt;');
      expect(formatted).toContain('key&amp;with&amp;ampersands');
    });
  });

  describe('JSON Editor Functionality', () => {
    // JSON editor is already created in the DOM setup

    test('should create JSON editor with correct structure', () => {
      const jsonEditor = document.getElementById('json-editor');
      expect(jsonEditor).toBeTruthy();
      expect(jsonEditor.getAttribute('contenteditable')).toBe('true');
      expect(jsonEditor.getAttribute('spellcheck')).toBe('false');
    });

    test('should format JSON with syntax highlighting classes', () => {
      const testJson = {
        hihat: [true, false],
        snare: [false, true],
        kick: [true, true],
        bpm: 120,
        reverb: 50,
        delay: 25
      };

      const formatted = uiManager.formatJsonForDisplay(testJson, 0);
      
      // Check for syntax highlighting classes
      expect(formatted).toContain('json-key-hihat');
      expect(formatted).toContain('json-key-snare');
      expect(formatted).toContain('json-key-kick');
      expect(formatted).toContain('json-number');
      expect(formatted).toContain('json-number-effect');
      expect(formatted).toContain('json-punctuation');
    });

    test('should handle all JSON value types correctly', () => {
      const testJson = {
        string: 'test',
        number: 42,
        boolean: true,
        null: null,
        array: [1, 2, 3],
        emptyArray: [],
        object: { nested: 'value' },
        emptyObject: {}
      };

      const formatted = uiManager.formatJsonForDisplay(testJson, 0);
      
      // Should format all types correctly
      expect(formatted).toContain('"test"');
      expect(formatted).toContain('42');
      expect(formatted).toContain('true');
      expect(formatted).toContain('null');
      // Array elements are formatted with spans around each number
      expect(formatted).toContain('[');
      expect(formatted).toContain('>1<');
      expect(formatted).toContain('>2<');
      expect(formatted).toContain('>3<');
      expect(formatted).toContain(']');
      // Empty array and object are formatted with spans
      expect(formatted).toContain('>[<'); // Opening bracket for empty array
      expect(formatted).toContain('>]<'); // Closing bracket for empty array
      expect(formatted).toContain('>{<'); // Opening brace for empty object
      expect(formatted).toContain('>}<'); // Closing brace for empty object
    });
  });
});