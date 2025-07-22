/**
 * Network status monitoring utility
 */
export class NetworkStatus {
  constructor() {
    this.isOnline = navigator.onLine;
    this.listeners = new Set();
    this.initEventListeners();
  }

  /**
   * Initialize network status event listeners
   */
  initEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners('online');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners('offline');
    });
  }

  /**
   * Check if the network is available
   * @returns {boolean}
   */
  checkOnlineStatus() {
    return navigator.onLine;
  }

  /**
   * Add a status change listener
   * @param {Function} callback - Called with status ('online' or 'offline')
   */
  addListener(callback) {
    this.listeners.add(callback);
  }

  /**
   * Remove a status change listener
   * @param {Function} callback 
   */
  removeListener(callback) {
    this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of status change
   * @param {string} status 
   */
  notifyListeners(status) {
    this.listeners.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in network status listener:', error);
      }
    });
  }

  /**
   * Test connectivity by attempting to fetch a resource
   * @param {string} url - URL to test (defaults to current origin)
   * @returns {Promise<boolean>}
   */
  async testConnectivity(url = window.location.origin) {
    if (!this.checkOnlineStatus()) {
      return false;
    }

    try {
      await fetch(url, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}