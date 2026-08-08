import type {
  MediaEvent,
  MediaEventListener,
  MediaEventType,
} from '../types/events.js';

export class EventEmitter {
  private readonly listeners = new Map<MediaEventType, Set<MediaEventListener>>();

  on(type: MediaEventType, listener: MediaEventListener): () => void {
    let set = this.listeners.get(type);
    if (!set) {
      set = new Set();
      this.listeners.set(type, set);
    }
    set.add(listener);
    return () => {
      this.off(type, listener);
    };
  }

  off(type: MediaEventType, listener: MediaEventListener): void {
    const set = this.listeners.get(type);
    if (!set) {
      return;
    }
    set.delete(listener);
    if (set.size === 0) {
      this.listeners.delete(type);
    }
  }

  emit(event: MediaEvent): void {
    const set = this.listeners.get(event.type);
    if (!set || set.size === 0) {
      return;
    }

    for (const listener of [...set]) {
      try {
        listener(event);
      } catch {
      }
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

export function createDefaultConsoleListener(): MediaEventListener {
  return (event) => {
    const { type, payload } = event;
    const lines = [`[MediaForge] ${type}`, `mediaId: ${String(payload.mediaId)}`, `mediaType: ${payload.mediaType}`];

    if (payload.source !== undefined) {
      lines.push(`source: ${payload.source}`);
    }

    if (event.type === 'view') {
      if (event.payload.query !== undefined) {
        lines.push(`query: ${event.payload.query}`);
      }
      if (event.payload.page !== undefined) {
        lines.push(`page: ${String(event.payload.page)}`);
      }
    }

    if (payload.at !== undefined) {
      lines.push(`at: ${payload.at}`);
    }

    console.info(lines.join('\n'));
  };
}
