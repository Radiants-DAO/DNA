/**
 * Radiants System Contract — Phase 1 seed
 *
 * Single authored source of truth for all design-system data that feeds
 * the generated contract artifacts (eslint-contract.json, ai-contract.json).
 *
 * Phase 2 will auto-derive parts of this from *.meta.ts files.
 */

export const radiantsSystemContract = {
  contractVersion: "0.1.0",

  tokenMap: {
    brandPalette: {
      "#fef8e2": "cream",
      "#0f0e0c": "ink",
      "#000000": "pure-black",
      "#fce184": "sun-yellow",
      "#95bad2": "sky-blue",
      "#fcc383": "sunset-fuzz",
      "#ff6b63": "sun-red",
      "#cef5ca": "mint",
      "#fffcf3": "pure-white",
      "#22c55e": "success-mint",
    },
    hexToSemantic: {
      "#fef8e2": { bg: "page", text: "flip" },
      "#0f0e0c": { bg: "inv", text: "main", border: "line" },
      "#95bad2": { text: "link" },
      "#ff6b63": { bg: "danger", text: "danger" },
      "#cef5ca": { bg: "success", text: "success" },
      "#fffcf3": { bg: "card" },
      "#22c55e": { text: "success" },
    },
    oklchToSemantic: {
      "oklch(0.9780 0.0295 94.34)": { bg: "page", text: "flip" },
      "oklch(0.1641 0.0044 84.59)": { bg: "inv", text: "main", border: "line" },
      "oklch(0.9126 0.1170 93.68)": { bg: "action-primary", border: "edge-focus", ring: "edge-focus" },
      "oklch(0.7701 0.0527 236.81)": { text: "content-link" },
      "oklch(0.8546 0.1039 68.93)": { bg: "action-accent" },
      "oklch(0.7102 0.1823 25.87)": { bg: "action-destructive", text: "status-error" },
      "oklch(0.9312 0.0702 142.51)": { bg: "status-success", text: "status-success" },
      "oklch(0.9909 0.0123 91.51)": { bg: "card" },
      "oklch(0.7227 0.1920 149.58)": { text: "status-success" },
    },
    removedAliases: [
      "--color-black",
      "--color-white",
      "--color-green",
      "--color-success-green",
      "--glow-green",
    ],
    semanticColorSuffixes: [
      // Legacy (Tier 2 backgrounds)
      "page", "card", "tinted", "inv", "depth", "hover", "active",
      // Legacy (Tier 2 text)
      "main", "sub", "mute", "flip", "head", "link",
      // Legacy (Tier 2 borders)
      "line", "rule", "line-hover", "focus",
      // Legacy (Tier 2 accents)
      "accent", "accent-inv", "accent-soft", "danger",
      // Legacy (Tier 2 status)
      "success", "warning",
      // Window chrome
      "window-chrome-from", "window-chrome-to",
      // Structured: surface
      "surface-primary", "surface-secondary", "surface-elevated",
      // Structured: content
      "content-primary", "content-heading", "content-secondary",
      "content-inverted", "content-muted", "content-link",
      // Structured: action
      "action-primary", "action-secondary", "action-accent", "action-destructive",
      // Structured: edge
      "edge-primary", "edge-muted", "edge-hover", "edge-focus",
      // Structured: status
      "status-success", "status-warning", "status-error", "status-info",
    ],
  },

  componentMap: {},

  pixelCorners: {
    triggerClasses: [
      "pixel-rounded-xs", "pixel-rounded-sm", "pixel-rounded-md",
      "pixel-rounded-lg", "pixel-rounded-xl", "pixel-corners",
    ],
    shadowMigrationMap: {
      "shadow-surface": "pixel-shadow-surface",
      "shadow-resting": "pixel-shadow-resting",
      "shadow-lifted": "pixel-shadow-lifted",
      "shadow-raised": "pixel-shadow-raised",
      "shadow-floating": "pixel-shadow-floating",
      "shadow-focused": "pixel-shadow-floating (or custom filter: drop-shadow)",
      "shadow-glow-success": "custom filter: drop-shadow with success color",
      "shadow-glow-error": "custom filter: drop-shadow with error color",
      "shadow-glow-info": "custom filter: drop-shadow with info color",
    },
  },

  themeVariants: [
    "default", "raised", "inverted",
    "select", "switch", "accordion",
    "success", "warning", "error", "info",
  ],

  motion: {
    maxDurationMs: 300,
    allowedEasings: ["ease-standard"],
    durationTokens: [
      "duration-instant", "duration-fast", "duration-base",
      "duration-moderate", "duration-slow",
    ],
    easingTokens: [
      "--easing-default", "--easing-out", "--easing-in", "--easing-spring",
    ],
  },

  shadows: {
    validStandard: [
      "shadow-surface", "shadow-resting", "shadow-lifted", "shadow-raised",
      "shadow-floating", "shadow-focused", "shadow-inset",
      "shadow-btn", "shadow-btn-hover", "shadow-card", "shadow-card-lg", "shadow-inner",
    ],
    validPixel: [
      "pixel-shadow-surface", "pixel-shadow-resting", "pixel-shadow-lifted",
      "pixel-shadow-raised", "pixel-shadow-floating",
    ],
    validGlow: [
      "shadow-glow-sm", "shadow-glow-md", "shadow-glow-lg", "shadow-glow-xl",
      "shadow-glow-success", "shadow-glow-error", "shadow-glow-info",
    ],
  },

  typography: {
    validSizes: [
      "text-xs", "text-sm", "text-base", "text-lg",
      "text-xl", "text-2xl", "text-3xl", "text-4xl", "text-5xl",
    ],
    validWeights: [
      "font-normal", "font-medium", "font-semibold", "font-bold",
    ],
    validLeading: [
      "leading-tight", "leading-heading", "leading-snug",
      "leading-normal", "leading-relaxed",
    ],
    validTracking: [
      "tracking-tight", "tracking-normal", "tracking-wide",
    ],
    validFontFamilies: [
      "font-sans", "font-heading", "font-mono",
      "font-display", "font-caption",
      "font-mondwest", "font-joystix",
    ],
  },

  textLikeInputTypes: ["text", "email", "password", "search", "url", "tel", "number"],
} as const;
