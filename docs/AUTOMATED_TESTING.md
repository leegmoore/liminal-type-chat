[<< Back to Root README](../README.md)

# Liminal Type Chat Automated Testing Guide

This document outlines the automated testing strategy for the Liminal Type Chat project, including test types, coverage requirements, best practices, and implementation guidelines.

## Table of Contents

- [Overview](#overview)
- [Test Coverage Requirements](#test-coverage-requirements)
- [Test Types](#test-types)
- [Testing Tools](#testing-tools)
- [Test Organization](#test-organization)
- [Testing Best Practices](#testing-best-practices)
- [Mocking Strategy](#mocking-strategy)
- [Test Data Management](#test-data-management)
- [Continuous Integration](#continuous-integration)
- [Troubleshooting Tests](#troubleshooting-tests)
- [Future Testing Roadmap](#future-testing-roadmap)

## Overview

Automated testing is a critical component of the Liminal Type Chat development process. Our testing strategy aims to balance comprehensive test coverage with developer productivity, focusing more intensive testing efforts on critical system components while maintaining appropriate coverage throughout the codebase.

### Key Principles

1. **Test-Driven Development (TDD)**: Write tests before implementing features
2. **Tiered Coverage Strategy**: Higher coverage requirements for critical components
3. **Test Isolation**: Tests should not depend on each other
4. **Meaningful Tests**: Tests should validate behavior, not implementation details
5. **Comprehensive Mocking**: External dependencies should be consistently mocked
6. **Balance**: Tests should provide confidence without hindering development velocity

## Test Coverage Requirements

We implement a tiered coverage threshold system in Jest configuration based on component criticality:

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
- Server entry points (`app.ts`, `server.ts`) and Swagger middleware are excluded from coverage requirements as they primarily contain integration/configuration code rather than testable logic.

### Coverage Exclusions

Certain files or code sections may be excluded from coverage requirements:
- Entry points and startup code
- Generated or third-party code
- Code that cannot be meaningfully tested in isolation

## Test Types

### Unit Tests

Unit tests focus on testing individual functions, classes, or modules in isolation. These tests should be fast, reliable, and independent of external systems.

**Target Components**:
- Domain services
- Utility functions
- Repositories 
- Client adapters
- Transformers

**Examples**:
- `ContextThreadService.test.ts`
- `normalizeThreadMessages.test.ts`
- `ContextThreadRepository.test.ts`
- `http-context-thread-client.test.ts`
- `errors.test.ts`

### Integration Tests

Integration tests verify that different components work together correctly, focusing on the boundaries between components.

**Target Components**:
- API routes
- Service-to-repository interactions
- Client-to-service interactions

**Examples**:
- `context-thread.test.ts`
- `health-routes.test.ts`
- `database-health.test.ts`

### API Tests

API tests validate the correct functioning of HTTP endpoints, request validation, and response formatting.

**Target Components**:
- Edge API routes
- Domain API routes
- Error handling middleware
- Request validation

**Examples**:
- `conversation-routes.test.ts`
- `conversation-validation-flow.test.ts`
- `conversation-routes-edge-cases.test.ts`

### Component Tests (Frontend)

Component tests verify that React components render correctly and respond appropriately to user interactions.

**Target Components**:
- React components
- Hooks
- Context providers

**Examples**:
- `HealthCheckCard.test.tsx`
- `Footer.test.tsx`
- `Header.test.tsx`

## Testing Tools

### Backend Testing

- **Jest**: Main testing framework
- **ts-jest**: TypeScript integration for Jest
- **Supertest**: HTTP assertion library for API testing
- **jest.mock**: For mocking dependencies
- **jest.spyOn**: For creating spies

### Frontend Testing

- **Vitest**: Testing framework for React components
- **React Testing Library**: Component testing utilities
- **jest-dom**: DOM assertion utilities

## Test Organization

### Directory Structure

Backend tests are organized in dedicated directories:

```
server/
├── src/
│   └── __tests__/          # Unit tests for source files (tests adjacent to source)
│       └── example.test.ts
├── test/
│   ├── unit/               # Additional unit tests
│   │   ├── services/
│   │   ├── routes/
│   │   └── ... 
│   └── integration/        # Integration tests
│       ├── routes/
│       └── ...
```

Frontend tests follow a similar structure:

```
client/
├── src/
│   ├── components/
│   │   ├── __tests__/     # Component tests
│   │   │   └── Component.test.tsx
│   ├── pages/
│   │   ├── __tests__/     # Page component tests
│   │   │   └── Page.test.tsx
```

### Test Naming Conventions

- Test file names should match the source file they test with a `.test.ts` or `.test.tsx` suffix
- For special test cases or specific behavior tests, use descriptive suffixes like `.standardized.test.ts`

### Test Structure

Tests should be organized using Jest's `describe` and `it` functions:

```typescript
describe('ContextThreadService', () => {
  describe('createContextThread', () => {
    it('should create a thread with valid parameters', () => {
      // Test code here
    });
    
    it('should throw ValidationError when title exceeds max length', () => {
      // Test code here
    });
  });
});
```

### Naming Tests

Tests should be named using the format:

```
should [expected behavior] when [condition]
```

Examples:
- `should return 404 when thread not found`
- `should create thread with default title when title is null`
- `should throw validation error when message content is empty`

## Testing Best Practices

### 1. Follow the AAA Pattern

All tests should follow the Arrange-Act-Assert pattern:

```typescript
// Arrange
const service = new ContextThreadService(mockRepository);
const params = { title: 'Test Thread' };

// Act
const result = await service.createContextThread(params);

// Assert
expect(result.title).toBe('Test Thread');
expect(mockRepository.createContextThread).toHaveBeenCalledWith(expect.objectContaining({ 
  title: 'Test Thread'
}));
```

### 2. Test Edge Cases

Ensure tests cover edge cases and error conditions:

- Empty inputs
- Null/undefined values
- Maximum/minimum values
- Invalid formats
- Error handling

### 3. Test Async Code Properly

Use `async/await` for testing asynchronous code:

```typescript
it('should retrieve thread by id', async () => {
  // Arrange
  mockRepository.getContextThread.mockResolvedValue(mockThread);
  
  // Act
  const result = await service.getContextThread('thread-id');
  
  // Assert
  expect(result).toEqual(mockThread);
});
```

### 4. Use Custom Matchers When Appropriate

Create custom matchers for complex assertions:

```typescript
expect.extend({
  toBeValidThread(received) {
    return {
      pass: received && 
            typeof received.id === 'string' && 
            typeof received.createdAt === 'number',
      message: () => `expected ${received} to be a valid ContextThread`
    };
  }
});

// Usage
expect(thread).toBeValidThread();
```

### 5. Keep Tests Focused

Each test should verify a single aspect of behavior. Avoid testing multiple features in a single test.

### 6. Test Both Success and Failure Paths

Ensure tests cover both successful operations and error handling:

```typescript
describe('getContextThread', () => {
  it('should return thread when it exists', async () => {
    // Test successful retrieval
  });
  
  it('should throw NotFoundException when thread does not exist', async () => {
    // Test error handling
  });
});
```

## Mocking Strategy

### Principles

1. **Minimal Dependencies**: Tests should have minimal dependencies on external systems
2. **Consistent Mocking**: Use consistent approaches for mocking
3. **Realistic Mocks**: Mocks should mimic real behavior reasonably

### Implementation

#### Jest Mock Functions

Use Jest's `jest.fn()` to create simple mock functions:

```typescript
const mockGetThread = jest.fn().mockResolvedValue({ id: '123', title: 'Test' });
```

#### Mock Classes

For more complex dependencies, create mock implementations of interfaces:

```typescript
class MockContextThreadRepository implements ContextThreadRepository {
  private threads: ContextThread[] = [];
  
  async createContextThread(thread: ContextThread): Promise<void> {
    this.threads.push(thread);
  }
  
  async getContextThread(id: string): Promise<ContextThread | null> {
    return this.threads.find(t => t.id === id) || null;
  }
  
  // Implement other methods...
}
```

#### Spies

Use `jest.spyOn` to monitor function calls while preserving original implementation:

```typescript
const spy = jest.spyOn(utils, 'normalizeThreadMessages');
// ... test code ...
expect(spy).toHaveBeenCalledWith(thread);
```

#### Manual Mocks

For external modules, create manual mocks in a `__mocks__` directory:

```typescript
// __mocks__/axios.ts
export default {
  get: jest.fn(),
  post: jest.fn(),
  // ...
};
```

### Recommended Mock Targets

The following dependencies should always be mocked in tests:

- **Database Access**: SQLite providers, repositories
- **External APIs**: LLM providers, HTTP clients
- **File System**: fs operations
- **Environment Variables**: Process environment
- **Network**: HTTP requests/responses

## Test Data Management

### Factory Functions

Create factory functions for generating test data:

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

### Fixtures

For complex data structures, create fixtures in separate files:

```typescript
// fixtures/threads.ts
export const sampleThreads = [
  {
    id: 'thread-1',
    title: 'First Thread',
    // ...other properties
  },
  {
    id: 'thread-2',
    title: 'Second Thread',
    // ...other properties
  }
];
```

### Helper Functions

Create helper functions for common test operations:

```typescript
export async function setupTestDatabase(): Promise<DatabaseProvider> {
  const provider = new SQLiteProvider(':memory:');
  await provider.init();
  return provider;
}
```

## Continuous Integration

### CI Pipeline

Tests are integrated into the CI pipeline using GitHub Actions:

- **On Pull Request**: Run all tests
- **On Push to Main**: Run all tests and generate coverage report
- **Scheduled**: Run weekly full test suite including slow integration tests

### Coverage Reports

Coverage reports are generated in CI and stored as artifacts:

- HTML report for human review
- LCOV report for integration with code quality tools
- JSON summary for metrics tracking

## Troubleshooting Tests

### Common Issues

#### 1. Failing Asynchronous Tests

Ensure all async tests properly await promises and use `async/await` syntax.

#### 2. Test Isolation Problems

Use `beforeEach` to reset state and mocks between tests:

```typescript
beforeEach(() => {
  jest.resetAllMocks();
  // Reset other state
});
```

#### 3. Mock Function Not Called

Check that mock implementation is configured correctly and imported in the right place.

#### 4. Coverage Thresholds Not Met

Run tests with detailed coverage report to identify uncovered code:

```bash
npm run test:coverage -- --verbose
```

### Debug Techniques

- Use `console.log` inside tests (removed before committing)
- Run a single test with `npm test -- -t "test name"`
- Use Jest's `--verbose` flag for detailed output
- Check Jest's snapshot directory for unexpected state

## Future Testing Roadmap

### Short-Term Goals

1. **Complete API Validation Coverage**: Add comprehensive tests for all API validation rules
2. **Fix Excluded Tests**: Address issues with temporarily excluded tests
3. **Consolidate Test Data**: Create a shared test data generation system

### Medium-Term Goals

1. **Component Testing**: Add comprehensive tests for all React components
2. **Integration Test Improvements**: Add more integration tests for critical paths
3. **Performance Testing**: Implement basic performance tests for critical operations

### Long-Term Goals

1. **End-to-End Testing**: Add E2E tests for critical user journeys
2. **Property-Based Testing**: Explore property-based testing for complex operations
3. **Test Automation**: Further improve test automation in CI pipeline
4. **Contract Testing**: Add contract tests between frontend and backend