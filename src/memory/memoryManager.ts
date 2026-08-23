import type { AIMessage } from '../ai/types';
import type { Memory, MemoryCandidate, MemorySearchOptions, MemoryContext, MemoryType, MemoryStoreAdapter } from './types';
import { MemoryExtractor } from './memoryExtractor';
import { MemoryPolicy } from './memoryPolicy';
import { MemoryRetriever } from './memoryRetriever';
import { MemoryContextBuilder } from './memoryContextBuilder';
import { MemoryStore } from './memoryStore';

export class MemoryManager {
  readonly store: MemoryStoreAdapter;
  private readonly extractor: MemoryExtractor;
  private readonly policy: MemoryPolicy;
  private readonly retriever: MemoryRetriever;
  private readonly contextBuilder = new MemoryContextBuilder();
  private enabled = true;
  private privateMode = false;
  constructor(store: MemoryStoreAdapter = new MemoryStore(), policy = new MemoryPolicy()) { this.store = store; this.policy = policy; this.extractor = new MemoryExtractor(policy); this.retriever = new MemoryRetriever(store); }
  setEnabled(enabled: boolean) { this.enabled = enabled; }
  setPrivateMode(privateMode: boolean) { this.privateMode = privateMode; }
  isEnabled() { return this.enabled && !this.privateMode; }
  async save(candidate: MemoryCandidate): Promise<{ memory?: Memory; blocked?: string }> { if (!this.isEnabled()) return { blocked: 'Memory is disabled.' }; if (!this.policy.canStore(candidate)) return { blocked: 'That looks like sensitive information, so I will not save it to memory.' }; const memories = await this.store.list(); const existing = memories.find((memory) => memory.content.toLowerCase() === candidate.content.toLowerCase() && memory.type === candidate.type); if (existing) return { memory: await this.store.update(existing.id, { ...candidate, status: 'active' }) }; const languagePreference = (content: string) => /prefer/.test(content) && /python|javascript|typescript|java|rust|go/.test(content); const conflict = memories.find((memory) => memory.type === candidate.type && memory.content.toLowerCase().includes('prefer') && candidate.content.toLowerCase().includes('prefer') && languagePreference(memory.content.toLowerCase()) && languagePreference(candidate.content.toLowerCase()) && memory.content.toLowerCase() !== candidate.content.toLowerCase()); if (conflict) await this.store.update(conflict.id, { status: 'superseded' }); const now = new Date().toISOString(); return { memory: await this.store.create({ ...candidate, id: crypto.randomUUID(), createdAt: now, updatedAt: now, status: 'active', embeddingStatus: 'pending' }) }; }
  async extractAndSave(message: AIMessage): Promise<Memory[]> { if (!this.isEnabled()) return []; const saved: Memory[] = []; for (const candidate of this.extractor.extract(message)) { const result = await this.save(candidate); if (result.memory) saved.push(result.memory); } return saved; }
  async retrieve(query: string, options: MemorySearchOptions = {}): Promise<MemoryContext> { if (!this.isEnabled()) return this.contextBuilder.build(query, []); return this.contextBuilder.build(query, await this.retriever.retrieve(query, options)); }
  async forgetMatching(query: string): Promise<number> { const memories = await this.store.list(); const terms = query.toLowerCase().split(/\W+/).filter(Boolean); let removed = 0; for (const memory of memories) if (terms.every((term) => memory.content.toLowerCase().includes(term))) if (await this.store.delete(memory.id)) removed += 1; return removed; }
  async clear(): Promise<void> { if (!this.isEnabled()) return; await this.store.clear(); }
  async search(query: string, type?: MemoryType) { return this.retriever.retrieve(query, { type, limit: 25 }); }
}
