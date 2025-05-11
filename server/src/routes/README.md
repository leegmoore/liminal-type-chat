# Routes

This directory contains the API routes for the application, organized into two tiers:

## Structure

- `domain/`: Domain API routes
  - Implements canonical business endpoints
  - Operates on domain models
  - Path prefix: `/api/v1/domain/`
  - Example: `/api/v1/domain/health`

- `edge/`: Edge/XPI API routes
  - UI-optimized endpoints
  - Transforms data between domain models and UI-friendly formats
  - Path prefix: `/api/v1/edge/`
  - Example: `/api/v1/edge/health`

## Implementation Guidelines

1. Routes should be organized by feature
2. Domain routes should use domain services directly
3. Edge routes should use domain client adapters
4. Routes should follow consistent error handling patterns
5. Routes should validate all inputs
6. Routes should include appropriate HTTP status codes
