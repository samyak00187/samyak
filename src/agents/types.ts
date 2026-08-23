export type TaskStatus = 'pending' | 'planning' | 'queued' | 'running' | 'waiting' | 'blocked' | 'completed' | 'failed' | 'cancelled' | 'retrying';
export type TaskPriority = 'low' | 'normal' | 'high' | 'critical';
export type AgentMessageType = 'request' | 'response' | 'progress' | 'warning' | 'error' | 'handoff' | 'completion';
export type AgentRisk = 'low' | 'medium' | 'high';

export interface Task { id: string; parentId?: string; title: string; description: string; status: TaskStatus; priority: TaskPriority; assignedAgent?: string; dependencies: string[]; result?: AgentResult; error?: string; createdAt: string; startedAt?: string; completedAt?: string; resources?: string[]; retryCount?: number; }
export interface TaskPlan { id: string; goal: string; complexity: 'simple' | 'moderate' | 'complex' | 'critical'; tasks: Task[]; createdAt: string; originalPlanId?: string; }
export interface AgentContext { request: string; task: Task; memories?: unknown[]; vision?: unknown; toolResults?: Record<string, unknown>; previousResults?: AgentResult[]; signal: AbortSignal; maxContextChars?: number; }
export interface AgentResult { success: boolean; summary: string; data?: unknown; error?: string; evidence?: string[]; retryable?: boolean; }
export interface Agent { id: string; name: string; description: string; capabilities: string[]; riskLevel: AgentRisk; tools: string[]; available: boolean; canHandle(task: Task): boolean; execute(task: Task, context: AgentContext): Promise<AgentResult>; }
export interface AgentMessage { from: string; to: string; type: AgentMessageType; taskId: string; content: string; metadata?: Record<string, unknown>; timestamp: string; }
export interface OrchestrationLimits { maxConcurrentAgents: number; maxTotalTasks: number; maxReplans: number; maxAgentMessages: number; maxRetries: number; }
export interface OrchestrationEvent { type: string; task?: Task; plan?: TaskPlan; agent?: string; message?: AgentMessage; timestamp: string; }
