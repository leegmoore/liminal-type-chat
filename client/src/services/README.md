# API Services

This directory contains service modules that handle all API communication between the React frontend and the backend server. These services follow a modular, type-safe approach to data fetching and state management.

## Service Overview

### Health Service

- **healthService.ts**: Provides functions for checking health status of both domain and edge tiers.
  - `checkDomainServerHealth()`: Checks domain tier server health
  - `checkDomainDatabaseHealth()`: Checks domain tier database health
  - `checkEdgeServerHealth()`: Checks edge tier server health
  - `checkEdgeDatabaseHealth()`: Checks edge tier database health

## Service Design Principles

1. **Separation of Concerns**: Services handle all API communication, separate from UI components.
2. **Type Safety**: All API requests and responses are fully typed with TypeScript.
3. **Error Handling**: Consistent error handling pattern across all service calls.
4. **Testability**: Services are designed for easy mocking in component tests.
5. **Modularity**: Each service focuses on a specific aspect of the application.

## Folder Structure

```
services/
├── healthService.ts
├── __tests__/
│   └── healthService.test.ts
└── README.md
```

## Response Types

Services define TypeScript interfaces for all API responses to ensure type safety:

```typescript
// Example from healthService.ts
export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  message?: string;
  details?: {
    [key: string]: any;
  };
}
```

## Error Handling

Services implement consistent error handling:

1. Catching exceptions from API calls
2. Transforming network errors into user-friendly messages
3. Proper typing of error states
4. Consistent error object format

## Adding New Services

When adding new services:

1. Create a new service file in this directory
2. Define interfaces for request/response types
3. Implement error handling using the established pattern
4. Add corresponding test file in `__tests__/`
5. Update this README if adding a service with new functionality

## Future Service Additions

As development continues, we'll add these services:

- **conversationService**: For managing chat conversations
- **authService**: For authentication and authorization
- **llmService**: For LLM provider integration
- **settingsService**: For user preferences and API key management

## Testing

Service tests focus on:

1. Mocking axios/fetch responses
2. Testing error handling scenarios
3. Verifying correct parsing of API responses
4. Checking parameter transformation for API requests
