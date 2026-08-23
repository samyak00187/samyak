import { describe, expect, it } from 'vitest';
import { DefaultToolRegistry } from '../brain/toolRegistry';
import { DefaultPermissionManager } from '../brain/permissionManager';
import { systemTools } from './system';
import { filesystemTools } from './filesystem';
import { utilityTools } from './utility';
import { registerDefaultTools } from './registerTools';
import { resolveAllowedPath } from './toolHelpers';

describe('Phase 4 tools', () => {
  it('registers categorized tools and rejects duplicate names', () => { const registry = new DefaultToolRegistry(); registerDefaultTools(registry); expect(registry.findByCategory('system').length).toBeGreaterThan(5); expect(registry.findByCategory('filesystem').length).toBeGreaterThan(5); expect(() => registry.register(systemTools[0])).toThrow('already registered'); expect(registry.has('calculator')).toBe(true); });
  it('blocks traversal and sensitive paths', () => { expect(resolveAllowedPath('../secret', [process.cwd()]).error?.error?.code).toBe('PATH_NOT_ALLOWED'); expect(resolveAllowedPath(`${process.cwd()}/.env`, [process.cwd()]).error?.error?.code).toBe('PERMISSION_DENIED'); });
  it('reads real memory and rejects invalid utility input', async () => { const context = { requestId: 'r', conversationId: 'c', planId: 'p', variables: {}, results: {}, signal: new AbortController().signal }; const memory = systemTools.find((tool) => tool.name === 'get_memory_usage'); const calculator = utilityTools.find((tool) => tool.name === 'calculator'); const read = filesystemTools.find((tool) => tool.name === 'read_file'); expect((await memory!.execute({}, context)).success).toBe(true); expect((await calculator!.execute({ expression: '2 + 3 * 4' }, context)).data).toEqual({ expression: '2 + 3 * 4', value: 14 }); expect((await calculator!.execute({ expression: 'process.exit()' }, context)).success).toBe(false); expect((await read!.execute({ path: '.env' }, context)).success).toBe(false); });
  it('gates sensitive permissions', () => { const permissions = new DefaultPermissionManager(); expect(permissions.check(['filesystem.delete'])).toBe('confirmation_required'); expect(permissions.check(['developer.execute'])).toBe('confirmation_required'); });
  it('registers vision tools and gates screen access', () => { const registry = new DefaultToolRegistry(); registerDefaultTools(registry); expect(registry.findByCategory('vision').map((tool) => tool.name)).toContain('capture_screen'); expect(new DefaultPermissionManager().check(['screen.capture'])).toBe('confirmation_required'); });
});
