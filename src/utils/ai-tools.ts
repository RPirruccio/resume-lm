import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { createGroq } from '@ai-sdk/groq';
import { LanguageModelV1 } from 'ai';

export type ApiKey = {
  service: string;
  key: string;
  addedAt: string;
};

export type AIConfig = {
  model: string;
  apiKeys: Array<ApiKey>;
};

/**
 * Initializes an AI client based on the provided configuration.
 * API keys are expected to be in config.apiKeys (typically from localStorage).
 * Falls back to a 'no-model' client if no config or keys are found.
 */
export function initializeAIClient(config?: AIConfig): LanguageModelV1 {
  // Attempt to use user-provided config first
  if (config && config.apiKeys && config.apiKeys.length > 0) {
    const { model, apiKeys } = config;
    // console.log(`AIClient: Initializing model "${model}" with user-provided keys.`);

    if (model.startsWith('claude')) {
      const anthropicKey = apiKeys.find(k => k.service === 'anthropic')?.key;
      if (!anthropicKey) {
        console.warn("AIClient: Anthropic model selected but no key found in user config. Falling back to default.");
        // Fallback logic will be handled below if this path is taken
      } else {
        return createAnthropic({ apiKey: anthropicKey })(model) as LanguageModelV1;
      }
    }

    if (model.startsWith('gemini')) {
      const googleKey = apiKeys.find(k => k.service === 'google' || k.service === 'gemini')?.key;
      if (!googleKey) {
        console.warn("AIClient: Gemini model selected but no key found in user config. Falling back to default.");
      } else {
        return createGoogleGenerativeAI({ apiKey: googleKey })(model) as LanguageModelV1;
      }
    }
    
    if (model.startsWith('deepseek')) {
      const deepseekKey = apiKeys.find(k => k.service === 'deepseek')?.key;
      if (!deepseekKey) {
        console.warn("AIClient: DeepSeek model selected but no key found in user config. Falling back to default.");
      } else {
        return createDeepSeek({ apiKey: deepseekKey })(model) as LanguageModelV1;
      }
    }
    
    if (model.startsWith('gemma')) {
      const groqKey = apiKeys.find(k => k.service === 'groq')?.key;
      if (!groqKey) {
        console.warn("AIClient: Groq/Gemma model selected but no key found in user config. Falling back to default.");
      } else {
        return createGroq({ apiKey: groqKey })(model) as LanguageModelV1;
      }
    }
    
    // Default to OpenAI if model isn't claude, gemini, deepseek, or gemma from user config
    const openaiKey = apiKeys.find(k => k.service === 'openai')?.key;
    if (openaiKey) {
      return createOpenAI({ apiKey: openaiKey })(model) as LanguageModelV1;
    }
    // If specific model key not found in user config, fall through to general fallback
    console.warn(`AIClient: Key for selected model "${model}" not found in user config. Falling back to default OpenAI.`);
  }

  // Fallback 1: Try Google Gemini with environment variable or user config
  const googleAPIKeyFromEnv = process.env.GOOGLE_API_KEY;
  const userGoogleConfig = (config && config.apiKeys && config.apiKeys.find(k => k.service === 'google'));
  const geminiModelId = (config?.model?.startsWith('gemini')) ? config.model : 'gemini-1.5-pro-latest'; // Use specified Gemini or default

  if (userGoogleConfig?.key) {
    console.log(`AIClient: Using user-configured Google Gemini (${geminiModelId}) with provided API key.`);
    return createGoogleGenerativeAI({ apiKey: userGoogleConfig.key })(geminiModelId) as LanguageModelV1;
  } else if (googleAPIKeyFromEnv) {
    console.log(`AIClient: Using Google Gemini (${geminiModelId}) with GOOGLE_API_KEY from environment.`);
    return createGoogleGenerativeAI({ apiKey: googleAPIKeyFromEnv })(geminiModelId) as LanguageModelV1;
  }

  // Fallback 2: Use OpenAI with environment variable if no user config or specific key missing for other models
  const defaultOpenAIKey = process.env.OPENAI_API_KEY;
  if (defaultOpenAIKey) {
    console.log("AIClient: No Google Gemini config. Using default OpenAI (gpt-3.5-turbo) with OPENAI_API_KEY from environment.");
    return createOpenAI({ apiKey: defaultOpenAIKey })('gpt-3.5-turbo') as LanguageModelV1;
  }

  // Final fallback: 'no-model' client if no keys are available at all
  console.warn("AIClient: No user API keys configured and no GOOGLE_API_KEY or OPENAI_API_KEY in env. Returning 'no-model' client.");
  return createOpenAI({ apiKey: '' })('no-model') as LanguageModelV1;
}

// Original logic for reference if needed for specific model key finding:
/*
  const { model, apiKeys } = config;
  
  // console.log(`AIClient: Initializing model "${model}" with user-provided keys.`);

  if (model.startsWith('claude')) {
    const anthropicKey = apiKeys.find(k => k.service === 'anthropic')?.key;
    if (!anthropicKey) throw new Error('Anthropic API key not found');
    return createAnthropic({ apiKey: anthropicKey })(model) as LanguageModelV1;
  }

  if (model.startsWith('gemini')) {
    const googleKey = apiKeys.find(k => k.service === 'google' || k.service === 'gemini')?.key; // Allow 'gemini' as service name
    if (!googleKey) throw new Error('Google/Gemini API key not found in user settings.');
    return createGoogleGenerativeAI({ apiKey: googleKey })(model) as LanguageModelV1;
  }
  
  if (model.startsWith('deepseek')) {
    const deepseekKey = apiKeys.find(k => k.service === 'deepseek')?.key;
    if (!deepseekKey) throw new Error('DeepSeek API key not found in user settings.');
    return createDeepSeek({ apiKey: deepseekKey })(model) as LanguageModelV1;
  }
  
  if (model.startsWith('gemma')) {
    const groqKey = apiKeys.find(k => k.service === 'groq')?.key;
    if (!groqKey) throw new Error('Groq API key not found in user settings.');
    return createGroq({ apiKey: groqKey })(model) as LanguageModelV1;
  }
  
  // Default to OpenAI if model isn't claude, gemini, deepseek, or gemma
  const openaiKey = apiKeys.find(k => k.service === 'openai')?.key;
  if (!openaiKey) {
    // console.warn(`AIClient: OpenAI API key not found for model "${model}". Returning 'no-model' client.`);
    // Fallback to a 'no-model' client if the primary key for the selected model type is missing
    // This prevents errors if a user selects e.g. an OpenAI model but hasn't set an OpenAI key.
    return createOpenAI({ apiKey: '' })('no-model') as LanguageModelV1;
    // Alternatively, throw: throw new Error(`OpenAI API key not found in user settings for model ${model}.`);
  }
  return createOpenAI({ apiKey: openaiKey })(model) as LanguageModelV1;
}
*/
