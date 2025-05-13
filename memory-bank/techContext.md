# Technical Context: ResumeLM

## 1. Core Technologies

*   **Frontend Framework:** Next.js 15 (using App Router)
*   **UI Library:** React 19
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **UI Components:** Shadcn UI
*   **Backend & Database:** Supabase (PostgreSQL, Auth)
*   **AI Integration:** Vercel AI SDK
*   **PDF Generation:** `@react-pdf/renderer`

## 2. Development Environment & Setup

*   **Package Manager:** The project uses `pnpm` (inferred from `pnpm-lock.yaml`).
*   **Node.js:** Required for Next.js development. Specific version might be managed by a tool like `nvm` or defined in `.npmrc` (though `.npmrc` content is not currently known).
*   **Linting/Formatting:** ESLint (from `eslint.config.mjs`) and Prettier (commonly used with Next.js/Tailwind projects, though no explicit Prettier config file is visible at the root). Auto-formatting is active in the user's environment.
*   **Supabase CLI:** Likely used for local development, database migrations, and managing Supabase projects.
*   **Git:** For version control.

## 3. Key Dependencies & Libraries (Inferred & Known)

*   **`next`:** Core Next.js framework.
*   **`react`, `react-dom`:** Core React libraries.
*   **`tailwindcss`:** Utility-first CSS framework.
*   **`@radix-ui/*`:** Primitives used by Shadcn UI.
*   **`lucide-react`:** Icon library often used with Shadcn UI.
*   **`zod`:** Schema declaration and validation, used for AI model outputs and form validation.
*   **`@supabase/supabase-js`:** Official Supabase client library.
*   **`ai` (Vercel AI SDK):** For interacting with various LLMs.
*   **`@react-pdf/renderer`:** For client-side PDF generation.
*   **`typescript`:** TypeScript compiler and language support.
*   **`eslint`:** Linter.
*   **`postcss`:** CSS processing (used by Tailwind CSS).

## 4. Technical Constraints & Considerations

*   **AI Model Token Limits:** Different AI models have varying input and output token limits. This was a factor in the `AI_NoObjectGeneratedError` and required setting appropriate `maxTokens` for Gemini.
*   **Optional Data from AI:** AI-generated content (based on Zod schemas with `.optional()` fields) can lead to `undefined` values. Frontend components, especially those rendering this data (like the PDF generator), must be robust against such cases.
*   **Client-Side PDF Generation:** While flexible, client-side PDF generation can be resource-intensive for very large or complex resumes. Performance should be monitored.
*   **Supabase Rate Limits/Quotas:** Free or lower-tier Supabase plans might have rate limits or quotas that could affect scalability if not managed.
*   **API Key Security:** API keys for AI services must be securely managed (e.g., using environment variables, not hardcoded). The `api-keys-form.tsx` component suggests user-provided API keys.
*   **Cold Starts (Serverless Functions):** If using serverless functions for AI interactions or other backend logic, cold starts could impact perceived performance.
*   **Database Migrations:** Supabase migrations are used to manage database schema changes (e.g., `20250512174528_align_jobs_table.sql`).

## 5. Tool Usage Patterns

*   **Vercel AI SDK (`generateObject`):** Used in `src/utils/actions/jobs/ai.ts` (`tailorResumeToJob`) to get structured JSON output from LLMs based on Zod schemas.
*   **Supabase Client:** Used for database interactions (CRUD operations) and authentication.
*   **Shadcn UI CLI:** Likely used to add new UI components to the project.
*   **React Hooks:** Extensively used for state management (`useState`, `useCallback`, `useMemo`, `useEffect`) and custom logic (`useTextProcessor`, `useToast`).
*   **Server Actions (Next.js):** Preferred way for client components to interact with server-side logic for data mutations and fetching.
*   **Zod Schemas:** Central to defining data structures for AI interactions (`simplifiedResumeSchema`), form validations, and type inference.

## 6. Design System Implementation ("Soft Gradient Minimalism")

*   **Tailwind CSS Configuration (`tailwind.config.ts`):** Defines custom colors, gradients, fonts, and animation timings to match the design system.
*   **Global Styles (`src/app/globals.css`):** May contain base styles, font imports, and background gradient definitions.
*   **Component Styling:** Achieved primarily through Tailwind utility classes applied directly in JSX, with some custom CSS for more complex effects (e.g., floating orbs, mesh overlays if implemented).
*   **Shadcn UI Theming:** Leverages CSS variables for theming, which can be customized in `globals.css`.

This document provides a snapshot of the technical context. It will be updated as new technologies are adopted or existing ones are modified.
