import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export const EMPTY_CONTRACT = Object.freeze({
  tokenMap: {
    brandPalette: {},
    hexToSemantic: {},
    oklchToSemantic: {},
    removedAliases: [],
    semanticColorSuffixes: [],
  },
  componentMap: {},
  components: {},
  pixelCorners: { triggerClasses: [], shadowMigrationMap: {} },
  themeVariants: [],
  motion: { maxDurationMs: 0, allowedEasings: [], durationTokens: [], easingTokens: [] },
  shadows: { validStandard: [], validPixel: [], validGlow: [] },
  typography: { validSizes: [], validWeights: [], validLeading: [], validFontFamilies: [] },
  textLikeInputTypes: [],
});

function defaultReadContract() {
  return require("../generated/eslint-contract.json");
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function mergeObjectSection(section, fallback) {
  return {
    ...fallback,
    ...(isObject(section) ? section : {}),
  };
}

function mergeArraySection(section, fallback) {
  return Array.isArray(section) ? section : fallback;
}

function normalizeContract(rawContract) {
  const contract = isObject(rawContract) ? rawContract : {};

  return {
    ...EMPTY_CONTRACT,
    ...contract,
    tokenMap: mergeObjectSection(contract.tokenMap, EMPTY_CONTRACT.tokenMap),
    componentMap: isObject(contract.componentMap) ? contract.componentMap : EMPTY_CONTRACT.componentMap,
    components: isObject(contract.components) ? contract.components : EMPTY_CONTRACT.components,
    pixelCorners: mergeObjectSection(contract.pixelCorners, EMPTY_CONTRACT.pixelCorners),
    themeVariants: mergeArraySection(contract.themeVariants, EMPTY_CONTRACT.themeVariants),
    motion: mergeObjectSection(contract.motion, EMPTY_CONTRACT.motion),
    shadows: mergeObjectSection(contract.shadows, EMPTY_CONTRACT.shadows),
    typography: mergeObjectSection(contract.typography, EMPTY_CONTRACT.typography),
    textLikeInputTypes: mergeArraySection(
      contract.textLikeInputTypes,
      EMPTY_CONTRACT.textLikeInputTypes,
    ),
  };
}

export function loadContract(readContract = defaultReadContract) {
  try {
    return normalizeContract(readContract());
  } catch (error) {
    if (error?.code === "MODULE_NOT_FOUND" || error instanceof SyntaxError) {
      return EMPTY_CONTRACT;
    }
    throw error;
  }
}

export const contract = loadContract();
export const tokenMap = contract.tokenMap;
export const componentMap = contract.componentMap;
export const components = contract.components ?? {};
export const pixelCorners = contract.pixelCorners;
export const themeVariants = contract.themeVariants;
export const motion = contract.motion;
export const shadows = contract.shadows;
export const typography = contract.typography;
export const textLikeInputTypes = contract.textLikeInputTypes;
