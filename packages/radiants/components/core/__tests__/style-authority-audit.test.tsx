import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { collectCssVariantRules, findMixedStyleAuthorities, auditThemeCss } from '../../../../../scripts/audit-style-authority.mjs';

describe('style authority audit', () => {
  test('flags a component that mixes local semantic color utilities with themed data-variant CSS', () => {
    const cssRules = collectCssVariantRules(
      `
      [data-slot="button-face"][data-variant="secondary"] { color: red; }
      [data-variant="select"] { color: blue; }
      `,
      'dark.css',
    );

    const findings = findMixedStyleAuthorities(
      `
      export const selectTriggerVariants = cva(
        "border border-edge-primary bg-surface-primary text-content-primary",
      );

      export function Trigger() {
        return <button data-variant="select" className={selectTriggerVariants()} />;
      }
      `,
      '/repo/packages/radiants/components/core/Select/Select.tsx',
      cssRules,
    );

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      file: '/repo/packages/radiants/components/core/Select/Select.tsx',
      variant: 'select',
      evidence: expect.arrayContaining([
        expect.objectContaining({ kind: 'component-variant', line: 7 }),
        expect.objectContaining({ kind: 'component-color', line: 3 }),
        expect.objectContaining({ kind: 'css-variant', line: 3 }),
      ]),
    });
  });

  test('does not flag a component that exposes data-variant without local semantic color utilities', () => {
    const cssRules = collectCssVariantRules(
      `
      [data-slot="button-face"][data-variant="secondary"] { color: red; }
      `,
      'dark.css',
    );

    const findings = findMixedStyleAuthorities(
      `
      export const buttonFaceVariants = cva(
        "border shadow-none group-hover:shadow-lifted",
      );

      export function Button() {
        return <span data-slot="button-face" data-variant="secondary" className={buttonFaceVariants()} />;
      }
      `,
      '/repo/packages/radiants/components/core/Button/Button.tsx',
      cssRules,
    );

    expect(findings).toHaveLength(0);
  });
});

describe('theme css audit', () => {
  test('passes for valid dark token overrides', () => {
    const result = auditThemeCss({
      files: [{ path: 'dark.css', content: '.dark { --color-surface-primary: var(--color-ink); }' }],
      darkCssPath: 'dark.css',
    });
    expect(result.findings).toHaveLength(0);
  });

  test('passes for valid slot/variant selectors', () => {
    const result = auditThemeCss({
      files: [{ path: 'dark.css', content: '[data-slot="button-face"][data-variant="primary"] { background: var(--color-ink); }' }],
      darkCssPath: 'dark.css',
    });
    expect(result.findings).toHaveLength(0);
  });

  test('fails for @media (prefers-color-scheme: dark)', () => {
    const result = auditThemeCss({
      files: [{ path: 'dark.css', content: '@media (prefers-color-scheme: dark) { :root:not(.light) { --color-surface-primary: var(--color-ink); } }' }],
      darkCssPath: 'dark.css',
    });
    expect(result.findings.length).toBeGreaterThan(0);
    expect(result.findings[0].rule).toBe('no-prefers-color-scheme');
  });

  test('fails for banned legacy selector .btn-primary', () => {
    const result = auditThemeCss({
      files: [{ path: 'dark.css', content: '.btn-primary { background: red; }' }],
      darkCssPath: 'dark.css',
    });
    expect(result.findings.length).toBeGreaterThan(0);
    expect(result.findings[0].rule).toBe('no-banned-selector');
  });

  test('fails for banned legacy selector .badge-success', () => {
    const result = auditThemeCss({
      files: [{ path: 'dark.css', content: '.badge-success { color: green; }' }],
      darkCssPath: 'dark.css',
    });
    expect(result.findings.length).toBeGreaterThan(0);
    expect(result.findings[0].rule).toBe('no-banned-selector');
  });

  test('fails for prefers-color-scheme in any package CSS file', () => {
    const result = auditThemeCss({
      files: [
        { path: 'base.css', content: '@media (prefers-color-scheme: dark) { body { color: white; } }' },
        { path: 'dark.css', content: '.dark { --color-surface-primary: var(--color-ink); }' },
      ],
      darkCssPath: 'dark.css',
    });
    expect(result.findings.length).toBeGreaterThan(0);
    expect(result.findings[0].rule).toBe('no-prefers-color-scheme');
    expect(result.findings[0].file).toBe('base.css');
  });

  test('repo-level: current dark.css has violations', () => {
    const repoRoot = path.resolve(import.meta.dirname, '../../../../..');
    const darkCssPath = 'packages/radiants/dark.css';
    const packageCssFiles = [
      'packages/radiants/base.css',
      'packages/radiants/dark.css',
      'packages/radiants/typography.css',
      'packages/radiants/index.css',
    ];
    const files = packageCssFiles
      .map((f) => {
        const fullPath = path.resolve(repoRoot, f);
        if (!fs.existsSync(fullPath)) return null;
        return { path: f, content: fs.readFileSync(fullPath, 'utf8') };
      })
      .filter(Boolean) as { path: string; content: string }[];

    const result = auditThemeCss({ files, darkCssPath });
    expect(result.findings).toHaveLength(0);
  });

  test('repo-level: dark.css must not contain @media (prefers-color-scheme: dark)', () => {
    const repoRoot = path.resolve(import.meta.dirname, '../../../../..');
    const darkCssPath = 'packages/radiants/dark.css';
    const darkCss = fs.readFileSync(path.resolve(repoRoot, darkCssPath), 'utf8');

    const result = auditThemeCss({
      files: [{ path: darkCssPath, content: darkCss }],
      darkCssPath,
    });
    const pcsFindings = result.findings.filter((f) => f.rule === 'no-prefers-color-scheme');
    expect(pcsFindings).toHaveLength(0);
  });

  test('repo-level: dark.css must not contain banned legacy selectors', () => {
    const repoRoot = path.resolve(import.meta.dirname, '../../../../..');
    const darkCssPath = 'packages/radiants/dark.css';
    const darkCss = fs.readFileSync(path.resolve(repoRoot, darkCssPath), 'utf8');

    const result = auditThemeCss({
      files: [{ path: darkCssPath, content: darkCss }],
      darkCssPath,
    });
    const bannedFindings = result.findings.filter((f) => f.rule === 'no-banned-selector');
    expect(bannedFindings).toHaveLength(0);
  });
});
