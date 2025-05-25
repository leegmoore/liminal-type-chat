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