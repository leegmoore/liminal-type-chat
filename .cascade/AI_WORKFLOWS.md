# Cascade AI Workflows for Liminal Type Chat

This document outlines standard operating procedures (SOPs) for common development tasks involving AI assistance (Cascade). Adhering to these workflows helps ensure consistency, accuracy, and efficiency.

## Workflow: Update Roadmap/Milestone

**Trigger:** User request to modify project milestones or roadmap features (e.g., add/remove features, change scope, update status).

**Objective:** Ensure that roadmap changes are consistently reflected across all relevant planning and documentation files.

**Key Files Involved:**

1.  **Primary Plan:** `.cascade/project-plan.xml` (Definitive source for milestone descriptions and high-level deliverables).
2.  **Detailed Roadmap:** `docs/ROADMAP.md` (Detailed task breakdown, Definition of Done).
3.  **AI Context Summary:** `.cascade/project-prompt.md` (Ensure high-level summary reflects changes if significant).
4.  **Root Readme:** `README.md` (Update overall project status or high-level roadmap summary if necessary).

**Procedure:**

1.  **Clarify Scope:** Confirm the exact changes with the user (which milestone, what features/deliverables are added/removed/modified).
2.  **Update Primary Plan (`.cascade/project-plan.xml`):**
    *   Edit the relevant `<milestone>` section.
    *   Update `<description>` and `<key_deliverables>` accurately.
    *   *Action:* Use `edit_file` tool.
3.  **Update Detailed Roadmap (`docs/ROADMAP.md`):**
    *   Edit the corresponding MVP section.
    *   Update the detailed task list (`Key Features/Tasks`).
    *   Update the `Definition of Done`.
    *   Ensure consistency with the changes made in `project-plan.xml`.
    *   *Action:* Use `edit_file` tool.
4.  **Update AI Context Summary (`.cascade/project-prompt.md`):**
    *   Review the summary sections.
    *   If the change is significant enough to alter the high-level project overview or status, update the summary accordingly.
    *   *Action:* Use `edit_file` tool (if needed).
5.  **Update Root Readme (`README.md`):**
    *   Review the `Project Status` and any high-level roadmap summaries.
    *   Update if necessary to reflect the changes.
    *   *Action:* Use `edit_file` tool (if needed).
6.  **Confirmation:** Present a summary of changes made across all files to the user.
7.  **Commit:** Stage and commit all modified files with a clear commit message (e.g., `docs: Update MVP 2 scope to include X`).
    *   *Action:* Use `run_command` for `git add` and `git commit`.

---

## Workflow: Documentation Sync Check

**Trigger:** User request to verify consistency across documentation and planning files.

**Objective:** Ensure key architectural decisions, standards, and roadmap items are aligned between the primary plan, developer docs, and AI context files.

**Key Files Involved:**

*   `.cascade/project-plan.xml`
*   `.cascade/project-prompt.md`
*   `docs/ROADMAP.md`
*   `docs/DEVELOPMENT_STANDARDS.md`
*   `README.md` (Root)
*   `server/README.md`
*   `client/README.md`

**Procedure:**

1.  **Identify Key Areas:** Focus on sections describing Architecture, Milestones/Roadmap, Technology Stack, Development Standards, Core Features.
2.  **Review Files:** Read the relevant sections in each specified file.
3.  **Compare:** Note any discrepancies, inconsistencies, or outdated information between the files.
4.  **Report:** Present a summary of findings to the user, highlighting specific areas of misalignment or confirming consistency.

---

## Workflow: Create Dev Journal Entry

**Trigger:** User request to create a new development journal entry, typically after a significant work session or decision point.

**Objective:** Capture key decisions, work performed, code changes, learnings, and next steps in a dated journal file.

**Key Files Involved:**

1.  **New Journal File:** `dev-journal/YYYY-MM-DD-brief-topic.md` (To be created).
2.  **Journal Summary:** `.cascade/dev-journal-summary.md` (To be updated; create if not present).

**Procedure:**

1.  **Determine Topic & Date:** Confirm the main topic/theme for the journal entry with the user. Use the current date (YYYY-MM-DD format).
2.  **Generate Filename:** Construct the filename: `dev-journal/YYYY-MM-DD-brief-topic.md`. Use a 2-4 word hyphenated topic based on step 1.
    *   *Action:* Confirm filename with user before proceeding.
3.  **Gather Context:** Review the recent conversation history (work done, code changes, discussions, decisions, blockers, next steps).
4.  **Draft Content:** Create the content for the new journal entry. Include sections like:
    *   Summary of Work
    *   Key Decisions Made
    *   Code Changes (links or brief descriptions)
    *   Challenges/Blockers Encountered
    *   Learnings/Observations
    *   Next Steps
5.  **Create File:** Write the drafted content to the new journal file.
    *   *Action:* Use `write_to_file` tool.
6.  **Update Summary:** Append a brief summary (1-2 sentences) and a link to the new journal entry in `.cascade/dev-journal-summary.md`. If the file doesn't exist, create it with the summary.
    *   *Action:* Use `edit_file` tool (or `write_to_file` if creating).
7.  **Confirmation:** Inform the user the journal entry and summary have been updated/created.
8.  **Commit:** Stage and commit the new journal file **and** the updated summary file.
    *   *Action:* Use `run_command` for `git add` and `git commit`.

---

*(More workflows to be added as needed)*
