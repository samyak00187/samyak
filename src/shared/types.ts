import type { AIMessage, MessageRole, MessageStatus } from '../ai/types';

export type AIState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'executing' | 'success' | 'warning' | 'error' | 'offline';
export type NavigationItem = 'home' | 'chat' | 'core' | 'tools' | 'memory' | 'vision' | 'settings';
export type NotificationKind = 'info' | 'success' | 'warning' | 'error';
export interface AppNotification { id: string; kind: NotificationKind; title: string; message: string; }

export type AppMessage = AIMessage & { role: MessageRole; status: MessageStatus };

export interface AppState {
  aiState: AIState;
  messages: AppMessage[];
  activeNavigation: NavigationItem;
  notifications: AppNotification[];
  connectionState: 'online' | 'offline';
}

export interface AppError {
  code: string;
  message: string;
  cause?: unknown;
}