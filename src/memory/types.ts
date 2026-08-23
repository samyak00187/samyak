export type MemoryType = 'conversation' | 'preference' | 'fact' | 'instruction' | 'project' | 'task' | 'decision' | 'summary';
export type MemoryScope = 'session' | 'conversation' | 'global' | 'project';
export type MemorySource = 'user_explicit' | 'conversation' | 'tool' | 'imported' | 'system';
export type MemoryStatus = 'active' | 'superseded' | 'deleted';
export type EmbeddingStatus = 'pending' | 'failed' | 'complete';

export interface Memory { id: string; type: MemoryType; scope: MemoryScope; content: string; metadata?: Record<string, unknown>; createdAt: string; updatedAt: string; importance: number; confidence: number; source: MemorySource; status: MemoryStatus; embeddingStatus: EmbeddingStatus; }
export interface MemoryCandidate { type: MemoryType; scope: MemoryScope; content: string; importance: number; confidence: number; source: MemorySource; metadata?: Record<string, unknown>; }
export interface MemorySearchOptions { limit?: number; type?: MemoryType; scope?: MemoryScope; }
export interface RankedMemory { memory: Memory; score: number; similarity: number; }
export interface MemoryContext { query: string; memories: RankedMemory[]; formatted: string; }
export interface EmbeddingProvider { embed(text: string): Promise<number[]>; embedBatch(texts: string[]): Promise<number[][]>; }
export interface VectorStore { upsert(memoryId: string, vector: number[]): Promise<void>; search(vector: number[], limit: number): Promise<Array<{ memoryId: string; similarity: number }>>; delete(memoryId: string): Promise<void>; }
export interface MemoryStoreAdapter { create(memory: Memory): Promise<Memory>; get(id: string): Promise<Memory | undefined>; update(id: string, patch: Partial<Memory>): Promise<Memory | undefined>; delete(id: string): Promise<boolean>; search(options?: MemorySearchOptions): Promise<Memory[]>; list(): Promise<Memory[]>; count(): Promise<number>; clear(): Promise<void>; export(): Promise<{ version: 1; memories: Memory[] }>; import(data: unknown): Promise<number>; }
