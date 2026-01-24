#!/usr/bin/env node

/**
 * Token Completeness Validator
 *
 * Validates that all required design tokens are defined in tokens.css
 * Based on fn-6 spec: Theme System Build - RadOS Perfect Theme
 *
 * Usage:
 *   node scripts/validate-tokens.js [--fix]
 *
 * Exit codes:
 *   0 - All tokens present
 *   1 - Missing tokens found
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOKENS_PATH = join(__dirname, '..', 'tokens.css');

// Required token definitions per the fn-6 spec
const REQUIRED_TOKENS = {
  // Motion Tokens
  motion: {
    durations: [
      '--duration-instant',
      '--duration-fast',
      '--duration-base',
      '--duration-moderate',
      '--duration-slow',
    ],
    scalar: ['--duration-scalar'],
    easings: [
      '--ease-default',
      '--ease-linear',
      '--ease-in',
      '--ease-out',
      '--ease-in-out',
    ],
    transitions: [
      '--transition-fast',
      '--transition-base',
      '--transition-slow',
    ],
    stagger: [
      '--stagger-none',
      '--stagger-fast',
      '--stagger-base',
      '--stagger-slow',
    ],
  },

  // Icon Size Tokens
  icons: {
    sizes: [
      '--icon-xs',
      '--icon-sm',
      '--icon-md',
      '--icon-lg',
      '--icon-xl',
      '--icon-2xl',
    ],
  },

  // Accessibility Tokens
  accessibility: {
    focusRing: [
      '--focus-ring-width',
      '--focus-ring-offset',
      '--focus-ring-color',
    ],
    touchTargets: [
      '--touch-target-min',
      '--touch-target-default',
      '--touch-target-comfortable',
    ],
  },

  // Density Tokens
  density: {
    scale: ['--density-scale'],
    padding: [
      '--density-padding-xs',
      '--density-padding-sm',
      '--density-padding-md',
      '--density-padding-lg',
      '--density-padding-xl',
    ],
    interactive: ['--lift-distance', '--press-distance'],
  },

  // Fluid Typography Tokens
  typography: {
    text: [
      '--text-xs',
      '--text-sm',
      '--text-base',
      '--text-lg',
      '--text-xl',
      '--text-2xl',
      '--text-3xl',
      '--text-4xl',
    ],
  },

  // Fluid Spacing Tokens
  spacing: {
    base: [
      '--space-3xs',
      '--space-2xs',
      '--space-xs',
      '--space-s',
      '--space-m',
      '--space-l',
      '--space-xl',
      '--space-2xl',
      '--space-3xl',
    ],
    pairs: ['--space-s-m', '--space-s-l', '--space-m-xl'],
  },

  // Breakpoints & Container Queries
  layout: {
    breakpoints: [
      '--breakpoint-xs',
      '--breakpoint-sm',
      '--breakpoint-md',
      '--breakpoint-lg',
      '--breakpoint-xl',
      '--breakpoint-2xl',
    ],
    containers: ['--container-sm', '--container-md', '--container-lg'],
  },

  // Sound Tokens (placeholders)
  sound: {
    volume: [
      '--volume-silent',
      '--volume-whisper',
      '--volume-soft',
      '--volume-low',
      '--volume-medium',
      '--volume-high',
      '--volume-full',
    ],
    categories: [
      '--sound-volume-master',
      '--sound-volume-feedback',
      '--sound-volume-confirmation',
      '--sound-volume-error',
    ],
  },

  // Core Color Tokens (brand + semantic)
  colors: {
    brand: [
      '--color-black',
      '--color-sun-yellow',
      '--color-sky-blue',
      '--color-warm-cloud',
      '--color-sunset-fuzz',
      '--color-sun-red',
      '--color-green',
      '--color-white',
    ],
    surface: [
      '--color-surface-primary',
      '--color-surface-secondary',
      '--color-surface-tertiary',
      '--color-surface-elevated',
      '--color-surface-sunken',
      '--color-surface-success',
      '--color-surface-warning',
      '--color-surface-error',
    ],
    content: [
      '--color-content-primary',
      '--color-content-secondary',
      '--color-content-tertiary',
      '--color-content-inverted',
      '--color-content-success',
      '--color-content-warning',
      '--color-content-error',
      '--color-content-link',
    ],
    edge: [
      '--color-edge-primary',
      '--color-edge-secondary',
      '--color-edge-success',
      '--color-edge-warning',
      '--color-edge-error',
      '--color-edge-focus',
    ],
  },

  // Radius Tokens
  radius: {
    values: [
      '--radius-none',
      '--radius-xs',
      '--radius-sm',
      '--radius-md',
      '--radius-lg',
      '--radius-full',
    ],
  },

  // Shadow Tokens
  shadows: {
    values: [
      '--shadow-btn',
      '--shadow-btn-hover',
      '--shadow-card',
      '--shadow-card-lg',
      '--shadow-card-hover',
      '--shadow-panel-left',
      '--shadow-inner',
    ],
  },
};

/**
 * Extract all CSS custom property definitions from a CSS file
 */
function extractTokenDefinitions(cssContent) {
  const tokens = new Set();

  // Match CSS custom property definitions like --token-name: value
  const regex = /--[\w-]+(?=\s*:)/g;
  let match;

  while ((match = regex.exec(cssContent)) !== null) {
    tokens.add(match[0]);
  }

  return tokens;
}

/**
 * Validate tokens against required list
 */
function validateTokens(definedTokens, requiredTokens) {
  const results = {
    valid: true,
    missing: {},
    categories: {},
  };

  for (const [category, subcategories] of Object.entries(requiredTokens)) {
    results.categories[category] = {
      total: 0,
      found: 0,
      missing: [],
    };

    for (const [subcategory, tokens] of Object.entries(subcategories)) {
      for (const token of tokens) {
        results.categories[category].total++;

        if (definedTokens.has(token)) {
          results.categories[category].found++;
        } else {
          results.valid = false;
          results.categories[category].missing.push(token);

          if (!results.missing[category]) {
            results.missing[category] = [];
          }
          results.missing[category].push(token);
        }
      }
    }
  }

  return results;
}

/**
 * Format validation results for console output
 */
function formatResults(results) {
  const lines = [];

  lines.push('');
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('  Token Completeness Validation Report');
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('');

  let totalTokens = 0;
  let totalFound = 0;

  for (const [category, stats] of Object.entries(results.categories)) {
    const status =
      stats.missing.length === 0 ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
    const categoryName = category.charAt(0).toUpperCase() + category.slice(1);

    lines.push(
      `  ${status} ${categoryName}: ${stats.found}/${stats.total} tokens`
    );

    if (stats.missing.length > 0) {
      for (const token of stats.missing) {
        lines.push(`      \x1b[31m- Missing: ${token}\x1b[0m`);
      }
    }

    totalTokens += stats.total;
    totalFound += stats.found;
  }

  lines.push('');
  lines.push('───────────────────────────────────────────────────────────────');

  const percentage = ((totalFound / totalTokens) * 100).toFixed(1);
  const statusColor = results.valid ? '\x1b[32m' : '\x1b[31m';
  const statusText = results.valid ? 'PASS' : 'FAIL';

  lines.push(
    `  Total: ${totalFound}/${totalTokens} tokens (${percentage}%)`
  );
  lines.push(`  Status: ${statusColor}${statusText}\x1b[0m`);
  lines.push('');
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('');

  return lines.join('\n');
}

/**
 * Generate JSON report
 */
function generateJsonReport(results, definedTokens) {
  return {
    timestamp: new Date().toISOString(),
    file: TOKENS_PATH,
    valid: results.valid,
    summary: {
      total: Object.values(results.categories).reduce(
        (sum, c) => sum + c.total,
        0
      ),
      found: Object.values(results.categories).reduce(
        (sum, c) => sum + c.found,
        0
      ),
      missing: Object.values(results.missing).flat().length,
    },
    categories: results.categories,
    definedTokensCount: definedTokens.size,
  };
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');
  const quiet = args.includes('--quiet');

  let cssContent;
  try {
    cssContent = readFileSync(TOKENS_PATH, 'utf-8');
  } catch (err) {
    console.error(`Error reading ${TOKENS_PATH}: ${err.message}`);
    process.exit(1);
  }

  const definedTokens = extractTokenDefinitions(cssContent);
  const results = validateTokens(definedTokens, REQUIRED_TOKENS);

  if (jsonOutput) {
    console.log(JSON.stringify(generateJsonReport(results, definedTokens), null, 2));
  } else if (!quiet) {
    console.log(formatResults(results));
  }

  process.exit(results.valid ? 0 : 1);
}

main();
