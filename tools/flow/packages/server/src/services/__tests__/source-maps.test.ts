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
    sourcesContent: ["export const Button = () => <button>Click</button>;"],
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

  it("invalidateAll clears entire cache", async () => {
    writeFileSync(join(dir, "a.js.map"), SAMPLE_MAP);
    writeFileSync(join(dir, "b.js.map"), SAMPLE_MAP);

    await service.resolve("a.js.map", 1, 0);
    await service.resolve("b.js.map", 1, 0);

    service.invalidateAll();

    // Update both files
    const updatedMap = JSON.stringify({
      ...JSON.parse(SAMPLE_MAP),
      sources: ["src/Updated.tsx"],
    });
    writeFileSync(join(dir, "a.js.map"), updatedMap);
    writeFileSync(join(dir, "b.js.map"), updatedMap);

    const posA = await service.resolve("a.js.map", 1, 0);
    const posB = await service.resolve("b.js.map", 1, 0);
    expect(posA.source).toBe("src/Updated.tsx");
    expect(posB.source).toBe("src/Updated.tsx");
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

  it("finds map file via JS-style sourceMappingURL comment", async () => {
    writeFileSync(join(dir, "bundle.js"), 'console.log("hi");\n//# sourceMappingURL=bundle.js.map');
    writeFileSync(join(dir, "bundle.js.map"), SAMPLE_MAP);

    const found = await service.findMapFile("bundle.js");
    expect(found).toBe(join(dir, "bundle.js.map"));
  });

  it("finds map file via CSS-style sourceMappingURL comment", async () => {
    writeFileSync(join(dir, "styles.css"), '.btn { color: red; }\n/*# sourceMappingURL=styles.css.map */');
    writeFileSync(join(dir, "styles.css.map"), SAMPLE_MAP);

    const found = await service.findMapFile("styles.css");
    expect(found).toBe(join(dir, "styles.css.map"));
  });

  it("ignores data URL sourceMappingURL", async () => {
    writeFileSync(
      join(dir, "inline.js"),
      'console.log("hi");\n//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozfQ=='
    );
    // No .map file exists

    const found = await service.findMapFile("inline.js");
    expect(found).toBeNull();
  });
});
