import type { Task, TaskPlan } from './types';
import type { AgentRegistry } from './agentRegistry';

export class TaskPlanner {
	constructor(private readonly maxTasks = 20) {}
	create(request: string, registry: AgentRegistry): TaskPlan {
		const normalized = request.trim();
		const clauses = normalized.split(/,\s*|\s+and\s+/i).map((part) => part.trim()).filter(Boolean);
		const descriptions = clauses.length > 1 ? clauses : [normalized];
		const now = new Date().toISOString();
		const tasks: Task[] = descriptions.slice(0, this.maxTasks).map((description, index) => {
			const task: Task = { id: crypto.randomUUID(), title: description.slice(0, 80), description, status: 'pending', priority: /urgent|critical|delete|send/i.test(description) ? 'high' : 'normal', dependencies: index ? [] : [], createdAt: now };
			const agent = registry.find(task)[0]; if (agent) task.assignedAgent = agent.id;
			return task;
		});
		for (let index = 1; index < tasks.length; index += 1) tasks[index].dependencies = [tasks[index - 1].id];
		const complexity = tasks.length > 3 ? 'complex' : tasks.length > 1 ? 'moderate' : 'simple';
		return { id: crypto.randomUUID(), goal: normalized, complexity, tasks, createdAt: now };
	}
}
