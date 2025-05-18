/**
 * Security headers middleware
 * Implements best-practice HTTP security headers to protect against common web vulnerabilities
 */
import { Request, Response, NextFunction } from 'express';
import { environmentService, Environment } from '../services/core/EnvironmentService';
import { logger } from '../utils/logger';

/**
 * Options for configuring security headers
 */
export interface SecurityHeadersOptions {
  /** Custom headers to add or override defaults */
  customHeaders?: Record<string, string>;
  /** Enable report-only mode for Content-Security-Policy (useful for testing) */
  reportOnly?: boolean;
}

/**
 * Create middleware that sets secure HTTP headers
 * @param options - Configuration options for security headers
 * @returns Express middleware function
 */
export function createSecurityHeadersMiddleware(options: SecurityHeadersOptions = {}) {
  const { customHeaders = {}, reportOnly = false } = options;
  
  return (_req: Request, res: Response, next: NextFunction) => {
    const isProduction = environmentService.getEnvironment() === Environment.PRODUCTION;
    const isLocal = environmentService.isLocalEnvironment();
    
    // Set basic security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Configure Content-Security-Policy
    const cspHeader = isProduction ? getProductionCsp() : getDevelopmentCsp();
    const cspHeaderName = reportOnly 
      ? 'Content-Security-Policy-Report-Only' 
      : 'Content-Security-Policy';
    res.setHeader(cspHeaderName, cspHeader);
    
    // Only set HSTS in production environments
    if (isProduction) {
      // 2 years in seconds (as per best practice recommendations)
      const maxAge = 63072000;
      res.setHeader('Strict-Transport-Security', `max-age=${maxAge}; includeSubDomains; preload`);
      
      if (!isLocal) {
        logger.info('HSTS security header enabled with long-lived policy');
      }
    }
    
    // Set referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Set permissions policy to limit browser features
    res.setHeader('Permissions-Policy', 
      'geolocation=(), camera=(), microphone=(), payment=(), xr-spatial-tracking=()');
    
    // Apply any custom headers (potentially overriding defaults)
    Object.entries(customHeaders).forEach(([name, value]) => {
      res.setHeader(name, value);
    });
    
    next();
  };
}

/**
 * Get strict Content-Security-Policy for production
 */
function getProductionCsp(): string {
  return [
    // Restrict default loading of resources to same origin
    'default-src \'self\'',
    
    // JavaScript sources: only from same origin, no inline scripts
    'script-src \'self\'',
    
    // Styles: allow same origin and inline styles (needed for our UI framework)
    'style-src \'self\' \'unsafe-inline\'',
    
    // Images: allow same origin and data URLs (for embedded images)
    'img-src \'self\' data:',
    
    // Fonts: allow same origin
    'font-src \'self\'',
    
    // Connect: allow same origin and specified API endpoints
    'connect-src \'self\' https://api.anthropic.com https://api.openai.com',
    
    // Block all object tags (Flash, etc.)
    'object-src \'none\'',
    
    // Block all base-uri modifications
    'base-uri \'self\'',
    
    // Frame ancestors: none (prevents site from being framed)
    'frame-ancestors \'none\'',
    
    // Form actions: only same origin
    'form-action \'self\'',
    
    // Upgrade insecure requests
    'upgrade-insecure-requests'
  ].join('; ');
}

/**
 * Get relaxed Content-Security-Policy for development
 */
function getDevelopmentCsp(): string {
  return [
    // More relaxed default source for development
    'default-src \'self\'',
    
    // Allow inline scripts and eval for development tools
    'script-src \'self\' \'unsafe-inline\' \'unsafe-eval\'',
    
    // Allow inline styles
    'style-src \'self\' \'unsafe-inline\'',
    
    // Images: allow same origin and data URLs
    'img-src \'self\' data:',
    
    // Fonts: allow same origin
    'font-src \'self\'',
    
    // Connect: allow localhost, ws (websockets for dev server), and API endpoints
    'connect-src \'self\' localhost:* ws: wss: http: https: ' +
    'https://api.anthropic.com https://api.openai.com',
    
    // Relaxed object policy for development
    'object-src \'self\'',
    
    // Frame ancestors: less restrictive for development tools
    'frame-ancestors \'self\''
  ].join('; ');
}