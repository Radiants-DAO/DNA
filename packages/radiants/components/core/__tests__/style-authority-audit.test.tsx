import { describe, expect, test } from 'vitest';
import { collectCssVariantRules, findMixedStyleAuthorities } from '../../../../../scripts/audit-style-authority.mjs';

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
