import { describe, expect, it, vi } from 'vitest';
import { AgentRegistry } from './agentRegistry';
import { AgentOrchestrator } from './agentOrchestrator';
import { ResourceManager } from './resourceManager';
import { TaskExecutor } from './taskExecutor';
import type { Agent, TaskPlan } from './types';

const agent = (id: string, run = vi.fn(async () => ({ success: true, summary: id }))): Agent => ({ id, name: id, description: id, capabilities: ['inspect', 'test'], tools: [], riskLevel: 'low', available: true, canHandle: () => true, execute: run });
const context = { request: 'inspect and test', signal: new AbortController().signal };
describe('Phase 9 orchestration', () => {
  it('keeps simple requests off the orchestrator', async () => { const registry = new AgentRegistry(); registry.register(agent('analysis')); expect(new AgentOrchestrator(registry).isComplex('what time is it')).toBe(false); expect((await new AgentOrchestrator(registry).run('what time is it', context)).result?.summary).toContain('direct'); });
  it('honors dependencies and executes parallel-ready tasks', async () => { const registry = new AgentRegistry(); const run = vi.fn(async () => ({ success: true, summary: 'done' })); registry.register(agent('worker', run)); const plan: TaskPlan = { id: 'plan', goal: 'x', complexity: 'complex', createdAt: new Date().toISOString(), tasks: [{ id: 'a', title: 'a', description: 'a', status: 'pending', priority: 'normal', dependencies: [], createdAt: new Date().toISOString() }, { id: 'b', title: 'b', description: 'b', status: 'pending', priority: 'normal', dependencies: ['a'], createdAt: new Date().toISOString() }] }; await new TaskExecutor(registry).execute(plan, context); expect(plan.tasks.every((task) => task.status === 'completed')).toBe(true); expect(run).toHaveBeenCalledTimes(2); });
  it('prevents conflicting resource ownership', () => { const manager = new ResourceManager(); expect(manager.acquire(['src/App.tsx'], 'a')).toBe(true); expect(manager.acquire(['src/App.tsx'], 'b')).toBe(false); manager.release(['src/App.tsx'], 'a'); expect(manager.acquire(['src/App.tsx'], 'b')).toBe(true); });
});
