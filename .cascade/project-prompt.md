---
name: Liminal Type Chat Project Context
description: Core project architecture, standards, and development guidelines
activation_mode: always_on
priority: high
include_files:
  - project-plan.xml
  - dev-journal-m0.md
---

# Liminal Type Chat Project Context

This document provides essential context for development of the Liminal Type Chat application. The complete architecture and standards are in the `project-plan.xml` file, which should be consulted before making code changes.

## Key Architecture Points

- Follow the tiered architecture with clean separation:
  - Domain Tier (core business logic)
  - Edge/XPI Tier (API routes, transforms)
  - UI Tier (React frontend)

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

- [Milestone 0 Development Journal](dev-journal-m0.md) - Project Initialization
