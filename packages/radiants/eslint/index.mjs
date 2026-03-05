/**
 * eslint-plugin-rdna
 * Design system enforcement for @rdna/radiants.
 *
 * Usage in flat config:
 *   import rdna from '@rdna/radiants/eslint';
 *   export default [{ plugins: { rdna }, rules: { ...rdna.configs.recommended.rules } }];
 */

import noHardcodedColors from './rules/no-hardcoded-colors.mjs';
import noHardcodedTypography from './rules/no-hardcoded-typography.mjs';

const plugin = {
  meta: {
    name: 'eslint-plugin-rdna',
    version: '0.1.0',
  },
  rules: {
    'no-hardcoded-colors': noHardcodedColors,
    'no-hardcoded-typography': noHardcodedTypography,
  },
  configs: {},
};

// Configs reference the plugin itself for flat-config compatibility.
// Configs only list rules that are registered above.
// New rules are added to configs as they are implemented.
plugin.configs.recommended = {
  plugins: { rdna: plugin },
  rules: {
    'rdna/no-hardcoded-colors': 'warn',
    'rdna/no-hardcoded-typography': 'warn',
  },
};

plugin.configs.internals = {
  plugins: { rdna: plugin },
  rules: {
    'rdna/no-hardcoded-colors': 'warn',
    'rdna/no-hardcoded-typography': 'warn',
  },
};

// Strict configs — flip after warn-mode migration is complete
plugin.configs['recommended-strict'] = {
  plugins: { rdna: plugin },
  rules: {
    'rdna/no-hardcoded-colors': 'error',
    'rdna/no-hardcoded-typography': 'error',
  },
};

export default plugin;
