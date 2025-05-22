# Project Brief: ResumeLM

## 1. Project Overview

ResumeLM is an AI-powered resume builder designed to help users create, manage, and tailor resumes effectively. It leverages modern web technologies and AI models to streamline the resume creation process and optimize resumes for specific job applications.

## 2. Core Goals

*   **AI-Powered Resume Generation:** Enable users to generate base resumes and tailor existing resumes to specific job descriptions using AI.
*   **User-Friendly Interface:** Provide an intuitive and aesthetically pleasing user experience based on a "Soft Gradient Minimalism" design system.
*   **Efficient Resume Management:** Allow users to store, organize, and version their resumes.
*   **Job Application Assistance:** Help users match their resumes to job requirements.
*   **PDF Export:** Enable users to export their resumes in PDF format.

## 3. Target Audience

Individuals seeking to create professional resumes, particularly those applying for multiple roles who need to tailor their resumes frequently.

## 4. Key Features (High-Level)

*   User authentication and profile management.
*   Creation and editing of resume sections (contact info, work experience, education, skills, projects, certifications).
*   Advanced AI-driven content generation and tailoring for resumes, powered by a LangGraph-based cognitive agent backend for enhanced quality, ATS optimization, and STAR methodology implementation.
*   Storage of base resumes and tailored resumes.
*   Management of job listings and their requirements.
*   PDF export of resumes.
*   Integration with various AI models (e.g., OpenAI, Anthropic, Gemini).
*   Secure API key management for AI services.

## 5. Technical Stack Overview

*   **Frontend:** Next.js 15, React 19, TypeScript
*   **UI:** Shadcn UI, Tailwind CSS
*   **Backend/Database:** Supabase (PostgreSQL)
*   **Resume Tailoring AI Backend:** LangGraph, Python, Docker, Resume-Matcher
*   **AI Integration (General/Other Features):** Vercel AI SDK, various LLM providers (Note: Vercel AI SDK role for resume tailoring is superseded by the LangGraph backend)

## 6. Scope Considerations

*   Initial focus is on resume building and tailoring. A significant architectural enhancement involves developing a new LangGraph-based backend for the tailored resume feature.
*   Cover letter generation is a potential future feature (indicated by `has_cover_letter` fields).
*   The system should be robust in handling data from AI models, including optional or missing fields.

This document serves as the foundational understanding of the ResumeLM project. It will be updated as the project evolves.
