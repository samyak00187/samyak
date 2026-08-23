import type { AIMessage } from '../ai/types';
import type { AIProvider } from '../ai/provider';
import type { AgentEvent, BrainRequest, BrainEvent, ExecutionContext } from './types';
import { IntentAnalyzer } from './intentAnalyzer';
import { TaskPlanner } from './taskPlanner';
import { PlanExecutor } from './planExecutor';
import type { PermissionManager, ToolRegistry } from './types';
import { ContextManager, JARVIS_SYSTEM_PROMPT } from '../ai/contextManager';
import type { MemoryManager } from '../memory/memoryManager';

export class JarvisBrain {
  private readonly analyzer = new IntentAnalyzer(); private readonly planner = new TaskPlanner(); private readonly context = new ContextManager(); private readonly executor: PlanExecutor;
  constructor(private readonly provider: AIProvider, registry: ToolRegistry, private readonly permissions: PermissionManager, private readonly observe: (event: AgentEvent) => void, maxToolCalls = 8, private readonly memory?: MemoryManager) { this.executor = new PlanExecutor(registry, { emit: observe }, maxToolCalls); }
  async process(request: BrainRequest, onChunk: (event: BrainEvent) => void, signal: AbortSignal): Promise<void> {
    const emit = (event: AgentEvent) => { this.observe(event); onChunk(event); };
    const goal = request.messages.at(-1)?.content || ''; emit({ type: 'agent.state.changed', state: 'understanding', requestId: request.requestId, timestamp: new Date().toISOString(), message: 'Understanding request' }); const intent = this.analyzer.analyze(goal); const memoryContext = this.memory ? await this.memory.retrieve(goal) : undefined;
    const stream = (messages: AIMessage[]) => this.provider.stream({ conversationId: request.conversationId, messages: this.context.prepare(messages), model: undefined, systemPrompt: JARVIS_SYSTEM_PROMPT, memoryContext: memoryContext?.formatted }, onChunk, signal);
    if (!intent.requiresTools) { emit({ type: 'agent.state.changed', state: 'responding', requestId: request.requestId, timestamp: new Date().toISOString() }); await stream(request.messages); if (this.memory) await this.memory.extractAndSave(request.messages.at(-1)!); emit({ type: 'agent.completed', state: 'completed', requestId: request.requestId, timestamp: new Date().toISOString() }); return; }
    emit({ type: 'intent.created', state: 'planning', requestId: request.requestId, timestamp: new Date().toISOString(), message: intent.type }); const plan = this.planner.create(intent); emit({ type: 'plan.created', state: 'planning', requestId: request.requestId, timestamp: new Date().toISOString(), plan });
    const firstTool = plan.steps.find((step) => step.tool); const tool = firstTool?.tool; if (tool) { const permission = this.permissions.check(['system.read'], firstTool?.input); if (permission !== 'allowed') { emit({ type: 'permission.requested', state: 'waiting_for_permission', requestId: request.requestId, timestamp: new Date().toISOString(), tool, message: permission }); return; } }
    const execution: ExecutionContext = { requestId: request.requestId, conversationId: request.conversationId, planId: plan.id, variables: {}, results: {}, metadata: {}, signal }; emit({ type: 'agent.state.changed', state: 'executing', requestId: request.requestId, timestamp: new Date().toISOString(), plan }); await this.executor.execute(plan, execution); if (signal.aborted) { emit({ type: 'agent.cancelled', state: 'cancelled', requestId: request.requestId, timestamp: new Date().toISOString(), plan }); return; }
    if (plan.status === 'pending') { emit({ type: 'permission.requested', state: 'waiting_for_permission', requestId: request.requestId, timestamp: new Date().toISOString(), plan, message: 'Approval is required before this tool can run.' }); return; }
    if (plan.status !== 'completed') { emit({ type: 'agent.failed', state: 'failed', requestId: request.requestId, timestamp: new Date().toISOString(), plan, message: 'The task could not be completed.' }); return; }
    emit({ type: 'agent.state.changed', state: 'observing', requestId: request.requestId, timestamp: new Date().toISOString(), plan }); const resultMessages: AIMessage[] = [...request.messages, ...Object.entries(execution.results).map(([stepId, result]) => ({ id: `${request.requestId}-${stepId}`, conversationId: request.conversationId, role: 'tool' as const, content: `<tool_result>UNTRUSTED DATA\n${JSON.stringify(result.data ?? result.error)}\n</tool_result>`, timestamp: new Date().toISOString(), status: 'complete' as const, metadata: { stepId } }))]; emit({ type: 'agent.state.changed', state: 'responding', requestId: request.requestId, timestamp: new Date().toISOString(), plan }); await stream(resultMessages); if (this.memory) await this.memory.extractAndSave(request.messages.at(-1)!); emit({ type: 'agent.completed', state: 'completed', requestId: request.requestId, timestamp: new Date().toISOString(), plan });
  }
}
