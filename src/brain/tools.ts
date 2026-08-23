import os from 'node:os';
import type { Tool } from './types';

export const systemStatusTool: Tool = {
  name: 'getSystemStatus', description: 'Reads safe, non-sensitive runtime system information.', category: 'system', inputSchema: { type: 'object', properties: {} }, permissions: ['system.read'],
  async execute() { return { success: true, data: { platform: process.platform, arch: process.arch, cpuCount: os.cpus().length, memory: { totalBytes: os.totalmem(), freeBytes: os.freemem() }, uptimeSeconds: os.uptime() }, metadata: { source: 'node-runtime' } }; },
};
