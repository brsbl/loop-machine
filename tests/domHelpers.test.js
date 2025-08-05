import { 
  safeQuerySelector, 
  safeGetElementById, 
  safeQuerySelectorAll,
  safeAddEventListener,
  safeSetAttribute,
  safeSetTextContent,
  safeClassListAdd,
  safeClassListRemove 
} from '../src/utils/domHelpers.js';

// Add necessary polyfills for jsdom
global.AudioContext = jest.fn().mockImplementation(() => ({
  createGain: jest.fn(),
  createBiquadFilter: jest.fn(),
  createDelay: jest.fn(),
  createDynamicsCompressor: jest.fn(),
  createAnalyser: jest.fn(),
  createBufferSource: jest.fn(),
  createOscillator: jest.fn(),
  createScriptProcessor: jest.fn(),
  createWaveShaper: jest.fn(),
  currentTime: 0,
  destination: {},
  sampleRate: 44100,
  state: 'running',
  suspend: jest.fn(),
  resume: jest.fn().mockResolvedValue(),
  close: jest.fn()
}));

global.fetch = jest.fn();

describe('DOM Helpers', () => {
  let consoleWarnSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="test-container">
        <button id="test-button" class="btn">Test Button</button>
        <div class="test-class">Test Div 1</div>
        <div class="test-class">Test Div 2</div>
      </div>
    `;
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('safeQuerySelector', () => {
    it('should return element when it exists', () => {
      const element = safeQuerySelector('#test-button');
      expect(element).toBeTruthy();
      expect(element.textContent).toBe('Test Button');
    });

    it('should return null and warn when element does not exist', () => {
      const element = safeQuerySelector('#non-existent');
      expect(element).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith('Element not found: #non-existent');
    });

    it('should throw error when required element is missing', () => {
      expect(() => {
        safeQuerySelector('#non-existent', document, true);
      }).toThrow('Required DOM element not found: #non-existent');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Required element not found: #non-existent');
    });
  });

  describe('safeGetElementById', () => {
    it('should return element when it exists', () => {
      const element = safeGetElementById('test-button');
      expect(element).toBeTruthy();
      expect(element.textContent).toBe('Test Button');
    });

    it('should return null and warn when element does not exist', () => {
      const element = safeGetElementById('non-existent');
      expect(element).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith('Element not found with ID: non-existent');
    });

    it('should throw error when required element is missing', () => {
      expect(() => {
        safeGetElementById('non-existent', true);
      }).toThrow('Required DOM element not found with ID: non-existent');
    });
  });

  describe('safeQuerySelectorAll', () => {
    it('should return NodeList when elements exist', () => {
      const elements = safeQuerySelectorAll('.test-class');
      expect(elements).toHaveLength(2);
      expect(elements[0].textContent).toBe('Test Div 1');
      expect(elements[1].textContent).toBe('Test Div 2');
    });

    it('should return empty NodeList and warn when no elements found', () => {
      const elements = safeQuerySelectorAll('.non-existent');
      expect(elements).toHaveLength(0);
      expect(consoleWarnSpy).toHaveBeenCalledWith('No elements found for selector: .non-existent');
    });
  });

  describe('safeAddEventListener', () => {
    it('should add event listener to existing element', () => {
      const button = document.getElementById('test-button');
      const mockHandler = jest.fn();
      
      const result = safeAddEventListener(button, 'click', mockHandler);
      expect(result).toBe(true);
      
      button.click();
      expect(mockHandler).toHaveBeenCalled();
    });

    it('should return false and warn when element is null', () => {
      const result = safeAddEventListener(null, 'click', jest.fn());
      expect(result).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledWith('Cannot add event listener to null element');
    });
  });

  describe('safeSetAttribute', () => {
    it('should set attribute on existing element', () => {
      const button = document.getElementById('test-button');
      const result = safeSetAttribute(button, 'disabled', 'true');
      
      expect(result).toBe(true);
      expect(button.getAttribute('disabled')).toBe('true');
    });

    it('should return false and warn when element is null', () => {
      const result = safeSetAttribute(null, 'disabled', 'true');
      expect(result).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledWith('Cannot set attribute on null element');
    });
  });

  describe('safeSetTextContent', () => {
    it('should set text content on existing element', () => {
      const button = document.getElementById('test-button');
      const result = safeSetTextContent(button, 'New Text');
      
      expect(result).toBe(true);
      expect(button.textContent).toBe('New Text');
    });

    it('should return false and warn when element is null', () => {
      const result = safeSetTextContent(null, 'New Text');
      expect(result).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledWith('Cannot set text content on null element');
    });
  });

  describe('safeClassListAdd', () => {
    it('should add classes to existing element', () => {
      const button = document.getElementById('test-button');
      const result = safeClassListAdd(button, 'active', 'primary');
      
      expect(result).toBe(true);
      expect(button.classList.contains('active')).toBe(true);
      expect(button.classList.contains('primary')).toBe(true);
    });

    it('should return false and warn when element is null', () => {
      const result = safeClassListAdd(null, 'active');
      expect(result).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledWith('Cannot add classes to null element');
    });
  });

  describe('safeClassListRemove', () => {
    it('should remove classes from existing element', () => {
      const button = document.getElementById('test-button');
      button.classList.add('active', 'primary');
      
      const result = safeClassListRemove(button, 'active');
      
      expect(result).toBe(true);
      expect(button.classList.contains('active')).toBe(false);
      expect(button.classList.contains('primary')).toBe(true);
    });

    it('should return false and warn when element is null', () => {
      const result = safeClassListRemove(null, 'active');
      expect(result).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledWith('Cannot remove classes from null element');
    });
  });
});