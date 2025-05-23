# CLAUDE.md - Operational Handbook

This document contains essential operational information for development. Keep it practical and actionable.

## ! Commands (Project-specific shortcuts)

When you see these ! commands, execute the corresponding npm script:

- **!test** → `npm run test:coverage` (run all unit tests WITH coverage report)
- **!lint** → `npm run lint` (check code style and TypeScript)
- **!check** → Orchestrate parallel fixes until all checks pass:
  1. Run `npm run test:coverage && npm run lint` to identify issues
  2. Deploy up to 2-3 Task agents in parallel to fix different problems
  3. Continuously verify progress with tests and lint and bring code coverage to project standards
  4. Redeploy agents as needed until all tests pass, all lint pasts and code coverage is at project standards
  5. Run `npm run test:coverage && npm run lint` to verify final state


**Why use ! commands**: They signal project-specific operations that should use npm scripts, not generic commands.

## Quick Links

### Core Documentation
- **Product Vision**: [PRD.md](./PRD.md) - "Welcome to the Threshold"
- **Technical Architecture**: [TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md) - System design and rationale
- **Development Standards**: [wiki/engineering/standards/development-standards.md](./wiki/engineering/standards/development-standards.md)

### Project Information
- **Milestones**: [project-planning/](./project-planning/) - Current: Milestone 10 (Streaming)
- **Dev Journals**: [dev-journal/](./dev-journal/) - Historical development records
- **In-Progress Work**: [in-progress-docs/](./in-progress-docs/) - Active documentation

## Key Commands

### Development
```bash
# Start both client and server
npm run dev

# Server only (port 8765)
cd server && npm run dev

# Client only (port 5173)  
cd client && npm start

# Run all tests (MUST pass before committing)
cd server && npm test
cd client && npm test

# Check coverage
cd server && npm run test:coverage
cd client && npm run test:coverage

# Linting (MUST pass)
cd server && npm run lint
cd client && npm run lint

# Server management
cd server && npm run stop       # Stop server on port 8765
cd server && npm run restart    # Stop and restart server
cd server && npm run dev:log    # Start server with logging to server.log
cd server && npm run log        # Tail server.log
cd server && npm run log:clear  # Clear server.log
```

### Git Workflow
```bash
# ALWAYS use these commands in order
git add .                    # Stage ALL changes
git status                   # Verify changes
git commit -m "type: message"  # type: feat|fix|docs|test|refactor|chore
git push                     # Push to remote

# Creating PRs
gh pr create --title "type: description" --body "..."
```

## Project Structure

```
liminal-type-chat/
├── client/              # React UI (port 5173)
│   └── src/
│       ├── components/  # UI components
│       ├── pages/       # Page components
│       └── services/    # API clients
├── server/              # Node.js backend (port 8765)
│   └── src/
│       ├── routes/
│       │   ├── edge/    # /api/v1/* endpoints
│       │   └── domain/  # /domain/* endpoints
│       ├── services/    # Domain logic
│       └── providers/   # External integrations
└── project-planning/    # Milestones and plans
```

## Critical Development Patterns

### Adding New Features
1. **Domain First**: Create service method with tests (90% coverage required)
2. **Edge Route**: Add endpoint with schema transformation
3. **OpenAPI**: Update specification
4. **Frontend**: Add types and integrate

### API Patterns
- **Edge Routes**: `/api/v1/conversations` (client-facing)
- **Domain Routes**: `/domain/context-threads` (internal)
- **Streaming**: SSE from Edge tier
- **MCP Tools**: Execute at Edge, audit in Domain

### Testing Requirements
- **Domain Services**: 90% coverage
- **Edge Routes**: 75% coverage  
- **Always test**: Both direct and HTTP domain client modes
- **Run before commit**: ALL tests must pass

## Common Gotchas

1. **Schema Differences**:
   - Domain: `camelCase`, timestamps, null allowed
   - API: `kebab-case` routes, ISO dates, no nulls

2. **Architecture Boundaries**:
   - Tools/MCP → Edge tier only
   - Business logic → Domain tier only
   - No provider-specific code in Domain

3. **Streaming**:
   - Use SSE, not WebSockets
   - Domain returns AsyncIterables
   - Edge handles multiplexing

## Working Memory - @claude-scratchpad/

The `@claude-scratchpad/` directory serves as external working memory for ANY multi-step work. Use it liberally to maintain context and track progress across messages.

### Always Use For
- **Todo Lists**: Any multi-step task (even simple ones)
- **Progress Tracking**: Mark what's done, in progress, or blocked
- **Working Notes**: Design decisions, quick calculations, temporary code
- **Investigations**: Complex debugging, hypotheses, test results
- **Current Context**: What you're working on right now
- **Questions/Reminders**: Things to ask about or circle back to

### Directory Structure
```
@claude-scratchpad/
├── current/              # Active work (start here!)
│   ├── todo.md          # Current task list
│   ├── notes.md         # Working notes
│   └── investigation.md # Active debugging
├── sessions/            # Archived completed work
│   └── 2025-05-23-auth-investigation/
└── reference/           # Valuable persistent findings
    └── gotchas.md       # Reusable discoveries
```

### Session Lifecycle

**Start of Session**:
1. Check `current/` directory for existing work
2. Either continue relevant work OR archive to `sessions/`
3. Start fresh in `current/` for new work

**During Work**:
- Always update todo.md with task progress
- Mark items: ✓ DONE, 🔄 IN PROGRESS, ❌ ABANDONED
- Save any "aha!" moments to notes.md

**Task Completion**:
- Archive completed work to `sessions/YYYY-MM-DD-description/`
- Move valuable findings to `reference/`
- Clear `current/` for next task

### Benefits
- Never lose track of multi-step tasks
- Maintain context across conversation breaks
- Build up valuable reference material
- Avoid repeating work or investigations

**Remember**: It's better to over-use the scratchpad than to lose important context. When in doubt, write it down!

## API Testing

```bash
npm run api -- /endpoint                     # GET request
npm run api -- /endpoint '{"json"}'         # POST with data
npm run api -- /endpoint -H "Auth: X"        # With headers
npm run api -- /endpoint?q=test&limit=10    # With query params
```

Always tests against localhost:8765. No curl approval needed. See `scripts/test-api.js` for details.

## Current Project State

### Active Development
- **Current Focus**: Streaming architecture refinement
- **Next Up**: OpenAI provider implementation
- **Platform Goal**: AI Roundtable conversations with @mentions

### Known Issues
- [Track any blocking issues here]

### Recent Decisions
- Edge tier retained for orchestration and MCP
- Streaming via SSE with Edge multiplexing
- Platform architecture for future extensions (Liminal-flow)

## 📚 REFERENCE GUIDES

When you need specific information about project components, refer to these documents:

### Core Architecture & Standards
| Topic | Document | Description |
|-------|----------|-------------|
| Project Overview | [README.md](/README.md) | Project structure, features, and setup |
| Code Standards | [Development Standards](/wiki/engineering/standards/development-standards.md) | Coding standards and architectural patterns |
| Testing Standards | [Automated Testing Guide](/wiki/engineering/standards/automated-testing.md) | Testing strategy and coverage requirements |
| Error Handling | [Error Codes Reference](/wiki/engineering/reference/error-codes.md) | Error system with standardized codes |

### Security Implementation
| Topic | Document | Description |
|-------|----------|-------------|
| Security Architecture | [Security Architecture](/wiki/security/architecture.md) | Overall security design principles |
| Security Implementation | [Security Implementation](/wiki/security/implementation.md) | Practical security implementation guide |
| OAuth & PKCE | [OAuth PKCE Flow](/wiki/security/auth/oauth-pkce.md) | Authentication flow with code examples |
| Environment Security | [Environment Security](/wiki/security/environment-security.md) | Environment-specific security controls |

### API Structure
| Topic | Document | Description |
|-------|----------|-------------|
| Edge API | [edge-api.yaml](/server/openapi/edge-api.yaml) | Client-facing API specification |
| Domain API | [domain-api.yaml](/server/openapi/domain-api.yaml) | Internal service API specification |
| Database Schema | [Database Schema](/wiki/engineering/database/schema.md) | Data models and relationships |

### Project Components
| Topic | Document | Description |
|-------|----------|-------------|
| Server Structure | [server/README.md](/server/README.md) | Server organization and features |
| Client Structure | [client/README.md](/client/README.md) | Client organization and features |
| Components | [Frontend Components](/wiki/engineering/frontend/components.md) | UI component guidelines |
| Backend Services | [Backend Services](/wiki/engineering/backend/services.md) | Service layer implementation |

### Current Development
| Topic | Document | Description |
|-------|----------|-------------|
| Project Roadmap | [Roadmap](/wiki/project/roadmap.md) | Future development plans |
| Current Milestones | [Current Milestones](/wiki/project/milestones/current/) | Milestones in progress |
| Latest Work | [Development Journals](/in-progress-docs/journals/) | Development progress logs |
| Auth Testing | [Authentication Testing](/in-progress-docs/evaluations/auth-testing.md) | Authentication testing records |

### Documentation Structure
| Topic | Document | Description |
|-------|----------|-------------|
| Wiki Structure | [Wiki README](/wiki/README.md) | Stable, curated documentation |
| Working Docs | [In-Progress Docs README](/in-progress-docs/README.md) | Active and historical documentation |
| Documentation Standards | [Documentation Classification](/docs/DOCUMENTATION_CLASSIFICATION.md) | Rules for organizing documentation |
| Migration Plan | [Documentation Migration](/docs/DOCUMENTATION_MIGRATION_PLAN.md) | Plan for migrating docs to new structure |