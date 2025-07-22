import { AudioErrorBoundary } from '../src/audio/AudioErrorBoundary.js';

describe('AudioErrorBoundary', () => {
  let errorBoundary;
  let consoleErrorSpy;

  beforeEach(() => {
    errorBoundary = new AudioErrorBoundary();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('wrap', () => {
    it('should wrap function and catch errors', async () => {
      const error = new Error('Test error');
      const failingFn = jest.fn().mockRejectedValue(error);
      const wrapped = errorBoundary.wrap(failingFn, 'test-context');

      await expect(wrapped('arg1', 'arg2')).rejects.toThrow('Test error');
      expect(failingFn).toHaveBeenCalledWith('arg1', 'arg2');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should pass through successful calls', async () => {
      const successFn = jest.fn().mockResolvedValue('success');
      const wrapped = errorBoundary.wrap(successFn, 'test-context');

      const result = await wrapped('arg1');
      expect(result).toBe('success');
      expect(successFn).toHaveBeenCalledWith('arg1');
    });
  });

  describe('wrapMethod', () => {
    it('should wrap object method', async () => {
      const obj = {
        method: jest.fn().mockRejectedValue(new Error('Method error'))
      };

      errorBoundary.wrapMethod(obj, 'method', 'test-object');
      
      await expect(obj.method()).rejects.toThrow('Method error');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AudioError] test-object.method:'),
        expect.any(Error),
        expect.any(Object)
      );
    });
  });

  describe('handleError', () => {
    it('should log errors to internal log', () => {
      const error = new Error('Test error');
      errorBoundary.handleError(error, 'test-context', { extra: 'data' });

      expect(errorBoundary.errorLog).toHaveLength(1);
      expect(errorBoundary.errorLog[0]).toMatchObject({
        error,
        context: 'test-context',
        metadata: { extra: 'data' }
      });
    });

    it('should limit error log size', () => {
      errorBoundary.maxLogSize = 3;

      for (let i = 0; i < 5; i++) {
        errorBoundary.handleError(new Error(`Error ${i}`), 'context');
      }

      expect(errorBoundary.errorLog).toHaveLength(3);
      expect(errorBoundary.errorLog[0].error.message).toBe('Error 2');
    });

    it('should call context-specific handler', () => {
      const handler = jest.fn();
      errorBoundary.registerHandler('specific-context', handler);

      const error = new Error('Test error');
      errorBoundary.handleError(error, 'specific-context');

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          error,
          context: 'specific-context'
        })
      );
    });

    it('should call global handler', () => {
      const globalHandler = jest.fn();
      errorBoundary.setGlobalHandler(globalHandler);

      const error = new Error('Test error');
      errorBoundary.handleError(error, 'any-context');

      expect(globalHandler).toHaveBeenCalled();
    });

    it('should handle errors in error handlers gracefully', () => {
      const failingHandler = jest.fn().mockImplementation(() => {
        throw new Error('Handler error');
      });
      errorBoundary.setGlobalHandler(failingHandler);

      // Should not throw
      expect(() => {
        errorBoundary.handleError(new Error('Original error'), 'context');
      }).not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error in global error handler:',
        expect.any(Error)
      );
    });
  });

  describe('safeAudioOperation', () => {
    it('should execute operation successfully', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      const result = await errorBoundary.safeAudioOperation(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('First fail'))
        .mockResolvedValueOnce('success');

      const result = await errorBoundary.safeAudioOperation(operation, {
        retries: 1,
        retryDelay: 10
      });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should use fallback after all retries fail', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Always fails'));
      const fallback = jest.fn().mockReturnValue('fallback value');

      const result = await errorBoundary.safeAudioOperation(operation, {
        retries: 2,
        retryDelay: 10,
        fallback
      });

      expect(result).toBe('fallback value');
      expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
      expect(fallback).toHaveBeenCalled();
    });

    it('should throw if no fallback provided', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Always fails'));

      await expect(
        errorBoundary.safeAudioOperation(operation, {
          retries: 1,
          retryDelay: 10
        })
      ).rejects.toThrow('Always fails');
    });
  });

  describe('error statistics', () => {
    it('should track error statistics', () => {
      errorBoundary.handleError(new Error('Error 1'), 'context-a');
      errorBoundary.handleError(new Error('Error 2'), 'context-a');
      errorBoundary.handleError(new Error('Error 3'), 'context-b');

      const stats = errorBoundary.getErrorStats();

      expect(stats.total).toBe(3);
      expect(stats.byContext['context-a']).toBe(2);
      expect(stats.byContext['context-b']).toBe(1);
      expect(stats.recentErrors).toHaveLength(3);
    });

    it('should clear error log', () => {
      errorBoundary.handleError(new Error('Error'), 'context');
      expect(errorBoundary.errorLog).toHaveLength(1);

      errorBoundary.clearErrorLog();
      expect(errorBoundary.errorLog).toHaveLength(0);
    });
  });
});