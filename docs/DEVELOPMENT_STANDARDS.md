# Liminal Type Chat Development Standards

This document outlines the development standards and conventions used in the Liminal Type Chat project. These standards are designed to ensure code quality, maintainability, and a consistent development experience across the codebase.

## Table of Contents

- [Code Formatting and Style](#code-formatting-and-style)
- [Naming Conventions](#naming-conventions)
- [Documentation Standards](#documentation-standards)
- [Error Handling Standards](#error-handling-standards)
- [Testing Standards](#testing-standards)
- [Architectural Guidelines](#architectural-guidelines)
- [Dependency Injection](#dependency-injection)
- [Async Code Standards](#async-code-standards)
- [React Frontend Standards](#react-frontend-standards)

## Code Formatting and Style

- **Linting & Formatting**:
  - ESLint with TypeScript plugin for code quality
  - Prettier for consistent formatting
  - Configuration in `.eslintrc.js` and `.prettierrc`

- **Line Length**: Maximum 100 characters per line

- **Indentation**: 2 spaces (not tabs)

- **Quotes**: Single quotes for strings, backticks for template literals

- **Semicolons**: Required at the end of statements

- **Import Order**:
  1. External libraries
  2. Internal modules (absolute paths)
  3. Local files (relative paths)
  4. Type imports
  Each group separated by a blank line

- **Trailing Commas**: Required for multi-line arrays and objects

- **Interface vs Type**: Prefer interfaces for object definitions, types for unions/intersections

## Naming Conventions

- **Database**: Use `snake_case` for all table and column names
  - Examples: `context_threads`, `user_id`, `last_model`

- **JavaScript/TypeScript Variables**: Use `camelCase` for variables and object properties
  - Examples: `userId`, `contextThread`, `lastModel`

- **Classes/Types/Interfaces**: Use `PascalCase` for classes, types, and interfaces
  - Examples: `ContextThread`, `UserRepository`, `GenerateResponse`

- **Files/Resources**: Use `kebab-case` for file names and URL resources
  - Examples: `context-thread.ts`, `user-repository.ts`, `/api/context-threads`

- **Constants**: Use `UPPER_SNAKE_CASE` for constants
  - Examples: `MAX_TOKEN_COUNT`, `DEFAULT_MODEL`

## Documentation Standards

- **JSDoc Comments**:
  - Required for all public functions, classes, and interfaces
  - Include @param, @returns, and @throws tags as appropriate
  - Example:
  ```typescript
  /**
   * Retrieves a context thread by its ID
   * @param threadId - The UUID of the thread to retrieve
   * @returns The context thread if found
   * @throws NotFoundException if thread doesn't exist
   */
  async getThreadById(threadId: string): Promise<ContextThread>
  ```

- **README Files**:
  - Each significant directory should have a README.md explaining its purpose
  - Main README.md should include setup instructions, project overview, and development guidelines

- **Code Comments**:
  - Focus on WHY not WHAT (code should be self-explanatory)
  - Comment complex algorithms, business rules, or non-obvious decisions
  - Use TODO: comments for incomplete work (but track these in issues too)

- **API Documentation**:
  - All API endpoints must include documentation comments
  - Document request/response formats, possible status codes
  - Use OpenAPI/Swagger annotations where appropriate

## Error Handling Standards

- **Standardized Error Code System**:
  - Hierarchical error codes grouped by category (1000-1999, 2000-2999, etc.)
  - Each error code maps to exactly one HTTP status code
  - One-to-many relationship between HTTP status codes and error codes
  - Complete documentation in `/docs/ERROR_CODES.md`
  - Categories include:
    - 1000-1999: System/General Errors
    - 2000-2999: Authentication/Authorization Errors
    - 3000-3999: Validation Errors
    - 4000-4999: Resource Errors
    - 5000-5999: Data Access Errors
    - 6000-6999: External Service Errors
    - 7000-7999: Business Logic Errors

- **Standardized Error Response Format**:
  ```json
  {
    "error": {
      "code": 3000,
      "message": "Validation failed"
    }
  }
  ```
  - Non-production environments include additional details:
  ```json
  {
    "error": {
      "code": 3000,
      "message": "Validation failed",
      "details": "Detailed error information",
      "errorCode": "VALIDATION_FAILED"
    }
  }
  ```
  - Support for validation error collections:
  ```json
  {
    "error": {
      "code": 3000,
      "message": "Validation failed",
      "items": [
        { "field": "email", "code": 3030, "message": "Invalid format" }
      ]
    }
  }
  ```

- **Error Types**:
  - Define domain-specific error classes extending AppError base class
  - Include error code, message, details, and validation items where applicable
  - Standard error classes: ValidationError, NotFoundError, UnauthorizedError, etc.

- **Error Propagation**:
  - Domain services should throw typed errors
  - Error handler middleware translates errors to standardized HTTP responses
  - Always preserve stack traces for debugging

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
  - More verbose logging in non-production environments

## Testing Standards

- **Coverage Requirements**:
  - Domain services: 90% minimum coverage
  - Edge/route handlers: 80% minimum coverage
  - Utility functions: 80% minimum coverage

- **Test Organization**:
  - Tests are organized in a dedicated `/test` directory with separate folders for test types:
    - `/test/unit`: Unit tests targeting individual functions and classes
    - `/test/integration`: Integration tests targeting component interactions
  - Unit test directory structure mirrors the source code structure (e.g., `/test/unit/services`)
  - Use Jest's describe/it pattern for logical test organization
  - Follow AAA pattern (Arrange, Act, Assert)

- **Test Naming**:
  - Format: `should [expected behavior] when [condition]`
  - Examples: `should return 404 when thread not found`

- **Test Types**:
  - Unit tests: Test individual functions in isolation
  - Integration tests: Test interactions between components
  - HTTP tests: Test API endpoints using Supertest

- **Mocking**:
  - Mock external dependencies (DB, LLM providers, etc.) in unit tests
  - Use Jest mocks and spies consistently
  - For integration tests, prefer test doubles over network calls

- **Test Data**:
  - Use factories or fixtures for test data generation
  - Avoid hardcoding test data directly in test files
  - Explain edge cases with comments

## Architectural Guidelines

The Liminal Type Chat application follows a tiered architecture:

1. **Domain Tier**:
   - Contains core business logic and canonical data models
   - Agnostic to HTTP, UI concerns, or specific database implementations
   - Has the highest test coverage requirements (90%)

2. **Edge/XPI Tier**:
   - Handles HTTP requests/responses
   - Transforms data between UI-friendly formats and domain models
   - Routes to appropriate domain services
   - Implementation of the API layer

3. **UI Tier**:
   - React-based frontend with TypeScript
   - Uses Chakra UI for consistent, accessible components
   - Communicates with backend via type-safe API calls
   - Handles presentation, user interaction, and state management
   - Follows component-based architecture with clear separation of concerns

4. **Domain Client Adapter Pattern**:
   - Enables Edge routes to communicate with domain services
   - Can operate in-process or via HTTP calls (cross-process)
   - Provides flexibility in deployment options
   - Implementation follows interface segregation principle
   - Example interfaces:
     ```typescript
     // Domain service interface
     interface HealthService {
       checkHealth(): Promise<HealthStatus>;
       checkDatabaseHealth(): Promise<DatabaseHealthStatus>;
     }
     
     // Client adapter interface for edge tier
     interface HealthServiceClient {
       checkHealth(): Promise<HealthStatus>;
       checkDatabaseHealth(): Promise<DatabaseHealthStatus>;
     }
     ```
   - Example implementations:
     - `DirectHealthServiceClient`: In-process communication
     - `HttpHealthServiceClient`: HTTP-based communication

## Dependency Injection

- **Constructor Injection**:
  - Pass dependencies through constructor parameters
  - Example: `constructor(private dbProvider: DatabaseProvider, private configService: ConfigService) {}`

- **Dependencies as Interfaces**:
  - Define interfaces for all dependencies
  - Example: 
    ```typescript
    interface DatabaseProvider {
      query(sql: string, params?: any[]): Promise<any>;
      exec(sql: string, params?: any[]): void;
      healthCheck(): Promise<boolean>;
      close(): void;
    }
    ```
  - Implementations can vary (SQLite, PostgreSQL, etc.) while maintaining the same API

- **Factories**:
  - Use factory functions to create instances with dependencies
  - Example: `const createHealthService = (dbProvider) => new HealthService(dbProvider);`

- **Testing**:
  - Pass mock implementations to constructors in tests
  - Example: `const healthService = new HealthService(mockDbProvider);`

- **Avoid**:
  - Singletons (except in specific justified cases)
  - Direct imports of concrete implementations inside classes
  - Service locator patterns

## Server Management

- **Utility Scripts**:
  - Placed in the `server/scripts` directory
  - Follow a consistent style and error handling approach
  - Examples include:
    - `server-control.sh`: Start, stop, status, and restart functionality
    - `db-backup.sh`: Database backup operations
    - `db-health-check.sh`: Database integrity checks

- **Port Management**:
  - Use consistent port (8765) for development
  - Services should check for port availability before starting
  - Proper error handling for port conflicts

- **Database Operations**:
  - Regular backups via utility scripts
  - Integrity checks via health endpoints
  - Schema initialization at startup

## Async Code Standards

- **Prefer async/await** over direct Promise chains for readability

- **Promise Management**:
  - Use `Promise.all()` for parallel operations
  - Use `Promise.allSettled()` when partial failures are acceptable

- **Timeouts**:
  - Add timeouts to external service calls
  - Implement with Promise race or AbortController

- **Error Propagation**:
  - Always catch async errors at boundary layers
  - Include original error as `cause` when re-throwing

- **Testing**:
  - Use Jest's `done()` or `async/await` consistently
  - Test both success and failure paths

- **Avoid**:
  - Mixing callback and Promise patterns
  - Deeply nested async operations
  - Unhandled Promise rejections

## React Frontend Standards

### Component Structure

- **Component Organization**:
  - Place components in appropriate directories (`/components`, `/pages`)
  - Follow single responsibility principle
  - Split large components into smaller, reusable pieces

- **Component Types**:
  - **Container Components**: Handle data fetching, state management, and business logic
  - **Presentation Components**: Focus on UI rendering with minimal state
  - **Layout Components**: Manage arrangement of elements on the page

- **Naming Conventions**:
  - Use PascalCase for component names
  - Use descriptive names that reflect the component's purpose
  - Suffix test files with `.test.tsx`

### State Management

- **Local State**: Use React's useState for component-specific state
- **Prop Drilling**: Avoid excessive prop drilling; consider context or hooks for shared state
- **Context API**: Use for state shared across multiple components
- **Custom Hooks**: Create reusable hooks for common stateful logic

### TypeScript Usage

- **Prop Types**: Define explicit interfaces for component props
  ```typescript
  interface HealthCheckCardProps {
    title: string;
    onCheck: () => Promise<void>;
    status?: 'healthy' | 'unhealthy' | null;
    loading?: boolean;
    error?: string | null;
  }
  ```

- **Type Assertions**: Minimize use of type assertions (`as`)
- **Generic Components**: Leverage TypeScript generics for reusable components
- **API Types**: Share type definitions between frontend and API calls

### Styling Standards

- **Chakra UI**: Primary styling system for components
- **Theme**: Use consistent theme tokens for colors, spacing, etc.
- **Responsive Design**: All components must be responsive
- **Accessibility**: Follow WCAG 2.1 AA standards for accessibility

### Testing

- **Test Coverage**: Minimum 80% code coverage
- **Component Testing**: Test rendering, user interactions, and state changes
- **Service Testing**: Mock API calls in tests
- **Test Organization**: Organize tests to mirror the component structure
- **Test Utilities**: Use React Testing Library for component testing
