import type { Agent, Task } from './types';
export class AgentPolicy {
  canRun(agent: Agent, task: Task) { return agent.available && agent.riskLevel !== 'high' && (!task.assignedAgent || task.assignedAgent === agent.id); }
  sanitizeContext(value: string, maxChars = 12_000) { return value.slice(0, maxChars); }
}
