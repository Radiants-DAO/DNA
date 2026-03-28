#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { converter, formatHex } from "culori";
import { componentMetaIndex } from "../meta/index.ts";
import { radiantsSystemContract } from "../contract/system.ts";
import type { ComponentMeta } from "../../preview/src/index.ts";

type JsonObject = Record<string, unknown>;

interface FigmaArtifacts {
  tokenFiles: Record<string, JsonObject>;
  contractFiles: Record<string, JsonObject>;
  textFiles: Record<string, string>;
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
const toRgb = converter("rgb");

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

function resolveTokenValue(
  value: string,
  tokens: Record<string, string>,
  seen = new Set<string>(),
): string | null {
  const normalized = normalizeWhitespace(value);
  const varReference = normalized.match(/^var\((--[a-z0-9-]+)\)$/i)?.[1];

  if (!varReference) {
    return normalized;
  }

  if (seen.has(varReference)) {
    return null;
  }

  const next = tokens[varReference];
  if (!next) {
    return null;
  }

  seen.add(varReference);
  return resolveTokenValue(next, tokens, seen);
}

function toSrgbHex(value: string | null) {
  if (!value) return null;

  const rgb = toRgb(value);
  return rgb ? formatHex(rgb) : null;
}

function buildSrgbExtension(value: string | null) {
  const srgb = toSrgbHex(value);
  return srgb ? { $extensions: { rdna: { srgb } } } : {};
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

function extractOklchChroma(value: string | null) {
  if (!value) return null;
  const match = normalizeWhitespace(value).match(/^oklch\(\s*([^)]+?)\s*\)$/i);
  if (!match) return null;

  const [body] = match[1].split("/");
  const parts = body.trim().split(/\s+/);
  if (parts.length < 3) return null;

  const chroma = Number(parts[1]);
  return Number.isFinite(chroma) ? chroma : null;
}

function buildValidationReport(
  themeTokens: Record<string, string>,
  darkOverrides: Record<string, string>,
) {
  const tokenLookup = { ...themeTokens, ...darkOverrides };
  const colorEntries = Object.entries(themeTokens).filter(([name]) => name.startsWith("--color-"));

  const missingSemanticTokens = radiantsSystemContract.tokenMap.semanticColorSuffixes.filter(
    (suffix) => !themeTokens[`--color-${suffix}`],
  );

  const invalidColorTokens = colorEntries.flatMap(([name, value]) => {
    const normalized = normalizeWhitespace(value);
    if (/^var\(--[a-z0-9-]+\)$/i.test(normalized) || /^oklch\(/i.test(normalized)) {
      return [];
    }

    return [{ token: name, value: normalized }];
  });

  const gamutBoundaryViolations = Object.entries(tokenLookup).flatMap(([name, value]) => {
    const resolved = resolveTokenValue(value, tokenLookup);
    const chroma = extractOklchChroma(resolved);
    if (chroma === null || chroma <= 0.32) {
      return [];
    }

    return [{ token: name, chroma, value: resolved }];
  });

  const unresolvedSrgbFallbacks = colorEntries.flatMap(([name, value]) => {
    const resolved = resolveTokenValue(value, tokenLookup);
    return toSrgbHex(resolved) ? [] : [{ token: name, value: resolved ?? value }];
  });

  const issues =
    missingSemanticTokens.length +
    invalidColorTokens.length +
    gamutBoundaryViolations.length +
    unresolvedSrgbFallbacks.length;

  return {
    summary: {
      semanticTokens: radiantsSystemContract.tokenMap.semanticColorSuffixes.length,
      primitiveColorTokens: colorEntries.length,
      issues,
    },
    issues: {
      missingSemanticTokens,
      invalidColorTokens,
      gamutBoundaryViolations,
      unresolvedSrgbFallbacks,
    },
  };
}

function buildPrimitiveColorTokens(themeTokens: Record<string, string>) {
  const color: Record<string, JsonObject> = {};
  const tokenLookup = { ...themeTokens };

  for (const [name, value] of Object.entries(themeTokens)) {
    const suffix = stripCssPrefix(name, "--color-");
    if (!suffix || SEMANTIC_COLOR_SUFFIXES.has(suffix)) continue;
    color[suffix] = buildToken(
      value,
      "color",
      buildSrgbExtension(resolveTokenValue(value, tokenLookup)),
    );
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
    const lightResolved = resolveTokenValue(value, themeTokens);
    const darkResolved = resolveTokenValue(darkOverrides[name] ?? value, {
      ...themeTokens,
      ...darkOverrides,
    });

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
          srgb: {
            light: toSrgbHex(lightResolved),
            dark: toSrgbHex(darkResolved),
          },
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

function buildDtcgBundle(tokenFiles: Record<string, JsonObject>) {
  return {
    primitive: {
      color: tokenFiles["primitive/color.tokens.json"],
      space: tokenFiles["primitive/space.tokens.json"],
      shape: tokenFiles["primitive/shape.tokens.json"],
      motion: tokenFiles["primitive/motion.tokens.json"],
      typography: tokenFiles["primitive/typography.tokens.json"],
    },
    semantic: tokenFiles["semantic/semantic.tokens.json"],
  };
}

function buildTokenTypesFile(
  themeTokens: Record<string, string>,
  semanticTokens: JsonObject,
) {
  const primitiveColorNames = Object.keys(themeTokens)
    .map((name) => stripCssPrefix(name, "--color-"))
    .filter((name): name is string => Boolean(name) && !SEMANTIC_COLOR_SUFFIXES.has(name))
    .sort()
    .map((name) => `'color.${name}'`);

  const semanticColorNames = Object.entries(semanticTokens)
    .flatMap(([group, entries]) =>
      Object.keys((entries as Record<string, JsonObject>) ?? {}).map((key) => `'${group}.${key}'`),
    )
    .sort();

  return [
    "// AUTO-GENERATED — DO NOT EDIT",
    "// Generated by scripts/generate-figma-contracts.ts",
    "",
    `export type PrimitiveColorTokenName = ${primitiveColorNames.join(" | ")};`,
    `export type SemanticColorTokenName = ${semanticColorNames.join(" | ")};`,
    "export type RadiantsTokenName = PrimitiveColorTokenName | SemanticColorTokenName;",
    "",
  ].join("\n");
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
      ...(meta.density ? { density: meta.density } : {}),
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

  const tokenFiles: Record<string, JsonObject> = {
    "primitive/color.tokens.json": buildPrimitiveColorTokens(themeTokens),
    "primitive/space.tokens.json": buildSpaceTokens(themeTokens),
    "primitive/shape.tokens.json": buildShapeTokens(themeTokens),
    "primitive/motion.tokens.json": buildMotionTokens(themeTokens),
    "primitive/typography.tokens.json": buildTypographyTokens(themeTokens),
    "semantic/semantic.tokens.json": buildSemanticTokens(themeTokens, darkOverrides),
  };

  tokenFiles["rdna.tokens.json"] = buildDtcgBundle(tokenFiles);
  tokenFiles["validation-report.json"] = buildValidationReport(themeTokens, darkOverrides);

  return {
    tokenFiles,
    contractFiles: buildComponentContractFiles(),
    textFiles: {
      "tokens.d.ts": buildTokenTypesFile(
        themeTokens,
        tokenFiles["semantic/semantic.tokens.json"],
      ),
    },
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

  for (const [relativeFilePath, fileContents] of Object.entries(artifacts.textFiles)) {
    const fullPath = resolve(outputDir, relativeFilePath);
    const directory = dirname(fullPath);
    if (!existsSync(directory)) {
      mkdirSync(directory, { recursive: true });
    }
    writeFileSync(fullPath, fileContents.endsWith("\n") ? fileContents : `${fileContents}\n`);
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
