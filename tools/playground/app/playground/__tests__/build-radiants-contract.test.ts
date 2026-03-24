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
  it("builds eslint and ai contracts from system tokens plus loaded component contracts", async () => {
    const { eslintContract, aiContract } = await buildRadiantsContracts();

    expect(eslintContract.componentMap.button.component).toBe("Button");
    expect(eslintContract.componentMap.label).toBeUndefined();
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
    expect(aiContract.elementReplacements.label).toBeUndefined();
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

  it("projects pilot contract fields from real component metadata into generated artifacts", async () => {
    const { eslintContract, aiContract } = await buildRadiantsContracts();

    expect(eslintContract.componentMap.hr.component).toBe("Separator");
    expect(eslintContract.componentMap.meter.component).toBe("Meter");
    expect(eslintContract.componentMap.details.component).toBe("Collapsible");
    expect(eslintContract.components.Separator.wraps).toBe("@base-ui/react/separator");
    expect(eslintContract.components.Toggle.a11y).toEqual(
      expect.objectContaining({
        role: "button",
        requiredAttributes: ["aria-pressed"],
      }),
    );
    expect(eslintContract.components.Card.styleOwnership).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          attribute: "data-variant",
          themeOwned: expect.arrayContaining(["default", "inverted", "raised"]),
        }),
      ]),
    );
    expect(aiContract.components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Separator",
          replaces: ["<hr>"],
          wraps: "@base-ui/react/separator",
        }),
        expect.objectContaining({
          name: "Toggle",
          a11y: expect.objectContaining({ role: "button" }),
        }),
      ]),
    );
  });

  it("projects structuralRules into eslint contract component sections", async () => {
    const { eslintContract } = await buildRadiantsContractsFromComponents(
      radiantsSystemContract,
      [
        {
          name: "Card",
          sourcePath: "packages/radiants/components/core/Card/Card.tsx",
          structuralRules: [
            {
              ruleId: "rdna/no-pixel-border",
              reason: "pixel corners own the border layer",
            },
          ],
        },
      ],
    );

    expect(eslintContract.components.Card.structuralRules).toEqual([
      {
        ruleId: "rdna/no-pixel-border",
        reason: "pixel corners own the border layer",
      },
    ]);
  });

  it("no longer relies on hand-authored componentMap entries in system.ts", async () => {
    expect(Object.keys(radiantsSystemContract.componentMap)).toHaveLength(0);

    const { eslintContract } = await buildRadiantsContracts();
    expect(eslintContract.componentMap.button.component).toBe("Button");
    expect(eslintContract.componentMap.input.component).toBe("Input");
    expect(eslintContract.componentMap.textarea.component).toBe("TextArea");
    expect(eslintContract.componentMap.select.component).toBe("Select");
    expect(eslintContract.componentMap.dialog.component).toBe("Dialog");
    expect(eslintContract.componentMap.label).toBeUndefined();
  });
});
