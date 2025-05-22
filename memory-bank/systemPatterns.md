# System Patterns: ResumeLM

## 1. System Architecture Overview

ResumeLM employs a modern web architecture with a Next.js frontend and a Supabase backend (PostgreSQL database and authentication). For AI-driven resume tailoring, it integrates with a dedicated LangGraph-based cognitive agent backend. Other AI features may still utilize the Vercel AI SDK.

```mermaid
graph TD
    User["User Browser"] -->|HTTPS| NextJS["Next.js Frontend (Vercel)"]
    NextJS -->|API Routes / Server Actions| Supabase["Supabase Backend"]
    Supabase -->|SQL| DB[(PostgreSQL Database)]
    Supabase -->|Auth| Auth["Supabase Auth"]
    
    NextJS -- For Resume Tailoring -->|API Call| LangGraphAPI["LangGraph Backend API (Python/Docker)"]
    LangGraphAPI -->|Internal LLM Calls, Resume-Matcher| LLMsRM["LLMs / Resume-Matcher"]

    NextJS -- For Other AI Features -->|API Routes / Server Actions| AISDK["Vercel AI SDK"]
    AISDK -->|HTTPS| LLM_Providers["Various LLM APIs (OpenAI, Anthropic, Gemini, etc.)"]

    subgraph frontend ["Frontend (Next.js App)"]
        direction LR
        Pages["App Router (Pages & Layouts)"]
        Components["React Components (Shadcn UI)"]
        State["State Management (React Context/Hooks)"]
        Utils["Utility Functions & Actions"]
    end

    NextJS --> Pages
    Pages --> Components
    Components --> State
    Components --> Utils
    Utils --> Supabase
    Utils --> LangGraphAPI 
    Utils --> AISDK
```

## 2. Key Technical Decisions

*   **Framework Choice:** Next.js (App Router) for its robust features for full-stack development, including server components, server actions, and optimized performance.
*   **Backend as a Service (BaaS):** Supabase for its integrated PostgreSQL database, authentication, and ease of use, reducing backend boilerplate.
*   **UI Components:** Shadcn UI for its accessible, customizable, and unstyled components, combined with Tailwind CSS for styling, allowing for rapid UI development while adhering to the "Soft Gradient Minimalism" design.
*   **AI Integration for Resume Tailoring:** A dedicated LangGraph-based cognitive agent backend (Python, Docker, Resume-Matcher) to provide advanced, multi-step resume tailoring with integrated ATS optimization and quality control. This supersedes the direct use of Vercel AI SDK for this specific feature.
*   **AI Integration (Other Features):** Vercel AI SDK may still be used for other, simpler AI tasks, providing a unified interface to various LLMs.
*   **TypeScript:** For type safety and improved developer experience across the codebase.
*   **Database Schema:** Relational structure with UUID primary keys and timestamps. JSONB fields are used for flexible, nested data within resume sections (e.g., `work_experience`, `education`, `skills`).

## 3. Design Patterns & Component Relationships

*   **Client-Server Model:** Standard web application pattern.
*   **Server Components & Server Actions (Next.js):** Used for data fetching and mutations, reducing client-side load and improving security.
*   **React Context API / Hooks:** For managing global and local state within the frontend (e.g., `AuthContext`, `useTextProcessor` hook for PDF generation).
*   **Modular UI Components:** UI is broken down into reusable React components (e.g., `ProfileForm`, `ResumeEditor`, `ModelSelector`).
*   **Data Flow:**
    *   User interactions trigger client-side handlers.
    *   Handlers may call Next.js Server Actions or API routes.
    *   Server Actions/API routes interact with Supabase (for data persistence) or AI services (for content generation).
    *   Data is returned to the client and updates the UI.
*   **PDF Generation:** Utilizes `@react-pdf/renderer` to construct PDF documents from resume data on the client-side. Text processing is memoized for performance.

## 4. Database Structure Overview

The database is hosted on Supabase (PostgreSQL) and includes the following key tables. Row Level Security (RLS) is enforced to ensure data privacy.

### 4.1. `profiles` Table
*   Stores user's base information and resume components.
*   One-to-one relationship with `auth.users`.
*   **Key Columns:** `user_id` (PK, FK to `auth.users`), `first_name`, `last_name`, `email`, `phone_number`, `location`, `website`, `linkedin_url`, `github_url`, `work_experience` (JSONB), `education` (JSONB), `skills` (JSONB), `projects` (JSONB), `certifications` (JSONB).
*   **RLS:** User can only access their own profile.

```sql
create table public.profiles (
  user_id uuid not null,
  first_name text null,
  last_name text null,
  email text null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  phone_number text null,
  location text null,
  website text null,
  linkedin_url text null,
  github_url text null,
  work_experience jsonb null default '[]'::jsonb,
  education jsonb null default '[]'::jsonb,
  skills jsonb null default '[]'::jsonb,
  projects jsonb null default '[]'::jsonb,
  certifications jsonb null default '[]'::jsonb,
  constraint profiles_pkey primary key (user_id),
  constraint profiles_user_id_key unique (user_id),
  constraint profiles_user_id_fkey foreign KEY (user_id) references auth.users (id) on update CASCADE on delete CASCADE
);
```

### 4.2. `jobs` Table
*   Stores job listings with requirements and details.
*   **Key Columns:** `id` (PK), `user_id` (FK to `auth.users`), `company_name`, `position_title`, `job_url`, `description`, `location`, `salary_range` (JSONB or TEXT), `keywords` (TEXT[]), `work_location`, `employment_type`.
*   **RLS:** Public read access, user-specific write access.
    *Note: The `.cursor/rules/db.md` shows `salary_range` as `text null`, while `.cursorrules` mentions `salary_range as JSONB`. This needs clarification, but for now, we'll assume `text null` as per the SQL DDL.*
    *The `.cursorrules` also mentions `is_active` which is not in the provided DDL for `jobs` but is present in the `simplifiedJobSchema`.*

*(The DDL for `jobs` was not fully provided in `.cursor/rules/db.md`, only for `profiles`, `resumes`, and `subscriptions`. The `.cursorrules` file provides a conceptual structure.)*

### 4.3. `resumes` Table
*   Stores both base and tailored resumes.
*   Links to `jobs` table for tailored resumes.
*   Contains similar content fields as `profiles` but specific to a resume version.
*   **Key Columns:** `id` (PK), `user_id` (FK to `auth.users`), `job_id` (FK to `jobs`, optional), `is_base_resume` (BOOLEAN), `name`, `target_role`, `first_name`, `last_name`, `email`, `phone_number`, `location`, `website`, `linkedin_url`, `github_url`, `professional_summary` (TEXT), `work_experience` (JSONB), `education` (JSONB), `skills` (JSONB), `projects` (JSONB), `certifications` (JSONB), `section_order` (JSONB), `section_configs` (JSONB), `document_settings` (JSONB), `has_cover_letter` (BOOLEAN), `cover_letter` (JSONB).
*   **RLS:** User can only access their own resumes.

```sql
create table public.resumes (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  job_id uuid null,
  is_base_resume boolean null default false,
  name text not null,
  first_name text null,
  last_name text null,
  email text null,
  phone_number text null,
  location text null,
  website text null,
  linkedin_url text null,
  github_url text null,
  professional_summary text null,
  work_experience jsonb null default '[]'::jsonb,
  education jsonb null default '[]'::jsonb,
  skills jsonb null default '[]'::jsonb,
  projects jsonb null default '[]'::jsonb,
  certifications jsonb null default '[]'::jsonb,
  section_order jsonb null default '["professional_summary", "work_experience", "skills", "projects", "education", "certifications"]'::jsonb,
  section_configs jsonb null default '{"skills": {"style": "grouped", "visible": true}, "projects": {"visible": true, "max_items": 3}, "education": {"visible": true, "max_items": null}, "certifications": {"visible": true}, "work_experience": {"visible": true, "max_items": null}}'::jsonb,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  resume_title text null, -- Note: This was 'name' in the DDL, 'resume_title' seems like a typo or alternative name. Using 'name' as per DDL.
  target_role text null,
  document_settings jsonb null default '{"header_name_size": 24, "skills_margin_top": 2, "document_font_size": 10, "projects_margin_top": 2, "skills_item_spacing": 2, "document_line_height": 1.5, "education_margin_top": 2, "skills_margin_bottom": 2, "experience_margin_top": 2, "projects_item_spacing": 4, "education_item_spacing": 4, "projects_margin_bottom": 2, "education_margin_bottom": 2, "experience_item_spacing": 4, "document_margin_vertical": 36, "experience_margin_bottom": 2, "skills_margin_horizontal": 0, "document_margin_horizontal": 36, "header_name_bottom_spacing": 24, "projects_margin_horizontal": 0, "education_margin_horizontal": 0, "experience_margin_horizontal": 0}'::jsonb,
  has_cover_letter boolean not null default false,
  cover_letter jsonb null,
  constraint resumes_pkey primary key (id),
  constraint resumes_job_id_fkey foreign KEY (job_id) references jobs (id) on update CASCADE on delete CASCADE,
  constraint resumes_user_id_fkey foreign KEY (user_id) references auth.users (id) on update CASCADE on delete CASCADE
);
```

### 4.4. `subscriptions` Table
*   Manages user subscriptions and billing information via Stripe.
*   **Key Columns:** `user_id` (PK, FK to `auth.users`), `stripe_customer_id`, `stripe_subscription_id`, `subscription_plan` (TEXT, 'free' or 'pro'), `subscription_status` (TEXT, 'active' or 'canceled'), `current_period_end`, `trial_end`.

```sql
create table public.subscriptions (
  user_id uuid not null,
  stripe_customer_id text null,
  stripe_subscription_id text null,
  subscription_plan text null default 'free'::text,
  subscription_status text null,
  current_period_end timestamp with time zone null,
  trial_end timestamp with time zone null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint subscriptions_pkey primary key (user_id),
  constraint subscriptions_user_id_key unique (user_id),
  constraint subscriptions_stripe_subscription_id_key unique (stripe_subscription_id),
  constraint subscriptions_stripe_customer_id_key unique (stripe_customer_id),
  constraint subscriptions_user_id_fkey foreign KEY (user_id) references auth.users (id) on update CASCADE on delete CASCADE,
  constraint subscriptions_subscription_plan_check check (
    (
      subscription_plan = any (array['free'::text, 'pro'::text])
    )
  ),
  constraint subscriptions_subscription_status_check check (
    (
      (subscription_status is null)
      or (
        subscription_status = any (array['active'::text, 'canceled'::text])
      )
    )
  )
);
```
*Note: All tables have an `updated_at` trigger to automatically update the timestamp on row modification.*

## 5. Critical Implementation Paths

*   **AI Resume Tailoring (New Architecture):**
    1.  User selects a base resume and a target job within the Next.js frontend.
    2.  Frontend sends data (base resume JSON, job details/URL, user preferences) via a server action or API route to an intermediary layer that calls the LangGraph Backend API.
    3.  The LangGraph Backend API (Python/Docker service) processes the input through its cognitive agent architecture:
        *   **Input Processing Subgraph:** Scrapes/parses job details, extracts key requirements.
        *   **Resume Drafting Subgraph:** Generates tailored resume sections using LLMs, applying STAR methodology.
        *   **ATS Optimization Subgraph:** Evaluates the draft using Resume-Matcher, calculates ATS score, identifies missing keywords.
        *   **Quality Gate (Supervisor):** If ATS score is low, loops back to Resume Drafting with feedback.
        *   **Human Review Subgraph (Optional):** Presents draft for user approval/revision requests.
        *   **Format Optimization Subgraph:** Finalizes resume structure for PDF and database compatibility.
    4.  The LangGraph API returns the final tailored resume (JSON), ATS report, and change summary.
    5.  The Next.js backend saves the new tailored resume to the `resumes` table in Supabase.
    6.  Frontend displays the tailored resume and associated reports.
*   **PDF Generation:**
    1.  User views a resume.
    2.  Resume data is passed to `ResumePDFDocument` component.
    3.  `@react-pdf/renderer` components construct the PDF structure.
    4.  `useTextProcessor` hook handles text formatting (bolding, markdown stripping).
    5.  The PDF is rendered for download/preview.
*   **User Authentication:** Handled by Supabase Auth, with session management integrated into Next.js middleware and client-side contexts.

## 6. JSONB Field Structures (Conceptual from `.cursorrules`)

*   **`work_experience` (Array):** `{ company, position, location?, date, description (string[]), technologies? (string[]) }`
*   **`education` (Array):** `{ school, degree, field, location?, date, gpa?, achievements? (string[]) }`
*   **`skills` (Array):** `{ category, items (string[]) }`
*   **`projects` (Array):** `{ name, description (string[]), date?, technologies? (string[]), url?, github_url? }`
*   **`certifications` (Array):** *(Structure not explicitly defined in `.cursorrules` but implied by other JSONB arrays, likely `{ name, authority?, date?, url? }`)*
*   **`section_configs` (Object):** `{ [sectionName]: { visible: boolean, max_items?: number | null, style?: 'grouped' | 'list' | 'grid' } }`
*   **`document_settings` (Object):** Controls PDF styling (font sizes, margins, spacing). Includes global settings, header settings, and specific margin/spacing settings for sections like Skills, Experience, Projects, Education, and Professional Summary (e.g., `summary_show_header`, `summary_margin_top`).

This document outlines the primary system patterns. It will be updated as the system evolves and new patterns emerge or existing ones are refined.
