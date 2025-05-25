# Documentation Classification Guidelines

This document outlines the criteria used to determine whether documentation belongs in the `wiki/` directory (stable, reference content) or the `in-progress-docs/` directory (evolving, historical, or working content).

## Wiki Documentation Criteria

Content in the `wiki/` directory should meet the following criteria:

1. **Stability**: Content that is unlikely to change frequently, representing established patterns, architecture, or decisions
2. **Completeness**: Documentation that comprehensively covers its topic area
3. **Accuracy**: Content that reflects the current state of the codebase and architecture
4. **Relevance**: Information that is currently applicable to development, operations, or understanding the system
5. **Reference Value**: Documents that developers need to reference frequently during their work

Examples of wiki documentation include:
- Security architecture and implementation guides
- API documentation
- Database schemas and relationships
- Code standards and conventions
- Development environment setup guides
- Component architecture documentation
- Testing standards

## In-Progress Documentation Criteria

Content in the `in-progress-docs/` directory includes:

1. **Development Journals**: Historical records of implementation decisions and problem-solving approaches
2. **Working Plans**: Documents that are actively evolving during development
3. **Evaluations**: Product analyses, experiments, and feature evaluations
4. **Historical Content**: Documentation of past work with historical reference value
5. **Draft Content**: Documentation being developed before moving to the wiki
6. **Transient Content**: Information relevant to current work but not expected to have long-term reference value

### In-Progress Subdirectories

- `/journals/`: Development journals remain here permanently as historical record
- `/evaluations/`: Product and feature evaluations, experiments, and analyses
- `/planning/`: Working plans, milestone details, and design documents
- `/archive/`: Outdated content pending review before wiki migration or removal

## Decision Process

When determining where a document belongs, ask the following questions:

1. Is this document complete, accurate, and unlikely to change frequently?
   - If YES: Consider for the wiki
   - If NO: Place in in-progress-docs

2. Does this document provide reference value for ongoing development?
   - If YES: Consider for the wiki
   - If NO: Place in in-progress-docs

3. Is this a historical record of past work?
   - If YES: Place in in-progress-docs/journals/ or in-progress-docs/archive/
   - If NO: Continue evaluation

4. Is this an active working document that will evolve with development?
   - If YES: Place in in-progress-docs/planning/ or in-progress-docs/evaluations/
   - If NO: Consider for the wiki

## Migration Process

When content in `in-progress-docs/` reaches stability:

1. Review the document for completeness, accuracy, and ongoing relevance
2. Update formatting to match wiki standards using the template
3. Move to the appropriate location in the wiki structure
4. Update references to the document in other documentation and code
5. Add to the appropriate section in CLAUDE.md reference guide if relevant

## Regular Review

A quarterly review process will evaluate:
- Content in in-progress-docs for potential wiki migration
- Wiki content for continued accuracy and relevance
- Documentation gaps that need to be addressed

## Example Classification

| Document Type | Example | Classification |
|---------------|---------|----------------|
| Architecture specification | SECURITY_ARCHITECTURE.md | wiki/security/ |
| Development journal | dev-journal-0009.md | in-progress-docs/journals/ |
| Active milestone | milestone-0008-llm-integration.md | wiki/project/milestones/current/ |
| Completed milestone | milestone-0001-project-initialization.md | wiki/project/milestones/completed/ |
| Implementation guide | DEVELOPMENT_STANDARDS.md | wiki/engineering/standards/ |
| Code standards | ERROR_CODES.md | wiki/engineering/error-codes/ |
| Component documentation | components/README.md | wiki/engineering/frontend/components/ |