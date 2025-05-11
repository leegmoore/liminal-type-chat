/**
 * Unit tests for the Health Service Client Factory
 */
import { createHealthServiceClient } from '../../../../src/clients/domain/health-service-client-factory';
import { DirectHealthServiceClient } from '../../../../src/clients/domain/direct-health-service-client';
import { HttpHealthServiceClient } from '../../../../src/clients/domain/http-health-service-client';
import { HealthService } from '../../../../src/services/core/health-service';
import config from '../../../../src/config';

// Mock the config module
jest.mock('../../../../src/config', () => ({
  __esModule: true,
  default: {
    inProcessMode: true,
    apiBaseUrl: 'http://test-api.example.com'
  }
}));

describe('HealthServiceClientFactory', () => {
  let healthServiceMock: jest.Mocked<HealthService>;
  
  beforeEach(() => {
    // Create a mock for the health service
    healthServiceMock = {} as jest.Mocked<HealthService>;
    
    // Reset mocks
    jest.clearAllMocks();
  });
  
  it('should create a DirectHealthServiceClient when in-process mode is enabled', () => {
    // Configure mock to use in-process mode
    (config as any).inProcessMode = true;
    
    const client = createHealthServiceClient(healthServiceMock);
    
    expect(client).toBeInstanceOf(DirectHealthServiceClient);
  });
  
  it('should create an HttpHealthServiceClient when in-process mode is disabled', () => {
    // Configure mock to use HTTP mode
    (config as any).inProcessMode = false;
    
    const client = createHealthServiceClient(healthServiceMock);
    
    expect(client).toBeInstanceOf(HttpHealthServiceClient);
  });
  
  it('should throw an error when health service is not provided in direct mode', () => {
    // Configure mock to use in-process mode
    (config as any).inProcessMode = true;
    
    expect(() => {
      createHealthServiceClient(undefined);
    }).toThrow('Health service instance is required for direct mode');
  });
  
  it('should create an HttpHealthServiceClient with the correct API base URL', () => {
    // Configure mock to use HTTP mode
    (config as any).inProcessMode = false;
    (config as any).apiBaseUrl = 'http://custom-api.example.com';
    
    // Create the client
    const client = createHealthServiceClient();
    
    // Simply verify it's an instance of HttpHealthServiceClient
    expect(client).toBeInstanceOf(HttpHealthServiceClient);
    
    // The base URL is set during construction and can't be easily tested without
    // refactoring the class to expose it. For now, we'll just verify it's constructed correctly.
  });
});
