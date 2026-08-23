import path from 'node:path';
import { z } from 'zod';
import type { Tool, ToolCategory, ToolContext, ToolResult, Permission, RiskLevel } from '../brain/types';

export const MAX_FILE_READ_BYTES = 512_000;
export const MAX_OUTPUT_BYTES = 100_000;
export const textExtensions = new Set(['.txt', '.md', '.json', '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.h', '.html', '.css', '.yaml', '.yml', '.xml', '.sql', '.sh', '.bat', '.ps1']);
const secretNames = [/^\.env($|\.)/i, /\.pem$/i, /\.key$/i, /id_rsa/i, /credentials/i, /secrets?/i, /tokens?/i, /password/i];

export function tool(options: { name: string; displayName: string; description: string; category: ToolCategory; permissions: Permission[]; riskLevel: RiskLevel; schema: z.ZodTypeAny; execute: (input: unknown, context: ToolContext) => Promise<ToolResult>; }): Tool {
  return { name: options.name, description: options.description, category: options.category, permissions: options.permissions, inputSchema: options.schema, metadata: { name: options.name, displayName: options.displayName, description: options.description, category: options.category, version: '1.0.0', permissions: options.permissions, riskLevel: options.riskLevel }, validateInput: (input) => { const result = options.schema.safeParse(input); return result.success ? undefined : { success: false, error: { code: 'INVALID_INPUT', message: 'Tool input did not match its schema.' } }; }, execute: options.execute };
}

export function allowedRoots(): string[] { return (process.env.JARVIS_ALLOWED_ROOTS || process.cwd()).split(path.delimiter).map((root) => path.resolve(root)); }
export function isSecretPath(target: string): boolean { return secretNames.some((pattern) => pattern.test(path.basename(target)) || pattern.test(target)); }
export function resolveAllowedPath(input: string, roots = allowedRoots()): { path?: string; error?: ToolResult } { const resolved = path.resolve(input); const allowed = roots.some((root) => resolved === root || resolved.startsWith(`${root}${path.sep}`)); if (!allowed) return { error: { success: false, error: { code: 'PATH_NOT_ALLOWED', message: 'Path is outside configured allowed roots.' } } }; if (isSecretPath(resolved)) return { error: { success: false, error: { code: 'PERMISSION_DENIED', message: 'Sensitive files are blocked by policy.' } } }; return { path: resolved }; }
export function resultError(code: string, message: string): ToolResult { return { success: false, error: { code, message } }; }
export function bounded(value: string, max = MAX_OUTPUT_BYTES): string { return value.length > max ? `${value.slice(0, max)}\n[output truncated]` : value; }
