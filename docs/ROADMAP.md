[<< Back to Root README](../README.md)

# Liminal Type Chat: Roadmap & Future Enhancements

This document outlines planned enhancements and improvements to Liminal Type Chat based on architectural reviews and feedback. It serves as both a roadmap for contributors and a tracking mechanism for future development.

## Current Development Focus

### Streaming Architecture Hardening (Milestone 0010) - IN PROGRESS
- [ ] Implement SSE streaming for Edge API tier
- [ ] Add streaming support to domain services
- [ ] Create streaming client adapters
- [ ] Implement error handling and retry logic for streams
- [ ] Add comprehensive streaming tests
- [ ] Update OpenAPI specifications for streaming endpoints

### OpenAI Provider Implementation (Milestone 0011) - NEXT
- [ ] Create OpenAIService implementing ILlmService interface
- [ ] Add OpenAI-specific streaming support
- [ ] Implement model selection and configuration
- [ ] Add comprehensive tests for OpenAI integration
- [ ] Update LlmServiceFactory to support OpenAI

### Multi-Provider Support (Milestone 0012)
- [ ] Refine LlmServiceFactory for dynamic provider selection
- [ ] Implement provider-specific configuration management
- [ ] Add provider switching capabilities in UI
- [ ] Create unified error handling across providers
- [ ] Add provider status and health monitoring

### AI Roundtable MVP (Milestone 0013)
- [ ] Design multi-participant conversation architecture
- [ ] Implement @mention system for AI participants
- [ ] Create conversation orchestration service
- [ ] Add turn management and context switching
- [ ] Build UI for multi-participant conversations
- [ ] Implement conversation history with participant attribution

### Chat Interface Refinement (Milestone 0014)
- [ ] Design and implement enhanced chat UI components
- [ ] Create conversation management interface
- [ ] Implement thread creation and listing
- [ ] Add streaming message display with progress indicators
- [ ] Improve mobile responsiveness
- [ ] Add keyboard shortcuts and accessibility features

### MCP Integration (Milestone 0015)
- [ ] Integrate Model Context Protocol for tool use
- [ ] Implement MCP tool discovery and registration
- [ ] Add tool execution at Edge tier
- [ ] Create audit trail for tool usage in Domain tier
- [ ] Build UI for tool management and visibility

### OpenAPI Full Implementation (Milestone 0016)
- [ ] Complete OpenAPI specifications for all endpoints
- [ ] Implement request/response validation middleware
- [ ] Add API versioning support
- [ ] Create comprehensive API documentation
- [ ] Set up automated API testing from specifications

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

## Completed Milestones
### Core ContextThread Domain Layer (Milestone 0006) - COMPLETED
- [x] Implement ContextThread and Message data models as TypeScript interfaces
- [x] Create SQLite schema for storing threads with JSON-serialized messages
- [x] Build domain services for CRUD operations on ContextThreads and messages
- [x] Apply TDD with comprehensive test coverage (>90%)
- [x] Implement domain API routes with full test coverage

### Edge Tier API for ContextThreads (Milestone 0007) - COMPLETED
- [x] Create edge tier routes for ContextThread operations (REST only)
- [x] Implement validation and error handling
- [x] Follow the domain client adapter pattern consistently
- [x] Implement OpenAPI specification and Swagger UI for testing
- [x] Apply TDD testing as we go

### Security & Authentication Framework (Milestone 0008) - COMPLETED
- [x] Implement secure API key encryption for BYOK approach
- [x] Create user entity model and repository
- [x] Implement GitHub OAuth provider integration
- [x] Build JWT authentication framework with token validation
- [x] Create authentication middleware and utilities
- [x] Implement auth and API key management routes
- [x] Apply TDD with comprehensive test coverage

### Security Hardening (Milestone 0009) - COMPLETED
- [x] Add helmet middleware for security headers
- [x] Implement CORS with proper allow list
- [x] Set up rate limiting
- [x] Add comprehensive error handling
- [x] Implement security best practices

## Next Phase - Distinguishing Features

The following features represent the key differentiators for Liminal Type Chat, building on the foundation established in the current milestones:

### AI Roundtable Conversations (See Milestone 0013)
The flagship feature that sets Liminal apart - multi-participant AI conversations with distinct personalities and perspectives. This creates a new paradigm for AI interaction where users can orchestrate discussions between multiple AI entities.

### Platform Architecture for Extensions
Building on the Edge/Domain separation and provider abstraction, Liminal will support:
- **Liminal-flow**: Visual orchestration of AI workflows
- **Custom Tool Integration**: Beyond MCP, allow custom tool development
- **Provider Marketplace**: Community-contributed LLM providers
- **Conversation Templates**: Shareable roundtable configurations

### Advanced Features (Post-MVP)

#### Prompt Management
- [ ] Design and implement prompt database schema
- [ ] Add prompt templating capabilities
- [ ] Create prompt management UI
- [ ] Implement prompt search functionality
- [ ] Version control for prompts

#### Advanced Orchestration
- [ ] Design pattern for chaining multiple LLM calls
- [ ] Implement prompt routing capabilities
- [ ] Add result transformation and post-processing
- [ ] Create visual orchestration builder UI
- [ ] Support for conditional logic in workflows

#### Multi-user Support (If Needed)
- [ ] Extend authentication system for teams
- [ ] Implement data scoping and permission model
- [ ] Add team/sharing capabilities
- [ ] Create administrative interface
- [ ] Add collaboration features for shared conversations

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
