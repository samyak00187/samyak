import type { TaskPlan } from './types';

export class Replanner {
  private count = 0;
  constructor(private readonly maxReplans = 2) {}
  canReplan(): boolean { return this.count < this.maxReplans; }
  revise(plan: TaskPlan, reason: string): TaskPlan | undefined { if (!this.canReplan()) return undefined; this.count += 1; return { ...plan, id: crypto.randomUUID(), status: 'pending', steps: [{ id: `${plan.id}-fallback-${this.count}`, description: `Report unavailable tool result: ${reason}`, status: 'pending' }] }; }
}
