/**
 * Tests for Enhanced JWT Service with asymmetric keys
 */
import { EnhancedJwtService } from '../EnhancedJwtService';
import { JwtKeyManager } from '../JwtKeyManager';
import { Environment, EnvironmentService } from '../../../../services/core/EnvironmentService';
import { TokenPayload } from '../IJwtService';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../../../../utils/errors';

// Mock dependencies
jest.mock('../JwtKeyManager');
jest.mock('../../../../services/core/EnvironmentService');
jest.mock('jsonwebtoken');

describe('EnhancedJwtService', () => {
  let jwtService: EnhancedJwtService;
  let mockKeyManager: jest.Mocked<JwtKeyManager>;
  let mockEnvironmentService: jest.Mocked<EnvironmentService>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Set up key manager mock
    mockKeyManager = {
      initialize: jest.fn().mockResolvedValue(undefined),
      getSigningKey: jest.fn().mockResolvedValue({
        keyId: 'test-key-id',
        privateKey: 'test-private-key'
      }),
      getVerificationKey: jest.fn().mockResolvedValue('test-public-key'),
      rotateKeys: jest.fn().mockResolvedValue(undefined)
    } as unknown as jest.Mocked<JwtKeyManager>;
    
    // Set up environment service mock
    mockEnvironmentService = {
      getEnvironment: jest.fn().mockReturnValue(Environment.DEVELOPMENT),
      useExtendedTokenLifetime: jest.fn().mockReturnValue(false)
    } as unknown as jest.Mocked<EnvironmentService>;
    
    // Set up JWT mock
    (jwt.sign as jest.Mock).mockReturnValue('mocked-jwt-token');
    (jwt.verify as jest.Mock).mockReturnValue({
      sub: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      scopes: ['read:profile'],
      tier: 'edge',
      jti: 'token-id-123',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    });
    
    // Create service instance
    jwtService = new EnhancedJwtService(mockKeyManager, mockEnvironmentService);
  });

  describe('initialization', () => {
    it('should initialize the key manager', async () => {
      // Act: just creating the service should init key manager
      await jwtService.initialize();
      
      // Assert
      expect(mockKeyManager.initialize).toHaveBeenCalled();
    });
  });

  describe('generateToken', () => {
    it('should use asymmetric keys to sign tokens by default', async () => {
      // Setup: sample token payload
      const payload: TokenPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        scopes: ['read:profile'],
        tier: 'edge'
      };
      
      // Act
      const token = await jwtService.generateToken(payload);
      
      // Assert
      expect(token).toBe('mocked-jwt-token');
      expect(mockKeyManager.getSigningKey).toHaveBeenCalled();
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: 'user-123',
          email: 'test@example.com'
        }),
        'test-private-key',
        expect.objectContaining({
          algorithm: 'RS256',
          keyid: 'test-key-id'
        })
      );
    });

    it('should use extended token lifetime in development/local environments', async () => {
      // Setup: mock extended token lifetime
      mockEnvironmentService.useExtendedTokenLifetime.mockReturnValue(true);
      
      const payload: TokenPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        scopes: ['read:profile'],
        tier: 'edge'
      };
      
      // Act
      await jwtService.generateToken(payload);
      
      // Assert: Check for longer expiration
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(String),
        expect.objectContaining({
          expiresIn: '24h' // Extended lifetime
        })
      );
    });

    it('should respect provided token options', async () => {
      // Setup: sample token payload with custom options
      const payload: TokenPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        scopes: ['read:profile'],
        tier: 'edge'
      };
      
      const options = {
        expiresIn: '5m',
        algorithm: 'HS256' as const,
        keyId: 'custom-key-id'
      };
      
      // Act
      await jwtService.generateToken(payload, options);
      
      // Assert: Check for custom options
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(String),
        expect.objectContaining({
          expiresIn: '5m',
          algorithm: 'HS256',
          keyid: expect.any(String) // We can't control the exact keyid since it comes from the key manager
        })
      );
    });
  });

  describe('verifyToken', () => {
    it('should verify a token using the right public key', async () => {
      // Setup: token with key ID
      const token = 'test-token-with-keyid';
      
      // Mock JWT decode to return a header with kid
      (jwt.decode as jest.Mock).mockReturnValueOnce({
        header: {
          kid: 'test-key-id'
        }
      });
      
      // Act
      const result = await jwtService.verifyToken(token);
      
      // Assert
      expect(result).toBeDefined();
      expect(mockKeyManager.getVerificationKey).toHaveBeenCalledWith('test-key-id');
      expect(jwt.verify).toHaveBeenCalledWith(
        token,
        'test-public-key',
        expect.objectContaining({
          algorithms: ['RS256']
        })
      );
    });

    it('should throw if key ID is missing', async () => {
      // Setup: token without key ID
      const token = 'test-token-without-keyid';
      
      // Mock JWT decode to return a header without kid
      (jwt.decode as jest.Mock).mockReturnValueOnce({
        header: {}
      });
      
      // Act & Assert
      await expect(jwtService.verifyToken(token)).rejects.toThrow(UnauthorizedError);
    });

    it('should throw if public key not found', async () => {
      // Setup: token with key ID but no matching key
      const token = 'test-token-unknown-keyid';
      
      // Mock JWT decode to return a header with kid
      (jwt.decode as jest.Mock).mockReturnValueOnce({
        header: {
          kid: 'unknown-key-id'
        }
      });
      
      // Mock key manager to return null (key not found)
      mockKeyManager.getVerificationKey.mockResolvedValueOnce(null);
      
      // Act & Assert
      await expect(jwtService.verifyToken(token)).rejects.toThrow(UnauthorizedError);
    });

    it('should handle JWT verification errors', async () => {
      // Setup: token with valid key ID
      const token = 'test-token-invalid';
      
      // Mock JWT decode to return a header with kid
      (jwt.decode as jest.Mock).mockReturnValueOnce({
        header: {
          kid: 'test-key-id'
        }
      });
      
      // Mock JWT verify to throw
      (jwt.verify as jest.Mock).mockImplementationOnce(() => {
        throw new jwt.TokenExpiredError('token expired', new Date());
      });
      
      // Act & Assert
      await expect(jwtService.verifyToken(token)).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('decodeToken', () => {
    it('should decode a token without verification', async () => {
      // Setup: token to decode
      const token = 'test-token-to-decode';
      
      // Mock JWT decode to return a payload
      (jwt.decode as jest.Mock).mockReturnValueOnce({
        sub: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        scopes: ['read:profile'],
        tier: 'edge',
        jti: 'token-id-123',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      });
      
      // Act
      const result = await jwtService.decodeToken(token);
      
      // Assert
      expect(result).toBeDefined();
      expect(result?.userId).toBe('user-123');
      expect(jwt.decode).toHaveBeenCalledWith(token);
    });

    it('should return null for invalid tokens', async () => {
      // Setup: invalid token
      const token = 'invalid-token';
      
      // Mock JWT decode to return null
      (jwt.decode as jest.Mock).mockReturnValueOnce(null);
      
      // Act
      const result = await jwtService.decodeToken(token);
      
      // Assert
      expect(result).toBeNull();
    });
  });

  describe('environment-specific behavior', () => {
    it('should use shorter token lifetimes in production', async () => {
      // Setup: mock production environment
      mockEnvironmentService.getEnvironment.mockReturnValue(Environment.PRODUCTION);
      mockEnvironmentService.useExtendedTokenLifetime.mockReturnValue(false);
      
      const payload: TokenPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        scopes: ['read:profile'],
        tier: 'edge'
      };
      
      // Act
      await jwtService.generateToken(payload);
      
      // Assert: Check for shorter expiration
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(String),
        expect.objectContaining({
          expiresIn: '15m' // Short lifetime for production
        })
      );
    });
  });
});