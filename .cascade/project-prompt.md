---
name: Liminal Type Chat Project Context
description: Core project architecture, standards, and development guidelines
activation_mode: always_on
priority: high
include_files:
  - project-plan.xml
  - ../dev-journal/dev-journal-m4.md
  - ../dev-journal/dev-journal-m3.md
  - ../dev-journal/dev-journal-m2.md
  - ../dev-journal/dev-journal-m1.md
  - ../dev-journal/dev-journal-m0.md
---

# Liminal Type Chat Project Context

This document provides essential context for development of the Liminal Type Chat application. The complete architecture and standards are in the `project-plan.xml` file, which should be consulted before making code changes.

## Project Status

### MVP1 (Completed)
- ✅ Milestone 0: Project Initialization - **COMPLETED**
- ✅ Milestone 1: Basic HTTP Server & Domain Health Endpoint - **COMPLETED**
- ✅ Milestone 2: Database Integration & Health Checks - **COMPLETED**
- ✅ Milestone 3: Edge-to-Domain Communication - **COMPLETED**
- ✅ Milestone 4: React TypeScript Frontend - **COMPLETED**

### MVP2 (In Progress)
- ⬜ Milestone 5: Core ContextThread Domain Layer - Implement data models, storage, and domain services
- ⬜ Milestone 6: Edge Tier API for ContextThreads - Create RESTful API endpoints
- ⬜ Milestone 7: GPT-4.1 Integration with Streaming - Implement OpenAI service with SSE
- ⬜ Milestone 8: Chat UI Components - Create React components for conversation interface

## Key Architecture Points

- Follow the tiered architecture with clean separation:
  - Domain Tier (core business logic)
  - Edge/XPI Tier (API routes, transforms)
  - UI Tier (React frontend)

- Use the standardized error handling system with hierarchical error codes (see `/server/src/utils/error-codes.ts`)

- Implement the domain client adapter pattern for tier communication, allowing both in-process and HTTP communication modes

- Adhere strictly to all naming conventions and coding standards

- Maintain test coverage requirements (90% for domain services, 80% for others as enforced by CI)

- Follow Test-Driven Development (TDD) principles for all components

- Implement proper error handling with custom error types for each domain

- Use GitHub Actions CI workflow for automated testing, linting, and building

## Project Plan Reference

The full project plan is located at `project-plan.xml` - please refer to this document for:

1. Detailed application architecture
2. Development standards and patterns
3. Milestone definitions
4. Code examples of key patterns

### Technology Stack

**Server:**
- Node.js with Express (backend framework)
- SQLite with better-sqlite3 (database)
- TypeScript (type safety)
- Jest with Supertest (testing)
- Domain client adapter pattern for tier communication

**Client:**
- React with TypeScript
- Chakra UI (component library)
- Vite (build system)
- Vitest and React Testing Library (testing)
- Axios (API communications)

## Implementation Approach

### Development Methodology

Follow this tiered implementation approach when developing features:

1. **Domain Layer First**:
   - Define domain models and interfaces (e.g., `ContextThread`, `Message`)
   - Implement domain services with comprehensive unit tests
   - Create repositories for data access

2. **Edge/XPI Layer Second**:
   - Implement domain client adapters (both direct and HTTP)
   - Create edge routes with request validation
   - Add integration tests for all routes

3. **UI Layer Last**:
   - Define component hierarchies
   - Implement components with proper state management
   - Connect to backend through typed API services

### MVP2 Focus: ContextThread Implementation

For the ContextThread and GPT-4.1 integration (Milestones 5-8), follow these guidelines:

1. **ContextThread Schema Design**:
   - Keep the data model simple but extensible
   - Include necessary fields for conversation context
   - Consider using SQLite JSON capabilities for flexible metadata

2. **OpenAI API Integration**:
   - Ensure proper error handling for API failures
   - Implement streaming using SSE (Server-Sent Events)
   - Abstract OpenAI-specific details behind a service interface

3. **Security Considerations**:
   - Protect API keys using environment variables
   - Implement appropriate request validation
   - Handle errors gracefully without exposing sensitive information

## CI/CD Workflow

The project uses GitHub Actions for continuous integration:

- **Automated Testing**: All tests run on each PR and push to main
- **Coverage Requirements**: 80% for client, 90% for server components
- **Code Quality**: Linting runs as part of the CI process
- **Build Verification**: Both client and server builds must succeed

The workflow is defined in `.github/workflows/ci.yml` and includes:
- Node.js setup with dependency caching
- Sequential lint, build, test steps
- Security audit reporting

Always verify CI workflow succeeds before considering a feature complete.

## Development Journal

Implementation decisions, problem-solving approaches, and developer notes are tracked in milestone-specific development journals in the `dev-journal` directory:

- [Milestone 4 Development Journal](../dev-journal/dev-journal-m4.md) - React TypeScript Frontend with CI Workflow ✅
- [Milestone 3 Development Journal](../dev-journal/dev-journal-m3.md) - Edge-to-Domain Communication ✅
- [Milestone 2 Development Journal](../dev-journal/dev-journal-m2.md) - Database Integration & Health Checks ✅
- [Milestone 1 Development Journal](../dev-journal/dev-journal-m1.md) - Basic HTTP Server & Domain Health Endpoint ✅
- [Milestone 0 Development Journal](../dev-journal/dev-journal-m0.md) - Project Initialization ✅
