import type { AIMessage, AIStreamChunk } from '../ai/types';
import { readChatStream, streamChat } from './chatClient';

export class ChatController {
  async send(conversationId: string, messages: AIMessage[], onChunk: (chunk: AIStreamChunk) => void, signal: AbortSignal) {
    const stream = await streamChat(conversationId, messages, signal);
    for await (const chunk of readChatStream(stream.reader)) onChunk(chunk);
  }
}
