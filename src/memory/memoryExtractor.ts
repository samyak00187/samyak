import type { AIMessage } from '../ai/types';
import type { MemoryCandidate } from './types';
import { MemoryPolicy } from './memoryPolicy';

export class MemoryExtractor {
  constructor(private readonly policy = new MemoryPolicy()) {}
  extract(message: AIMessage): MemoryCandidate[] { if (message.role !== 'user') return []; const content = message.content.trim(); const explicit = content.match(/^remember(?: that)?\s+(.+)/i); if (explicit) { const remembered = explicit[1].trim(); const candidate: MemoryCandidate = { type: /prefer|favorite|like/i.test(remembered) ? 'preference' : /build|project|working on/i.test(remembered) ? 'project' : 'fact', scope: 'global', content: remembered, importance: 0.9, confidence: 1, source: 'user_explicit' }; return this.policy.canStore(candidate) ? [candidate] : []; } if (/prefer|favorite|working on|building|my name is/i.test(content) && content.length < 500) { const candidate: MemoryCandidate = { type: /prefer|favorite/i.test(content) ? 'preference' : /build|working on/i.test(content) ? 'project' : 'fact', scope: 'global', content, importance: 0.65, confidence: 0.85, source: 'conversation' }; return this.policy.canStore(candidate) ? [candidate] : []; } return []; }
  isExplicitForget(content: string): boolean { return /^forget\b/i.test(content.trim()); }
  isClearCommand(content: string): boolean { return /^(clear|delete)\s+(all\s+)?(my\s+)?memor(y|ies)\b/i.test(content.trim()); }
}
