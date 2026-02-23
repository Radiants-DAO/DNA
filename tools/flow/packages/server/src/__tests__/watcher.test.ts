import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { EventEmitter } from "node:events";
import { ProjectWatcher, type FileChangeEvent } from "../watcher.js";

// Mock chokidar so no real OS watchers are created
const mockFSWatcher = new EventEmitter() as EventEmitter & { close: () => Promise<void> };
mockFSWatcher.close = vi.fn().mockResolvedValue(undefined);

vi.mock("chokidar", () => ({
  watch: vi.fn(() => mockFSWatcher),
}));

describe("ProjectWatcher", () => {
  let watcher: ProjectWatcher;

  beforeEach(() => {
    vi.useFakeTimers();
    watcher = new ProjectWatcher("/fake/project", 50);
  });

  afterEach(async () => {
    await watcher.stop();
    mockFSWatcher.removeAllListeners();
    vi.useRealTimers();
  });

  it("emits change event for .tsx files", async () => {
    watcher.start();

    const events: FileChangeEvent[] = [];
    watcher.on("change", (e: FileChangeEvent) => events.push(e));

    mockFSWatcher.emit("add", "/fake/project/Button.tsx");
    vi.advanceTimersByTime(60);

    expect(events.length).toBe(1);
    expect(events[0].type).toBe("add");
    expect(events[0].path).toContain("Button.tsx");
  });

  it("emits change event for .css files", async () => {
    watcher.start();

    const events: FileChangeEvent[] = [];
    watcher.on("change", (e: FileChangeEvent) => events.push(e));

    mockFSWatcher.emit("add", "/fake/project/tokens.css");
    vi.advanceTimersByTime(60);

    expect(events.length).toBe(1);
    expect(events[0].path).toContain("tokens.css");
  });

  it("emits change event for .schema.json files", async () => {
    watcher.start();

    const events: FileChangeEvent[] = [];
    watcher.on("change", (e: FileChangeEvent) => events.push(e));

    mockFSWatcher.emit("add", "/fake/project/Button.schema.json");
    vi.advanceTimersByTime(60);

    expect(events.length).toBe(1);
    expect(events[0].path).toContain("Button.schema.json");
  });

  it("ignores non-matching extensions", async () => {
    watcher.start();

    const events: FileChangeEvent[] = [];
    watcher.on("change", (e: FileChangeEvent) => events.push(e));

    mockFSWatcher.emit("add", "/fake/project/readme.md");
    vi.advanceTimersByTime(60);

    expect(events.length).toBe(0);
  });

  it("debounces rapid changes", async () => {
    watcher.start();

    const events: FileChangeEvent[] = [];
    watcher.on("change", (e: FileChangeEvent) => events.push(e));

    // Rapid writes to the same file
    mockFSWatcher.emit("change", "/fake/project/App.tsx");
    vi.advanceTimersByTime(10);
    mockFSWatcher.emit("change", "/fake/project/App.tsx");
    vi.advanceTimersByTime(10);
    mockFSWatcher.emit("change", "/fake/project/App.tsx");
    vi.advanceTimersByTime(60);

    // Should coalesce to 1 event due to debounce
    expect(events.length).toBe(1);
  });
});
