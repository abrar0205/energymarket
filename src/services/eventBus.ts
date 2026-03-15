type Listener = (data: unknown) => void;

class EventBus {
  private listeners: Map<string, Set<Listener>> = new Map();

  subscribe(event: string, callback: Listener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  publish(event: string, data: unknown): void {
    this.listeners.get(event)?.forEach((cb) => {
      try {
        cb(data);
      } catch (e) {
        console.error(`EventBus error on "${event}":`, e);
      }
    });
  }
}

export const eventBus = new EventBus();
