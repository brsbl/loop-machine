/**
 * @jest-environment jsdom
 */

import { UrlStateHandler } from '../src/state/index.js';
import { URL_PARAMS } from '../src/constants/index.js';

describe('UrlStateHandler', () => {
  let urlStateHandler;
  let mockStateManager;
  let mockUIManager;
  let mockAudioManager;

  // Save original window.location and history
  const originalLocation = window.location;
  const originalHistory = window.history;

  beforeEach(() => {
    // Mock window.location
    delete window.location;
    window.location = {
      pathname: '/test',
      search: '',
      href: 'http://localhost/test',
    };

    // Mock window.history
    window.history.replaceState = jest.fn();

    // Mock AudioManager
    mockAudioManager = {
      getContext: jest.fn().mockReturnValue({}),
      isReady: jest.fn().mockReturnValue(true),
    };

    // Mock StateManager
    mockStateManager = {
      generateCompactState: jest.fn().mockReturnValue('a00008008000_537000a'),
      parseCompactState: jest.fn().mockReturnValue({
        notes: {
          hihat: new Array(16).fill(false),
          snare: new Array(16).fill(false),
          kick: new Array(16).fill(false),
        },
        sliders: { bpm: 120, reverb: 30, delay: 10 },
      }),
      applyParsedState: jest.fn(),
    };

    // Mock UIManager
    mockUIManager = {
      getSliderValues: jest.fn().mockReturnValue({ bpm: 120, reverb: 30, delay: 10 }),
      updateFromState: jest.fn(),
      audioManager: mockAudioManager,
    };

    // Create UrlStateHandler instance
    urlStateHandler = new UrlStateHandler(mockStateManager, mockUIManager);

    // Mock document.body.classList
    document.body.classList.add = jest.fn();
    document.body.classList.remove = jest.fn();
    document.body.classList.contains = jest.fn().mockReturnValue(false);
  });

  afterEach(() => {
    // Restore window.location and history
    window.location = originalLocation;
    window.history = originalHistory;
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    test('should initialize with correct dependencies', () => {
      expect(urlStateHandler.stateManager).toBe(mockStateManager);
      expect(urlStateHandler.uiManager).toBe(mockUIManager);
    });
  });

  describe('Update URL', () => {
    test('should update URL with compact state', () => {
      urlStateHandler.updateUrl();

      expect(mockUIManager.getSliderValues).toHaveBeenCalled();
      expect(mockStateManager.generateCompactState).toHaveBeenCalledWith({ bpm: 120, reverb: 30, delay: 10 });
      expect(window.history.replaceState).toHaveBeenCalledWith(
        null,
        '',
        '/test?s=a00008008000_537000a'
      );
    });

    test('should include sidebar state when visible', () => {
      document.body.classList.contains.mockReturnValue(true);

      urlStateHandler.updateUrl();

      expect(window.history.replaceState).toHaveBeenCalledWith(
        null,
        '',
        '/test?s=a00008008000_537000a&sidebar=1'
      );
    });

    test('should not include sidebar state when hidden', () => {
      document.body.classList.contains.mockReturnValue(false);

      urlStateHandler.updateUrl();

      expect(window.history.replaceState).toHaveBeenCalledWith(
        null,
        '',
        '/test?s=a00008008000_537000a'
      );
    });
  });

  describe('Load From URL', () => {
    test('should load state from URL successfully', () => {
      window.location.search = '?s=a00008008000_537000a';

      urlStateHandler.loadFromUrl();

      expect(mockStateManager.parseCompactState).toHaveBeenCalledWith('a00008008000_537000a');
      expect(mockStateManager.applyParsedState).toHaveBeenCalled();
      expect(mockUIManager.updateFromState).toHaveBeenCalled();
    });

    test('should load sidebar state when present', () => {
      window.location.search = '?s=a00008008000_537000a&sidebar=1';

      urlStateHandler.loadFromUrl();

      expect(document.body.classList.add).toHaveBeenCalledWith('sidebar-visible');
    });

    test('should remove sidebar class when not present', () => {
      window.location.search = '?s=a00008008000_537000a';

      urlStateHandler.loadFromUrl();

      expect(document.body.classList.remove).toHaveBeenCalledWith('sidebar-visible');
    });

    test('should handle no sequencer state in URL', () => {
      window.location.search = '';
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      urlStateHandler.loadFromUrl();

      expect(consoleSpy).toHaveBeenCalledWith('No sequencer state found in URL');
      expect(mockStateManager.parseCompactState).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should retry when audio not ready', () => {
      window.location.search = '?s=a00008008000_537000a';
      mockAudioManager.isReady.mockReturnValue(false);
      const retryCallback = jest.fn();
      jest.useFakeTimers();
      jest.spyOn(global, 'setTimeout');

      urlStateHandler.loadFromUrl(retryCallback);

      expect(mockStateManager.parseCompactState).not.toHaveBeenCalled();
      expect(global.setTimeout).toHaveBeenCalledWith(expect.any(Function), 100);

      jest.advanceTimersByTime(100);
      expect(retryCallback).toHaveBeenCalled();

      jest.useRealTimers();
    });

    test('should retry when audio context not available', () => {
      window.location.search = '?s=a00008008000_537000a';
      mockAudioManager.getContext.mockReturnValue(null);
      const retryCallback = jest.fn();
      jest.useFakeTimers();
      jest.spyOn(global, 'setTimeout');

      urlStateHandler.loadFromUrl(retryCallback);

      expect(mockStateManager.parseCompactState).not.toHaveBeenCalled();
      expect(global.setTimeout).toHaveBeenCalledWith(expect.any(Function), 100);

      jest.useRealTimers();
    });

    test('should handle invalid compact state', () => {
      window.location.search = '?s=invalid';
      mockStateManager.parseCompactState.mockReturnValue(null);
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      urlStateHandler.loadFromUrl();

      expect(consoleSpy).toHaveBeenCalledWith('Invalid compact state in URL:', 'invalid');
      expect(mockStateManager.applyParsedState).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should handle errors when applying state', () => {
      window.location.search = '?s=a00008008000_537000a';
      mockStateManager.applyParsedState.mockImplementation(() => {
        throw new Error('Test error');
      });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      urlStateHandler.loadFromUrl();

      expect(consoleSpy).toHaveBeenCalledWith('Error applying state from URL:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('Clear URL', () => {
    test('should clear URL parameters', () => {
      window.location.search = '?s=a00008008000_537000a&sidebar=1';

      urlStateHandler.clearUrl();

      expect(window.history.replaceState).toHaveBeenCalledWith(null, '', '/test');
    });
  });

  describe('Integration', () => {
    test('should handle full save and load cycle', () => {
      // Save state to URL
      urlStateHandler.updateUrl();
      
      // Simulate URL change
      const savedUrl = window.history.replaceState.mock.calls[0][2];
      window.location.search = savedUrl.split('?')[1];

      // Clear mocks
      jest.clearAllMocks();

      // Load state from URL
      urlStateHandler.loadFromUrl();

      expect(mockStateManager.parseCompactState).toHaveBeenCalledWith('a00008008000_537000a');
      expect(mockStateManager.applyParsedState).toHaveBeenCalled();
      expect(mockUIManager.updateFromState).toHaveBeenCalled();
    });
  });
});