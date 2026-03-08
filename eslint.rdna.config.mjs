import tseslint from 'typescript-eslint';
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

export default [
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
    ignores: [
      '**/scripts/**',
    ],
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
      'apps/radiator/**/*.{ts,tsx}',
    ],
    plugins: {
      ...compatibilityPlugins,
      rdna,
    },
    rules: {
      ...rdna.configs.recommended.rules,
      'rdna/require-exception-metadata': 'error',
      'rdna/no-broad-rdna-disables': 'error',
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
  // Radiants component internals — no wrapper rule + style authority check
  {
    files: ['packages/radiants/components/core/**/*.{ts,tsx}'],
    plugins: {
      ...compatibilityPlugins,
      rdna,
    },
    rules: {
      ...rdna.configs.internals.rules,
      'rdna/require-exception-metadata': 'error',
      'rdna/no-broad-rdna-disables': 'error',
      'rdna/no-mixed-style-authority': ['error', {
        themeVariants: [
          'primary', 'secondary', 'outline', 'ghost', 'destructive',
          'select', 'switch', 'accordion',
        ],
      }],
    },
  },
];
