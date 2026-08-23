import { describe, expect, it, vi } from 'vitest';
import { OpenAIProvider } from './openaiProvider';
import type { AppConfig } from '../config/env';

const config: AppConfig = { appName: 'JARVIS', logLevel: 'info', aiProvider: 'openai', aiModel: 'test-model', aiApiKey: 'secret', aiBaseUrl: 'https://example.test/chat' };
const request = { conversationId: 'conversation-1', messages: [], systemPrompt: 'Be concise.' };

describe('OpenAIProvider', () => {
  it('rejects an unconfigured provider without making a request', async () => {
    const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
    await expect(new OpenAIProvider({ ...config, aiApiKey: '' }).generate(request)).rejects.toThrow('not configured');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('parses streamed content and completion', async () => {
    const stream = new ReadableStream<Uint8Array>({ start(controller) { const encoder = new TextEncoder(); controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n')); controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":" JARVIS"}}]}\n\ndata: [DONE]\n\n')); controller.close(); } });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(stream, { status: 200 })));
    const chunks: string[] = []; await new OpenAIProvider(config).stream(request, (chunk) => chunks.push(chunk.content || ''));
    expect(chunks).toEqual(['Hello', ' JARVIS', '']);
  });

  it('maps rate limits to a user-safe error', async () => { vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 429 }))); await expect(new OpenAIProvider(config).generate(request)).rejects.toThrow('busy'); });
});
