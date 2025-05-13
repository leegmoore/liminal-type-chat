# Development Standards: Testing Standards

## Coverage Requirements

We implement a tiered coverage threshold system based on component criticality:

### Global Threshold Baseline
- **Statements**: 85%
- **Branches**: 70%
- **Functions**: 85%
- **Lines**: 85%

### Component-Specific Thresholds

#### Core Business Logic (Domain Services)
- **Statements**: 90%
- **Branches**: 80%
- **Functions**: 85%
- **Lines**: 90%

#### Utility Functions
- **Statements**: 90%
- **Branches**: 80%
- **Functions**: 90%
- **Lines**: 90%

#### Data Access (Repositories/Providers)
- **Statements**: 80%
- **Branches**: 45%
- **Functions**: 75%
- **Lines**: 80%

#### API Routes (Edge/Domain)
- **Statements**: 75%
- **Branches**: 45%
- **Functions**: 75%
- **Lines**: 75%

#### Client Adapters
- **Statements**: 85%
- **Branches**: 70%
- **Functions**: 80%
- **Lines**: 85%

#### Configuration and Server Initialization
- Server entry points (`app.ts`, `server.ts`) and Swagger middleware are excluded from coverage requirements.

## Test Organization

- Tests are organized in two primary locations:
  - `src/__tests__`: Unit tests adjacent to source files being tested
  - `/test` directory with separate folders for test types:
    - `/test/unit`: Additional unit tests targeting individual functions and classes
    - `/test/integration`: Integration tests targeting component interactions
  - Unit test directory structure mirrors the source code structure (e.g., `/test/unit/services`)

## Test Structure

- Use Jest's describe/it pattern for organization
- Group tests by functionality, not implementation details
- Follow AAA pattern (Arrange, Act, Assert)
- Test both success and failure paths
- Keep tests focused on a single behavior

## Test Naming

- Format: `should [expected behavior] when [condition]`
- Examples: `should return 404 when thread not found`
- Use descriptive names for test files with purpose-specific suffixes (e.g., `.edge-cases.test.ts`, `.standardized.test.ts`)

## Test Types

- **Unit Tests**: Test individual functions and classes in isolation
- **Integration Tests**: Test interactions between components
- **API Tests**: Test HTTP endpoints using Supertest
- **Validation Tests**: Test input validation rules
- **Edge Case Tests**: Focus on boundary conditions and error handling
- **Component Tests (Frontend)**: Test React component rendering and interaction

## Mocking Strategy

- Mock external dependencies (DB, LLM providers, etc.) in unit tests
- Use Jest mocks and spies consistently
- Create mock implementations for interfaces
- Use jest.spyOn for monitoring function calls while preserving implementation
- For integration tests, prefer test doubles over network calls

### Recommended Mock Targets
- Database Access: SQLite providers, repositories
- External APIs: LLM providers, HTTP clients
- File System: fs operations
- Environment Variables: Process environment
- Network: HTTP requests/responses

## Test Data Management

- Use factory functions for generating test data
- Create fixtures for complex or reusable test scenarios
- Implement helper functions for common test operations
- Avoid hardcoding test data directly in test files
- Explain edge cases with comments

### Factory Functions Example
```typescript
export function createMockThread(overrides?: Partial<ContextThread>): ContextThread {
  return {
    id: 'thread-id',
    title: 'Test Thread',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
    ...overrides
  };
}
```

## Testing Best Practices

- Write tests before implementing features (TDD approach)
- Test both success and failure paths
- Keep tests focused on a single behavior
- Consider test performance (fast tests encourage more testing)
- Use realistic test data
- Test edge cases thoroughly
- Properly test asynchronous code with async/await
- Use setup and teardown hooks (`beforeEach`, `afterEach`) for test isolation

## Continuous Integration

- Tests run automatically on pull requests
- Coverage reports are generated and verified against thresholds
- Test failures block merges to main branch
