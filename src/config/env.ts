export interface AppConfig {
  appName: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  aiProvider: 'openai' | 'anthropic' | 'google' | 'local' | 'custom';
  aiModel: string;
  aiApiKey: string;
  aiBaseUrl: string;
}

const validLogLevels = new Set<AppConfig['logLevel']>(['debug', 'info', 'warn', 'error']);

export function loadConfig(environment: Record<string, string | undefined> = import.meta.env): AppConfig {
  const configuredLevel = environment.VITE_LOG_LEVEL;
  const logLevel = validLogLevels.has(configuredLevel as AppConfig['logLevel'])
    ? (configuredLevel as AppConfig['logLevel'])
    : 'info';

  const configuredProvider = environment.AI_PROVIDER || environment.VITE_AI_PROVIDER;
  const aiProvider = ['openai', 'anthropic', 'google', 'local', 'custom'].includes(configuredProvider || '')
    ? configuredProvider as AppConfig['aiProvider']
    : 'openai';
  return {
    appName: environment.VITE_APP_NAME?.trim() || 'JARVIS',
    logLevel,
    aiProvider,
    aiModel: environment.AI_MODEL?.trim() || environment.VITE_AI_MODEL?.trim() || 'gpt-4o-mini',
    aiApiKey: environment.AI_API_KEY?.trim() || '',
    aiBaseUrl: environment.AI_BASE_URL?.trim() || 'https://api.openai.com/v1/chat/completions',
  };
}