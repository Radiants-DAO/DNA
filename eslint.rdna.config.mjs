import tseslint from 'typescript-eslint';
import unusedImports from 'eslint-plugin-unused-imports';
import rdna from './packages/radiants/eslint/index.mjs';

// The design-system scan is intentionally RDNA-focused. Some app files still carry
// inline disables for framework rules that are not part of this config; register
// no-op definitions so ESLint can parse those comments without turning the scan red.
const compatibilityPlugins = {
  'react-hooks': {
    meta: { name: 'compat-react-hooks' },
    rules: {
      'exhaustive-deps': {
        meta: {},
        create() {
          return {};
        },
      },
    },
  },
  '@next/next': {
    meta: { name: 'compat-next' },
    rules: {
      'no-img-element': {
        meta: {},
        create() {
          return {};
        },
      },
    },
  },
};

const unusedImportsPlugin = {
  'unused-imports': unusedImports,
};

export default [
  {
    ignores: [
      '**/scripts/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/generated/**',
      'apps/rad-os/lib/dotting/**',
      'apps/rad-os/app/pixel-corners/page.tsx',
    ],
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
  },
  // TypeScript + JSX parsing for all in-scope files
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
  },
  // Consuming apps — full rule set
  {
    files: [
      'apps/rad-os/**/*.{ts,tsx}',
    ],
    plugins: {
      ...compatibilityPlugins,
      ...unusedImportsPlugin,
      rdna,
    },
    rules: {
      ...rdna.configs.recommended.rules,
      'rdna/require-exception-metadata': 'error',
      'rdna/no-broad-rdna-disables': 'error',
      'unused-imports/no-unused-imports': 'warn',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
    },
  },
  // RadOS window content — ban viewport breakpoints (use container queries)
  {
    files: [
      'apps/rad-os/components/apps/**/*.{ts,tsx}',
      'apps/rad-os/components/Rad_os/**/*.{ts,tsx}',
    ],
    plugins: { rdna },
    rules: {
      'rdna/no-viewport-breakpoints-in-window-layout': 'warn',
    },
  },
  // Ctrl package — control surface primitives (same rules as radiants internals)
  {
    files: [
      'packages/ctrl/**/*.{ts,tsx}',
    ],
    plugins: {
      ...compatibilityPlugins,
      ...unusedImportsPlugin,
      rdna,
    },
    rules: {
      ...rdna.configs.internals.rules,
      'rdna/require-exception-metadata': 'error',
      'rdna/no-broad-rdna-disables': 'error',
      'rdna/no-mixed-style-authority': 'error',
      'unused-imports/no-unused-imports': 'warn',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
    },
  },
  // Pixel package — internal engine (same internals config as radiants/ctrl)
  {
    files: [
      'packages/pixel/src/**/*.{ts,tsx}',
    ],
    plugins: {
      ...compatibilityPlugins,
      ...unusedImportsPlugin,
      rdna,
    },
    rules: {
      ...rdna.configs.internals.rules,
      'rdna/require-exception-metadata': 'error',
      'rdna/no-broad-rdna-disables': 'error',
      'rdna/no-mixed-style-authority': 'error',
      'unused-imports/no-unused-imports': 'warn',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
    },
  },
  // Radiants component internals — no wrapper rule + style authority check
  {
    files: [
      'packages/radiants/components/core/**/*.{ts,tsx}',
    ],
    plugins: {
      ...compatibilityPlugins,
      ...unusedImportsPlugin,
      rdna,
    },
    rules: {
      ...rdna.configs.internals.rules,
      'rdna/require-exception-metadata': 'error',
      'rdna/no-broad-rdna-disables': 'error',
      'rdna/no-mixed-style-authority': 'error',
      'unused-imports/no-unused-imports': 'warn',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
    },
  },
  // Shared preview package — keep its source aligned with dead-code linting
  {
    files: [
      'packages/preview/src/**/*.{ts,tsx}',
    ],
    plugins: {
      ...compatibilityPlugins,
      ...unusedImportsPlugin,
    },
    rules: {
      'unused-imports/no-unused-imports': 'warn',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
    },
  },
];
