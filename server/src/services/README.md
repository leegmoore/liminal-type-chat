# Services

This directory contains the domain services that implement the core business logic of the application.

## Structure

- `core/`: Core domain services that implement the main business functionalities
  - Example: `health-service.ts` - Provides health check functionality
  
- `adapters/`: Adapter services that integrate with external systems
  - Example: Future LLM adapters that connect to various provider APIs

## Implementation Guidelines

1. Services should follow the dependency injection pattern
2. Each service should have a clear, single responsibility
3. Services should be thoroughly tested (90% coverage minimum)
4. Services should throw typed errors for exceptional cases
5. Services should validate inputs
6. Services should not directly depend on HTTP or UI concerns
