/**
 * Tests for custom error classes
 */
import {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ServiceUnavailableError,
  DatabaseError,
  ExternalServiceError,
  BusinessError,
  ValidationErrorItem
} from '../errors';
import {
  SystemErrorCode,
  ValidationErrorCode,
  ResourceErrorCode,
  AuthErrorCode,
  DataAccessErrorCode,
  ExternalServiceErrorCode,
  BusinessErrorCode,
  ERROR_CODES
} from '../error-codes';

describe('Error classes', () => {
  // Save original NODE_ENV
  const originalNodeEnv = process.env.NODE_ENV;
  
  afterEach(() => {
    // Restore NODE_ENV after each test
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('AppError', () => {
    it('should create base error with correct properties', () => {
      const error = new AppError(SystemErrorCode.UNKNOWN_ERROR);
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toHaveProperty('message');
      expect(error).toHaveProperty('statusCode');
      expect(error).toHaveProperty('code');
      expect(error).toHaveProperty('errorCode', SystemErrorCode.UNKNOWN_ERROR);
      expect(error).toHaveProperty('name', 'AppError');
    });
    
    it('should use custom message when provided', () => {
      const customMessage = 'Custom error message';
      const error = new AppError(SystemErrorCode.UNKNOWN_ERROR, customMessage);
      
      expect(error.message).toBe(customMessage);
    });
    
    it('should use default message when not provided', () => {
      const defaultMessage = ERROR_CODES[SystemErrorCode.UNKNOWN_ERROR].message;
      const error = new AppError(SystemErrorCode.UNKNOWN_ERROR);
      
      expect(error.message).toBe(defaultMessage);
    });
    
    it('should include details when provided', () => {
      const details = 'Error details';
      const error = new AppError(SystemErrorCode.UNKNOWN_ERROR, 'Message', details);
      
      expect(error.details).toBe(details);
    });
    
    it('should include validation items when provided', () => {
      const items: ValidationErrorItem[] = [
        { field: 'username', code: 3000, message: 'Required field' }
      ];
      const error = new AppError(ValidationErrorCode.VALIDATION_FAILED, 'Message', 'Details', items);
      
      expect(error.items).toEqual(items);
    });
    
    it('should generate JSON representation with all fields in development mode', () => {
      process.env.NODE_ENV = 'development';
      const error = new AppError(
        SystemErrorCode.UNKNOWN_ERROR,
        'Error message',
        'Error details'
      );
      
      const json = error.toJSON();
      
      expect(json).toHaveProperty('error');
      expect(json.error).toHaveProperty('code', error.code);
      expect(json.error).toHaveProperty('message', error.message);
      expect(json.error).toHaveProperty('errorCode', error.errorCode);
      expect(json.error).toHaveProperty('details', error.details);
    });
    
    it('should exclude details in production mode', () => {
      process.env.NODE_ENV = 'production';
      const error = new AppError(
        SystemErrorCode.UNKNOWN_ERROR,
        'Error message',
        'Error details'
      );
      
      const json = error.toJSON();
      
      expect(json.error).toHaveProperty('code');
      expect(json.error).toHaveProperty('message');
      expect(json.error).toHaveProperty('errorCode');
      expect(json.error).not.toHaveProperty('details');
    });
    
    it('should include validation items in JSON representation', () => {
      const items: ValidationErrorItem[] = [
        { field: 'username', code: 3000, message: 'Required field' }
      ];
      const error = new AppError(
        ValidationErrorCode.VALIDATION_FAILED,
        'Validation error',
        'Invalid data',
        items
      );
      
      const json = error.toJSON();
      
      expect(json.error).toHaveProperty('items', items);
    });
  });
  
  describe('ValidationError', () => {
    it('should create validation error with correct error code', () => {
      const error = new ValidationError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.errorCode).toBe(ValidationErrorCode.VALIDATION_FAILED);
    });
    
    it('should add validation error items', () => {
      const error = new ValidationError();
      
      error.addError('field1', 'Error message');
      
      expect(error.items).toHaveLength(1);
      expect(error.items![0]).toHaveProperty('field', 'field1');
      expect(error.items![0]).toHaveProperty('message', 'Error message');
      expect(error.items![0]).toHaveProperty('code');
    });
    
    it('should allow chaining of addError method', () => {
      const error = new ValidationError()
        .addError('field1', 'Error 1')
        .addError('field2', 'Error 2');
      
      expect(error.items).toHaveLength(2);
    });
    
    it('should use specific error code when provided', () => {
      const error = new ValidationError()
        .addError('username', 'Too short', ValidationErrorCode.VALUE_TOO_SHORT);
      
      expect(error.items![0]).toHaveProperty('errorCode', ValidationErrorCode.VALUE_TOO_SHORT);
      expect(error.items![0].code).toBe(ERROR_CODES[ValidationErrorCode.VALUE_TOO_SHORT].code);
    });
  });
  
  describe('NotFoundError', () => {
    it('should create not found error with correct error code', () => {
      const error = new NotFoundError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.errorCode).toBe(ResourceErrorCode.RESOURCE_NOT_FOUND);
    });
    
    it('should include resource details when provided', () => {
      const error = new NotFoundError(
        'Resource not found',
        undefined,
        'User',
        '123'
      );
      
      expect(error.details).toBe('User with ID 123 not found');
    });
  });
  
  describe('UnauthorizedError', () => {
    it('should create unauthorized error with correct error code', () => {
      const error = new UnauthorizedError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.errorCode).toBe(AuthErrorCode.UNAUTHORIZED);
    });
  });
  
  describe('ForbiddenError', () => {
    it('should create forbidden error with correct error code', () => {
      const error = new ForbiddenError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.errorCode).toBe(AuthErrorCode.FORBIDDEN);
    });
  });
  
  describe('ServiceUnavailableError', () => {
    it('should create service unavailable error with correct error code', () => {
      const error = new ServiceUnavailableError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.errorCode).toBe(SystemErrorCode.SERVICE_UNAVAILABLE);
    });
  });
  
  describe('DatabaseError', () => {
    it('should create database error with correct error code', () => {
      const error = new DatabaseError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.errorCode).toBe(DataAccessErrorCode.DATABASE_ERROR);
    });
    
    it('should use original error message as details when provided', () => {
      const originalError = new Error('DB connection failed');
      const error = new DatabaseError('Database error', undefined, originalError);
      
      expect(error.details).toBe(originalError.message);
    });
  });
  
  describe('ExternalServiceError', () => {
    it('should create external service error with correct error code', () => {
      const error = new ExternalServiceError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.errorCode).toBe(ExternalServiceErrorCode.EXTERNAL_SERVICE_ERROR);
    });
    
    it('should include service name in message when provided', () => {
      const error = new ExternalServiceError(undefined, undefined, 'Payment Gateway');
      
      expect(error.message).toBe('Error communicating with Payment Gateway');
    });
  });
  
  describe('BusinessError', () => {
    it('should create business error with correct error code', () => {
      const error = new BusinessError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.errorCode).toBe(BusinessErrorCode.BUSINESS_RULE_VIOLATION);
    });
  });
});