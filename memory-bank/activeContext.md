# Active Context: ResumeLM

## 1. Current Work Focus (as of 2025-05-12, late evening update)

The primary focus remains on **refining AI-generated content quality**. Following user feedback, specific objectives addressed include:
*   **Reducing Robotic Tone in Descriptions:** Modifying prompts to encourage varied sentence structures and vocabulary, especially avoiding repetitive sentence openings like "To [verb]...".
*   **Conciseness for Less Relevant Roles:** Ensuring bullet points for less relevant work experiences are shorter (1-2 points) and focus on transferable soft skills, while still adhering to the implicit STAR narrative.
*   **Skills Section Optimization:** Adding new prompt instructions to guide the AI in selecting and prioritizing skills based on direct matches with the job description and overall relevance, aiming for a concise yet impactful skills section.
*   Maintaining the implicit STAR method (narrative STAR statements without explicit labels) for descriptions.
*   Maintaining the refined bolding strategy (no bolding for individual skills, sparse bolding in descriptions, bolding for dedicated tech lists in projects).
This involves iterative prompt engineering in `TAILORED_RESUME_GENERATOR_SYSTEM_MESSAGE` within `src/lib/prompts.ts` and testing via `pnpm test`.

## 2. Recent Changes & Resolutions

*   **TDD Test Environment Stabilization:**
    *   **Jest Timeout:** Increased Jest timeout in `tests/ai.test.ts` from 90s to 180s, resolving previous timeout issues with the Gemini API call.
    *   **ES Module Handling:** Configured `jest.config.js` (`transform` with `useESM: true` for `ts-jest`, and `extensionsToTreatAsEsm: ['.ts']`) to correctly handle ES Modules in test files. Reverted `jest.setup.js` to use `require` to avoid initial loading errors.
    *   **pnpm Installation:** Installed `pnpm` globally to allow test execution with `pnpm test`.
*   **Gemini API Schema Error (`AI_APICallError`):**
    *   Identified that Gemini's `response_schema` does not support `format: 'url'` for string types.
    *   Resolved by removing `.url()` validation from `url` and `github_url` fields in `projectSchema` within `src/lib/zod-schemas.ts` and relying on `.describe()` for guidance.
*   **AI Output Structure Improvement:**
    *   Modified `simplifiedResumeSchema` and its constituent schemas (`workExperienceSchema`, `educationSchema`, `projectSchema`, `skillSchema`) in `src/lib/zod-schemas.ts`.
    *   Made key fields non-optional (e.g., `company`, `position`, `description` in `workExperienceSchema`).
    *   Made main section arrays (`work_experience`, `education`, `skills`, `projects`) required in `simplifiedResumeSchema`.
    *   Added detailed `.describe()` calls to fields to provide better context to the LLM.
    *   This resulted in the `tests/ai.test.ts` passing, with the AI generating all expected sections and fields.
*   **Initial TDD Setup (Previous):**
    *   Installed Jest, `ts-jest`, `dotenv`.
    *   Configured `jest.config.js`, `jest.setup.js`, `.env.test`.
    *   Created `tests/ai.test.ts` and `tests/sample-base-resume.ts`.
    *   Addressed initial module resolution issues.
*   **Database Schema Mismatch (`jobs` table):** (Previous) Resolved.
*   **`AI_NoObjectGeneratedError` (Claude Sonnet):** (Previous) Resolved by switching to Gemini.
*   **Client-Side PDF Errors:** (Previous) Resolved.
*   **Content Refinement Iteration (2025-05-12, evening):**
    *   **Problem:** Initial prompt refinements (for varied sentence structure and conciseness) still resulted in a "robotic" tone, particularly with many bullet points starting with "To [verb]...".
    *   **Solution (Tone & Sentence Openings):** Further refined `TAILORED_RESUME_GENERATOR_SYSTEM_MESSAGE` in `src/lib/prompts.ts` with a more explicit instruction: "**Critically, avoid starting a majority of bullet points with infinitive phrases like 'To [verb]...' or 'In order to...'.** Instead, begin sentences by directly stating an action, highlighting a result, or describing the context/challenge more dynamically."
    *   **Outcome (Tone & Sentence Openings):** `pnpm test` confirmed this change successfully reduced the "To..." pattern and improved sentence opening variety.
    *   **Solution (Skills Section):** Added a new "Skills Section Optimization & Relevance Matching" objective (Objective 6) to `TAILORED_RESUME_GENERATOR_SYSTEM_MESSAGE`. This instructs the AI to analyze job description keywords, prioritize direct skill matches, selectively include highly relevant supporting skills, and aim for a concise, focused skills section while maintaining logical categorization.
    *   **Outcome (Skills Section):** `pnpm test` showed the AI produced a more targeted skills section, omitting less relevant categories and prioritizing skills aligned with the job description.
*   **New Content Requirements Defined (2025-05-12, initial, now largely addressed or refined):**
    *   Each bullet point in "Experience" and "Projects" descriptions must be a complete STAR statement, **presented as a smooth narrative without explicit "Situation:", "Task:", "Action:", "Result:" labels.** (Achieved)
    *   All work experiences from the base resume must be included; AI to focus on hard skills for relevant positions and transferable soft skills (still using the implicit STAR narrative) for less relevant positions (now refined to 1-2 concise bullets). (Achieved)
    *   User should have an option for AI to include all projects or select and tailor only the most relevant ones. (Project relevance handling is still an open item for user configuration).
    *   **Refined Bolding Strategy (2025-05-12):**
        *   Individual skill items in the 'Skills' section should NOT be bolded.
        *   Narrative descriptions for 'Work Experience' and 'Projects' should NOT be entirely bolded.
        *   Within these descriptions, bolding should be used SPARINGLY for:
            *   Specific, key technologies/tools when directly mentioned in an action.
            *   Specific, quantifiable metrics or very significant, named achievements.
        *   Dedicated 'Technologies Used' lists for projects CAN have their items bolded.

## 3. Current Status & Next Steps

*   **TDD Test Passing:** The `tailorResumeToJob` test in `tests/ai.test.ts` passes. The AI output reflects the latest prompt refinements regarding tone, sentence structure, conciseness for descriptions, and skills section relevance.
*   **Memory Bank Update:** This update is currently in progress.
*   **Next Steps (Confirming Satisfaction & Broader AI Content Refinement):**
    1.  Await user confirmation that the current AI output quality (tone, variety, conciseness for descriptions, and skills section relevance) is satisfactory.
    2.  If further refinements are needed, continue iterative prompt engineering and TDD.
    3.  Address other pending AI content tasks:
        *   Strategy for `professional_summary` generation.
        *   Logic for merging AI-tailored sections with base resume contact info.
        *   Guidance for AI on project inclusion based on relevance (pending user configuration strategy).
    4.  Expand Test Cases: Add more diverse test cases to `tests/ai.test.ts`.

## 4. Active Decisions & Considerations

*   **TDD for AI Functions:** Successfully established and utilized a working TDD cycle for `tailorResumeToJob`.
*   **LLM Prompt Engineering for Skills:** Added specific instructions for skills selection and prioritization based on job description relevance, aiming for conciseness.
*   **Zod Schema for AI Guidance:** Using detailed Zod schemas with non-optional fields and descriptions is effective in guiding LLM output structure.
*   **Specific Gemini Model for Testing:** `gemini-2.5-pro-preview-05-06` is performing well for structured output with the Vercel AI SDK.
*   **Gemini API Schema Limitations:** Aware that Gemini's `response_schema` has specific constraints on string formats (e.g., no `url` format).
*   **LLM Prompt Engineering:** Remains key for content quality, even if structure is good. This is the primary focus for implementing the new content requirements, including the refined bolding rules.
*   **Prioritization of Solutions:** Prioritizing prompt engineering and schema description adjustments as the first-line approach for new content requirements before considering more complex solutions like section-by-section API calls.
*   **Conditional AI Logic:** New AI prompting will need to handle conditional logic: assessing relevance of experience/projects and tailoring output strategy (hard skills vs. soft skills, inclusion/exclusion) accordingly.

## 5. Learnings & Project Insights

*   **Schema Strictness for LLMs:** Making fields non-optional and providing clear descriptions in Zod schemas significantly improves the reliability of structured LLM output.
*   **Iterative TDD for AI:** The cycle of testing, analyzing output, and refining schemas/prompts is effective for developing AI-driven features.
*   **Jest ESM Configuration:** Requires careful setup of `jest.config.js` (transform options, `extensionsToTreatAsEsm`) for `ts-jest`.
*   LLM API calls in tests can be time-consuming.
*   AI model limitations (token counts, schema support) are critical factors.
*   Clear documentation (Memory Bank) is vital.
*   Incorporating user feedback on AI output quality early in the TDD cycle is crucial for aligning with practical needs and refining requirements effectively.
