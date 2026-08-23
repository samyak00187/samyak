import type { Permission, PermissionManager } from './types';

export class DefaultPermissionManager implements PermissionManager {
  constructor(private readonly allowed: ReadonlySet<Permission> = new Set(['system.read', 'filesystem.read', 'application.read', 'developer.read', 'network.read', 'clipboard.read'])) {}
  check(permissions: Permission[]): 'allowed' | 'confirmation_required' | 'denied' { if (permissions.some((permission) => permission === 'filesystem.delete' || permission === 'filesystem.write' || permission === 'application.launch' || permission === 'developer.execute' || permission === 'clipboard.write' || permission === 'screen.capture' || permission === 'camera.capture')) return 'confirmation_required'; return permissions.every((permission) => this.allowed.has(permission)) ? 'allowed' : 'denied'; }
}
