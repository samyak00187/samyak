import type { RankedMemory, MemoryContext } from './types';

export class MemoryContextBuilder {
  build(query: string, memories: RankedMemory[], maxCharacters = 6_000): MemoryContext { const selected: RankedMemory[] = []; let size = 0; for (const item of memories) { const nextSize = item.memory.content.length + 4; if (size + nextSize > maxCharacters) break; selected.push(item); size += nextSize; } const formatted = selected.length ? `<memory_context>\n${selected.map((item) => `- ${item.memory.content}`).join('\n')}\n</memory_context>` : ''; return { query, memories: selected, formatted }; }
}
