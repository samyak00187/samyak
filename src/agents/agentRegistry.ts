import type { Agent, Task } from './types';
export class AgentRegistry {
  private readonly agents = new Map<string, Agent>();
  register(agent: Agent) { if (this.agents.has(agent.id)) throw new Error(`Agent ${agent.id} is already registered.`); this.agents.set(agent.id, agent); return this; }
  get(id: string) { return this.agents.get(id); }
  list() { return [...this.agents.values()]; }
  find(task: Task) { return this.list().filter((agent) => agent.available && agent.canHandle(task)); }
}
