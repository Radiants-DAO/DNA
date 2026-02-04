import { SourceMapConsumer } from "@jridgewell/source-map";
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
  private cache = new Map<string, SourceMapConsumer>();
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
    let consumer = this.cache.get(absPath);

    if (!consumer) {
      const raw = await readFile(absPath, "utf-8");
      consumer = new SourceMapConsumer(JSON.parse(raw));
      this.cache.set(absPath, consumer);
    }

    return consumer.originalPositionFor({ line, column });
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
