import { Linter } from 'eslint';
import { describe, expect, it } from 'vitest';
import rule from '../rules/no-mixed-style-authority.mjs';

describe('rdna/no-mixed-style-authority', () => {
  function lint(code, themeVariants = [
    'primary', 'secondary', 'outline', 'ghost', 'destructive',
    'select', 'switch', 'accordion',
  ]) {
    const linter = new Linter({ configType: 'eslintrc' });
    linter.defineRule('rdna/no-mixed-style-authority', rule);
    return linter.verify(code, {
      parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
      rules: { 'rdna/no-mixed-style-authority': ['error', { themeVariants }] },
    });
  }

  it('does not flag structural-only CVA with data-variant', () => {
    const code = `
      const faceVariants = cva("border shadow-none group-hover:shadow-lifted");
      function Button() {
        return <span data-slot="button-face" data-variant="secondary" className={faceVariants()} />;
      }
    `;
    expect(lint(code)).toHaveLength(0);
  });

  it('does not flag structural-only CVA when it is wrapped in cn', () => {
    const code = `
      const faceVariants = cva("border shadow-none group-hover:shadow-lifted");
      function Button({ className }) {
        return <span data-variant="secondary" className={cn(faceVariants(), className)} />;
      }
    `;
    expect(lint(code)).toHaveLength(0);
  });

  it('does not flag semantic colors without a matching theme variant', () => {
    const code = `
      function Card() {
        return <div className="bg-page text-main border-line" />;
      }
    `;
    expect(lint(code)).toHaveLength(0);
  });

  it('does not flag data-variant with no local semantic colors', () => {
    const code = `
      function Toggle() {
        return <div data-variant="switch" className="flex items-center" />;
      }
    `;
    expect(lint(code)).toHaveLength(0);
  });

  it('flags Select-style trigger with data-variant and semantic colors', () => {
    const code = `
      const triggerVariants = cva("border border-line bg-page text-main");
      function Trigger() {
        return <button data-variant="select" className={triggerVariants()} />;
      }
    `;
    const result = lint(code);
    expect(result).toHaveLength(1);
    expect(result[0].message).toContain('select');
  });

  it('flags Switch-style track with data-variant and semantic colors', () => {
    const code = `
      function Track() {
        return <div data-variant="switch" className="bg-inv border-line" />;
      }
    `;
    const result = lint(code);
    expect(result).toHaveLength(1);
    expect(result[0].message).toContain('switch');
  });

  it('flags Button-style face with data-variant and semantic colors in CVA', () => {
    const code = `
      const faceVariants = cva(
        "bg-accent text-main shadow-resting",
        { variants: { variant: { secondary: "bg-inv" } } }
      );
      function Button() {
        return <span data-slot="button-face" data-variant="secondary" className={faceVariants({ variant: "secondary" })} />;
      }
    `;
    const result = lint(code);
    expect(result).toHaveLength(1);
    expect(result[0].message).toContain('secondary');
  });

  it('flags semantic colors when the cva call is wrapped in cn', () => {
    const code = `
      const faceVariants = cva("bg-accent text-main");
      function Button({ className }) {
        return <span data-variant="secondary" className={cn(faceVariants({ variant: "secondary" }), className)} />;
      }
    `;
    const result = lint(code);
    expect(result).toHaveLength(1);
    expect(result[0].message).toContain('secondary');
  });

  it('flags semantic colors when the variant builder is created from a cva alias', () => {
    const code = `
      const makeVariants = cva;
      const faceVariants = makeVariants("bg-accent text-main");
      function Button() {
        return <span data-variant="secondary" className={faceVariants()} />;
      }
    `;
    const result = lint(code);
    expect(result).toHaveLength(1);
    expect(result[0].message).toContain('secondary');
  });

  it('flags semantic colors when the variant builder is created from a cva wrapper', () => {
    const code = `
      const makeVariants = (...args) => cva(...args);
      const faceVariants = makeVariants("bg-accent text-main");
      function Button() {
        return <span data-variant="secondary" className={faceVariants()} />;
      }
    `;
    const result = lint(code);
    expect(result).toHaveLength(1);
    expect(result[0].message).toContain('secondary');
  });

  it('flags semantic colors when cva is imported with an alias', () => {
    const code = `
      import { cva as makeVariants } from 'class-variance-authority';
      const faceVariants = makeVariants("bg-accent text-main");
      function Button() {
        return <span data-variant="secondary" className={faceVariants()} />;
      }
    `;
    const result = lint(code);
    expect(result).toHaveLength(1);
    expect(result[0].message).toContain('secondary');
  });

  it('does not flag structural-only CVA when cva is imported with an alias', () => {
    const code = `
      import { cva as makeVariants } from 'class-variance-authority';
      const faceVariants = makeVariants("border shadow-none group-hover:shadow-lifted");
      function Button() {
        return <span data-variant="secondary" className={faceVariants()} />;
      }
    `;
    expect(lint(code)).toHaveLength(0);
  });

  it('does not flag cva imported from unrelated modules', () => {
    const code = `
      import { cva as makeVariants } from './not-cva';
      const faceVariants = makeVariants("bg-accent text-main");
      function Button() {
        return <span data-variant="secondary" className={faceVariants()} />;
      }
    `;
    // './not-cva' is not class-variance-authority, so the alias is not seeded
    expect(lint(code)).toHaveLength(0);
  });

  it('flags expression-valued data-variant attributes', () => {
    const code = `
      const faceVariants = cva("bg-accent text-main");
      function Button() {
        return <span data-variant={"secondary"} className={faceVariants()} />;
      }
    `;
    const result = lint(code);
    expect(result).toHaveLength(1);
    expect(result[0].message).toContain('secondary');
  });

  it('does not flag when variant is not in themeVariants list', () => {
    const code = `
      function Trigger() {
        return <button data-variant="custom" className="bg-page text-main" />;
      }
    `;
    // "custom" is not in the default themeVariants list
    expect(lint(code)).toHaveLength(0);
  });

  it('does not produce duplicate reports for same variant on same line', () => {
    const code = `
      function Trigger() {
        return <button data-variant="select" className="bg-page text-main border-line" />;
      }
    `;
    const result = lint(code);
    expect(result).toHaveLength(1);
  });

  it('does not flag structural-only CVA with primary variant', () => {
    const code = `
      const faceVariants = cva("border shadow-none group-hover:shadow-lifted");
      function Button() {
        return <span data-slot="button-face" data-variant="primary" className={faceVariants()} />;
      }
    `;
    expect(lint(code)).toHaveLength(0);
  });

  it('flags primary variant with semantic colors in CVA', () => {
    const code = `
      const faceVariants = cva("bg-accent text-flip");
      function Button() {
        return <span data-slot="button-face" data-variant="primary" className={faceVariants()} />;
      }
    `;
    const result = lint(code);
    expect(result).toHaveLength(1);
    expect(result[0].message).toContain('primary');
  });

  it('flags ghost variant with semantic colors', () => {
    const code = `
      function Button() {
        return <span data-variant="ghost" className="text-mute bg-page" />;
      }
    `;
    const result = lint(code);
    expect(result).toHaveLength(1);
    expect(result[0].message).toContain('ghost');
  });
});
