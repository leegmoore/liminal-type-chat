/**
 * Types for health check functionality
 */

export interface HealthStatus {
  status: 'ok' | 'error';
  timestamp: string;
  details?: string;
}

export interface DatabaseHealthStatus extends HealthStatus {
  database: {
    connected: boolean;
    name: string;
    version?: string;
  };
}

export interface HealthCheckResult {
  data: HealthStatus | DatabaseHealthStatus;
  loading: boolean;
  error: string | null;
}

export type HealthCheckType = 'server' | 'database';
export type HealthTier = 'domain' | 'edge';
