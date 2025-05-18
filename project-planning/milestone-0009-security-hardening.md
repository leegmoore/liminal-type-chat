# Milestone 0009: Security Hardening

**Date: May 31, 2023**

## Overview

Milestone 0009 focuses on hardening the security of the Liminal Type Chat application, with a particular emphasis on implementing proper OAuth authentication with GitHub as the initial provider. This milestone addresses the current security shortcomings, particularly the development-only bypasses that must be properly managed to ensure they aren't accidentally enabled in production environments.

The goal is to establish a robust security foundation that protects our application in production while maintaining excellent developer experience for local development. Our approach uses thin-sliced phases that build upon each other, each delivering testable, verifiable security improvements.

## Current State Analysis

After analyzing the codebase, we've identified several security areas that need improvement:

1. **Environment Management**: The application currently uses raw environment variables like `BYPASS_AUTH=true` without proper environment detection, which could lead to security bypasses in production.

2. **OAuth Implementation**: While GitHub OAuth is partially implemented, it lacks PKCE support and proper flow separation between edge and domain authentication.

3. **Developer Experience**: The current setup requires manual configuration and lacks streamlined development security defaults.

4. **Security Layer Boundaries**: The edge and domain security boundaries aren't clearly defined or enforced.

## Phased Implementation Plan

This milestone is divided into 5 thin-sliced phases, each focused on specific improvements that can be independently implemented and tested.

### Phase 1: Environment-Aware Security Core

**Objective**: Create a reliable environment detection system with appropriate security profiles.

**Tasks**:

1. Create an `EnvironmentService` class that detects the current environment using multiple signals:
   - `NODE_ENV` environment variable
   - Custom `APP_ENV` environment variable
   - Hostname checks
   - Default to highest security when uncertain

2. Implement security profiles for different environments:
   - `local`: Developer-friendly with optional security bypasses
   - `development`: Testing environment with full security
   - `staging`: Pre-production with production-level security
   - `production`: Maximum security, no bypasses

3. Update authentication middleware to use `EnvironmentService` instead of direct environment variables

4. Add comprehensive tests for environment detection and security profiles

5. Document the environment detection strategy and security profiles

**Technical Details**:

```typescript
// src/services/core/EnvironmentService.ts
export enum Environment {
  LOCAL = 'local',
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production'
}

export class EnvironmentService {
  private readonly environment: Environment;
  
  constructor() {
    this.environment = this.detectEnvironment();
    this.setupSecurityProfile();
    
    // In higher environments, log if any bypasses are detected
    if (this.environment !== Environment.LOCAL) {
      this.warnAboutSecurityBypasses();
    }
  }
  
  private detectEnvironment(): Environment {
    // Multi-factor environment detection
    const nodeEnv = process.env.NODE_ENV?.toLowerCase();
    const appEnv = process.env.APP_ENV?.toLowerCase();
    
    // Explicit app environment setting takes precedence
    if (appEnv === 'production') return Environment.PRODUCTION;
    if (appEnv === 'staging') return Environment.STAGING;
    if (appEnv === 'development') return Environment.DEVELOPMENT;
    if (appEnv === 'local') return Environment.LOCAL;
    
    // Fall back to NODE_ENV
    if (nodeEnv === 'production') return Environment.PRODUCTION;
    if (nodeEnv === 'test') return Environment.DEVELOPMENT;
    
    // Check other signals like hostname
    const hostname = require('os').hostname().toLowerCase();
    
    // If hostname contains production indicators
    if (
      hostname.includes('prod') || 
      hostname.includes('prd') ||
      hostname.includes('app')
    ) {
      return Environment.PRODUCTION;
    }
    
    // Default to local for development, but log a warning
    console.warn('EnvironmentService: Environment not explicitly set, defaulting to LOCAL');
    return Environment.LOCAL;
  }
  
  isAuthRequired(): boolean {
    // Auth is always required except in local with explicit bypass
    if (this.environment === Environment.LOCAL) {
      return process.env.DEV_REQUIRE_AUTH === 'true';
    }
    return true;
  }
  
  isLocalEnvironment(): boolean {
    return this.environment === Environment.LOCAL;
  }
  
  // Additional security profile methods
}
```

**Testing Criteria**:
- Unit tests should verify environment detection logic with various inputs
- Integration tests should confirm authentication behavior is environment-appropriate
- Test bypass functionality in local environment only
- Verify that attempting to enable bypasses in production logs warnings

### Phase 2: GitHub OAuth with PKCE

**Objective**: Implement the OAuth Authorization Code flow with PKCE for GitHub authentication.

**Tasks**:

1. Update `IOAuthProvider` interface to support PKCE parameters
2. Extend `GitHubOAuthProvider` to implement PKCE code challenge and verification
3. Create PKCE utilities for generating verifiers and challenge codes
4. Add persistent state and code verifier storage mechanism
5. Update authentication routes to support PKCE flow
6. Add client-side support for PKCE in frontend components
7. Add comprehensive tests for PKCE implementation

**Technical Details**:

```typescript
// src/utils/pkce.ts
export function generateCodeVerifier(): string {
  // Generate random string of 43-128 characters
  const length = 64;
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  
  const randomValues = new Uint8Array(length);
  crypto.randomFillSync(randomValues);
  
  for (let i = 0; i < length; i++) {
    result += charset[randomValues[i] % charset.length];
  }
  
  return result;
}

export async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  // Generate SHA-256 hash of verifier and base64url encode it
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  return base64UrlEncode(hashBuffer);
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  // Base64url encoding without padding
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
```

```typescript
// Updated IOAuthProvider interface
export interface IOAuthProvider {
  // Existing methods...
  
  getAuthorizationUrl(
    redirectUri: string, 
    state: string, 
    codeChallenge?: string,
    codeChallengeMethod?: 'S256' | 'plain',
    scopes?: string[]
  ): string;
  
  exchangeCodeForToken(
    code: string, 
    redirectUri: string,
    codeVerifier?: string
  ): Promise<OAuthUserProfile>;
}
```

```typescript
// Updated GitHub provider implementation
export class GitHubOAuthProvider implements IOAuthProvider {
  // Existing code...
  
  getAuthorizationUrl(
    redirectUri: string,
    state: string,
    codeChallenge?: string,
    codeChallengeMethod: 'S256' | 'plain' = 'S256',
    scopes: string[] = DEFAULT_SCOPES
  ): string {
    const scopeString = scopes.join(' ');
    
    // Construct the authorization URL with parameters
    const authUrl = new URL(GITHUB_OAUTH_URLS.authorize);
    authUrl.searchParams.append('client_id', this.clientId);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('scope', scopeString);
    authUrl.searchParams.append('response_type', 'code');
    
    // Add PKCE parameters if provided
    if (codeChallenge) {
      authUrl.searchParams.append('code_challenge', codeChallenge);
      authUrl.searchParams.append('code_challenge_method', codeChallengeMethod);
    }
    
    return authUrl.toString();
  }
  
  async exchangeCodeForToken(
    code: string, 
    redirectUri: string,
    codeVerifier?: string
  ): Promise<OAuthUserProfile> {
    try {
      // Create token request data
      const tokenRequestData: Record<string, string> = {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: redirectUri
      };
      
      // Add code verifier if provided (PKCE)
      if (codeVerifier) {
        tokenRequestData.code_verifier = codeVerifier;
      }
      
      // Exchange code for access token
      const tokenResponse = await axios.post(
        GITHUB_OAUTH_URLS.token, 
        tokenRequestData,
        {
          headers: {
            Accept: 'application/json'
          }
        }
      );
      
      // Rest of the implementation remains the same...
    }
  }
}
```

**Testing Criteria**:
- Unit tests should verify PKCE code generation and validation
- Integration tests should confirm the OAuth flow works with PKCE
- Security tests should verify PKCE protects against code interception attacks
- Edge cases like missing code verifier should be properly handled

### Phase 3: Edge-Domain Authentication Bridge

**Objective**: Create a clear separation between edge and domain authentication with robust security.

**Tasks**:

1. Enhance PKCE Storage with database backend support for scalability
2. Create an `AuthBridgeService` with secure token exchange and validation
3. Implement JWT security using environment-specific keys and asymmetric encryption
4. Create tiered domain-specific middleware for internal service authentication
5. Implement security headers via Helmet (moved from Phase 5 based on security analysis)
6. Add comprehensive testing covering security, performance, and edge cases

**DEFINITION OF DONE**:
- Phase 3 is NOT considered complete until ALL of the following criteria are met:
  - ALL tests are passing (server and client)
  - ALL code coverage thresholds are met (server and client)
  - ALL linting checks pass (server and client)
  - Code builds successfully (server and client)
  - Server and client both start without errors
  - Manual testing confirms the authentication bridge works correctly

**Important Notes**:
- If fixing one issue (e.g., tests) breaks another (e.g., linting), then both must be fixed before the phase is considered done
- After any code changes, the entire verification process must be repeated:
  1. Run ALL tests
  2. Check ALL code coverage thresholds
  3. Run ALL linting checks
  4. Build the code
  5. Start the application and verify functionality
- The phase is NOT complete if ANY of these checks fail for ANY reason

**Technical Details**:

#### 1. Enhanced PKCE Storage Implementation

```typescript
// src/providers/auth/pkce/PkceStorageFactory.ts
export class PkceStorageFactory {
  static create(environment: Environment): IPkceStorage {
    // Use environment to determine the appropriate storage
    if (environment === Environment.PRODUCTION || 
        environment === Environment.STAGING) {
      return new DatabasePkceStorage();
    }
    
    return new InMemoryPkceStorage();
  }
}

// src/providers/auth/pkce/DatabasePkceStorage.ts
export class DatabasePkceStorage implements IPkceStorage {
  constructor(
    private readonly db: Database,
    private readonly options: PkceStorageOptions = {}
  ) {
    // Ensure required tables exist
    this.initializeStorage();
  }
  
  private async initializeStorage(): Promise<void> {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS pkce_sessions (
        id TEXT PRIMARY KEY,
        code_verifier TEXT NOT NULL,
        code_challenge TEXT NOT NULL,
        code_challenge_method TEXT NOT NULL,
        redirect_uri TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL
      )
    `);
  }
  
  async createAuthSession(redirectUri: string, options: PkceOptions = {}): Promise<PkceAuthData> {
    // Create PKCE data with database storage
    const pkceData = createPkceData(redirectUri, options);
    
    // Store in database with expiration
    const expiresAt = pkceData.createdAt + (this.options.ttlMs || DEFAULT_TTL_MS);
    
    await this.db.run(`
      INSERT INTO pkce_sessions 
      (id, code_verifier, code_challenge, code_challenge_method, redirect_uri, created_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      pkceData.state,
      pkceData.codeVerifier,
      pkceData.codeChallenge,
      pkceData.codeChallengeMethod,
      pkceData.redirectUri,
      pkceData.createdAt,
      expiresAt
    ]);
    
    return pkceData;
  }
  
  async getAuthData(state: string): Promise<PkceAuthData | null> {
    // Get data from database
    const row = await this.db.get(`
      SELECT * FROM pkce_sessions WHERE id = ? AND expires_at > ?
    `, [state, Date.now()]);
    
    if (!row) return null;
    
    return {
      state: row.id,
      codeVerifier: row.code_verifier,
      codeChallenge: row.code_challenge,
      codeChallengeMethod: row.code_challenge_method as CodeChallengeMethod,
      redirectUri: row.redirect_uri,
      createdAt: row.created_at
    };
  }
  
  async cleanup(): Promise<void> {
    // Remove expired sessions
    await this.db.run(`DELETE FROM pkce_sessions WHERE expires_at < ?`, [Date.now()]);
  }
}
```

#### 2. JWT Security Enhancements

```typescript
// src/providers/auth/jwt/JwtKeyManager.ts
export class JwtKeyManager {
  private keys: Map<string, { publicKey: string, privateKey: string }> = new Map();
  
  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly secureStorage: ISecureStorage
  ) {}
  
  async initialize(): Promise<void> {
    // Load existing keys or generate new ones
    await this.loadOrGenerateKeys();
  }
  
  async getSigningKey(keyId?: string): Promise<{ keyId: string, privateKey: string }> {
    const environment = this.environmentService.getEnvironment();
    const defaultKeyId = `${environment.toLowerCase()}-${Date.now().toString().substring(0, 8)}`;
    
    const id = keyId || defaultKeyId;
    
    // Get or generate key pair
    const keyPair = await this.getOrCreateKeyPair(id);
    
    return {
      keyId: id,
      privateKey: keyPair.privateKey
    };
  }
  
  async getVerificationKey(keyId: string): Promise<string | null> {
    const keyPair = this.keys.get(keyId);
    
    if (!keyPair) {
      // Try to load from storage
      const storedKey = await this.secureStorage.get(`jwt_key_${keyId}`);
      
      if (storedKey) {
        try {
          const parsedKey = JSON.parse(storedKey);
          this.keys.set(keyId, parsedKey);
          return parsedKey.publicKey;
        } catch (error) {
          return null;
        }
      }
      
      return null;
    }
    
    return keyPair.publicKey;
  }
  
  private async generateAndStoreKeyPair(keyId: string): Promise<{ publicKey: string, privateKey: string }> {
    // Generate RSA key pair
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });
    
    const keyPair = { publicKey, privateKey };
    
    // Store key pair
    this.keys.set(keyId, keyPair);
    await this.secureStorage.set(`jwt_key_${keyId}`, JSON.stringify(keyPair));
    
    return keyPair;
  }
}
```

#### 3. Comprehensive AuthBridgeService

```typescript
// src/services/auth/IAuthBridgeService.ts
export interface IAuthBridgeService {
  validateEdgeToken(token: string): Promise<EdgeAuthContext>;
  generateDomainToken(edgeContext: EdgeAuthContext): Promise<string>;
  validateDomainToken(token: string): Promise<DomainAuthContext>;
}

export interface EdgeAuthContext {
  userId: string;
  email: string;
  name: string;
  scopes: string[];
  tier: 'edge';
  tokenId: string;
  issuedAt: number;
  expiresAt: number;
}

export interface DomainAuthContext extends EdgeAuthContext {
  tier: 'domain';
  domainScopes: string[];
  sourceTokenId: string;
}

// src/services/auth/AuthBridgeService.ts
export class AuthBridgeService implements IAuthBridgeService {
  private tokenCache: Map<string, { context: EdgeAuthContext | DomainAuthContext, expiresAt: number }> = new Map();
  
  constructor(
    private readonly jwtService: IJwtService,
    private readonly userRepository: IUserRepository,
    private readonly environmentService: EnvironmentService,
    private readonly logger: ILoggerService,
    private readonly options: AuthBridgeOptions = {}
  ) {}
  
  async validateEdgeToken(token: string): Promise<EdgeAuthContext> {
    try {
      // Check cache first for performance
      const cachedToken = this.getCachedToken(token);
      if (cachedToken && cachedToken.context.tier === 'edge') {
        return cachedToken.context as EdgeAuthContext;
      }
      
      // Verify edge token
      const verifiedToken = await this.jwtService.verifyToken(token);
      
      // Ensure token is edge tier
      if (verifiedToken.tier !== 'edge') {
        this.logger.warn('Token tier validation failed', {
          expectedTier: 'edge',
          actualTier: verifiedToken.tier,
          tokenId: verifiedToken.jti
        });
        
        throw new UnauthorizedError(
          'Invalid token tier',
          'Expected an edge tier token',
          AuthErrorCode.INVALID_TOKEN_TIER
        );
      }
      
      // Get user from repository to ensure they still exist
      const user = await this.userRepository.getUserById(verifiedToken.userId);
      if (!user) {
        this.logger.warn('User not found for token', {
          userId: verifiedToken.userId,
          tokenId: verifiedToken.jti
        });
        
        throw new UnauthorizedError(
          'User not found',
          'User associated with this token no longer exists',
          AuthErrorCode.USER_NOT_FOUND
        );
      }
      
      // Create edge context
      const edgeContext: EdgeAuthContext = {
        userId: user.id,
        email: user.email,
        name: user.displayName,
        scopes: verifiedToken.scopes || [],
        tier: 'edge',
        tokenId: verifiedToken.jti,
        issuedAt: verifiedToken.iat,
        expiresAt: verifiedToken.exp
      };
      
      // Cache the result
      this.cacheToken(token, edgeContext);
      
      return edgeContext;
    } catch (error) {
      this.logger.error('Edge token validation failed', error);
      throw new UnauthorizedError(
        'Invalid token',
        'The provided token is invalid or expired',
        AuthErrorCode.INVALID_TOKEN
      );
    }
  }
  
  async generateDomainToken(edgeContext: EdgeAuthContext): Promise<string> {
    // Generate domain token with elevated permissions based on environment
    const environment = this.environmentService.getEnvironment();
    
    // Define token lifetime based on environment
    const tokenLifetime = environment === Environment.PRODUCTION
      ? '15m'  // Short lifetime in production
      : '1h';  // Longer in dev/test
    
    // Get domain-specific scopes based on edge scopes
    const domainScopes = this.getDomainScopesForEdgeScopes(edgeContext.scopes);
    
    const domainTokenOptions = {
      expiresIn: tokenLifetime,
      algorithm: 'RS256',  // Use asymmetric keys in production
      keyId: `domain-${environment.toLowerCase()}`  // Environment-specific key
    };
    
    // Log token issuance
    this.logger.info('Generating domain token', {
      userId: edgeContext.userId,
      sourceTokenId: edgeContext.tokenId,
      scopes: domainScopes
    });
    
    // Generate domain token
    const domainToken = await this.jwtService.generateToken({
      userId: edgeContext.userId,
      email: edgeContext.email,
      name: edgeContext.name,
      scopes: [...edgeContext.scopes, ...domainScopes],
      tier: 'domain',
      sourceTokenId: edgeContext.tokenId
    }, domainTokenOptions);
    
    return domainToken;
  }
  
  async validateDomainToken(token: string): Promise<DomainAuthContext> {
    try {
      // Check cache first
      const cachedToken = this.getCachedToken(token);
      if (cachedToken && cachedToken.context.tier === 'domain') {
        return cachedToken.context as DomainAuthContext;
      }
      
      // Verify domain token with environment-specific keys
      const environment = this.environmentService.getEnvironment();
      const keyId = `domain-${environment.toLowerCase()}`;
      
      const verifiedToken = await this.jwtService.verifyToken(token, {
        algorithms: ['RS256'],
        keyId
      });
      
      // Ensure token is domain tier
      if (verifiedToken.tier !== 'domain') {
        throw new UnauthorizedError(
          'Invalid token tier',
          'Expected a domain tier token',
          AuthErrorCode.INVALID_TOKEN_TIER
        );
      }
      
      // Create domain context
      const domainContext: DomainAuthContext = {
        userId: verifiedToken.userId,
        email: verifiedToken.email,
        name: verifiedToken.name,
        scopes: verifiedToken.scopes || [],
        tier: 'domain',
        domainScopes: this.extractDomainScopes(verifiedToken.scopes || []),
        tokenId: verifiedToken.jti,
        sourceTokenId: verifiedToken.sourceTokenId,
        issuedAt: verifiedToken.iat,
        expiresAt: verifiedToken.exp
      };
      
      // Cache the result
      this.cacheToken(token, domainContext);
      
      return domainContext;
    } catch (error) {
      this.logger.error('Domain token validation failed', error);
      throw new UnauthorizedError(
        'Invalid domain token',
        'The provided domain token is invalid or expired',
        AuthErrorCode.INVALID_TOKEN
      );
    }
  }
}
```

#### 4. Domain Authentication Middleware

```typescript
// src/middleware/domain-auth-middleware.ts
export function createDomainAuthMiddleware(
  authBridgeService: IAuthBridgeService,
  loggerService: ILoggerService,
  options: DomainAuthOptions = {}
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get token from authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new UnauthorizedError(
          'Missing token',
          'Authorization header with Bearer token is required',
          AuthErrorCode.MISSING_TOKEN
        ));
      }
      
      const token = authHeader.substring(7);
      
      // Validate token
      const domainContext = await authBridgeService.validateDomainToken(token);
      
      // Check for required domain scopes
      if (options.requiredScopes) {
        const hasRequiredScopes = options.requiredScopes.every(scope => 
          domainContext.scopes.includes(scope)
        );
        
        if (!hasRequiredScopes) {
          loggerService.warn('Domain scope check failed', {
            userId: domainContext.userId,
            tokenId: domainContext.tokenId,
            requiredScopes: options.requiredScopes,
            actualScopes: domainContext.scopes
          });
          
          return next(new UnauthorizedError(
            'Insufficient permissions',
            'The provided token lacks required scopes',
            AuthErrorCode.INSUFFICIENT_PERMISSIONS
          ));
        }
      }
      
      // Attach domain context to request
      req.domainAuth = domainContext;
      
      // Continue with request
      next();
    } catch (error) {
      // Handle and log authentication errors
      loggerService.error('Domain authentication failed', error);
      return next(error);
    }
  };
}

// Factory method for creating middleware with different scope requirements
export function domainAuthMiddlewareFactory(
  authBridgeService: IAuthBridgeService,
  loggerService: ILoggerService
) {
  return {
    // Basic domain access - minimum permissions
    basic: createDomainAuthMiddleware(authBridgeService, loggerService, {
      requiredScopes: ['domain:access']
    }),
    
    // Read-only access
    readOnly: createDomainAuthMiddleware(authBridgeService, loggerService, {
      requiredScopes: ['domain:access', 'domain:read:threads']
    }),
    
    // Full access - read and write
    full: createDomainAuthMiddleware(authBridgeService, loggerService, {
      requiredScopes: ['domain:access', 'domain:read:threads', 'domain:write:threads']
    })
  };
}
```

#### 5. Security Headers Implementation

```typescript
// src/middleware/security-headers.ts
import helmet from 'helmet';
import { Environment, EnvironmentService } from '../services/core/EnvironmentService';

export function createSecurityHeadersMiddleware(environmentService: EnvironmentService) {
  return (req: Request, res: Response, next: NextFunction) => {
    const environment = environmentService.getEnvironment();
    const isLocal = environment === Environment.LOCAL;
    const isDevelopment = environment === Environment.DEVELOPMENT;
    
    // Configure Helmet based on environment
    const helmetOptions = {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          
          // Scripts - more restrictive in production
          scriptSrc: ["'self'"]
            .concat(isLocal ? ["'unsafe-inline'", "'unsafe-eval'"] : [])
            .concat(isDevelopment ? ["'unsafe-inline'"] : []),
          
          // Connections - allow more in development
          connectSrc: ["'self'"]
            .concat(isLocal || isDevelopment ? ["*"] : [
              "https://api.github.com",
              "https://api.openai.com",
              "https://api.anthropic.com"
            ]),
          
          // Images
          imgSrc: ["'self'", "data:", "https:"],
          
          // Styles
          styleSrc: ["'self'", "https:", "'unsafe-inline'"],
          
          // Object/embed
          objectSrc: ["'none'"],
          
          // Frame ancestors
          frameAncestors: ["'none'"]
        },
        reportOnly: isLocal || isDevelopment
      },
      
      // HSTS - only in production
      strictTransportSecurity: isLocal || isDevelopment ? false : {
        maxAge: 15552000, // 180 days
        includeSubDomains: true,
        preload: true
      },
      
      // X-Content-Type-Options
      contentTypeOptions: true,
      
      // X-Frame-Options
      frameguard: {
        action: 'deny'
      },
      
      // X-XSS-Protection
      xssFilter: true,
      
      // Referrer-Policy
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin'
      }
    };
    
    // Apply Helmet with options
    helmet(helmetOptions)(req, res, next);
  };
}
```

#### 6. Token Exchange Route

```typescript
// src/routes/domain/auth.ts
router.post('/exchange-token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return next(new BadRequestError('Missing token'));
    }
    
    // Validate edge token
    const edgeContext = await authBridgeService.validateEdgeToken(token);
    
    // Generate domain token
    const domainToken = await authBridgeService.generateDomainToken(edgeContext);
    
    // Return domain token
    res.json({ token: domainToken });
  } catch (error) {
    next(error);
  }
});
```

**Testing Criteria**:
- Unit tests should verify token exchange logic with different environments
- Integration tests should confirm edge tokens can be exchanged for domain tokens
- Security tests should verify domain endpoints reject edge tokens
- Performance tests should verify token caching works effectively
- Edge cases like invalid tokens and expired tokens should be properly handled
- Security headers should be verified in all environments

### Phase 4: Secure Local Development Experience

**Objective**: Create a streamlined secure development experience.

**Tasks**:

1. Create a development setup script for generating secure local defaults
2. Implement secure storage of development credentials
3. Add development mode indicator in UI when security bypasses are active
4. Create comprehensive documentation for local development
5. Add dev-mode specific routes for testing authentication flows
6. Test the development experience end-to-end

**DEFINITION OF DONE**:
- Phase 4 is NOT considered complete until ALL of the following criteria are met:
  - ALL tests are passing (server and client)
  - ALL code coverage thresholds are met (server and client)
  - ALL linting checks pass (server and client)
  - Code builds successfully (server and client)
  - Server and client both start without errors
  - Manual testing confirms the development experience works correctly
  - Setup script runs successfully and generates valid configurations

**Important Notes**:
- If fixing one issue (e.g., tests) breaks another (e.g., linting), then both must be fixed before the phase is considered done
- After any code changes, the entire verification process must be repeated:
  1. Run ALL tests
  2. Check ALL code coverage thresholds
  3. Run ALL linting checks
  4. Build the code
  5. Start the application and verify functionality
- The phase is NOT complete if ANY of these checks fail for ANY reason
- Just because CI passes doesn't mean the phase is done - manual verification is also required

**Technical Details**:

```typescript
// scripts/dev-setup.ts
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// Generate secure development credentials
async function setupDevEnvironment() {
  console.log('Setting up secure development environment...');
  
  // Generate random JWT secret
  const jwtSecret = crypto.randomBytes(32).toString('base64');
  
  // Generate random encryption key
  const encryptionKey = crypto.randomBytes(32).toString('base64');
  
  // Create .env.local file (git ignored)
  const envPath = path.join(process.cwd(), '.env.local');
  const envContent = `
# Local Development Environment
# Generated on ${new Date().toISOString()}
# DO NOT COMMIT THIS FILE

# Environment
NODE_ENV=development
APP_ENV=local

# Security Keys
JWT_SECRET=${jwtSecret}
ENCRYPTION_KEY=${encryptionKey}

# Local Development Settings
DEV_REQUIRE_AUTH=false
`;
  
  fs.writeFileSync(envPath, envContent);
  console.log(`Created ${envPath} with secure defaults`);
  
  // Set up GitHub OAuth if needed
  // ...
  
  console.log('Development environment setup complete!');
}

setupDevEnvironment().catch(console.error);
```

```typescript
// Dev routes for testing
router.get('/auth/dev/login', (req: Request, res: Response) => {
  // Only available in local environment
  if (!environment.isLocalEnvironment()) {
    return res.status(404).send('Not found');
  }
  
  // Generate a test user token
  const token = jwtService.generateToken({
    userId: 'dev-user-123',
    email: 'dev@example.com',
    name: 'Development User',
    scopes: ['read:profile', 'read:conversations', 'write:conversations'],
    tier: 'edge'
  });
  
  // Return token for testing
  res.json({ token });
});
```

**Testing Criteria**:
- Setup script should successfully generate secure defaults
- Development routes should only be accessible in local environment
- Security bypasses should be clearly indicated in the UI
- Developer workflow should remain smooth and efficient

### Phase 5: Security Monitoring and Hardening

**Objective**: Implement security monitoring and hardening features.

**Tasks**:

1. Implement proper security headers via Helmet
2. Add rate limiting for authentication endpoints
3. Create security event logging for authentication events
4. Implement JWT token blacklisting for logout
5. Add CSRF protection for sensitive operations
6. Create comprehensive security tests and documentation

**DEFINITION OF DONE**:
- Phase 5 is NOT considered complete until ALL of the following criteria are met:
  - ALL tests are passing (server and client)
  - ALL code coverage thresholds are met (server and client)
  - ALL linting checks pass (server and client)
  - Code builds successfully (server and client)
  - Server and client both start without errors
  - Manual security testing confirms all features function correctly
  - Security headers and protections are verified in all environments

**Important Notes**:
- If fixing one issue (e.g., tests) breaks another (e.g., linting), then both must be fixed before the phase is considered done
- After any code changes, the entire verification process must be repeated:
  1. Run ALL tests
  2. Check ALL code coverage thresholds
  3. Run ALL linting checks
  4. Build the code
  5. Start the application and verify functionality
- The phase is NOT complete if ANY of these checks fail for ANY reason
- Security features must be tested in all target environments, not just locally

**Technical Details**:

```typescript
// Security headers middleware
import helmet from 'helmet';

// Apply security headers based on environment
app.use((req, res, next) => {
  const isLocal = environment.isLocalEnvironment();
  
  // Configure Helmet based on environment
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"].concat(isLocal ? ["'unsafe-inline'"] : []),
        connectSrc: ["'self'"].concat(isLocal ? ["*"] : [
          "https://api.github.com"
        ]),
        // Other CSP directives...
      }
    },
    // HSTS configuration
    strictTransportSecurity: isLocal ? false : {
      maxAge: 15552000, // 180 days
      includeSubDomains: true
    }
    // Other Helmet options...
  })(req, res, next);
});
```

```typescript
// Rate limiting middleware
import rateLimit from 'express-rate-limit';

// Configure rate limiting based on environment
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: environment.isLocalEnvironment() ? 1000 : 10, // Higher limit for local
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later'
    }
  },
  // Skip rate limiting in local if configured
  skip: (req) => environment.isLocalEnvironment() && 
    process.env.DEV_SKIP_RATE_LIMIT === 'true'
});

// Apply to authentication routes
app.use('/api/v1/auth', authLimiter);
```

```typescript
// Security event logging
class SecurityLogger {
  logAuthEvent(event: string, details: Record<string, any>) {
    // Sanitize sensitive information
    const safeDetails = { ...details };
    delete safeDetails.token;
    delete safeDetails.password;
    
    // Log the event
    console.log(`SECURITY EVENT [${event}]`, safeDetails);
    
    // In production, log to security monitoring service
    if (environment.getEnvironment() === Environment.PRODUCTION) {
      // Log to external monitoring service
      // ...
    }
  }
}
```

**Testing Criteria**:
- Security headers should be properly configured for each environment
- Rate limiting should prevent brute force attacks
- Security events should be properly logged
- CSRF protection should prevent cross-site request forgery

## Implementation Roadmap

Each phase will be implemented sequentially, with thorough testing at each step to ensure security features work as expected without disrupting development workflows.

1. **Phase 1 (Environment-Aware Security Core)** - Days 1-2
   - Day 1: Create environment detection and security profiles
   - Day 2: Update authentication middleware and add tests

2. **Phase 2 (GitHub OAuth with PKCE)** - Days 3-5
   - Day 3: Implement PKCE utilities and update interfaces
   - Day 4: Update GitHub OAuth provider
   - Day 5: Add tests and documentation

3. **Phase 3 (Edge-Domain Authentication Bridge)** - Days 6-7
   - Day 6: Implement authentication bridge service
   - Day 7: Add domain authentication middleware and tests

4. **Phase 4 (Secure Local Development Experience)** - Days 8-9
   - Day 8: Create development setup script
   - Day 9: Add development routes and documentation

5. **Phase 5 (Security Monitoring and Hardening)** - Days 10-12
   - Day 10: Implement security headers and rate limiting
   - Day 11: Add security logging and CSRF protection
   - Day 12: Final testing and documentation

## Success Criteria

This milestone will be considered successful when:

1. GitHub OAuth authentication works flawlessly with PKCE
2. Environment-specific security controls are properly enforced
3. Edge-domain authentication boundary is clearly established
4. Development experience remains smooth and efficient
5. Security hardening features are properly implemented
6. ALL automated tests pass (server and client)
7. ALL code coverage thresholds are met (server and client)
8. ALL linting checks pass (server and client)
9. Code builds successfully and applications start without errors
10. Documentation is complete and accurate
11. Manual testing confirms all features work correctly

**IMPORTANT**: For each phase and for the entire milestone, verification must be comprehensive:
- If any test fails, the milestone is not complete
- If any coverage threshold is not met, the milestone is not complete
- If any linting check fails, the milestone is not complete
- If the code doesn't build or applications don't start, the milestone is not complete
- If manual testing reveals any issues, the milestone is not complete

All success criteria must be met simultaneously - fixing one issue must not create another.

## Risk Assessment

1. **Development Experience Risk**: Security improvements could impact developer productivity.
   - Mitigation: Prioritize local development experience throughout implementation.

2. **OAuth Implementation Complexity**: PKCE adds complexity to the OAuth flow.
   - Mitigation: Thorough testing of all authentication flows.

3. **Security Bypass Risk**: Development shortcuts could be accidentally enabled in production.
   - Mitigation: Strong environment detection and multiple security checks.

4. **Testing Complexity**: Security features can be difficult to test thoroughly.
   - Mitigation: Comprehensive test suite and acceptance criteria.

## Conclusion

Milestone 0009 establishes a robust security foundation for the Liminal Type Chat application, focusing on OAuth authentication with GitHub and environment-aware security controls. The phased approach ensures each security improvement is thoroughly tested and verified before moving on to the next phase, resulting in a secure application with an excellent developer experience.