# Development Standards: Testing Standards

- **Coverage Requirements**:
  - Domain services: 90% minimum coverage
  - Edge/route handlers: 80% minimum coverage
  - Utility functions: 80% minimum coverage

- **Test Structure**:
  - Use Jest's describe/it pattern for organization
  - Group tests by functionality, not implementation details
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
