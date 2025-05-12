# Development Standards: Error Handling Standards

- **Error Types**:
  - Define domain-specific error classes extending Error
  - Include error code, message, and contextual data
  - Example categories: ValidationError, NotFoundError, ServiceError

- **Error Propagation**:
  - Domain services should throw typed errors
  - Edge layer translates errors to appropriate HTTP responses
  - Always preserve stack traces (`new Error('message', { cause: originalError })`)

- **Async Error Handling**:
  - Use try/catch with async/await
  - Avoid unhandled promise rejections

- **Client Error Messages**:
  - User-friendly messages for client-facing errors
  - Never expose sensitive information in error messages
  - Include request IDs for traceability

- **Logging**:
  - Log all errors with appropriate context
  - Debug-level logging for handled errors
  - Error-level logging for unexpected errors
