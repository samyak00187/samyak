import type { ToolRegistry } from '../brain/types';
import { systemTools } from './system';
import { filesystemTools } from './filesystem';
import { searchTools } from './filesystem/search';
import { applicationTools } from './applications';
import { clipboardTools } from './clipboard';
import { developerTools } from './developer';
import { utilityTools } from './utility';
import { visionTools } from './vision';

export function registerDefaultTools(registry: ToolRegistry) { [...systemTools, ...filesystemTools, ...searchTools, ...applicationTools, ...clipboardTools, ...developerTools, ...utilityTools, ...visionTools].forEach((tool) => registry.register(tool)); return registry; }
