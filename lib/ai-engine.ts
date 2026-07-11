import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { AIModelConfig } from './types';

export interface ApiKeys {
  openai?: string;
  anthropic?: string;
  google?: string;
}

/**
 * Creates the appropriate AI SDK language model instance based on the provider config.
 */
export function createLanguageModel(modelConfig: AIModelConfig, apiKeys: ApiKeys) {
  switch (modelConfig.provider) {
    case 'openai': {
      const key = apiKeys.openai || process.env.OPENAI_API_KEY;
      if (!key) {
        throw new Error('OpenAI API key is required. Add it in settings or environment variables.');
      }
      const openai = createOpenAI({ apiKey: key });
      return openai(modelConfig.modelId);
    }

    case 'anthropic': {
      const key = apiKeys.anthropic || process.env.ANTHROPIC_API_KEY;
      if (!key) {
        throw new Error('Anthropic API key is required. Add it in settings or environment variables.');
      }
      const anthropic = createAnthropic({ apiKey: key });
      return anthropic(modelConfig.modelId);
    }

    case 'google': {
      const key = apiKeys.google || process.env.GOOGLE_API_KEY;
      if (!key) {
        throw new Error('Google/Gemini API key is required. Add it in settings or environment variables.');
      }
      const google = createGoogleGenerativeAI({ apiKey: key });
      return google(modelConfig.modelId);
    }

    default:
      throw new Error(`Unsupported AI provider: ${(modelConfig as any).provider}`);
  }
}
