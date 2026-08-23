import type { AppConfig } from '../config/env';
import type { AIProvider } from './provider';
import { OpenAIProvider } from './openaiProvider';

export function createProvider(config: AppConfig): AIProvider {
  if (config.aiProvider === 'openai') return new OpenAIProvider(config);
  throw new Error(`Unsupported AI provider: ${config.aiProvider}`);
}
