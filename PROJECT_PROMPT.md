# PROJECT_PROMPT.md

This comprehensive project guide provides Claude Code with detailed knowledge of the Liminal Type Chat codebase architecture, patterns, and development standards.

## Project Overview

Liminal Type Chat is an open-source, local-first GenAI chat application designed for individuals and small teams who want to use their own API keys to interact with various language models (LLMs).

Key features:
- Local-first design with SQLite database for privacy and control
- BYOK (Bring Your Own Key) for LLM providers like OpenAI, Anthropic, Google
- Tiered architecture separating domain logic from UI concerns
- Flexibility between single-process and distributed deployment

## Current Development Status

### Completed Milestones
- ✅ M0001: Project Initialization & First Commit
- ✅ M0002: Basic HTTP Server & Domain Health Endpoint 
- ✅ M0003: SQLite Database Connectivity & Health Checks
- ✅ M0004: Edge-to-Domain Pattern Implementation
- ✅ M0005: React TypeScript Frontend with Health Check Features
- ✅ M0006: Core ContextThread Domain Layer

### In Progress
- ⬜ M0007: Edge Tier API for ContextThreads
  - Create Edge-tier routes for ContextThread operations (REST API)
  - Implement transformer functions between domain and edge models
  - Create OpenAPI specifications for both domain and edge APIs
  - Integrate Swagger UI for interactive documentation
  - Implement robust error handling and validation

### Upcoming
- ⬜ M0008: LLM Integration & Basic Chat
- ⬜ M0009: Chat UI and Conversation Experience

## Core Architecture

The application follows a four-tier conceptual architecture:

1. **UI Tier (Presentation)** - React/TypeScript in `/client`
   - User interaction and display
   - Components, pages, services, types
   - Communicates with Edge API

2. **Edge/XPI Tier (Experience/Adaptation)** - Express routes in `/server/src/routes/edge`
   - Routes client requests
   - Transforms data between UI and Domain formats
   - Acts as Backend-for-Frontend (BFF)
   - Provides RESTful API endpoints

3. **Domain API Tier (Core Services)** - Services in `/server/src/services/core`
   - Contains canonical business logic and data models
   - UI-agnostic service operations
   - Can run in same process as Edge tier or as separate service
   
4. **Datasources & External Services Tier** - Providers in `/server/src/providers`
   - Database access (SQLite)
   - External API integration (LLMs)
   - Implements repository/provider pattern

## Key Code Patterns

### 1. Domain Client Adapter Pattern

This is a critical architectural pattern enabling flexible deployment:

```typescript
// Factory function decides which client to instantiate based on mode
export function createHealthServiceClient(options?: {
  mode?: 'direct' | 'http';
  baseUrl?: string;
}): HealthServiceClient {
  const mode = options?.mode || process.env.DOMAIN_CLIENT_MODE || 'direct';
  
  if (mode === 'direct') {
    return new DirectHealthServiceClient();
  } else {
    return new HttpHealthServiceClient({
      baseUrl: options?.baseUrl || process.env.DOMAIN_API_URL || 'http://localhost:8765'
    });
  }
}

// Edge tier uses this pattern to communicate with Domain services
const healthClient = createHealthServiceClient();
const healthStatus = await healthClient.getSystemStatus();
```

This pattern allows Edge tier to communicate with Domain tier either:
- Directly via in-process function calls (`DirectHealthServiceClient`)
- Via HTTP requests to potentially separate service (`HttpHealthServiceClient`)

### 2. Schema Transformation and API Contracts

The Edge and Domain tiers use different schemas, connected via transformer functions:

```typescript
// Domain-to-Edge transformation
export function domainThreadToConversationResponse(thread: ContextThread): ConversationResponse {
  return {
    conversationId: thread.id,
    title: thread.title,
    createdAt: new Date(thread.createdAt).toISOString(),
    updatedAt: new Date(thread.updatedAt).toISOString(),
    messages: thread.messages.map(domainMessageToMessageResponse),
  };
}

// Edge-to-Domain transformation
export function conversationRequestToThreadParams(req: CreateConversationRequest): CreateThreadParams {
  return {
    title: req.title,
    initialMessage: req.initialMessage 
      ? messageRequestToDomainMessage(req.initialMessage, '') 
      : undefined,
  };
}
```

This approach enables:
- Schema evolution independence between tiers
- Multi-client support with optimized contracts
- Clear API version boundaries
- Data security by filtering sensitive fields

### 3. Repository Pattern for Data Access

Domain services interact with data through repository abstractions:

```typescript
export class ContextThreadRepository {
  private db: Database;
  
  constructor(dbProvider: DatabaseProvider) {
    this.db = dbProvider.getDatabase();
  }
  
  // CRUD operations with database-specific implementation details
  async createContextThread(thread: ContextThread): Promise<void> {
    // Implementation details...
  }
  
  async getContextThread(id: string): Promise<ContextThread | null> {
    // Implementation details...
  }
  
  // Other methods...
}
```

### 4. Domain Services for Business Logic

```typescript
export class ContextThreadService {
  private repository: ContextThreadRepository;
  
  constructor(repository: ContextThreadRepository) {
    this.repository = repository;
  }
  
  async createContextThread(params: CreateContextThreadParams): Promise<ContextThread> {
    // Generate IDs, timestamps, apply business rules
    const thread: ContextThread = {
      id: uuid(),
      title: params.title || null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: params.initialMessage ? [params.initialMessage] : []
    };
    
    // Apply normalization
    normalizeThreadMessages(thread);
    
    // Persist
    await this.repository.createContextThread(thread);
    return thread;
  }
  
  // Other methods...
}
```

### 5. Standardized Error Handling

The application uses a structured error hierarchy:

```typescript
// Base error classes
export class LiminalError extends Error {
  public code: string;
  public httpStatus: number;
  
  constructor(message: string, code: string, httpStatus = 500) {
    super(message);
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

// Domain-specific errors
export class DatabaseError extends LiminalError {
  constructor(message: string, code = 'ERR_DB_GENERIC') {
    super(message, code, 500);
  }
}

export class MessagesCorruptedError extends DatabaseError {
  constructor(threadId: string) {
    super(`Messages corrupted for thread: ${threadId}`, 'ERR_MSG_CORRUPT');
  }
}
```

## Development Methodology

The project follows these development practices:

1. **Test-Driven Development (TDD)**
   - Write tests first, then implement functionality
   - Maintain high test coverage (90% for domain services, 80% elsewhere)

2. **Tiered Implementation Approach**
   - Domain Layer First: Define models and implement business logic
   - Edge/XPI Layer Second: Create client adapters and routes
   - UI Layer Last: Implement frontend components

3. **Consistent Naming Conventions**
   - `snake_case` for database fields
   - `camelCase` for JavaScript/TypeScript variables and functions
   - `PascalCase` for classes and React components
   - Domain Tier terminology: `ContextThread`, `Message`
   - Edge Tier terminology: `Conversation`, `Message`

4. **API Design Standards**
   - RESTful endpoints with resource-oriented naming
   - Versioned URLs (`/api/v1/conversations`)
   - Standardized error responses with clear codes
   - Comprehensive validation with descriptive errors

## Current Focus: Edge Tier API (M0007)

The current milestone involves creating a RESTful Edge API for conversations:

### Endpoints
- `POST /api/v1/conversations` - Create new conversation
- `GET /api/v1/conversations` - List conversations
- `GET /api/v1/conversations/:conversationId` - Get conversation
- `PUT /api/v1/conversations/:conversationId` - Update conversation
- `DELETE /api/v1/conversations/:conversationId` - Delete conversation
- `POST /api/v1/conversations/:conversationId/messages` - Add message

### Implementation Approach
1. Define OpenAPI specifications for Edge API in `server/openapi/edge-api.yaml`
2. Create JSON schemas for request/response structures in `server/src/schemas/edge/`
3. Implement transformer functions in `server/src/routes/edge/transformers/`
4. Set up Swagger UI integration with `swagger-ui-express`
5. Create Edge routes in `server/src/routes/edge/conversation.ts`
6. Implement validation middleware and centralized error handling
7. Write comprehensive integration tests

## Coding Standards

1. **Testing Requirements**
   - Domain services: ≥90% statement coverage
   - Other components: ≥80% statement coverage
   - Unit tests with Jest/Vitest
   - Integration tests with Supertest

2. **Documentation Standards**
   - JSDoc comments for public APIs
   - Descriptive error codes and messages
   - Markdown documentation for architecture and design
   - API documentation via OpenAPI specifications

3. **Code Quality**
   - ESLint for static analysis
   - Prettier for code formatting
   - TypeScript for type safety
   - Never use `any` type when more specific types are possible
   - Use interfaces for defining public contracts

4. **Asynchronous Code**
   - Use async/await instead of raw Promises
   - Handle errors with try/catch
   - Include proper type annotations for async functions

## Common Commands

### Setup

```bash
# Install dependencies for both client and server
npm install

# Create server environment file
cp server/.env.example server/.env
```

### Development

```bash
# Start server (from root directory)
npm run dev:server

# Start server (from server directory)
cd server
npm run dev

# Start client (from client directory)
cd client
npm start

# Deploy client build to server
cd client
npm run deploy
```

### Testing

```bash
# Run server tests (from root)
npm run test:server

# Run server tests (from server directory)
cd server
npm test

# Run only server unit tests
cd server
npm run test:unit

# Run only server integration tests
cd server
npm run test:integration

# Run client tests
cd client
npm test

# Generate test coverage report (server)
cd server
npm run test:coverage
```

### Server Management Scripts

```bash
# Start the server on port 8765
./server/scripts/server-control.sh start

# Stop the server
./server/scripts/server-control.sh stop

# Check server status
./server/scripts/server-control.sh status

# Create a database backup
./server/scripts/db-backup.sh

# Check database health
./server/scripts/db-health-check.sh
```

### Building for Production

```bash
# Build both client and server
npm run build

# Start the production server
npm start
```

## Key Technologies

- **Backend**: Node.js, Express.js, TypeScript
- **Frontend**: React, TypeScript, Vite, Chakra UI
- **Database**: better-sqlite3 (initially), Supabase (planned)
- **Testing**: Jest (Backend), Vitest (Frontend), Supertest (API Integration)
- **Documentation**: OpenAPI/Swagger for API docs
- **CI/CD**: GitHub Actions

## Critical Guidelines for Claude

1. **Prioritize Architecture Consistency**
   - Follow the tiered approach with clear separation
   - Use the domain client adapter pattern for all Edge-to-Domain communication
   - Implement transformer functions for schema translations

2. **Test-Driven Development**
   - Write tests first, especially for domain services
   - Ensure high test coverage in all components

3. **Error Handling**
   - Use the standardized error system with specific error codes
   - Ensure proper error propagation across tier boundaries

4. **API Contract Design**
   - Follow RESTful design principles
   - Use consistent naming across resources
   - Validate requests against defined schemas

5. **Repository Pattern Application**
   - Keep data access logic isolated in repositories
   - Use dependency injection for testability

6. **Data Integrity**
   - Apply normalization before saving data
   - Validate input at service boundaries
   - Use proper error handling for data corruption

When working on any code changes, carefully consider how they fit into the existing architectural patterns and development standards outlined in this document.