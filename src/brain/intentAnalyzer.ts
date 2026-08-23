import type { Intent, IntentType } from './types';

export class IntentAnalyzer {
  analyze(goal: string): Intent {
    const normalized = goal.toLowerCase();
    const multiStep = /\b(inspect|find|analy[sz]e|diagnos|and then|workflow|project)\b/.test(normalized);
    const system = /\b(cpu|memory|ram|system status|disk|platform|operating system)\b/.test(normalized);
    const file = /\b(read|list|create|update|delete|copy|move|search)\b.*\b(file|directory|folder|package\.json)\b/.test(normalized);
    const application = /\b(open|launch|find)\s+(vs code|visual studio code|notepad|application|app)\b/.test(normalized);
    const calculation = /\b(calculate|compute)\b|^[\d\s()+*/%.-]+$/.test(normalized);
    const coding = /\b(code|typescript|javascript|python|bug|error|debug)\b/.test(normalized);
    const type: IntentType = multiStep ? 'multi_step_task' : system ? 'system_operation' : file ? 'file_operation' : application ? 'application_operation' : calculation ? 'calculation' : coding ? 'coding' : /\?|^(what|why|how|when|where|who)\b/.test(normalized) ? 'question' : 'conversation';
    const requiresTools = system || multiStep || file || application || calculation;
    return { type, goal: goal.trim(), confidence: type === 'conversation' ? 0.7 : 0.92, requiresTools, requiresConfirmation: /\b(delete|write|send|modify|run)\b/.test(normalized), entities: {} };
  }
}
