import type { AIRequest, AIResponse, AIStreamChunk, ModelInfo } from './types';

export interface AIProvider {
  generate(request: AIRequest, signal?: AbortSignal): Promise<AIResponse>;
  stream(request: AIRequest, onChunk: (chunk: AIStreamChunk) => void, signal?: AbortSignal): Promise<void>;
  getModelInfo(): ModelInfo;
}
