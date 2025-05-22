# Project Brief: LangGraph Cognitive Agent Backend for Resume-LM

## 1. Project Overview

This project entails the development of a new backend API layer for Resume-LM's tailored resume feature. It will employ a LangGraph-based cognitive agent architecture to provide advanced, nuanced, and ATS-optimized resume tailoring. This new system is designed to replace the existing Vercel AI SDK-based approach for resume tailoring, addressing its limitations in achieving deep customization and robust quality checks.

The backend will operate as a specialized service, receiving inputs from the main Resume-LM application and returning a fully tailored resume and associated reports.

## 2. Core Goals

*   **Enhanced Tailoring Quality:** Significantly improve the quality, relevance, and human-like nature of AI-generated tailored resumes.
*   **Integrated ATS Optimization:** Natively incorporate ATS (Applicant Tracking System) compatibility checks and optimization, leveraging Resume-Matcher technology, aiming for a minimum 85% ATS compatibility score.
*   **Robust STAR Methodology Implementation:** Ensure consistent and implicit application of the STAR (Situation, Task, Action, Result) methodology in experience and project descriptions.
*   **Cognitive Agent Architecture:** Implement a multi-step, stateful process using LangGraph, allowing for more complex reasoning, iteration, and decision-making than single-prompt approaches.
*   **Human-in-the-Loop Capability:** Integrate a strategic human review interrupt point for quality assurance and user feedback incorporation.
*   **Schema Consistency:** Ensure all outputs (tailored resume JSON) strictly adhere to the existing Resume-LM data structures for seamless integration.
*   **Improved Maintainability & Scalability:** Create a modular and extensible backend system for the resume tailoring functionality.
*   **Time Efficiency:** Aim to complete the primary tailoring workflow in under 60 seconds.

## 3. Target System (Audience)

The primary "audience" or consumer of this LangGraph backend API will be the main Resume-LM Next.js application. It will serve as the new engine for the "tailored resume" feature.

## 4. Key Features (High-Level)

*   **Input Processing Agent/Tasks:** Handles various job information formats (URL, text), normalizes data, and extracts key requirements using `@task` decorated functions.
*   **Potential & Objective Setting Agent/Tasks:** Analyzes base resume against job data to estimate maximum ATS potential and set realistic target objectives, implemented as `@task`(s).
*   **Formatting Strategy Agent/Tasks:** Calculates specific formatting guidelines (e.g., character limits, bullet counts per section) based on overall page limits and content objectives, implemented as `@task`(s).
*   **Resume Drafting & Formatting Agent/Tasks (RDF):** Generates tailored resume content, potentially in parallel for sections (using `Send` API), applying implicit STAR methodology, aligning with job requirements, and strictly adhering to formatting guidelines. Incorporates internal reflection loops within section-drafting tasks and can invoke a `strategic_reflexion_tool` if needed.
*   **ATS Optimization Agent/Tasks:** Evaluates the layout-aware resume drafts (ideally from rendered PDF parsing) using Resume-Matcher, provides keyword analysis, and suggests optimizations, implemented as `@task`(s).
*   **Supervisor Agent Node (Hybrid Model):** A lightweight orchestrator using `Command` objects to route execution between specialized agent nodes or task sequences based on the `ResumeState`.
*   **Quality Gate & Reflexion Loop:** The Supervisor evaluates ATS scores. If below threshold, it may invoke the `Reflexion Agent/Tool` for strategic replanning before looping back to the RDF agent/tasks with enhanced directives.
*   **Reflexion Agent/Tool:** Implemented as a callable `@tool` or a dedicated agent node, it analyzes failure patterns (from ATS or Human Review) and generates higher-level strategic directives.
*   **Human Review Agent Node (Native Interrupt):** Allows for optional human oversight on the layout-aware draft using LangGraph's native `interrupt` mechanism. Feedback can trigger the Reflexion loop. No automated modifications occur after human approval.
*   **Finalization Agent/Task:** Performs final schema checks on the human-approved resume and assembles output reports (ATS analysis, etc.), implemented as a `@task`. Does not modify content or formatting.
*   **API Endpoints:** Exposes clear API endpoints for the Resume-LM frontend to consume, likely defined using an `@entrypoint` decorated workflow.

## 5. Technical Stack Overview

*   **Core Framework:** LangGraph (Python)
*   **Primary Language:** Python
*   **Containerization:** Docker
*   **ATS Technology Integration:** Resume-Matcher
*   **Supporting Libraries:** Standard Python data manipulation and API development libraries (e.g., Pydantic for data validation, FastAPI/Flask if exposing as a separate service).

## 6. Scope Considerations

*   **Initial Focus:** Development and integration of the LangGraph-powered API for the tailored resume feature, replacing the current Vercel AI SDK implementation for this specific task.
*   **Inputs:** Base resume (JSON), job listing (URL/text), user preferences.
*   **Outputs:** Tailored resume (JSON), ATS compatibility report, change summary.
*   **Out of Scope (Initially):** Direct UI for this backend (it's an API layer), real-time collaborative editing within the LangGraph flow.
*   **Breaking Changes:** This project will introduce breaking changes to how the tailored resume feature is implemented internally within Resume-LM, which is an expected and desired outcome.
*   **Research Phase:** Specific Python libraries for web scraping, detailed LLM choices within graphs, and exact API contract are subject to further refinement during the detailed design and implementation phases.

This document serves as the foundational understanding for the LangGraph Cognitive Agent Backend project.
