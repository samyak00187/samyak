export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';
export type MessageStatus = 'pending' | 'streaming' | 'complete' | 'error' | 'cancelled';

export interface AIMessage {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  status: MessageStatus;
  metadata?: Record<string, string>;
}

export interface AIRequest {
  conversationId: string;
  messages: AIMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  memoryContext?: string;
}

export interface AIResponse { content: string; model: string; }
export interface AIStreamChunk { content?: string; done?: boolean; type?: string; state?: string; message?: string; plan?: unknown; step?: unknown; tool?: string; result?: unknown; }
export interface ModelInfo { provider: string; model: string; contextWindow: number | null; configured: boolean; }
