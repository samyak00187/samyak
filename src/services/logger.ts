import type { AppConfig } from '../config/env';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  event: string;
  metadata?: Record<string, unknown>;
}

const priorities: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

export function createLogger(config: AppConfig, service: string) {
  function write(level: LogLevel, event: string, metadata?: Record<string, unknown>): void {
    if (priorities[level] < priorities[config.logLevel]) return;
    const entry: LogEntry = { timestamp: new Date().toISOString(), level, service, event, metadata };
    const output = JSON.stringify(entry);
    if (level === 'error') console.error(output);
    else if (level === 'warn') console.warn(output);
    else console.info(output);
  }

  return {
    debug: (event: string, metadata?: Record<string, unknown>) => write('debug', event, metadata),
    info: (event: string, metadata?: Record<string, unknown>) => write('info', event, metadata),
    warn: (event: string, metadata?: Record<string, unknown>) => write('warn', event, metadata),
    error: (event: string, metadata?: Record<string, unknown>) => write('error', event, metadata),
  };
}