import { readFile } from "node:fs/promises";
import { resolve, basename, dirname } from "node:path";
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
      // Skip node_modules
      if (absPath.includes("node_modules")) continue;

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
      // Skip node_modules
      if (absPath.includes("node_modules")) continue;

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
