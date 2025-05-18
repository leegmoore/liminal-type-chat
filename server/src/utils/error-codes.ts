/**
 * Application Error Codes
 * Defines standardized error codes across the application
 * 
 * Error code groupings:
 * 1000-1999: General/System Errors
 * 2000-2999: Authentication/Authorization Errors
 * 3000-3999: Validation Errors
 * 4000-4999: Resource Errors (Not Found, Already Exists, etc.)
 * 5000-5999: Data Access/Database Errors
 * 6000-6999: External Service Errors (APIs, LLMs, etc.)
 * 7000-7999: Business Logic Errors
 */

/**
 * HTTP status codes mapped to their descriptions
 */
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}

/**
 * Application error code interface
 */
export interface ErrorCodeDefinition {
  code: number;
  message: string;
  httpStatus: HttpStatus;
}

/**
 * General/System Error Codes (1000-1999)
 */
export enum SystemErrorCode {
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  INVALID_CONFIGURATION = 'INVALID_CONFIGURATION',
}

/**
 * Authentication/Authorization Error Codes (2000-2999)
 */
export enum AuthErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  INVALID_TOKEN = 'INVALID_TOKEN',
  EXPIRED_TOKEN = 'EXPIRED_TOKEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_TOKEN_TIER = 'INVALID_TOKEN_TIER',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  MISSING_TOKEN = 'MISSING_TOKEN'
}

/**
 * Validation Error Codes (3000-3999)
 */
export enum ValidationErrorCode {
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  INVALID_PARAMETER = 'INVALID_PARAMETER',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  VALUE_TOO_SHORT = 'VALUE_TOO_SHORT',
  VALUE_TOO_LONG = 'VALUE_TOO_LONG',
  VALUE_OUT_OF_RANGE = 'VALUE_OUT_OF_RANGE',
}

/**
 * Resource Error Codes (4000-4999)
 */
export enum ResourceErrorCode {
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_STATE_CONFLICT = 'RESOURCE_STATE_CONFLICT',
}

/**
 * Data Access Error Codes (5000-5999)
 */
export enum DataAccessErrorCode {
  DATABASE_ERROR = 'DATABASE_ERROR',
  QUERY_FAILED = 'QUERY_FAILED',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  DATA_INTEGRITY_ERROR = 'DATA_INTEGRITY_ERROR',
}

/**
 * External Service Error Codes (6000-6999)
 */
export enum ExternalServiceErrorCode {
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  EXTERNAL_SERVICE_TIMEOUT = 'EXTERNAL_SERVICE_TIMEOUT',
  EXTERNAL_SERVICE_UNAVAILABLE = 'EXTERNAL_SERVICE_UNAVAILABLE',
  LLM_SERVICE_ERROR = 'LLM_SERVICE_ERROR',
  INVALID_API_KEY = 'INVALID_API_KEY',
}

/**
 * Business Logic Error Codes (7000-7999)
 */
export enum BusinessErrorCode {
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',
  PRECONDITION_FAILED = 'PRECONDITION_FAILED',
}

/**
 * Complete error code mappings
 * Maps error code enums to their definitions
 */
export const ERROR_CODES: Record<string, ErrorCodeDefinition> = {
  // System Error Codes (1000-1999)
  [SystemErrorCode.UNKNOWN_ERROR]: {
    code: 1000,
    message: 'An unknown error occurred',
    httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [SystemErrorCode.INTERNAL_SERVER_ERROR]: {
    code: 1001,
    message: 'Internal server error',
    httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [SystemErrorCode.SERVICE_UNAVAILABLE]: {
    code: 1010,
    message: 'Service temporarily unavailable',
    httpStatus: HttpStatus.SERVICE_UNAVAILABLE,
  },
  [SystemErrorCode.INVALID_CONFIGURATION]: {
    code: 1020,
    message: 'Invalid system configuration',
    httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
  },

  // Authentication Error Codes (2000-2999)
  [AuthErrorCode.UNAUTHORIZED]: {
    code: 2000,
    message: 'Authentication required',
    httpStatus: HttpStatus.UNAUTHORIZED,
  },
  [AuthErrorCode.INVALID_CREDENTIALS]: {
    code: 2010,
    message: 'Invalid credentials provided',
    httpStatus: HttpStatus.UNAUTHORIZED,
  },
  [AuthErrorCode.INVALID_TOKEN]: {
    code: 2015,
    message: 'Invalid token format or signature',
    httpStatus: HttpStatus.UNAUTHORIZED,
  },
  [AuthErrorCode.EXPIRED_TOKEN]: {
    code: 2020,
    message: 'Authentication token has expired',
    httpStatus: HttpStatus.UNAUTHORIZED,
  },
  [AuthErrorCode.INSUFFICIENT_PERMISSIONS]: {
    code: 2030,
    message: 'Insufficient permissions for this operation',
    httpStatus: HttpStatus.FORBIDDEN,
  },
  [AuthErrorCode.FORBIDDEN]: {
    code: 2040,
    message: 'Access forbidden',
    httpStatus: HttpStatus.FORBIDDEN,
  },
  [AuthErrorCode.INVALID_TOKEN_TIER]: {
    code: 2050,
    message: 'Invalid token security tier',
    httpStatus: HttpStatus.UNAUTHORIZED,
  },
  [AuthErrorCode.USER_NOT_FOUND]: {
    code: 2060,
    message: 'User not found',
    httpStatus: HttpStatus.UNAUTHORIZED,
  },
  [AuthErrorCode.MISSING_TOKEN]: {
    code: 2070,
    message: 'Missing authentication token',
    httpStatus: HttpStatus.UNAUTHORIZED,
  },

  // Validation Error Codes (3000-3999)
  [ValidationErrorCode.VALIDATION_FAILED]: {
    code: 3000,
    message: 'Validation failed',
    httpStatus: HttpStatus.BAD_REQUEST,
  },
  [ValidationErrorCode.INVALID_PARAMETER]: {
    code: 3010,
    message: 'Invalid parameter value',
    httpStatus: HttpStatus.BAD_REQUEST,
  },
  [ValidationErrorCode.MISSING_REQUIRED_FIELD]: {
    code: 3020,
    message: 'Required field is missing',
    httpStatus: HttpStatus.BAD_REQUEST,
  },
  [ValidationErrorCode.INVALID_FORMAT]: {
    code: 3030,
    message: 'Field format is invalid',
    httpStatus: HttpStatus.BAD_REQUEST,
  },
  [ValidationErrorCode.VALUE_TOO_SHORT]: {
    code: 3040,
    message: 'Value is too short',
    httpStatus: HttpStatus.BAD_REQUEST,
  },
  [ValidationErrorCode.VALUE_TOO_LONG]: {
    code: 3050,
    message: 'Value is too long',
    httpStatus: HttpStatus.BAD_REQUEST,
  },
  [ValidationErrorCode.VALUE_OUT_OF_RANGE]: {
    code: 3060,
    message: 'Value is outside acceptable range',
    httpStatus: HttpStatus.BAD_REQUEST,
  },

  // Resource Error Codes (4000-4999)
  [ResourceErrorCode.RESOURCE_NOT_FOUND]: {
    code: 4000,
    message: 'Resource not found',
    httpStatus: HttpStatus.NOT_FOUND,
  },
  [ResourceErrorCode.RESOURCE_ALREADY_EXISTS]: {
    code: 4010,
    message: 'Resource already exists',
    httpStatus: HttpStatus.CONFLICT,
  },
  [ResourceErrorCode.RESOURCE_STATE_CONFLICT]: {
    code: 4020,
    message: 'Resource is in an invalid state for this operation',
    httpStatus: HttpStatus.CONFLICT,
  },

  // Data Access Error Codes (5000-5999)
  [DataAccessErrorCode.DATABASE_ERROR]: {
    code: 5000,
    message: 'Database error occurred',
    httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [DataAccessErrorCode.QUERY_FAILED]: {
    code: 5010,
    message: 'Database query failed',
    httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [DataAccessErrorCode.TRANSACTION_FAILED]: {
    code: 5020,
    message: 'Database transaction failed',
    httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [DataAccessErrorCode.DATA_INTEGRITY_ERROR]: {
    code: 5030,
    message: 'Data integrity constraint violation',
    httpStatus: HttpStatus.BAD_REQUEST,
  },

  // External Service Error Codes (6000-6999)
  [ExternalServiceErrorCode.EXTERNAL_SERVICE_ERROR]: {
    code: 6000,
    message: 'External service error',
    httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [ExternalServiceErrorCode.EXTERNAL_SERVICE_TIMEOUT]: {
    code: 6010,
    message: 'External service request timed out',
    httpStatus: HttpStatus.SERVICE_UNAVAILABLE,
  },
  [ExternalServiceErrorCode.EXTERNAL_SERVICE_UNAVAILABLE]: {
    code: 6020,
    message: 'External service is unavailable',
    httpStatus: HttpStatus.SERVICE_UNAVAILABLE,
  },
  [ExternalServiceErrorCode.LLM_SERVICE_ERROR]: {
    code: 6100,
    message: 'LLM service error',
    httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [ExternalServiceErrorCode.INVALID_API_KEY]: {
    code: 6110,
    message: 'Invalid API key',
    httpStatus: HttpStatus.UNAUTHORIZED,
  },

  // Business Logic Error Codes (7000-7999)
  [BusinessErrorCode.BUSINESS_RULE_VIOLATION]: {
    code: 7000,
    message: 'Business rule violation',
    httpStatus: HttpStatus.UNPROCESSABLE_ENTITY,
  },
  [BusinessErrorCode.OPERATION_NOT_ALLOWED]: {
    code: 7010,
    message: 'Operation not allowed in current context',
    httpStatus: HttpStatus.UNPROCESSABLE_ENTITY,
  },
  [BusinessErrorCode.PRECONDITION_FAILED]: {
    code: 7020,
    message: 'Precondition for operation failed',
    httpStatus: HttpStatus.UNPROCESSABLE_ENTITY,
  },
};