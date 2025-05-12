# Development Standards: Dependency Injection Standards

- **Constructor Injection**:
  - Pass dependencies through constructor parameters
  - Example: `constructor(private dbProvider: DatabaseProvider, private configService: ConfigService) {}`

- **Dependencies as Interfaces**:
  - Define interfaces for all dependencies
  - Example: `interface DatabaseProvider { query(sql: string, params?: any[]): Promise<any> }`

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
