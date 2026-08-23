import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Memory, MemorySearchOptions } from './types';
import type { MemoryStoreAdapter } from './types';

export class FileMemoryStore implements MemoryStoreAdapter {
  private readonly filePath: string;
  private queue: Promise<unknown> = Promise.resolve();
  constructor(filePath = path.resolve(process.env.JARVIS_MEMORY_FILE || '.jarvis-memory.json')) { this.filePath = filePath; }
  private async read(): Promise<Memory[]> { try { const value: unknown = JSON.parse(await fs.readFile(this.filePath, 'utf8')); return Array.isArray(value) ? value as Memory[] : []; } catch { return []; } }
  private async write(memories: Memory[]) { await fs.mkdir(path.dirname(this.filePath), { recursive: true }); await fs.writeFile(this.filePath, JSON.stringify(memories, null, 2), 'utf8'); }
  private async serialized<T>(action: () => Promise<T>): Promise<T> { const result = this.queue.then(action, action); this.queue = result.then(() => undefined, () => undefined); return result; }
  async create(memory: Memory) { return this.serialized(async () => { const memories = await this.read(); memories.unshift(memory); await this.write(memories); return memory; }); }
  async get(id: string) { return (await this.read()).find((memory) => memory.id === id && memory.status !== 'deleted'); }
  async update(id: string, patch: Partial<Memory>) { return this.serialized(async () => { const memories = await this.read(); const index = memories.findIndex((memory) => memory.id === id); if (index < 0) return undefined; memories[index] = { ...memories[index], ...patch, id, updatedAt: new Date().toISOString() }; await this.write(memories); return memories[index]; }); }
  async delete(id: string) { return Boolean(await this.update(id, { status: 'deleted' })); }
  async search(options: MemorySearchOptions = {}) { return (await this.read()).filter((memory) => memory.status === 'active' && (!options.type || memory.type === options.type) && (!options.scope || memory.scope === options.scope)); }
  async list() { return (await this.read()).filter((memory) => memory.status !== 'deleted'); }
  async count() { return (await this.list()).length; }
  async clear() { return this.serialized(async () => { const memories = await this.read(); await this.write(memories.map((memory) => ({ ...memory, status: 'deleted' as const, updatedAt: new Date().toISOString() }))); }); }
  async export() { return { version: 1 as const, memories: await this.list() }; }
  async import(data: unknown) { if (!data || typeof data !== 'object' || !Array.isArray((data as { memories?: unknown }).memories)) throw new Error('Invalid memory export.'); let imported = 0; for (const memory of (data as { memories: unknown[] }).memories) if (memory && typeof memory === 'object' && typeof (memory as Memory).content === 'string') { await this.create(memory as Memory); imported += 1; } return imported; }
}
