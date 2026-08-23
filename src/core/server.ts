import { createServer } from 'node:http';
import { createProvider } from '../ai/providerFactory';
import { ContextManager } from '../ai/contextManager';
import type { AIMessage } from '../ai/types';
import { JarvisBrain } from '../brain/jarvisBrain';
import { DefaultPermissionManager } from '../brain/permissionManager';
import { DefaultToolRegistry } from '../brain/toolRegistry';
import { systemStatusTool } from '../brain/tools';
import { registerDefaultTools } from '../tools/registerTools';
import { loadConfig } from '../config/env';
import { createLogger } from '../services/logger';
import { AuditLogger } from '../services/auditLogger';
import { MemoryManager } from '../memory/memoryManager';
import { FileMemoryStore } from '../memory/fileMemoryStore';
import type { MemoryCandidate } from '../memory/types';
import { createMemoryTools } from '../tools/memoryTools';

const config = loadConfig(process.env as Record<string, string | undefined>);
const logger = createLogger(config, 'core');
const port = Number(process.env.JARVIS_CORE_PORT || 4174);
const provider = createProvider(config);
const contextManager = new ContextManager();
const audit = new AuditLogger();
const memory = new MemoryManager(new FileMemoryStore());
const registry = new DefaultToolRegistry(); registerDefaultTools(registry); registry.register(systemStatusTool); createMemoryTools(memory).forEach((tool) => registry.register(tool));
const brain = new JarvisBrain(provider, registry, new DefaultPermissionManager(), (event) => { audit.record(event); logger.info(event.type, { requestId: event.requestId, state: event.state, tool: event.tool }); }, 8, memory);

function sendJson(response: import('node:http').ServerResponse, status: number, body: Record<string, string>) {
  response.writeHead(status, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
  response.end(JSON.stringify(body));
}

function readBody(request: import('node:http').IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => { let body = ''; request.on('data', (chunk: Buffer) => { body += chunk.toString(); if (body.length > 512_000) reject(new Error('Request body is too large.')); }); request.on('end', () => resolve(body)); request.on('error', reject); });
}

function isValidMessage(message: unknown): message is AIMessage {
  if (!message || typeof message !== 'object') return false;
  const candidate = message as Partial<AIMessage>;
  return ['system', 'user', 'assistant', 'tool'].includes(candidate.role || '') && typeof candidate.content === 'string' && candidate.content.length <= 32_000;
}

const server = createServer(async (request, response) => {
  if (request.method === 'OPTIONS') { response.writeHead(204, { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'POST, GET, OPTIONS', 'access-control-allow-headers': 'content-type' }); response.end(); return; }
  if (request.url === '/health' && request.method === 'GET') {
    sendJson(response, 200, { status: 'ok', service: 'jarvis-core' });
    return;
  }
  if (request.url === '/api/tools' && request.method === 'GET') {
    response.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
    response.end(JSON.stringify(registry.list().map((tool) => tool.metadata || { name: tool.name, displayName: tool.name, description: tool.description, category: tool.category, version: '1.0.0', permissions: tool.permissions, riskLevel: 'medium' })));
    return;
  }
  if (request.url === '/api/audit' && request.method === 'GET') {
    response.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
    response.end(JSON.stringify(audit.list()));
    return;
  }
  if (request.url === '/api/memory/export' && request.method === 'GET') {
    response.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' }); response.end(JSON.stringify(await memory.store.export())); return;
  }
  if (request.url === '/api/memory/import' && request.method === 'POST') {
    try { const data: unknown = JSON.parse(await readBody(request)); const imported = await memory.store.import(data); sendJson(response, 200, { imported: String(imported) }); } catch { sendJson(response, 400, { error: 'Invalid memory export.' }); } return;
  }
  if (request.url?.startsWith('/api/memory') && request.method === 'GET') {
    const query = new URL(request.url, 'http://localhost').searchParams.get('q') || '';
    const result = query ? await memory.search(query) : await memory.store.list();
    response.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' }); response.end(JSON.stringify(result)); return;
  }
  if (request.url === '/api/memory' && request.method === 'POST') {
    try { const candidate = JSON.parse(await readBody(request)) as MemoryCandidate; const result = await memory.save(candidate); response.writeHead(result.memory ? 201 : 400, { 'content-type': 'application/json', 'access-control-allow-origin': '*' }); response.end(JSON.stringify(result)); } catch { sendJson(response, 400, { error: 'Invalid memory data.' }); } return;
  }
  if (request.url?.startsWith('/api/memory/') && request.method === 'PATCH') {
    try { const id = request.url.split('/').pop()!; const patch = JSON.parse(await readBody(request)) as Partial<MemoryCandidate>; const result = await memory.store.update(id, patch); response.writeHead(result ? 200 : 404, { 'content-type': 'application/json', 'access-control-allow-origin': '*' }); response.end(JSON.stringify(result || { error: 'Memory not found.' })); } catch { sendJson(response, 400, { error: 'Invalid memory update.' }); } return;
  }
  if (request.url?.startsWith('/api/memory/') && request.method === 'DELETE') {
    const id = request.url.split('/').pop()!; const deleted = await memory.store.delete(id); sendJson(response, deleted ? 200 : 404, { status: deleted ? 'deleted' : 'not_found' }); return;
  }
  if (request.url === '/api/memory/clear' && request.method === 'POST') {
    try { const body = JSON.parse(await readBody(request)) as { confirm?: boolean }; if (!body.confirm) { sendJson(response, 400, { error: 'Explicit confirmation is required to clear memory.' }); return; } await memory.clear(); sendJson(response, 200, { status: 'cleared' }); } catch { sendJson(response, 400, { error: 'Invalid clear request.' }); } return;
  }
  if (request.url === '/api/chat' && request.method === 'POST') {
    try {
      const parsed = JSON.parse(await readBody(request)) as { conversationId?: unknown; messages?: unknown };
      if (typeof parsed.conversationId !== 'string' || !parsed.conversationId || !Array.isArray(parsed.messages) || parsed.messages.length > 100 || !parsed.messages.every(isValidMessage)) { sendJson(response, 400, { error: 'A valid conversation and message history are required.' }); return; }
      if (!config.aiApiKey) { sendJson(response, 503, { error: 'AI provider is not configured. Set AI_API_KEY in the server environment.' }); return; }
      const controller = new AbortController(); request.on('aborted', () => controller.abort());
      response.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive', 'access-control-allow-origin': '*' });
      const requestId = crypto.randomUUID();
      await brain.process({ requestId, conversationId: parsed.conversationId, messages: contextManager.prepare(parsed.messages) }, (event) => { if (!response.writableEnded) response.write(`data: ${JSON.stringify(event)}\n\n`); }, controller.signal);
      if (!response.writableEnded) response.end();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to reach the AI service.';
      if (!response.headersSent) sendJson(response, message.includes('configured') ? 503 : 502, { error: message });
      else if (!response.writableEnded) { response.write(`data: ${JSON.stringify({ error: message })}\n\n`); response.end(); }
    }
    return;
  }

  sendJson(response, 404, { error: 'Not found' });
});

server.on('error', (error) => logger.error('server_error', { error: error.message }));
server.listen(port, () => logger.info('server_started', { port }));