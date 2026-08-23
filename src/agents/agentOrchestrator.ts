import type { AgentContext, AgentResult, OrchestrationEvent, TaskPlan } from './types';
import type { AgentRegistry } from './agentRegistry';
import { TaskPlanner } from './taskPlanner';
import { TaskExecutor } from './taskExecutor';

export class AgentOrchestrator {
  constructor(private readonly registry: AgentRegistry, private readonly planner = new TaskPlanner(), private readonly executor = new TaskExecutor(registry), private readonly emit?: (event: OrchestrationEvent) => void) {}
  isComplex(request: string) { return request.split(/,\s*|\s+and\s+/i).filter(Boolean).length > 1 || /then|after|before|fix|verify|research|compare|analy[sz]e/i.test(request); }
  async run(request: string, context: Omit<AgentContext, 'task'>): Promise<{ plan?: TaskPlan; result?: AgentResult; }> {
    if (!this.isComplex(request)) return { result: { success: false, summary: 'Simple request should use the direct JARVIS Brain path.' } };
    const plan = this.planner.create(request, this.registry); this.emit?.({ type: 'plan.created', plan, timestamp: new Date().toISOString() });
    return { plan: await this.executor.execute(plan, context) };
  }
}
