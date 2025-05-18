# Documentation Migration Plan

This document outlines the plan for migrating our documentation to the new structure with `wiki/` and `in-progress-docs/` directories.

## Migration Strategy

1. **High Priority Documents**: Focus on reference documents critical for ongoing development
2. **Medium Priority Documents**: Migrate documents that provide important context but aren't immediately needed
3. **Low Priority Documents**: Move historical documents with minimal restructuring

## Documents to Migrate

### Core Architecture Documents (High Priority)

| Document | Current Location | Destination | Template | Notes |
|----------|----------------|------------|----------|-------|
| SECURITY_ARCHITECTURE.md | /docs/ | /wiki/security/architecture.md | architecture | Needs minor formatting updates |
| SECURITY_IMPLEMENTATION.md | /docs/ | /wiki/security/implementation.md | reference | Update code examples |
| SECURITY_TESTING.md | /docs/ | /wiki/security/testing.md | guide | Add revision history |
| DEVELOPMENT_STANDARDS.md | /docs/ | /wiki/engineering/standards/development-standards.md | reference | No major changes needed |
| AUTOMATED_TESTING.md | /docs/ | /wiki/engineering/standards/automated-testing.md | reference | Update code examples |
| ERROR_CODES.md | /docs/ | /wiki/engineering/reference/error-codes.md | reference | Needs formatting to match template |
| database-schema.md | /docs/ | /wiki/engineering/database/schema.md | reference | Update with latest schema |

### Authentication Documentation (High Priority)

| Document | Current Location | Destination | Template | Notes |
|----------|----------------|------------|----------|-------|
| OAUTH_PKCE.md | /docs/ | /wiki/security/auth/oauth-pkce.md | reference | Update with current implementation |
| ENVIRONMENT_SECURITY.md | /docs/ | /wiki/security/environment-security.md | reference | No major changes needed |

### Project Planning Documents (Medium Priority)

| Document | Current Location | Destination | Template | Notes |
|----------|----------------|------------|----------|-------|
| ROADMAP.md | /docs/ | /wiki/project/roadmap.md | reference | Update with current timeline |
| 10-mvp-001-milestones.md | /project-planning/ | /wiki/project/milestones/overview.md | reference | Update status of milestones |
| milestone-0001 to 0005 | /project-planning/ | /wiki/project/milestones/completed/ | archive | Historical reference |
| milestone-0006 to 0009 | /project-planning/ | /wiki/project/milestones/current/ | reference | Update with current status |
| milestone-0010 to 0014 | /project-planning/ | /wiki/project/milestones/future/ | reference | Revise timelines if needed |
| UPDATED_PHASE3_PLAN.md | /docs/ | /in-progress-docs/planning/phase3-plan.md | planning | May need updates |

### Component Documentation (Medium Priority)

| Document | Current Location | Destination | Template | Notes |
|----------|----------------|------------|----------|-------|
| client/components/README.md | /client/src/components/ | /wiki/engineering/frontend/components.md | reference | Add examples |
| client/pages/README.md | /client/src/pages/ | /wiki/engineering/frontend/pages.md | reference | Add examples |
| client/services/README.md | /client/src/services/ | /wiki/engineering/frontend/services.md | reference | Add examples |
| server/routes/README.md | /server/src/routes/ | /wiki/engineering/backend/routes.md | reference | Add examples |
| server/services/README.md | /server/src/services/ | /wiki/engineering/backend/services.md | reference | Add examples |

### Development Journals (Low Priority)

| Document | Current Location | Destination | Template | Notes |
|----------|----------------|------------|----------|-------|
| dev-journal-0001 to 0009 | /dev-journal/ | /in-progress-docs/journals/ | journal | Keep original content |
| dev-journal-m0006-domain-api.md | /docs/ | /in-progress-docs/journals/ | journal | Keep original content |

## Migration Process

For each document:

1. Create destination directories if they don't exist
2. Read the current document
3. Format the content to match the appropriate template
4. Add metadata (Last Updated, Status, etc.)
5. Add Revision History table
6. Update links to other documents to point to their new locations
7. Save to the new location
8. Update references in README.md and CLAUDE.md

## Document Creation Standards

All new documentation should follow these guidelines:

1. Use the appropriate template from `/wiki/templates/` or `/in-progress-docs/templates/`
2. Include all required metadata sections
3. Follow standard Markdown formatting
4. Include a revision history table
5. Cross-reference related documentation
6. Add to the appropriate section in CLAUDE.md reference guide if relevant

## Directory Structure Maintenance

The following directories need regular maintenance:

### Wiki Directories
- `/wiki/engineering/`: Technical implementation details and standards
- `/wiki/security/`: Security architecture, implementation, and best practices
- `/wiki/project/`: Project planning, roadmap, and milestone information
- `/wiki/api/`: API documentation and usage examples
- `/wiki/data-models/`: Database schemas and data relationships
- `/wiki/deployment/`: Environment configuration and deployment procedures
- `/wiki/guides/`: Developer guides for common tasks

### In-Progress Directories
- `/in-progress-docs/journals/`: Development journals (historical)
- `/in-progress-docs/planning/`: Working plans and design documents
- `/in-progress-docs/evaluations/`: Product analyses and feature evaluations
- `/in-progress-docs/archive/`: Outdated content pending review or removal

## Documentation Review Schedule

Schedule for ongoing documentation maintenance:

1. **Weekly**: Review any newly created documents for template compliance
2. **Monthly**: Review in-progress documents for potential migration to wiki
3. **Quarterly**: Comprehensive review of all documentation for accuracy and relevance