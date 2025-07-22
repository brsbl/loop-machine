import { NetworkStatus } from '../src/utils/NetworkStatus.js';

describe('NetworkStatus', () => {
  let networkStatus;
  let originalNavigatorOnLine;
  let windowEventListeners;

  beforeEach(() => {
    // Save original state
    originalNavigatorOnLine = Object.getOwnPropertyDescriptor(navigator, 'onLine');
    
    // Track event listeners
    windowEventListeners = {};
    window.addEventListener = jest.fn((event, handler) => {
      windowEventListeners[event] = handler;
    });

    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: true
    });

    networkStatus = new NetworkStatus();
  });

  afterEach(() => {
    // Restore original state
    if (originalNavigatorOnLine) {
      Object.defineProperty(navigator, 'onLine', originalNavigatorOnLine);
    }
  });

  describe('initialization', () => {
    it('should set initial online status', () => {
      expect(networkStatus.isOnline).toBe(true);
    });

    it('should register event listeners', () => {
      expect(window.addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(window.addEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
    });
  });

  describe('checkOnlineStatus', () => {
    it('should return current online status', () => {
      navigator.onLine = true;
      expect(networkStatus.checkOnlineStatus()).toBe(true);

      navigator.onLine = false;
      expect(networkStatus.checkOnlineStatus()).toBe(false);
    });
  });

  describe('event handling', () => {
    it('should update status on online event', () => {
      navigator.onLine = true;
      networkStatus.isOnline = false;

      // Trigger online event
      windowEventListeners.online();

      expect(networkStatus.isOnline).toBe(true);
    });

    it('should update status on offline event', () => {
      navigator.onLine = false;
      networkStatus.isOnline = true;

      // Trigger offline event
      windowEventListeners.offline();

      expect(networkStatus.isOnline).toBe(false);
    });
  });

  describe('listeners', () => {
    it('should add and notify listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      networkStatus.addListener(listener1);
      networkStatus.addListener(listener2);

      // Trigger online event
      windowEventListeners.online();

      expect(listener1).toHaveBeenCalledWith('online');
      expect(listener2).toHaveBeenCalledWith('online');
    });

    it('should remove listeners', () => {
      const listener = jest.fn();

      networkStatus.addListener(listener);
      networkStatus.removeListener(listener);

      // Trigger event
      windowEventListeners.online();

      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle errors in listeners gracefully', () => {
      const errorListener = jest.fn(() => {
        throw new Error('Listener error');
      });
      const goodListener = jest.fn();

      networkStatus.addListener(errorListener);
      networkStatus.addListener(goodListener);

      // Should not throw
      expect(() => {
        windowEventListeners.online();
      }).not.toThrow();

      expect(goodListener).toHaveBeenCalledWith('online');
    });
  });

  describe('testConnectivity', () => {
    let fetchMock;

    beforeEach(() => {
      fetchMock = jest.fn();
      global.fetch = fetchMock;
    });

    it('should return false when offline', async () => {
      navigator.onLine = false;
      const result = await networkStatus.testConnectivity();
      expect(result).toBe(false);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should return true when fetch succeeds', async () => {
      navigator.onLine = true;
      fetchMock.mockResolvedValue({});

      const result = await networkStatus.testConnectivity();
      expect(result).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        window.location.origin,
        expect.objectContaining({
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-cache'
        })
      );
    });

    it('should return false when fetch fails', async () => {
      navigator.onLine = true;
      fetchMock.mockRejectedValue(new Error('Network error'));

      const result = await networkStatus.testConnectivity();
      expect(result).toBe(false);
    });

    it('should test custom URL', async () => {
      navigator.onLine = true;
      fetchMock.mockResolvedValue({});

      const customUrl = 'https://example.com';
      await networkStatus.testConnectivity(customUrl);

      expect(fetchMock).toHaveBeenCalledWith(
        customUrl,
        expect.any(Object)
      );
    });
  });
});