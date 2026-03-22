import { describe, expect, it } from "vitest";
import { buildRadiantsContracts } from "../../../scripts/build-radiants-contract.ts";

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
});
