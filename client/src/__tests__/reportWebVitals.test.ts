import reportWebVitals from '../reportWebVitals';
import * as webVitals from 'web-vitals';
import { vi } from 'vitest';

// Mock the web-vitals library
vi.mock('web-vitals', () => ({
  onCLS: vi.fn(),
  onFID: vi.fn(),
  onFCP: vi.fn(),
  onLCP: vi.fn(),
  onTTFB: vi.fn()
}));

// TODO: These tests are primarily to meet code coverage thresholds and can be removed 
// once more substantial application code is implemented and tested.

describe('reportWebVitals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('calls web vitals functions when given a valid function', () => {
    const mockCallback = vi.fn();
    reportWebVitals(mockCallback);

    expect(webVitals.onCLS).toHaveBeenCalledWith(mockCallback);
    expect(webVitals.onFID).toHaveBeenCalledWith(mockCallback);
    expect(webVitals.onFCP).toHaveBeenCalledWith(mockCallback);
    expect(webVitals.onLCP).toHaveBeenCalledWith(mockCallback);
    expect(webVitals.onTTFB).toHaveBeenCalledWith(mockCallback);
  });

  test('does not call web vitals functions when not given a function', () => {
    // @ts-expect-error Testing with invalid input
    reportWebVitals('not a function');

    expect(webVitals.onCLS).not.toHaveBeenCalled();
    expect(webVitals.onFID).not.toHaveBeenCalled();
    expect(webVitals.onFCP).not.toHaveBeenCalled();
    expect(webVitals.onLCP).not.toHaveBeenCalled();
    expect(webVitals.onTTFB).not.toHaveBeenCalled();
  });

  test('does nothing when not given a callback', () => {
    reportWebVitals();
    
    expect(webVitals.onCLS).not.toHaveBeenCalled();
    expect(webVitals.onFID).not.toHaveBeenCalled();
    expect(webVitals.onFCP).not.toHaveBeenCalled();
    expect(webVitals.onLCP).not.toHaveBeenCalled();
    expect(webVitals.onTTFB).not.toHaveBeenCalled();
  });
});
