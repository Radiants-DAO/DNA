# Phase 5: MCP Sidecar Server

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a standalone Node.js MCP sidecar server that provides source resolution, schema/DNA enrichment, file watching, and 7 MCP tool endpoints, with the extension auto-detecting it to upgrade to dev mode.

**Architecture:** A standalone h3-based HTTP + WebSocket server running on port 3737. It watches the project root for source, schema, DNA, and CSS files via chokidar, parses tokens from CSS `@theme` blocks, resolves source maps from disk, and indexes `.schema.json` / `.dna.json` files by component name. It exposes a health endpoint, a Streamable HTTP MCP endpoint with 7 tools, and a WebSocket for real-time extension communication. On first run it auto-generates `.mcp.json`, `.cursor/mcp.json`, and `.vscode/mcp.json`.

**Tech Stack:** Node.js, h3 (HTTP/WebSocket), chokidar (file watching), @jridgewell/source-map, @modelcontextprotocol/sdk, SWC (@swc/core), TypeScript 5.8, Vitest

---

## Task 1: Scaffold `packages/server`

Create the package structure with all dependencies.

**Create `packages/server/package.json`:**

```json
{
  "name": "@flow/server",
  "version": "0.1.0",
  "type": "module",
  "bin": {
    "flow-server": "./dist/cli.js"
  },
  "exports": {
    ".": "./dist/index.js"
  },
  "scripts": {
    "dev": "tsx src/cli.ts",
    "build": "tsup src/cli.ts src/index.ts --format esm --dts",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@jridgewell/source-map": "^0.3.6",
    "@modelcontextprotocol/sdk": "^1.12.0",
    "@swc/core": "^1.10.0",
    "chokidar": "^4.0.0",
    "crossws": "^0.3.4",
    "h3": "^1.15.0",
    "listhen": "^1.9.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "tsup": "^8.4.0",
    "tsx": "^4.19.0",
    "typescript": "^5.8.0",
    "vitest": "^3.0.0"
  }
}
```

**Create `packages/server/tsconfig.json`:**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "sourceMap": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "types": ["node"]
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

**Create `packages/server/src/cli.ts`:**

```typescript
import { parseArgs } from "node:util";
import { resolve } from "node:path";
import { createServer } from "./server.js";

const { values } = parseArgs({
  options: {
    port: { type: "string", default: "3737" },
    root: { type: "string", default: "." },
  },
});

const port = parseInt(values.port ?? "3737", 10);
const root = resolve(values.root ?? ".");

async function main() {
  const server = await createServer({ port, root });
  console.log(`[flow] MCP sidecar running at http://localhost:${port}`);
  console.log(`[flow] Project root: ${root}`);
  console.log(`[flow] Health: http://localhost:${port}/__flow/health`);
  console.log(`[flow] MCP:    http://localhost:${port}/__mcp`);
  return server;
}

main().catch((err) => {
  console.error("[flow] Failed to start:", err);
  process.exit(1);
});
```

**Create `packages/server/src/index.ts`:**

```typescript
export { createServer } from "./server.js";
export type { ServerOptions } from "./server.js";
```

**Create `packages/server/src/server.ts` (stub):**

```typescript
import { createApp, createRouter, defineEventHandler, toNodeListener } from "h3";
import { listen } from "listhen";

export interface ServerOptions {
  port: number;
  root: string;
}

export async function createServer(options: ServerOptions) {
  const app = createApp();
  const router = createRouter();

  app.use(router);

  const listener = await listen(toNodeListener(app), {
    port: options.port,
    showURL: false,
  });

  return { app, router, listener, options };
}
```

**Create `packages/server/vitest.config.ts`:**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["src/**/*.test.ts"],
  },
});
```

**Verify:**

```bash
cd packages/server && pnpm install && pnpm typecheck
```

---

## Task 2: Health endpoint

Implement `GET /__flow/health` returning version, project root, and capabilities list.

**Create `packages/server/src/routes/health.ts`:**

```typescript
import { defineEventHandler } from "h3";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const pkgPath = fileURLToPath(new URL("../../package.json", import.meta.url));
const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));

export interface HealthResponse {
  status: "ok";
  version: string;
  root: string;
  capabilities: string[];
}

export function createHealthHandler(root: string) {
  return defineEventHandler((): HealthResponse => ({
    status: "ok",
    version: pkg.version,
    root,
    capabilities: [
      "source-maps",
      "schema-resolution",
      "dna-resolution",
      "token-parsing",
      "file-watching",
      "mcp-tools",
      "websocket",
    ],
  }));
}
```

**Update `packages/server/src/server.ts`** — add after `const router = createRouter();`:

```typescript
import { createHealthHandler } from "./routes/health.js";

// inside createServer, after router creation:
router.get("/__flow/health", createHealthHandler(options.root));
```

**Create `packages/server/src/routes/__tests__/health.test.ts`:**

```typescript
import { describe, it, expect } from "vitest";
import { createApp, createRouter, toNodeListener } from "h3";
import { createHealthHandler } from "../health.js";

describe("GET /__flow/health", () => {
  it("returns status ok with version and capabilities", async () => {
    const app = createApp();
    const router = createRouter();
    router.get("/__flow/health", createHealthHandler("/tmp/test-project"));
    app.use(router);

    const response = await fetch(
      new Request("http://localhost/__flow/health"),
      // @ts-expect-error h3 test
      { dispatcher: toNodeListener(app) }
    ).then(() => {
      // Use h3's test utility instead
    });

    // Integration test approach: start a real server
    const { listen } = await import("listhen");
    const listener = await listen(toNodeListener(app), { port: 0, showURL: false });
    const res = await fetch(`${listener.url}__flow/health`);
    const body = await res.json();

    expect(body.status).toBe("ok");
    expect(body.version).toBeDefined();
    expect(body.root).toBe("/tmp/test-project");
    expect(body.capabilities).toContain("mcp-tools");
    expect(body.capabilities).toContain("source-maps");
    expect(body.capabilities).toContain("file-watching");

    await listener.close();
  });
});
```

**Verify:**

```bash
cd packages/server && pnpm test
```

---

## Task 3: File watcher

Watch the project root with chokidar for relevant file extensions. Debounce at 100ms per spec section 13.6. Emit structured change events.

**Create `packages/server/src/watcher.ts`:**

```typescript
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
```

**Create `packages/server/src/__tests__/watcher.test.ts`:**

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, unlinkSync, rmSync } from "node:fs";
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
```

**Verify:**

```bash
cd packages/server && pnpm test
```

---

## Task 4: Source map reader

Read `.map` files from disk using `@jridgewell/source-map`. Cache parsed maps, invalidate on file change.

**Create `packages/server/src/services/source-maps.ts`:**

```typescript
import { TraceMap, originalPositionFor } from "@jridgewell/source-map";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";

export interface SourcePosition {
  source: string | null;
  line: number | null;
  column: number | null;
  name: string | null;
}

export class SourceMapService {
  private cache = new Map<string, TraceMap>();
  private root: string;

  constructor(root: string) {
    this.root = root;
  }

  async resolve(
    mapFilePath: string,
    line: number,
    column: number
  ): Promise<SourcePosition> {
    const absPath = resolve(this.root, mapFilePath);
    let traceMap = this.cache.get(absPath);

    if (!traceMap) {
      const raw = await readFile(absPath, "utf-8");
      traceMap = new TraceMap(raw);
      this.cache.set(absPath, traceMap);
    }

    return originalPositionFor(traceMap, { line, column });
  }

  invalidate(mapFilePath: string): void {
    const absPath = resolve(this.root, mapFilePath);
    this.cache.delete(absPath);
  }

  invalidateAll(): void {
    this.cache.clear();
  }

  /**
   * Find a .map file for a given source file.
   * Checks for file.js.map, file.map, and sourceMappingURL comment.
   */
  async findMapFile(sourceFile: string): Promise<string | null> {
    const absSource = resolve(this.root, sourceFile);
    const candidates = [`${absSource}.map`, absSource.replace(/\.[^.]+$/, ".map")];

    for (const candidate of candidates) {
      if (existsSync(candidate)) return candidate;
    }

    // Check for sourceMappingURL in the file itself
    try {
      const content = await readFile(absSource, "utf-8");
      const match = content.match(/\/\/[#@]\s*sourceMappingURL=(.+?)(?:\s|$)/);
      if (match) {
        const mapPath = resolve(dirname(absSource), match[1]);
        if (existsSync(mapPath)) return mapPath;
      }
    } catch {
      // File not readable, skip
    }

    return null;
  }
}
```

**Create `packages/server/src/services/__tests__/source-maps.test.ts`:**

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { SourceMapService } from "../source-maps.js";

describe("SourceMapService", () => {
  let dir: string;
  let service: SourceMapService;

  const SAMPLE_MAP = JSON.stringify({
    version: 3,
    file: "out.js",
    sources: ["src/Button.tsx"],
    sourcesContent: ['export const Button = () => <button>Click</button>;'],
    names: ["Button"],
    mappings: "AAAA,OAAO,MAAMA",
  });

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "flow-sourcemap-"));
    service = new SourceMapService(dir);
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("resolves an original position from a source map", async () => {
    writeFileSync(join(dir, "out.js.map"), SAMPLE_MAP);

    const pos = await service.resolve("out.js.map", 1, 0);
    expect(pos.source).toBe("src/Button.tsx");
    expect(pos.line).toBe(1);
  });

  it("caches parsed source maps", async () => {
    writeFileSync(join(dir, "out.js.map"), SAMPLE_MAP);

    await service.resolve("out.js.map", 1, 0);
    // Second call should use cache (no file read)
    const pos = await service.resolve("out.js.map", 1, 0);
    expect(pos.source).toBe("src/Button.tsx");
  });

  it("invalidates cache for a specific file", async () => {
    writeFileSync(join(dir, "out.js.map"), SAMPLE_MAP);
    await service.resolve("out.js.map", 1, 0);

    service.invalidate("out.js.map");

    // Update the map file
    const updatedMap = JSON.stringify({
      ...JSON.parse(SAMPLE_MAP),
      sources: ["src/Card.tsx"],
    });
    writeFileSync(join(dir, "out.js.map"), updatedMap);

    const pos = await service.resolve("out.js.map", 1, 0);
    expect(pos.source).toBe("src/Card.tsx");
  });

  it("finds .map files by convention", async () => {
    writeFileSync(join(dir, "out.js.map"), SAMPLE_MAP);
    const found = await service.findMapFile("out.js");
    expect(found).toBe(join(dir, "out.js.map"));
  });

  it("returns null when no map file exists", async () => {
    const found = await service.findMapFile("nonexistent.js");
    expect(found).toBeNull();
  });
});
```

**Verify:**

```bash
cd packages/server && pnpm test
```

---

## Task 5: Schema/DNA resolver

Discover and parse `.schema.json` and `.dna.json` files. Index by component name. Resolve token bindings from DNA files.

**Create `packages/server/src/services/schema-resolver.ts`:**

```typescript
import { readFile } from "node:fs/promises";
import { resolve, basename, dirname, relative } from "node:path";
import { glob } from "node:fs/promises";

export interface ComponentSchema {
  name: string;
  filePath: string;
  props: Record<string, unknown>;
  variants?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface DnaBinding {
  name: string;
  filePath: string;
  tokens: Record<string, Record<string, string>>;
  [key: string]: unknown;
}

export interface ComponentEntry {
  name: string;
  dir: string;
  schema: ComponentSchema | null;
  dna: DnaBinding | null;
  sourceFile: string | null;
}

export class SchemaResolver {
  private index = new Map<string, ComponentEntry>();
  private root: string;

  constructor(root: string) {
    this.root = root;
  }

  async scan(): Promise<void> {
    this.index.clear();
    await this.scanSchemas();
    await this.scanDna();
    await this.linkSourceFiles();
  }

  private async scanSchemas(): Promise<void> {
    const pattern = "**/*.schema.json";
    for await (const entry of glob(pattern, { cwd: this.root })) {
      const absPath = resolve(this.root, entry);
      try {
        const raw = await readFile(absPath, "utf-8");
        const parsed = JSON.parse(raw);
        const name = this.componentNameFromPath(absPath);
        const existing = this.index.get(name) ?? this.createEntry(name, dirname(absPath));
        existing.schema = { name, filePath: absPath, ...parsed };
        this.index.set(name, existing);
      } catch {
        // Skip unparseable files
      }
    }
  }

  private async scanDna(): Promise<void> {
    const pattern = "**/*.dna.json";
    for await (const entry of glob(pattern, { cwd: this.root })) {
      const absPath = resolve(this.root, entry);
      try {
        const raw = await readFile(absPath, "utf-8");
        const parsed = JSON.parse(raw);
        const name = this.componentNameFromPath(absPath);
        const existing = this.index.get(name) ?? this.createEntry(name, dirname(absPath));
        existing.dna = { name, filePath: absPath, tokens: parsed.tokens ?? {}, ...parsed };
        this.index.set(name, existing);
      } catch {
        // Skip unparseable files
      }
    }
  }

  private async linkSourceFiles(): Promise<void> {
    for (const [name, entry] of this.index) {
      const dir = entry.dir;
      const candidates = [
        resolve(dir, `${name}.tsx`),
        resolve(dir, `${name}.jsx`),
        resolve(dir, `${name}.ts`),
        resolve(dir, `${name}.js`),
      ];
      for (const candidate of candidates) {
        try {
          await readFile(candidate, "utf-8");
          entry.sourceFile = candidate;
          break;
        } catch {
          // Not found, try next
        }
      }
    }
  }

  private componentNameFromPath(filePath: string): string {
    // Button.schema.json -> Button, Button.dna.json -> Button
    return basename(filePath).replace(/\.(schema|dna)\.json$/, "");
  }

  private createEntry(name: string, dir: string): ComponentEntry {
    return { name, dir, schema: null, dna: null, sourceFile: null };
  }

  get(name: string): ComponentEntry | undefined {
    return this.index.get(name);
  }

  getAll(): ComponentEntry[] {
    return Array.from(this.index.values());
  }

  /** Invalidate a specific component by file path (on file change). */
  invalidateByPath(filePath: string): string | null {
    const name = this.componentNameFromPath(filePath);
    if (this.index.has(name)) {
      this.index.delete(name);
      return name;
    }
    return null;
  }

  /** Resolve token bindings for a component across its DNA variants. */
  resolveTokenBindings(name: string): Record<string, Record<string, string>> | null {
    const entry = this.index.get(name);
    if (!entry?.dna) return null;
    return entry.dna.tokens;
  }
}
```

**Create `packages/server/src/services/__tests__/schema-resolver.test.ts`:**

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { SchemaResolver } from "../schema-resolver.js";

describe("SchemaResolver", () => {
  let dir: string;
  let resolver: SchemaResolver;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "flow-schema-"));
    resolver = new SchemaResolver(dir);
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("discovers and indexes .schema.json files", async () => {
    const compDir = join(dir, "components", "Button");
    mkdirSync(compDir, { recursive: true });
    writeFileSync(
      join(compDir, "Button.schema.json"),
      JSON.stringify({
        props: { variant: { type: "string", enum: ["primary", "secondary"] } },
      })
    );

    await resolver.scan();

    const entry = resolver.get("Button");
    expect(entry).toBeDefined();
    expect(entry!.schema).toBeDefined();
    expect(entry!.schema!.props).toHaveProperty("variant");
  });

  it("discovers and indexes .dna.json files", async () => {
    const compDir = join(dir, "components", "Button");
    mkdirSync(compDir, { recursive: true });
    writeFileSync(
      join(compDir, "Button.dna.json"),
      JSON.stringify({
        tokens: {
          default: { background: "var(--color-surface-primary)" },
          primary: { background: "var(--color-brand-sun)" },
        },
      })
    );

    await resolver.scan();

    const entry = resolver.get("Button");
    expect(entry).toBeDefined();
    expect(entry!.dna).toBeDefined();
    expect(entry!.dna!.tokens.primary.background).toBe("var(--color-brand-sun)");
  });

  it("links source files to component entries", async () => {
    const compDir = join(dir, "components", "Card");
    mkdirSync(compDir, { recursive: true });
    writeFileSync(join(compDir, "Card.schema.json"), JSON.stringify({ props: {} }));
    writeFileSync(join(compDir, "Card.tsx"), "export const Card = () => null;");

    await resolver.scan();

    const entry = resolver.get("Card");
    expect(entry!.sourceFile).toContain("Card.tsx");
  });

  it("resolves token bindings for a component", async () => {
    const compDir = join(dir, "components", "Alert");
    mkdirSync(compDir, { recursive: true });
    writeFileSync(
      join(compDir, "Alert.dna.json"),
      JSON.stringify({
        tokens: {
          default: { border: "var(--color-edge-primary)" },
          error: { border: "var(--color-status-error)" },
        },
      })
    );

    await resolver.scan();

    const bindings = resolver.resolveTokenBindings("Alert");
    expect(bindings).toBeDefined();
    expect(bindings!.error.border).toBe("var(--color-status-error)");
  });

  it("returns undefined for unknown components", () => {
    expect(resolver.get("NonExistent")).toBeUndefined();
  });

  it("invalidates by file path", async () => {
    const compDir = join(dir, "components", "Tag");
    mkdirSync(compDir, { recursive: true });
    writeFileSync(join(compDir, "Tag.schema.json"), JSON.stringify({ props: {} }));

    await resolver.scan();
    expect(resolver.get("Tag")).toBeDefined();

    resolver.invalidateByPath(join(compDir, "Tag.schema.json"));
    expect(resolver.get("Tag")).toBeUndefined();
  });
});
```

**Verify:**

```bash
cd packages/server && pnpm test
```

---

## Task 6: Token parser

Parse CSS `@theme` blocks, extract custom properties, classify into brand vs semantic tiers, and track values per color mode.

**Create `packages/server/src/services/token-parser.ts`:**

```typescript
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { glob } from "node:fs/promises";

export type TokenTier = "brand" | "semantic" | "unknown";

export interface TokenDefinition {
  name: string;
  value: string;
  tier: TokenTier;
  file: string;
  colorMode: "light" | "dark" | "default";
}

export interface TokenIndex {
  all: TokenDefinition[];
  byTier: { brand: TokenDefinition[]; semantic: TokenDefinition[]; unknown: TokenDefinition[] };
  byName: Map<string, TokenDefinition[]>;
}

/**
 * Semantic token prefixes per DNA convention.
 * Tokens using surface-*, content-*, edge-* are semantic.
 * Raw palette tokens (e.g., --color-sun-yellow) are brand.
 */
const SEMANTIC_PREFIXES = [
  "surface",
  "content",
  "edge",
  "status",
  "interactive",
  "focus",
  "overlay",
];

export class TokenParser {
  private root: string;
  private tokens: TokenDefinition[] = [];

  constructor(root: string) {
    this.root = root;
  }

  async scan(): Promise<void> {
    this.tokens = [];

    for await (const entry of glob("**/*.css", { cwd: this.root })) {
      const absPath = resolve(this.root, entry);
      // Skip node_modules, dist, etc.
      if (/node_modules|\.next|dist|build/.test(absPath)) continue;

      try {
        const content = await readFile(absPath, "utf-8");
        this.parseFile(content, absPath);
      } catch {
        // Skip unreadable files
      }
    }
  }

  private parseFile(content: string, filePath: string): void {
    // Detect color mode from file context
    const isDarkFile = /dark/i.test(filePath);

    // Parse @theme blocks: @theme { --color-foo: #bar; }
    const themeRegex = /@theme\s*\{([^}]+)\}/g;
    let match: RegExpExecArray | null;

    while ((match = themeRegex.exec(content)) !== null) {
      this.parseProperties(match[1], filePath, isDarkFile ? "dark" : "default");
    }

    // Parse :root and .dark selectors for Tailwind v4 compatibility
    const rootRegex = /:root\s*\{([^}]+)\}/g;
    while ((match = rootRegex.exec(content)) !== null) {
      this.parseProperties(match[1], filePath, "light");
    }

    const darkRegex = /\.dark\s*\{([^}]+)\}|@media\s*\(prefers-color-scheme:\s*dark\)\s*\{[^{]*\{([^}]+)\}/g;
    while ((match = darkRegex.exec(content)) !== null) {
      this.parseProperties(match[1] ?? match[2], filePath, "dark");
    }
  }

  private parseProperties(block: string, filePath: string, colorMode: TokenDefinition["colorMode"]): void {
    const propRegex = /--([\w-]+)\s*:\s*([^;]+);/g;
    let match: RegExpExecArray | null;

    while ((match = propRegex.exec(block)) !== null) {
      const name = `--${match[1]}`;
      const value = match[2].trim();
      const tier = this.classifyTier(name);

      this.tokens.push({ name, value, tier, file: filePath, colorMode });
    }
  }

  private classifyTier(name: string): TokenTier {
    // Remove -- prefix for matching
    const stripped = name.replace(/^--/, "");

    // Check for semantic prefixes (e.g., --color-surface-primary)
    for (const prefix of SEMANTIC_PREFIXES) {
      if (stripped.includes(prefix)) return "semantic";
    }

    // If it references another var, likely semantic
    // Brand tokens are raw values (hex, rgb, hsl)
    // This is a heuristic; DNA convention says tier 1 = raw palette
    return "brand";
  }

  getIndex(): TokenIndex {
    const byTier = { brand: [] as TokenDefinition[], semantic: [] as TokenDefinition[], unknown: [] as TokenDefinition[] };
    const byName = new Map<string, TokenDefinition[]>();

    for (const token of this.tokens) {
      byTier[token.tier].push(token);
      const existing = byName.get(token.name) ?? [];
      existing.push(token);
      byName.set(token.name, existing);
    }

    return { all: this.tokens, byTier, byName };
  }

  invalidateFile(filePath: string): void {
    this.tokens = this.tokens.filter((t) => t.file !== filePath);
  }
}
```

**Create `packages/server/src/services/__tests__/token-parser.test.ts`:**

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { TokenParser } from "../token-parser.js";

describe("TokenParser", () => {
  let dir: string;
  let parser: TokenParser;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "flow-tokens-"));
    parser = new TokenParser(dir);
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("parses @theme blocks and extracts custom properties", async () => {
    writeFileSync(
      join(dir, "tokens.css"),
      `@theme {
        --color-sun-yellow: #FEF8E2;
        --color-surface-primary: #FFFFFF;
        --spacing-md: 16px;
      }`
    );

    await parser.scan();
    const index = parser.getIndex();

    expect(index.all.length).toBe(3);
    expect(index.byName.get("--color-sun-yellow")).toBeDefined();
    expect(index.byName.get("--color-surface-primary")).toBeDefined();
  });

  it("classifies semantic tokens correctly", async () => {
    writeFileSync(
      join(dir, "tokens.css"),
      `@theme {
        --color-surface-primary: #FFFFFF;
        --color-content-primary: #0F0E0C;
        --color-edge-primary: #E5E5E5;
      }`
    );

    await parser.scan();
    const index = parser.getIndex();

    expect(index.byTier.semantic.length).toBe(3);
  });

  it("classifies brand tokens correctly", async () => {
    writeFileSync(
      join(dir, "tokens.css"),
      `@theme {
        --color-sun-yellow: #FEF8E2;
        --color-midnight-blue: #1A1A2E;
      }`
    );

    await parser.scan();
    const index = parser.getIndex();

    expect(index.byTier.brand.length).toBe(2);
  });

  it("detects dark mode tokens from dark.css", async () => {
    writeFileSync(
      join(dir, "dark.css"),
      `@theme {
        --color-surface-primary: #1A1A2E;
      }`
    );

    await parser.scan();
    const index = parser.getIndex();

    expect(index.all[0].colorMode).toBe("dark");
  });

  it("detects dark mode from .dark selector", async () => {
    writeFileSync(
      join(dir, "tokens.css"),
      `.dark {
        --color-surface-primary: #1A1A2E;
      }`
    );

    await parser.scan();
    const index = parser.getIndex();

    expect(index.all[0].colorMode).toBe("dark");
  });

  it("tracks tokens per color mode via byName", async () => {
    writeFileSync(
      join(dir, "tokens.css"),
      `@theme {
        --color-surface-primary: #FFFFFF;
      }`
    );
    writeFileSync(
      join(dir, "dark.css"),
      `@theme {
        --color-surface-primary: #1A1A2E;
      }`
    );

    await parser.scan();
    const index = parser.getIndex();

    const entries = index.byName.get("--color-surface-primary");
    expect(entries).toBeDefined();
    expect(entries!.length).toBe(2);
    expect(entries!.map((e) => e.colorMode).sort()).toEqual(["dark", "default"]);
  });

  it("invalidates tokens from a specific file", async () => {
    const file = join(dir, "tokens.css");
    writeFileSync(
      file,
      `@theme { --color-sun: #FEF8E2; }`
    );

    await parser.scan();
    expect(parser.getIndex().all.length).toBe(1);

    parser.invalidateFile(file);
    expect(parser.getIndex().all.length).toBe(0);
  });
});
```

**Verify:**

```bash
cd packages/server && pnpm test
```

---

## Task 7: MCP endpoint with 7 tools

Implement `/__mcp` as a Streamable HTTP endpoint using `@modelcontextprotocol/sdk`. Register all 7 MCP tools.

**Create `packages/server/src/services/context-store.ts`:**

```typescript
/**
 * In-memory store for data pushed from the extension via WebSocket.
 * MCP tools read from this store to answer queries.
 */
export interface ElementContext {
  selector: string;
  componentName?: string;
  filePath?: string;
  line?: number;
  column?: number;
  props?: Record<string, unknown>;
  parentChain?: string[];
  appliedTokens?: Record<string, string>;
  computedStyles?: Record<string, string>;
}

export interface MutationDiff {
  selector: string;
  componentName?: string;
  filePath?: string;
  property: string;
  before: string;
  after: string;
  timestamp: number;
}

export interface AnimationState {
  selector: string;
  animations: Array<{
    name: string;
    type: "css" | "waapi" | "gsap";
    duration: number;
    delay: number;
    easing: string;
    keyframes: Record<string, unknown>[];
    playState: string;
  }>;
}

export class ContextStore {
  private elements = new Map<string, ElementContext>();
  private componentTree: Record<string, unknown>[] = [];
  private mutations: MutationDiff[] = [];
  private animationStates = new Map<string, AnimationState>();
  private extractedStyles = new Map<string, Record<string, unknown>>();

  setElementContext(selector: string, context: ElementContext): void {
    this.elements.set(selector, context);
  }

  getElementContext(selector: string): ElementContext | undefined {
    return this.elements.get(selector);
  }

  setComponentTree(tree: Record<string, unknown>[]): void {
    this.componentTree = tree;
  }

  getComponentTree(): Record<string, unknown>[] {
    return this.componentTree;
  }

  addMutation(diff: MutationDiff): void {
    this.mutations.push(diff);
  }

  getMutations(): MutationDiff[] {
    return this.mutations;
  }

  clearMutations(): void {
    this.mutations = [];
  }

  setAnimationState(selector: string, state: AnimationState): void {
    this.animationStates.set(selector, state);
  }

  getAnimationState(selector?: string): AnimationState[] {
    if (selector) {
      const state = this.animationStates.get(selector);
      return state ? [state] : [];
    }
    return Array.from(this.animationStates.values());
  }

  setExtractedStyles(selector: string, styles: Record<string, unknown>): void {
    this.extractedStyles.set(selector, styles);
  }

  getExtractedStyles(selector?: string): Record<string, unknown>[] {
    if (selector) {
      const styles = this.extractedStyles.get(selector);
      return styles ? [styles] : [];
    }
    return Array.from(this.extractedStyles.values());
  }
}
```

**Create `packages/server/src/routes/mcp.ts`:**

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { defineEventHandler, readBody, getMethod, setResponseStatus } from "h3";
import type { SchemaResolver } from "../services/schema-resolver.js";
import type { TokenParser } from "../services/token-parser.js";
import type { SourceMapService } from "../services/source-maps.js";
import type { ContextStore } from "../services/context-store.js";

export interface McpDependencies {
  schemaResolver: SchemaResolver;
  tokenParser: TokenParser;
  sourceMapService: SourceMapService;
  contextStore: ContextStore;
}

const TOOLS = [
  {
    name: "get_element_context",
    description:
      "Get full context for a DOM element: component name, file path, line number, props, applied tokens, schema metadata, DNA bindings, and parent component chain.",
    inputSchema: {
      type: "object" as const,
      properties: {
        selector: { type: "string", description: "CSS selector for the element" },
      },
      required: ["selector"],
    },
  },
  {
    name: "get_component_tree",
    description:
      "Get the full React component tree with source locations, component names, prop summaries, and child counts.",
    inputSchema: { type: "object" as const, properties: {} },
  },
  {
    name: "get_page_tokens",
    description:
      "Get all CSS custom properties defined in the project, grouped by tier (brand vs semantic), with current values per color mode.",
    inputSchema: { type: "object" as const, properties: {} },
  },
  {
    name: "get_design_audit",
    description:
      "Audit the project for DNA violations: hardcoded colors, missing tokens, non-semantic token usage, motion violations. Each violation includes file:line and a suggested fix.",
    inputSchema: { type: "object" as const, properties: {} },
  },
  {
    name: "get_animation_state",
    description:
      "Get all active animations (CSS, WAAPI, GSAP) with targets, properties, keyframes, timing, easing, and playback state.",
    inputSchema: {
      type: "object" as const,
      properties: {
        selector: { type: "string", description: "Optional CSS selector to filter" },
      },
    },
  },
  {
    name: "get_extracted_styles",
    description:
      "Get extracted styles: clustered color palette, typography scale, spacing scale, layout structure, shadows, and radii.",
    inputSchema: {
      type: "object" as const,
      properties: {
        selector: { type: "string", description: "Optional CSS selector to filter" },
      },
    },
  },
  {
    name: "get_mutation_diffs",
    description:
      "Get all accumulated visual changes from the current session. Each diff includes source file reference, property, before/after values.",
    inputSchema: { type: "object" as const, properties: {} },
  },
];

export function createMcpServer(deps: McpDependencies): Server {
  const server = new Server(
    { name: "flow", version: "0.1.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "get_element_context": {
        const selector = (args as { selector: string }).selector;
        const liveContext = deps.contextStore.getElementContext(selector);
        const componentName = liveContext?.componentName;
        const schemaEntry = componentName
          ? deps.schemaResolver.get(componentName)
          : undefined;
        const tokenBindings = componentName
          ? deps.schemaResolver.resolveTokenBindings(componentName)
          : null;

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  selector,
                  ...(liveContext ?? {}),
                  schema: schemaEntry?.schema ?? null,
                  dnaBindings: tokenBindings,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "get_component_tree": {
        const tree = deps.contextStore.getComponentTree();
        return {
          content: [{ type: "text", text: JSON.stringify(tree, null, 2) }],
        };
      }

      case "get_page_tokens": {
        const index = deps.tokenParser.getIndex();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  brand: index.byTier.brand,
                  semantic: index.byTier.semantic,
                  total: index.all.length,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "get_design_audit": {
        // Audit: find components with DNA bindings that reference undefined tokens
        const components = deps.schemaResolver.getAll();
        const tokenIndex = deps.tokenParser.getIndex();
        const tokenNames = new Set(tokenIndex.all.map((t) => t.name));
        const violations: Array<{
          type: string;
          component: string;
          file: string | null;
          detail: string;
          suggestion: string;
        }> = [];

        for (const comp of components) {
          if (!comp.dna) continue;
          for (const [variant, bindings] of Object.entries(comp.dna.tokens)) {
            for (const [prop, value] of Object.entries(bindings)) {
              // Check for hardcoded hex colors
              if (/^#[0-9a-fA-F]{3,8}$/.test(value)) {
                violations.push({
                  type: "hardcoded-color",
                  component: comp.name,
                  file: comp.dna.filePath,
                  detail: `${prop} in variant "${variant}" uses hardcoded color ${value}`,
                  suggestion: `Use a token reference like var(--color-surface-primary) instead of ${value}`,
                });
              }
              // Check for var() references to undefined tokens
              const varMatch = value.match(/var\((--[\w-]+)\)/);
              if (varMatch && !tokenNames.has(varMatch[1])) {
                violations.push({
                  type: "undefined-token",
                  component: comp.name,
                  file: comp.dna.filePath,
                  detail: `${prop} in variant "${variant}" references undefined token ${varMatch[1]}`,
                  suggestion: `Define ${varMatch[1]} in your tokens.css @theme block`,
                });
              }
            }
          }
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ violations, count: violations.length }, null, 2),
            },
          ],
        };
      }

      case "get_animation_state": {
        const selector = (args as { selector?: string }).selector;
        const states = deps.contextStore.getAnimationState(selector);
        return {
          content: [{ type: "text", text: JSON.stringify(states, null, 2) }],
        };
      }

      case "get_extracted_styles": {
        const selector = (args as { selector?: string }).selector;
        const styles = deps.contextStore.getExtractedStyles(selector);
        return {
          content: [{ type: "text", text: JSON.stringify(styles, null, 2) }],
        };
      }

      case "get_mutation_diffs": {
        const diffs = deps.contextStore.getMutations();
        return {
          content: [{ type: "text", text: JSON.stringify(diffs, null, 2) }],
        };
      }

      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  });

  return server;
}

/**
 * Create h3 event handler for the /__mcp endpoint.
 * Uses Streamable HTTP transport per MCP spec.
 */
export function createMcpHandler(deps: McpDependencies) {
  const transports = new Map<string, StreamableHTTPServerTransport>();

  return defineEventHandler(async (event) => {
    const method = getMethod(event);

    if (method === "POST") {
      const body = await readBody(event);
      const sessionId = event.headers.get("mcp-session-id");

      let transport: StreamableHTTPServerTransport;

      if (sessionId && transports.has(sessionId)) {
        transport = transports.get(sessionId)!;
      } else {
        const server = createMcpServer(deps);
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => crypto.randomUUID(),
        });
        await server.connect(transport);

        // Store transport after connection establishes session
        transport.sessionId && transports.set(transport.sessionId, transport);
      }

      // Delegate to the transport's request handler
      const req = event.node.req;
      const res = event.node.res;

      // Set the body on the request for the transport to read
      (req as any).body = JSON.stringify(body);

      await transport.handleRequest(req, res, body);
    } else if (method === "DELETE") {
      const sessionId = event.headers.get("mcp-session-id");
      if (sessionId && transports.has(sessionId)) {
        const transport = transports.get(sessionId)!;
        await transport.close();
        transports.delete(sessionId);
      }
      setResponseStatus(event, 200);
      return { ok: true };
    } else {
      setResponseStatus(event, 405);
      return { error: "Method not allowed" };
    }
  });
}
```

**Create `packages/server/src/routes/__tests__/mcp.test.ts`:**

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { createMcpServer, type McpDependencies } from "../mcp.js";
import { SchemaResolver } from "../../services/schema-resolver.js";
import { TokenParser } from "../../services/token-parser.js";
import { SourceMapService } from "../../services/source-maps.js";
import { ContextStore } from "../../services/context-store.js";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

describe("MCP Tools", () => {
  let dir: string;
  let deps: McpDependencies;
  let client: Client;

  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), "flow-mcp-"));
    deps = {
      schemaResolver: new SchemaResolver(dir),
      tokenParser: new TokenParser(dir),
      sourceMapService: new SourceMapService(dir),
      contextStore: new ContextStore(),
    };

    const server = createMcpServer(deps);
    client = new Client({ name: "test-client", version: "1.0.0" });

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await Promise.all([
      client.connect(clientTransport),
      server.connect(serverTransport),
    ]);
  });

  it("lists all 7 tools", async () => {
    const result = await client.listTools();
    expect(result.tools.length).toBe(7);
    const names = result.tools.map((t) => t.name).sort();
    expect(names).toEqual([
      "get_animation_state",
      "get_component_tree",
      "get_design_audit",
      "get_element_context",
      "get_extracted_styles",
      "get_mutation_diffs",
      "get_page_tokens",
    ]);
  });

  it("get_element_context returns enriched context", async () => {
    deps.contextStore.setElementContext(".btn", {
      selector: ".btn",
      componentName: "Button",
      filePath: "src/Button.tsx",
      line: 10,
      props: { variant: "primary" },
    });

    const compDir = join(dir, "components", "Button");
    mkdirSync(compDir, { recursive: true });
    writeFileSync(
      join(compDir, "Button.schema.json"),
      JSON.stringify({ props: { variant: { type: "string" } } })
    );
    writeFileSync(
      join(compDir, "Button.dna.json"),
      JSON.stringify({ tokens: { primary: { bg: "var(--color-brand-sun)" } } })
    );
    await deps.schemaResolver.scan();

    const result = await client.callTool({
      name: "get_element_context",
      arguments: { selector: ".btn" },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed = JSON.parse(text);
    expect(parsed.componentName).toBe("Button");
    expect(parsed.schema).toBeDefined();
    expect(parsed.dnaBindings).toBeDefined();
  });

  it("get_page_tokens returns brand and semantic tokens", async () => {
    writeFileSync(
      join(dir, "tokens.css"),
      `@theme {
        --color-sun-yellow: #FEF8E2;
        --color-surface-primary: #FFFFFF;
      }`
    );
    await deps.tokenParser.scan();

    const result = await client.callTool({
      name: "get_page_tokens",
      arguments: {},
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed = JSON.parse(text);
    expect(parsed.total).toBe(2);
    expect(parsed.brand.length).toBe(1);
    expect(parsed.semantic.length).toBe(1);
  });

  it("get_design_audit detects hardcoded colors in DNA", async () => {
    const compDir = join(dir, "components", "Badge");
    mkdirSync(compDir, { recursive: true });
    writeFileSync(
      join(compDir, "Badge.dna.json"),
      JSON.stringify({ tokens: { default: { background: "#FF0000" } } })
    );
    await deps.schemaResolver.scan();

    const result = await client.callTool({
      name: "get_design_audit",
      arguments: {},
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed = JSON.parse(text);
    expect(parsed.count).toBeGreaterThan(0);
    expect(parsed.violations[0].type).toBe("hardcoded-color");
  });

  it("get_design_audit detects undefined token references", async () => {
    const compDir = join(dir, "components", "Badge");
    mkdirSync(compDir, { recursive: true });
    writeFileSync(
      join(compDir, "Badge.dna.json"),
      JSON.stringify({ tokens: { default: { background: "var(--color-nonexistent)" } } })
    );
    writeFileSync(join(dir, "tokens.css"), "@theme { --color-sun: #FEF8E2; }");
    await deps.schemaResolver.scan();
    await deps.tokenParser.scan();

    const result = await client.callTool({
      name: "get_design_audit",
      arguments: {},
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed = JSON.parse(text);
    expect(parsed.violations[0].type).toBe("undefined-token");
  });

  it("get_mutation_diffs returns accumulated diffs", async () => {
    deps.contextStore.addMutation({
      selector: ".hero",
      property: "padding",
      before: "16px",
      after: "24px",
      timestamp: Date.now(),
    });

    const result = await client.callTool({
      name: "get_mutation_diffs",
      arguments: {},
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed = JSON.parse(text);
    expect(parsed.length).toBe(1);
    expect(parsed[0].property).toBe("padding");
  });

  it("get_component_tree returns the tree", async () => {
    deps.contextStore.setComponentTree([
      { name: "App", children: [{ name: "Header" }, { name: "Main" }] },
    ]);

    const result = await client.callTool({
      name: "get_component_tree",
      arguments: {},
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed = JSON.parse(text);
    expect(parsed[0].name).toBe("App");
  });

  it("get_animation_state returns animation data", async () => {
    deps.contextStore.setAnimationState(".hero", {
      selector: ".hero",
      animations: [
        {
          name: "fadeIn",
          type: "css",
          duration: 300,
          delay: 0,
          easing: "ease-out",
          keyframes: [{ opacity: 0 }, { opacity: 1 }],
          playState: "running",
        },
      ],
    });

    const result = await client.callTool({
      name: "get_animation_state",
      arguments: { selector: ".hero" },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed = JSON.parse(text);
    expect(parsed[0].animations[0].name).toBe("fadeIn");
  });
});
```

**Verify:**

```bash
cd packages/server && pnpm test
```

---

## Task 8: WebSocket server

Add a WebSocket endpoint for real-time extension communication. Push file change events, receive mutation diffs and element context updates.

**Create `packages/server/src/routes/websocket.ts`:**

```typescript
import type { Peer } from "crossws";
import type { ProjectWatcher, FileChangeEvent } from "../watcher.js";
import type { ContextStore, ElementContext, MutationDiff, AnimationState } from "../services/context-store.js";

export type WsMessageType =
  | "file-change"
  | "element-context"
  | "component-tree"
  | "mutation-diff"
  | "animation-state"
  | "extracted-styles"
  | "ping"
  | "pong";

export interface WsMessage {
  type: WsMessageType;
  payload: unknown;
}

export function createWebSocketHandler(
  watcher: ProjectWatcher,
  contextStore: ContextStore
) {
  const peers = new Set<Peer>();

  // Forward file changes to all connected peers
  watcher.on("change", (event: FileChangeEvent) => {
    broadcast({ type: "file-change", payload: event });
  });

  function broadcast(message: WsMessage): void {
    const data = JSON.stringify(message);
    for (const peer of peers) {
      try {
        peer.send(data);
      } catch {
        peers.delete(peer);
      }
    }
  }

  return {
    open(peer: Peer) {
      peers.add(peer);
    },

    message(peer: Peer, rawMessage: { text: () => string }) {
      try {
        const msg: WsMessage = JSON.parse(rawMessage.text());

        switch (msg.type) {
          case "ping":
            peer.send(JSON.stringify({ type: "pong", payload: null }));
            break;

          case "element-context": {
            const ctx = msg.payload as ElementContext;
            contextStore.setElementContext(ctx.selector, ctx);
            break;
          }

          case "component-tree": {
            contextStore.setComponentTree(msg.payload as Record<string, unknown>[]);
            break;
          }

          case "mutation-diff": {
            const diff = msg.payload as MutationDiff;
            contextStore.addMutation(diff);
            break;
          }

          case "animation-state": {
            const state = msg.payload as AnimationState;
            contextStore.setAnimationState(state.selector, state);
            break;
          }

          case "extracted-styles": {
            const data = msg.payload as { selector: string; styles: Record<string, unknown> };
            contextStore.setExtractedStyles(data.selector, data.styles);
            break;
          }
        }
      } catch {
        // Ignore malformed messages
      }
    },

    close(peer: Peer) {
      peers.delete(peer);
    },

    /** Expose broadcast for direct use by other services */
    broadcast,
    peers,
  };
}
```

**Update `packages/server/src/server.ts`** to wire the WebSocket handler:

```typescript
import { createApp, createRouter, defineEventHandler, toNodeListener } from "h3";
import { listen } from "listhen";
import { createHealthHandler } from "./routes/health.js";
import { createMcpHandler } from "./routes/mcp.js";
import { createWebSocketHandler } from "./routes/websocket.js";
import { ProjectWatcher } from "./watcher.js";
import { SchemaResolver } from "./services/schema-resolver.js";
import { TokenParser } from "./services/token-parser.js";
import { SourceMapService } from "./services/source-maps.js";
import { ContextStore } from "./services/context-store.js";

export interface ServerOptions {
  port: number;
  root: string;
}

export async function createServer(options: ServerOptions) {
  // Initialize services
  const schemaResolver = new SchemaResolver(options.root);
  const tokenParser = new TokenParser(options.root);
  const sourceMapService = new SourceMapService(options.root);
  const contextStore = new ContextStore();
  const watcher = new ProjectWatcher(options.root);

  // Initial scan
  await schemaResolver.scan();
  await tokenParser.scan();

  // Start file watcher
  watcher.start();

  // Re-scan on relevant file changes
  watcher.on("change", async (event: { type: string; path: string }) => {
    if (event.path.endsWith(".schema.json") || event.path.endsWith(".dna.json")) {
      await schemaResolver.scan();
    }
    if (event.path.endsWith(".css")) {
      tokenParser.invalidateFile(event.path);
      await tokenParser.scan();
    }
    if (event.path.endsWith(".map")) {
      sourceMapService.invalidate(event.path);
    }
  });

  const app = createApp();
  const router = createRouter();

  // Health
  router.get("/__flow/health", createHealthHandler(options.root));

  // MCP
  const mcpDeps = { schemaResolver, tokenParser, sourceMapService, contextStore };
  const mcpHandler = createMcpHandler(mcpDeps);
  router.post("/__mcp", mcpHandler);
  router.delete("/__mcp", mcpHandler);

  // WebSocket
  const wsHandler = createWebSocketHandler(watcher, contextStore);
  router.get(
    "/__flow/ws",
    defineEventHandler({
      handler: () => {},
      websocket: wsHandler,
    })
  );

  app.use(router);

  const listener = await listen(toNodeListener(app), {
    port: options.port,
    showURL: false,
    ws: true,
  });

  return {
    app,
    router,
    listener,
    options,
    services: { schemaResolver, tokenParser, sourceMapService, contextStore, watcher },
    async close() {
      await watcher.stop();
      await listener.close();
    },
  };
}
```

**Create `packages/server/src/routes/__tests__/websocket.test.ts`:**

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { EventEmitter } from "node:events";
import { createWebSocketHandler } from "../websocket.js";
import { ContextStore } from "../../services/context-store.js";

// Mock peer
function createMockPeer() {
  const sent: string[] = [];
  return {
    send(data: string) { sent.push(data); },
    sent,
  };
}

// Mock watcher (just an EventEmitter)
function createMockWatcher() {
  return new EventEmitter() as any;
}

describe("WebSocket handler", () => {
  let watcher: EventEmitter;
  let contextStore: ContextStore;
  let handler: ReturnType<typeof createWebSocketHandler>;

  beforeEach(() => {
    watcher = createMockWatcher();
    contextStore = new ContextStore();
    handler = createWebSocketHandler(watcher as any, contextStore);
  });

  it("broadcasts file changes to connected peers", () => {
    const peer = createMockPeer();
    handler.open(peer as any);

    watcher.emit("change", { type: "change", path: "src/App.tsx", timestamp: 1 });

    expect(peer.sent.length).toBe(1);
    const msg = JSON.parse(peer.sent[0]);
    expect(msg.type).toBe("file-change");
    expect(msg.payload.path).toBe("src/App.tsx");
  });

  it("stores element context from extension messages", () => {
    const peer = createMockPeer();
    handler.open(peer as any);

    handler.message(peer as any, {
      text: () =>
        JSON.stringify({
          type: "element-context",
          payload: { selector: ".btn", componentName: "Button" },
        }),
    });

    const ctx = contextStore.getElementContext(".btn");
    expect(ctx?.componentName).toBe("Button");
  });

  it("stores mutation diffs from extension messages", () => {
    const peer = createMockPeer();
    handler.open(peer as any);

    handler.message(peer as any, {
      text: () =>
        JSON.stringify({
          type: "mutation-diff",
          payload: {
            selector: ".hero",
            property: "padding",
            before: "16px",
            after: "24px",
            timestamp: Date.now(),
          },
        }),
    });

    const diffs = contextStore.getMutations();
    expect(diffs.length).toBe(1);
    expect(diffs[0].property).toBe("padding");
  });

  it("responds to ping with pong", () => {
    const peer = createMockPeer();
    handler.open(peer as any);

    handler.message(peer as any, {
      text: () => JSON.stringify({ type: "ping", payload: null }),
    });

    expect(peer.sent.length).toBe(1);
    const msg = JSON.parse(peer.sent[0]);
    expect(msg.type).toBe("pong");
  });

  it("cleans up peers on close", () => {
    const peer = createMockPeer();
    handler.open(peer as any);
    expect(handler.peers.size).toBe(1);

    handler.close(peer as any);
    expect(handler.peers.size).toBe(0);
  });
});
```

**Verify:**

```bash
cd packages/server && pnpm test
```

---

## Task 9: Auto-config

Generate `.mcp.json`, `.cursor/mcp.json`, `.vscode/mcp.json` on first run. Append entries to `.gitignore`.

**Create `packages/server/src/auto-config.ts`:**

```typescript
import { writeFile, readFile, mkdir, access } from "node:fs/promises";
import { join } from "node:path";

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function generateMcpConfigs(root: string, port: number): Promise<string[]> {
  const created: string[] = [];
  const url = `http://localhost:${port}/__mcp`;

  // .mcp.json (Claude Code)
  const mcpJsonPath = join(root, ".mcp.json");
  if (!(await fileExists(mcpJsonPath))) {
    await writeFile(
      mcpJsonPath,
      JSON.stringify(
        {
          mcpServers: {
            flow: {
              type: "streamable-http",
              url,
            },
          },
        },
        null,
        2
      ) + "\n"
    );
    created.push(".mcp.json");
  }

  // .cursor/mcp.json
  const cursorDir = join(root, ".cursor");
  const cursorPath = join(cursorDir, "mcp.json");
  if (!(await fileExists(cursorPath))) {
    await mkdir(cursorDir, { recursive: true });
    await writeFile(
      cursorPath,
      JSON.stringify(
        {
          mcpServers: {
            flow: { url },
          },
        },
        null,
        2
      ) + "\n"
    );
    created.push(".cursor/mcp.json");
  }

  // .vscode/mcp.json
  const vscodeDir = join(root, ".vscode");
  const vscodePath = join(vscodeDir, "mcp.json");
  if (!(await fileExists(vscodePath))) {
    await mkdir(vscodeDir, { recursive: true });
    await writeFile(
      vscodePath,
      JSON.stringify(
        {
          mcpServers: {
            flow: { url },
          },
        },
        null,
        2
      ) + "\n"
    );
    created.push(".vscode/mcp.json");
  }

  // Update .gitignore
  await ensureGitignoreEntries(root, [".mcp.json", ".cursor/mcp.json", ".vscode/mcp.json"]);

  return created;
}

async function ensureGitignoreEntries(root: string, entries: string[]): Promise<void> {
  const gitignorePath = join(root, ".gitignore");
  let content = "";

  try {
    content = await readFile(gitignorePath, "utf-8");
  } catch {
    // No .gitignore yet
  }

  const lines = content.split("\n");
  const missing = entries.filter((entry) => !lines.some((line) => line.trim() === entry));

  if (missing.length === 0) return;

  const addition = (content.endsWith("\n") || content === "" ? "" : "\n") +
    "\n# Flow MCP sidecar\n" +
    missing.join("\n") +
    "\n";

  await writeFile(gitignorePath, content + addition);
}
```

**Wire into `packages/server/src/cli.ts`** — add after server creation:

```typescript
import { generateMcpConfigs } from "./auto-config.js";

// inside main(), after createServer:
const created = await generateMcpConfigs(root, port);
if (created.length > 0) {
  console.log(`[flow] Generated MCP configs: ${created.join(", ")}`);
}
```

**Create `packages/server/src/__tests__/auto-config.test.ts`:**

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, readFileSync, rmSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { generateMcpConfigs } from "../auto-config.js";

describe("generateMcpConfigs", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "flow-config-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("creates .mcp.json with correct structure", async () => {
    await generateMcpConfigs(dir, 3737);

    const content = JSON.parse(readFileSync(join(dir, ".mcp.json"), "utf-8"));
    expect(content.mcpServers.flow.type).toBe("streamable-http");
    expect(content.mcpServers.flow.url).toBe("http://localhost:3737/__mcp");
  });

  it("creates .cursor/mcp.json", async () => {
    await generateMcpConfigs(dir, 3737);

    expect(existsSync(join(dir, ".cursor", "mcp.json"))).toBe(true);
    const content = JSON.parse(readFileSync(join(dir, ".cursor", "mcp.json"), "utf-8"));
    expect(content.mcpServers.flow.url).toBe("http://localhost:3737/__mcp");
  });

  it("creates .vscode/mcp.json", async () => {
    await generateMcpConfigs(dir, 3737);

    expect(existsSync(join(dir, ".vscode", "mcp.json"))).toBe(true);
  });

  it("uses custom port in URLs", async () => {
    await generateMcpConfigs(dir, 4000);

    const content = JSON.parse(readFileSync(join(dir, ".mcp.json"), "utf-8"));
    expect(content.mcpServers.flow.url).toBe("http://localhost:4000/__mcp");
  });

  it("does not overwrite existing config files", async () => {
    writeFileSync(join(dir, ".mcp.json"), '{"existing": true}');

    const created = await generateMcpConfigs(dir, 3737);

    expect(created).not.toContain(".mcp.json");
    const content = JSON.parse(readFileSync(join(dir, ".mcp.json"), "utf-8"));
    expect(content.existing).toBe(true);
  });

  it("adds entries to .gitignore", async () => {
    await generateMcpConfigs(dir, 3737);

    const gitignore = readFileSync(join(dir, ".gitignore"), "utf-8");
    expect(gitignore).toContain(".mcp.json");
    expect(gitignore).toContain(".cursor/mcp.json");
    expect(gitignore).toContain(".vscode/mcp.json");
  });

  it("does not duplicate .gitignore entries", async () => {
    writeFileSync(join(dir, ".gitignore"), ".mcp.json\n");

    await generateMcpConfigs(dir, 3737);

    const gitignore = readFileSync(join(dir, ".gitignore"), "utf-8");
    const count = gitignore.split(".mcp.json").length - 1;
    expect(count).toBe(1); // Only the original one
  });
});
```

**Verify:**

```bash
cd packages/server && pnpm test
```

---

## Task 10: Extension integration

Add sidecar health check to the extension's service worker. When detected, upgrade the panel to dev mode and request enriched data.

> **Note:** This task modifies files in `packages/extension` (created in Phase 1). The paths below assume Phase 1-4 structure is in place.

**Create `packages/extension/src/lib/sidecar-client.ts`:**

```typescript
const DEFAULT_PORT = 3737;
const HEALTH_PATH = "/__flow/health";
const POLL_INTERVAL = 5000;

export interface SidecarHealth {
  status: "ok";
  version: string;
  root: string;
  capabilities: string[];
}

export interface SidecarClient {
  connected: boolean;
  health: SidecarHealth | null;
  port: number;
  ws: WebSocket | null;
  startPolling(): void;
  stopPolling(): void;
  onStatusChange(callback: (connected: boolean, health: SidecarHealth | null) => void): void;
}

export function createSidecarClient(port = DEFAULT_PORT): SidecarClient {
  let connected = false;
  let health: SidecarHealth | null = null;
  let ws: WebSocket | null = null;
  let interval: ReturnType<typeof setInterval> | null = null;
  const listeners: Array<(connected: boolean, health: SidecarHealth | null) => void> = [];

  async function checkHealth(): Promise<void> {
    try {
      const res = await fetch(`http://localhost:${port}${HEALTH_PATH}`, {
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) {
        health = await res.json();
        if (!connected) {
          connected = true;
          connectWebSocket();
          notify();
        }
      } else {
        disconnect();
      }
    } catch {
      disconnect();
    }
  }

  function connectWebSocket(): void {
    if (ws) return;
    try {
      ws = new WebSocket(`ws://localhost:${port}/__flow/ws`);
      ws.onclose = () => {
        ws = null;
      };
      ws.onerror = () => {
        ws?.close();
        ws = null;
      };
    } catch {
      ws = null;
    }
  }

  function disconnect(): void {
    if (connected) {
      connected = false;
      health = null;
      ws?.close();
      ws = null;
      notify();
    }
  }

  function notify(): void {
    for (const cb of listeners) cb(connected, health);
  }

  return {
    get connected() { return connected; },
    get health() { return health; },
    port,
    get ws() { return ws; },

    startPolling() {
      checkHealth();
      interval = setInterval(checkHealth, POLL_INTERVAL);
    },

    stopPolling() {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    },

    onStatusChange(callback) {
      listeners.push(callback);
    },
  };
}
```

**Create `packages/extension/src/lib/__tests__/sidecar-client.test.ts`:**

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createSidecarClient } from "../sidecar-client.js";

describe("SidecarClient", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("starts disconnected", () => {
    const client = createSidecarClient(3737);
    expect(client.connected).toBe(false);
    expect(client.health).toBeNull();
  });

  it("connects when health check succeeds", async () => {
    const mockHealth = {
      status: "ok",
      version: "0.1.0",
      root: "/tmp/project",
      capabilities: ["mcp-tools"],
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockHealth),
      })
    );

    // Stub WebSocket
    vi.stubGlobal(
      "WebSocket",
      vi.fn().mockImplementation(() => ({
        onclose: null,
        onerror: null,
        close: vi.fn(),
      }))
    );

    const client = createSidecarClient(3737);
    const statusChanges: boolean[] = [];
    client.onStatusChange((connected) => statusChanges.push(connected));

    client.startPolling();
    await vi.advanceTimersByTimeAsync(100);

    expect(client.connected).toBe(true);
    expect(client.health?.version).toBe("0.1.0");
    expect(statusChanges).toContain(true);

    client.stopPolling();
  });

  it("disconnects when health check fails", async () => {
    // Start connected
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            status: "ok",
            version: "0.1.0",
            root: "/tmp",
            capabilities: [],
          }),
      })
    );
    vi.stubGlobal(
      "WebSocket",
      vi.fn().mockImplementation(() => ({
        onclose: null,
        onerror: null,
        close: vi.fn(),
      }))
    );

    const client = createSidecarClient(3737);
    client.startPolling();
    await vi.advanceTimersByTimeAsync(100);
    expect(client.connected).toBe(true);

    // Now fail
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("connection refused")));
    await vi.advanceTimersByTimeAsync(5100);

    expect(client.connected).toBe(false);
    client.stopPolling();
  });
});
```

**Integration in service worker** (`packages/extension/src/entrypoints/background.ts`) — add:

```typescript
import { createSidecarClient } from "../lib/sidecar-client.js";

const sidecar = createSidecarClient();
sidecar.startPolling();

sidecar.onStatusChange((connected, health) => {
  // Notify all DevTools panels of mode change
  chrome.runtime.sendMessage({
    type: connected ? "sidecar-connected" : "sidecar-disconnected",
    health,
  });
});

// Handle panel requests for enriched data
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "get-sidecar-status") {
    sendResponse({ connected: sidecar.connected, health: sidecar.health });
    return true;
  }
});
```

**Verify:**

```bash
cd packages/extension && pnpm test
```

---

## Summary

After all 10 tasks, `packages/server` is a fully functional MCP sidecar with:

- **Health endpoint** at `/__flow/health`
- **7 MCP tools** at `/__mcp` via Streamable HTTP
- **File watcher** with 100ms debounce on `.tsx/.ts/.jsx/.js/.css/.schema.json/.dna.json`
- **Source map resolution** with caching and invalidation
- **Schema/DNA indexing** with component name lookup and token binding resolution
- **Token parsing** from CSS `@theme` blocks with brand/semantic tier classification
- **WebSocket** for real-time extension communication (file changes, mutation diffs)
- **Auto-config** generating `.mcp.json`, `.cursor/mcp.json`, `.vscode/mcp.json`
- **Extension integration** with health polling and dev mode upgrade

CLI usage:

```bash
npx @flow/server                  # Auto-detect project root, port 3737
npx @flow/server --port 4000     # Custom port
npx @flow/server --root ./app    # Custom root
```

Every service and route has unit tests using Vitest with temp directories for filesystem operations and in-memory MCP transport for tool tests.
