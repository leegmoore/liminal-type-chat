/**
 * Health service for API calls to the health endpoints
 */
import axios from 'axios';
import { HealthStatus, DatabaseHealthStatus, HealthTier } from '../types/health';

// API base URL - uses proxy in development
const apiBaseUrl = '/api/v1';

// Endpoints
const endpoints = {
  domain: {
    health: `${apiBaseUrl}/domain/health`,
    healthDb: `${apiBaseUrl}/domain/health/db`
  },
  edge: {
    health: `${apiBaseUrl}/edge/health`,
    healthDb: `${apiBaseUrl}/edge/health/db`
  }
};

/**
 * Fetches health status from the server
 * @param tier - The tier to check (domain or edge)
 */
export const checkServerHealth = async (tier: HealthTier): Promise<HealthStatus> => {
  try {
    const endpoint = tier === 'domain' ? endpoints.domain.health : endpoints.edge.health;
    const response = await axios.get<HealthStatus>(endpoint);
    return response.data;
  } catch (error) {
    const err = error as any;
    const message = err.response?.data?.error?.message;
    if (message) {
      throw new Error(message);
    }
    throw new Error('Failed to check server health');
  }
};

/**
 * Fetches database health status from the server
 * @param tier - The tier to check (domain or edge)
 */
export const checkDatabaseHealth = async (tier: HealthTier): Promise<DatabaseHealthStatus> => {
  try {
    const endpoint = tier === 'domain' ? endpoints.domain.healthDb : endpoints.edge.healthDb;
    const response = await axios.get<DatabaseHealthStatus>(endpoint);
    return response.data;
  } catch (error) {
    const err = error as any;
    const message = err.response?.data?.error?.message;
    if (message) {
      throw new Error(message);
    }
    throw new Error('Failed to check database health');
  }
};
