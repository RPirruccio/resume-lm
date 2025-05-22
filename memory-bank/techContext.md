# Technical Context: ResumeLM

## 1. Core Technologies

*   **Frontend Framework:** Next.js 15 (using App Router)
*   **UI Library:** React 19
*   **Language (Frontend):** TypeScript
*   **Styling:** Tailwind CSS
*   **UI Components:** Shadcn UI
*   **Backend & Database:** Supabase (PostgreSQL, Auth)
*   **Resume Tailoring AI Backend:** LangGraph, Python, Docker, Resume-Matcher
*   **AI Integration (Other Features / General):** Vercel AI SDK
*   **PDF Generation:** `@react-pdf/renderer`

## 2. Development Environment & Setup

*   **Package Manager (Frontend):** The project uses `pnpm` (inferred from `pnpm-lock.yaml`).
*   **Node.js (Frontend):** Required for Next.js development. Specific version might be managed by a tool like `nvm` or defined in `.npmrc`.
*   **Python Environment (Backend):** Python (3.9+), virtual environments (`venv`, Poetry, or Conda), package manager (`pip`, Poetry).
*   **Docker:** Docker Desktop for containerizing and running the LangGraph backend.
*   **Linting/Formatting (Frontend):** ESLint (from `eslint.config.mjs`) and Prettier. Auto-formatting is active.
*   **Linting/Formatting (Python Backend):** Black, Flake8, Ruff (to be decided).
*   **Supabase CLI:** Likely used for local development, database migrations, and managing Supabase projects.
*   **Git:** For version control.

## 3. Key Dependencies & Libraries (Inferred & Known)

**Frontend (Next.js):**
*   **`next`:** Core Next.js framework.
*   **`react`, `react-dom`:** Core React libraries.
*   **`tailwindcss`:** Utility-first CSS framework.
*   **`@radix-ui/*`:** Primitives used by Shadcn UI.
*   **`lucide-react`:** Icon library often used with Shadcn UI.
*   **`zod`:** Schema declaration and validation.
*   **`@supabase/supabase-js`:** Official Supabase client library.
*   **`ai` (Vercel AI SDK):** For interacting with LLMs for non-tailoring features.
*   **`@react-pdf/renderer`:** For client-side PDF generation.
*   **`typescript`:** TypeScript compiler and language support.
*   **`eslint`:** Linter.
*   **`postcss`:** CSS processing (used by Tailwind CSS).

**Backend (LangGraph - Python - Anticipated):**
*   **`langgraph`:** Core library for the agentic architecture.
*   **`langchain`:** Foundational components for LangGraph.
*   **`langchain-community`, `langchain-openai`, `langchain-google-genai`:** For LLM integrations within the graph.
*   **`resume-matcher`:** For ATS analysis.
*   **`fastapi` / `flask`:** Potential web framework for the API.
*   **`pydantic`:** For data validation and API models.
*   **`requests`, `beautifulsoup4`, `playwright`:** For web scraping job descriptions.

## 4. Technical Constraints & Considerations

*   **AI Model Token Limits (General):** Different AI models have varying input and output token limits.
*   **Optional Data from AI (General):** AI-generated content can lead to `undefined` values; frontend components must be robust.
*   **Client-Side PDF Generation:** Can be resource-intensive; performance monitoring is key.
*   **Supabase Rate Limits/Quotas:** Relevant for database interactions.
*   **API Key Security (General):** Secure management of all API keys (LLMs, etc.) is paramount.
*   **LangGraph Backend Specific Constraints:**
    *   **Performance of Graph Execution:** The multi-step LangGraph process for tailoring must meet the sub-60-second target.
    *   **State Management Complexity:** Managing the `ResumeState` effectively in LangGraph.
    *   **Inter-Service Communication:** Reliable and secure communication between the Next.js app and the LangGraph Docker container.
    *   **Resource Management for Docker Container:** CPU/memory for the Python service.
*   **Database Migrations:** Supabase migrations manage database schema.

## 5. Tool Usage Patterns

*   **Vercel AI SDK (`generateObject`):** May still be used for AI features other than resume tailoring (e.g., simpler content suggestions if any). Its role in `src/utils/actions/jobs/ai.ts` (`tailorResumeToJob`) will be superseded by calls to the new LangGraph backend.
*   **LangGraph (Python Backend):**
    *   `StateGraph` for defining the cognitive agent.
    *   Nodes and edges for implementing subgraphs and control flow.
    *   Interrupts for human review.
*   **Python (Backend):** Standard library, data structures, OOP for agent logic.
*   **Docker (Backend):** `Dockerfile` for service image, `docker-compose` for local development.
*   **Resume-Matcher (Backend):** Its API for ATS analysis.
*   **Supabase Client (Frontend/Next.js Backend):** Used for database interactions (CRUD operations) and authentication.
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
