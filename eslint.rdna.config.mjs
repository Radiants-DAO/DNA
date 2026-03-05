import tseslint from 'typescript-eslint';
import rdna from './packages/radiants/eslint/index.mjs';

export default [
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
    plugins: { rdna },
    rules: {
      ...rdna.configs.recommended.rules,
    },
  },
  // Radiants component internals — no wrapper rule
  {
    files: ['packages/radiants/components/core/**/*.{ts,tsx}'],
    plugins: { rdna },
    rules: {
      ...rdna.configs.internals.rules,
    },
  },
];
