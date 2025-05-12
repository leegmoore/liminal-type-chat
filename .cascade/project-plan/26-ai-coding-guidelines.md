# AI-Assisted Coding Guidelines

When using Cascade for this project, follow these guidelines:

1. **Regular Commits**:
   - After each logical batch of file changes, commit with a descriptive message
   - Example: `git add . && git commit -m "Implement domain health service with unit tests"`
   - Keep commits focused on a single logical change

2. **Prompt Structure**:
   - Begin with clear statement of what you're trying to accomplish
   - Reference specific milestones from the project plan files (`.cascade/project-plan/*.md`)
   - Provide context about where you are in the implementation

3. **Code Review**:
   - Periodically ask Cascade to review recently implemented code
   - Check for adherence to development standards
   - Verify test coverage meets requirements

4. **Implementation Order**:
   - Start with domain models and interfaces
   - Implement services with unit tests
   - Add routes with integration tests
   - Finally build UI components

5. **Documentation**:
   - Request inline documentation following standards
   - Ask for README updates after significant milestones
   - Ensure generated code includes appropriate JSDoc comments

Following these guidelines will maximize the effectiveness of AI-assisted development while maintaining code quality and project structure integrity.
