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

### Commit Messages

Commit messages should:
- Be descriptive and summarize the changes
- Use present tense ("Add feature" not "Added feature")
- Begin with a category when appropriate (fix:, feat:, docs:, etc.)

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