import type { AIMessage, AIStreamChunk } from '../ai/types';
import type { AIProvider } from '../ai/provider';
import type { MemoryManager } from '../memory/memoryManager';

export type AgentState = 'idle' | 'understanding' | 'planning' | 'waiting_for_permission' | 'executing' | 'observing' | 'replanning' | 'responding' | 'completed' | 'failed' | 'cancelled';
export type IntentType = 'conversation' | 'question' | 'information_request' | 'calculation' | 'file_operation' | 'application_operation' | 'system_operation' | 'web_research' | 'coding' | 'automation' | 'multi_step_task' | 'unknown';
export type StepStatus = 'pending' | 'ready' | 'running' | 'waiting' | 'completed' | 'failed' | 'skipped' | 'cancelled';
export type PlanStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type ToolCategory = 'system' | 'filesystem' | 'application' | 'developer' | 'clipboard' | 'utility' | 'network' | 'vision';
export type RiskLevel = 'safe' | 'low' | 'medium' | 'high' | 'critical';
export type Permission = 'system.read' | 'filesystem.read' | 'filesystem.write' | 'filesystem.delete' | 'application.read' | 'application.launch' | 'clipboard.read' | 'clipboard.write' | 'developer.read' | 'developer.execute' | 'network.read' | 'network.access' | 'screen.capture' | 'microphone' | 'camera.capture';

export interface Intent { type: IntentType; goal: string; confidence: number; requiresTools: boolean; requiresConfirmation: boolean; entities: Record<string, unknown>; }
export interface TaskStep { id: string; description: string; tool?: string; input?: unknown; status: StepStatus; dependsOn?: string[]; }
export interface TaskPlan { id: string; goal: string; steps: TaskStep[]; status: PlanStatus; }
export interface ToolContext { requestId: string; conversationId: string; planId: string; variables: Record<string, unknown>; results: Record<string, ToolResult>; signal: AbortSignal; }
export interface ToolError { code: string; message: string; }
export interface ToolResult { success: boolean; data?: unknown; error?: ToolError; metadata?: Record<string, unknown>; }
export interface ToolMetadata { name: string; displayName: string; description: string; category: ToolCategory; version: string; permissions: Permission[]; riskLevel: RiskLevel; enabled?: boolean; }
export interface Tool { name: string; description: string; category: ToolCategory; inputSchema: unknown; permissions: Permission[]; metadata?: ToolMetadata; validateInput?: (input: unknown) => ToolResult | undefined; execute(input: unknown, context: ToolContext): Promise<ToolResult>; }
export interface ExecutionContext extends ToolContext { metadata: Record<string, unknown>; }
export interface AgentEvent { type: string; requestId: string; timestamp: string; state?: AgentState; plan?: TaskPlan; step?: TaskStep; tool?: string; result?: ToolResult; message?: string; }
export interface BrainRequest { requestId: string; conversationId: string; messages: AIMessage[]; }
export type BrainEvent = AgentEvent | AIStreamChunk;
export interface BrainDependencies { provider: AIProvider; registry: ToolRegistry; permissions: PermissionManager; observer: ExecutionObserver; memory?: MemoryManager; }
export interface ToolRegistry { register(tool: Tool): void; unregister(name: string): boolean; get(name: string): Tool | undefined; has(name: string): boolean; list(): Tool[]; findByCategory(category: ToolCategory): Tool[]; }
export interface PermissionManager { check(permissions: Permission[], input: unknown): 'allowed' | 'confirmation_required' | 'denied'; }
export interface ExecutionObserver { emit(event: AgentEvent): void; }
