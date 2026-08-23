import { AgentRegistry } from './agentRegistry';
import { defaultAgents } from './agents';
export function createDefaultAgentRegistry() { const registry = new AgentRegistry(); defaultAgents.forEach((agent) => registry.register(agent)); return registry; }
