/**
 * AI Configuration Module
 * Returns appropriate AI API configuration based on deployment region
 */

type AIProvider = 'qwen' | 'mistral';

interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  baseURL: string;
  modelName: string;
  searchModelName?: string;
}

/**
 * Get AI configuration based on deployment region
 */
export function getAIConfig(): AIConfig {
  const region = process.env.NEXT_PUBLIC_DEPLOYMENT_REGION || 'CN';

  if (region === 'INTL') {
    return {
      provider: 'mistral',
      apiKey: process.env.MISTRAL_API_KEY || '',
      baseURL: process.env.MISTRAL_BASE_URL || 'https://api.mistral.ai/v1',
      modelName: process.env.MISTRAL_MODEL_NAME || 'mistral-large-latest',
    };
  }

  // CN region - use existing Qwen configuration
  return {
    provider: 'qwen',
    apiKey: process.env.OPENAI_API_KEY || '',
    baseURL: process.env.OPENAI_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    modelName: process.env.AI_MODEL_NAME || 'qwen-max',
    searchModelName: process.env.AI_SEARCH_MODEL_NAME || 'qwen-turbo',
  };
}
