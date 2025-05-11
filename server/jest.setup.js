// Global Jest setup file

// Mock console methods to prevent noisy output during tests
// This is especially important for expected error cases
beforeAll(() => {
  // Store original implementations
  global.originalConsoleError = console.error;
  global.originalConsoleWarn = console.warn;
  global.originalConsoleLog = console.log;
  
  // Replace with silent mocks during tests
  console.error = jest.fn();
  console.warn = jest.fn();
  console.log = jest.fn();
});

// Restore original console implementations after all tests
afterAll(() => {
  console.error = global.originalConsoleError;
  console.warn = global.originalConsoleWarn;
  console.log = global.originalConsoleLog;
});
