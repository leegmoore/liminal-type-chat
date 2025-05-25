# Windsurf Cascade Configuration (Initial Suggestion)

*(Note: This reflects the original suggestion in project-plan.xml. The current setup using `project-prompt.md` and included files is an evolution of this idea.)*

To ensure consistent development with Cascade, we'll use project-level configuration to include project context in prompts. This setup provides Cascade with context about the project architecture, standards, and milestones.

**Original Configuration Idea:**
1. Create a `.cascade` directory at the project root
2. Add a `project-prompt.md` file containing:
   ```markdown
   # Liminal Type Chat Project Context
   
   This is a project-level prompt for the Liminal Type Chat application.
   
   The complete architecture and development standards are documented in `project-plan.xml`.
   Please read this file thoroughly before making any code changes.
   
   Key points to remember:
   - Follow the tiered architecture (Domain, Edge/XPI, UI) with clean separation
   - Implement the domain client adapter pattern for tier communication
   - Adhere to all naming conventions and coding standards
   - Maintain test coverage requirements
   - Commit after each significant batch of changes
   ```
3. Make sure project-plan.xml is properly tracked and accessible

This configuration ensures that Cascade always has access to the project context and development standards.
