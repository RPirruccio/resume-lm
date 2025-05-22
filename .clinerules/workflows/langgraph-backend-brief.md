# Workflow: LangGraph Backend Brief

## Objective
To provide focused context on the LangGraph backend architecture for Resume-LM. This workflow is triggered when a new task requires understanding or refining this specific backend component.

## Core Context Files (MUST READ)
All files within the `/Users/riccardopirruccio/opt/resume-lm/memory-bank/langgraph-backend/` directory.

## Instructions for Cline
1.  **Prioritize `/Users/riccardopirruccio/opt/resume-lm/memory-bank/langgraph-backend/`:** When this workflow is active, your primary source of truth for the backend architecture is the content within the `/Users/riccardopirruccio/opt/resume-lm/memory-bank/langgraph-backend/` directory.
2.  **Review All Backend Docs:** Read ALL markdown files within `/Users/riccardopirruccio/opt/resume-lm/memory-bank/langgraph-backend/` to gain a comprehensive understanding of the supervisor agent, all subgraphs, their interactions, data flow, and overall strategic goals.
    - **Use Filesystem MCP for Batch Reading:** When reading multiple markdown files, utilize the `filesystem` MCP's `read_multiple_files` tool to read files in batches for efficiency. Remember to provide the full absolute path to each file (e.g., `/Users/riccardopirruccio/opt/resume-lm/memory-bank/langgraph-backend/your_file.md`).
3.  **Focus on Architecture:** Pay close attention to architectural diagrams (Mermaid), component responsibilities, inputs/outputs of each subgraph, and the decision logic of the supervisor.
4.  **Identify Areas for Refinement:** Based on your understanding, identify any ambiguities, inconsistencies, or areas that might need further clarification or refinement in the documented architecture.
5.  **Assist in Refinement:** Use this focused context to assist in tasks related to refining the LangGraph backend architecture, planning its implementation, or answering specific questions about its design.
