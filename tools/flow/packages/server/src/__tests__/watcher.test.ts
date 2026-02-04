import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ProjectWatcher, type FileChangeEvent } from "../watcher.js";

describe("ProjectWatcher", () => {
  let dir: string;
  let watcher: ProjectWatcher;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "flow-watcher-"));
    watcher = new ProjectWatcher(dir, 50); // fast debounce for tests
  });

  afterEach(async () => {
    await watcher.stop();
    rmSync(dir, { recursive: true, force: true });
  });

  it("emits change event for .tsx files", async () => {
    watcher.start();

    const events: FileChangeEvent[] = [];
    watcher.on("change", (e: FileChangeEvent) => events.push(e));

    // Wait for watcher to be ready
    await new Promise((r) => setTimeout(r, 200));

    writeFileSync(join(dir, "Button.tsx"), "export const Button = () => null;");

    await new Promise((r) => setTimeout(r, 300));
    expect(events.length).toBeGreaterThanOrEqual(1);
    expect(events[0].type).toBe("add");
    expect(events[0].path).toContain("Button.tsx");
  });

  it("emits change event for .css files", async () => {
    watcher.start();

    const events: FileChangeEvent[] = [];
    watcher.on("change", (e: FileChangeEvent) => events.push(e));

    await new Promise((r) => setTimeout(r, 200));

    writeFileSync(join(dir, "tokens.css"), "@theme { --color-sun: #FEF8E2; }");

    await new Promise((r) => setTimeout(r, 300));
    expect(events.length).toBeGreaterThanOrEqual(1);
    expect(events[0].path).toContain("tokens.css");
  });

  it("emits change event for .schema.json files", async () => {
    watcher.start();

    const events: FileChangeEvent[] = [];
    watcher.on("change", (e: FileChangeEvent) => events.push(e));

    await new Promise((r) => setTimeout(r, 200));

    writeFileSync(join(dir, "Button.schema.json"), '{"props":{}}');

    await new Promise((r) => setTimeout(r, 300));
    expect(events.length).toBeGreaterThanOrEqual(1);
    expect(events[0].path).toContain("Button.schema.json");
  });

  it("ignores non-matching extensions", async () => {
    watcher.start();

    const events: FileChangeEvent[] = [];
    watcher.on("change", (e: FileChangeEvent) => events.push(e));

    await new Promise((r) => setTimeout(r, 200));

    writeFileSync(join(dir, "readme.md"), "# Hello");

    await new Promise((r) => setTimeout(r, 300));
    expect(events.length).toBe(0);
  });

  it("debounces rapid changes", async () => {
    watcher.start();

    const events: FileChangeEvent[] = [];
    watcher.on("change", (e: FileChangeEvent) => events.push(e));

    await new Promise((r) => setTimeout(r, 200));

    const file = join(dir, "App.tsx");
    writeFileSync(file, "v1");

    await new Promise((r) => setTimeout(r, 300));
    events.length = 0; // clear add event

    // Rapid writes
    writeFileSync(file, "v2");
    writeFileSync(file, "v3");
    writeFileSync(file, "v4");

    await new Promise((r) => setTimeout(r, 300));
    // Should coalesce to 1 event due to debounce
    expect(events.length).toBe(1);
  });
});
