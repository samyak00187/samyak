import type { Tool, ToolCategory, ToolRegistry } from './types';

export class DefaultToolRegistry implements ToolRegistry {
  private readonly tools = new Map<string, Tool>();
  register(tool: Tool) { if (this.tools.has(tool.name)) throw new Error(`Tool already registered: ${tool.name}`); this.tools.set(tool.name, tool); }
  unregister(name: string) { return this.tools.delete(name); }
  get(name: string) { return this.tools.get(name); }
  has(name: string) { return this.tools.has(name); }
  list() { return [...this.tools.values()].filter((tool) => tool.metadata?.enabled !== false); }
  findByCategory(category: ToolCategory) { return this.list().filter((tool) => tool.category === category); }
}
