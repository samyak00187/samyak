import { execFile } from 'node:child_process';
import { z } from 'zod';
import { tool, resultError } from '../toolHelpers';
import type { Tool } from '../../brain/types';

function powershell(script: string, input?: string) { return new Promise<{ code: number; stdout: string; stderr: string }>((resolve) => { if (process.platform !== 'win32') { resolve({ code: 1, stdout: '', stderr: 'Clipboard is unavailable on this platform.' }); return; } const child = execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { windowsHide: true, maxBuffer: 60_000 }, (error, stdout, stderr) => resolve({ code: error ? 1 : 0, stdout, stderr })); if (input) { child.stdin?.write(input); child.stdin?.end(); } }); }
export const clipboardTools: Tool[] = [
  tool({ name: 'get_clipboard', displayName: 'Get Clipboard', description: 'Reads current clipboard text only when explicitly requested.', category: 'clipboard', permissions: ['clipboard.read'], riskLevel: 'medium', schema: z.object({}).strict(), execute: async () => { const result = await powershell('Get-Clipboard -Raw'); return result.code === 0 ? { success: true, data: { text: result.stdout.slice(0, 50_000) } } : resultError('UNAVAILABLE', 'Clipboard text is unavailable.'); } }),
  tool({ name: 'set_clipboard', displayName: 'Set Clipboard', description: 'Replaces clipboard text after explicit permission.', category: 'clipboard', permissions: ['clipboard.write'], riskLevel: 'medium', schema: z.object({ text: z.string().max(50_000) }), execute: async (input) => { const parsed = z.object({ text: z.string().max(50_000) }).safeParse(input); if (!parsed.success) return resultError('INVALID_INPUT', 'Clipboard text is required.'); const result = await powershell('$input | Set-Clipboard', parsed.data.text); return result.code === 0 ? { success: true, data: { updated: true } } : resultError('UNAVAILABLE', 'Clipboard could not be updated.'); } }),
];
