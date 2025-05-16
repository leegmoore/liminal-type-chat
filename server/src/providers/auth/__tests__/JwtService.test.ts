/**
 * Tests for JwtService
 */
import { JwtService } from '../jwt/JwtService';
import jsonwebtoken from 'jsonwebtoken';
import { AuthErrorCode } from '../../../utils/error-codes';
import { IJwtService } from '../jwt/IJwtService';

// Mock jsonwebtoken
jest.mock('jsonwebtoken');
const mockedJwt = jsonwebtoken as jest.Mocked<typeof jsonwebtoken>;

describe('JwtService', () => {
  // Test setup
  let jwtService: IJwtService;
  
  // Sample test data
  const secretKey = 'test-secret-key';
  const userId = 'user-123';
  const userEmail = 'test@example.com';
  const expiresIn = '15m';
  
  // Mocked JWT
  const mockToken = 'mock.jwt.token';
  const mockDecodedToken = {
    sub: userId,
    email: userEmail,
    exp: Math.floor(Date.now() / 1000) + 900, // Current time + 15min
    iat: Math.floor(Date.now() / 1000),
    jti: 'token-id',
    scopes: ['read:profile'],
    name: 'Test User',
    tier: 'edge'
  };
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mocks
    mockedJwt.sign.mockReturnValue(mockToken);
    mockedJwt.verify.mockReturnValue(mockDecodedToken);
    
    // Create JwtService instance
    process.env.JWT_SECRET = secretKey;
    process.env.JWT_EXPIRES_IN = expiresIn;
    jwtService = new JwtService();
  });
  
  afterEach(() => {
    // Clean up environment variables
    delete process.env.JWT_SECRET;
    delete process.env.JWT_EXPIRES_IN;
  });
  
  describe('constructor', () => {
    it('should throw error if JWT_SECRET is not set', () => {
      // Arrange
      delete process.env.JWT_SECRET;
      
      // Act & Assert
      expect(() => new JwtService()).toThrow('JWT_SECRET environment variable is required');
    });
    
    it('should use default expiration time if JWT_EXPIRES_IN is not set', () => {
      // Arrange
      delete process.env.JWT_EXPIRES_IN;
      
      // Act
      const service = new JwtService();
      
      // Assert - use a separate method to check private property indirectly
      expect(() => service.generateToken({
        userId,
        email: userEmail,
        name: 'Test User',
        scopes: ['read:profile'],
        tier: 'edge'
      })).not.toThrow();
      
      expect(mockedJwt.sign).toHaveBeenCalledWith(
        expect.anything(),
        secretKey,
        expect.objectContaining({
          expiresIn: '30m' // Default value
        })
      );
    });
  });
  
  describe('generateToken', () => {
    it('should generate a JWT with correct payload', () => {
      // Arrange
      const payload = {
        userId,
        email: userEmail,
        name: 'Test User',
        scopes: ['read:profile'],
        tier: 'edge'
      };
      
      // Act
      const token = jwtService.generateToken(payload);
      
      // Assert
      expect(token).toBe(mockToken);
      expect(mockedJwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: userId,
          email: userEmail,
          name: 'Test User',
          scopes: ['read:profile'],
          tier: 'edge'
        }),
        secretKey,
        expect.objectContaining({
          expiresIn: expiresIn
        })
      );
    });
    
    it('should include a jti (JWT ID) in the token', () => {
      // Arrange
      const payload = {
        userId,
        email: userEmail,
        name: 'Test User',
        scopes: ['read:profile'],
        tier: 'edge'
      };
      
      // Act
      jwtService.generateToken(payload);
      
      // Assert
      expect(mockedJwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          jti: expect.any(String)
        }),
        expect.anything(),
        expect.anything()
      );
    });
    
    it('should use provided expiresIn option if specified', () => {
      // Arrange
      const payload = {
        userId,
        email: userEmail,
        name: 'Test User',
        scopes: ['read:profile'],
        tier: 'edge'
      };
      const customExpiresIn = '1h';
      
      // Act
      jwtService.generateToken(payload, { expiresIn: customExpiresIn });
      
      // Assert
      expect(mockedJwt.sign).toHaveBeenCalledWith(
        expect.anything(),
        secretKey,
        expect.objectContaining({
          expiresIn: customExpiresIn
        })
      );
    });
  });
  
  describe('verifyToken', () => {
    it('should verify a valid token and return the payload', () => {
      // Act
      const result = jwtService.verifyToken(mockToken);
      
      // Assert
      expect(mockedJwt.verify).toHaveBeenCalledWith(mockToken, secretKey);
      expect(result).toEqual({
        userId: mockDecodedToken.sub,
        email: mockDecodedToken.email,
        name: mockDecodedToken.name,
        scopes: mockDecodedToken.scopes,
        tokenId: mockDecodedToken.jti,
        tier: mockDecodedToken.tier,
        issuedAt: expect.any(Date),
        expiresAt: expect.any(Date)
      });
    });
    
    it('should throw UnauthorizedError for expired token', () => {
      // Arrange
      mockedJwt.verify.mockImplementationOnce(() => {
        type JwtError = Error & { name: string };
        const error = new Error('jwt expired') as JwtError;
        error.name = 'TokenExpiredError';
        throw error;
      });
      
      // Act & Assert
      expect(() => jwtService.verifyToken(mockToken))
        .toThrow(expect.objectContaining({
          errorCode: AuthErrorCode.EXPIRED_TOKEN
        }));
    });
    
    it('should throw UnauthorizedError for invalid token', () => {
      // Arrange
      mockedJwt.verify.mockImplementationOnce(() => {
        type JwtError = Error & { name: string };
        const error = new Error('invalid token') as JwtError;
        error.name = 'JsonWebTokenError';
        throw error;
      });
      
      // Act & Assert
      expect(() => jwtService.verifyToken(mockToken))
        .toThrow(expect.objectContaining({
          errorCode: AuthErrorCode.INVALID_CREDENTIALS
        }));
    });
    
    it('should throw UnauthorizedError for other verification errors', () => {
      // Arrange
      mockedJwt.verify.mockImplementationOnce(() => {
        throw new Error('other error');
      });
      
      // Act & Assert
      expect(() => jwtService.verifyToken(mockToken))
        .toThrow(expect.objectContaining({
          errorCode: AuthErrorCode.UNAUTHORIZED
        }));
    });
  });
  
  describe('decodeToken', () => {
    it('should decode a token without verification', () => {
      // Arrange
      mockedJwt.decode.mockReturnValueOnce(mockDecodedToken);
      
      // Act
      const result = jwtService.decodeToken(mockToken);
      
      // Assert
      expect(mockedJwt.decode).toHaveBeenCalledWith(mockToken);
      expect(result).toEqual({
        userId: mockDecodedToken.sub,
        email: mockDecodedToken.email,
        name: mockDecodedToken.name,
        scopes: mockDecodedToken.scopes,
        tokenId: mockDecodedToken.jti,
        tier: mockDecodedToken.tier,
        issuedAt: expect.any(Date),
        expiresAt: expect.any(Date)
      });
    });
    
    it('should return null for invalid token', () => {
      // Arrange
      mockedJwt.decode.mockReturnValueOnce(null);
      
      // Act
      const result = jwtService.decodeToken('invalid-token');
      
      // Assert
      expect(result).toBeNull();
    });
    
    it('should handle tokens with missing fields', () => {
      // Arrange
      const incompleteToken = {
        sub: userId,
        // Missing other fields
      };
      mockedJwt.decode.mockReturnValueOnce(incompleteToken);
      
      // Act
      const result = jwtService.decodeToken(mockToken);
      
      // Assert
      expect(result).toEqual(expect.objectContaining({
        userId: userId,
        // Other fields should be undefined
      }));
    });
  });
});