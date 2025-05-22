# Workflow: Detailed Git Commit Generation

## Objective
To assist in generating comprehensive and context-rich Git commit messages by analyzing recent code changes and relevant project documentation. This workflow is triggered when you need to consolidate multiple unstaged or uncommitted changes into a well-documented commit.

## Core Context Files (MUST READ)
*   All files within the `/Users/riccardopirruccio/opt/resume-lm/memory-bank/` directory. Pay special attention to `activeContext.md` and `progress.md` for the most recent activities and context.

## Pre-Checks for Cline
1.  **Check for Merge Conflicts:** Execute `git status`. If it reports any unresolved merge conflicts, inform the user immediately. State that conflicts must be resolved before proceeding with this workflow. Pause or terminate until conflicts are cleared.
2.  **Check Branch Status (Detached HEAD):** Execute `git branch --show-current`. If it does not show a branch name (indicating a detached HEAD state), inform the user. Advise them to check out an existing branch or create a new one before committing. Pause or terminate until on a valid branch.
3.  **Check for Existing Changes:** Execute `git status --porcelain`. If there is no output, inform the user that there are no changes to commit and conclude the workflow.

## Instructions for Cline
1.  **Read Memory Bank:** As per standard procedure (and `.clinerules/memory-bank.md`), read ALL markdown files within `/Users/riccardopirruccio/opt/resume-lm/memory-bank/` to understand the latest project state, ongoing tasks, and recent decisions.
2.  **List Changed Files:** Execute `git status --porcelain` in the terminal. This will provide a concise list of all modified, new, or deleted files.
3.  **Review Unstaged Changes:** Execute `git diff HEAD` in the terminal. This will show all changes in your working directory that have not yet been staged, compared to the last commit.
4.  **Review Staged Changes:** Execute `git diff --staged` in the terminal. This will show all changes that are currently staged for commit.
5.  **Synthesize Changes & Context:**
    *   Carefully analyze the output from `git status --porcelain`, `git diff HEAD`, and `git diff --staged`.
    *   **Handling Large Diffs:** If diffs are excessively large (e.g., thousands of lines), summarize the types of changes (e.g., "Widespread formatting changes across 50 files," "Added large binary asset X.png") rather than analyzing every line. Focus on file names and the Memory Bank context to infer the purpose.
    *   **Binary Files:** Note if binary files (images, PDFs, etc.) are part of the changes, as their diffs are not human-readable.
    *   Correlate these code changes with the information gathered from the Memory Bank, particularly `activeContext.md` (for current work focus, recent changes) and `progress.md` (for what's being built/refined).
    *   Identify the primary features implemented, bugs fixed, refactorings performed, or documentation updated.
    *   Note any significant decisions, learnings, or problem resolutions from `activeContext.md` that are directly reflected in the code changes.
    *   **Memory Bank Discrepancies:** If the Memory Bank context seems outdated or misaligned with code changes, note this when presenting the draft commit message (e.g., "The Memory Bank context for X seems a bit outdated compared to these changes. Based on the code, I've inferred Y. Please verify.").
    *   **Memory Bank File Changes:** If `memory-bank/` files themselves are part of the commit, plan to explicitly mention this (e.g., "docs: Update activeContext.md...").
6.  **Draft Commit Message:** Based on your synthesis, draft a detailed commit message. The message should ideally:
    *   Have a concise subject line (e.g., 50-72 characters).
    *   Be followed by a blank line.
    *   Have a more detailed body explaining the "what" and "why" of the changes. Bullet points can be used for clarity if multiple distinct changes are grouped.
    *   Reference relevant tasks, issues, or user stories if apparent from the context.
    *   (Optional, if applicable to project conventions) Use Conventional Commits prefixes (e.g., `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`).
7.  **Present Draft for Review:** Present the drafted commit message to the user for review, feedback, and any necessary revisions.
8.  **Offer to Commit (Optional):**
    *   Ask the user if they would like you to proceed with staging changes and committing with the approved message.
    *   **Selective Staging:** Clarify if they want to stage all current uncommitted changes (`git add .`) or if they prefer to stage specific files/hunks themselves. If selective, guide them to use `git add <file>` or `git add -p`, and wait for their confirmation that staging is complete.
    *   If the user confirms they are ready to commit (with changes appropriately staged):
        *   Execute `git commit -m "SUBJECT_LINE" -m "DETAILED_BODY_PARAGRAPH_1" -m "DETAILED_BODY_PARAGRAPH_2_ETC"`. (Note: For multi-line commit messages via CLI, each paragraph of the body is typically passed with another `-m` flag). Alternatively, prepare the full multi-line message and ask the user to paste it if they are committing manually or through a GUI.
    *   **Pre-commit Hooks:** Be aware that project pre-commit hooks might run. If the commit fails or files are modified by hooks, relay this information and any terminal output to the user.

**Note:** This workflow is for creating *new* commits. It is not designed for amending existing commits (e.g., `git commit --amend`).
