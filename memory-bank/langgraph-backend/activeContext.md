# Active Context: LangGraph Cognitive Agent Backend for Resume-LM

## 1. Current Work Focus (as of 2025-05-20)

The primary focus is on **finalizing the alignment of all Memory Bank documents** with the newly adopted detailed implementation plan for the LangGraph-based cognitive agent architecture. This plan, provided by the user, emphasizes a hybrid supervisor model, LangGraph's functional API (`@task`, `@entrypoint`), tool-based reflexion, native interrupts for Human-in-the-Loop (HITL), dynamic parallel processing for sections, structured error handling, and full integration of the Model Abstraction Layer.

## 2. Recent Changes & Resolutions

*   **Project Initiation:** Decision made to develop a new LangGraph backend.
*   **Directory Structure:** `langgraph-api/` and `memory-bank/langgraph-backend/` created.
*   **Initial Documentation (Consolidated Subgraphs):** Foundational Memory Bank documents drafted, with an architecture based on a supervisor and specialized subgraphs.
*   **Model Abstraction Layer Introduction (2025-05-20):** Designed and documented `model_abstraction_layer.md`. Initial updates made to other documents to reference this layer.
*   **Detailed Implementation Plan Adoption (2025-05-20):** Adopted a comprehensive user-provided plan for a leaner, more robust architecture. Key elements include:
    *   **Hybrid Supervisor-Agent Architecture:** Lightweight supervisor delegating to specialized agent nodes.
    *   **Functional API (`@task`, `@entrypoint`):** Primary method for defining workflow components.
    *   **Tool-Based Reflexion (`@tool`):** Reflexion implemented as a callable tool.
    *   **Native Interrupts for HITL:** Using `langgraph.types.interrupt`.
    *   **Dynamic Parallel Processing (`Send` API):** For concurrent section drafting.
    *   **Structured Error Handling:** Model fallbacks and safe task wrappers.
    *   This adoption triggered a full review and revision of all `memory-bank/langgraph-backend/` documents.

## 3. Current Status & Next Steps

*   **Status:**
    *   The project has a **clearly defined, advanced architectural implementation strategy** based on the user's detailed plan. This strategy leverages specific LangGraph features for modularity, efficiency, and robustness.
    *   The **Model Abstraction Layer** is a core, documented component.
    *   **Documentation revision is actively underway** to align all `memory-bank/langgraph-backend/` files (supervisor architecture, system patterns, technical context, and individual component descriptions) with this new implementation strategy.
*   **Next Steps:**
    1.  **Complete Backend Documentation Revision (Current Task):** Finalize updates to all `memory-bank/langgraph-backend/` documents to accurately reflect the adopted hybrid supervisor, functional API, tool-based reflexion, native interrupts, parallel processing, error handling patterns, and Model Abstraction Layer integration.
    2.  **Update Root-Level Memory Bank:** Modify the main `memory-bank/*.md` files to reflect this new, detailed backend architecture.
    3.  **Plan Phase 1 Implementation:** Develop a detailed plan for implementing the first phase of the backend based on the new architectural patterns (e.g., setting up the `@entrypoint` workflow, implementing initial `@task` functions for input processing and objective setting, integrating the Model Abstraction Layer).
    4.  **Finalize Technology Choices:** Solidify choices for Python libraries (web framework, advanced web scraping, PDF parsing, `langchain-openrouter`).
    5.  **Detail API Contract:** Define the precise API contract (request/response schemas, error handling) between Resume-LM and this LangGraph backend.
    6.  **Refine Task-Specific Logic:** Further detail internal logic, prompts (considering dynamic model selection), and state transitions for complex components like the `resume_drafting_agent` (including its parallel section workers and internal reflection) and the `strategic_reflexion_tool`.

## 4. Active Decisions & Considerations

*   **Adopted Architecture:** Firm decision to implement the LangGraph backend using the user-provided detailed plan, including:
    *   Hybrid Supervisor Model.
    *   Functional API (`@task`, `@entrypoint`).
    *   Tool-Based Reflexion.
    *   Native LangGraph Interrupts for HITL.
    *   Dynamic Parallel Processing (`Send` API).
    *   Structured Error Handling and Fallbacks.
    *   Full integration of the Model Abstraction Layer.
*   **Core Technologies:** LangGraph, Python, Docker, Resume-Matcher remain central.
*   **Documentation First:** Continuing to prioritize accurate and comprehensive documentation reflecting the chosen implementation strategy.
*   **Integrated Formatting:** Content formatting handled during drafting by the `resume_drafting_agent` (or its section workers), guided by `format_strategy_agent`. No content-altering formatting post-human approval.
*   **Reflection/Reflexion:** Local reflection within section drafting tasks; global, strategic reflexion via a callable tool.
*   **API Contract Definition:** Remains a key upcoming task.
*   **Technology Choices for Auxillary Functions:** Libraries for web scraping, PDF parsing, etc., still need finalization.
*   **Phased Implementation:** Essential for managing complexity.
*   **Schema Compatibility:** Must be maintained with Resume-LM's existing data structures.
*   **ATS Realism:** Emphasis on realistic ATS simulation (e.g., PDF parsing) continues.

## 5. Learnings & Project Insights

*   User-provided detailed implementation plans can significantly accelerate architectural refinement and clarify best-practice adoption of complex frameworks like LangGraph.
*   A dedicated Memory Bank for a complex backend component is invaluable for tracking evolving design decisions.
*   The shift to a more granular, functional, and tool-based agent architecture (from a coarser subgraph model) promises better modularity, testability, and flexibility.
*   The Model Abstraction Layer is a foundational piece for managing diverse LLMs effectively.
*   Leveraging native LangGraph features (functional API, interrupts, `Send` for parallelism) is key to building efficient and maintainable stateful AI applications.
