# Milestone 0003: SQLite Database Connectivity & Domain DB Health Endpoint

- **Status**: completed
- **Objective**: Set up SQLite database connectivity with a health check table, implement domain service methods for database health checks, and expose through a domain API endpoint.
- **Key Deliverables**:
  1.  **Database Provider Setup**: 
      - Implement a database provider in the providers tier using `better-sqlite3`
      - Create configuration for connecting to SQLite
      - Set up proper dependency injection for the database provider
  2.  **Schema & Initialization**:
      - Create `schema.sql` with DDL for `health_check_table` (`id`, `status`, `checked_at`) 
      - Add DML for a seed record (`{ status: 'system_ready' }`)
      - Document manual initialization process for developers
  3.  **Domain Service Extension**:
      - Extend the health service with a `checkDbConnection()` method
      - Method should query the `health_check_table` and return status and timestamp
      - Implement proper error handling and connection validation
  4.  **Domain DB Health Endpoint**:
      - Create `/api/v1/domain/health/db` route in domain routes
      - Route should call the service method and return appropriate JSON response
      - Include proper error handling and status codes
  5.  **Testing**:
      - Unit tests for the database provider (with mocking)
      - Unit tests for the health service's database check method
      - Integration test for the domain DB health endpoint using Supertest
- **Success Criteria**: 
  - 90% test coverage for the database provider and extended health service
  - Passing integration test for the domain DB health endpoint
  - Clean separation between the service logic and database implementation
