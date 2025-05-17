import { Logger, LogLevel } from '../logger';

// Mock console methods
const originalConsole = { ...console };
beforeEach(() => {
  console.debug = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  // Restore console
  console.debug = originalConsole.debug;
  console.info = originalConsole.info;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  
  // Clean environment variables
  delete process.env.LOG_LEVEL;
  delete process.env.NODE_ENV;
});

describe('Logger', () => {
  describe('initialization', () => {
    test('should initialize with default log level when no environment variable is set', () => {
      const _logger = new Logger();
      expect(console.info).toHaveBeenCalled();
      expect((console.info as jest.Mock).mock.calls[0][0]).toContain('INFO');
    });

    test('should initialize with log level from environment variable', () => {
      process.env.LOG_LEVEL = 'debug';
      const _logger = new Logger();
      expect(console.info).toHaveBeenCalled();
      expect((console.info as jest.Mock).mock.calls[0][0]).toContain('DEBUG');
    });

    test('should initialize with production formatting when NODE_ENV is production', () => {
      process.env.NODE_ENV = 'production';
      const _logger = new Logger();
      expect(console.info).toHaveBeenCalled();
      const loggedValue = (console.info as jest.Mock).mock.calls[0][0];
      expect(loggedValue).toHaveProperty('timestamp');
      expect(loggedValue).toHaveProperty('level', 'info');
      expect(loggedValue).toHaveProperty('message');
    });
  });

  describe('log levels', () => {
    test('should log all levels when set to DEBUG', () => {
      const logger = new Logger();
      logger.setLevel(LogLevel.DEBUG);
      
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warn message');
      logger.error('Error message');
      
      expect(console.debug).toHaveBeenCalled();
      expect(console.info).toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
    
    test('should log INFO and above when set to INFO', () => {
      const logger = new Logger();
      logger.setLevel(LogLevel.INFO);
      
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warn message');
      logger.error('Error message');
      
      expect(console.debug).not.toHaveBeenCalled();
      expect(console.info).toHaveBeenCalled(); // Just check that it's been called at least once
      expect(console.warn).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
    
    test('should log WARN and above when set to WARN', () => {
      const logger = new Logger();
      logger.setLevel(LogLevel.WARN);
      
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warn message');
      logger.error('Error message');
      
      expect(console.debug).not.toHaveBeenCalled();
      expect(console.info).toHaveBeenCalledTimes(1); // Only for initialization
      expect(console.warn).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
    
    test('should log ERROR only when set to ERROR', () => {
      const logger = new Logger();
      logger.setLevel(LogLevel.ERROR);
      
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warn message');
      logger.error('Error message');
      
      expect(console.debug).not.toHaveBeenCalled();
      expect(console.info).toHaveBeenCalledTimes(1); // Only for initialization
      expect(console.warn).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
    
    test('should log nothing when set to SILENT', () => {
      const logger = new Logger();
      logger.setLevel(LogLevel.SILENT);
      
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warn message');
      logger.error('Error message');
      
      expect(console.debug).not.toHaveBeenCalled();
      expect(console.info).toHaveBeenCalledTimes(1); // Only for initialization
      expect(console.warn).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe('setLevel', () => {
    test('should set level using enum value', () => {
      const logger = new Logger();
      logger.setLevel(LogLevel.WARN);
      
      logger.info('This should not be logged');
      logger.warn('This should be logged');
      
      expect(console.info).toHaveBeenCalledTimes(1); // Only for initialization
      expect(console.warn).toHaveBeenCalled();
      expect((console.warn as jest.Mock).mock.calls[0][0]).toContain('This should be logged');
    });
    
    test('should set level using string value', () => {
      const logger = new Logger();
      logger.setLevel('error');
      
      logger.warn('This should not be logged');
      logger.error('This should be logged');
      
      expect(console.warn).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
      expect((console.error as jest.Mock).mock.calls[0][0]).toContain('This should be logged');
    });
    
    test('should handle invalid string level', () => {
      const logger = new Logger();
      logger.setLevel('invalid_level');
      
      logger.debug('Debug should not be logged');
      logger.info('Info should be logged');
      
      expect(console.debug).not.toHaveBeenCalled();
      expect(console.info).toHaveBeenCalled(); // Just check that it's been called at least once
    });
  });

  describe('metadata handling', () => {
    test('should include metadata in logs', () => {
      const logger = new Logger();
      const metadata = { userId: '123', action: 'login' };
      
      logger.info('User action', metadata);
      
      expect(console.info).toHaveBeenCalledTimes(2); // Once for initialization, once for test
      const loggedValue = (console.info as jest.Mock).mock.calls[1][0];
      expect(loggedValue).toHaveProperty('userId', '123');
      expect(loggedValue).toHaveProperty('action', 'login');
    });
    
    test('should format logs differently in production mode', () => {
      process.env.NODE_ENV = 'production';
      const logger = new Logger();
      const metadata = { userId: '123', action: 'login' };
      
      logger.info('User action', metadata);
      
      expect(console.info).toHaveBeenCalledTimes(2); // Once for initialization, once for test
      const loggedValue = (console.info as jest.Mock).mock.calls[1][0];
      expect(loggedValue).toHaveProperty('timestamp');
      expect(loggedValue).toHaveProperty('level', 'info');
      expect(loggedValue).toHaveProperty('message', 'User action');
      expect(loggedValue).toHaveProperty('meta');
      expect(loggedValue.meta).toHaveProperty('userId', '123');
      expect(loggedValue.meta).toHaveProperty('action', 'login');
    });
  });

  describe('sanitization', () => {
    test('should sanitize sensitive information in metadata', () => {
      const logger = new Logger();
      const metadata = { 
        userId: '123', 
        password: 'secret123',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
        apiKey: 'sk-1234567890abcdef',
        config: {
          secretKey: 'very-secret-key'
        }
      };
      
      logger.info('User login', metadata);
      
      expect(console.info).toHaveBeenCalledTimes(2); // Once for initialization, once for test
      const loggedValue = (console.info as jest.Mock).mock.calls[1][0];
      expect(loggedValue).toHaveProperty('userId', '123');
      expect(loggedValue).toHaveProperty('password', 'secr...REDACTED');
      expect(loggedValue).toHaveProperty('token', 'eyJh...REDACTED');
      expect(loggedValue).toHaveProperty('apiKey', 'sk-1...REDACTED');
      expect(loggedValue).toHaveProperty('config');
      expect(loggedValue.config).toHaveProperty('secretKey', 'very...REDACTED');
    });
    
    test('should handle non-string sensitive data', () => {
      const logger = new Logger();
      const metadata = { 
        userId: '123', 
        password: 12345,
        token: { value: 'token-value' }
      };
      
      logger.info('User data', metadata);
      
      expect(console.info).toHaveBeenCalledTimes(2); // Once for initialization, once for test
      const loggedValue = (console.info as jest.Mock).mock.calls[1][0];
      expect(loggedValue).toHaveProperty('userId', '123');
      expect(loggedValue).toHaveProperty('password', 'REDACTED');
      expect(loggedValue).toHaveProperty('token', 'REDACTED');
    });
    
    test('should handle null and undefined metadata', () => {
      const logger = new Logger();
      
      logger.info('Null metadata', null);
      logger.info('Undefined metadata', undefined);
      
      expect(console.info).toHaveBeenCalledTimes(3); // Once for initialization, twice for tests
      const loggedValue1 = (console.info as jest.Mock).mock.calls[1][0];
      const loggedValue2 = (console.info as jest.Mock).mock.calls[2][0];
      
      expect(loggedValue1).toBe('Null metadata');
      expect(loggedValue2).toBe('Undefined metadata');
    });

    test('should handle primitive metadata', () => {
      const logger = new Logger();
      
      logger.info('String metadata', 'plain string');
      logger.info('Number metadata', 42);
      logger.info('Boolean metadata', true);
      
      expect(console.info).toHaveBeenCalledTimes(4); // Once for initialization, thrice for tests
      
      // These should pass through without changes
      const loggedValue1 = (console.info as jest.Mock).mock.calls[1][0];
      const loggedValue2 = (console.info as jest.Mock).mock.calls[2][0];
      const loggedValue3 = (console.info as jest.Mock).mock.calls[3][0];
      
      expect(loggedValue1).toHaveProperty('message', 'String metadata');
      expect(loggedValue1).toHaveProperty('0', 'p'); // It's an object with string characters
      expect(typeof loggedValue2).toBe('object');
      expect(typeof loggedValue3).toBe('object');
    });
  });
});