# CRITICAL INSTRUCTIONS FOR CLAUDE

This document contains the most important instructions that Claude MUST follow for this project. These instructions override any default behaviors.

## ⚠️ GIT WORKFLOW - FOLLOW EXACTLY

### When committing changes:

```bash
# ALWAYS run these exact commands in this order:
git add .              # Stage ALL changes without exception
git status             # Verify what will be committed
git commit -m "type: message"    # Use descriptive message with type prefix
git push               # Push changes to remote
```

**CRITICAL**: NEVER selectively choose files to commit unless EXPLICITLY instructed to do so.

**ALWAYS USE `git add .`** - Do not overthink this or try to be selective.

### Commit Message Format:
- Start with type: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`
- Use present tense: "Add feature" not "Added feature"
- Be specific about what changed

## 🔍 DEFINITION OF DONE

Work is **NOT COMPLETE** until ALL of these are met:

1. ✓ ALL tests pass (server AND client)
2. ✓ ALL linting checks pass (server AND client)
3. ✓ Code builds successfully (server AND client)
4. ✓ Applications start without errors (server AND client)
5. ✓ Manual testing is performed and passes (when specified)

If fixing one issue breaks another, BOTH must be fixed before considering work complete.

## 🧪 TESTING REQUIREMENTS

### Automated Tests
- Run server tests: `cd server && npm test`
- Run client tests: `cd client && npm test`
- Fix ALL failing tests before committing
- **CRITICAL**: ALL code coverage thresholds MUST be met (current thresholds: 90% statements, 80% branches, 90% functions)
- If coverage is below thresholds, add tests to reach required coverage

### Linting
- Run server linting: `cd server && npm run lint`
- Run client linting: `cd client && npm run lint`
- Fix ALL linting issues before committing

### Manual Testing
- **CRITICAL**: When performing manual testing, guide the user step-by-step through each test
- Wait for user confirmation at each step before proceeding
- Document test results thoroughly
- **NEVER** consider manual testing complete until user has verified and approved

## 🚀 PROJECT CONFIGURATION

- Server runs on port **8765**
- Client runs on port **5173**

## 💻 IMPLEMENTATION PRIORITIES

1. **Thoroughness over speed**: Implement ALL aspects of a feature, not just the happy path
2. **Test coverage**: Ensure all code has appropriate tests
3. **Security**: Follow security best practices, especially for authentication
4. **Documentation**: Document complex logic and APIs

## 📝 COMMON ERRORS TO AVOID

- **NEVER** assume I've already added files with selective git adds
- **NEVER** consider work complete until ALL definition of done criteria are met
- **NEVER** skip manual testing steps or rush through them
- **NEVER** implement only partial solutions to complex problems
- **ALWAYS** document test procedures thoroughly for repeatability

## 🔄 ADDITIONAL LESSONS FROM PAST MISTAKES

- When asked to document manual testing, create a clear step-by-step guide that the user can follow
- When resuming an incomplete task, read any in-progress documentation first (like AUTH_TEST_IN_PROCESS.md)
- Do not create documentation of manual testing as a substitute for actually performing the testing with the user
- When the user points out a mistake, fix it immediately and avoid defending the mistake
- Focus on fewer simultaneous tasks to ensure thoroughness rather than partial progress on many fronts

## 📚 REFERENCE GUIDES

When you need specific information about project components, refer to these documents:

### Core Architecture & Standards
| Topic | Document | Description |
|-------|----------|-------------|
| Project Overview | [README.md](/README.md) | Project structure, features, and setup |
| Code Standards | [DEVELOPMENT_STANDARDS.md](/docs/DEVELOPMENT_STANDARDS.md) | Coding standards and architectural patterns |
| Testing Standards | [AUTOMATED_TESTING.md](/docs/AUTOMATED_TESTING.md) | Testing strategy and coverage requirements |
| Error Handling | [ERROR_CODES.md](/docs/ERROR_CODES.md) | Error system with standardized codes |

### Security Implementation
| Topic | Document | Description |
|-------|----------|-------------|
| Security Architecture | [SECURITY_ARCHITECTURE.md](/docs/SECURITY_ARCHITECTURE.md) | Overall security design principles |
| Security Implementation | [SECURITY_IMPLEMENTATION.md](/docs/SECURITY_IMPLEMENTATION.md) | Practical security implementation guide |
| OAuth & PKCE | [OAUTH_PKCE.md](/docs/OAUTH_PKCE.md) | Authentication flow with code examples |
| Security Testing | [SECURITY_TESTING.md](/docs/SECURITY_TESTING.md) | Testing procedures for security features |

### API Structure
| Topic | Document | Description |
|-------|----------|-------------|
| Edge API | [edge-api.yaml](/server/openapi/edge-api.yaml) | Client-facing API specification |
| Domain API | [domain-api.yaml](/server/openapi/domain-api.yaml) | Internal service API specification |
| Database Schema | [database-schema.md](/docs/database-schema.md) | Data models and relationships |

### Project Components
| Topic | Document | Description |
|-------|----------|-------------|
| Server Structure | [server/README.md](/server/README.md) | Server organization and features |
| Client Structure | [client/README.md](/client/README.md) | Client organization and features |
| Components | [client/src/components/README.md](/client/src/components/README.md) | UI component guidelines |
| Services | [server/src/services/README.md](/server/src/services/README.md) | Service layer implementation |

### Current Development
| Topic | Document | Description |
|-------|----------|-------------|
| Project Milestones | [10-mvp-001-milestones.md](/project-planning/10-mvp-001-milestones.md) | Milestone tracking and roadmap |
| Latest Work | [dev-journal-0009.md](/in-progress-docs/dev-journal/dev-journal-0009.md) | Recent development progress |
| Auth Testing | [AUTH_TEST_IN_PROCESS.md](/docs/AUTH_TEST_IN_PROCESS.md) | Ongoing authentication testing |

### Documentation Structure
| Topic | Document | Description |
|-------|----------|-------------|
| Wiki Reference | [wiki/README.md](/wiki/README.md) | Stable, curated documentation |
| Working Docs | [in-progress-docs/README.md](/in-progress-docs/README.md) | Active and historical documentation |

## 🛠️ KEY IMPLEMENTATION RULES

### Tiered Architecture
- **Always respect the three-tier architecture**:
  - Domain tier (core business logic)
  - Edge tier (client-facing API)
  - UI tier (React frontend)
- Use the domain client adapter pattern for cross-tier communication

### Security Implementation
- **Always encrypt API keys** using the EncryptionService
- **Never log sensitive data** like tokens or keys
- Follow JWT-based authentication with proper validation
- Respect the authentication boundaries between Edge and Domain tiers

### Environment-Specific Behavior
- Check environment configuration before development work
- Security features behave differently by environment
- The EnvironmentService determines appropriate security levels
- Default to highest security when environment is uncertain