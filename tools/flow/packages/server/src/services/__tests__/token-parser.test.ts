import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
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

  it("detects dark mode tokens from dark.css filename", async () => {
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

  it("detects light mode from :root selector", async () => {
    writeFileSync(
      join(dir, "tokens.css"),
      `:root {
        --color-surface-primary: #FFFFFF;
      }`
    );

    await parser.scan();
    const index = parser.getIndex();

    expect(index.all[0].colorMode).toBe("light");
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
    writeFileSync(file, `@theme { --color-sun: #FEF8E2; }`);

    await parser.scan();
    expect(parser.getIndex().all.length).toBe(1);

    parser.invalidateFile(file);
    expect(parser.getIndex().all.length).toBe(0);
  });

  it("handles multiple @theme blocks in one file", async () => {
    writeFileSync(
      join(dir, "tokens.css"),
      `@theme {
        --color-a: #111;
      }
      @theme {
        --color-b: #222;
      }`
    );

    await parser.scan();
    const index = parser.getIndex();

    expect(index.all.length).toBe(2);
  });

  it("classifies status tokens as semantic", async () => {
    writeFileSync(
      join(dir, "tokens.css"),
      `@theme {
        --color-status-error: #FF0000;
        --color-status-success: #00FF00;
      }`
    );

    await parser.scan();
    const index = parser.getIndex();

    expect(index.byTier.semantic.length).toBe(2);
  });
});
