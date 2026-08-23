import { describe, expect, it } from 'vitest';
import { loadConfig } from './env';

describe('loadConfig', () => {
  it('uses safe defaults when environment values are absent', () => { expect(loadConfig({})).toMatchObject({ appName: 'JARVIS', logLevel: 'info', aiProvider: 'openai', aiModel: 'gpt-4o-mini', aiApiKey: '' }); });
  it('accepts configured app name and log level', () => { expect(loadConfig({ VITE_APP_NAME: 'Test JARVIS', VITE_LOG_LEVEL: 'debug' })).toMatchObject({ appName: 'Test JARVIS', logLevel: 'debug' }); });
});