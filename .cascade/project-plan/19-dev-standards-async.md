# Development Standards: Async Code Standards

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
