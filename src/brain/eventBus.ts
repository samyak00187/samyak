export type EventListener<T> = (event: T) => void;
export class EventBus<T extends { type: string }> {
  private readonly listeners = new Map<string, Set<EventListener<T>>>();
  on(type: string, listener: EventListener<T>): () => void { const listeners = this.listeners.get(type) || new Set<EventListener<T>>(); listeners.add(listener); this.listeners.set(type, listeners); return () => listeners.delete(listener); }
  emit(event: T) { this.listeners.get(event.type)?.forEach((listener) => listener(event)); }
}
