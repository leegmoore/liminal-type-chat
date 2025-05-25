# Updated Implementation Plan for Phase 3: Edge-Domain Authentication Bridge

Based on security analysis feedback and architecture recommendations, we've enhanced the implementation plan for Phase 3 of Milestone 0009. This phase focuses on creating a clear separation between edge and domain authentication with improved security.

## Objective

Create a robust, scalable authentication bridge between edge and domain layers that enforces proper security boundaries and follows security best practices.

## Enhanced Tasks

### 1. Enhanced PKCE Storage Implementation

Extend the current PKCE implementation to support scalable storage options:

- Create a `PkceStorageFactory` that can produce different storage implementations
- Implement a `DatabasePkceStorage` class that uses SQLite for persistence
- Add automatic TTL functionality for verifier expiration
- Create migration scripts for the database tables
- Use environment-specific configuration to select the appropriate storage strategy
- Add comprehensive tests for all storage implementations

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
  
  async removeAuthSession(state: string): Promise<void> {
    await this.db.run(`DELETE FROM pkce_sessions WHERE id = ?`, [state]);
  }
  
  async cleanup(): Promise<void> {
    // Remove expired sessions
    await this.db.run(`DELETE FROM pkce_sessions WHERE expires_at < ?`, [Date.now()]);
  }
}
```

### 2. Comprehensive AuthBridgeService Implementation

Create a more robust AuthBridgeService with enhanced features:

- Implement the service interface according to architectural recommendations
- Add proper validation for token tiers and contexts
- Implement asymmetric key support for token signing
- Add environment-specific JWT configurations
- Create comprehensive logging for security events
- Implement token validation caching for performance

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
  
  private getDomainScopesForEdgeScopes(edgeScopes: string[]): string[] {
    // Map edge scopes to corresponding domain scopes
    const domainScopes: string[] = [];
    
    if (edgeScopes.includes('read:conversations')) {
      domainScopes.push('domain:read:threads');
    }
    
    if (edgeScopes.includes('write:conversations')) {
      domainScopes.push('domain:write:threads');
    }
    
    // Always add these scopes for domain access
    domainScopes.push('domain:access');
    domainScopes.push('internal:api');
    
    return domainScopes;
  }
  
  private extractDomainScopes(scopes: string[]): string[] {
    // Extract only domain-specific scopes
    return scopes.filter(scope => 
      scope.startsWith('domain:') || scope.startsWith('internal:')
    );
  }
  
  private getCachedToken(token: string): { context: EdgeAuthContext | DomainAuthContext, expiresAt: number } | null {
    const cached = this.tokenCache.get(token);
    
    if (!cached) return null;
    
    // If token is expired in cache, remove it
    if (cached.expiresAt < Date.now()) {
      this.tokenCache.delete(token);
      return null;
    }
    
    return cached;
  }
  
  private cacheToken(token: string, context: EdgeAuthContext | DomainAuthContext): void {
    // Convert expiration from seconds to milliseconds
    const expiresAt = context.expiresAt * 1000;
    
    // Only cache if not expired
    if (expiresAt > Date.now()) {
      this.tokenCache.set(token, { context, expiresAt });
    }
    
    // Cleanup cache periodically
    this.cleanupCache();
  }
  
  private cleanupCache(): void {
    const now = Date.now();
    
    // Remove expired tokens
    for (const [token, cached] of this.tokenCache.entries()) {
      if (cached.expiresAt < now) {
        this.tokenCache.delete(token);
      }
    }
  }
}
```

### 3. Domain-Specific Authentication Middleware

Create enhanced middleware for domain authentication:

- Create tiered middleware for different security levels
- Add comprehensive validation for domain tokens
- Implement proper error handling and logging
- Support different scopes for different domain endpoints

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
      
      // Log successful authentication
      loggerService.debug('Domain authentication successful', {
        userId: domainContext.userId,
        tokenId: domainContext.tokenId,
        endpoint: req.path
      });
      
      // Continue with request
      next();
    } catch (error) {
      // Handle and log authentication errors
      if (error instanceof UnauthorizedError) {
        return next(error);
      }
      
      loggerService.error('Domain authentication failed', error);
      
      return next(new UnauthorizedError(
        'Authentication failed',
        'Failed to authenticate domain request',
        AuthErrorCode.AUTHENTICATION_FAILED
      ));
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
    }),
    
    // Create custom middleware with specific scope requirements
    withScopes: (scopes: string[]) => createDomainAuthMiddleware(
      authBridgeService, 
      loggerService, 
      { requiredScopes: ['domain:access', ...scopes] }
    )
  };
}
```

### 4. Security Headers Implementation

Add environment-aware security headers (moved from Phase 5 based on AI feedback):

- Implement Helmet middleware with environment-specific configurations
- Create appropriate CSP policies for different environments
- Add reporting endpoints for security violations

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
          
          // Fonts
          fontSrc: ["'self'", "https:", "data:"],
          
          // Media
          mediaSrc: ["'self'"],
          
          // Object/embed
          objectSrc: ["'none'"],
          
          // Form actions
          formAction: ["'self'"],
          
          // Frame ancestors
          frameAncestors: ["'none'"],
          
          // Base URI
          baseUri: ["'self'"],
          
          // Reporting
          reportUri: '/api/v1/security/csp-report'
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
      },
      
      // Feature-Policy / Permissions-Policy
      permissionsPolicy: {
        features: {
          geolocation: ["'none'"],
          camera: ["'none'"],
          microphone: ["'none'"],
          notifications: ["'self'"],
          // Other feature policies...
        }
      }
    };
    
    // Apply Helmet with options
    helmet(helmetOptions)(req, res, next);
  };
}
```

### 5. JWT Token Security Enhancements

Implement environment-specific JWT configurations:

- Create asymmetric key pairs for token signing
- Implement key rotation mechanism
- Add environment-specific keys
- Set up proper token validation options

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
  
  private async loadOrGenerateKeys(): Promise<void> {
    const environment = this.environmentService.getEnvironment();
    const prefix = environment.toLowerCase();
    
    // Try to load existing keys
    const keyIds = await this.secureStorage.getKeys(`jwt_key_${prefix}`);
    
    if (keyIds.length > 0) {
      // Load existing keys
      for (const fullKeyId of keyIds) {
        const keyId = fullKeyId.replace('jwt_key_', '');
        const storedKey = await this.secureStorage.get(fullKeyId);
        
        if (storedKey) {
          try {
            const keyPair = JSON.parse(storedKey);
            this.keys.set(keyId, keyPair);
          } catch (error) {
            // Ignore invalid keys
          }
        }
      }
    } else {
      // Generate new key pairs for each environment
      const environments = [
        Environment.LOCAL,
        Environment.DEVELOPMENT,
        Environment.STAGING,
        Environment.PRODUCTION
      ];
      
      for (const env of environments) {
        const keyId = `${env.toLowerCase()}-initial`;
        await this.generateAndStoreKeyPair(keyId);
      }
    }
  }
  
  private async getOrCreateKeyPair(keyId: string): Promise<{ publicKey: string, privateKey: string }> {
    // Check if key exists
    const existingKey = this.keys.get(keyId);
    
    if (existingKey) {
      return existingKey;
    }
    
    // Generate new key pair
    return this.generateAndStoreKeyPair(keyId);
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

// src/providers/auth/jwt/EnhancedJwtService.ts
export class EnhancedJwtService implements IJwtService {
  constructor(
    private readonly keyManager: JwtKeyManager,
    private readonly options: JwtServiceOptions = {}
  ) {}
  
  async generateToken(payload: JwtPayload, options: JwtGenerateOptions = {}): Promise<string> {
    const { keyId, privateKey } = await this.keyManager.getSigningKey(options.keyId);
    
    // Set default expiration based on environment and token tier
    const expiresIn = options.expiresIn || this.getDefaultExpiration(payload.tier);
    
    // Generate token with asymmetric key
    return jwt.sign(payload, privateKey, {
      algorithm: 'RS256',
      expiresIn,
      keyid: keyId,
      jwtid: uuidv4() // Unique token ID
    });
  }
  
  async verifyToken(token: string, options: JwtVerifyOptions = {}): Promise<JwtPayload> {
    try {
      // Decode token header to get key ID
      const decoded = jwt.decode(token, { complete: true });
      
      if (!decoded || !decoded.header || !decoded.header.kid) {
        throw new Error('Invalid token format or missing key ID');
      }
      
      const keyId = decoded.header.kid;
      
      // Get public key for verification
      const publicKey = await this.keyManager.getVerificationKey(keyId);
      
      if (!publicKey) {
        throw new Error(`Unknown key ID: ${keyId}`);
      }
      
      // Verify token
      const verifiedToken = jwt.verify(token, publicKey, {
        algorithms: ['RS256'],
        ...options
      });
      
      // Check if token is blacklisted (if blacklist service is available)
      if (this.options.tokenBlacklist) {
        const isBlacklisted = await this.options.tokenBlacklist.isBlacklisted(
          typeof verifiedToken === 'object' && verifiedToken.jti 
            ? verifiedToken.jti 
            : ''
        );
        
        if (isBlacklisted) {
          throw new Error('Token has been revoked');
        }
      }
      
      return verifiedToken as JwtPayload;
    } catch (error) {
      // Handle common JWT errors
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedError(
          'Token expired',
          'The provided token has expired',
          AuthErrorCode.TOKEN_EXPIRED
        );
      }
      
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedError(
          'Invalid token',
          'The provided token is invalid',
          AuthErrorCode.INVALID_TOKEN
        );
      }
      
      // Re-throw other errors
      throw error;
    }
  }
  
  private getDefaultExpiration(tier: string): string {
    const environment = this.options.environmentService?.getEnvironment() || Environment.PRODUCTION;
    
    // Different expiration times based on environment and tier
    if (tier === 'domain') {
      // Domain tokens have shorter lifetime
      return environment === Environment.PRODUCTION 
        ? '15m'  // 15 minutes in production
        : '1h';   // 1 hour in other environments
    }
    
    // Edge tokens
    switch (environment) {
      case Environment.PRODUCTION:
        return '1h';  // 1 hour in production
      case Environment.STAGING:
        return '4h';  // 4 hours in staging
      case Environment.DEVELOPMENT:
        return '8h';  // 8 hours in development
      case Environment.LOCAL:
        return '24h'; // 24 hours in local
      default:
        return '1h';  // Default to 1 hour
    }
  }
}
```

### 6. Comprehensive Test Suite

Create thorough tests for the new components:

- Unit tests for all new services and utilities
- Integration tests for the authentication flow
- Security tests for token validation
- Performance tests for token caching

```typescript
// src/providers/auth/jwt/__tests__/EnhancedJwtService.test.ts
describe('EnhancedJwtService', () => {
  let jwtService: EnhancedJwtService;
  let keyManager: JwtKeyManager;
  let mockEnvironmentService: EnvironmentService;
  
  beforeEach(() => {
    // Setup mocks
    mockEnvironmentService = {
      getEnvironment: jest.fn().mockReturnValue(Environment.DEVELOPMENT)
    } as unknown as EnvironmentService;
    
    keyManager = new JwtKeyManager(
      mockEnvironmentService,
      MockSecureStorage.create()
    );
    
    jwtService = new EnhancedJwtService(keyManager, {
      environmentService: mockEnvironmentService
    });
  });
  
  test('should generate token with environment-specific expiration', async () => {
    // Test token generation
    // ...
  });
  
  test('should properly handle different environments', async () => {
    // Test environment-specific settings
    // ...
  });
  
  test('should verify tokens with proper key ID', async () => {
    // Test token verification
    // ...
  });
  
  test('should reject expired tokens', async () => {
    // Test token expiration
    // ...
  });
  
  // More tests...
});

// src/services/auth/__tests__/AuthBridgeService.test.ts
describe('AuthBridgeService', () => {
  let authBridgeService: AuthBridgeService;
  let mockJwtService: IJwtService;
  let mockUserRepository: IUserRepository;
  let mockEnvironmentService: EnvironmentService;
  let mockLogger: ILoggerService;
  
  beforeEach(() => {
    // Setup mocks
    // ...
    
    authBridgeService = new AuthBridgeService(
      mockJwtService,
      mockUserRepository,
      mockEnvironmentService,
      mockLogger
    );
  });
  
  test('should validate edge tokens correctly', async () => {
    // Test edge token validation
    // ...
  });
  
  test('should generate domain tokens from edge context', async () => {
    // Test domain token generation
    // ...
  });
  
  test('should cache token validation results', async () => {
    // Test caching behavior
    // ...
  });
  
  test('should reject tokens with wrong tier', async () => {
    // Test tier validation
    // ...
  });
  
  // More tests...
});

// src/middleware/__tests__/domain-auth-middleware.test.ts
describe('Domain Auth Middleware', () => {
  let middleware: Function;
  let mockAuthBridgeService: IAuthBridgeService;
  let mockLoggerService: ILoggerService;
  
  beforeEach(() => {
    // Setup mocks
    // ...
    
    middleware = createDomainAuthMiddleware(
      mockAuthBridgeService,
      mockLoggerService,
      { requiredScopes: ['domain:access'] }
    );
  });
  
  test('should pass request with valid domain token', async () => {
    // Test successful authentication
    // ...
  });
  
  test('should reject request with edge token', async () => {
    // Test tier validation
    // ...
  });
  
  test('should reject request with missing required scopes', async () => {
    // Test scope validation
    // ...
  });
  
  // More tests...
});
```

## Additional Implementation Details

### Routes for Token Exchange

- Create routes for exchanging edge tokens for domain tokens
- Add security and rate limiting for token exchange endpoints
- Implement proper error handling and logging

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

### Configuration and Initialization

- Create factory functions for new services
- Add proper dependency injection
- Implement environment-specific configuration

```typescript
// src/providers/auth/jwt/JwtServiceFactory.ts
export class JwtServiceFactory {
  static create(
    environmentService: EnvironmentService,
    secureStorage: ISecureStorage,
    options: JwtServiceOptions = {}
  ): IJwtService {
    // Create key manager
    const keyManager = new JwtKeyManager(environmentService, secureStorage);
    
    // Initialize key manager
    keyManager.initialize().catch(error => {
      console.error('Failed to initialize JWT key manager:', error);
      throw error;
    });
    
    // Create JWT service
    return new EnhancedJwtService(keyManager, {
      environmentService,
      ...options
    });
  }
}

// src/services/auth/AuthBridgeServiceFactory.ts
export class AuthBridgeServiceFactory {
  static create(
    jwtService: IJwtService,
    userRepository: IUserRepository,
    environmentService: EnvironmentService,
    loggerService: ILoggerService,
    options: AuthBridgeOptions = {}
  ): IAuthBridgeService {
    return new AuthBridgeService(
      jwtService,
      userRepository,
      environmentService,
      loggerService,
      options
    );
  }
}
```

## Testing Criteria

The implementation must be thoroughly tested to ensure proper security:

1. **Unit Testing**:
   - Verify all service methods independently
   - Test edge cases and error handling
   - Verify proper environment-specific behavior
   - Ensure proper validation of tokens and scopes

2. **Integration Testing**:
   - Test the complete authentication flow from edge to domain
   - Verify token exchange and validation in various scenarios
   - Test middleware behavior with different token types
   - Verify proper security header configuration

3. **Security Testing**:
   - Ensure domain endpoints reject edge tokens
   - Verify security headers are correctly applied
   - Test JWT token security across environments
   - Ensure PKCE storage properly handles session data

4. **Performance Testing**:
   - Benchmark token validation with caching
   - Test storage implementations with large datasets
   - Verify efficient cleanup of expired sessions

## Implementation Roadmap

1. **Week 1: Core Services**
   - Implement enhanced PKCE storage with database support
   - Create JwtKeyManager for environment-specific keys
   - Develop EnhancedJwtService with asymmetric key support
   - Test core services independently

2. **Week 2: Authentication Bridge**
   - Implement AuthBridgeService
   - Create domain authentication middleware
   - Add token exchange endpoints
   - Test token exchange and validation

3. **Week 3: Security Enhancements**
   - Implement security headers middleware
   - Add token caching for performance
   - Set up proper error handling and logging
   - Test security features across environments

4. **Week 4: Integration and Testing**
   - Integrate all components
   - Conduct comprehensive testing
   - Fix issues and optimize performance
   - Document the implementation

## Success Criteria

The Phase 3 implementation will be considered successful when:

1. Edge tokens can be reliably exchanged for domain tokens
2. Domain endpoints properly validate domain tokens
3. Token validation is efficient and secure
4. Security headers are properly configured for all environments
5. PKCE storage is scalable and secure
6. JWT tokens use environment-specific keys
7. All tests pass with high coverage

This updated plan addresses the critical security issues identified in the AI feedback while enhancing the architecture for scalability and performance.