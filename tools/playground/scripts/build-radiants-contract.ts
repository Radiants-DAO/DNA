/**
 * build-radiants-contract.ts
 *
 * Pure builder: transforms the authored system contract into two generated
 * artifacts — eslint-contract.json (machine lookup) and ai-contract.json
 * (LLM comprehension).
 *
 * No file I/O in the builder itself. The writer function is separate and
 * wired into generate-registry.ts.
 */

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { radiantsSystemContract } from "../../../packages/radiants/contract/system.ts";

type SystemContract = typeof radiantsSystemContract;

// ---------------------------------------------------------------------------
// ESLint contract — direct passthrough of the system contract
// ---------------------------------------------------------------------------

function buildEslintContract(system: SystemContract) {
  return {
    $schema: "./eslint-contract.schema.json",
    contractVersion: system.contractVersion,
    generatedAt: new Date().toISOString(),
    tokenMap: system.tokenMap,
    componentMap: system.componentMap,
    pixelCorners: system.pixelCorners,
    themeVariants: system.themeVariants,
    motion: system.motion,
    shadows: system.shadows,
    typography: system.typography,
    textLikeInputTypes: system.textLikeInputTypes,
  };
}

// ---------------------------------------------------------------------------
// AI contract — LLM-oriented shape
// ---------------------------------------------------------------------------

interface SemanticEntry {
  suffix: string;
  use: string;
}

function categorizeColorSuffixes(suffixes: readonly string[]): Record<string, SemanticEntry[]> {
  const categories: Record<string, { pattern: RegExp; label: string }> = {
    backgrounds: { pattern: /^(page|card|tinted|inv|depth|hover|active|surface-.*)$/, label: "Background colors" },
    text: { pattern: /^(main|sub|mute|flip|head|link|content-.*)$/, label: "Text colors" },
    borders: { pattern: /^(line|rule|line-hover|focus|edge-.*)$/, label: "Border colors" },
    accents: { pattern: /^(accent|accent-inv|accent-soft|danger|action-.*)$/, label: "Accent/action colors" },
    status: { pattern: /^(success|warning|status-.*)$/, label: "Status colors" },
    other: { pattern: /.*/, label: "Other" },
  };

  const result: Record<string, SemanticEntry[]> = {};
  for (const [key] of Object.entries(categories)) {
    result[key] = [];
  }

  for (const suffix of suffixes) {
    let placed = false;
    for (const [key, { pattern }] of Object.entries(categories)) {
      if (key === "other") continue;
      if (pattern.test(suffix)) {
        result[key].push({ suffix, use: suffix });
        placed = true;
        break;
      }
    }
    if (!placed) {
      result.other.push({ suffix, use: suffix });
    }
  }

  // Remove empty categories
  for (const key of Object.keys(result)) {
    if (result[key].length === 0) delete result[key];
  }

  return result;
}

function buildComponentEntries(componentMap: SystemContract["componentMap"]) {
  // Group by component name, collecting replaced elements
  const grouped = new Map<string, { component: string; import: string; replaces: string[] }>();

  for (const [element, mapping] of Object.entries(componentMap)) {
    const existing = grouped.get(mapping.component);
    if (existing) {
      existing.replaces.push(`<${element}>`);
    } else {
      grouped.set(mapping.component, {
        component: mapping.component,
        import: mapping.import,
        replaces: [`<${element}>`],
      });
    }
  }

  return Array.from(grouped.values()).map(({ component, import: importPath, replaces }) => ({
    name: component,
    replaces,
    import: importPath,
  }));
}

function buildAiContract(system: SystemContract) {
  return {
    $schema: "./ai-contract.schema.json",
    contractVersion: system.contractVersion,
    generatedAt: new Date().toISOString(),

    system: {
      name: "RDNA Radiants",
      description:
        "Retro pixel-art design system with two-tier semantic tokens, headless Base UI primitives, and Tailwind v4 native theming.",
      colorModes: ["light", "dark"],
      importBase: "@rdna/radiants/components/core",
    },

    rules: [
      {
        id: "use-semantic-tokens",
        severity: "error",
        summary: "Always use semantic token classes, never hardcoded colors.",
        do: 'className="bg-page text-main border-line"',
        dont: 'className="bg-[#FEF8E2] text-[#0F0E0C]"',
      },
      {
        id: "use-rdna-components",
        severity: "warn",
        summary: "Use RDNA components instead of raw HTML elements when a replacement exists.",
        do: "<Button>Submit</Button>",
        dont: "<button>Submit</button>",
      },
      {
        id: "pixel-corner-no-border",
        severity: "error",
        summary:
          "Never set border-color or overflow-hidden on pixel-cornered elements. The ::after pseudo-element handles visible borders.",
      },
      {
        id: "pixel-corner-no-shadow",
        severity: "error",
        summary:
          "Use pixel-shadow-* instead of shadow-* on pixel-cornered elements. Box-shadow gets clipped by clip-path.",
      },
      {
        id: "motion-constraints",
        severity: "warn",
        summary: "Use RDNA motion tokens. Max duration 300ms. Only ease-out easing.",
      },
      {
        id: "no-removed-aliases",
        severity: "error",
        summary: "These CSS custom properties have been removed and must not be used.",
        bannedTokens: [...system.tokenMap.removedAliases],
      },
    ],

    tokens: {
      colors: {
        description:
          "Two-tier system. Tier 1 (brand) = raw palette. Tier 2 (semantic) = purpose-based, flips in dark mode. Always use Tier 2.",
        semantic: categorizeColorSuffixes(system.tokenMap.semanticColorSuffixes),
        brand: Object.entries(system.tokenMap.brandPalette).map(([hex, name]) => ({
          name,
          hex,
        })),
      },
      typography: {
        sizes: [...system.typography.validSizes],
        weights: [...system.typography.validWeights],
      },
      motion: {
        durations: [...system.motion.durationTokens],
        easings: [...system.motion.allowedEasings],
        maxMs: system.motion.maxDurationMs,
      },
      shadows: {
        validStandard: [...system.shadows.validStandard],
        validPixel: [...system.shadows.validPixel],
        validGlow: [...system.shadows.validGlow],
      },
      radius: {
        pixelCorners: [...system.pixelCorners.triggerClasses],
      },
    },

    components: buildComponentEntries(system.componentMap),

    elementReplacements: Object.fromEntries(
      Object.entries(system.componentMap).map(([el, { component }]) => [el, component]),
    ),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function buildRadiantsContracts() {
  const eslintContract = buildEslintContract(radiantsSystemContract);
  const aiContract = buildAiContract(radiantsSystemContract);
  return { eslintContract, aiContract };
}

export async function writeRadiantsContractArtifacts(outputDir: string) {
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });
  const { eslintContract, aiContract } = await buildRadiantsContracts();
  writeFileSync(resolve(outputDir, "eslint-contract.json"), JSON.stringify(eslintContract, null, 2) + "\n");
  writeFileSync(resolve(outputDir, "ai-contract.json"), JSON.stringify(aiContract, null, 2) + "\n");
}
