/**
 * Unit tests for the context thread client factory
 */
// NOTE: Imports moved after mocks below

import { getContextThreadClient } from '../../../../src/clients/domain/context-thread-client-factory';
import { DirectContextThreadClient } from '../../../../src/clients/domain/direct-context-thread-client';
import { HttpContextThreadClient } from '../../../../src/clients/domain/http-context-thread-client';
import { ContextThreadService } from '../../../../src/services/core/ContextThreadService';
import config from '../../../../src/config';

// Mock the ContextThreadRepository and service
jest.mock('../../../../src/providers/db/ContextThreadRepository', () => ({
  ContextThreadRepository: jest.fn().mockImplementation(() => ({
    // Minimal mock implementation
    getContextThreads: jest.fn(),
    getContextThread: jest.fn(),
    createContextThread: jest.fn(),
    updateContextThread: jest.fn(),
    deleteContextThread: jest.fn(),
    addMessageToContextThread: jest.fn()
  }))
}));

jest.mock('../../../../src/services/core/ContextThreadService', () => ({
  ContextThreadService: jest.fn().mockImplementation(() => ({
    // Minimal mock implementation
    getContextThreads: jest.fn(),
    getContextThread: jest.fn(),
    createContextThread: jest.fn(),
    updateContextThread: jest.fn(),
    deleteContextThread: jest.fn(),
    addMessageToContextThread: jest.fn()
  }))
}));

// Mock config
jest.mock('../../../../src/config', () => ({
  domainClientMode: 'direct',
  domainApiBaseUrl: 'http://test-api.example.com'
}));

describe('Context Thread Client Factory', () => {
  // Backup and restore global properties between tests
  const originalGlobal = { ...global };
  
  afterEach(() => {
    // Reset global to its original state
    global = originalGlobal;
    jest.clearAllMocks();
    
    // Reset config mock
    jest.resetModules();
    
    // Restore config mock defaults
    jest.mock('../../../../src/config', () => ({
      domainClientMode: 'direct',
      domainApiBaseUrl: 'http://test-api.example.com'
    }));
  });
  
  describe('getContextThreadClient', () => {
    it('should return DirectContextThreadClient when mode is direct', () => {
      // Mock config to return direct mode
      (config as any).domainClientMode = 'direct';
      
      const mockService = {} as ContextThreadService;
      const client = getContextThreadClient(mockService);
      
      expect(client).toBeInstanceOf(DirectContextThreadClient);
    });
    
    it('should return DirectContextThreadClient when mode is undefined', () => {
      // Mock config to return undefined mode
      (config as any).domainClientMode = undefined;
      
      const mockService = {} as ContextThreadService;
      const client = getContextThreadClient(mockService);
      
      expect(client).toBeInstanceOf(DirectContextThreadClient);
    });
    
    it('should create a new ContextThreadService if one is not provided for direct mode', () => {
      // Mock config to return direct mode
      (config as any).domainClientMode = 'direct';
      
      const client = getContextThreadClient();
      
      expect(client).toBeInstanceOf(DirectContextThreadClient);
    });
    
    it('should return HttpContextThreadClient when mode is http', () => {
      // Mock config to return http mode
      (config as any).domainClientMode = 'http';
      
      const client = getContextThreadClient();
      
      expect(client).toBeInstanceOf(HttpContextThreadClient);
    });
    
    it('should honor client mode override from request headers', () => {
      // Mock config to return the opposite of what we want to test
      (config as any).domainClientMode = 'direct';
      
      // Mock global with a current request that has headers
      (global as any).currentRequest = {
        headers: {
          'x-domain-client-mode': 'http'
        }
      };
      
      const client = getContextThreadClient();
      
      expect(client).toBeInstanceOf(HttpContextThreadClient);
    });
    
    it('should use config when request headers do not override', () => {
      // Set config to http mode
      (config as any).domainClientMode = 'http';
      
      // Mock global with a current request that has headers but no override
      (global as any).currentRequest = {
        headers: {
          'other-header': 'value'
        }
      };
      
      const client = getContextThreadClient();
      
      expect(client).toBeInstanceOf(HttpContextThreadClient);
    });
  });
});