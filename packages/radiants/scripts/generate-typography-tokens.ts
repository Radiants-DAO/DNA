#!/usr/bin/env node
/**
 * generate-typography-tokens.ts
 *
 * Reads pretext-type-scale.ts (the single source of truth) and outputs
 * generated/typography-tokens.css containing:
 *   1. @theme block with static --font-size-* tokens
 *   2. @layer base block with fluid --font-size-fluid-* tokens (cqi-based)
 *
 * The root clamp (html { font-size }) is NOT generated here — it stays
 * in base.css as a global layout concern.
 *
 * Run: node --experimental-strip-types scripts/generate-typography-tokens.ts
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

import { staticScale, cssFluidScale } from '../patterns/pretext-type-scale.ts';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format a number, trimming trailing zeros: 1.000 → "1", 0.750 → "0.75" */
function fmt(n: number): string {
  const s = n.toFixed(3);
  return s.replace(/\.?0+$/, '') || '0';
}

// ---------------------------------------------------------------------------
// Generate CSS
// ---------------------------------------------------------------------------

function generateCss(): string {
  const lines: string[] = [];

  lines.push('/* =============================================================================');
  lines.push('   Auto-generated from pretext-type-scale.ts — do not edit.');
  lines.push('   Run: pnpm tokens:generate');
  lines.push('   ============================================================================= */');
  lines.push('');

  // --- @theme: static font-size tokens ---
  lines.push('@theme {');
  const scaleComments: Record<string, string> = {
    xs:      '10px - fixed: small labels',
    sm:      '12px - fixed: buttons, small UI',
    base:    '16px - base',
    lg:      '~21px - base × 1.333',
    xl:      '~28px - base × 1.333²',
    '2xl':   '~38px - base × 1.333³',
    '3xl':   '~50px - base × 1.333⁴',
    '4xl':   '~67px - base × 1.333⁵',
    '5xl':   '~90px - base × 1.333⁶',
    display: 'alias: same as 5xl',
  };

  for (const [tier, rem] of Object.entries(staticScale)) {
    const comment = scaleComments[tier] ? `  /* ${scaleComments[tier]} */` : '';
    lines.push(`  --font-size-${tier}: ${fmt(rem)}rem;${comment}`);
  }

  // Tailwind v4 reads the --text-* namespace (not --font-size-*) to generate
  // text-{tier} utilities. Mirror the static scale into --text-* so the
  // RDNA sizes actually drive .text-xxs / .text-xs / .text-sm / etc.
  lines.push('');
  for (const [tier, rem] of Object.entries(staticScale)) {
    lines.push(`  --text-${tier}: ${fmt(rem)}rem;`);
  }
  lines.push('}');
  lines.push('');

  // --- @layer base: fluid tokens ---
  lines.push('@layer base {');
  lines.push('  :root {');

  for (const [tier, t] of Object.entries(cssFluidScale)) {
    const clamp = `clamp(${fmt(t.minRem)}rem, ${fmt(t.baseRem)}rem + ${fmt(t.cqiCoeff)}cqi, ${fmt(t.maxRem)}rem)`;
    lines.push(`    --font-size-fluid-${tier}: ${clamp};`);
  }

  lines.push('  }');
  lines.push('}');
  lines.push('');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const outDir = join(dirname(new URL(import.meta.url).pathname), '..', 'generated');
mkdirSync(outDir, { recursive: true });

const outPath = join(outDir, 'typography-tokens.css');
const css = generateCss();
writeFileSync(outPath, css, 'utf8');

console.log(`[tokens:generate] wrote ${outPath} (${css.length} bytes)`);
