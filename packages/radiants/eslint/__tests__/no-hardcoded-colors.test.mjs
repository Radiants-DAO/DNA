import { Linter, RuleTester } from 'eslint';
import { describe, expect, it } from 'vitest';
import rule from '../rules/no-hardcoded-colors.mjs';

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

describe('rdna/no-hardcoded-colors', () => {
  it('passes RuleTester', () => {
    tester.run('no-hardcoded-colors', rule, {
      valid: [
        // Semantic token classes — allowed
        { code: '<div className="bg-page text-main" />' },
        { code: '<div className="border-line" />' },
        { code: '<div className="text-link hover:bg-accent" />' },
        { code: '<div className="hover:bg-hover/20 text-main border-line/30" />' },
        { code: '<div className="hover:bg-hover active:bg-active" />' },
        // CSS keywords with semantic meaning remain allowed
        { code: '<div className="bg-transparent text-current border-inherit" />' },
        // Non-color arbitrary values — not this rule's job
        { code: '<div className="p-[12px]" />' },
        // Empty className
        { code: '<div className="" />' },
        // No className
        { code: '<div id="test" />' },
        // Template literal with only dynamic parts
        { code: '<div className={active ? "bg-page" : "bg-inv"} />' },
        // Non-color style properties with dynamic values — not a color concern
        { code: '<div style={{ width: `${size}px` }} />' },
        // Non-color style properties with static hex-like values — not a color concern
        { code: '<div style={{ width: "#0F0E0C" }} />' },
        // SVG color properties — not falsely skipped
        // (backgroundImage and stopColor are tested below as invalid)
      ],
      invalid: [
        // Arbitrary hex in Tailwind class
        {
          code: '<div className="bg-[#FEF8E2]" />',
          errors: [{ messageId: 'arbitraryColor' }],
          output: '<div className="bg-page" />',
        },
        // Arbitrary hex — lowercase
        {
          code: '<div className="text-[#0f0e0c]" />',
          errors: [{ messageId: 'arbitraryColor' }],
          output: '<div className="text-main" />',
        },
        // Arbitrary hex — no auto-fix when ambiguous (pure-black has no safe mapping)
        {
          code: '<div className="bg-[#000000]" />',
          errors: [{ messageId: 'arbitraryColor' }],
        },
        // Arbitrary rgb
        {
          code: '<div className="bg-[rgb(254,248,226)]" />',
          errors: [{ messageId: 'arbitraryColor' }],
        },
        // Multiple violations in one className
        {
          code: '<div className="bg-[#FEF8E2] text-[#0f0e0c]" />',
          errors: [{ messageId: 'arbitraryColor' }, { messageId: 'arbitraryColor' }],
          output: '<div className="bg-page text-main" />',
        },
        // Modifier prefix — hover:bg-[#hex]
        {
          code: '<div className="hover:bg-[#FEF8E2]" />',
          errors: [{ messageId: 'arbitraryColor' }],
          output: '<div className="hover:bg-page" />',
        },
        // Stacked modifiers — dark:hover:text-[#hex]
        {
          code: '<div className="dark:hover:text-[#0f0e0c]" />',
          errors: [{ messageId: 'arbitraryColor' }],
          output: '<div className="dark:hover:text-main" />',
        },
        // Raw Tailwind named palette utility — exact keyword
        {
          code: '<div className="bg-white" />',
          errors: [{ messageId: 'arbitraryColor' }],
        },
        // Raw Tailwind named palette utility with opacity
        {
          code: '<div className="text-black/85" />',
          errors: [{ messageId: 'arbitraryColor' }],
        },
        // Raw Tailwind scaled palette utility
        {
          code: '<div className="border-zinc-200" />',
          errors: [{ messageId: 'arbitraryColor' }],
        },
        // Raw Tailwind scaled palette utility with modifiers and opacity
        {
          code: '<div className="dark:hover:bg-red-500/20" />',
          errors: [{ messageId: 'arbitraryColor' }],
        },
        // Style object with hex literal
        {
          code: '<div style={{ color: "#0F0E0C" }} />',
          errors: [{ messageId: 'hardcodedColorStyle' }],
        },
        // Style object with rgb
        {
          code: '<div style={{ backgroundColor: "rgb(254, 248, 226)" }} />',
          errors: [{ messageId: 'hardcodedColorStyle' }],
        },
        // Style object with named CSS color
        {
          code: '<div style={{ backgroundColor: "white" }} />',
          errors: [{ messageId: 'hardcodedColorStyle' }],
        },
        // Style object with OKLCH color
        {
          code: '<div style={{ color: "oklch(0.7 0.14 82)" }} />',
          errors: [{ messageId: 'hardcodedColorStyle' }],
        },
        {
          code: '<div style={{ color: `#0F0E0C` }} />',
          errors: [{ messageId: 'hardcodedColorStyle' }],
        },
        // Dynamic template literal on a color property — still flagged
        {
          code: '<div style={{ color: `${dynamicColor}` }} />',
          errors: [{ messageId: 'hardcodedColorStyle' }],
        },
        // backgroundImage with gradient containing hex — flagged
        {
          code: '<div style={{ backgroundImage: "linear-gradient(#fff, #000)" }} />',
          errors: [{ messageId: 'hardcodedColorStyle' }],
        },
        // SVG stopColor with hex — flagged
        {
          code: '<div style={{ stopColor: "#fff" }} />',
          errors: [{ messageId: 'hardcodedColorStyle' }],
        },
        // Raw brand primitives are not semantic
        {
          code: '<div className="bg-ink text-cream hover:bg-sun-yellow/20" />',
          errors: [{ messageId: 'arbitraryColor' }, { messageId: 'arbitraryColor' }, { messageId: 'arbitraryColor' }],
        },
        // Arbitrary color classes that wrap token vars still bypass semantic utilities
        {
          code: '<div className="bg-[var(--color-success-mint)]/20 text-[var(--color-success-mint)]" />',
          errors: [{ messageId: 'arbitraryColor' }, { messageId: 'arbitraryColor' }],
        },
      ],
    });
  });

  it('flags template-literal color values in style props', () => {
    const linter = new Linter({ configType: 'eslintrc' });
    linter.defineRule('rdna/no-hardcoded-colors', rule);
    const config = {
      parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
      rules: { 'rdna/no-hardcoded-colors': 'error' },
    };

    const messages = linter.verify('<div style={{ color: `#0F0E0C` }} />', config);
    expect(messages).toHaveLength(1);
    expect(messages[0].messageId).toBe('hardcodedColorStyle');
  });

  it('flags computed literal color style keys', () => {
    const linter = new Linter({ configType: 'eslintrc' });
    linter.defineRule('rdna/no-hardcoded-colors', rule);
    const config = {
      parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
      rules: { 'rdna/no-hardcoded-colors': 'error' },
    };

    const messages = linter.verify('<div style={{ ["color"]: `#0F0E0C` }} />', config);
    expect(messages).toHaveLength(1);
    expect(messages[0].messageId).toBe('hardcodedColorStyle');
  });

  it('flags arbitrary colors inside object-syntax class-builder calls', () => {
    const linter = new Linter({ configType: 'eslintrc' });
    linter.defineRule('rdna/no-hardcoded-colors', rule);
    const config = {
      parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
      rules: { 'rdna/no-hardcoded-colors': 'error' },
    };

    const messages = linter.verify('const c = cn({ "bg-[#FEF8E2]": active, "text-main": true });', config);
    expect(messages).toHaveLength(1);
    expect(messages[0].messageId).toBe('arbitraryColor');
  });

  it('flags raw tailwind palette colors inside object-syntax class-builder calls', () => {
    const linter = new Linter({ configType: 'eslintrc' });
    linter.defineRule('rdna/no-hardcoded-colors', rule);
    const config = {
      parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
      rules: { 'rdna/no-hardcoded-colors': 'error' },
    };

    const messages = linter.verify('const c = cn({ "bg-white": active, "text-main": true, "border-zinc-200": !active });', config);
    expect(messages).toHaveLength(2);
    expect(messages.every(message => message.messageId === 'arbitraryColor')).toBe(true);
  });

  it('flags raw tailwind palette colors in JSX className strings', () => {
    const linter = new Linter({ configType: 'eslintrc' });
    linter.defineRule('rdna/no-hardcoded-colors', rule);
    const config = {
      parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
      rules: { 'rdna/no-hardcoded-colors': 'error' },
    };

    const messages = linter.verify('<div className="bg-white text-black/85 border-zinc-200 dark:hover:bg-red-500/20" />', config);
    expect(messages).toHaveLength(4);
    expect(messages.every(message => message.messageId === 'arbitraryColor')).toBe(true);
  });

  it('flags raw brand primitives and var-wrapped color classes in class-builder calls', () => {
    const linter = new Linter({ configType: 'eslintrc' });
    linter.defineRule('rdna/no-hardcoded-colors', rule);
    const config = {
      parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
      rules: { 'rdna/no-hardcoded-colors': 'error' },
    };

    const messages = linter.verify(
      'const c = cn({ "bg-ink": active, "text-cream": active, "bg-[var(--color-success-mint)]/20": pending, "text-main": true });',
      config
    );

    expect(messages).toHaveLength(3);
    expect(messages.every(message => message.messageId === 'arbitraryColor')).toBe(true);
  });

  it('flags disallowed color utilities nested inside template-literal expressions', () => {
    const linter = new Linter({ configType: 'eslintrc' });
    linter.defineRule('rdna/no-hardcoded-colors', rule);
    const config = {
      parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
      rules: { 'rdna/no-hardcoded-colors': 'error' },
    };

    const messages = linter.verify(
      '<div className={`flex ${active ? "bg-[var(--color-success-mint)]/20 text-[var(--color-success-mint)]" : "bg-depth text-sub"}`} />',
      config
    );

    expect(messages).toHaveLength(2);
    expect(messages.every(message => message.messageId === 'arbitraryColor')).toBe(true);
  });

  it('allows semantic colors inside class-builder calls and computed tokenized style keys', () => {
    const linter = new Linter({ configType: 'eslintrc' });
    linter.defineRule('rdna/no-hardcoded-colors', rule);
    const classConfig = {
      parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
      rules: { 'rdna/no-hardcoded-colors': 'error' },
    };
    const styleConfig = {
      parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
      rules: { 'rdna/no-hardcoded-colors': 'error' },
    };

    expect(linter.verify('const c = cn({ "bg-page": active, "text-main": true });', classConfig)).toHaveLength(0);
    expect(linter.verify('<div style={{ ["color"]: "var(--color-main)" }} />', styleConfig)).toHaveLength(0);
    expect(
      linter.verify(
        '<div style={{ backgroundImage: "linear-gradient(var(--color-page), var(--color-inv))" }} />',
        styleConfig
      )
    ).toHaveLength(0);
  });
});
