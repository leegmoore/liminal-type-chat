---
name: Liminal Type Chat Project Context
description: Core project architecture, standards, and development guidelines

# Frontmatter Configuration
# Defines core context files provided to the AI.
# - .cascade/project-plan/*.md: Individual files containing project architecture, standards, milestones, etc.
# - ai-commands.md: Standard procedures for AI-assisted tasks.
# - ../dev-journal/dev-journal-summary.md: Provides CONCISE context of recent development activity. Avoid including individual journal files unless specifically requested for a deep dive.
activation_mode: always_on
priority: high
include_files:
  - project-plan/01-introduction.md
  - project-plan/02-architecture-overview.md
  - project-plan/03-tech-stack.md
  - project-plan/04-terminology.md
  - project-plan/05-design-principles.md
  - project-plan/06-roadmap-mvp-scope.md
  - project-plan/07-error-handling-testing-cicd.md
  - project-plan/08-key-code-patterns.md
  - project-plan/09-product-vision.md
  - project-plan/10-mvp-001-milestones.md
  - project-plan/milestone-0006-domain-layer-v2.md
  - project-plan/11-architecture-detailed.md
  - project-plan/12-security.md
  - project-plan/13-project-setup.md
  - project-plan/14-dev-standards-naming.md
  - project-plan/15-dev-standards-formatting.md
  - project-plan/16-dev-standards-documentation.md
  - project-plan/17-dev-standards-testing.md
  - project-plan/18-dev-standards-error-handling.md
  - project-plan/19-dev-standards-async.md
  - project-plan/20-dev-standards-di.md
  - project-plan/21-dev-standards-db.md
  - project-plan/22-local-dev-setup.md
  - project-plan/23-deployment.md
  - project-plan/24-development-approach.md
  - project-plan/25-cascade-config.md
  - project-plan/26-ai-coding-guidelines.md
  - ai-commands.md
  - ../dev-journal/dev-journal-summary.md
---

# Liminal Type Chat Project Context

This document provides essential context for development of the Liminal Type Chat application. The complete architecture and standards are detailed in the markdown files within the `.cascade/project-plan/` directory, which should be consulted before making code changes.

## Project Status

### MVP1 (Completed)
- ✅ Milestone 0: Project Initialization - **COMPLETED**
- ✅ Milestone 1: Basic HTTP Server & Domain Health Endpoint - **COMPLETED**
- ✅ Milestone 2: Database Integration & Health Checks - **COMPLETED**
- ✅ Milestone 3: Edge-to-Domain Communication - **COMPLETED**
- ✅ Milestone 4: React TypeScript Frontend - **COMPLETED**

### MVP2 (In Progress)
- ⬜ Milestone 5: Core ContextThread Domain Layer - Implement data models, storage, domain services, **and establish schema documentation process**
- ⬜ Milestone 6: Edge Tier API for ContextThreads - Create RESTful API endpoints, **implement OpenAPI specification, and set up Swagger UI for testing**
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

The full project plan details (architecture, standards, milestones, patterns) are located in the markdown files within the `.cascade/project-plan/` directory. Please refer to these files as needed.

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

### MVP2 Focus: Core Conversation Features

For the Core Conversation Features (Milestones 5-8), follow these guidelines:

### MVP 2: Core Conversation Features (In Progress)

*   **Milestone 0006 (was M5): Core ContextThread Domain Layer**: Implement domain models, services, and persistence for conversation threads and messages. *(See `project-plan/milestone-0006-domain-layer.md` for full details)*.
*   **Milestone 0007 (was M6): Edge Tier API for ContextThreads**: Expose domain functionality via REST API with OpenAPI/Swagger. *(See `10-mvp-001-milestones.md` for full details)*.
*   **Milestone 0008 (was M7): GPT-4.1 Integration with Streaming**: Implement OpenAI service with SSE *(See `10-mvp-001-milestones.md` for full details)*.
*   **Milestone 0009 (was M8): Chat UI Components**: Create React components for conversation interface *(See `10-mvp-001-milestones.md` for full details)*.

## Core Planning & Context Documents:

*   The complete architecture, roadmap, and development standards are documented in the markdown files within `.cascade/project-plan/`.
*   Standard procedures for common AI-assisted tasks are defined as **AI Commands** in `.cascade/ai-commands.md`.

**Please consult the relevant files in `.cascade/project-plan/` and `ai-commands.md` thoroughly before making any code changes or performing defined AI Command actions.**

## Key Reminders & Guidelines:

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
