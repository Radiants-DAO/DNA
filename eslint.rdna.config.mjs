import rdna from './packages/radiants/eslint/index.mjs';

export default [
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
