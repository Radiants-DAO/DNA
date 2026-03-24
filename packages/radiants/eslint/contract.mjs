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
  typography: { validSizes: [], validWeights: [] },
  textLikeInputTypes: [],
});

function defaultReadContract() {
  return require("../generated/eslint-contract.json");
}

export function loadContract(readContract = defaultReadContract) {
  try {
    return readContract();
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
