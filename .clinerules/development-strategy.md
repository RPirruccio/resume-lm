## Brief overview
These rules outline the current development strategy for the ResumeLM project, specifically concerning the separation of frontend and backend work for AI-powered features. This is a project-specific guideline.

## Frontend Development (AI Features)
  - **Current Approach:** For new AI-driven features or enhancements (like AI-generated professional summaries), the frontend will initially leverage and expand the existing Vercel AI SDK integration.
  - **Rationale:** This allows for rapid feature development and utilization of existing client-side logic while the more advanced LangGraph backend is under separate development.
  - **Example:** If adding AI summary generation, the client-side code (`src/utils/actions/jobs/ai.ts` or similar) will be refactored to include prompts and logic for summary generation via the Vercel AI SDK.

## Backend Development (LangGraph)
  - **Independent Development:** The LangGraph-based cognitive agent backend will be developed independently and in parallel with frontend enhancements.
  - **Future Integration:** Once the LangGraph backend is complete and robust, the frontend will be refactored to integrate with it, replacing the temporary Vercel AI SDK-based solutions for those specific features.
  - **Clear Transition:** The transition from Vercel AI SDK to the LangGraph backend for specific features will be a distinct and planned step.

## General Workflow
  - **Decoupling:** Frontend and backend AI feature development are decoupled for the time being to allow for progress on both fronts.
  - **Memory Bank:** This strategy should be reflected in `activeContext.md` and `progress.md` in the Memory Bank.
