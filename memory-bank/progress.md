# Project Progress: ResumeLM

## 1. Current Project Status (as of 2025-05-12, late evening update)

The ResumeLM project is in an active development phase. Core functionalities around AI-powered resume generation and tailoring are being implemented and refined. The backend infrastructure with Supabase is set up, and the frontend is built with Next.js and Shadcn UI. Recent efforts have successfully established a working Test-Driven Development (TDD) environment for the AI resume tailoring feature.

## 2. What Works

*   **User Authentication:** Users can sign up and log in via Supabase Auth.
*   **Basic Profile Management:** Users can input and save their basic profile information.
*   **Database Schema:** Core tables (`profiles`, `resumes`, `subscriptions`, `jobs`) are defined. Migrations are used for schema changes.
*   **AI Model Integration:**
    *   The system can connect to various AI models (OpenAI, Anthropic, Gemini) via the Vercel AI SDK.
    *   API key management UI and model selection UI are in place.
*   **AI Resume Tailoring (TDD Environment):**
    *   The `tailorResumeToJob` action in `src/utils/actions/jobs/ai.ts` is successfully tested via `tests/ai.test.ts`.
    *   The test passes, confirming that the AI (Gemini `gemini-2.5-pro-preview-05-06`) generates a resume object matching `simplifiedResumeSchema`.
    *   **Content Quality Refinements (2025-05-12, late evening):**
        *   Prompts in `TAILORED_RESUME_GENERATOR_SYSTEM_MESSAGE` were iteratively updated to address "robotic tone," conciseness for less relevant roles, and skills section relevance.
        *   Specific instructions were added to vary sentence openings and avoid overusing "To [verb]..." patterns for descriptions.
        *   Instructions for 1-2 concise, soft-skill-focused bullet points for less relevant roles were clarified.
        *   A new "Skills Section Optimization & Relevance Matching" objective was added to guide the AI in selecting and prioritizing skills based on job description alignment and conciseness.
        *   Latest test runs confirm these changes improved sentence variety, adherence to conciseness requirements for descriptions, and resulted in a more focused skills section.
*   **PDF Generation:**
    *   The `ResumePDFDocument` component can render resume data into a PDF and has been made more robust against `undefined` data from AI.
*   **Core UI Components:** Many UI components for forms, layout, and resume display are in place.
*   **TDD Setup:**
    *   Jest, `ts-jest`, and `dotenv` are installed and configured.
    *   `jest.config.js` is configured for ESM and `ts-jest`.
    *   `jest.setup.js` loads environment variables from `.env.test`.
    *   `pnpm` is installed and used for test execution.

## 3. What's Left to Build / Refine

*   **LLM-Generated Content Quality & Relevance (Ongoing Refinement):**
    *   **STAR Method & Narrative Flow:** Continue to monitor and ensure each bullet point in "Experience" and "Projects" descriptions is a complete STAR statement, presented as a smooth narrative without explicit labels, and with varied sentence structure.
    *   **Work Experience Relevance Handling:** Ensure consistent application of tailoring for hard skills (relevant roles) vs. concise soft skills (less relevant roles, 1-2 bullets).
    *   **Skills Section Relevance:** Monitor and ensure the skills section remains concise and focused on job description alignment.
    *   **Project Relevance Handling (User-Configurable):** This is a pending item.
    *   **Bolding Strategy:** Ensure consistent application of the selective bolding strategy.
*   **Professional Summary Generation:** Determine and implement a strategy for generating the `professional_summary`.
*   **Contact Information Integration:** Implement logic to merge AI-generated tailored sections with the base resume's contact information.
*   **Full Resume Editing Experience:** Thorough testing and potential enhancement of CRUD operations and interactive editing for all resume sections.
*   **Job Listings Feature:** Full implementation and testing of the `jobs` table integration, UI for managing job listings, and their use in tailoring. Clarify `jobs` table DDL discrepancies.
*   **Cover Letter Feature:** Future consideration.
*   **Comprehensive Testing (Expanding TDD):**
    *   Add more diverse test cases to `tests/ai.test.ts` (different job descriptions, resume inputs, edge cases).
    *   End-to-end user flow testing.
    *   UI interaction and form submission testing.
*   **Design System Polish:** Consistent application of "Soft Gradient Minimalism."
*   **Error Handling and User Feedback:** Improve global error handling and user feedback.
*   **Subscription Management:** Full integration and testing with Stripe.

## 4. Known Issues & Areas for Investigation

*   **LLM Content Quality & Relevance:** This remains the primary area for AI-related investigation. Current focus is on ensuring the latest prompt changes consistently deliver desired tone and structure across various inputs.
*   **Zod Schema vs. TypeScript Type Discrepancies:** Ongoing consideration for differences between optional Zod fields and non-optional TS types.
*   **`jobs` Table Definition:** Minor discrepancies in DDL details need to be aligned with the actual schema.
*   **ESLint `require()` errors in `jest.setup.js`:** While not blocking test execution, these should be addressed for code consistency if possible (e.g., by configuring ESLint to allow `require` in `.js` files or finding an alternative way to load `dotenv` that Jest's ESM setup prefers).

## 5. Evolution of Project Decisions

*   **AI Model for Tailoring:** Shifted from Claude Sonnet to Google Gemini Pro (`gemini-2.5-pro-preview-05-06` for TDD) due to token limits and schema support.
*   **PDF Generation Robustness:** Iteratively improved to handle optional/missing AI-generated data.
*   **TDD for AI:** Successfully established a working test for `tailorResumeToJob`. Resolved timeout, ESM, and API schema compatibility issues.
*   **Zod Schema for AI Guidance:** Refined schemas by making fields non-optional and adding descriptions, significantly improving the structure of AI output.
*   **Focus Shift:** Moved from initial TDD setup and API error resolution to focusing on the quality and relevance of AI-generated content and further test expansion.
*   **Content Refinement Strategy (2025-05-12, late evening update):** Iteratively refined `TAILORED_RESUME_GENERATOR_SYSTEM_MESSAGE`. Added instructions to improve narrative flow by varying sentence openings (reducing "To [verb]..." pattern), ensure conciseness for less relevant roles, and optimize the skills section for relevance and brevity. Test results confirm these improvements.

This document will be updated regularly to reflect the project's progress, new challenges, and evolving solutions.
