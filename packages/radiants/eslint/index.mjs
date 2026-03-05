/**
 * eslint-plugin-rdna
 * Design system enforcement for @rdna/radiants.
 *
 * Usage in flat config:
 *   import rdna from '@rdna/radiants/eslint';
 *   export default [{ plugins: { rdna }, rules: { ...rdna.configs.recommended.rules } }];
 */

// Rules are imported as they're implemented.
// Placeholder structure — each task below adds its rule import.

const plugin = {
  meta: {
    name: 'eslint-plugin-rdna',
    version: '0.1.0',
  },
  rules: {},
  configs: {},
};

// Configs reference the plugin itself for flat-config compatibility.
plugin.configs.recommended = {
  plugins: { rdna: plugin },
  rules: {
    'rdna/no-hardcoded-colors': 'warn',
    'rdna/no-hardcoded-spacing': 'warn',
    'rdna/no-hardcoded-typography': 'warn',
    'rdna/prefer-rdna-components': 'warn',
    'rdna/no-removed-aliases': 'warn',
  },
};

plugin.configs.internals = {
  plugins: { rdna: plugin },
  rules: {
    'rdna/no-hardcoded-colors': 'warn',
    'rdna/no-hardcoded-spacing': 'warn',
    'rdna/no-hardcoded-typography': 'warn',
    'rdna/prefer-rdna-components': 'off',
    'rdna/no-removed-aliases': 'warn',
  },
};

// Strict configs — flip after warn-mode migration is complete
plugin.configs['recommended-strict'] = {
  plugins: { rdna: plugin },
  rules: {
    'rdna/no-hardcoded-colors': 'error',
    'rdna/no-hardcoded-spacing': 'error',
    'rdna/no-hardcoded-typography': 'error',
    'rdna/prefer-rdna-components': 'error',
    'rdna/no-removed-aliases': 'error',
  },
};

export default plugin;
