import type { Task, TaskPlan, TaskStatus } from './types';
export class TaskStateManager {
  constructor(readonly plan: TaskPlan) {}
  update(id: string, status: TaskStatus, patch: Partial<Task> = {}) { const task = this.plan.tasks.find((candidate) => candidate.id === id); if (!task) throw new Error(`Task ${id} was not found.`); Object.assign(task, patch, { status }); if (status === 'running') task.startedAt = new Date().toISOString(); if (['completed', 'failed', 'cancelled'].includes(status)) task.completedAt = new Date().toISOString(); return task; }
  ready() { return this.plan.tasks.filter((task) => task.status === 'pending' || task.status === 'queued').filter((task) => task.dependencies.every((id) => this.plan.tasks.find((candidate) => candidate.id === id)?.status === 'completed')); }
}
