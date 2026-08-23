import type { AgentEvent, ExecutionObserver } from './types';

export class EventObserver implements ExecutionObserver {
	constructor(private readonly listener: (event: AgentEvent) => void) {}
	emit(event: AgentEvent) { this.listener(event); }
}
