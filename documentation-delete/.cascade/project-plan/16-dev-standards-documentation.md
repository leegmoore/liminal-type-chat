# Development Standards: Documentation Standards

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
