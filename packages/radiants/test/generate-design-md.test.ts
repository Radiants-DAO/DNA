import { describe, expect, it } from 'vitest';

import {
  extractCssTokens,
  extractEslintRules,
  renderBrandPaletteTable,
  renderEslintRulesTable,
  renderMotionTables,
  renderSemanticTable,
  renderTypographyScale,
  rewriteMarkerRegion,
} from '../scripts/generate-design-md';

describe('rewriteMarkerRegion', () => {
  it('replaces content inside matching markers', () => {
    const source = [
      'before',
      '<!-- BEGIN GENERATED:demo -->',
      'old',
      '<!-- END GENERATED:demo -->',
      'after',
    ].join('\n');

    expect(rewriteMarkerRegion(source, 'demo', 'new')).toBe(
      [
        'before',
        '<!-- BEGIN GENERATED:demo -->',
        'new',
        '<!-- END GENERATED:demo -->',
        'after',
      ].join('\n'),
    );
  });

  it('throws when markers are missing', () => {
    expect(() => rewriteMarkerRegion('plain text', 'demo', 'new')).toThrow(
      'Missing generated marker region: demo',
    );
  });

  it('preserves content outside the generated region', () => {
    const source = 'alpha\n<!-- BEGIN GENERATED:x -->\nbeta\n<!-- END GENERATED:x -->\ngamma';
    const rewritten = rewriteMarkerRegion(source, 'x', 'delta');

    expect(rewritten.startsWith('alpha\n')).toBe(true);
    expect(rewritten.endsWith('\ngamma')).toBe(true);
  });
});

describe('CSS token extraction and renderers', () => {
  const lightCss = `
    @theme {
      --color-cream: oklch(0.9780 0.0295 94.34);
      --color-ink: oklch(0.1641 0.0044 84.59);
      --color-page: var(--color-cream);
      --color-main: var(--color-ink);
      --duration-base: 150ms;
      --easing-default: cubic-bezier(0, 0, 0.2, 1);
      --easing-spring: cubic-bezier(0.22, 1, 0.36, 1);
    }
  `;
  const darkCss = `
    .dark {
      --color-page: var(--color-ink);
      --color-hover-overlay: oklch(0.9126 0.1170 93.68 / 0.08);
    }
  `;

  it('extracts CSS tokens by name pattern', () => {
    expect(extractCssTokens(lightCss, /^--color-/)).toEqual([
      { name: '--color-cream', value: 'oklch(0.9780 0.0295 94.34)' },
      { name: '--color-ink', value: 'oklch(0.1641 0.0044 84.59)' },
      { name: '--color-page', value: 'var(--color-cream)' },
      { name: '--color-main', value: 'var(--color-ink)' },
    ]);
  });

  it('renders the brand palette table', () => {
    const table = renderBrandPaletteTable(extractCssTokens(lightCss));

    expect(table).toContain('| `--color-cream` | `oklch(0.9780 0.0295 94.34)` |');
    expect(table).toContain('| `--color-sun-yellow` | _(missing)_ |');
  });

  it('renders semantic tables without inventing Sun values for Moon-only tokens', () => {
    const table = renderSemanticTable(
      'Overlay Tokens',
      ['--color-page', '--color-hover-overlay'],
      extractCssTokens(lightCss),
      extractCssTokens(darkCss),
    );

    expect(table).toContain('| `--color-page` | `var(--color-cream)` | `var(--color-ink)` |');
    expect(table).toContain(
      '| `--color-hover-overlay` | _(not defined in Sun)_ | `oklch(0.9126 0.1170 93.68 / 0.08)` |',
    );
  });

  it('renders typography scale values with px equivalents', () => {
    const table = renderTypographyScale(`
      @theme {
        --font-size-xs: 0.625rem;
        --font-size-sm: 0.75rem;
        --font-size-fluid-sm: clamp(0.75rem, 1cqi, 0.875rem);
      }
    `);

    expect(table).toContain('| `--font-size-xs` | `0.625rem` | 10px |');
    expect(table).not.toContain('--font-size-fluid-sm');
  });

  it('renders motion duration and easing tables', () => {
    const table = renderMotionTables(lightCss);

    expect(table).toContain('#### Durations');
    expect(table).toContain('| `--duration-base` | `150ms` |');
    expect(table).toContain('#### Easings');
    expect(table).toContain('| `--easing-spring` | `cubic-bezier(0.22, 1, 0.36, 1)` |');
  });
});

describe('ESLint rule extraction', () => {
  const plugin = {
    rules: {
      'no-demo': {
        meta: {
          docs: {
            description: 'Ban demo patterns',
          },
        },
      },
      'repo-local': {
        meta: {
          docs: {
            description: 'Repo-local policy',
          },
        },
      },
    },
    configs: {
      recommended: {
        rules: {
          'rdna/no-demo': 'warn',
        },
      },
      internals: {
        rules: {
          'rdna/no-demo': 'off',
        },
      },
      'recommended-strict': {
        rules: {
          'rdna/no-demo': 'error',
        },
      },
    },
  };

  it('extracts exported rules and config membership', () => {
    expect(extractEslintRules(plugin)).toEqual([
      {
        name: 'rdna/no-demo',
        description: 'Ban demo patterns',
        recommended: 'warn',
        internals: 'off',
        strict: 'error',
      },
      {
        name: 'rdna/repo-local',
        description: 'Repo-local policy',
        recommended: '—',
        internals: '—',
        strict: '—',
      },
    ]);
  });

  it('renders the rules table', () => {
    const table = renderEslintRulesTable(extractEslintRules(plugin));

    expect(table).toContain('| `rdna/no-demo` | Ban demo patterns | warn | off | error |');
    expect(table).toContain('| `rdna/repo-local` | Repo-local policy | — | — | — |');
  });
});
