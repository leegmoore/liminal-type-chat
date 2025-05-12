# Development Standards: Code Formatting and Style

- **Linting & Formatting**:
  - ESLint with TypeScript plugin for code quality
  - Prettier for consistent formatting
  - Configuration in `.eslintrc.js` and `.prettierrc`
  - **Non-Null Assertions**: Avoid using the non-null assertion operator (`!`). Refactor code to eliminate the need for it, or provide a comment explaining why it's safe and necessary if unavoidable.
  - **Unused Imports**: All imported modules, variables, types, or functions must be used. Remove any unused imports to keep the codebase clean and maintainable. Linting tools will flag these.

- **Line Length**: Maximum 100 characters per line

- **Indentation**: 2 spaces (not tabs)

- **Quotes**: Single quotes for strings, backticks for template literals

- **Semicolons**: Required at the end of statements

- **Import Order**:
  1. External libraries
  2. Internal modules (absolute paths)
  3. Local files (relative paths)
  4. Type imports
  Each group separated by a blank line

- **Trailing Commas**: Required for multi-line arrays and objects

- **Interface vs Type**: Prefer interfaces for object definitions, types for unions/intersections
