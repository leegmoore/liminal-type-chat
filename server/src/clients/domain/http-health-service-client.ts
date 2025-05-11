/**
 * HTTP Health Service Client
 * Implements the health service client interface for HTTP communication
 * with the domain health service endpoints
 */
import axios, { AxiosInstance } from 'axios';
import { HealthServiceClient } from './health-service-client';
import { DatabaseHealthStatus, HealthStatus } from '../../services/core/health-service';
import { AppError } from '../../utils/errors';

/**
 * Client for accessing health service functionality via HTTP
 */
export class HttpHealthServiceClient implements HealthServiceClient {
  private httpClient: AxiosInstance;
  
  /**
   * Create a new HttpHealthServiceClient
   * @param baseUrl - The base URL for the domain API
   */
  constructor(baseUrl: string) {
    this.httpClient = axios.create({
      baseURL: baseUrl,
      timeout: 10000, // 10 second timeout
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    // Add response interceptor to handle errors consistently
    this.httpClient.interceptors.response.use(
      response => response,
      error => {
        if (error.response) {
          // The request was made and the server responded with an error status
          throw new AppError(
            'EXTERNAL_SERVICE_ERROR', // Using a standard error code from error-codes.ts
            error.response.data?.message || 'API error',
            error.response.data?.details || `Status: ${error.response.status}, Code: ${error.response.data?.code || 'unknown'}`
          );
        } else if (error.request) {
          // The request was made but no response was received
          throw new AppError(
            'EXTERNAL_SERVICE_UNAVAILABLE', // Network error - service unavailable
            'No response received from server',
            error.message
          );
        } else {
          // Something happened in setting up the request
          throw new AppError(
            'EXTERNAL_SERVICE_ERROR', // General external service error
            error.message || 'Request setup error',
            'Error occurred while setting up the request'
          );
        }
      }
    );
  }
  
  /**
   * Get the current system health status by calling the domain API endpoint
   * @returns Promise with health status information
   */
  async getSystemStatus(): Promise<HealthStatus> {
    const response = await this.httpClient.get<HealthStatus>('/api/v1/domain/health');
    return response.data;
  }
  
  /**
   * Check database connection health by calling the domain API endpoint
   * @returns Promise with database health status information
   */
  async checkDbConnection(): Promise<DatabaseHealthStatus> {
    const response = await this.httpClient.get<DatabaseHealthStatus>('/api/v1/domain/health/db');
    return response.data;
  }
}
