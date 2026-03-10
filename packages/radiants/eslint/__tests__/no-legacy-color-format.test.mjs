import { describe, it, expect } from 'vitest';
import { scanForLegacyColors } from '../lib/no-legacy-color-format.mjs';

describe('no-legacy-color-format', () => {
  it('passes clean oklch-only content', () => {
    const css = `
      @theme {
        --color-cream: oklch(0.9780 0.0295 94.34);
        --color-ink: oklch(0.1641 0.0044 84.59);
      }
    `;
    expect(scanForLegacyColors(css, 'tokens.css')).toEqual([]);
  });

  it('flags hex values', () => {
    const css = `
      @theme {
        --color-cream: #FEF8E2;
      }
    `;
    const results = scanForLegacyColors(css, 'tokens.css');
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      line: expect.any(Number),
      value: '#FEF8E2',
      type: 'hex',
    });
  });

  it('flags rgba values', () => {
    const css = `
      .dark {
        --color-content-secondary: rgba(254, 248, 226, 0.85);
      }
    `;
    const results = scanForLegacyColors(css, 'dark.css');
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe('rgba');
  });

  it('flags rgb values', () => {
    const css = `--color-ink: rgb(15, 14, 12);`;
    const results = scanForLegacyColors(css, 'tokens.css');
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe('rgb');
  });

  it('flags uppercase color functions', () => {
    const css = `--color-ink: RGB(15, 14, 12);`;
    const results = scanForLegacyColors(css, 'tokens.css');
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe('rgb');
  });

  it('flags hsl values', () => {
    const css = `--color-ink: hsl(30, 12%, 4%);`;
    const results = scanForLegacyColors(css, 'tokens.css');
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe('hsl');
  });

  it('flags lab values', () => {
    const css = `--color-ink: lab(12% 1 1);`;
    const results = scanForLegacyColors(css, 'tokens.css');
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe('lab');
  });

  it('flags color-mix values', () => {
    const css = `--color-hover-overlay: color-mix(in oklch, white 50%, black);`;
    const results = scanForLegacyColors(css, 'tokens.css');
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe('color-mix');
  });

  it('ignores var() references', () => {
    const css = `
      --color-surface-primary: var(--color-cream);
      --color-edge-focus: var(--color-sun-yellow);
    `;
    expect(scanForLegacyColors(css, 'tokens.css')).toEqual([]);
  });

  it('ignores non-color values', () => {
    const css = `
      --radius-md: 0.5rem;
      --duration-fast: 100ms;
      --shadow-btn: 0 1px 0 0 var(--color-ink);
    `;
    expect(scanForLegacyColors(css, 'tokens.css')).toEqual([]);
  });

  it('ignores comments containing hex values', () => {
    const css = `
      --color-cream: oklch(0.9780 0.0295 94.34); /* was #FEF8E2 */
    `;
    expect(scanForLegacyColors(css, 'tokens.css')).toEqual([]);
  });

  it('ignores multi-line comments containing legacy values', () => {
    const css = `
      /*
       * Legacy reference:
       * --color-cream: #FEF8E2;
       * --color-edge-muted: rgba(15, 14, 12, 0.2);
       */
      --color-cream: oklch(0.9780 0.0295 94.34);
    `;
    expect(scanForLegacyColors(css, 'tokens.css')).toEqual([]);
  });

  it('reports multiple violations with correct line numbers', () => {
    const css = `--color-cream: #FEF8E2;
--color-ink: oklch(0.1641 0.0044 84.59);
--color-edge-muted: rgba(15, 14, 12, 0.2);`;
    const results = scanForLegacyColors(css, 'tokens.css');
    expect(results).toHaveLength(2);
    expect(results[0].line).toBe(1);
    expect(results[1].line).toBe(3);
  });
});
