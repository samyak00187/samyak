import type { AIMessage, AIStreamChunk } from '../ai/types';

export interface ChatStream { response: Response; reader: ReadableStreamDefaultReader<Uint8Array>; }
export async function streamChat(conversationId: string, messages: AIMessage[], signal: AbortSignal): Promise<ChatStream> {
  const response = await fetch(`${import.meta.env.VITE_CORE_URL || 'http://localhost:4174'}/api/chat`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ conversationId, messages }), signal });
  if (!response.ok) { const body = await response.json().catch(() => ({})) as { error?: string }; throw new Error(body.error || `Chat service returned ${response.status}.`); }
  if (!response.body) throw new Error('Chat service returned an empty stream.');
  return { response, reader: response.body.getReader() };
}

export async function* readChatStream(reader: ReadableStreamDefaultReader<Uint8Array>): AsyncGenerator<AIStreamChunk> {
  const decoder = new TextDecoder(); let buffer = '';
  while (true) { const { done, value } = await reader.read(); buffer += decoder.decode(value || new Uint8Array(), { stream: !done }); const lines = buffer.split(/\r?\n/); buffer = lines.pop() || ''; for (const line of lines) { if (!line.startsWith('data:')) continue; const payload = JSON.parse(line.slice(5).trim()) as AIStreamChunk & { error?: string }; if (payload.error) throw new Error(payload.error); yield payload; } if (done) return; }
}
