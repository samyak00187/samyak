import os from 'node:os';
import { promises as fs } from 'node:fs';
import { z } from 'zod';
import { tool } from '../toolHelpers';
import type { Tool } from '../../brain/types';

const empty = z.object({}).strict();
const read = (name: string, displayName: string, description: string, execute: (context: import('../../brain/types').ToolContext) => Promise<import('../../brain/types').ToolResult>): Tool => tool({ name, displayName, description, category: 'system', permissions: ['system.read'], riskLevel: 'safe', schema: empty, execute: (_input, context) => execute(context) });

export const systemTools: Tool[] = [
  read('get_system_info', 'System Information', 'Reads safe operating system and runtime information.', async () => ({ success: true, data: { platform: process.platform, architecture: process.arch, cpuCount: os.cpus().length, runtime: process.version, hostname: os.hostname().slice(0, 64) }, metadata: { toolVersion: '1.0.0' } })),
  read('get_cpu_usage', 'CPU Usage', 'Reads CPU core count and measured usage where supported.', async () => { const first = os.cpus(); await new Promise((resolve) => setTimeout(resolve, 100)); const second = os.cpus(); const total = second.reduce((sum, cpu, index) => sum + (Object.values(cpu.times).reduce((a, b) => a + b, 0) - Object.values(first[index].times).reduce((a, b) => a + b, 0)), 0); const idle = second.reduce((sum, cpu, index) => sum + (cpu.times.idle - first[index].times.idle), 0); return { success: true, data: { usage: total ? Math.round((1 - idle / total) * 100) : null, cores: second.length, load: os.loadavg() } }; }),
  read('get_memory_usage', 'Memory Usage', 'Reads real system memory totals and availability in bytes.', async () => { const total = os.totalmem(); const available = os.freemem(); return { success: true, data: { total, used: total - available, available, percentage: Math.round(((total - available) / total) * 100) } }; }),
  read('get_disk_usage', 'Disk Usage', 'Reads disk statistics for the core working volume.', async () => { try { const stats = await fs.statfs(process.cwd()); const total = Number(stats.blocks) * Number(stats.bsize); const available = Number(stats.bavail) * Number(stats.bsize); const used = total - available; return { success: true, data: { available: true, total, used, availableBytes: available, percentage: total ? Math.round((used / total) * 100) : null } }; } catch { return { success: true, data: { available: false, total: null, used: null, availableBytes: null, percentage: null } }; } }),
  read('get_battery_status', 'Battery Status', 'Reports battery availability without exposing device identifiers.', async () => ({ success: true, data: { available: false, percentage: null, charging: null, timeRemaining: null } })),
  read('get_network_status', 'Network Status', 'Reports whether local network interfaces are available.', async () => { const interfaces = os.networkInterfaces(); const connected = Object.values(interfaces).some((items) => items?.some((item) => !item.internal)); return { success: true, data: { connected, interfaceCount: Object.keys(interfaces).length } }; }),
  read('get_current_time', 'Current Time', 'Reads the current local machine time and timezone.', async () => { const now = new Date(); return { success: true, data: { localTime: now.toISOString(), date: now.toLocaleDateString(), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone } }; }),
];
