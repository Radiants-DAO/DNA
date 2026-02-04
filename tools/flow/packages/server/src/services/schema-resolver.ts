import { readFile } from "node:fs/promises";
import { resolve, basename, dirname, relative, sep } from "node:path";
import { glob } from "node:fs/promises";
import { isWithinRoot } from "../utils/path-security.js";

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
  /** Secondary index: file path -> key for invalidation lookups */
  private fileToKey = new Map<string, string>();
  private root: string;

  constructor(root: string) {
    this.root = root;
  }

  async scan(): Promise<void> {
    this.index.clear();
    this.fileToKey.clear();
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
        const key = this.keyFromDirAndName(dir, name);
        const existing = this.index.get(key) ?? this.createEntry(name, key, dir);
        existing.schema = { name, filePath: absPath, ...parsed };
        this.index.set(key, existing);
        this.fileToKey.set(absPath, key);
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
        const key = this.keyFromDirAndName(dir, name);
        const existing = this.index.get(key) ?? this.createEntry(name, key, dir);
        existing.dna = { name, filePath: absPath, tokens: parsed.tokens ?? {}, ...parsed };
        this.index.set(key, existing);
        this.fileToKey.set(absPath, key);
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

  /** Generate a unique key from the component directory and name */
  private keyFromDirAndName(dir: string, name: string): string {
    const relDir = relative(this.root, dir) || ".";
    const normalizedDir = relDir.split(sep).join("/");
    return `${normalizedDir}/${name}`;
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
   * Get all components that share a given name (for collision detection).
   * Useful when multiple directories contain components with the same name.
   */
  getAllByName(name: string): ComponentEntry[] {
    const results: ComponentEntry[] = [];
    for (const entry of this.index.values()) {
      if (entry.name === name) {
        results.push(entry);
      }
    }
    return results;
  }

  /**
   * Check if there are name collisions (multiple components with same name).
   */
  hasCollisions(name: string): boolean {
    return this.getAllByName(name).length > 1;
  }

  /**
   * Invalidate a specific component by file path (on file change).
   * Handles .schema.json, .dna.json, and source files (.tsx, .ts, .jsx, .js).
   * @returns The invalidated key, or null if path is outside root or not found.
   */
  invalidateByPath(filePath: string): string | null {
    // Security: reject paths outside root
    if (!isWithinRoot(this.root, filePath)) {
      return null;
    }

    // Check if this file is directly tracked (schema or dna file)
    const key = this.fileToKey.get(filePath);
    if (key && this.index.has(key)) {
      this.index.delete(key);
      this.fileToKey.delete(filePath);
      // Also clean up other file mappings for this entry
      for (const [file, k] of this.fileToKey) {
        if (k === key) this.fileToKey.delete(file);
      }
      return key;
    }

    // Check if filePath matches a sourceFile in any entry
    // (handles .tsx/.ts/.jsx/.js files that may not have schema/dna in same dir)
    for (const [entryKey, entry] of this.index) {
      if (entry.sourceFile === filePath) {
        this.index.delete(entryKey);
        // Clean up file mappings for this entry
        for (const [file, k] of this.fileToKey) {
          if (k === entryKey) this.fileToKey.delete(file);
        }
        return entryKey;
      }
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
