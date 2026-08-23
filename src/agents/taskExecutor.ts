import type { AgentContext, OrchestrationEvent, OrchestrationLimits, TaskPlan } from './types';
import type { AgentRegistry } from './agentRegistry';
import { ResourceManager } from './resourceManager';
import { TaskStateManager } from './taskStateManager';

const defaults: OrchestrationLimits = { maxConcurrentAgents: 3, maxTotalTasks: 20, maxReplans: 2, maxAgentMessages: 100, maxRetries: 1 };
export class TaskExecutor {
  constructor(private readonly registry: AgentRegistry, private readonly resources = new ResourceManager(), private readonly limits = defaults, private readonly emit: (event: OrchestrationEvent) => void = () => {}) {}
  async execute(plan: TaskPlan, context: Omit<AgentContext, 'task'>): Promise<TaskPlan> {
    if (plan.tasks.length > this.limits.maxTotalTasks) throw new Error('Task limit exceeded.');
    const state = new TaskStateManager(plan); let running = 0;
    while (plan.tasks.some((task) => !['completed', 'failed', 'cancelled', 'blocked'].includes(task.status))) {
      if (context.signal.aborted) { plan.tasks.filter((task) => !['completed', 'failed'].includes(task.status)).forEach((task) => state.update(task.id, 'cancelled')); break; }
      const candidates = state.ready().slice(0, Math.max(0, this.limits.maxConcurrentAgents - running));
      if (!candidates.length) { if (running === 0) { plan.tasks.filter((task) => !['completed', 'failed', 'cancelled'].includes(task.status)).forEach((task) => state.update(task.id, 'blocked', { error: 'Dependency or agent unavailable.' })); } await Promise.resolve(); continue; }
      await Promise.all(candidates.map(async (task) => { const agent = task.assignedAgent ? this.registry.get(task.assignedAgent) : this.registry.find(task)[0]; if (!agent) { state.update(task.id, 'failed', { error: 'No available agent.' }); return; } if (!this.resources.acquire(task.resources || [], task.id)) return; running += 1; state.update(task.id, 'running'); this.emit({ type: 'task.started', task, agent: agent.id, timestamp: new Date().toISOString() }); try { const result = await agent.execute(task, { ...context, task }); task.result = result; state.update(task.id, result.success ? 'completed' : (task.retryCount || 0) < this.limits.maxRetries && result.retryable ? 'retrying' : 'failed', { result }); if (task.status === 'retrying') { task.retryCount = (task.retryCount || 0) + 1; task.status = 'pending'; } this.emit({ type: result.success ? 'task.completed' : 'task.failed', task, agent: agent.id, timestamp: new Date().toISOString() }); } catch (error) { state.update(task.id, 'failed', { error: error instanceof Error ? error.message : 'Agent failed.' }); } finally { running -= 1; this.resources.release(task.resources || [], task.id); } }));
    }
    return plan;
  }
}
