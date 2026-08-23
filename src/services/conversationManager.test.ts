import { beforeEach, describe, expect, it } from 'vitest';
import { ConversationManager } from './conversationManager';

beforeEach(() => localStorage.clear());

describe('ConversationManager', () => {
  it('persists, searches, and removes conversations', () => {
    const manager = new ConversationManager(); const conversation = manager.create(); conversation.title = 'LangGraph Explanation'; conversation.messages = [{ id: 'message-1', conversationId: conversation.id, role: 'user', content: 'Explain LangGraph', timestamp: new Date().toISOString(), status: 'complete' }];
    manager.upsert(conversation); expect(manager.search('langgraph')).toHaveLength(1); manager.remove(conversation.id); expect(manager.load()).toHaveLength(0);
  });

  it('derives a short local title', () => { expect(new ConversationManager().titleFor('Explain the architecture of a streaming AI chat engine')).toBe('Explain the architecture of a'); });
});
