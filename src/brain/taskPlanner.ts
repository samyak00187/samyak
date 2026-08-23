import type { Intent, TaskPlan } from './types';

export class TaskPlanner {
  create(intent: Intent): TaskPlan {
    const id = crypto.randomUUID();
    const goal = intent.goal.toLowerCase();
    const requestedFile = goal.match(/(?:file|directory|folder)\s+([\w./\\-]+)/)?.[1] || goal.match(/(package\.json)/)?.[1];
    const expression = goal.replace(/^(calculate|compute)\s+/i, '').trim();
    const tool = intent.type === 'system_operation' ? goal.includes('system status') ? 'getSystemStatus' : goal.includes('cpu') ? 'get_cpu_usage' : goal.includes('memory') || goal.includes('ram') ? 'get_memory_usage' : goal.includes('disk') ? 'get_disk_usage' : goal.includes('battery') ? 'get_battery_status' : goal.includes('network') ? 'get_network_status' : goal.includes('time') || goal.includes('date') ? 'get_current_time' : 'get_system_info' : intent.type === 'file_operation' ? goal.includes('list') ? 'list_directory' : 'read_file' : intent.type === 'calculation' ? 'calculator' : intent.type === 'application_operation' ? 'find_application' : intent.type === 'multi_step_task' ? 'inspect_project' : 'get_system_info';
    const input = tool === 'calculator' ? { expression } : tool === 'read_file' ? { path: requestedFile || '' } : tool === 'list_directory' || tool === 'inspect_project' ? { path: requestedFile || process.cwd() } : tool === 'find_application' ? { name: goal.replace(/^(open|launch|find)\s+/i, '').trim() } : {};
    const steps = intent.requiresTools ? [{ id: `${id}-status`, description: `Run ${tool.replaceAll('_', ' ')}`, tool, input, status: 'pending' as const }] : [{ id: `${id}-understand`, description: 'Analyze the request using available context', status: 'pending' as const }];
    return { id, goal: intent.goal, steps, status: 'pending' };
  }
}
