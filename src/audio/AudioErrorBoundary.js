/**
 * Error boundary for audio subsystem operations
 */
export class AudioErrorBoundary {
  constructor() {
    this.errorHandlers = new Map();
    this.globalErrorHandler = null;
    this.errorLog = [];
    this.maxLogSize = 50;
  }

  /**
   * Wrap a function with error handling
   * @param {Function} fn - Function to wrap
   * @param {string} context - Context identifier for error tracking
   * @returns {Function} Wrapped function
   */
  wrap(fn, context) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        this.handleError(error, context, { args });
        throw error;
      }
    };
  }

  /**
   * Wrap a method with error handling
   * @param {Object} object - Object containing the method
   * @param {string} methodName - Name of the method to wrap
   * @param {string} context - Context identifier
   */
  wrapMethod(object, methodName, context) {
    const original = object[methodName];
    object[methodName] = this.wrap(original.bind(object), `${context}.${methodName}`);
  }

  /**
   * Handle an error
   * @param {Error} error - The error object
   * @param {string} context - Context where error occurred
   * @param {Object} metadata - Additional error metadata
   */
  handleError(error, context, metadata = {}) {
    const errorInfo = {
      error,
      context,
      metadata,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    };

    // Log error
    this.logError(errorInfo);

    // Call context-specific handler if exists
    const handler = this.errorHandlers.get(context);
    if (handler) {
      try {
        handler(errorInfo);
      } catch (handlerError) {
        console.error('Error in error handler:', handlerError);
      }
    }

    // Call global error handler
    if (this.globalErrorHandler) {
      try {
        this.globalErrorHandler(errorInfo);
      } catch (handlerError) {
        console.error('Error in global error handler:', handlerError);
      }
    }
  }

  /**
   * Register an error handler for a specific context
   * @param {string} context 
   * @param {Function} handler 
   */
  registerHandler(context, handler) {
    this.errorHandlers.set(context, handler);
  }

  /**
   * Set global error handler
   * @param {Function} handler 
   */
  setGlobalHandler(handler) {
    this.globalErrorHandler = handler;
  }

  /**
   * Log error to internal log
   * @param {Object} errorInfo 
   */
  logError(errorInfo) {
    this.errorLog.push(errorInfo);
    
    // Limit log size
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }

    // Console logging
    console.error(`[AudioError] ${errorInfo.context}:`, errorInfo.error, errorInfo.metadata);
  }

  /**
   * Get error log
   * @returns {Array}
   */
  getErrorLog() {
    return [...this.errorLog];
  }

  /**
   * Clear error log
   */
  clearErrorLog() {
    this.errorLog = [];
  }

  /**
   * Get error statistics
   * @returns {Object}
   */
  getErrorStats() {
    const stats = {
      total: this.errorLog.length,
      byContext: {},
      recentErrors: this.errorLog.slice(-5)
    };

    this.errorLog.forEach(entry => {
      if (!stats.byContext[entry.context]) {
        stats.byContext[entry.context] = 0;
      }
      stats.byContext[entry.context]++;
    });

    return stats;
  }

  /**
   * Create a safe audio operation wrapper
   * @param {Function} operation 
   * @param {Object} options 
   * @returns {Promise}
   */
  async safeAudioOperation(operation, options = {}) {
    const {
      context = 'audio-operation',
      fallback = null,
      retries = 0,
      retryDelay = 1000
    } = options;

    let lastError;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        this.handleError(error, context, { attempt, retries });

        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }

    // If all retries failed, use fallback if provided
    if (fallback !== null) {
      console.warn(`Using fallback for ${context} after ${retries + 1} failed attempts`);
      return typeof fallback === 'function' ? fallback() : fallback;
    }

    throw lastError;
  }
}