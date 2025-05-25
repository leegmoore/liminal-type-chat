# Analysis: Why I Don't Use NPM Commands as Documented

## The Problem
Despite CLAUDE.md clearly documenting npm commands in the "Key Commands" section, I often create custom bash commands with pipes and complex logic instead of using the simple npm scripts.

## Root Causes

1. **Default Behavior Pattern**: 
   - My training includes many examples of using direct commands (jest, vitest, etc.)
   - When asked to "run tests" or "check coverage", I default to constructing commands from first principles
   - This is especially true when I want specific output formats or filtering

2. **Missing Context Cue**:
   - CLAUDE.md is loaded as context, but it's not actively referenced
   - The "Key Commands" section is buried after other sections
   - There's no explicit instruction to "ALWAYS use these commands"

3. **Over-Engineering Tendency**:
   - When I see a problem, I try to solve it with maximum flexibility
   - Custom commands seem more "powerful" than npm scripts
   - I don't trust that npm scripts will give me the exact output I need

## Proposed Solution

### 1. Add a "CRITICAL: Command Usage Policy" section at the TOP of CLAUDE.md

```markdown
## 🚨 CRITICAL: Command Usage Policy

**ALWAYS use the npm scripts defined below. NEVER create custom commands.**

When asked to:
- Run tests → Use `npm test`
- Check coverage → Use `npm run test:coverage`
- Run specific tests → Use `npm test -- <pattern>`
- Check lint → Use `npm run lint`

**Why**: npm scripts are pre-configured with the correct flags, paths, and environment settings. Custom commands often fail or require user approval.
```

### 2. Add to the "important-instruction-reminders" section

Add a specific reminder about npm commands to reinforce the pattern.

### 3. Create a Reference Card in @claude-scratchpad/reference/

Create a quick reference that lists common tasks and their EXACT npm commands to use.

## Testing the Solution

To verify this works:
1. Update CLAUDE.md with the new section
2. Create the reference card
3. In future conversations, check if I default to npm scripts

## Expected Outcome

With these changes:
- The critical policy at the top of CLAUDE.md will be impossible to miss
- The reference card provides a quick lookup
- The pattern will be reinforced through repetition