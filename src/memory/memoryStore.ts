import type { Memory, MemorySearchOptions } from './types';

const STORAGE_KEY = 'jarvis.memories.v1';
export class MemoryStore {
  private async read(): Promise<Memory[]> { try { const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); return Array.isArray(value) ? value as Memory[] : []; } catch { return []; } }
  private async write(memories: Memory[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(memories)); }
  async create(memory: Memory): Promise<Memory> { const memories = await this.read(); memories.unshift(memory); await this.write(memories); return memory; }
  async get(id: string): Promise<Memory | undefined> { return (await this.read()).find((memory) => memory.id === id && memory.status !== 'deleted'); }
  async update(id: string, patch: Partial<Memory>): Promise<Memory | undefined> { const memories = await this.read(); const index = memories.findIndex((memory) => memory.id === id); if (index < 0) return undefined; memories[index] = { ...memories[index], ...patch, id, updatedAt: new Date().toISOString() }; await this.write(memories); return memories[index]; }
  async delete(id: string): Promise<boolean> { const memory = await this.get(id); if (!memory) return false; await this.update(id, { status: 'deleted' }); return true; }
  async search(options: MemorySearchOptions = {}): Promise<Memory[]> { return (await this.read()).filter((memory) => memory.status === 'active' && (!options.type || memory.type === options.type) && (!options.scope || memory.scope === options.scope)); }
  async list(): Promise<Memory[]> { return (await this.read()).filter((memory) => memory.status !== 'deleted'); }
  async count(): Promise<number> { return (await this.list()).length; }
  async clear(): Promise<void> { const memories = await this.read(); await this.write(memories.map((memory) => ({ ...memory, status: 'deleted' as const, updatedAt: new Date().toISOString() }))); }
  async export(): Promise<{ version: 1; memories: Memory[] }> { return { version: 1, memories: await this.list() }; }
  async import(data: unknown): Promise<number> { if (!data || typeof data !== 'object' || !Array.isArray((data as { memories?: unknown }).memories)) throw new Error('Invalid memory export.'); let imported = 0; for (const memory of (data as { memories: unknown[] }).memories) { if (memory && typeof memory === 'object' && typeof (memory as Memory).content === 'string') { await this.create(memory as Memory); imported += 1; } } return imported; }
}
