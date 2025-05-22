# Active Context: ResumeLM

## 1. Current Work Focus (as of 2025-05-21)

The most recent task was to **resolve an AI schema validation error** in the `formatJobListing` function. This was caused by the AI returning enum values with incorrect casing, unexpected types (e.g., array instead of string for `work_location`), or empty strings for enum fields.

Previously, the focus was on **removing enterprise limitations on resume creation** and **implementing client-side ID generation & professional summary integration.**

The LangGraph backend planning continues in parallel.

## 2. Recent Changes & Resolutions

*   **AI Schema Validation Fix for Enums, Types, and Empty Strings (Completed 2025-05-21):**
    *   **Problem:** The `formatJobListing` function in `src/utils/actions/jobs/ai.ts` was throwing a "No object generated: response did not match schema" error. This was due to the AI returning:
        *   Capitalized enum values (e.g., "Hybrid", "Contract") for `work_location` and `employment_type`.
        *   An array for `work_location` (e.g., `["HYBRID"]`) instead of a string.
        *   "CONTRACTOR" for `employment_type` instead of "contract".
        *   Empty strings (`""`) for `work_location` or `employment_type`, which failed enum validation.
    *   **Solution (`src/lib/zod-schemas.ts`):**
        *   Refined the `z.preprocess()` logic in `simplifiedJobSchema` for `work_location` and `employment_type`:
            *   For `work_location`: If an array is received, the first element is taken. If the processed value (or original string) is empty after trimming, it's converted to `null`. Otherwise, it's lowercased. This `null` or lowercased string is then passed to the enum validation, which is combined with `.nullable().optional()`.
            *   For `employment_type`: If the string value is empty after trimming, it's converted to `null`. "contractor" is mapped to "contract". Other non-empty strings are lowercased. This `null` or processed string is then passed to the enum validation, which is also combined with `.nullable().optional()`.
    *   **Outcome:** The schema validation in `formatJobListing` is now significantly more robust, handling various AI output quirks including empty strings, casing, "contractor" variations, and array inputs for `work_location`.

*   **Enterprise Limitations Removal (Completed 2025-05-21):**
    *   **Problem:** Users were hitting limits on the number of base and tailored resumes.
    *   **Solution (`src/app/page.tsx`):** Set `canCreateBase` and `canCreateTailored` to `true` unconditionally.
    *   **Outcome:** Unlimited resume creation.

*   **Client-Side ID Generation & Professional Summary Integration (Completed 2025-05-21):**
    *   **Problem:** "Unique key prop" errors and missing professional summary integration.
    *   **Solution:**
        1.  **Utility Function (`src/utils/data-transformation.ts`):** Created `addClientSideIdsToAiResumeOutput` function. This function takes the raw AI output (conforming to `simplifiedResumeSchema`) and:
            *   Adds unique UUIDs to each main section item (work experience, projects, skills, education).
            *   Transforms string arrays for descriptions/items (e.g., `work_experience.description: string[]`) into arrays of `DescriptionPoint` objects (`{ id: string, content: string }`), each with a unique UUID.
            *   Ensures `professional_summary` and `target_role` are passed through.
            *   Handles potential undefined optional fields (e.g., `field`, `date` in education) by providing default empty strings to match frontend type requirements.
        2.  **Integration in Dialog (`src/components/resume/management/dialogs/create-tailored-resume-dialog.tsx`):**
            *   The `addClientSideIdsToAiResumeOutput` function is now called after `tailorResumeToJob` to process its output.
            *   The processed, ID-enriched content is then passed to the `createTailoredResume` server action.
        3.  **Server Action Update (`src/utils/actions/resumes/actions.ts`):**
            *   The `createTailoredResume` server action's `tailoredContent` parameter type was updated from `z.infer<typeof simplifiedResumeSchema>` to `ProcessedAIContent` (the output type of the new utility function). This ensures the action expects and correctly saves the ID-enriched data (including `professional_summary`) to the database.
    *   **Outcome:**
        *   Client-side ID generation is now implemented for AI-tailored resumes.
        *   "Unique key prop" errors should be resolved.
        *   AI-generated professional summaries are expected to be correctly processed and saved.
        *   Data stored in the database for tailored resume sections now includes the necessary `id` fields for frontend rendering and DND.

*   **AI Professional Summary Generation (Vercel AI SDK - Setup Prior to ID Generation Task):**
    *   **Strategy Shift:** Leveraged Vercel AI SDK for immediate summary generation.
    *   **Schema Update (`src/lib/zod-schemas.ts`):** `professional_summary` added to `simplifiedResumeSchema`.
    *   **Prompt Engineering (`src/lib/prompts.ts`):** `TAILORED_RESUME_GENERATOR_SYSTEM_MESSAGE` updated for summary generation.
*   **New Cline Rule (`.clinerules/development-strategy.md` created 2025-05-21):**
    *   Documents the strategy of using Vercel AI SDK for immediate frontend AI feature enhancements (like summary generation) while the LangGraph backend is developed separately.
    *   Outlines future refactoring of the frontend to use LangGraph once it's ready.
*   **Architectural Shift for Resume Tailoring (LangGraph Backend - Planning Phase, ongoing since 2025-05-18):**
    *   **Decision:** A decision was made to develop a new LangGraph-based cognitive agent backend (Python, Docker, Resume-Matcher) to eventually replace the Vercel AI SDK approach for the tailored resume feature. This is driven by the need for more sophisticated tailoring, integrated ATS optimization, STAR methodology enforcement, and human-in-the-loop capabilities.
    *   **New Directories Created:**
        *   `langgraph-api/` in the project root (as a placeholder for future backend code).
        *   `memory-bank/langgraph-backend/` for dedicated documentation of the new backend.
    *   **Initial LangGraph Backend Documentation:** Core Memory Bank files and detailed architecture documents for the supervisor graph and all subgraphs have been created within `memory-bank/langgraph-backend/`.
*   **Root Memory Bank Updates (In Progress):** Updates to the main `memory-bank/*.md` files are underway to reflect the LangGraph backend architecture and the current Vercel AI SDK enhancement strategy.
*   **Data Migration for JSONB Fields (2025-05-20):**
    *   **Resolution:** Successfully executed a data migration script on the Supabase database.
    *   **Purpose:** To align existing data in `work_experience` and `projects` JSONB columns (in `profiles` and `resumes` tables) with new frontend TypeScript types (`src/lib/types.ts`).
    *   **Changes Made by Script:**
        *   Added unique `id` (UUID) to each work experience and project item.
        *   Transformed `description` string arrays into arrays of `DescriptionPoint` objects (each with `id` and `content`).
    *   **Outcome:** This resolved:
        *   "Unique key prop" errors in `WorkExperienceFormComponent` and `ProjectsFormComponent` related to `dnd-kit`'s `SortableContext`.
        *   PDF rendering issues where bullet point content was missing.
        *   Drag-and-drop functionality for description points is now working.
*   **Skills Form "Unique Key Prop" Error Resolution & DND Implementation (2025-05-20):**
    *   **Problem:** "Unique key prop" error in `SkillsForm.tsx` and subsequent PDF rendering error after attempting to fix it.
    *   **Resolution:**
        1.  Migrated `skills` data in Supabase for the affected resume (`87ca22e0-cd91-4613-84ed-9af34ab63d4f`) to add unique `id`s to skill categories and transform skill items into `DescriptionPoint`-like objects (`{ id: string, content: string }`).
        2.  Updated `src/components/resume/editor/preview/resume-pdf-document.tsx` to correctly access `item.content` for skill items in PDF rendering.
        3.  Updated the `Skill` interface in `src/lib/types.ts` to define `items` as `DescriptionPoint[]`.
        4.  Refactored `src/components/resume/editor/forms/components/sortable-skill-category-card.tsx` and `src/components/resume/editor/forms/skills-form.tsx` to align with the new `Skill` type structure.
    *   **Outcome:** Resolved the "unique key prop" error and PDF rendering issues. DND for skill categories and individual skills within categories is now functional.
*   **Education Form DND Implementation (2025-05-20):**
    *   Created `src/components/resume/editor/forms/components/sortable-education-card.tsx` for individual sortable education entries.
    *   Refactored `src/components/resume/editor/forms/education-form.tsx` to use `SortableEducationCard` and implement DND for reordering education cards.
    *   DND for individual "Key Achievements/Coursework" items within education cards is **deferred** for now.
*   **Professional Summary Section UI & Manual Editing Implementation (2025-05-20):**
    *   Added `professional_summary?: string | null;` to the `Resume` interface in `src/lib/types.ts`.
    *   Added `summary_margin_top`, `summary_margin_bottom`, `summary_margin_horizontal` to `DocumentSettings` interface in `src/lib/types.ts`.
    *   Created `src/components/resume/editor/forms/summary-form.tsx` for editing the summary.
    *   Integrated `SummaryForm` into `src/components/resume/editor/panels/editor-panel.tsx`.
    *   Added a "Summary" tab to `src/components/resume/editor/header/resume-editor-tabs.tsx`.
    *   Updated `src/components/resume/editor/preview/resume-pdf-document.tsx` to render the professional summary, including new styles and visibility checks.
*   **Professional Summary Section UI Enhancements & Fixes (2025-05-21):**
    *   **Type Definition Update (`src/lib/types.ts`):** Added `summary_show_header?: boolean;` to the `DocumentSettings` interface.
    *   **Layout Tab UI (`src/components/resume/editor/forms/document-settings-form.tsx`):**
        *   Added default values for `summary_show_header: true` and summary margins.
        *   Implemented UI controls for summary title visibility and margins.
    *   **PDF Rendering Logic (`src/components/resume/editor/preview/resume-pdf-document.tsx`):**
        *   Updated to respect `summary_show_header` for the entire summary section visibility.
    *   **Live Preview Fix (`src/components/resume/editor/preview/resume-preview.tsx`):**
        *   Included `resume.professional_summary` in `generateResumeHash`.
*   **Location Rendering Fix in PDF (2025-05-21):**
    *   **Problem:** The `location` field for entries in the Work Experience and Education sections was not rendering correctly (showing `[object Object]` for work experience) or with the desired layout/styling in the PDF.
    *   **Resolution (`src/components/resume/editor/preview/resume-pdf-document.tsx`):**
        *   **Work Experience:** Modified `ExperienceSection` to render `experience.location` on the same line as the company name, separated by a comma. Both company and location now use the `styles.jobTitle` (regular weight, standard text color) to ensure consistency and correct rendering, resolving the `[object Object]` issue by properly handling `processText` output as JSX children.
        *   **Education:** Modified `EducationSection` to render `Degree Field` as the primary bold line (using `styles.schoolName`), followed by `School Name, Location` on the next line using a consistent regular weight style (`styles.degree`). This aligns the education location rendering with the work experience approach for same-line display with its primary institution name.
        *   The previously added `locationText` style was removed as existing styles (`styles.jobTitle`, `styles.degree`) are now used for location rendering to maintain color and font weight consistency.
    *   **Outcome:** Location data for work experience and education entries now correctly renders in the PDF.
*   **Frontend Type Definitions Update (Prior to 2025-05-20):** (Details about `id` and `DescriptionPoint` updates).

**(Previous changes below this point are historical context)**
*   (Summarized TDD, Gemini API, AI Output, Content Refinement iterations)

## 3. Current Status & Next Steps

*   **Status:**
    *   **AI Professional Summary (Vercel AI SDK):**
        *   Development strategy updated to use Vercel AI SDK for immediate implementation.
        *   `simplifiedResumeSchema` in `src/lib/zod-schemas.ts` updated to include `professional_summary`.
        *   System prompt `TAILORED_RESUME_GENERATOR_SYSTEM_MESSAGE` in `src/lib/prompts.ts` updated to instruct AI to generate summary.
        *   Client-side action `tailorResumeToJob` in `src/utils/actions/jobs/ai.ts` already passes full resume context.
    *   UI bugs related to `id` fields and `DescriptionPoint` are **resolved**.
    *   Data in Supabase (`work_experience`, `projects`, `skills`) has been migrated.
    *   DND functionality is implemented for major sections.
    *   Manual Professional Summary section UI and PDF rendering are functional.
    *   Location Rendering in PDF is fixed.
    *   The LangGraph backend planning continues in parallel.
    *   **Next Steps:**
        1.  **Testing & Refinement:**
            *   Thoroughly test the "create new tailored resume" feature end-to-end to ensure the schema validation fix works, unlimited creation is active, and ID generation/summary features function as intended.
            *   Verify "unique key prop" errors remain resolved.
            *   Confirm professional summary and all sections render correctly.
            *   Check DND functionality.
        2.  **Memory Bank Documentation:** Update `activeContext.md` (this file) and `progress.md` to reflect the schema validation fix. (Current step)
*   **Next Steps (General & LangGraph):**
    *   Verify DND functionality for the "Professional Summary" section in `EditorPanel`.
    *   Ensure default `section_configs` for `professional_summary` are handled.
    *   **Deferred Task:** DND for "Key Achievements/Coursework" within education cards.
    *   Continue LangGraph backend documentation and planning.

## 4. Active Decisions & Considerations

*   **Development Strategy (.clinerules/development-strategy.md):** Frontend AI features (like summary generation) will use Vercel AI SDK for now. LangGraph backend development is parallel and for future integration.
*   **LangGraph Architecture:** Commitment to LangGraph for future advanced tailoring remains.
*   (Other existing considerations like Schema Consistency, Impact on TDD tests, etc., remain relevant).

## 5. Learnings & Project Insights

*   (Existing learnings remain relevant).
*   **Decoupled Development:** The new strategy allows for faster iteration on frontend AI features while the more complex backend is built.
