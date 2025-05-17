/**
 * Environment Service
 * 
 * Provides environment detection and security profile management.
 * This service ensures that security features are properly configured
 * based on the running environment, preventing accidental security
 * bypasses in production.
 */
import os from 'os';
import { logger } from '../../utils/logger';

/**
 * Available runtime environments
 */
export enum Environment {
  /** Local development environment */
  LOCAL = 'local',
  /** Development/testing environment */
  DEVELOPMENT = 'development',
  /** Pre-production staging environment */
  STAGING = 'staging',
  /** Production environment */
  PRODUCTION = 'production'
}

/**
 * Security profile properties
 */
export interface SecurityProfile {
  /** Whether authentication is required */
  requireAuth: boolean;
  /** Whether to use strict CORS policy */
  strictCors: boolean;
  /** Whether to use strict security headers */
  strictSecurityHeaders: boolean;
  /** Whether to allow mock services */
  allowMocks: boolean;
  /** Whether rate limiting is enforced */
  enforceRateLimits: boolean;
  /** Whether JWT tokens have extended lifetimes */
  extendedTokenLifetime: boolean;
}

/**
 * Service for environment detection and security profile management
 */
export class EnvironmentService {
  private readonly environment: Environment;
  private readonly securityProfile: SecurityProfile;
  
  /**
   * Create a new EnvironmentService
   */
  constructor() {
    this.environment = this.detectEnvironment();
    this.securityProfile = this.loadSecurityProfile();
    
    // Log the detected environment and security profile
    logger.info(`Environment detected as: ${this.environment}`);
    
    // In non-local environments, warn about potential security bypasses
    if (this.environment !== Environment.LOCAL) {
      this.warnAboutSecurityBypasses();
    }
  }
  
  /**
   * Get the current environment
   */
  getEnvironment(): Environment {
    return this.environment;
  }
  
  /**
   * Check if running in local environment
   */
  isLocalEnvironment(): boolean {
    return this.environment === Environment.LOCAL;
  }
  
  /**
   * Check if authentication is required in the current environment
   */
  isAuthRequired(): boolean {
    // Basic rule: Auth is always required except in local with explicit bypass
    if (this.environment === Environment.LOCAL) {
      // In local, auth can be disabled via env var
      return process.env.DEV_REQUIRE_AUTH === 'true';
    }
    
    // In all other environments, auth is always required
    return true;
  }
  
  /**
   * Check if strict CORS is enabled in the current environment
   */
  useStrictCors(): boolean {
    return this.securityProfile.strictCors;
  }
  
  /**
   * Check if strict security headers are enabled in the current environment
   */
  useStrictSecurityHeaders(): boolean {
    return this.securityProfile.strictSecurityHeaders;
  }
  
  /**
   * Check if mock services are allowed in the current environment
   */
  allowMockServices(): boolean {
    return this.securityProfile.allowMocks;
  }
  
  /**
   * Check if rate limiting is enforced in the current environment
   */
  enforceRateLimits(): boolean {
    return this.securityProfile.enforceRateLimits;
  }
  
  /**
   * Check if extended token lifetimes are enabled in the current environment
   */
  useExtendedTokenLifetime(): boolean {
    return this.securityProfile.extendedTokenLifetime;
  }
  
  /**
   * Detect the current environment based on multiple signals
   * @private
   */
  private detectEnvironment(): Environment {
    // Check explicit environment variables first
    const appEnv = process.env.APP_ENV?.toLowerCase();
    const nodeEnv = process.env.NODE_ENV?.toLowerCase();
    
    // APP_ENV takes precedence if set
    if (appEnv === 'production') return Environment.PRODUCTION;
    if (appEnv === 'staging') return Environment.STAGING;
    if (appEnv === 'development') return Environment.DEVELOPMENT;
    if (appEnv === 'local') return Environment.LOCAL;
    
    // Fall back to NODE_ENV
    if (nodeEnv === 'production') return Environment.PRODUCTION;
    if (nodeEnv === 'test') return Environment.DEVELOPMENT;
    
    // Check environment-specific variables
    if (process.env.ENFORCE_PRODUCTION_SECURITY === 'true') {
      return Environment.PRODUCTION;
    }
    
    // Check hostname for production indicators
    const hostname = os.hostname().toLowerCase();
    if (
      hostname.includes('prod') || 
      hostname.includes('prd') ||
      hostname.includes('app')
    ) {
      // Log a warning if hostname suggests production but ENV vars don't
      logger.warn(
        'Hostname suggests production environment, but environment variables do not. ' +
        'Defaulting to PRODUCTION for security.'
      );
      return Environment.PRODUCTION;
    }
    
    // Default to local for development
    if (!nodeEnv || nodeEnv === 'development') {
      logger.info('Environment not explicitly set, defaulting to LOCAL');
      return Environment.LOCAL;
    }
    
    // If we can't determine the environment, default to PRODUCTION for safety
    logger.warn(
      'Could not determine environment from configuration. ' +
      'Defaulting to PRODUCTION for security.'
    );
    return Environment.PRODUCTION;
  }
  
  /**
   * Load security profile based on environment
   * @private
   */
  private loadSecurityProfile(): SecurityProfile {
    // Common profiles for different environments
    const profiles: Record<Environment, SecurityProfile> = {
      [Environment.LOCAL]: {
        requireAuth: process.env.DEV_REQUIRE_AUTH === 'true',
        strictCors: false,
        strictSecurityHeaders: false,
        allowMocks: true,
        enforceRateLimits: false,
        extendedTokenLifetime: true
      },
      [Environment.DEVELOPMENT]: {
        requireAuth: true,
        strictCors: false,
        strictSecurityHeaders: true,
        allowMocks: true,
        enforceRateLimits: true,
        extendedTokenLifetime: true
      },
      [Environment.STAGING]: {
        requireAuth: true,
        strictCors: true,
        strictSecurityHeaders: true,
        allowMocks: false,
        enforceRateLimits: true,
        extendedTokenLifetime: false
      },
      [Environment.PRODUCTION]: {
        requireAuth: true,
        strictCors: true,
        strictSecurityHeaders: true,
        allowMocks: false,
        enforceRateLimits: true,
        extendedTokenLifetime: false
      }
    };
    
    // Get profile for current environment
    const profile = profiles[this.environment];
    
    // Apply any overrides from environment variables
    if (process.env.ENFORCE_SECURITY === 'true') {
      // Override with production-level security
      return profiles[Environment.PRODUCTION];
    }
    
    return profile;
  }
  
  /**
   * Check for and warn about security bypasses
   * @private
   */
  private warnAboutSecurityBypasses(): void {
    // Only check in non-local environments
    if (this.environment === Environment.LOCAL) {
      return;
    }
    
    const bypasses: string[] = [];
    
    // Check for known security bypass environment variables
    if (process.env.BYPASS_AUTH === 'true') {
      bypasses.push('BYPASS_AUTH=true');
    }
    
    if (process.env.DEV_MODE === 'true') {
      bypasses.push('DEV_MODE=true');
    }
    
    if (process.env.DISABLE_SECURITY === 'true') {
      bypasses.push('DISABLE_SECURITY=true');
    }
    
    // Log warnings for any detected bypasses
    if (bypasses.length > 0) {
      logger.error(
        `⚠️ SECURITY ALERT: Detected security bypasses in ${this.environment} environment: ` +
        bypasses.join(', ')
      );
      
      // In production, we might want to exit the process
      if (this.environment === Environment.PRODUCTION) {
        logger.error('Security bypasses are not allowed in production. Exiting.');
        process.exit(1);
      }
    }
  }
}

// Export singleton instance
export const environmentService = new EnvironmentService();