import type { AppState } from '../shared/types';

export const initialAppState: AppState = { aiState: 'idle', messages: [], activeNavigation: 'home', notifications: [], connectionState: 'online' };

export function createAppStore(initialState: AppState = initialAppState) {
  let state = initialState;
  const listeners = new Set<(state: AppState) => void>();
  return {
    getState: () => state,
    setState: (nextState: AppState) => { state = nextState; listeners.forEach((listener) => listener(state)); },
    subscribe: (listener: (state: AppState) => void) => { listeners.add(listener); return () => listeners.delete(listener); },
  };
}