# Error Codes Reference

**Last Updated:** 2025-05-18  
**Status:** Stable  
**Related Components:** Error Handling Middleware, API Responses

## Overview

This document provides a comprehensive list of all error codes used in the Liminal Type Chat API. Each error code maps to a specific HTTP status code and has a standard error message, ensuring consistent error handling throughout the application.

## Contents

- [Error Response Format](#error-response-format)
- [Error Code Categories](#error-code-categories)
- [System Errors](#system-errors-1000-1999)
- [Authentication Errors](#authentication-errors-2000-2999)
- [Validation Errors](#validation-errors-3000-3999)
- [Resource Errors](#resource-errors-4000-4999)
- [Data Access Errors](#data-access-errors-5000-5999)
- [External Service Errors](#external-service-errors-6000-6999)
- [Business Logic Errors](#business-logic-errors-7000-7999)

## Error Response Format

All API errors follow a standard JSON format:

```json
{
  "error": {
    "code": 1001,
    "message": "Internal server error"
  }
}
```

In non-production environments, additional details may be included:

```json
{
  "error": {
    "code": 1001,
    "message": "Internal server error",
    "details": "Detailed error information for debugging",
    "errorCode": "INTERNAL_SERVER_ERROR"
  }
}
```

For validation errors, the response may include an array of field-specific errors:

```json
{
  "error": {
    "code": 3000,
    "message": "Validation failed",
    "items": [
      {
        "field": "email",
        "code": 3030,
        "message": "Field format is invalid"
      },
      {
        "field": "password",
        "code": 3040,
        "message": "Value is too short"
      }
    ]
  }
}
```

## Error Code Categories

Error codes are grouped into categories, each with a range of 1000:

| Category | Code Range | Description |
|----------|------------|-------------|
| System | 1000-1999 | General system and unexpected errors |
| Authentication | 2000-2999 | Authentication and authorization errors |
| Validation | 3000-3999 | Input validation errors |
| Resource | 4000-4999 | Resource-related errors (not found, conflicts) |
| Data | 5000-5999 | Database and data access errors |
| External Service | 6000-6999 | Errors from external services and APIs |
| Business | 7000-7999 | Business rule violations |

## System Errors (1000-1999)

| Code | Error Code | HTTP Status | Message |
|------|------------|-------------|---------|
| 1000 | UNKNOWN_ERROR | 500 | An unknown error occurred |
| 1001 | INTERNAL_SERVER_ERROR | 500 | Internal server error |
| 1010 | SERVICE_UNAVAILABLE | 503 | Service temporarily unavailable |
| 1020 | INVALID_CONFIGURATION | 500 | Invalid system configuration |

## Authentication Errors (2000-2999)

| Code | Error Code | HTTP Status | Message |
|------|------------|-------------|---------|
| 2000 | UNAUTHORIZED | 401 | Authentication required |
| 2010 | INVALID_CREDENTIALS | 401 | Invalid credentials provided |
| 2020 | EXPIRED_TOKEN | 401 | Authentication token has expired |
| 2030 | INSUFFICIENT_PERMISSIONS | 403 | Insufficient permissions for this operation |
| 2040 | FORBIDDEN | 403 | Access forbidden |

## Validation Errors (3000-3999)

| Code | Error Code | HTTP Status | Message |
|------|------------|-------------|---------|
| 3000 | VALIDATION_FAILED | 400 | Validation failed |
| 3010 | INVALID_PARAMETER | 400 | Invalid parameter value |
| 3020 | MISSING_REQUIRED_FIELD | 400 | Required field is missing |
| 3030 | INVALID_FORMAT | 400 | Field format is invalid |
| 3040 | VALUE_TOO_SHORT | 400 | Value is too short |
| 3050 | VALUE_TOO_LONG | 400 | Value is too long |
| 3060 | VALUE_OUT_OF_RANGE | 400 | Value is outside acceptable range |

## Resource Errors (4000-4999)

| Code | Error Code | HTTP Status | Message |
|------|------------|-------------|---------|
| 4000 | RESOURCE_NOT_FOUND | 404 | Resource not found |
| 4010 | RESOURCE_ALREADY_EXISTS | 409 | Resource already exists |
| 4020 | RESOURCE_STATE_CONFLICT | 409 | Resource is in an invalid state for this operation |

## Data Access Errors (5000-5999)

| Code | Error Code | HTTP Status | Message |
|------|------------|-------------|---------|
| 5000 | DATABASE_ERROR | 500 | Database error occurred |
| 5010 | QUERY_FAILED | 500 | Database query failed |
| 5020 | TRANSACTION_FAILED | 500 | Database transaction failed |
| 5030 | DATA_INTEGRITY_ERROR | 400 | Data integrity constraint violation |

## External Service Errors (6000-6999)

| Code | Error Code | HTTP Status | Message |
|------|------------|-------------|---------|
| 6000 | EXTERNAL_SERVICE_ERROR | 500 | External service error |
| 6010 | EXTERNAL_SERVICE_TIMEOUT | 503 | External service request timed out |
| 6020 | EXTERNAL_SERVICE_UNAVAILABLE | 503 | External service is unavailable |
| 6100 | LLM_SERVICE_ERROR | 500 | LLM service error |
| 6110 | INVALID_API_KEY | 401 | Invalid API key |

## Business Logic Errors (7000-7999)

| Code | Error Code | HTTP Status | Message |
|------|------------|-------------|---------|
| 7000 | BUSINESS_RULE_VIOLATION | 422 | Business rule violation |
| 7010 | OPERATION_NOT_ALLOWED | 422 | Operation not allowed in current context |
| 7020 | PRECONDITION_FAILED | 422 | Precondition for operation failed |

## Examples

### Creating Error Objects in TypeScript

```typescript
// Base error class implementation
export class AppError extends Error {
  constructor(
    public message: string,
    public details?: string,
    public code: number = 1000,
    public errorCode: string = 'UNKNOWN_ERROR',
    public statusCode: number = 500,
    public items?: ErrorItem[]
  ) {
    super(message);
    this.name = this.constructor.name;
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  toJSON() {
    const error: any = {
      code: this.code,
      message: this.message
    };
    
    if (process.env.NODE_ENV !== 'production') {
      if (this.details) error.details = this.details;
      if (this.errorCode) error.errorCode = this.errorCode;
    }
    
    if (this.items) error.items = this.items;
    
    return { error };
  }
}

// Specialized error classes
export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: string, items?: ErrorItem[]) {
    super(message, details, 3000, 'VALIDATION_FAILED', 400, items);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', details?: string) {
    super(message, details, 4000, 'RESOURCE_NOT_FOUND', 404);
  }
}
```

### Using Error Codes in API Handlers

```typescript
// Example API endpoint using error codes
router.post('/api/conversations', async (req, res, next) => {
  try {
    const { title, modelId } = req.body;
    
    // Validate required fields
    if (!title) {
      throw new ValidationError('Validation failed', undefined, [
        { field: 'title', code: 3020, message: 'Required field is missing' }
      ]);
    }
    
    // Check if model exists and is valid
    if (modelId) {
      const model = await modelService.getModelById(modelId);
      if (!model) {
        throw new ValidationError('Validation failed', undefined, [
          { field: 'modelId', code: 3010, message: 'Invalid parameter value' }
        ]);
      }
    }
    
    // Create the conversation
    const conversation = await conversationService.createConversation({
      title,
      modelId: modelId || DEFAULT_MODEL_ID,
      userId: req.user.userId
    });
    
    res.status(201).json(conversation);
  } catch (error) {
    next(error); // Pass to error handling middleware
  }
});
```

## Best Practices

- Always use the defined error codes when returning error responses
- Use specialized error classes instead of generic errors
- Include detailed error information only in non-production environments
- For validation errors, include field-specific errors when possible
- Log all errors with appropriate severity based on error category
- Keep error messages user-friendly and actionable
- Maintain this reference document when adding new error codes

## Related Documentation

- [Development Standards](../standards/development-standards.md)
- [Security Implementation Guide](../../security/implementation.md)
- [API Reference](../../api/edge-api.md)

## Revision History

| Date | Changes | Author |
|------|---------|--------|
| 2025-05-18 | Migrated to wiki template | LLM Chat Team |
| 2025-05-05 | Added examples and best practices | LLM Chat Team |
| 2025-04-15 | Added LLM service errors | LLM Chat Team |
| 2025-04-01 | Initial version | LLM Chat Team |