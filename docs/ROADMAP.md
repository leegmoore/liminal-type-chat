[<< Back to Root README](../README.md)

# Liminal Type Chat: Roadmap & Future Enhancements

This document outlines planned enhancements and improvements to Liminal Type Chat based on architectural reviews and feedback. It serves as both a roadmap for contributors and a tracking mechanism for future development.

## Security Enhancements

### Short-term (Next 1-2 Milestones)
- [ ] Add `helmet` middleware to Express for security headers
- [ ] Implement basic rate limiting via `express-rate-limit`
- [ ] Set up CORS with proper allow list
- [ ] Add pre-commit hooks with Husky for linting and secrets detection

### Medium-term
- [ ] Integrate CodeQL scans via GitHub Actions
- [ ] Set up SonarCloud for deeper static analysis
- [ ] Implement more comprehensive error handling and logging
- [ ] Add zod/joi schema validation for all API endpoints

### Long-term
- [ ] Set up periodic OWASP ZAP scans for the Edge tier API
- [ ] Consider integration of security monitoring if moving to multi-user cloud

## Architecture Improvements

### Short-term
- [ ] Create a shared types package for DTOs used across tiers
- [ ] Implement database path configurability via environment variables
- [ ] Review and refine existing client adapters for completeness

### Medium-term
- [ ] Add database migration framework (drizzle-kit or knex) before creating new tables
- [ ] Implement a lightweight job queue for background LLM orchestrations
- [ ] Refine the testing strategy to include more negative-path testing

### Long-term
- [ ] Consider async database driver if scaling to multi-user cloud deployment
- [ ] Add connection pooling for database if needed
- [ ] Evaluate eventual consistency patterns for distributed deployments

## Feature Roadmap

### MVP 2: Core Chat Functionality & LLM Integration

**Objective:** Implement the core chat interface, conversation persistence, and basic integration with a single LLM provider using user-provided keys.

**Key Features/Tasks:**

-   **API Development (Server):**
    -   [ ] Define and implement API endpoints for:
        -   [ ] Creating/Listing/Deleting Conversations
        -   [ ] Adding/Retrieving Messages within a conversation
        -   [ ] Sending prompts to the LLM service
    -   [ ] Implement data validation for API inputs.
-   **Database Integration (Server):**
    -   [ ] Define database schema for `conversations` and `messages` tables.
    -   [ ] Implement repository/service logic for CRUD operations on conversations and messages.
-   **LLM Integration (Server):**
    -   [ ] Design `LlmService` interface.
    -   [ ] Implement initial `OpenAiService` (or similar first provider) integrating with the LLM API.
    -   [ ] Secure handling of user-provided API keys (initially via environment variables or configuration).
-   **Frontend Development (Client):**
    -   [ ] Develop UI components for:
        -   [ ] Conversation list/sidebar
        -   [ ] Chat message display area
        -   [ ] Message input box
    -   [ ] Implement state management for conversations and messages.
    -   [ ] Integrate frontend with the new chat API endpoints.
-   **Configuration:**
    -   [ ] Implement loading of LLM API keys from configuration (`.env`).
-   **Documentation:**
    -   [ ] **Database Schema:** Create detailed documentation for the chat database schema (`docs/DATABASE.md` or similar).
    -   [ ] **Configuration Guide:** Document environment variables and configuration options (`docs/CONFIGURATION.md` or similar).
    -   [ ] **OpenAPI Specification:** Generate or write OpenAPI (Swagger) specification for the v1 API (`docs/API.md` or `openapi.yaml`).
    -   [ ] Update READMEs and relevant documents.

**Definition of Done:**

-   [ ] Core chat functionality is testable and usable locally.
-   [ ] User can provide an API key via configuration to interact with one LLM.
-   [ ] Basic conversation history is persisted and displayed.
-   [ ] Key documentation (API Spec, DB Schema, Config Guide) is created.

## MVP 3: Enhanced LLM Support & User Experience
### Core ContextThread Domain Layer (Milestone 5)
- [ ] Implement ContextThread and Message data models
- [ ] Create SQLite schema for storing these entities
- [ ] Build domain services for creating/retrieving ContextThreads and messages
- [ ] Apply TDD testing throughout development

### Edge Tier API for ContextThreads (Milestone 6)
- [ ] Create edge tier routes for ContextThread operations (REST only)
- [ ] Implement validation and error handling
- [ ] Follow the domain client adapter pattern consistently
- [ ] Apply TDD testing as we go

### GPT-4.1 Integration with Streaming (Milestone 7)
- [ ] Create OpenAI service in domain tier for GPT-4.1 integration
- [ ] Implement streaming response handling using SSE
- [ ] Add domain endpoints for sending messages to GPT-4.1
- [ ] Create edge tier routes for streaming chat completions

### Chat UI Components (Milestone 8)
- [ ] Create ContextThread list/selector component
- [ ] Build message display area with streaming support
- [ ] Implement message input with send functionality
- [ ] Connect UI to backend APIs

### Prompt Management (Future)
- [ ] Design and implement prompt database schema
- [ ] Add prompt templating capabilities
- [ ] Create prompt management UI
- [ ] Implement prompt search functionality

### Advanced Orchestration (Future)
- [ ] Design pattern for chaining multiple LLM calls
- [ ] Implement prompt routing capabilities
- [ ] Add result transformation and post-processing
- [ ] Create visual orchestration builder UI

### Multi-user Support (Future, If Needed)
- [ ] Design user authentication system
- [ ] Implement data scoping and permission model
- [ ] Add team/sharing capabilities
- [ ] Create administrative interface

## CI/CD Improvements

### Short-term
- [ ] Set up basic GitHub Actions workflow for tests, linting, and audits
- [ ] Implement consistent staging and release process

### Medium-term
- [ ] Add code coverage reporting and tracking
- [ ] Set up automated dependency updates via Dependabot
- [ ] Implement automated deployment for releases

## Documentation Enhancements

### Short-term
- [ ] Add security and privacy section to README
- [ ] Create CONTRIBUTING.md guide
- [ ] Add installation and quickstart documentation

### Medium-term
- [ ] Improve API documentation
- [ ] Add architecture diagrams
- [ ] Create user guide for key features

---

This roadmap is a living document and will be updated as the project evolves and priorities shift.

Last updated: May 2025
