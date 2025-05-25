# Milestone Ideas - Unsorted

These are potential milestones to be organized and prioritized later:

## CLI Interface
- Build a command-line interface for the application
- Useful for ad-hoc API testing and connectivity checks
- Foundation for automation and scripting
- Could include commands for:
  - Health checks
  - API testing
  - Database queries
  - Chat interactions
  - Configuration management

## TDD AI Scaffold
- Implement the TDD with AI approach from the documentation
- Create scaffolding for AI agents to work effectively
- Test-driven development patterns specifically for AI-assisted coding
- Progressive complexity patterns
- Memory management for AI context

## Refactor Edge to Include Integrations
- Move LLM provider logic to Edge tier
- Edge becomes the integration point for external services
- Better separation of concerns
- Cleaner domain tier without provider-specific code

## Refactor Streaming
- Improve streaming architecture
- Implement proper AsyncIterables
- Better error handling in streams
- Backpressure management
- Stream multiplexing for multiple providers

## Implement MCP (Model Control Protocol)
- Add tool-based AI interactions
- MCP server implementation
- Tool registration and execution
- Security boundaries for tools
- Integration with chat interface

## Implement Roundtable AI
- The key differentiator feature
- Multiple AI models in conversation
- @mention system for directing questions
- Fair scheduling between participants
- Context management across models
- UI for multi-model conversations

## Implement and Refine Basic Conversational UI
- Create a functional chat interface
- Message input and display
- Conversation history
- Basic formatting (markdown, code blocks)
- Responsive design
- Error states and loading indicators
- Foundation for more advanced features

## Implement WorkOS AuthKit OAuth
- Integrate WorkOS AuthKit for authentication
- OAuth flow implementation
- User management
- Session handling
- Security considerations
- Note: This might be reconsidered given the auth simplification work

## Setup Dev Environment for Deployment
- Create deployable development environment
- Docker configuration
- Environment variable management
- Database setup for dev
- Deployment scripts
- CI/CD pipeline basics
- Staging environment setup

## Other Considerations
- These may need to be reordered based on dependencies
- Some might be grouped into larger milestones
- Some might be interludes rather than full milestones
- Need to consider which are prerequisites for others