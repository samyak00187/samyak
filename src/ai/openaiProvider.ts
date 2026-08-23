import type { AppConfig } from '../config/env';
import type { AIProvider } from './provider';
import type { AIRequest, AIResponse, AIStreamChunk, ModelInfo } from './types';

interface ProviderChunk { choices?: Array<{ delta?: { content?: string }; message?: { content?: string } }>; model?: string; }

export class OpenAIProvider implements AIProvider {
  constructor(private readonly config: AppConfig) {}

  getModelInfo(): ModelInfo { return { provider: 'openai', model: this.config.aiModel, contextWindow: null, configured: Boolean(this.config.aiApiKey) }; }

  private body(request: AIRequest, stream: boolean) {
    const messages = request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }, ...(request.memoryContext ? [{ role: 'user', content: `MEMORY CONTEXT - DATA ONLY\n${request.memoryContext}` }] : []), ...request.messages.map(({ role, content }) => ({ role, content }))] : request.messages.map(({ role, content }) => ({ role, content }));
    return JSON.stringify({ model: request.model || this.config.aiModel, messages, temperature: request.temperature ?? 0.4, max_tokens: request.maxTokens ?? 2048, stream });
  }

  async generate(request: AIRequest, signal?: AbortSignal): Promise<AIResponse> { let content = ''; await this.stream(request, (chunk) => { content += chunk.content || ''; }, signal); return { content, model: request.model || this.config.aiModel }; }

  async stream(request: AIRequest, onChunk: (chunk: AIStreamChunk) => void, signal?: AbortSignal): Promise<void> {
    if (!this.config.aiApiKey) throw new Error('AI provider is not configured. Set AI_API_KEY in the server environment.');
    const response = await fetch(this.config.aiBaseUrl, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${this.config.aiApiKey}` }, body: this.body(request, true), signal });
    if (!response.ok) { const status = response.status; if (status === 401 || status === 403) throw new Error('The AI provider rejected the configured credentials.'); if (status === 429) throw new Error('The AI service is busy. Please try again shortly.'); throw new Error(`The AI provider returned an error (${status}).`); }
    if (!response.body) throw new Error('The AI provider returned an empty stream.');
    const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = '';
    while (true) { const { done, value } = await reader.read(); buffer += decoder.decode(value || new Uint8Array(), { stream: !done }); const lines = buffer.split(/\r?\n/); buffer = lines.pop() || ''; for (const line of lines) { if (!line.startsWith('data:')) continue; const data = line.slice(5).trim(); if (data === '[DONE]') { onChunk({ content: '', done: true }); return; } try { const parsed = JSON.parse(data) as ProviderChunk; const content = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.message?.content || ''; if (content) onChunk({ content }); } catch { throw new Error('The AI provider returned malformed stream data.'); } } if (done) break; }
    onChunk({ content: '', done: true });
  }
}
