import type { EmbeddingProvider, MemorySearchOptions, RankedMemory, VectorStore, MemoryStoreAdapter } from './types';
import { MemoryRanker } from './memoryRanker';

export class MemoryRetriever {
  private readonly ranker = new MemoryRanker();
  constructor(private readonly store: MemoryStoreAdapter, private readonly embedding?: EmbeddingProvider, private readonly vectors?: VectorStore) {}
  async retrieve(query: string, options: MemorySearchOptions = {}): Promise<RankedMemory[]> { const memories = await this.store.search(options); if (this.embedding && this.vectors) { try { const vector = await this.embedding.embed(query); const matches = await this.vectors.search(vector, options.limit || 5); const byId = new Map(memories.map((memory) => [memory.id, memory])); return matches.map((match) => ({ memory: byId.get(match.memoryId), score: match.similarity, similarity: match.similarity })).filter((item) => item.memory) as RankedMemory[]; } catch { /* keyword fallback below */ } } return this.ranker.rank(memories, query, options.limit || 5); }
}
