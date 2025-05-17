/**
 * Tests for configuration module
 */

// Need to mock these before importing any modules
jest.mock('dotenv', () => ({
  config: jest.fn()
}));

// Need to disable the no-var-requires rule for this specific file
// since we need to reset the module cache between tests
/* eslint-disable @typescript-eslint/no-var-requires */

describe('config module', () => {
  // Store originals
  const originalEnv = { ...process.env };
  const originalCwd = process.cwd;
  
  // Setup before each test
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    // Provide a real string return from process.cwd
    // instead of using a mock function that returns undefined
    process.cwd = jest.fn().mockReturnValue('/some/path');
  });
  
  // Cleanup after tests
  afterEach(() => {
    process.env = originalEnv;
    process.cwd = originalCwd;
    jest.restoreAllMocks();
  });
  
  it('should use default port value when PORT is not set', () => {
    // Clear PORT env variable
    delete process.env.PORT;
    
    // Import config
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require('../index').default;
    
    // Check default port
    expect(config.port).toBe(8765);
  });
  
  it('should use provided PORT env variable', () => {
    // Set PORT env variable
    process.env.PORT = '3000';
    
    // Import config
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require('../index').default;
    
    // Check port from env
    expect(config.port).toBe(3000);
  });
  
  it('should set nodeEnv from NODE_ENV', () => {
    // Set NODE_ENV
    process.env.NODE_ENV = 'production';
    
    // Import config
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require('../index').default;
    
    // Check nodeEnv
    expect(config.nodeEnv).toBe('production');
  });
  
  it('should set nodeEnv default when NODE_ENV is not set', () => {
    // Clear NODE_ENV
    delete process.env.NODE_ENV;
    
    // Import config
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require('../index').default;
    
    // Check default nodeEnv
    expect(config.nodeEnv).toBe('development');
  });
  
  it('should set isDevelopment based on NODE_ENV', () => {
    // Test production
    process.env.NODE_ENV = 'production';
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    let config = require('../index').default;
    expect(config.isDevelopment).toBe(false);
    
    // Test development
    jest.resetModules();
    process.env.NODE_ENV = 'development';
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    config = require('../index').default;
    expect(config.isDevelopment).toBe(true);
  });
  
  it('should use DB_PATH from env when provided', () => {
    // Set DB_PATH
    process.env.DB_PATH = '/custom/db/path.sqlite';
    
    // Import config
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require('../index').default;
    
    // Check DB path
    expect(config.db.path).toBe('/custom/db/path.sqlite');
  });
  
  it('should set inProcessMode based on IN_PROCESS_MODE env', () => {
    // Test when set to 'false'
    process.env.IN_PROCESS_MODE = 'false';
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    let config = require('../index').default;
    expect(config.inProcessMode).toBe(false);
    
    // Test default (true)
    jest.resetModules();
    delete process.env.IN_PROCESS_MODE;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    config = require('../index').default;
    expect(config.inProcessMode).toBe(true);
  });
  
  it('should set domainClientMode from env', () => {
    // Set domain client mode
    process.env.DOMAIN_CLIENT_MODE = 'http';
    
    // Import config
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require('../index').default;
    
    // Check domain client mode
    expect(config.domainClientMode).toBe('http');
  });
  
  it('should set default domainClientMode when not in env', () => {
    // Clear domain client mode
    delete process.env.DOMAIN_CLIENT_MODE;
    
    // Import config
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require('../index').default;
    
    // Check default domain client mode
    expect(config.domainClientMode).toBe('direct');
  });
  
  it('should set apiBaseUrl from env', () => {
    // Set API base URL
    process.env.API_BASE_URL = 'https://example.com/api';
    
    // Import config
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require('../index').default;
    
    // Check API base URL
    expect(config.apiBaseUrl).toBe('https://example.com/api');
  });
  
  it('should set default apiBaseUrl when not in env', () => {
    // Clear API base URL
    delete process.env.API_BASE_URL;
    
    // Import config
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require('../index').default;
    
    // Check default API base URL
    expect(config.apiBaseUrl).toBe('http://localhost:8765');
  });
  
  it('should prioritize DOMAIN_API_BASE_URL over API_BASE_URL', () => {
    // Set both URLs
    process.env.API_BASE_URL = 'https://api.example.com';
    process.env.DOMAIN_API_BASE_URL = 'https://domain.example.com';
    
    // Import config
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require('../index').default;
    
    // Check URL prioritization
    expect(config.domainApiBaseUrl).toBe('https://domain.example.com');
  });
  
  it('should fall back to API_BASE_URL when DOMAIN_API_BASE_URL not set', () => {
    // Set API URL but not domain API URL
    process.env.API_BASE_URL = 'https://api.example.com';
    delete process.env.DOMAIN_API_BASE_URL;
    
    // Import config
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require('../index').default;
    
    // Check fallback
    expect(config.domainApiBaseUrl).toBe('https://api.example.com');
  });
  
  it('should set logLevel from env', () => {
    // Set log level
    process.env.LOG_LEVEL = 'error';
    
    // Import config
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require('../index').default;
    
    // Check log level
    expect(config.logLevel).toBe('error');
  });
  
  it('should set default logLevel when not in env', () => {
    // Clear log level
    delete process.env.LOG_LEVEL;
    
    // Import config
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require('../index').default;
    
    // Check default log level
    expect(config.logLevel).toBe('debug');
  });
  
  it('should set domainApiDocs username from env', () => {
    // Set username
    process.env.DOMAIN_DOCS_USERNAME = 'testuser';
    
    // Import config
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require('../index').default;
    
    // Check username
    expect(config.domainApiDocs.username).toBe('testuser');
  });
  
  it('should set default domainApiDocs username when not in env', () => {
    // Clear username
    delete process.env.DOMAIN_DOCS_USERNAME;
    
    // Import config
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require('../index').default;
    
    // Check default username
    expect(config.domainApiDocs.username).toBe('admin');
  });
  
  it('should set domainApiDocs password from env', () => {
    // Set password
    process.env.DOMAIN_DOCS_PASSWORD = 'testpass';
    
    // Import config
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require('../index').default;
    
    // Check password
    expect(config.domainApiDocs.password).toBe('testpass');
  });
  
  it('should set default domainApiDocs password when not in env', () => {
    // Clear password
    delete process.env.DOMAIN_DOCS_PASSWORD;
    
    // Import config
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require('../index').default;
    
    // Check default password
    expect(config.domainApiDocs.password).toBe('password');
  });
  
  it('should set domainApiDocs enableAuth based on NODE_ENV', () => {
    // Test production (enableAuth should be true)
    process.env.NODE_ENV = 'production';
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    let config = require('../index').default;
    expect(config.domainApiDocs.enableAuth).toBe(true);
    
    // Test development (enableAuth should be false)
    jest.resetModules();
    process.env.NODE_ENV = 'development';
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    config = require('../index').default;
    expect(config.domainApiDocs.enableAuth).toBe(false);
  });
});

/* eslint-enable @typescript-eslint/no-var-requires */