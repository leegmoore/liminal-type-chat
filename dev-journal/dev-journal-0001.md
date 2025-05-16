# Milestone 0001 Development Journal

This document tracks implementation decisions, problem-solving approaches, and developer notes for Milestone 0001 (Project Initialization).

## Implementation Notes

### Database Location
SQLite database is stored at `/server/db/` directory, keeping it within the server component and not accessible to the client-side UI.

### Domain Client Adapter Pattern
The in-process vs HTTP communication modes primarily support deployment scenarios where edge speed is prioritized. This flexibility is built into the architecture, though the specific use cases may evolve during implementation.

### LLM Provider Strategy
1. First implement OpenAI as the initial BYOK vendor to establish the real-world integration pattern
2. After OpenAI is working correctly, implement a local mock that mimics streaming behavior for development
3. Optionally add TinyLlama running locally as a fast development option
  
Focus on getting the real provider working first before implementing any mock or local LLMs to avoid development issues.

### API Key Management
Detailed implementation of API key management (storage, security, UI) will be addressed in MVP B. For MVP A, focus on the core architecture and health endpoints. Design the system with appropriate abstractions to make future enhancements straightforward.

### Error Handling
Establish consistent error handling patterns for each milestone rather than implementing ad-hoc solutions. This includes standardized error objects, proper HTTP status codes, and clear error messages. Document the approach as we implement it to ensure consistency across the entire application.

### SQLite Compatibility
Research showed that better-sqlite3 version 11.5.0 and later fully supports Node.js 23, including v23.11.0. The project will use better-sqlite3 v11.10.0+ for SQLite database connectivity. We've added Node.js version requirements (>=20.0.0) in package.json to ensure compatibility.

### Configuration Management
A centralized config module (src/config/index.ts) handles all environment variables, providing typed access and defaults throughout the application. This creates a single source of truth for configuration values.

### Code Style Enforcement
ESLint and Prettier configurations are implemented to enforce consistent coding standards across the project. This includes specific rules for TypeScript, indentation, line length, and other style conventions.

### Error Handling Implementation
Initial error handling middleware (src/middleware/error-handler.ts) has been implemented as a foundation for the standardized approach. This provides consistent error responses with appropriate levels of detail based on the environment.

### Testing Framework
Jest configuration with specific coverage thresholds has been set up (90% for domain services, 80% for other components). These thresholds align with the test coverage requirements in the project plan.

### Directory Structure Revision
After reviewing the project plan, we identified that our initial implementation placed source code at the project root level (/src) rather than following the plan's structure (/server/src). We're restructuring to align with the original architectural vision, which clearly separates server and client components.
