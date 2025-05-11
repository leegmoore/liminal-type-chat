/**
 * Unit tests for the HTTP Health Service Client
 */
import axios from 'axios';
import { HttpHealthServiceClient } from '../../../../src/clients/domain/http-health-service-client';
import { HealthStatus, DatabaseHealthStatus } from '../../../../src/services/core/health-service';
import { AppError, ExternalServiceError } from '../../../../src/utils/errors';
import { ExternalServiceErrorCode } from '../../../../src/utils/error-codes';

// Create mock functions
const mockGet = jest.fn();
const mockInterceptorsUse = jest.fn();

// Capture error handler for testing
let capturedErrorHandler: Function;

// Mock axios
jest.mock('axios', () => {
  return {
    create: jest.fn(() => ({
      get: mockGet,
      interceptors: {
        response: {
          use: (successFn: Function, errorFn: Function) => {
            mockInterceptorsUse(successFn, errorFn);
            capturedErrorHandler = errorFn;
            return successFn;
          }
        }
      }
    }))
  };
});

describe('HttpHealthServiceClient', () => {
  let httpClient: HttpHealthServiceClient;
  
  // Sample health status responses
  const mockHealthStatus: HealthStatus = {
    status: 'ok',
    timestamp: '2025-05-11T12:00:00.000Z'
  };
  
  const mockDbHealthStatus: DatabaseHealthStatus = {
    status: 'ok',
    timestamp: '2025-05-11T12:00:00.000Z',
    database: {
      connected: true
    }
  };
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    mockGet.mockReset();
    mockInterceptorsUse.mockReset();
    
    // Create a new HTTP client with a test base URL
    httpClient = new HttpHealthServiceClient('http://test-api.example.com');
  });
  
  describe('constructor', () => {
    it('should create an axios instance with the correct configuration', () => {
      expect(axios.create).toHaveBeenCalledWith({
        baseURL: 'http://test-api.example.com',
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      // Interceptors should be set up
      expect(mockInterceptorsUse).toHaveBeenCalled();
    });
  });
  
  describe('getSystemStatus', () => {
    it('should call the domain health API endpoint', async () => {
      // Mock successful response
      mockGet.mockResolvedValueOnce({
        data: mockHealthStatus
      });
      
      const result = await httpClient.getSystemStatus();
      
      expect(mockGet).toHaveBeenCalledWith('/api/v1/domain/health');
      expect(result).toEqual(mockHealthStatus);
    });
    
    it('should handle API errors properly', async () => {
      // Simulate an error from the API
      const apiError = new Error('API error');
      mockGet.mockRejectedValueOnce(apiError);
      
      await expect(httpClient.getSystemStatus()).rejects.toThrow();
    });
  });
  
  describe('checkDbConnection', () => {
    it('should call the domain database health API endpoint', async () => {
      // Mock successful response
      mockGet.mockResolvedValueOnce({
        data: mockDbHealthStatus
      });
      
      const result = await httpClient.checkDbConnection();
      
      expect(mockGet).toHaveBeenCalledWith('/api/v1/domain/health/db');
      expect(result).toEqual(mockDbHealthStatus);
    });
    
    it('should handle API errors properly', async () => {
      // Simulate an error from the API
      const apiError = new Error('API error');
      mockGet.mockRejectedValueOnce(apiError);
      
      await expect(httpClient.checkDbConnection()).rejects.toThrow();
    });
  });
  
  describe('error handling', () => {
    it('should handle API response errors', () => {
      // Verify errorHandler is a function
      expect(typeof capturedErrorHandler).toBe('function');
      
      // Simulate an error with response
      const responseError = {
        response: {
          data: {
            message: 'API error message',
            code: 4000,
            errorCode: 'TEST_ERROR',
            details: 'Test details'
          },
          status: 400
        }
      };
      
      expect(() => capturedErrorHandler(responseError)).toThrow(AppError);
      try {
        capturedErrorHandler(responseError);
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect(error).toHaveProperty('message', 'API error message');
        expect(error).toHaveProperty('statusCode');
        expect(error).toHaveProperty('errorCode', 'EXTERNAL_SERVICE_ERROR');
        expect(error).toHaveProperty('details');
      }
    });
    
    it('should handle network errors', () => {
      // Verify errorHandler is a function
      expect(typeof capturedErrorHandler).toBe('function');
      
      // Simulate a network error
      const networkError = {
        request: {},
        message: 'Network error'
      };
      
      expect(() => capturedErrorHandler(networkError)).toThrow(AppError);
      try {
        capturedErrorHandler(networkError);
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect(error).toHaveProperty('message', 'No response received from server');
        expect(error).toHaveProperty('errorCode', 'EXTERNAL_SERVICE_UNAVAILABLE');
      }
    });
    
    it('should handle request setup errors', () => {
      // Verify errorHandler is a function
      expect(typeof capturedErrorHandler).toBe('function');
      
      // Simulate a request setup error
      const setupError = {
        message: 'Setup error'
      };
      
      expect(() => capturedErrorHandler(setupError)).toThrow(AppError);
      try {
        capturedErrorHandler(setupError);
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect(error).toHaveProperty('message', 'Setup error');
        expect(error).toHaveProperty('errorCode', 'EXTERNAL_SERVICE_ERROR');
      }
    });
  });
});
