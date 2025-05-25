[<< Back to Root README](../README.md)

# Liminal Type Chat Error Codes

This document provides a comprehensive list of all error codes used in the Liminal Type Chat API. Each error code maps to a specific HTTP status code and has a standard error message.

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
