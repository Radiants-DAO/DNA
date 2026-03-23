import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { radiantsSystemContract } from "../../../../../packages/radiants/contract/system.ts";
import {
  buildRadiantsContracts,
  buildRadiantsContractsFromComponents,
  writeRadiantsContractArtifacts,
} from "../../../scripts/build-radiants-contract.ts";

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

  it("builds componentMap and component sections from meta-derived input", async () => {
    const { eslintContract, aiContract } = await buildRadiantsContractsFromComponents(
      radiantsSystemContract,
      [
        {
          name: "Separator",
          sourcePath: "packages/radiants/components/core/Separator/Separator.tsx",
          replaces: [{ element: "hr", import: "@rdna/radiants/components/core" }],
          wraps: "@base-ui/react/separator",
          a11y: { role: "separator", requiredAttributes: ["aria-orientation"] },
        },
        {
          name: "Card",
          sourcePath: "packages/radiants/components/core/Card/Card.tsx",
          pixelCorners: true,
          shadowSystem: "pixel",
          styleOwnership: [{ attribute: "data-variant", themeOwned: ["default", "raised"] }],
          a11y: { contrastRequirement: "AA" },
        },
      ],
    );

    expect(eslintContract.componentMap.hr.component).toBe("Separator");
    expect(eslintContract.components.Card.pixelCorners).toBe(true);
    expect(eslintContract.components.Separator.a11y?.role).toBe("separator");
    expect(aiContract.components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Separator",
          replaces: ["<hr>"],
          a11y: expect.objectContaining({ role: "separator" }),
        }),
      ]),
    );
  });

  it("throws when two components claim the same raw element", async () => {
    await expect(
      buildRadiantsContractsFromComponents(radiantsSystemContract, [
        {
          name: "Separator",
          sourcePath: "packages/radiants/components/core/Separator/Separator.tsx",
          replaces: [{ element: "hr" }],
        },
        {
          name: "FancyRule",
          sourcePath: "packages/radiants/components/core/FancyRule/FancyRule.tsx",
          replaces: [{ element: "hr" }],
        },
      ]),
    ).rejects.toThrow(/hr/);
  });

  it("throws when a component declares replaces without a resolved sourcePath", async () => {
    await expect(
      buildRadiantsContractsFromComponents(radiantsSystemContract, [
        {
          name: "GhostSeparator",
          sourcePath: null,
          replaces: [{ element: "hr" }],
        },
      ]),
    ).rejects.toThrow(/sourcePath/);
  });

  it("loads component contracts before building generated artifacts", async () => {
    const loadComponents = vi.fn().mockResolvedValue([
      {
        name: "Separator",
        sourcePath: "packages/radiants/components/core/Separator/Separator.tsx",
        replaces: [{ element: "hr", import: "@rdna/radiants/components/core" }],
      },
    ]);

    const { eslintContract } = await buildRadiantsContracts({
      system: radiantsSystemContract,
      loadComponents,
    });

    expect(loadComponents).toHaveBeenCalledTimes(1);
    expect(eslintContract.componentMap.hr.component).toBe("Separator");
  });
});
