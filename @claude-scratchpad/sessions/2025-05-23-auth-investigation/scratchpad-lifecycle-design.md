# Scratchpad Lifecycle Design

## Potential States & Scenarios

### Scenario 1: Fresh Session, Existing Files
- Previous session's todo.md with half-completed tasks
- Investigation from last week still present
- Quick notes that may or may not be relevant

### Scenario 2: Long Running Session
- Multiple different tasks tackled
- Some completed, some abandoned when user pivoted
- Mix of relevant and obsolete information

### Scenario 3: Complex Investigation
- Multi-day debugging session
- Valuable findings that should be preserved
- Some hypotheses proven wrong, others confirmed

### Scenario 4: Feature Implementation
- Todo list created, feature completed
- Design notes that might be useful later
- Temporary code snippets no longer needed

## Proposed Structure

### 1. Session-Based Organization
```
@claude-scratchpad/
├── current/          # Active work
│   ├── todo.md      
│   ├── notes.md     
│   └── design.md    
├── sessions/         # Historical by date
│   ├── 2025-05-23-auth-investigation/
│   └── 2025-05-22-feature-x/
└── reference/        # Valuable persistent findings
    ├── architecture-decisions.md
    └── gotchas.md
```

### 2. Lifecycle Rules

**START OF SESSION**:
1. Check current/ directory
2. If files exist, scan them and either:
   - Continue if relevant
   - Archive to sessions/YYYY-MM-DD-topic/
   - Delete if clearly obsolete

**DURING SESSION**:
- Work in current/ directory
- Use clear headings with timestamps
- Mark items as ✓ DONE, ❌ ABANDONED, or 🔄 IN PROGRESS

**END OF TASK/INVESTIGATION**:
- Move valuable findings to reference/
- Archive complete work to sessions/
- Clean up temporary files

**PERSISTENT FILES**:
- reference/ holds long-term valuable discoveries
- Should be curated and kept clean
- Can be promoted to actual docs if very valuable

### 3. File Naming Conventions
- Use descriptive names: `auth-debugging.md` not `notes.md`
- Include dates in session archives
- Mark status in filenames when relevant: `todo-COMPLETE.md`

### 4. Cleanup Triggers
- When starting new unrelated work
- When user says "new topic" or "different issue"
- When investigation is clearly complete
- At start of session if current/ has old content

### 5. What to Preserve
- Architectural discoveries
- Non-obvious gotchas
- Successful investigation patterns
- Design decisions with rationale