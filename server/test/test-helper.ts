/**
 * Test helpers
 */

/**
 * Silent console output for test runs
 * Used to avoid noisy error logs during expected error test cases
 */
export function silenceConsoleForTests() {
  // Save original methods to restore later
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  // Mock console methods before tests
  beforeAll(() => {
    console.error = jest.fn();
    console.warn = jest.fn();
  });
  
  // Restore original console methods after tests
  afterAll(() => {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  });
}
