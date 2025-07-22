import '../src/script.js';

// Mock all dependencies
jest.mock('../src/audio/index.js');
jest.mock('../src/state/index.js');
jest.mock('../src/ui/index.js');
jest.mock('../src/core/index.js');

describe('LoopMachine', () => {
  let loopMachine;
  let mockSequencer;
  let mockUIManager;
  let mockAudioManager;
  let playButton;

  beforeEach(() => {
    // Set up DOM
    document.body.innerHTML = `
      <button id="play-stop-button">Play</button>
      <div class="instrument-tracks"></div>
      <button id="toggle-sidebar-button">Toggle</button>
      <button id="apply-json-button">Apply</button>
      <button id="reset-button">Reset</button>
      <div id="json-editor"></div>
    `;
    
    playButton = document.getElementById('play-stop-button');
    
    // Clear any existing instance
    window.loopMachine = null;
    
    // Trigger DOMContentLoaded to create LoopMachine instance
    const event = new Event('DOMContentLoaded');
    document.dispatchEvent(event);
    
    loopMachine = window.loopMachine;
    
    // Get references to mocked instances
    mockSequencer = loopMachine.sequencer;
    mockUIManager = loopMachine.uiManager;
    mockAudioManager = loopMachine.audioManager;
    
    // Add mock methods
    mockSequencer.stop = jest.fn();
    mockSequencer.toggle = jest.fn();
    mockUIManager.destroy = jest.fn();
  });

  afterEach(() => {
    if (loopMachine) {
      loopMachine.destroy();
    }
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    test('should create all manager instances', () => {
      expect(loopMachine.audioManager).toBeDefined();
      expect(loopMachine.stateManager).toBeDefined();
      expect(loopMachine.uiManager).toBeDefined();
      expect(loopMachine.sequencer).toBeDefined();
      expect(loopMachine.urlStateHandler).toBeDefined();
    });

    test('should store play button handler', () => {
      expect(loopMachine.playButtonHandler).toBeDefined();
      expect(typeof loopMachine.playButtonHandler).toBe('function');
    });
  });

  describe('event handling', () => {
    test('play button click should toggle sequencer', () => {
      playButton.click();
      
      expect(mockSequencer.toggle).toHaveBeenCalled();
    });
  });

  describe('destroy method', () => {
    test('should stop sequencer', () => {
      loopMachine.destroy();
      
      expect(mockSequencer.stop).toHaveBeenCalled();
    });

    test('should remove play button event listener', () => {
      const removeEventListenerSpy = jest.spyOn(playButton, 'removeEventListener');
      
      loopMachine.destroy();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('click', loopMachine.playButtonHandler);
    });

    test('should call UIManager destroy', () => {
      loopMachine.destroy();
      
      expect(mockUIManager.destroy).toHaveBeenCalled();
    });

    test('should call destroy on other managers if available', () => {
      mockAudioManager.destroy = jest.fn();
      mockSequencer.destroy = jest.fn();
      loopMachine.urlStateHandler.destroy = jest.fn();
      
      loopMachine.destroy();
      
      expect(mockAudioManager.destroy).toHaveBeenCalled();
      expect(mockSequencer.destroy).toHaveBeenCalled();
      expect(loopMachine.urlStateHandler.destroy).toHaveBeenCalled();
    });

    test('should handle missing destroy methods gracefully', () => {
      // No destroy methods defined
      delete mockAudioManager.destroy;
      delete mockSequencer.destroy;
      delete loopMachine.urlStateHandler.destroy;
      
      expect(() => {
        loopMachine.destroy();
      }).not.toThrow();
    });

    test('play button should not trigger sequencer after destroy', () => {
      loopMachine.destroy();
      
      // Clear previous calls
      mockSequencer.toggle.mockClear();
      
      // Click should not work after destroy
      playButton.click();
      
      expect(mockSequencer.toggle).not.toHaveBeenCalled();
    });
  });

  describe('memory leak prevention', () => {
    test('multiple destroy calls should be safe', () => {
      expect(() => {
        loopMachine.destroy();
        loopMachine.destroy();
      }).not.toThrow();
    });
  });
});