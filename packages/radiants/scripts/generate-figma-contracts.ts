#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { componentMetaIndex } from "../meta/index.ts";
import { radiantsSystemContract } from "../contract/system.ts";
import type { ComponentMeta } from "../../preview/src/index.ts";

type JsonObject = Record<string, unknown>;

interface FigmaArtifacts {
  tokenFiles: Record<string, JsonObject>;
  contractFiles: Record<string, JsonObject>;
  configExample: string;
}

interface WriteFigmaArtifactsOptions {
  outputDir?: string;
  configPath?: string;
  configTokensDir?: string;
  configContractsDir?: string;
}

type IndexEntry = {
  meta: ComponentMeta<Record<string, unknown>>;
  sourcePath: string | null;
  schemaPath: string;
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = resolve(__dirname, "..");
const REPO_ROOT = resolve(PACKAGE_ROOT, "../..");
const TOKENS_CSS_PATH = resolve(PACKAGE_ROOT, "tokens.css");
const DARK_CSS_PATH = resolve(PACKAGE_ROOT, "dark.css");

const DEFAULT_OUTPUT_DIR = resolve(PACKAGE_ROOT, "generated/figma");
const DEFAULT_CONFIG_PATH = resolve(REPO_ROOT, ".component-contracts.example");
const DEFAULT_CONFIG_TOKENS_DIR = "packages/radiants/generated/figma";
const DEFAULT_CONFIG_CONTRACTS_DIR = "packages/radiants/generated/figma/contracts";

const SEMANTIC_COLOR_SUFFIXES = new Set(radiantsSystemContract.tokenMap.semanticColorSuffixes);

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function readBalancedBlock(source: string, openBraceIndex: number) {
  let depth = 0;

  for (let index = openBraceIndex; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (char === "/" && next === "*") {
      const commentEnd = source.indexOf("*/", index + 2);
      if (commentEnd === -1) {
        throw new Error("Unterminated CSS comment while parsing generated Figma contracts");
      }
      index = commentEnd + 1;
      continue;
    }

    if (char === "{") {
      depth += 1;
      continue;
    }

    if (char !== "}") continue;

    depth -= 1;
    if (depth === 0) {
      return {
        content: source.slice(openBraceIndex + 1, index),
        endIndex: index + 1,
      };
    }
  }

  throw new Error("Unterminated CSS block while parsing generated Figma contracts");
}

function findFirstBlock(source: string, pattern: RegExp) {
  const match = pattern.exec(source);
  if (!match) {
    throw new Error(`Could not find block matching ${pattern} while generating Figma contracts`);
  }

  const openBraceIndex = source.indexOf("{", match.index);
  if (openBraceIndex === -1) {
    throw new Error(`Block ${pattern} is missing an opening brace`);
  }

  return readBalancedBlock(source, openBraceIndex).content;
}

function findAllBlocks(source: string, pattern: RegExp) {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  const matcher = new RegExp(pattern.source, flags);
  const blocks: string[] = [];

  for (let match = matcher.exec(source); match; match = matcher.exec(source)) {
    const openBraceIndex = source.indexOf("{", match.index);
    if (openBraceIndex === -1) break;

    const block = readBalancedBlock(source, openBraceIndex);
    blocks.push(block.content);
    matcher.lastIndex = block.endIndex;
  }

  return blocks;
}

function parseTopLevelCustomProperties(blockContent: string) {
  const properties: Record<string, string> = {};
  let depth = 0;

  for (let index = 0; index < blockContent.length; index += 1) {
    const char = blockContent[index];
    const next = blockContent[index + 1];

    if (char === "/" && next === "*") {
      const commentEnd = blockContent.indexOf("*/", index + 2);
      if (commentEnd === -1) break;
      index = commentEnd + 1;
      continue;
    }

    if (char === "{") {
      depth += 1;
      continue;
    }

    if (char === "}") {
      depth = Math.max(0, depth - 1);
      continue;
    }

    if (depth !== 0 || char !== "-" || next !== "-") continue;

    const colonIndex = blockContent.indexOf(":", index + 2);
    if (colonIndex === -1) break;

    const name = blockContent.slice(index, colonIndex).trim();
    let value = "";
    let quote: "'" | '"' | null = null;
    let parenDepth = 0;

    index = colonIndex + 1;

    for (; index < blockContent.length; index += 1) {
      const valueChar = blockContent[index];
      const valueNext = blockContent[index + 1];

      if (!quote && valueChar === "/" && valueNext === "*") {
        const commentEnd = blockContent.indexOf("*/", index + 2);
        if (commentEnd === -1) break;
        index = commentEnd + 1;
        continue;
      }

      if (quote) {
        value += valueChar;
        if (valueChar === quote && blockContent[index - 1] !== "\\") {
          quote = null;
        }
        continue;
      }

      if (valueChar === "'" || valueChar === '"') {
        quote = valueChar;
        value += valueChar;
        continue;
      }

      if (valueChar === "(") {
        parenDepth += 1;
        value += valueChar;
        continue;
      }

      if (valueChar === ")" && parenDepth > 0) {
        parenDepth -= 1;
        value += valueChar;
        continue;
      }

      if (valueChar === ";" && parenDepth === 0) {
        break;
      }

      value += valueChar;
    }

    properties[name] = normalizeWhitespace(value);
  }

  return properties;
}

function toTokenReference(value: string) {
  const normalized = normalizeWhitespace(value);
  const varReference = normalized.match(/^var\(--([a-z0-9-]+)\)$/i)?.[1];
  if (!varReference) return normalized;

  const mappings: Array<[string, string]> = [
    ["color-", "color"],
    ["radius-", "radius"],
    ["shadow-", "shadow"],
    ["font-size-", "fontSize"],
    ["duration-", "duration"],
    ["easing-", "easing"],
    ["focus-ring-", "focusRing"],
    ["touch-target-", "touchTarget"],
    ["breakpoint-", "breakpoint"],
    ["z-index-", "zIndex"],
  ];

  for (const [prefix, group] of mappings) {
    if (varReference.startsWith(prefix)) {
      return `{${group}.${varReference.slice(prefix.length)}}`;
    }
  }

  return normalized;
}

function buildToken(value: string, type: string, extra: JsonObject = {}) {
  return {
    $type: type,
    $value: toTokenReference(value),
    ...extra,
  };
}

function classifySemanticSuffix(suffix: string) {
  if (/^(page|card|tinted|inv|depth|hover|active|window-chrome-.*)$/.test(suffix)) {
    return { group: "surface", key: suffix };
  }

  if (suffix.startsWith("surface-")) {
    return { group: "surface", key: suffix.slice("surface-".length) };
  }

  if (/^(main|sub|mute|flip|head|link)$/.test(suffix)) {
    return { group: "content", key: suffix };
  }

  if (suffix.startsWith("content-")) {
    return { group: "content", key: suffix.slice("content-".length) };
  }

  if (/^(line|rule|line-hover|focus)$/.test(suffix)) {
    return { group: "edge", key: suffix };
  }

  if (suffix.startsWith("edge-")) {
    return { group: "edge", key: suffix.slice("edge-".length) };
  }

  if (/^(accent|accent-inv|accent-soft|danger)$/.test(suffix)) {
    return { group: "action", key: suffix };
  }

  if (suffix.startsWith("action-")) {
    return { group: "action", key: suffix.slice("action-".length) };
  }

  if (/^(success|warning)$/.test(suffix)) {
    return { group: "status", key: suffix };
  }

  if (suffix.startsWith("status-")) {
    return { group: "status", key: suffix.slice("status-".length) };
  }

  return { group: "other", key: suffix };
}

function stripCssPrefix(name: string, prefix: string) {
  return name.startsWith(prefix) ? name.slice(prefix.length) : null;
}

function parseThemeTokens() {
  const css = readFileSync(TOKENS_CSS_PATH, "utf8");
  const block = findFirstBlock(css, /@theme\s*\{/);
  return parseTopLevelCustomProperties(block);
}

function parseDarkOverrides() {
  const css = readFileSync(DARK_CSS_PATH, "utf8");
  const blocks = findAllBlocks(css, /\.dark\s*\{/);
  return blocks.reduce<Record<string, string>>((merged, block) => {
    Object.assign(merged, parseTopLevelCustomProperties(block));
    return merged;
  }, {});
}

function buildPrimitiveColorTokens(themeTokens: Record<string, string>) {
  const color: Record<string, JsonObject> = {};

  for (const [name, value] of Object.entries(themeTokens)) {
    const suffix = stripCssPrefix(name, "--color-");
    if (!suffix || SEMANTIC_COLOR_SUFFIXES.has(suffix)) continue;
    color[suffix] = buildToken(value, "color");
  }

  return {
    $description: "Primitive RDNA Radiants color tokens generated from packages/radiants/tokens.css.",
    color,
  };
}

function buildSpaceTokens(themeTokens: Record<string, string>) {
  const space: Record<string, JsonObject> = {};

  for (const [name, value] of Object.entries(themeTokens)) {
    const prefix = name.startsWith("--space-") ? "--space-" : name.startsWith("--spacing-") ? "--spacing-" : null;
    if (!prefix) continue;
    space[name.slice(prefix.length)] = buildToken(value, "dimension");
  }

  return {
    $description: "Primitive RDNA Radiants spacing tokens generated from packages/radiants/tokens.css.",
    space,
  };
}

function buildShapeTokens(themeTokens: Record<string, string>) {
  const radius: Record<string, JsonObject> = {};
  const shadow: Record<string, JsonObject> = {};
  const focusRing: Record<string, JsonObject> = {};
  const touchTarget: Record<string, JsonObject> = {};
  const breakpoint: Record<string, JsonObject> = {};
  const zIndex: Record<string, JsonObject> = {};

  for (const [name, value] of Object.entries(themeTokens)) {
    const radiusName = stripCssPrefix(name, "--radius-");
    if (radiusName) {
      radius[radiusName] = buildToken(value, "borderRadius");
      continue;
    }

    const shadowName = stripCssPrefix(name, "--shadow-");
    if (shadowName) {
      shadow[shadowName] = buildToken(value, "shadow");
      continue;
    }

    const focusRingName = stripCssPrefix(name, "--focus-ring-");
    if (focusRingName) {
      const type = focusRingName === "color" ? "color" : "dimension";
      focusRing[focusRingName] = buildToken(value, type);
      continue;
    }

    const touchTargetName = stripCssPrefix(name, "--touch-target-");
    if (touchTargetName) {
      touchTarget[touchTargetName] = buildToken(value, "dimension");
      continue;
    }

    const breakpointName = stripCssPrefix(name, "--breakpoint-");
    if (breakpointName) {
      breakpoint[breakpointName] = buildToken(value, "dimension");
      continue;
    }

    const zIndexName = stripCssPrefix(name, "--z-index-");
    if (zIndexName) {
      zIndex[zIndexName] = buildToken(value, "number");
    }
  }

  return {
    $description: "Primitive RDNA Radiants shape and layout tokens generated from packages/radiants/tokens.css.",
    radius,
    shadow,
    focusRing,
    touchTarget,
    breakpoint,
    zIndex,
  };
}

function buildMotionTokens(themeTokens: Record<string, string>) {
  const duration: Record<string, JsonObject> = {};
  const easing: Record<string, JsonObject> = {};
  const scalar: Record<string, JsonObject> = {};

  for (const [name, value] of Object.entries(themeTokens)) {
    const durationName = stripCssPrefix(name, "--duration-");
    if (durationName && durationName !== "scalar") {
      duration[durationName] = buildToken(value, "duration");
      continue;
    }

    const easingName = stripCssPrefix(name, "--easing-");
    if (easingName) {
      easing[easingName] = buildToken(value, "cubicBezier");
      continue;
    }

    if (name === "--duration-scalar") {
      scalar.normal = buildToken(value, "number");
    }
  }

  return {
    $description: "Primitive RDNA Radiants motion tokens generated from packages/radiants/tokens.css.",
    duration,
    easing,
    scalar,
  };
}

function buildTypographyTokens(themeTokens: Record<string, string>) {
  const fontSize: Record<string, JsonObject> = {};

  for (const [name, value] of Object.entries(themeTokens)) {
    const fontSizeName = stripCssPrefix(name, "--font-size-");
    if (!fontSizeName) continue;
    fontSize[fontSizeName] = buildToken(value, "fontSize");
  }

  return {
    $description: "Primitive RDNA Radiants typography tokens generated from packages/radiants/tokens.css.",
    fontSize,
  };
}

function buildSemanticTokens(
  themeTokens: Record<string, string>,
  darkOverrides: Record<string, string>,
) {
  const semantic: Record<string, JsonObject> = {
    surface: {},
    content: {},
    edge: {},
    action: {},
    status: {},
    other: {},
  };

  for (const [name, value] of Object.entries(themeTokens)) {
    const suffix = stripCssPrefix(name, "--color-");
    if (!suffix || !SEMANTIC_COLOR_SUFFIXES.has(suffix)) continue;

    const { group, key } = classifySemanticSuffix(suffix);
    const light = toTokenReference(value);
    const dark = toTokenReference(darkOverrides[name] ?? value);
    const groupBucket = semantic[group] as Record<string, JsonObject>;

    groupBucket[key] = {
      $type: "color",
      $value: light,
      $extensions: {
        modes: {
          light,
          dark,
        },
        rdna: {
          source: name,
        },
      },
    };
  }

  for (const [group, bucket] of Object.entries(semantic)) {
    if (Object.keys(bucket as Record<string, JsonObject>).length === 0) {
      delete semantic[group];
    }
  }

  return {
    $description:
      "Semantic RDNA Radiants color tokens generated from tokens.css with light values and dark-mode overrides from dark.css.",
    ...semantic,
  };
}

function normalizeSlots(raw: unknown) {
  if (!raw) return {};
  if (Array.isArray(raw)) {
    return Object.fromEntries(raw.map((name) => [String(name), { description: "" }]));
  }
  return raw as Record<string, { description?: string }>;
}

function categorizeBindingKey(bindingKey: string) {
  const key = bindingKey.toLowerCase();

  if (/(background|text|border|focus|placeholder|label|description|color)/.test(key)) {
    return "color";
  }

  if (/(padding|gap|spacing)/.test(key)) {
    return "spacing";
  }

  if (/(font|weight|size|lineheight)/.test(key)) {
    return "typography";
  }

  if (/(radius|shadow|bevel|width|opacity)/.test(key)) {
    return "shape";
  }

  if (/(duration|easing|transition|motion|animation)/.test(key)) {
    return "motion";
  }

  return "misc";
}

function buildComponentTokens(
  tokenBindings: Record<string, Record<string, string>> | undefined,
) {
  const categorized: Record<string, Record<string, string>> = {
    color: {},
    spacing: {},
    typography: {},
    shape: {},
    motion: {},
    misc: {},
  };

  for (const [section, bindings] of Object.entries(tokenBindings ?? {})) {
    for (const [bindingKey, bindingValue] of Object.entries(bindings)) {
      const category = categorizeBindingKey(bindingKey);
      categorized[category][`${section}.${bindingKey}`] = bindingValue;
    }
  }

  for (const [category, entries] of Object.entries(categorized)) {
    if (Object.keys(entries).length === 0) {
      delete categorized[category];
    }
  }

  return categorized;
}

function toKebabCase(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

function buildComponentContractFiles() {
  const contracts: Record<string, JsonObject> = {};

  for (const [entryName, entry] of Object.entries(componentMetaIndex) as [string, IndexEntry][]) {
    const meta = entry.meta;
    const registry = meta.registry;
    if (registry?.exclude) continue;

    const name = meta.name ?? entryName;
    const id = toKebabCase(name);

    contracts[`${id}.contract.json`] = {
      id,
      name,
      description: meta.description,
      sourcePath: entry.sourcePath,
      schemaPath: entry.schemaPath,
      importPath: "@rdna/radiants/components/core",
      platforms: ["web"],
      category: registry?.category ?? "layout",
      renderMode: registry?.renderMode ?? "inline",
      tags: registry?.tags ?? [],
      props: meta.props ?? {},
      slots: normalizeSlots(meta.slots),
      subcomponents: meta.subcomponents ?? [],
      states: registry?.states ?? [],
      variants: registry?.variants ?? [],
      exampleProps: registry?.exampleProps ?? {},
      controlledProps: registry?.controlledProps ?? [],
      examples: meta.examples ?? [],
      tokens: buildComponentTokens(meta.tokenBindings),
      tokenBindings: meta.tokenBindings ?? {},
      replaces: meta.replaces ?? [],
      pixelCorners: meta.pixelCorners ?? false,
      shadowSystem: meta.shadowSystem ?? null,
      styleOwnership: meta.styleOwnership ?? [],
      structuralRules: meta.structuralRules ?? [],
      wraps: meta.wraps ?? null,
      a11y: meta.a11y ?? null,
    };
  }

  return Object.fromEntries(
    Object.entries(contracts).sort(([left], [right]) => left.localeCompare(right)),
  );
}

function buildComponentContractsExample(tokensDir: string, contractsDir: string) {
  return [
    "# Copy this file to .component-contracts and fill in your local Figma credentials.",
    "# Agents and local Figma skills use these paths to locate generated token and component contracts.",
    "FIGMA_ACCESS_TOKEN=",
    "FIGMA_FILE_KEY=",
    `TOKENS_DIR=${tokensDir}`,
    `CONTRACTS_DIR=${contractsDir}`,
    "",
  ].join("\n");
}

export function buildFigmaArtifacts(
  options: Pick<WriteFigmaArtifactsOptions, "configTokensDir" | "configContractsDir"> = {},
): FigmaArtifacts {
  const themeTokens = parseThemeTokens();
  const darkOverrides = parseDarkOverrides();
  const configTokensDir = options.configTokensDir ?? DEFAULT_CONFIG_TOKENS_DIR;
  const configContractsDir = options.configContractsDir ?? DEFAULT_CONFIG_CONTRACTS_DIR;

  return {
    tokenFiles: {
      "primitive/color.tokens.json": buildPrimitiveColorTokens(themeTokens),
      "primitive/space.tokens.json": buildSpaceTokens(themeTokens),
      "primitive/shape.tokens.json": buildShapeTokens(themeTokens),
      "primitive/motion.tokens.json": buildMotionTokens(themeTokens),
      "primitive/typography.tokens.json": buildTypographyTokens(themeTokens),
      "semantic/semantic.tokens.json": buildSemanticTokens(themeTokens, darkOverrides),
    },
    contractFiles: buildComponentContractFiles(),
    configExample: buildComponentContractsExample(configTokensDir, configContractsDir),
  };
}

function writeJsonFile(filePath: string, value: JsonObject) {
  const directory = dirname(filePath);
  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }

  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export function writeFigmaArtifacts(options: WriteFigmaArtifactsOptions = {}) {
  const outputDir = options.outputDir ?? DEFAULT_OUTPUT_DIR;
  const configPath = options.configPath ?? DEFAULT_CONFIG_PATH;
  const configTokensDir = options.configTokensDir ?? DEFAULT_CONFIG_TOKENS_DIR;
  const configContractsDir = options.configContractsDir ?? DEFAULT_CONFIG_CONTRACTS_DIR;

  const artifacts = buildFigmaArtifacts({
    configTokensDir,
    configContractsDir,
  });

  for (const [relativeFilePath, fileContents] of Object.entries(artifacts.tokenFiles)) {
    writeJsonFile(resolve(outputDir, relativeFilePath), fileContents);
  }

  const contractsDir = resolve(outputDir, "contracts");
  for (const [relativeFilePath, fileContents] of Object.entries(artifacts.contractFiles)) {
    writeJsonFile(resolve(contractsDir, relativeFilePath), fileContents);
  }

  writeFileSync(configPath, artifacts.configExample);
}

function main() {
  writeFigmaArtifacts();
  console.log("Generated RDNA Figma token and component contract artifacts.");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
