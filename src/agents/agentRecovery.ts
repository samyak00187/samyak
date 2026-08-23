import type { AgentResult, Task } from './types';
export class AgentRecovery {
  constructor(private readonly maxRetries = 1) {}
  shouldRetry(task: Task, result: AgentResult) { return result.success === false && result.retryable === true && task.priority !== 'critical' && (task.retryCount || 0) < this.maxRetries; }
  explain(result: AgentResult) { return result.error || 'The agent did not provide a recoverable failure reason.'; }
}
