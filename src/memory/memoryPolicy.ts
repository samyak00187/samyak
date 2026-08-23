import type { MemoryCandidate } from './types';

const secretPatterns = [/api[_-]?key/i, /secret/i, /password/i, /token/i, /private[_ -]?key/i, /bearer\s+[a-z0-9._-]+/i, /AKIA[0-9A-Z]{16}/];
export class MemoryPolicy {
  isSensitive(content: string): boolean { return secretPatterns.some((pattern) => pattern.test(content)); }
  canStore(candidate: MemoryCandidate): boolean { return candidate.content.trim().length > 0 && candidate.content.length <= 10_000 && !this.isSensitive(candidate.content); }
  requiresConfirmation(candidate: MemoryCandidate): boolean { return candidate.source !== 'user_explicit' && candidate.importance < 0.8; }
}
