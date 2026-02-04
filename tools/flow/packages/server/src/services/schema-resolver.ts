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
  /** Unique key (relative directory path) to avoid name collisions */
  key: string;
  dir: string;
  schema: ComponentSchema | null;
  dna: DnaBinding | null;
  sourceFile: string | null;
}

export class SchemaResolver {
  private index = new Map<string, ComponentEntry>();
  /** Secondary index: directory path -> key for source file lookups */
  private dirToKey = new Map<string, string>();
  private root: string;

  constructor(root: string) {
    this.root = root;
  }

  async scan(): Promise<void> {
    this.index.clear();
    this.dirToKey.clear();
    await this.scanSchemas();
    await this.scanDna();
    await this.linkSourceFiles();
  }

  private async scanSchemas(): Promise<void> {
    const pattern = "**/*.schema.json";
    for await (const entry of glob(pattern, { cwd: this.root })) {
      const absPath = resolve(this.root, entry);
      // Skip node_modules
      if (absPath.includes("node_modules")) continue;

      try {
        const raw = await readFile(absPath, "utf-8");
        const parsed = JSON.parse(raw);
        const name = this.componentNameFromPath(absPath);
        const dir = dirname(absPath);
        const key = this.keyFromDir(dir);
        const existing = this.index.get(key) ?? this.createEntry(name, key, dir);
        existing.schema = { name, filePath: absPath, ...parsed };
        this.index.set(key, existing);
        this.dirToKey.set(dir, key);
      } catch {
        // Skip unparseable files
      }
    }
  }

  private async scanDna(): Promise<void> {
    const pattern = "**/*.dna.json";
    for await (const entry of glob(pattern, { cwd: this.root })) {
      const absPath = resolve(this.root, entry);
      // Skip node_modules
      if (absPath.includes("node_modules")) continue;

      try {
        const raw = await readFile(absPath, "utf-8");
        const parsed = JSON.parse(raw);
        const name = this.componentNameFromPath(absPath);
        const dir = dirname(absPath);
        const key = this.keyFromDir(dir);
        const existing = this.index.get(key) ?? this.createEntry(name, key, dir);
        existing.dna = { name, filePath: absPath, tokens: parsed.tokens ?? {}, ...parsed };
        this.index.set(key, existing);
        this.dirToKey.set(dir, key);
      } catch {
        // Skip unparseable files
      }
    }
  }

  private async linkSourceFiles(): Promise<void> {
    for (const [, entry] of this.index) {
      const dir = entry.dir;
      const candidates = [
        resolve(dir, `${entry.name}.tsx`),
        resolve(dir, `${entry.name}.jsx`),
        resolve(dir, `${entry.name}.ts`),
        resolve(dir, `${entry.name}.js`),
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

  /** Generate a unique key from the component directory (relative to root) */
  private keyFromDir(dir: string): string {
    return relative(this.root, dir) || ".";
  }

  private createEntry(name: string, key: string, dir: string): ComponentEntry {
    return { name, key, dir, schema: null, dna: null, sourceFile: null };
  }

  /**
   * Get component by name. If multiple components have the same name,
   * returns the first match. Use getByKey() for precise lookups.
   */
  get(name: string): ComponentEntry | undefined {
    // First try as a key (exact path match)
    if (this.index.has(name)) {
      return this.index.get(name);
    }
    // Fall back to name search
    for (const entry of this.index.values()) {
      if (entry.name === name) return entry;
    }
    return undefined;
  }

  /** Get component by unique key (relative directory path) */
  getByKey(key: string): ComponentEntry | undefined {
    return this.index.get(key);
  }

  getAll(): ComponentEntry[] {
    return Array.from(this.index.values());
  }

  /**
   * Invalidate a specific component by file path (on file change).
   * Handles .schema.json, .dna.json, and source files (.tsx, .ts, .jsx, .js).
   */
  invalidateByPath(filePath: string): string | null {
    const dir = dirname(filePath);
    const key = this.dirToKey.get(dir);

    if (key && this.index.has(key)) {
      this.index.delete(key);
      this.dirToKey.delete(dir);
      return key;
    }

    return null;
  }

  /** Resolve token bindings for a component across its DNA variants. */
  resolveTokenBindings(name: string): Record<string, Record<string, string>> | null {
    const entry = this.get(name);
    if (!entry?.dna) return null;
    return entry.dna.tokens;
  }
}
