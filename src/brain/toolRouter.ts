import type { Intent, Tool, ToolRegistry } from './types';

export class ToolRouter {
  constructor(private readonly registry: ToolRegistry) {}
  select(intent: Intent): Tool | undefined { if (intent.type === 'system_operation') return this.registry.get('getSystemStatus'); return undefined; }
}
