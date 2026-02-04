import { watch, type FSWatcher } from "chokidar";
import { EventEmitter } from "node:events";

export type FileChangeType = "add" | "change" | "unlink";

export interface FileChangeEvent {
  type: FileChangeType;
  path: string;
  timestamp: number;
}

const WATCHED_EXTENSIONS = /\.(tsx?|jsx?|css|schema\.json|dna\.json)$/;
const IGNORED = [
  "**/node_modules/**",
  "**/.git/**",
  "**/dist/**",
  "**/build/**",
  "**/.next/**",
  "**/.turbo/**",
];

export class ProjectWatcher extends EventEmitter {
  private watcher: FSWatcher | null = null;
  private debounceTimers = new Map<string, NodeJS.Timeout>();
  private debounceMs: number;

  constructor(
    private root: string,
    debounceMs = 100
  ) {
    super();
    this.debounceMs = debounceMs;
  }

  start(): void {
    // Guard against double-start which would cause duplicate events
    if (this.watcher) {
      return;
    }

    this.watcher = watch(this.root, {
      ignored: IGNORED,
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 50, pollInterval: 10 },
    });

    const handle = (type: FileChangeType) => (path: string) => {
      if (!WATCHED_EXTENSIONS.test(path)) return;

      const existing = this.debounceTimers.get(path);
      if (existing) clearTimeout(existing);

      this.debounceTimers.set(
        path,
        setTimeout(() => {
          this.debounceTimers.delete(path);
          const event: FileChangeEvent = { type, path, timestamp: Date.now() };
          this.emit("change", event);
        }, this.debounceMs)
      );
    };

    this.watcher.on("add", handle("add"));
    this.watcher.on("change", handle("change"));
    this.watcher.on("unlink", handle("unlink"));
  }

  async stop(): Promise<void> {
    for (const timer of this.debounceTimers.values()) clearTimeout(timer);
    this.debounceTimers.clear();
    await this.watcher?.close();
    this.watcher = null;
  }
}
