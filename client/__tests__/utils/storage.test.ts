import { safeSetItem } from '../../src/utils/storage';

const originalSetItem = Storage.prototype.setItem;

describe('safeSetItem', () => {
  let setItemSpy: jest.SpyInstance;
  let clearSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Clear sessionStorage mock and reset spies
    sessionStorage.clear();
    jest.restoreAllMocks();

    setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
    clearSpy = jest.spyOn(Storage.prototype, 'clear');
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('safely stores an item in sessionStorage under normal conditions', () => {
    safeSetItem('test-key', 'test-value');

    expect(setItemSpy).toHaveBeenCalledWith('test-key', 'test-value');
    expect(sessionStorage.getItem('test-key')).toBe('test-value');
    expect(clearSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('clears session storage and retries when setItem throws QuotaExceededError', () => {
    // Make setItem fail with QuotaExceededError on the first call, but succeed on the second
    let callCount = 0;
    setItemSpy.mockImplementation((key, val) => {
      callCount++;
      if (callCount === 1) {
        const quotaError = new Error('Quota exceeded');
        quotaError.name = 'QuotaExceededError';
        throw quotaError;
      }
      // Simulate success on subsequent calls (the retry)
      originalSetItem.call(sessionStorage, key, val);
    });

    safeSetItem('test-key', 'quota-test-value');

    // Should call setItem twice (first time failed, second time retry)
    expect(setItemSpy).toHaveBeenCalledTimes(2);
    expect(clearSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith('Session storage quota exceeded. Clearing old cache.');
    expect(errorSpy).not.toHaveBeenCalled();
    expect(sessionStorage.getItem('test-key')).toBe('quota-test-value');
  });

  it('logs console.error if retry fails after clearing session storage', () => {
    // Make setItem fail with QuotaExceededError every time
    setItemSpy.mockImplementation(() => {
      const quotaError = new Error('Quota exceeded');
      quotaError.name = 'QuotaExceededError';
      throw quotaError;
    });

    safeSetItem('test-key', 'retry-fail-value');

    expect(setItemSpy).toHaveBeenCalledTimes(2); // Initial + Retry
    expect(clearSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith('Session storage quota exceeded. Clearing old cache.');
    expect(errorSpy).toHaveBeenCalled();
    expect(errorSpy.mock.calls[0][0]).toContain('Failed to cache data even after clearing storage:');
  });

  it('does not retry and does not log anything if a non-QuotaExceededError is thrown', () => {
    setItemSpy.mockImplementation(() => {
      const regularError = new Error('Some other storage error');
      regularError.name = 'SecurityError';
      throw regularError;
    });

    safeSetItem('test-key', 'other-error-value');

    expect(setItemSpy).toHaveBeenCalledTimes(1);
    expect(clearSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
