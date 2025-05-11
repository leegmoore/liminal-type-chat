/**
 * Unit tests for the HTTP Health Service Client
 */
import axios from 'axios';
import { HttpHealthServiceClient } from '../../../../src/clients/domain/http-health-service-client';
import { HealthStatus, DatabaseHealthStatus } from '../../../../src/services/core/health-service';
import { AppError } from '../../../../src/utils/errors';

// Mock axios
jest.mock('axios', () => {
  return {
    create: jest.fn(() => ({
      get: jest.fn(),
      interceptors: {
        response: {
          use: jest.fn((successFn, errorFn) => {
            // Store the error handler for testing
            (axios as any).errorHandler = errorFn;
            return successFn;
          })
        }
      }
    }))
  };
});

describe('HttpHealthServiceClient', () => {
  let httpClient: HttpHealthServiceClient;
  let mockAxiosInstance: any;
  
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
    
    // Create a new HTTP client with a test base URL
    httpClient = new HttpHealthServiceClient('http://test-api.example.com');
    
    // Get the mock axios instance
    mockAxiosInstance = (axios.create as jest.Mock)();
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
      
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });
  
  describe('getSystemStatus', () => {
    it('should call the domain health API endpoint', async () => {
      // Mock successful response
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: mockHealthStatus
      });
      
      const result = await httpClient.getSystemStatus();
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/v1/domain/health');
      expect(result).toEqual(mockHealthStatus);
    });
    
    it('should handle API errors properly', async () => {
      // Simulate an error from the API
      const apiError = new Error('API error');
      mockAxiosInstance.get.mockRejectedValueOnce(apiError);
      
      await expect(httpClient.getSystemStatus()).rejects.toThrow();
    });
  });
  
  describe('checkDbConnection', () => {
    it('should call the domain database health API endpoint', async () => {
      // Mock successful response
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: mockDbHealthStatus
      });
      
      const result = await httpClient.checkDbConnection();
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/v1/domain/health/db');
      expect(result).toEqual(mockDbHealthStatus);
    });
    
    it('should handle API errors properly', async () => {
      // Simulate an error from the API
      const apiError = new Error('API error');
      mockAxiosInstance.get.mockRejectedValueOnce(apiError);
      
      await expect(httpClient.checkDbConnection()).rejects.toThrow();
    });
  });
  
  describe('error handling', () => {
    it('should handle API response errors', () => {
      const errorHandler = (axios as any).errorHandler;
      
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
      
      expect(() => errorHandler(responseError)).toThrow(AppError);
      try {
        errorHandler(responseError);
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect(error).toHaveProperty('message', 'API error message');
        expect(error).toHaveProperty('statusCode');
        expect(error).toHaveProperty('errorCode');
        expect(error).toHaveProperty('details');
      }
    });
    
    it('should handle network errors', () => {
      const errorHandler = (axios as any).errorHandler;
      
      // Simulate a network error
      const networkError = {
        request: {},
        message: 'Network error'
      };
      
      expect(() => errorHandler(networkError)).toThrow(ApiError);
      try {
        errorHandler(networkError);
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect(error).toHaveProperty('message', 'No response received from server');
        expect(error).toHaveProperty('statusCode', 0);
        expect(error).toHaveProperty('code', 5001);
        expect(error).toHaveProperty('errorCode', 'NETWORK_ERROR');
      }
    });
    
    it('should handle request setup errors', () => {
      const errorHandler = (axios as any).errorHandler;
      
      // Simulate a request setup error
      const setupError = {
        message: 'Setup error'
      };
      
      expect(() => errorHandler(setupError)).toThrow(ApiError);
      try {
        errorHandler(setupError);
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect(error).toHaveProperty('message', 'Setup error');
        expect(error).toHaveProperty('statusCode', 0);
        expect(error).toHaveProperty('code', 5002);
        expect(error).toHaveProperty('errorCode', 'REQUEST_ERROR');
      }
    });
  });
});
