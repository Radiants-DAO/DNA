import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildFigmaArtifacts,
  writeFigmaArtifacts,
} from "../scripts/generate-figma-contracts.ts";

describe("generate-figma-contracts", () => {
  it("builds primitive and semantic token artifacts from the authored CSS sources", () => {
    const { tokenFiles } = buildFigmaArtifacts();

    expect(tokenFiles["primitive/color.tokens.json"]).toMatchObject({
      color: {
        cream: {
          $type: "color",
          $value: "oklch(0.9780 0.0295 94.34)",
        },
      },
    });

    expect(tokenFiles["semantic/semantic.tokens.json"]).toMatchObject({
      surface: {
        page: {
          $type: "color",
          $value: "{color.cream}",
          $extensions: {
            modes: {
              light: "{color.cream}",
              dark: "{color.ink}",
            },
          },
        },
      },
      content: {
        main: {
          $value: "{color.ink}",
        },
      },
    });

    expect(tokenFiles["primitive/space.tokens.json"]).toEqual({
      $description: expect.any(String),
      space: {},
    });
  });

  it("builds per-component contract files from authored component metadata", () => {
    const { contractFiles } = buildFigmaArtifacts();

    expect(contractFiles["button.contract.json"]).toMatchObject({
      id: "button",
      name: "Button",
      renderMode: "inline",
      props: {
        disabled: {
          type: "boolean",
        },
      },
      states: expect.arrayContaining([
        expect.objectContaining({
          name: "disabled",
          driver: "prop",
        }),
      ]),
      tokens: expect.objectContaining({
        color: expect.any(Object),
      }),
      tokenBindings: expect.objectContaining({
        base: expect.any(Object),
      }),
    });

    expect(contractFiles["dialog.contract.json"]).toMatchObject({
      id: "dialog",
      name: "Dialog",
      renderMode: "custom",
      props: {
        open: {
          type: "boolean",
        },
      },
    });
  });

  it("writes token files, component contracts, and the local config template", () => {
    const outputDir = mkdtempSync(join(tmpdir(), "rdna-figma-"));
    const configPath = join(outputDir, ".component-contracts.example");

    writeFigmaArtifacts({
      outputDir,
      configPath,
      configTokensDir: outputDir,
      configContractsDir: join(outputDir, "contracts"),
    });

    expect(existsSync(join(outputDir, "primitive/color.tokens.json"))).toBe(true);
    expect(existsSync(join(outputDir, "primitive/shape.tokens.json"))).toBe(true);
    expect(existsSync(join(outputDir, "semantic/semantic.tokens.json"))).toBe(true);
    expect(existsSync(join(outputDir, "contracts/button.contract.json"))).toBe(true);

    const buttonContract = JSON.parse(
      readFileSync(join(outputDir, "contracts/button.contract.json"), "utf8"),
    );
    expect(buttonContract.name).toBe("Button");

    const config = readFileSync(configPath, "utf8");
    expect(config).toContain("FIGMA_ACCESS_TOKEN=");
    expect(config).toContain(`TOKENS_DIR=${outputDir}`);
    expect(config).toContain(`CONTRACTS_DIR=${join(outputDir, "contracts")}`);
  });
});
