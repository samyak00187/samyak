import type { AIMessage } from '../ai/types';

export interface Conversation { id: string; title: string; createdAt: string; updatedAt: string; messages: AIMessage[]; }
const STORAGE_KEY = 'jarvis.conversations.v1';

export class ConversationManager {
  load(): Conversation[] { try { const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); return Array.isArray(value) ? value as Conversation[] : []; } catch { return []; } }
  save(conversations: Conversation[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations)); }
  create(): Conversation { const now = new Date().toISOString(); return { id: crypto.randomUUID(), title: 'New conversation', createdAt: now, updatedAt: now, messages: [] }; }
  titleFor(content: string): string { const words = content.replace(/[^\w\s-]/g, '').trim().split(/\s+/).slice(0, 5); return words.length ? words.join(' ') : 'New conversation'; }
  upsert(conversation: Conversation) { const conversations = this.load().filter((item) => item.id !== conversation.id); this.save([conversation, ...conversations]); }
  remove(id: string) { this.save(this.load().filter((item) => item.id !== id)); }
  search(query: string): Conversation[] { const normalized = query.trim().toLowerCase(); return this.load().filter((item) => !normalized || item.title.toLowerCase().includes(normalized) || item.messages.some((message) => message.content.toLowerCase().includes(normalized))); }
}
