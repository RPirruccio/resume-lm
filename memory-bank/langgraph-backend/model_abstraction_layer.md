# Model Abstraction Layer for LangGraph Cognitive Agent

## 1. Introduction & Purpose

This document details the Model Abstraction Layer designed for Resume-LM's LangGraph-based cognitive architecture. The primary purpose of this layer is to provide a flexible, robust, and future-proof mechanism for selecting, managing, and interacting with various Large Language Models (LLMs) from multiple providers (e.g., Groq, OpenRouter).

**Key Goals:**

*   **Dynamic Model Selection:** Enable the selection of the most appropriate LLM for a given task based on its capabilities, context window, cost, and specific requirements of the calling subgraph.
*   **Multi-Provider Support:** Abstract away provider-specific implementation details, allowing seamless integration and switching between different LLM providers.
*   **Centralized Model Management:** Offer a single `ModelRegistry` as the source of truth for available models and their profiles.
*   **Cost and Capability Optimization:** Allow for selection strategies that balance performance with operational costs (e.g., "economy mode").
*   **Simplified Model Interaction:** Provide a consistent interface for subgraphs to obtain and use LLM instances.
*   **Resilience:** Incorporate fallback mechanisms to ensure system reliability if a primary model fails.
*   **Monitoring & Analytics:** Facilitate tracking of model usage for performance analysis and optimization.

## 2. Core Components

The Model Abstraction Layer consists of several key Pydantic models and classes:

### `ModelCategory` (Enum)

Defines categories of model capabilities for more nuanced selection.

```python
from enum import Enum

class ModelCategory(str, Enum):
    """Categories of model capabilities for more nuanced selection."""
    BASIC = "basic"              # Simple tasks, smaller context
    REASONING = "reasoning"      # Complex thinking, multi-step reasoning
    CREATIVE = "creative"        # Content generation, writing
    ANALYTICAL = "analytical"    # Data analysis, pattern recognition
    COMPREHENSIVE = "comprehensive"  # Strong performance across all dimensions
```

### `ModelCapability` (Pydantic Model)

A Pydantic model that defines the profile for each LLM, containing metadata about its strengths, limitations, and operational characteristics.

```python
from typing import List, Optional, Any
from pydantic import BaseModel, Field

class ModelCapability(BaseModel):
    """Model capability profile containing metadata about a model's strengths."""
    context_window: int = Field(description="Maximum context window length in tokens")
    max_tokens_out: Optional[int] = Field(description="Maximum output tokens", default=None)
    capabilities: List[str] = Field(description="List of model capabilities (e.g., 'reasoning', 'long_context', 'tool_use')")
    cost_tier: str = Field(description="Relative cost category (lowest, low, medium, high)")
    provider: str = Field(description="Model provider (groq, openrouter, etc.)")
    primary_category: ModelCategory = Field(description="Primary strength category of the model")
    tool_calling: bool = Field(description="Whether model supports function/tool calling", default=False)
    streaming: bool = Field(description="Whether model supports token streaming", default=True)
    response_format: List[str] = Field(description="Supported response formats (json, xml, etc.)", default_factory=list)
    model_version: str = Field(description="Version identifier of the model")
    token_limit_safety_margin: int = Field(description="Safety margin to avoid token limit issues", default=100)
```

### `ModelRegistry` Class

The central class responsible for storing model capabilities, instantiating model clients, and selecting appropriate models based on requirements.

```python
from typing import Dict, List, Optional, Any, Union, Literal, Callable
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_groq import ChatGroq
# For OpenRouter, ensure langchain_openrouter or langchain_openai is installed
# from langchain_openrouter import ChatOpenRouter # Preferred if available
# from langchain_openai import ChatOpenAI # Fallback for OpenRouter
import os
import functools

class ModelRegistry:
    """Registry of available models with capability-based selection across providers."""
    
    def __init__(self):
        # Model capabilities database
        self.models: Dict[str, ModelCapability] = {
            # Groq models
            "groq/llama-3.3-70b-versatile": ModelCapability(
                context_window=128000, max_tokens_out=32768,
                capabilities=["reasoning", "long_context", "formatting", "tool_use"],
                cost_tier="high", provider="groq", primary_category=ModelCategory.COMPREHENSIVE,
                tool_calling=True, streaming=True, response_format=["json", "xml", "markdown", "yaml"], model_version="3.3"
            ),
            "groq/llama-3.1-8b-instant": ModelCapability(
                context_window=128000, max_tokens_out=8192,
                capabilities=["long_context", "basic_reasoning"],
                cost_tier="low", provider="groq", primary_category=ModelCategory.BASIC,
                tool_calling=False, streaming=True, response_format=["markdown"], model_version="3.1"
            ),
            "groq/gemma2-9b-it": ModelCapability(
                context_window=8192, max_tokens_out=8192,
                capabilities=["reasoning", "instruction_following"],
                cost_tier="low", provider="groq", primary_category=ModelCategory.REASONING,
                tool_calling=False, streaming=True, response_format=["markdown"], model_version="2"
            ),
            "groq/llama3-70b-8192": ModelCapability(
                context_window=8192, max_tokens_out=8192,
                capabilities=["reasoning", "formatting"],
                cost_tier="medium", provider="groq", primary_category=ModelCategory.REASONING,
                tool_calling=False, streaming=True, response_format=["markdown"], model_version="3"
            ),
            "groq/llama3-8b-8192": ModelCapability(
                context_window=8192, max_tokens_out=2048,
                capabilities=["basic_reasoning"],
                cost_tier="lowest", provider="groq", primary_category=ModelCategory.BASIC,
                tool_calling=False, streaming=True, response_format=["markdown"], model_version="3"
            ),
            
            # OpenRouter models (placeholders for future integration)
            "openrouter/anthropic/claude-3-5-sonnet": ModelCapability(
                context_window=200000, max_tokens_out=32768,
                capabilities=["reasoning", "long_context", "formatting", "tool_use"],
                cost_tier="high", provider="openrouter", primary_category=ModelCategory.COMPREHENSIVE,
                tool_calling=True, streaming=True, response_format=["json", "xml", "markdown", "yaml"], model_version="3.5"
            ),
            "openrouter/meta-llama/llama-3-70b-instruct": ModelCapability(
                context_window=128000, max_tokens_out=16384,
                capabilities=["reasoning", "long_context", "formatting"],
                cost_tier="medium", provider="openrouter", primary_category=ModelCategory.REASONING,
                tool_calling=False, streaming=True, response_format=["markdown"], model_version="3"
            )
        }
        
        self._model_instances = {} # Cache for model instances
        
        self.fallback_paths = {
            "groq/llama-3.3-70b-versatile": ["groq/llama3-70b-8192", "groq/llama-3.1-8b-instant"],
            "groq/llama-3.1-8b-instant": ["groq/llama3-8b-8192", "groq/gemma2-9b-it"],
            "groq/gemma2-9b-it": ["groq/llama3-8b-8192", "groq/llama-3.1-8b-instant"],
            "groq/llama3-70b-8192": ["groq/llama-3.3-70b-versatile", "groq/llama-3.1-8b-instant"],
            "groq/llama3-8b-8192": ["groq/llama-3.1-8b-instant", "groq/gemma2-9b-it"],
            "openrouter/anthropic/claude-3-5-sonnet": ["openrouter/meta-llama/llama-3-70b-instruct", "groq/llama-3.3-70b-versatile"],
            "openrouter/meta-llama/llama-3-70b-instruct": ["groq/llama-3.3-70b-versatile", "groq/llama3-70b-8192"]
        }

    # Suggestion: Consider adding a configure_providers method here
    # def configure_providers(self, provider_config: Dict):
    #     """Dynamically update model registry and fallbacks from a configuration object."""
    #     # Logic to parse provider_config and update self.models and self.fallback_paths
    #     pass

    def get_model(self, model_key: str, temperature: float = 0.7) -> BaseChatModel:
        """Get or create a model instance by name with caching."""
        cache_key = f"{model_key}_{temperature}"
        if cache_key not in self._model_instances:
            if "/" not in model_key: provider, model_name = "groq", model_key
            else: provider, model_name = model_key.split("/", 1)
            
            if provider == "groq":
                self._model_instances[cache_key] = ChatGroq(
                    model_name=model_name, temperature=temperature, max_retries=3, request_timeout=60
                )
            elif provider == "openrouter":
                try: # Prefer langchain_openrouter if available
                    from langchain_openrouter import ChatOpenRouter
                    self._model_instances[cache_key] = ChatOpenRouter(
                        model_name=model_name, temperature=temperature, max_retries=3, request_timeout=60
                    )
                except ImportError: # Fallback to OpenAI compatible client
                    from langchain_openai import ChatOpenAI
                    self._model_instances[cache_key] = ChatOpenAI(
                        model_name=model_name, temperature=temperature,
                        openai_api_base="https://openrouter.ai/api/v1",
                        openai_api_key=os.environ.get("OPENROUTER_API_KEY", ""),
                        max_retries=3
                    )
            else: raise ValueError(f"Unsupported provider: {provider}")
        return self._model_instances[cache_key]
    
    def get_model_with_fallbacks(self, primary_model_key: str, temperature: float = 0.7) -> BaseChatModel:
        """Get a model with appropriate fallbacks configured."""
        primary_model = self.get_model(primary_model_key, temperature)
        if primary_model_key in self.fallback_paths:
            fallback_models = [self.get_model(name, temperature) for name in self.fallback_paths[primary_model_key]]
            return primary_model.with_fallbacks(fallback_models)
        return primary_model
    
    def select_model(self, requirements: Dict[str, Any]) -> str:
        """Select the most appropriate model based on requirements."""
        candidates = list(self.models.keys())
        
        if "provider" in requirements:
            candidates = [m for m in candidates if self.models[m].provider == requirements["provider"]]
        if "required_capabilities" in requirements:
            candidates = [m for m in candidates if all(cap in self.models[m].capabilities for cap in requirements["required_capabilities"])]
        if "primary_category" in requirements:
            candidates = [m for m in candidates if self.models[m].primary_category == requirements["primary_category"]]
        if "min_context_window" in requirements:
            candidates = [m for m in candidates if self.models[m].context_window >= requirements["min_context_window"]]
        if "min_output_tokens" in requirements:
            candidates = [m for m in candidates if self.models[m].max_tokens_out is None or self.models[m].max_tokens_out >= requirements["min_output_tokens"]]
        if requirements.get("requires_tool_calling", False):
            candidates = [m for m in candidates if self.models[m].tool_calling]
        if "response_format" in requirements:
            candidates = [m for m in candidates if requirements["response_format"] in self.models[m].response_format]
        
        cost_rank = {"lowest": 0, "low": 1, "medium": 2, "high": 3}
        if requirements.get("economy_mode", False):
            candidates.sort(key=lambda m: cost_rank[self.models[m].cost_tier])
        else:
            candidates.sort(key=lambda m: cost_rank[self.models[m].cost_tier], reverse=True)
        
        return candidates[0] if candidates else "groq/llama-3.3-70b-versatile" # Default fallback
            
    def get_model_info(self, model_key: str) -> Dict[str, Any]:
        """Get detailed information about a model for logging and analytics."""
        if model_key not in self.models and "/" not in model_key: model_key = f"groq/{model_key}"
        if model_key in self.models:
            caps = self.models[model_key]
            return {
                "model_key": model_key, "provider": caps.provider, "context_window": caps.context_window,
                "max_tokens_out": caps.max_tokens_out, "cost_tier": caps.cost_tier,
                "primary_category": caps.primary_category, "tool_calling": caps.tool_calling,
                "model_version": caps.model_version
            }
        return {"model_key": model_key, "error": "Model not found in registry"}

```

## 3. Context Estimation Utilities

These utility functions help in estimating token counts for various inputs, which is crucial for selecting models with adequate context windows and avoiding errors.

```python
import json # Required for estimate_context_size if compact=False and content is dict/list

def estimate_token_count(text: str, model_type: str = "llama") -> int:
    """Estimate token count for different model types (heuristic)."""
    if not text: return 0
    char_per_token = {"llama": 3.5, "claude": 3.8, "gemma": 3.4, "default": 4.0}
    ratio = char_per_token.get(model_type, char_per_token["default"])
    return int(len(text) / ratio)

def estimate_context_size(content: Union[str, Dict, List], model_type: str = "llama", compact: bool = False) -> int:
    """Estimate token count for different content types."""
    if content is None: return 0
    if isinstance(content, str): return estimate_token_count(content, model_type)
    if isinstance(content, (dict, list)):
        # A more robust way for dict/list is to serialize to JSON and estimate
        # For simplicity here, we use a rougher estimate based on string representation
        # For compact=True, it implies minimal whitespace in JSON stringification
        try:
            if compact:
                serialized_content = json.dumps(content, separators=(',', ':'))
            else:
                serialized_content = json.dumps(content, indent=2) # More realistic for prompts
            return estimate_token_count(serialized_content, model_type)
        except TypeError: # Fallback for non-serializable content
             return estimate_token_count(str(content), model_type)
    return estimate_token_count(str(content), model_type)


def estimate_combined_size(*args, model_type: str = "llama", compact: bool = False, include_prompt_overhead: bool = True) -> int:
    """Estimate combined token count for multiple inputs."""
    total = sum(estimate_context_size(arg, model_type, compact) for arg in args)
    if include_prompt_overhead:
        prompt_overhead = {"llama": 250, "claude": 300, "gemma": 200, "default": 350}
        total += prompt_overhead.get(model_type, prompt_overhead["default"])
    return total

def check_token_limits(model_key: str, input_tokens: int, output_tokens: int, registry: ModelRegistry) -> bool:
    """Check if a model can handle the expected token counts."""
    if model_key not in registry.models and "/" not in model_key: model_key = f"groq/{model_key}"
    if model_key in registry.models:
        caps = registry.models[model_key]
        total_tokens = input_tokens + output_tokens
        if total_tokens + caps.token_limit_safety_margin > caps.context_window: return False
        if caps.max_tokens_out is not None and \
           output_tokens + (caps.token_limit_safety_margin // 2) > caps.max_tokens_out: return False
        return True
    return False # Conservative if model not found
```

## 4. Integration with LangGraph Workflow

### `ResumeState` Modifications

The main `ResumeState` TypedDict needs to be augmented:

```python
from typing import TypedDict, Annotated, Optional, Dict, Any, List
from datetime import datetime # Required for ModelTrackingMixin

# class ResumeState(TypedDict): # Assuming this is defined elsewhere
#     # ... other state fields ...
#     model_usage: Optional[Dict[str, List[Dict[str, Any]]]] # Tracks models used per phase
#     config: Optional[Dict[str, Any]]  # Configuration including provider preferences, economy_mode
```
*(This is a conceptual addition; the actual `ResumeState` definition would be in the main graph logic.)*

### `ModelTrackingMixin`

A mixin class to standardize how model usage is recorded in the `ResumeState`.

```python
class ModelTrackingMixin:
    """Mixin class to add model tracking functionality to nodes."""
    
    @staticmethod
    def record_model_usage(state: Dict, phase: str, model_key: str, registry: ModelRegistry) -> Dict:
        """Record which model was used for a particular phase."""
        if "model_usage" not in state: state["model_usage"] = {}
        if phase not in state["model_usage"]: state["model_usage"][phase] = []
        
        model_info = registry.get_model_info(model_key) # Pass registry instance
        state["model_usage"][phase].append({
            "model_key": model_key,
            "timestamp": datetime.now().isoformat(),
            **model_info
        })
        return state # Return modified state for LangGraph
```

### General Usage Pattern in Agent Nodes/Tasks

1.  **Instantiate Registry:** `model_registry = ModelRegistry()` (typically once, globally, or passed as a resource).
2.  **Define Requirements:** Create a dictionary, e.g., `model_requirements = {"required_capabilities": ["reasoning"], "min_context_window": 4000}`.
3.  **Select Model Key:** `selected_model_key = model_registry.select_model(model_requirements)`.
4.  **Get Model Instance:** `model = model_registry.get_model_with_fallbacks(selected_model_key, temperature=0.5)` (using fallbacks is generally safer).
5.  **Use Model:** Invoke the model (e.g., `model.invoke(prompt)`).
6.  **Record Usage:** `state = ModelTrackingMixin.record_model_usage(state, "current_agent_or_task_name", selected_model_key, model_registry)`.

## 5. Agent/Task-Specific Model Requirements & Invocation Examples

The following sections demonstrate how each key component (Agent Node or collection of `@task` functions) in the Resume-LM cognitive architecture would define its model requirements and invoke the Model Abstraction Layer. *(Note: `ResumeState` is often referred to as `state` or `inputs` in these conceptual snippets, and `model_registry` is assumed to be accessible).*

### 1. Input Processing Agent/Task

*   **Rationale:** Basic reasoning for parsing, can be economical. Context window depends on job description length.
```python
# In process_input_task(inputs: dict) -> dict:
# job_text = inputs.get("job_description", "")
# config = inputs.get("config", {}) # Assuming config is passed or accessible
# input_tokens = estimate_token_count(job_text, "llama")
# expected_output_tokens = min(int(input_tokens * 1.5), 4000) # Corrected int conversion

# model_requirements = {
#     "required_capabilities": ["basic_reasoning"],
#     "min_context_window": input_tokens + expected_output_tokens + 500,
#     "min_output_tokens": expected_output_tokens,
#     "economy_mode": config.get("economy_mode", True),
#     "provider": config.get("preferred_provider", "groq"),
#     "primary_category": ModelCategory.BASIC
# }
# selected_model_key = model_registry.select_model(model_requirements)
# model = model_registry.get_model(selected_model_key, temperature=0.2)
# # ... use model ...
# # state_update = ModelTrackingMixin.record_model_usage(inputs, "input_processing_task", selected_model_key, model_registry)
# # ... return updated inputs or specific results ...
```

### 2. Potential Objective Setting Agent/Task

*   **Rationale:** Requires deeper analytical capabilities and potentially long context for comparing resume and job data. Structured JSON output is beneficial.
```python
# In set_objectives_task(inputs: dict) -> dict:
# resume_text = inputs.get("base_resume", "")
# job_data = inputs.get("structured_job_data", {})
# config = inputs.get("config", {})
# input_tokens = estimate_combined_size(resume_text, job_data, model_type="llama", compact=True)
# expected_output_tokens = 6000 # Example

# model_requirements = {
#     "required_capabilities": ["reasoning", "long_context"],
#     "min_context_window": input_tokens + expected_output_tokens + 1000,
#     "min_output_tokens": expected_output_tokens,
#     "economy_mode": False, # High-quality analysis needed
#     "provider": config.get("preferred_provider", "groq"),
#     "primary_category": ModelCategory.ANALYTICAL,
#     "response_format": "json"
# }
# selected_model_key = model_registry.select_model(model_requirements)
# model = model_registry.get_model_with_fallbacks(selected_model_key, temperature=0.1)
# # ... use model ...
# # state_update = ModelTrackingMixin.record_model_usage(inputs, "set_objectives_task", selected_model_key, model_registry)
# # ... return updated inputs or specific results ...
```

### 3. Formatting Strategy Agent/Task

*   **Rationale:** Reasoning and formatting capabilities for planning layout. JSON output for guidelines.
```python
# In create_formatting_strategy_task(inputs: dict) -> dict:
# # ... estimate input_tokens, expected_output_tokens ...
# config = inputs.get("config", {})
# model_requirements = {
#     "required_capabilities": ["reasoning", "formatting"],
#     # ... min_context_window, min_output_tokens ...
#     "economy_mode": config.get("economy_mode", True),
#     "provider": config.get("preferred_provider", "groq"),
#     "primary_category": ModelCategory.REASONING,
#     "response_format": "json"
# }
# selected_model_key = model_registry.select_model(model_requirements)
# model = model_registry.get_model(selected_model_key, temperature=0.2)
# # ... use model ...
# # state_update = ModelTrackingMixin.record_model_usage(inputs, "create_formatting_strategy_task", selected_model_key, model_registry)
# # ... return updated inputs or specific results ...
```

### 4. Resume Drafting & Formatting Agent/Tasks

*   **Rationale:** Most intensive task. Needs strong creative, reasoning, long_context, and formatting capabilities. Quality is paramount. May need to switch providers if token limits are an issue. This applies to the `draft_resume_section_task` workers.
```python
# In draft_resume_section_task(inputs: dict) -> dict:
# # ... estimate input_tokens for the section, expected_output_tokens ...
# config = inputs.get("config", {}) # Config might be passed down or globally accessible
# # Provider override logic might be here or in a higher orchestrating task
# # if not check_token_limits("groq/llama-3.3-70b-versatile", input_tokens, expected_output_tokens, model_registry):
# #    provider_override = "openrouter" 

# model_requirements = {
#     "required_capabilities": ["reasoning", "long_context", "formatting", ModelCategory.CREATIVE],
#     # ... min_context_window, min_output_tokens ...
#     "economy_mode": False, # Quality is critical
#     # "provider": provider_override,
#     "primary_category": ModelCategory.CREATIVE,
#     "response_format": "json" # Assuming structured output for sections
# }
# selected_model_key = model_registry.select_model(model_requirements)
# model = model_registry.get_model_with_fallbacks(selected_model_key, temperature=0.3)
# # ... use model ...
# # state_update = ModelTrackingMixin.record_model_usage(inputs, f"draft_section_{inputs['section_name']}", selected_model_key, model_registry)
# # ... return drafted section ...
```

### 5. ATS Optimization Agent/Task

*   **Rationale:** Analytical task for LLM-enhanced feedback.
```python
# In evaluate_ats_score_task(inputs: dict) -> dict (for the LLM feedback part):
# # ... estimate input_tokens for feedback generation, expected_output_tokens ...
# config = inputs.get("config", {})
# model_requirements = {
#     "required_capabilities": [ModelCategory.ANALYTICAL],
#     # ... min_context_window, min_output_tokens ...
#     "economy_mode": False, # High quality analysis for feedback
#     "provider": config.get("preferred_provider", "groq"),
#     "primary_category": ModelCategory.ANALYTICAL,
#     "response_format": "json" # For structured feedback
# }
# selected_model_key = model_registry.select_model(model_requirements)
# model = model_registry.get_model(selected_model_key, temperature=0.1)
# # ... use model to enhance raw ATS feedback ...
# # state_update = ModelTrackingMixin.record_model_usage(inputs, "evaluate_ats_score_feedback_llm", selected_model_key, model_registry)
# # ... return ATS results ...
```

### 6. Reflexion Agent/Tool

*   **Rationale:** Deepest reasoning capabilities needed for strategic directives. Long context for analyzing previous attempts and feedback. This applies to the `strategic_reflexion_tool`.
```python
# In strategic_reflexion_tool(...)
# # ... estimate input_tokens from draft and feedback, expected_output_tokens ...
# config = {} # Config might be implicitly handled by tool context or passed if tool is an agent
# model_requirements = {
#     "required_capabilities": ["reasoning", "long_context"],
#     # ... min_context_window, min_output_tokens ...
#     "economy_mode": False, # Sophisticated reasoning needed
#     "provider": config.get("preferred_provider", "groq"),
#     "primary_category": ModelCategory.REASONING,
#     "response_format": "json"
# }
# selected_model_key = model_registry.select_model(model_requirements)
# model = model_registry.get_model_with_fallbacks(selected_model_key, temperature=0.2)
# # ... use model ...
# # No direct state update here, tool returns data. Calling agent records usage.
```

## 6. Advanced Features & Considerations

### Dynamic Provider Configuration

The `ResumeState` can include a `config` dictionary that specifies provider preferences, API keys (via environment variable names), and model preferences per category.

```python
# Example provider_config structure in ResumeState.config
# state["config"]["provider_config"] = {
#     "groq": {
#         "enabled": True, "priority": 1, "api_key_env": "GROQ_API_KEY",
#         "models": {
#             "preferred": {"comprehensive": "llama-3.3-70b-versatile", ...},
#             "fallbacks": {"llama-3.3-70b-versatile": [...], ...}
#         }
#     },
#     "openrouter": {
#         "enabled": False, "priority": 2, "api_key_env": "OPENROUTER_API_KEY",
#         # ... similar model preferences and fallbacks ...
#     }
# }
```
The `ModelRegistry` could be enhanced with a `configure_providers(provider_config)` method to dynamically update its internal `self.models` and `self.fallback_paths` based on this runtime configuration.

### Model Monitoring and Analytics

The `analyze_model_usage(state: ResumeState)` function can process the `state["model_usage"]` data to provide insights.

```python
def analyze_model_usage(state: Dict) -> Dict:
    """Analyze model usage patterns from the state."""
    model_usage = state.get("model_usage", {})
    if not model_usage: return {"error": "No model usage data found"}
    
    stats = {
        "models_used": set(), "providers_used": set(), "phase_model_mapping": {},
        "model_frequency": {}, "provider_frequency": {}
    }
    for phase, usages in model_usage.items():
        stats["phase_model_mapping"][phase] = []
        for usage in usages:
            model_key = usage.get("model_key", "unknown")
            provider = usage.get("provider", "unknown")
            stats["models_used"].add(model_key)
            stats["providers_used"].add(provider)
            stats["phase_model_mapping"][phase].append(model_key)
            stats["model_frequency"][model_key] = stats["model_frequency"].get(model_key, 0) + 1
            stats["provider_frequency"][provider] = stats["provider_frequency"].get(provider, 0) + 1
    
    stats["models_used"] = list(stats["models_used"])
    stats["providers_used"] = list(stats["providers_used"])
    return stats
```

### Handling Cold Starts

A `warm_up_models` function can pre-initialize commonly used models.

```python
def warm_up_models(frequently_used_models: List[str], registry: ModelRegistry) -> None:
    """Pre-initialize commonly used models to reduce cold start times."""
    for model_key in frequently_used_models:
        registry.get_model(model_key, temperature=0.2) # For analytical tasks
        registry.get_model(model_key, temperature=0.7) # For creative tasks
        if model_key in registry.fallback_paths:
            registry.get_model_with_fallbacks(model_key, temperature=0.2)

# Example usage:
# model_registry_instance = ModelRegistry()
# common_models = ["groq/llama-3.3-70b-versatile", "groq/llama-3.1-8b-instant"]
# warm_up_models(common_models, model_registry_instance)
```

## 7. Benefits Summary

1.  **Provider Abstraction:** Hides provider-specific details.
2.  **Future-Proofing:** Easy to add new models or providers.
3.  **Intelligent Selection:** Task-specific model choice.
4.  **Token-Aware:** Helps prevent context window overflows.
5.  **Fallback Resilience:** Improves system reliability.
6.  **Performance Optimization:** Caching and warm-up strategies.
7.  **Monitoring & Analytics:** Tracks model usage for insights.
8.  **Configuration Flexibility:** Runtime adjustments to provider preferences.

## 8. Complete Python Code Reference

This section consolidates all Python code definitions for the Model Abstraction Layer.

```python
from typing import Dict, List, Optional, Any, Union, Literal, Callable, TypedDict
from pydantic import BaseModel, Field
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_groq import ChatGroq
# from langchain_openrouter import ChatOpenRouter # Preferred for OpenRouter
# from langchain_openai import ChatOpenAI # Fallback for OpenRouter via OpenAI client
import os
import functools
import json
from enum import Enum
from datetime import datetime

# --- Enums and Pydantic Models ---
class ModelCategory(str, Enum):
    BASIC = "basic"
    REASONING = "reasoning"
    CREATIVE = "creative"
    ANALYTICAL = "analytical"
    COMPREHENSIVE = "comprehensive"

class ModelCapability(BaseModel):
    context_window: int = Field(description="Maximum context window length in tokens")
    max_tokens_out: Optional[int] = Field(description="Maximum output tokens", default=None)
    capabilities: List[str] = Field(description="List of model capabilities")
    cost_tier: str = Field(description="Relative cost category (lowest, low, medium, high)")
    provider: str = Field(description="Model provider (groq, openrouter, etc.)")
    primary_category: ModelCategory = Field(description="Primary strength category of the model")
    tool_calling: bool = Field(description="Whether model supports function/tool calling", default=False)
    streaming: bool = Field(description="Whether model supports token streaming", default=True)
    response_format: List[str] = Field(description="Supported response formats (json, xml, etc.)", default_factory=list)
    model_version: str = Field(description="Version identifier of the model")
    token_limit_safety_margin: int = Field(description="Safety margin to avoid token limit issues", default=100)

# --- ModelRegistry Class ---
class ModelRegistry:
    def __init__(self):
        self.models: Dict[str, ModelCapability] = {
            "groq/llama-3.3-70b-versatile": ModelCapability(
                context_window=128000, max_tokens_out=32768, capabilities=["reasoning", "long_context", "formatting", "tool_use"],
                cost_tier="high", provider="groq", primary_category=ModelCategory.COMPREHENSIVE, tool_calling=True,
                streaming=True, response_format=["json", "xml", "markdown", "yaml"], model_version="3.3"
            ),
            "groq/llama-3.1-8b-instant": ModelCapability(
                context_window=128000, max_tokens_out=8192, capabilities=["long_context", "basic_reasoning"],
                cost_tier="low", provider="groq", primary_category=ModelCategory.BASIC, tool_calling=False,
                streaming=True, response_format=["markdown"], model_version="3.1"
            ),
            "groq/gemma2-9b-it": ModelCapability(
                context_window=8192, max_tokens_out=8192, capabilities=["reasoning", "instruction_following"],
                cost_tier="low", provider="groq", primary_category=ModelCategory.REASONING, tool_calling=False,
                streaming=True, response_format=["markdown"], model_version="2"
            ),
            "groq/llama3-70b-8192": ModelCapability(
                context_window=8192, max_tokens_out=8192, capabilities=["reasoning", "formatting"],
                cost_tier="medium", provider="groq", primary_category=ModelCategory.REASONING, tool_calling=False,
                streaming=True, response_format=["markdown"], model_version="3"
            ),
            "groq/llama3-8b-8192": ModelCapability(
                context_window=8192, max_tokens_out=2048, capabilities=["basic_reasoning"],
                cost_tier="lowest", provider="groq", primary_category=ModelCategory.BASIC, tool_calling=False,
                streaming=True, response_format=["markdown"], model_version="3"
            ),
            "openrouter/anthropic/claude-3-5-sonnet": ModelCapability(
                context_window=200000, max_tokens_out=32768, capabilities=["reasoning", "long_context", "formatting", "tool_use"],
                cost_tier="high", provider="openrouter", primary_category=ModelCategory.COMPREHENSIVE, tool_calling=True,
                streaming=True, response_format=["json", "xml", "markdown", "yaml"], model_version="3.5"
            ),
            "openrouter/meta-llama/llama-3-70b-instruct": ModelCapability(
                context_window=128000, max_tokens_out=16384, capabilities=["reasoning", "long_context", "formatting"],
                cost_tier="medium", provider="openrouter", primary_category=ModelCategory.REASONING, tool_calling=False,
                streaming=True, response_format=["markdown"], model_version="3"
            )
        }
        self._model_instances = {}
        self.fallback_paths = {
            "groq/llama-3.3-70b-versatile": ["groq/llama3-70b-8192", "groq/llama-3.1-8b-instant"],
            "groq/llama-3.1-8b-instant": ["groq/llama3-8b-8192", "groq/gemma2-9b-it"],
            # ... other fallbacks from your example ...
             "openrouter/anthropic/claude-3-5-sonnet": ["openrouter/meta-llama/llama-3-70b-instruct", "groq/llama-3.3-70b-versatile"],
            "openrouter/meta-llama/llama-3-70b-instruct": ["groq/llama-3.3-70b-versatile", "groq/llama3-70b-8192"]
        }

    def get_model(self, model_key: str, temperature: float = 0.7) -> BaseChatModel:
        cache_key = f"{model_key}_{temperature}"
        if cache_key not in self._model_instances:
            if "/" not in model_key: provider, model_name = "groq", model_key
            else: provider, model_name = model_key.split("/", 1)
            
            if provider == "groq":
                self._model_instances[cache_key] = ChatGroq(
                    model_name=model_name, temperature=temperature, max_retries=3, request_timeout=60
                )
            elif provider == "openrouter":
                try:
                    from langchain_openrouter import ChatOpenRouter
                    self._model_instances[cache_key] = ChatOpenRouter(
                        model_name=model_name, temperature=temperature, max_retries=3, request_timeout=60
                    )
                except ImportError:
                    from langchain_openai import ChatOpenAI # Ensure this is installed if used
                    self._model_instances[cache_key] = ChatOpenAI(
                        model_name=model_name, temperature=temperature,
                        openai_api_base="https://openrouter.ai/api/v1",
                        openai_api_key=os.environ.get("OPENROUTER_API_KEY", ""),
                        max_retries=3
                    )
            else: raise ValueError(f"Unsupported provider: {provider}")
        return self._model_instances[cache_key]

    def get_model_with_fallbacks(self, primary_model_key: str, temperature: float = 0.7) -> BaseChatModel:
        primary_model = self.get_model(primary_model_key, temperature)
        if primary_model_key in self.fallback_paths:
            fallback_models = [self.get_model(name, temperature) for name in self.fallback_paths[primary_model_key]]
            return primary_model.with_fallbacks(fallback_models)
        return primary_model

    def select_model(self, requirements: Dict[str, Any]) -> str:
        candidates = list(self.models.keys())
        if "provider" in requirements: candidates = [m for m in candidates if self.models[m].provider == requirements["provider"]]
        if "required_capabilities" in requirements: candidates = [m for m in candidates if all(cap in self.models[m].capabilities for cap in requirements["required_capabilities"])]
        if "primary_category" in requirements: candidates = [m for m in candidates if self.models[m].primary_category == requirements["primary_category"]]
        if "min_context_window" in requirements: candidates = [m for m in candidates if self.models[m].context_window >= requirements["min_context_window"]]
        if "min_output_tokens" in requirements: candidates = [m for m in candidates if self.models[m].max_tokens_out is None or self.models[m].max_tokens_out >= requirements["min_output_tokens"]]
        if requirements.get("requires_tool_calling", False): candidates = [m for m in candidates if self.models[m].tool_calling]
        if "response_format" in requirements: candidates = [m for m in candidates if requirements["response_format"] in self.models[m].response_format]
        
        cost_rank = {"lowest": 0, "low": 1, "medium": 2, "high": 3}
        sort_reverse = not requirements.get("economy_mode", False)
        candidates.sort(key=lambda m: cost_rank[self.models[m].cost_tier], reverse=sort_reverse)
        
        return candidates[0] if candidates else "groq/llama-3.3-70b-versatile"

    def get_model_info(self, model_key: str) -> Dict[str, Any]:
        if model_key not in self.models and "/" not in model_key: model_key = f"groq/{model_key}"
        if model_key in self.models:
            caps = self.models[model_key]
            return {"model_key": model_key, "provider": caps.provider, "context_window": caps.context_window,
                    "max_tokens_out": caps.max_tokens_out, "cost_tier": caps.cost_tier,
                    "primary_category": caps.primary_category, "tool_calling": caps.tool_calling,
                    "model_version": caps.model_version}
        return {"model_key": model_key, "error": "Model not found in registry"}

# --- Context Estimation Utilities ---
def estimate_token_count(text: str, model_type: str = "llama") -> int:
    if not text: return 0
    char_per_token = {"llama": 3.5, "claude": 3.8, "gemma": 3.4, "default": 4.0}
    ratio = char_per_token.get(model_type, char_per_token["default"])
    return int(len(text) / ratio)

def estimate_context_size(content: Union[str, Dict, List], model_type: str = "llama", compact: bool = False) -> int:
    if content is None: return 0
    if isinstance(content, str): return estimate_token_count(content, model_type)
    if isinstance(content, (dict, list)):
        try:
            if compact: serialized_content = json.dumps(content, separators=(',', ':'))
            else: serialized_content = json.dumps(content, indent=2)
            return estimate_token_count(serialized_content, model_type)
        except TypeError: return estimate_token_count(str(content), model_type)
    return estimate_token_count(str(content), model_type)

def estimate_combined_size(*args, model_type: str = "llama", compact: bool = False, include_prompt_overhead: bool = True) -> int:
    total = sum(estimate_context_size(arg, model_type, compact) for arg in args)
    if include_prompt_overhead:
        prompt_overhead = {"llama": 250, "claude": 300, "gemma": 200, "default": 350}
        total += prompt_overhead.get(model_type, prompt_overhead["default"])
    return total

def check_token_limits(model_key: str, input_tokens: int, output_tokens: int, registry: ModelRegistry) -> bool:
    if model_key not in registry.models and "/" not in model_key: model_key = f"groq/{model_key}"
    if model_key in registry.models:
        caps = registry.models[model_key]
        total_tokens = input_tokens + output_tokens
        if total_tokens + caps.token_limit_safety_margin > caps.context_window: return False
        if caps.max_tokens_out is not None and \
           output_tokens + (caps.token_limit_safety_margin // 2) > caps.max_tokens_out: return False
        return True
    return False

# --- ModelTrackingMixin ---
class ModelTrackingMixin:
    @staticmethod
    def record_model_usage(state: Dict, phase: str, model_key: str, registry: ModelRegistry) -> Dict:
        if "model_usage" not in state: state["model_usage"] = {}
        if phase not in state["model_usage"]: state["model_usage"][phase] = []
        model_info = registry.get_model_info(model_key)
        state["model_usage"][phase].append({
            "model_key": model_key, "timestamp": datetime.now().isoformat(), **model_info
        })
        return state

# --- ResumeState (Conceptual Placeholder) ---
# class ResumeState(TypedDict):
#     job_description: str
#     base_resume: str
#     structured_job_data: Optional[dict]
#     current_phase: str
#     model_usage: Optional[Dict[str, List[Dict[str, Any]]]] 
#     config: Optional[Dict[str, Any]]
#     # Other state fields...

# --- Example: create_resume_lm_graph (Conceptual Placeholder) ---
# def create_resume_lm_graph(provider_config=None):
#     from langgraph.graph import StateGraph, END # Assuming StateGraph is imported
#     resume_graph = StateGraph(ResumeState)
#     model_registry_instance = ModelRegistry() # Create instance
#     if provider_config:
#         # model_registry_instance.configure_providers(provider_config) # If implemented
#         pass
    
#     # Add nodes (using functools.partial to pass model_registry_instance if needed, or access globally)
#     # resume_graph.add_node("input_processing", input_processing_node_wrapper_with_registry)
#     # ... add other nodes and edges ...
#     return resume_graph.compile()

# --- Advanced Features (Conceptual Placeholders) ---
# def analyze_model_usage(state: Dict) -> Dict: # Implementation as above
# def warm_up_models(frequently_used_models: List[str], registry: ModelRegistry) -> None: # Implementation as above
```

This comprehensive Model Abstraction Layer provides a solid foundation for intelligent and flexible LLM utilization within the Resume-LM's LangGraph backend.
