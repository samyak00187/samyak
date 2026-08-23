export class ResourceManager {
  private readonly owners = new Map<string, string>();
  acquire(resources: string[], owner: string) { if (resources.some((resource) => { const current = this.owners.get(resource); return current !== undefined && current !== owner; })) return false; resources.forEach((resource) => this.owners.set(resource, owner)); return true; }
  release(resources: string[], owner: string) { resources.forEach((resource) => { if (this.owners.get(resource) === owner) this.owners.delete(resource); }); }
  isLocked(resource: string) { return this.owners.has(resource); }
}
