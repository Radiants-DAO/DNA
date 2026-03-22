import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildRadiantsContracts, writeRadiantsContractArtifacts } from "../../../scripts/build-radiants-contract.ts";

describe("buildRadiantsContracts", () => {
  it("builds eslint and ai contracts from the system contract", async () => {
    const { eslintContract, aiContract } = await buildRadiantsContracts();

    expect(eslintContract.componentMap.label.component).toBe("Label");
    expect(eslintContract.themeVariants).toContain("default");
    expect(eslintContract.tokenMap.semanticColorSuffixes).toContain("content-primary");
    // AI contract has LLM-oriented shape
    expect(aiContract.system.name).toBe("RDNA Radiants");
    expect(aiContract.rules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "use-semantic-tokens", severity: "error" }),
        expect.objectContaining({ id: "use-rdna-components", severity: "warn" }),
      ]),
    );
    expect(aiContract.tokens.colors.semantic).toBeDefined();
    expect(aiContract.components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Button", replaces: ["<button>"] }),
      ]),
    );
    expect(aiContract.elementReplacements.button).toBe("Button");
  });

  it("writes eslint and ai contract JSON artifacts to disk", async () => {
    const outDir = mkdtempSync(join(tmpdir(), "rdna-contract-"));
    await writeRadiantsContractArtifacts(outDir);

    expect(existsSync(join(outDir, "eslint-contract.json"))).toBe(true);
    expect(existsSync(join(outDir, "ai-contract.json"))).toBe(true);

    const eslintContract = JSON.parse(readFileSync(join(outDir, "eslint-contract.json"), "utf8"));
    expect(eslintContract.themeVariants).toContain("default");
    expect(eslintContract.componentMap.button.component).toBe("Button");

    const aiContract = JSON.parse(readFileSync(join(outDir, "ai-contract.json"), "utf8"));
    expect(aiContract.system.name).toBe("RDNA Radiants");
    expect(aiContract.components.length).toBeGreaterThan(0);
  });
});
