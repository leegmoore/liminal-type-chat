# MVP 1 Milestones (Completed)

## Milestone 0001 (was M0): Project Initialization & First Commit

- **Objective**: Set up the basic Node.js/TypeScript project structure, configuration files, initialize a Git repository, and perform the initial commit. This establishes the foundational codebase.
- **Key Deliverables**:
  1.  **Directory Structure**: Create `src/` directory.
  2.  **Configuration Files**: 
      - `package.json` (basic project info, scripts: `dev`, `build`, `start`, `test`; initial dependencies: `express`, `dotenv`; dev dependencies: `typescript`, `@types/express`, `@types/node`, `ts-node`, `nodemon`, `jest`, `@types/jest`, `ts-jest`, `supertest`, `@types/supertest`).
      - `tsconfig.json` (appropriate compiler options).
      - `.gitignore` (common Node.js/TypeScript ignores like `node_modules/`, `dist/`, `.env`).
  3.  **Git Repository**: Initialize Git repository; first commit with all initial project files.
- **Assumption**: Operating within the existing project root directory.

## Milestone 0002 (was M1): Basic HTTP Server & Domain Health Endpoint

- **Objective**: Stand up the Node.js/Express.js application with our architectural folder structure, implement the domain health check endpoint, and validate with tests.
- **Key Deliverables**:
  1.  **Project Initialization**: 
      - Set up `package.json` for server (Node.js LTS, TypeScript, Express.js, Jest, Supertest)
      - Configure `tsconfig.json` for TypeScript compilation
      - Implement the core directory structure following our architectural pattern
  2.  **HTTP Server (Express.js)**:
      - Create main application entry point (`src/app.ts`, `src/server.ts`)
      - Set up modular routing structure with domain routes
      - Configure basic middleware (logging, error handling, etc.)
  3.  **Domain Health Service**:
      - Implement a simple health service in the domain tier
      - Create service method that returns health status and timestamp
  4.  **Domain Health Endpoint**:
      - Create `/api/v1/domain/health` route in domain routes
      - Return JSON response: `{ "status": "ok", "timestamp": "..." }`
  5.  **Testing**:
      - Unit tests for health service
      - Integration test for the domain health endpoint using Supertest
- **Success Criteria**:
  - 90% test coverage for the health service
  - Passing integration test for the domain health endpoint

## Milestone 0003 (was M2): SQLite Database Connectivity & Domain DB Health Endpoint

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

## Milestone 0004 (was M3): Edge-to-Domain Pattern Implementation for Health Checks

- **Status**: completed
- **Objective**: Implement both edge and domain routes for our health checks, with the edge-to-domain adapter pattern, and validate with comprehensive integration tests.
- **Key Deliverables**:
  1.  **Domain API Routes & Services**:
      - `/api/v1/domain/health` endpoint in the domain routes
      - `/api/v1/domain/health/db` endpoint in the domain routes
      - Core health service implementation that the domain routes call
  2.  **Edge-to-Domain Adapter**:
      - Domain client adapter with configurable mode (direct/HTTP)
      - Configuration toggle via environment variable
  3.  **Edge API Routes**:
      - `/api/v1/edge/health` in edge routes using the domain client
      - `/api/v1/edge/health/db` in edge routes using the domain client
  4.  **Comprehensive Testing**:
      - Unit tests for the domain client adapter (testing both modes)
      - Integration tests for domain routes (`/api/v1/domain/health` and `/api/v1/domain/health/db`)
      - Integration tests for edge routes (`/api/v1/edge/health` and `/api/v1/edge/health/db`)
      - End-to-end test that verifies the entire flow with the adapter in HTTP mode
- **Success Criteria**:
  - 90% test coverage for the domain client adapter
  - All integration tests passing in both direct and HTTP modes
  - Configuration change (environment variable) successfully toggles adapter behavior without code changes

## Milestone 0005 (was M4): React TypeScript Frontend with Health Check Features

- **Status**: completed
- **Objective**: Create a modern React TypeScript frontend with build deployment to the Express server, comprehensive testing, and health check functionality.
- **Key Deliverables**:
  1.  **React Application Setup**:
      - Initialize React app with TypeScript support
      - Configure appropriate linting and formatting
      - Create base application structure with routing
  2.  **Build & Deployment**:
      - Configure build process to output to a `build` directory
      - Create npm script to copy built assets to the server's `/public` folder
      - Add deployment documentation
  3.  **Testing Infrastructure**:
      - Set up Jest with React Testing Library
      - Configure test coverage reporting with 90% threshold
      - Add test helpers and utilities
  4.  **Health Check Interface**:
      - Create responsive UI with a clean, modern design
      - Implement health check page with two buttons:
        - Server health check button (calls `/api/v1/edge/health`)
        - Database health check button (calls `/api/v1/edge/health/db`)
      - Display results with appropriate visual feedback (success/error states)
      - Add loading states during API calls
  5.  **Component Tests**:
      - Unit tests for all components
      - Integration tests for health check API interactions
      - Mock API responses for predictable testing
- **Success Criteria**:
  - 90% test coverage across the React codebase
  - Successful build and deployment to Express server's public directory
  - Health check buttons correctly call their respective endpoints and display results
  - Responsive design works on various screen sizes

---

# MVP 2 Milestones (Planned)

## Milestone 0006 (was M5): Core ContextThread Domain Layer

- **Objective**: Implement the core domain logic for managing `ContextThread`s and `Message`s, including data models, persistence, domain services, and establish the database schema documentation process.
- **Key Deliverables**:
    1.  **Domain Models (JSON Schema)**: JSON Schema definitions for `ContextThread` and `Message` located in `/server/src/schemas/domain/`.
    2.  **Database Schema (DDL)**: `server/db/schema.sql` containing `CREATE TABLE` statements for `context_threads` and `messages`.
    3.  **Database Documentation**: `docs/database-schema.md` documenting the schema, maintained via the "Review and Update DB Schema Docs" AI Command.
    4.  **Data Access Layer**: `ContextThreadRepository` (or similar) in `/server/src/providers/db/` handling CRUD operations for threads and messages using `better-sqlite3`.
    5.  **Domain Service**: `ContextThreadService` in `/server/src/services/core/` implementing core business logic (e.g., `createThread`, `getThread`, `addMessage`), using the repository.
    6.  **Unit Tests**: Comprehensive unit tests for `ContextThreadRepository` (mocking DB driver) and `ContextThreadService` (mocking repository) with high coverage.
- **High-Level Tasks**:
    1.  Define `Message` JSON Schema.
    2.  Define `ContextThread` JSON Schema.
    3.  Define SQLite DDL in `schema.sql`.
    4.  Create initial `database-schema.md` documentation.
    5.  Implement `ContextThreadRepository` with tests.
    6.  Implement `ContextThreadService` with tests.
    7.  Utilize "Review and Update DB Schema Docs" AI command to ensure documentation sync.
- **Key Design Decisions**:
    *   Domain models defined using JSON Schema for validation and OpenAPI integration.
    *   Database schema documented in `docs/database-schema.md`, synchronized with `server/db/schema.sql` using the dedicated AI Command.
    *   Use `better-sqlite3` for SQLite interaction.
    *   Strict separation of concerns between Service and Repository layers.
- **Success Criteria**:
    *   JSON Schemas defined and validated.
    *   DDL script successfully creates tables.
    *   Database documentation accurately reflects DDL after using AI command.
    *   >90% unit test coverage for Repository and Service.
    *   All unit tests passing.

## Milestone 0007 (was M6): Edge Tier API for ContextThreads

- **Objective**: Expose the `ContextThread` domain functionality via a RESTful API in the Edge Tier, including an OpenAPI specification and Swagger UI for testing.
- **Key Deliverables**:
    1.  **OpenAPI Specification**: `openapi.yaml` or `openapi.json` defining the REST API endpoints for `ContextThreads` and `Messages`, referencing the domain JSON Schemas.
    2.  **Swagger UI Setup**: Integration of Swagger UI into the Express application to serve interactive API documentation from the OpenAPI spec.
    3.  **API Route Handlers**: Express route handlers in `/server/src/routes/edge/` for CRUD operations on `ContextThreads` and `Messages`, using the Domain Client Adapter to interact with the `ContextThreadService`.
    4.  **Integration Tests**: Integration tests using Supertest to validate the Edge API endpoints.
- **High-Level Tasks**:
    1.  Define initial OpenAPI specification structure.
    2.  Integrate Swagger UI middleware.
    3.  Implement API route handlers for `ContextThread` CRUD.
    4.  Implement API route handlers for `Message` operations within a thread.
    5.  Refine OpenAPI specification with models and routes.
    6.  Write integration tests for all new endpoints.
- **Key Design Decisions**:
    *   Use OpenAPI 3.x standard.
    *   Leverage existing Domain Client Adapter pattern.
    *   Ensure API routes handle request validation (potentially using JSON Schemas) and data transformation between Edge and Domain formats.
- **Success Criteria**:
    *   OpenAPI specification is valid and accurately describes the API.
    *   Swagger UI is accessible and allows interaction with all defined endpoints.
    *   API endpoints perform correct CRUD operations on threads and messages via the domain layer.
    *   >90% integration test coverage for Edge API routes.
    *   All integration tests passing.

---

# MVP 3 and Beyond - Re-prioritized After Auth Removal

**Note**: Following the successful removal of complex OAuth/PKCE authentication in favor of simplified cookie-based auth, the project milestones were re-prioritized to focus on delivering AI-centric features first. This strategic shift allows us to build the platform's core value proposition - multi-model AI interactions - before adding enterprise authentication features.

## Milestone 0008: LLM Integration (Completed)

- **Status**: Completed
- **Objective**: Integrate Anthropic's Claude as the first LLM provider, establishing patterns for future multi-provider support
- **Key Deliverables**:
  - LLM service interface definition (`ILlmService`)
  - Anthropic service implementation with streaming support
  - API key management system
  - Integration with chat endpoints
  - Comprehensive test coverage including mock implementations

## Milestone 0009: Security Hardening (Completed with Changes)

- **Status**: Completed
- **Objective**: Implement security best practices throughout the application
- **Key Changes**: Originally included OAuth/PKCE implementation, but was refocused on:
  - Cookie-based authentication system
  - Security headers and CSP policies
  - Input validation and sanitization
  - Rate limiting and DDoS protection
  - Secure session management
- **Result**: Simplified security model that maintains protection while reducing complexity

## Milestone 0010: Streaming Hardening (Current)

- **Status**: In Progress
- **Objective**: Improve streaming capabilities, optimize performance, handle edge cases, and ensure reliable delivery of AI responses
- **Key Deliverables**:
  - Streaming performance optimization and memory management
  - Robust error handling and recovery mechanisms
  - Connection management with timeouts and keepalive
  - Client-side streaming improvements with visual feedback
  - Comprehensive testing and monitoring for streaming health

## Milestone 0011: OpenAI Provider Implementation

- **Status**: Not Started
- **Objective**: Implement OpenAI provider to enable multi-model support in the Liminal platform
- **Key Deliverables**:
  - OpenAI service implementation following `ILlmService` interface
  - Support for GPT-4, GPT-4 Turbo, and GPT-3.5 Turbo models
  - Streaming response handling compatible with existing infrastructure
  - Rate limit handling and error management
  - Model selection UI in chat interface
  - API key validation and management integration

## Milestone 0012: Multi-Provider Support

- **Status**: Not Started
- **Objective**: Add support for multiple LLM providers beyond Anthropic and OpenAI, enabling a flexible platform for diverse AI models
- **Key Deliverables**:
  - Google Gemini provider implementation
  - Unified provider interface refinements
  - Provider selection UI with model comparison features
  - Provider-specific configuration and feature management
  - Consider Vercel AI SDK for rapid integration
  - Support for at least 3 LLM providers total

## Milestone 0013: AI Roundtable MVP

- **Status**: Not Started
- **Objective**: Implement the platform's signature feature - multi-AI conversations with distinct personalities and expertise
- **Key Deliverables**:
  - Named AI panelist system with personas
  - @mention system for directing questions
  - Multi-stream orchestration for concurrent responses
  - Fair scheduling to prevent conversation monopolization
  - Shared context management with attribution
  - Multi-column UI for roundtable conversations
  - Pre-built panel templates (Technical Review, Creative Brainstorming, etc.)

## Milestone 0014: Chat Interface Refinement

- **Status**: Not Started
- **Objective**: Comprehensive chat interface improvements to create a polished, professional chat experience
- **Key Deliverables**:
  - Enhanced message rendering with full markdown, code highlighting, and LaTeX
  - Advanced code block features with syntax highlighting and diffs
  - Message interaction features (edit, copy, quote, search)
  - Conversation management with search, filtering, and export
  - UI/UX polish with animations and keyboard shortcuts
  - Responsive design with PWA capabilities
  - Full accessibility compliance (WCAG 2.1 AA)
  - Performance optimizations including virtual scrolling

## Milestone 0015: MCP Integration

- **Status**: Not Started
- **Objective**: Integrate Model Control Protocol (MCP) capabilities for tool-based AI interactions
- **Key Deliverables**:
  - MCP server implementation compatible with Anthropic's protocol
  - Dynamic tool registration and discovery system
  - Secure sandboxed tool execution framework
  - Security boundaries with permission system and rate limiting
  - LLM provider integration for tool calls
  - Audit logging for all tool invocations

## Milestone 0016: OpenAPI Full Implementation

- **Status**: Not Started
- **Objective**: Complete comprehensive OpenAPI 3.0 implementation for all API endpoints with full validation and SDK generation
- **Key Deliverables**:
  - Complete OpenAPI specifications for all endpoints
  - Request/response validation middleware
  - Auto-generated TypeScript types from specs
  - API versioning strategy implementation
  - Client SDK generation and distribution
  - Professional API documentation portal with interactive features
