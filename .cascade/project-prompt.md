---
name: Liminal Type Chat Project Context
description: Core project architecture, standards, and development guidelines
activation_mode: always_on
priority: high
include_files:
  - project-plan.xml
  - docs/dev-journal-m5-ci-workflow.md
  - dev-journal-m4.md
  - dev-journal-m2-m3.md
  - dev-journal-m1.md
  - dev-journal-m0.md
---

# Liminal Type Chat Project Context

This document provides essential context for development of the Liminal Type Chat application. The complete architecture and standards are in the `project-plan.xml` file, which should be consulted before making code changes.

## Project Status

- ✅ Milestone 0: Project Initialization - **COMPLETED**
- ✅ Milestone 1: Basic HTTP Server & Domain Health Endpoint - **COMPLETED**
- ✅ Milestone 2: Database Integration & Health Checks - **COMPLETED**
- ✅ Milestone 3: Edge-to-Domain Communication - **COMPLETED**
- ✅ Milestone 4: React TypeScript Frontend - **COMPLETED**
- ⬜ Milestone 5: Core Conversation Models & Storage

## Key Architecture Points

- Follow the tiered architecture with clean separation:
  - Domain Tier (core business logic)
  - Edge/XPI Tier (API routes, transforms)
  - UI Tier (React frontend)

- Use the standardized error handling system with hierarchical error codes (see `/docs/ERROR_CODES.md`)

- Implement the domain client adapter pattern for tier communication, allowing both in-process and HTTP communication modes

- Adhere strictly to all naming conventions and coding standards

- Maintain test coverage requirements (90% for domain services, 80% for others)

- Commit after each significant batch of changes when in turbo mode

## Project Plan Reference

The full project plan is located at `project-plan.xml` - please refer to this document for:

1. Detailed application architecture
2. Development standards and patterns
3. Milestone definitions
4. Code examples of key patterns

The project uses:
- Node.js with Express (backend)
- SQLite with better-sqlite3 (database)
- TypeScript (both backend and frontend)
- React (frontend)
- Jest with Supertest (testing)

## Implementation Approach

Follow this approach when implementing features:
1. Define domain models and interfaces first
2. Implement services with comprehensive unit tests
3. Add routes with integration tests
4. Finally, build UI components

Always maintain clean separation between tiers and follow the domain client adapter pattern.

## Development Journal

Implementation decisions, problem-solving approaches, and developer notes are tracked in milestone-specific development journals:

- [CI Workflow Setup Journal](docs/dev-journal-m5-ci-workflow.md) - GitHub Actions CI Implementation ✅
- [Milestone 4 Development Journal](dev-journal-m4.md) - React TypeScript Frontend ✅
- [Milestone 2 & 3 Development Journal](dev-journal-m2-m3.md) - Database Integration & Edge-to-Domain Communication ✅
- [Milestone 1 Development Journal](dev-journal-m1.md) - Basic HTTP Server & Domain Health Endpoint ✅
- [Milestone 0 Development Journal](dev-journal-m0.md) - Project Initialization ✅
