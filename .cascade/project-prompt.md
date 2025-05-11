---
name: Liminal Type Chat Project Context
description: Core project architecture, standards, and development guidelines
activation_mode: always_on
priority: high
include_files:
  - project-plan.xml
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

## Implementation Notes

- **Database Location**: SQLite database should be stored at `/server/db/` directory, keeping it within the server component and not accessible to the client-side UI.

- **Domain Client Adapter Pattern**: The in-process vs HTTP communication modes primarily support deployment scenarios where edge speed is prioritized. This flexibility is built into the architecture, though the specific use cases may evolve during implementation.

- **LLM Provider Strategy**: 
  1. First implement OpenAI as the initial BYOK vendor to establish the real-world integration pattern
  2. After OpenAI is working correctly, implement a local mock that mimics streaming behavior for development
  3. Optionally add TinyLlama running locally as a fast development option
  
  Focus on getting the real provider working first before implementing any mock or local LLMs to avoid development issues.

- **API Key Management**: Detailed implementation of API key management (storage, security, UI) will be addressed in MVP 2. For MVP 1, focus on the core architecture and health endpoints. Design the system with appropriate abstractions to make future enhancements straightforward.

- **Error Handling**: Establish consistent error handling patterns for each milestone rather than implementing ad-hoc solutions. This includes standardized error objects, proper HTTP status codes, and clear error messages. Document the approach as we implement it to ensure consistency across the entire application.

- **SQLite Compatibility**: Research showed that better-sqlite3 version 11.5.0 and later fully supports Node.js 23, including v23.11.0. The project will use better-sqlite3 v11.10.0+ for SQLite database connectivity. We've added Node.js version requirements (>=20.0.0) in package.json to ensure compatibility.
