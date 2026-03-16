export type PlaygroundSignalEvent =
  | { type: "work-signals"; active: string[] }
  | { type: "iterations-changed"; componentId?: string }
  | { type: "annotations-changed"; componentId?: string };

type Listener = (event: PlaygroundSignalEvent) => void;

class SignalStore {
  private active = new Set<string>();
  private listeners = new Set<Listener>();

  getActive(): string[] {
    return [...this.active];
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  workStart(componentId: string): void {
    this.active.add(componentId);
    this.emit({ type: "work-signals", active: this.getActive() });
  }

  workEnd(componentId: string): void {
    this.active.delete(componentId);
    this.emit({ type: "work-signals", active: this.getActive() });
  }

  clearAll(): void {
    this.active.clear();
    this.emit({ type: "work-signals", active: [] });
  }

  iterationsChanged(componentId?: string): void {
    this.emit({ type: "iterations-changed", componentId });
  }

  annotationsChanged(componentId?: string): void {
    this.emit({ type: "annotations-changed", componentId });
  }

  private emit(event: PlaygroundSignalEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}

export const signalStore = new SignalStore();
