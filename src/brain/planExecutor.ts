import type { ExecutionContext, ExecutionObserver, TaskPlan, ToolRegistry } from './types';
import { DefaultPermissionManager } from './permissionManager';

export class PlanExecutor {
  constructor(private readonly registry: ToolRegistry, private readonly observer: ExecutionObserver, private readonly maxToolCalls = 8, private readonly permissions = new DefaultPermissionManager()) {}
  async execute(plan: TaskPlan, context: ExecutionContext): Promise<TaskPlan> {
    plan.status = 'running'; let calls = 0;
    for (const step of plan.steps) {
      if (context.signal.aborted) { step.status = 'cancelled'; plan.status = 'cancelled'; this.observer.emit({ type: 'plan.cancelled', requestId: context.requestId, timestamp: new Date().toISOString(), plan }); break; }
      if (step.dependsOn?.some((dependency) => plan.steps.find((candidate) => candidate.id === dependency)?.status !== 'completed')) { step.status = 'skipped'; continue; }
      step.status = 'running'; this.observer.emit({ type: 'step.started', requestId: context.requestId, timestamp: new Date().toISOString(), step, plan });
      if (!step.tool) { step.status = 'completed'; continue; }
      if (++calls > this.maxToolCalls) { step.status = 'failed'; plan.status = 'failed'; this.observer.emit({ type: 'step.failed', requestId: context.requestId, timestamp: new Date().toISOString(), step, message: 'Maximum tool call limit reached.', plan }); break; }
      const tool = this.registry.get(step.tool); if (!tool) { step.status = 'failed'; plan.status = 'failed'; this.observer.emit({ type: 'step.failed', requestId: context.requestId, timestamp: new Date().toISOString(), step, message: `Tool ${step.tool} is not registered.`, plan }); break; }
      const input = step.input || {}; const validation = tool.validateInput?.(input); if (validation && !validation.success) { step.status = 'failed'; plan.status = 'failed'; this.observer.emit({ type: 'step.failed', requestId: context.requestId, timestamp: new Date().toISOString(), tool: tool.name, result: validation, step, plan }); break; }
      const permission = this.permissions.check(tool.permissions); if (permission !== 'allowed') { step.status = permission === 'confirmation_required' ? 'waiting' : 'failed'; plan.status = permission === 'confirmation_required' ? 'pending' : 'failed'; this.observer.emit({ type: permission === 'confirmation_required' ? 'permission.requested' : 'step.failed', requestId: context.requestId, timestamp: new Date().toISOString(), tool: tool.name, step, plan, message: permission }); break; }
      this.observer.emit({ type: 'tool.started', requestId: context.requestId, timestamp: new Date().toISOString(), tool: tool.name, step, plan }); let result; try { result = await tool.execute(input, context); } catch (error) { result = { success: false, error: { code: 'EXECUTION_FAILED', message: error instanceof Error ? error.message : 'Tool execution failed.' } }; } context.results[step.id] = result;
      if (!result.success) { step.status = 'failed'; plan.status = 'failed'; this.observer.emit({ type: 'tool.failed', requestId: context.requestId, timestamp: new Date().toISOString(), tool: tool.name, result, step, plan }); break; }
      step.status = 'completed'; this.observer.emit({ type: 'tool.completed', requestId: context.requestId, timestamp: new Date().toISOString(), tool: tool.name, result, step, plan });
    }
    if (plan.status === 'running') plan.status = plan.steps.every((step) => step.status === 'completed') ? 'completed' : 'failed';
    return plan;
  }
}
