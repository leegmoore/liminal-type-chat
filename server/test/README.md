# Server Tests

This directory contains tests for the server codebase organized according to test type.

## Test Organization

- `unit/`: Unit tests that test specific functions and classes in isolation
- `integration/`: Integration tests that test the interaction between components

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- path/to/test.test.ts
```

## Test Coverage Requirements

- Domain services: 90% minimum coverage
- Edge/route handlers: 80% minimum coverage
- Utility functions: 80% minimum coverage
