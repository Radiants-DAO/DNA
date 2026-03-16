import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { glob } from "node:fs/promises";
import { isWithinRoot } from "../utils/path-security.js";

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
 * Semantic token names per DNA convention (role-based, post-migration).
 * Brand tokens are raw palette (e.g., --color-sun-yellow).
 */
const SEMANTIC_TOKEN_NAMES = new Set([
  "page", "card", "tinted", "inv", "depth", "hover", "active",
  "main", "sub", "mute", "flip", "head", "link",
  "line", "rule", "line-hover", "focus",
  "accent", "accent-inv", "accent-soft", "danger",
  "success", "warning",
  "window-chrome-from", "window-chrome-to",
]);

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
    // Extract the suffix after --color- (e.g., --color-page → page)
    const colorMatch = name.match(/^--color-(.+)$/);
    if (colorMatch && SEMANTIC_TOKEN_NAMES.has(colorMatch[1])) {
      return "semantic";
    }

    // Non-color custom properties or brand palette tokens
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

  /**
   * Invalidate tokens from a specific file.
   * @param filePath - The file path to invalidate. Paths outside root are ignored.
   */
  invalidateFile(filePath: string): void {
    // Security: ignore paths outside root
    if (!isWithinRoot(this.root, filePath)) {
      return;
    }
    this.tokens = this.tokens.filter((t) => t.file !== filePath);
  }
}
