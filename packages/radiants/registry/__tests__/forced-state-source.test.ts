import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(testDir, "../../../../");

function readRepoFile(path: string) {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("forced state style source of truth", () => {
  it("keeps forced-state selectors in canonical Radiants styles", () => {
    const baseCss = readRepoFile("packages/radiants/base.css");
    const darkCss = readRepoFile("packages/radiants/dark.css");

    expect(baseCss).toContain('[data-force-state="hover"]');
    expect(baseCss).toContain('[data-force-state="pressed"]');
    expect(baseCss).toContain('[data-force-state="focus"]');
    expect(baseCss).toContain('[data-force-state="disabled"]');
    expect(baseCss).toContain('[data-force-state="error"]');

    expect(darkCss).toContain('[data-force-state="hover"] [data-slot="button-root"]');
    expect(darkCss).toContain('[data-force-state="pressed"] [data-slot="button-root"]');
  });

  it("does not rely on a separate forced-states stylesheet surface", () => {
    const packageJson = JSON.parse(readRepoFile("packages/radiants/package.json")) as {
      exports?: Record<string, unknown>;
    };

    expect(packageJson.exports).not.toHaveProperty("./registry/forced-states.css");
    expect(readRepoFile("tools/playground/app/globals.css")).not.toContain("registry/forced-states.css");
    expect(readRepoFile("apps/rad-os/app/globals.css")).not.toContain("registry/forced-states.css");
    expect(
      existsSync(resolve(repoRoot, "packages/radiants/registry/forced-states.css")),
    ).toBe(false);
  });
});
