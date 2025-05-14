/**
 * Custom error classes for standardized error handling
 */
import {
  ERROR_CODES,
  SystemErrorCode,
  ValidationErrorCode,
  ResourceErrorCode,
  AuthErrorCode,
  ExternalServiceErrorCode,
  BusinessErrorCode,
  DataAccessErrorCode
} from './error-codes';

/**
 * Validation error item for field-specific validation errors
 */
export interface ValidationErrorItem {
  field: string;
  code: number;
  message: string;
  errorCode?: string;
}

/**
 * Base application error class
 */
export class AppError extends Error {
  /** HTTP status code */
  statusCode: number;
  
  /** Application error code */
  code: number;
  
  /** Error code enum key (for documentation reference) */
  errorCode: string;
  
  /** Optional additional error details for debugging */
  details?: string;
  
  /** Optional collection of validation errors */
  items?: ValidationErrorItem[];
  
  /**
   * Create a new AppError
   * @param errorCode - Error code enum value
   * @param message - Optional custom error message (overrides default)
   * @param details - Optional error details
   * @param items - Optional validation error items
   */
  constructor(
    errorCode: string, 
    message?: string, 
    details?: string, 
    items?: ValidationErrorItem[]
  ) {
    // Get error definition or use unknown error as fallback
    const errorDef = ERROR_CODES[errorCode] || ERROR_CODES[SystemErrorCode.UNKNOWN_ERROR];
    
    // Use custom message or default message from error definition
    super(message || errorDef.message);
    
    this.statusCode = errorDef.httpStatus;
    this.code = errorDef.code;
    this.errorCode = errorCode;
    this.name = this.constructor.name;
    this.details = details;
    this.items = items;
    
    // Capture stack trace (if available in this environment)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  /**
   * Convert error to JSON representation for API responses
   */
  toJSON() {
    type ErrorResponse = {
      error: {
        code: number;
        message: string;
        details?: string;
        errorCode?: string;
        items?: ValidationErrorItem[];
      }
    };
    
    const response: ErrorResponse = {
      error: {
        code: this.code,
        message: this.message
      }
    };
    
    // Include error details in non-production environments
    if (process.env.NODE_ENV !== 'production' && this.details) {
      response.error.details = this.details;
    }
    
    // Always include error code in the response
    response.error.errorCode = this.errorCode;
    
    // Include validation items if present
    if (this.items && this.items.length > 0) {
      response.error.items = this.items;
    }
    
    return response;
  }
}

/**
 * Error for when a resource is not found
 */
export class NotFoundError extends AppError {
  /**
   * Create a new NotFoundError
   * @param message - Custom error message (optional)
   * @param details - Error details (optional)
   * @param resourceType - Type of resource that wasn't found (optional)
   * @param resourceId - ID of resource that wasn't found (optional)
   */
  constructor(message?: string, details?: string, resourceType?: string, resourceId?: string) {
    super(
      ResourceErrorCode.RESOURCE_NOT_FOUND,
      message,
      details || (
        resourceType && resourceId 
          ? `${resourceType} with ID ${resourceId} not found` 
          : undefined
      )
    );
  }
}

/**
 * Error for invalid request data
 */
export class ValidationError extends AppError {
  /**
   * Create a new ValidationError
   * @param message - Custom error message (optional)
   * @param details - Error details (optional)
   * @param items - Validation error items (optional)
   */
  constructor(message?: string, details?: string, items?: ValidationErrorItem[]) {
    super(ValidationErrorCode.VALIDATION_FAILED, message, details, items);
  }
  
  /**
   * Add a validation error item
   * @param field - Field name with validation error
   * @param message - Error message
   * @param errorCode - Specific validation error code enum (optional)
   * @returns this (for chaining)
   */
  addError(field: string, message: string, errorCode?: string): ValidationError {
    if (!this.items) {
      this.items = [];
    }
    
    const code = errorCode ? ERROR_CODES[errorCode]?.code : this.code;
    
    this.items.push({
      field,
      code: code || this.code,
      message,
      errorCode
    });
    
    return this;
  }
}

/**
 * Error for unauthorized access
 */
export class UnauthorizedError extends AppError {
  /**
   * Create a new UnauthorizedError
   * @param message - Custom error message (optional)
   * @param details - Error details (optional)
   * @param errorCode - Specific error code (optional, defaults to UNAUTHORIZED)
   */
  constructor(message?: string, details?: string, errorCode?: string) {
    super(errorCode || AuthErrorCode.UNAUTHORIZED, message, details);
  }
}

/**
 * Error for forbidden access
 */
export class ForbiddenError extends AppError {
  /**
   * Create a new ForbiddenError
   * @param message - Custom error message (optional)
   * @param details - Error details (optional)
   */
  constructor(message?: string, details?: string) {
    super(AuthErrorCode.FORBIDDEN, message, details);
  }
}

/**
 * Error for service unavailability
 */
export class ServiceUnavailableError extends AppError {
  /**
   * Create a new ServiceUnavailableError
   * @param message - Custom error message (optional)
   * @param details - Error details (optional)
   */
  constructor(message?: string, details?: string) {
    super(SystemErrorCode.SERVICE_UNAVAILABLE, message, details);
  }
}

/**
 * Error for database access issues
 */
export class DatabaseError extends AppError {
  /**
   * Create a new DatabaseError
   * @param message - Custom error message (optional)
   * @param details - Error details (optional)
   * @param originalError - Original database error (optional)
   */
  constructor(message?: string, details?: string, originalError?: Error) {
    super(
      DataAccessErrorCode.DATABASE_ERROR,
      message,
      details || (originalError ? originalError.message : undefined)
    );
  }
}

/**
 * Error for external service issues
 */
export class ExternalServiceError extends AppError {
  /**
   * Create a new ExternalServiceError
   * @param message - Custom error message (optional)
   * @param details - Error details (optional)
   * @param serviceName - Name of the external service (optional)
   */
  constructor(message?: string, details?: string, serviceName?: string) {
    super(
      ExternalServiceErrorCode.EXTERNAL_SERVICE_ERROR,
      message || (serviceName ? `Error communicating with ${serviceName}` : undefined),
      details
    );
  }
}

/**
 * Error for business rule violations
 */
export class BusinessError extends AppError {
  /**
   * Create a new BusinessError
   * @param message - Custom error message (optional)
   * @param details - Error details (optional)
   */
  constructor(message?: string, details?: string) {
    super(BusinessErrorCode.BUSINESS_RULE_VIOLATION, message, details);
  }
}
