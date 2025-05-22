# Technical Context: LangGraph Cognitive Agent Backend for Resume-LM

## 1. Core Technologies

*   **Primary Framework:** LangGraph (built on LangChain)
*   **Programming Language:** Python (version 3.9 or higher recommended)
*   **Containerization:** Docker
*   **ATS Analysis Engine:** Resume-Matcher
*   **Potential Web Framework (for API):** FastAPI or Flask (to be decided based on specific needs)
*   **Data Validation/Serialization:** Pydantic (commonly used with FastAPI and for typed Python)

## 2. Development Environment & Setup

*   **Python Environment Management:** Virtual environments (e.g., `venv`, `conda`) are essential.
*   **Package Management:** `pip` with `requirements.txt`, or a more structured tool like Poetry or PDM.
*   **Docker Desktop:** Required for building and running Docker containers locally.
*   **IDE/Editor:** VS Code (with Python and Docker extensions), PyCharm, or other Python-supporting IDEs.
*   **Linters/Formatters:** Black, Flake8, Ruff, or Pylint for Python code quality.
*   **Testing Framework:** PyTest or Python's built-in `unittest` for testing individual nodes, subgraphs, and the overall API.

## 3. Key Dependencies & Libraries (Anticipated)

*   **`langgraph`:** The core library for building the stateful multi-agent system. Includes:
    *   `langgraph.graph.StateGraph`, `langgraph.graph.START`, `langgraph.graph.END`
    *   `langgraph.func.task`, `langgraph.func.entrypoint` (for the functional API)
    *   `langgraph.types.Command` (for supervisor routing)
    *   `langgraph.types.interrupt` (for Human-in-the-Loop)
    *   `langgraph.constants.Send` (for parallel dispatch)
    *   `langgraph.prebuilt` (e.g., `create_react_agent`, `ToolNode`)
*   **`langchain`:** Provides foundational components (LLMs, chains, tools, memory) that LangGraph utilizes.
*   **`langchain_core`:** For core abstractions like `BaseChatModel`, `@tool`, message types.
*   **`langchain-community`, `langchain-openai`, `langchain-google-genai`, `langchain-groq`, `langchain-openrouter` etc.:** Specific LangChain packages for LLM integrations, particularly for the Model Abstraction Layer.
*   **`resume-matcher`:** The Python library for ATS scoring and keyword analysis.
*   **`fastapi` / `flask`:** (If building a standalone service) For creating the API endpoints.
*   **`uvicorn` / `gunicorn`:** (If using FastAPI/Flask) ASGI/WSGI servers.
*   **`pydantic`:** For data validation, settings management, defining request/response models, and for core components of the Model Abstraction Layer (e.g., `ModelCapability`).
*   **`requests`:** For making HTTP requests (e.g., to scrape job URLs if not using more advanced tools).
*   **`beautifulsoup4` / `lxml`:** For parsing HTML content from web scraping.
*   **`playwright` / `selenium`:** (Optional, for advanced web scraping) If job sites require JavaScript execution.
*   **`tiktoken`:** For token counting if managing LLM context windows precisely.
*   **Logging library:** Python's built-in `logging` module.

## 4. Technical Constraints & Considerations

*   **LangGraph Complexity:** While powerful, designing, debugging, and managing state in complex LangGraph applications requires careful planning. The adoption of the functional API (`@task`, `@entrypoint`) and a hybrid supervisor model aims to manage this complexity by promoting modularity and clearer data flows.
*   **Performance:** The target of <60 seconds for the entire workflow needs to be actively monitored. Each node/task, LLM call, and potential PDF parsing step contributes to latency. Parallel processing via `Send` API is a key strategy for optimization.
*   **State Management:** The `ResumeState` object is central. The functional API can help simplify state flow between tasks, as inputs and outputs are more explicit. The Model Abstraction Layer adds `model_usage` and potentially `config` for provider preferences to the state.
*   **Resume-Matcher Integration:** Understanding its API, performance characteristics, and the format of its output (especially when parsing rendered PDFs) is key for the ATS Optimization subgraph.
*   **LLM API Calls & Model Abstraction Layer:**
    *   The Model Abstraction Layer centralizes LLM API interactions.
    *   Managing API keys securely (e.g., via environment variables referenced in the `ModelRegistry`).
    *   Handling rate limits and retries (partially managed by LangChain clients like `ChatGroq`, but may need higher-level orchestration).
    *   The dynamic selection logic in `ModelRegistry.select_model()` and context estimation utilities (`estimate_token_count`, `check_token_limits`) are critical for efficient and error-free LLM usage.
    *   Fallback mechanisms within the `ModelRegistry` enhance resilience.
*   **Error Propagation and Handling:** Robust error handling within each node and at the supervisor level is critical to prevent graph execution failures.
*   **Resource Consumption:** The Docker container running the LangGraph application (including Python, LangGraph, and potentially LLM models if run locally or heavily cached) will have memory and CPU footprints to consider.
*   **Cold Starts:** If deployed in a serverless-like fashion (though Docker suggests more persistent deployment), cold starts for the Python application could be an issue.
*   **API Security:** If exposed as an HTTP API, appropriate authentication (e.g., API keys, JWT) and authorization mechanisms must be implemented.
*   **Python Version Compatibility:** Ensuring all chosen libraries are compatible with the selected Python version.
*   **Dependency Management:** Keeping Python dependencies well-managed to avoid conflicts.

## 5. Tool Usage Patterns

*   **LangGraph:**
    *   `StateGraph`: Still used for defining the overall graph structure, especially with the hybrid supervisor.
    *   `@entrypoint`: Decorator to define the main workflow entry, integrating with checkpointing.
    *   `@task`: Decorator for defining individual, testable, and potentially parallelizable units of work.
    *   Nodes: Python functions (often decorated with `@task`) or more complex agent nodes (which might internally use `StateGraph` or ReAct patterns).
    *   `langgraph.types.Command`: Used by the supervisor node for explicit routing instructions.
    *   `langgraph.types.interrupt`: Native mechanism for implementing Human-in-the-Loop.
    *   `langgraph.constants.Send`: For dispatching tasks to run in parallel (e.g., section drafting).
    *   Edges: Defining the flow, including conditional edges from the supervisor.
    *   Persistence: LangGraph's checkpointing (e.g., `MemorySaver`) is crucial for resumable HITL and stateful operations.
*   **Python:**
    *   Functional Programming: Leveraged by the `@task` and `@entrypoint` decorators.
    *   Object-Oriented Programming: For structuring agent logic (e.g., `ModelRegistry`) and helper classes.
    *   Data Structures: TypedDicts (`ResumeState`), Pydantic models (`ModelCapability`), enums (`ModelCategory`), lists, dictionaries.
    *   Exception Handling: `try-except` blocks, and potentially decorators like `safe_task_wrapper` using `functools.wraps`.
    *   `functools.wraps`: Used when creating decorators to preserve metadata of the wrapped function.
*   **Model Abstraction Layer Components:**
    *   `ModelRegistry`: Central class for model management.
    *   `ModelCapability`: Pydantic model for defining model profiles.
    *   `ModelCategory`: Enum for categorizing models.
    *   Utility functions: `estimate_token_count`, `estimate_context_size`, `check_token_limits`.
    *   `ModelTrackingMixin`: For standardized logging of model usage.
*   **Resume-Matcher:** Using its `ResumeParser`, `JobParser`, and `Matcher` classes as shown in the proposal.
*   **Docker:**
    *   `Dockerfile`: To define the image for the LangGraph backend service.
    *   `docker-compose.yml`: Potentially for local development to manage the service and any dependencies (e.g., a local LLM or vector store if used).
*   **Pydantic:** Defining clear input and output schemas for API endpoints, for internal data validation within the graph state, and for the Model Abstraction Layer's data models.

## 6. Integration with Main Resume-LM Application

*   **API Contract:** A well-defined API contract (e.g., OpenAPI specification) will be crucial. This includes:
    *   Request schema: Defining the structure of the base resume, job details, and user preferences sent by Resume-LM.
    *   Response schema: Defining the structure of the tailored resume JSON, ATS report, and change summary returned to Resume-LM. This must align with Resume-LM's existing database schemas.
*   **Communication Protocol:** Likely HTTPS.
*   **Authentication:** The API exposed by the LangGraph backend will need an authentication mechanism to ensure only the Resume-LM application can access it.

This document provides a snapshot of the anticipated technical context for the LangGraph backend. It will evolve as research into specific libraries is completed and implementation begins.
