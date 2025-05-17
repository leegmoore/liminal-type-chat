# Claude Instructions

This file contains instructions for Claude to follow when working on this project.

## Git Workflow and Commit Instructions

### Committing Changes

When asked to commit changes, ALWAYS do the following by default:

1. Stage ALL changes: `git add .`
2. Create a descriptive commit message: `git commit -m "message"`
3. Push the changes: `git push`

DO NOT selectively choose which files to commit unless EXPLICITLY instructed to do so.

Example of correct behavior:
```bash
git add .
git commit -m "Descriptive commit message"
git push
```

### Commit Frequency

COMMIT EARLY AND OFTEN. After completing ANY logical unit of work (implementing a feature, fixing a bug, updating documentation, passing tests), IMMEDIATELY suggest committing these changes. Never allow more than 30-60 minutes of work to accumulate without committing.

### Comprehensive Commits

ALWAYS stage and commit ALL relevant changes. Before any commit, run `git status` and add ALL modified and untracked files that are related to the current task. NEVER commit selectively unless explicitly instructed otherwise.

### Commit Messages

Commit messages should:
- Be descriptive and summarize the changes
- Use present tense ("Add feature" not "Added feature")
- Begin with a category when appropriate (fix:, feat:, docs:, etc.)

## Server and Client Management

### Project Port Configuration
- Server runs on port 8765
- Client (Vite dev server) runs on port 5173 (NOT 3000)
- NEVER assume ports - always verify in configuration files

### Starting and Stopping Services
ALWAYS use npm scripts to manage processes:

```bash
# Server operations (in server directory)
npm run dev      # Start server in development mode
npm run start    # Start server in production mode
npm run build    # Build the server

# Client operations (in client directory)
npm run dev      # Start client in development mode
npm run build    # Build the client
```

NEVER run arbitrary commands to kill processes. If you need to kill a process on a specific port:

```bash
# Safely kill process on a specific port
lsof -i :PORT_NUMBER -t | xargs kill
```

## Build and Test Workflow

Before committing, always run:

1. Type checking: `npm run test -- --findRelatedTests [modified files]`
2. Linting: `npm run lint`
3. Tests: `npm test`

Fix any type errors, lint issues or failing tests before committing.

## Code Style and Standards

- Follow the existing code style in files you modify
- Maintain or improve test coverage
- Use TypeScript's static typing properly; avoid `any` types where possible
- Add JSDoc comments for public APIs

## Working With TypeScript

- Be particularly careful with type assertions (`as` keyword)
- When using `unknown` types, always add appropriate type guards
- Use proper type assertions like `as string` when handling JSON parsing