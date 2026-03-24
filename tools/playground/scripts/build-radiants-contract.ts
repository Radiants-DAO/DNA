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
import { loadRadiantsComponentContracts } from "./load-radiants-component-contracts.ts";
import type {
  A11yContract,
  StructuralRule,
  StyleOwnership,
} from "../../../packages/preview/src/index.ts";
import type { RadiantsContractComponent } from "./load-radiants-component-contracts.ts";

type SystemContract = typeof radiantsSystemContract;

interface EslintComponentMapEntry {
  component: string;
  import: string;
  note?: string;
  qualifier?: string;
}

interface EslintComponentEntry {
  pixelCorners?: boolean;
  shadowSystem?: "standard" | "pixel";
  styleOwnership?: StyleOwnership[];
  structuralRules?: StructuralRule[];
  wraps?: string;
  a11y?: A11yContract;
}

interface AiComponentEntry {
  name: string;
  import?: string;
  replaces?: string[];
  wraps?: string;
  a11y?: A11yContract;
}

function dedupe(values: Iterable<string>) {
  return [...new Set(values)];
}

function buildLegacyAiComponentEntries(componentMap: SystemContract["componentMap"]) {
  const grouped = new Map<string, { component: string; import: string; replaces: string[] }>();

  for (const [element, mapping] of Object.entries(componentMap)) {
    const existing = grouped.get(mapping.component);
    if (existing) {
      existing.replaces.push(`<${element}>`);
      continue;
    }

    grouped.set(mapping.component, {
      component: mapping.component,
      import: mapping.import,
      replaces: [`<${element}>`],
    });
  }

  return Array.from(grouped.values())
    .map(({ component, import: importPath, replaces }) => ({
      name: component,
      replaces,
      import: importPath,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function mergeAiComponents(base: AiComponentEntry[], next: AiComponentEntry[]) {
  const merged = new Map<string, AiComponentEntry>();

  const mergeEntry = (entry: AiComponentEntry) => {
    const existing = merged.get(entry.name);
    if (!existing) {
      merged.set(entry.name, {
        ...entry,
        replaces: entry.replaces ? [...entry.replaces] : undefined,
      });
      return;
    }

    existing.import = entry.import ?? existing.import;
    existing.wraps = entry.wraps ?? existing.wraps;
    existing.a11y = entry.a11y ?? existing.a11y;

    if (entry.replaces?.length) {
      existing.replaces = dedupe([...(existing.replaces ?? []), ...entry.replaces]);
    }
  };

  for (const entry of base) mergeEntry(entry);
  for (const entry of next) mergeEntry(entry);

  return Array.from(merged.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function deriveComponentContractSections(components: RadiantsContractComponent[]) {
  const componentMap: Record<string, EslintComponentMapEntry> = {};
  const componentEntries: Record<string, EslintComponentEntry> = {};
  const aiComponents: AiComponentEntry[] = [];
  const elementReplacements: Record<string, string> = {};
  const themeVariants = new Set<string>();
  const seenReplacements = new Map<string, { name: string }>();

  for (const component of components) {
    if (component.replaces?.length && !component.sourcePath) {
      throw new Error(
        `Component ${component.name} declares replaces but has no resolved sourcePath`,
      );
    }

    const eslintEntry: EslintComponentEntry = {};
    if (component.pixelCorners !== undefined) eslintEntry.pixelCorners = component.pixelCorners;
    if (component.shadowSystem) eslintEntry.shadowSystem = component.shadowSystem;
    if (component.styleOwnership?.length) eslintEntry.styleOwnership = component.styleOwnership;
    if (component.structuralRules?.length) eslintEntry.structuralRules = component.structuralRules;
    if (component.wraps) eslintEntry.wraps = component.wraps;
    if (component.a11y) eslintEntry.a11y = component.a11y;

    if (Object.keys(eslintEntry).length > 0) {
      componentEntries[component.name] = eslintEntry;
    }

    const aiEntry: AiComponentEntry = { name: component.name };
    let hasAiFields = false;

    if (component.replaces?.length) {
      aiEntry.replaces = component.replaces.map((replacement) => `<${replacement.element}>`);
      aiEntry.import =
        component.replaces[0]?.import ?? "@rdna/radiants/components/core";
      hasAiFields = true;

      for (const replacement of component.replaces) {
        const firstClaim = seenReplacements.get(replacement.element);
        if (firstClaim) {
          throw new Error(
            `Duplicate replaces entry for <${replacement.element}> between ${firstClaim.name} and ${component.name}`,
          );
        }

        seenReplacements.set(replacement.element, { name: component.name });
        elementReplacements[replacement.element] = component.name;
        componentMap[replacement.element] = {
          component: component.name,
          import: replacement.import ?? "@rdna/radiants/components/core",
          ...(replacement.note ? { note: replacement.note } : {}),
          ...(replacement.qualifier ? { qualifier: replacement.qualifier } : {}),
        };
      }
    }

    if (component.wraps) {
      aiEntry.wraps = component.wraps;
      hasAiFields = true;
    }

    if (component.a11y) {
      aiEntry.a11y = component.a11y;
      hasAiFields = true;
    }

    if (hasAiFields) {
      aiComponents.push(aiEntry);
    }

    for (const ownership of component.styleOwnership ?? []) {
      for (const variant of ownership.themeOwned) {
        themeVariants.add(variant);
      }
    }
  }

  return {
    componentMap,
    componentEntries,
    aiComponents: aiComponents.sort((a, b) => a.name.localeCompare(b.name)),
    elementReplacements,
    themeVariants: [...themeVariants].sort(),
  };
}

// ---------------------------------------------------------------------------
// ESLint contract
// ---------------------------------------------------------------------------

function buildEslintContract(
  system: SystemContract,
  componentMap: Record<string, EslintComponentMapEntry>,
  componentEntries: Record<string, EslintComponentEntry>,
  themeVariants: string[],
) {
  return {
    $schema: "./eslint-contract.schema.json",
    contractVersion: system.contractVersion,
    tokenMap: system.tokenMap,
    componentMap,
    components: componentEntries,
    pixelCorners: system.pixelCorners,
    themeVariants,
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

  for (const key of Object.keys(result)) {
    if (result[key].length === 0) delete result[key];
  }

  return result;
}

function buildAiContract(
  system: SystemContract,
  components: AiComponentEntry[],
  elementReplacements: Record<string, string>,
) {
  return {
    $schema: "./ai-contract.schema.json",
    contractVersion: system.contractVersion,

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

    components,
    elementReplacements,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function buildRadiantsContractsFromComponents(
  system: SystemContract,
  components: RadiantsContractComponent[],
) {
  const derived = deriveComponentContractSections(components);
  const themeVariants = dedupe([...system.themeVariants, ...derived.themeVariants]).sort();

  return {
    eslintContract: buildEslintContract(
      system,
      derived.componentMap,
      derived.componentEntries,
      themeVariants,
    ),
    aiContract: buildAiContract(system, derived.aiComponents, derived.elementReplacements),
  };
}

interface BuildRadiantsContractsOptions {
  system?: SystemContract;
  loadComponents?: () => Promise<RadiantsContractComponent[]>;
}

export async function buildRadiantsContracts(
  options: BuildRadiantsContractsOptions = {},
) {
  const system = options.system ?? radiantsSystemContract;
  const loadComponents = options.loadComponents ?? loadRadiantsComponentContracts;
  const components = await loadComponents();

  const derived = await buildRadiantsContractsFromComponents(system, components);
  const legacyAiComponents = buildLegacyAiComponentEntries(system.componentMap);
  const legacyElementReplacements = Object.fromEntries(
    Object.entries(system.componentMap).map(([element, { component }]) => [element, component]),
  );

  return {
    eslintContract: {
      ...derived.eslintContract,
      componentMap: {
        ...system.componentMap,
        ...derived.eslintContract.componentMap,
      },
    },
    aiContract: {
      ...derived.aiContract,
      components: mergeAiComponents(legacyAiComponents, derived.aiContract.components),
      elementReplacements: {
        ...legacyElementReplacements,
        ...derived.aiContract.elementReplacements,
      },
    },
  };
}

export async function writeRadiantsContractArtifacts(outputDir: string) {
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });
  const { eslintContract, aiContract } = await buildRadiantsContracts();
  writeFileSync(resolve(outputDir, "eslint-contract.json"), JSON.stringify(eslintContract, null, 2) + "\n");
  writeFileSync(resolve(outputDir, "ai-contract.json"), JSON.stringify(aiContract, null, 2) + "\n");
}
