import type { AgentEvent } from '../brain/types';

export interface AuditEvent { timestamp: string; requestId: string; tool?: string; event: string; success?: boolean; permissionDecision?: string; }
export class AuditLogger {
  private readonly events: AuditEvent[] = [];
  record(event: AgentEvent) { this.events.push({ timestamp: event.timestamp, requestId: event.requestId, tool: event.tool, event: event.type, success: event.result?.success, permissionDecision: event.type === 'permission.requested' ? event.message : undefined }); if (this.events.length > 500) this.events.shift(); }
  list() { return [...this.events]; }
}
