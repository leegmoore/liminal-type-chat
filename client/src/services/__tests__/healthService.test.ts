import axios from 'axios';
import { checkServerHealth, checkDatabaseHealth } from '../healthService';

// Mock axios
jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;

describe('healthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkServerHealth', () => {
    test('calls correct domain endpoint and returns data', async () => {
      const mockResponse = {
        data: {
          status: 'ok',
          timestamp: '2025-05-11T18:30:00Z'
        }
      };
      
      mockAxios.get.mockResolvedValueOnce(mockResponse);
      
      const result = await checkServerHealth('domain');
      
      expect(mockAxios.get).toHaveBeenCalledWith('/api/v1/domain/health');
      expect(result).toEqual(mockResponse.data);
    });

    test('calls correct edge endpoint and returns data', async () => {
      const mockResponse = {
        data: {
          status: 'ok',
          timestamp: '2025-05-11T18:30:00Z'
        }
      };
      
      mockAxios.get.mockResolvedValueOnce(mockResponse);
      
      const result = await checkServerHealth('edge');
      
      expect(mockAxios.get).toHaveBeenCalledWith('/api/v1/edge/health');
      expect(result).toEqual(mockResponse.data);
    });

    test('handles error response correctly', async () => {
      const errorResponse = {
        response: {
          data: {
            error: {
              message: 'Server error'
            }
          }
        }
      };
      
      mockAxios.get.mockRejectedValueOnce(errorResponse);
      
      await expect(checkServerHealth('domain')).rejects.toThrow('Server error');
    });

    test('handles unexpected error format', async () => {
      mockAxios.get.mockRejectedValueOnce(new Error('Network error'));
      
      await expect(checkServerHealth('domain')).rejects.toThrow('Failed to check server health');
    });
  });

  describe('checkDatabaseHealth', () => {
    test('calls correct domain endpoint and returns data', async () => {
      const mockResponse = {
        data: {
          status: 'ok',
          timestamp: '2025-05-11T18:30:00Z',
          database: {
            connected: true,
            name: 'SQLite'
          }
        }
      };
      
      mockAxios.get.mockResolvedValueOnce(mockResponse);
      
      const result = await checkDatabaseHealth('domain');
      
      expect(mockAxios.get).toHaveBeenCalledWith('/api/v1/domain/health/db');
      expect(result).toEqual(mockResponse.data);
    });

    test('calls correct edge endpoint and returns data', async () => {
      const mockResponse = {
        data: {
          status: 'ok',
          timestamp: '2025-05-11T18:30:00Z',
          database: {
            connected: true,
            name: 'SQLite'
          }
        }
      };
      
      mockAxios.get.mockResolvedValueOnce(mockResponse);
      
      const result = await checkDatabaseHealth('edge');
      
      expect(mockAxios.get).toHaveBeenCalledWith('/api/v1/edge/health/db');
      expect(result).toEqual(mockResponse.data);
    });

    test('handles error response correctly', async () => {
      const errorResponse = {
        response: {
          data: {
            error: {
              message: 'Database connection failed'
            }
          }
        }
      };
      
      mockAxios.get.mockRejectedValueOnce(errorResponse);
      
      await expect(checkDatabaseHealth('domain')).rejects.toThrow('Database connection failed');
    });

    test('handles unexpected error format', async () => {
      mockAxios.get.mockRejectedValueOnce(new Error('Network error'));
      
      await expect(checkDatabaseHealth('domain'))
        .rejects.toThrow('Failed to check database health');
    });
  });
});
