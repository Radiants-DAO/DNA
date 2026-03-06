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
import noRemovedAliases from './rules/no-removed-aliases.mjs';
import noHardcodedSpacing from './rules/no-hardcoded-spacing.mjs';
import preferRdnaComponents from './rules/prefer-rdna-components.mjs';
import noRawRadius from './rules/no-raw-radius.mjs';

const plugin = {
  meta: {
    name: 'eslint-plugin-rdna',
    version: '0.1.0',
  },
  rules: {
    'no-hardcoded-colors': noHardcodedColors,
    'no-hardcoded-typography': noHardcodedTypography,
    'no-removed-aliases': noRemovedAliases,
    'no-hardcoded-spacing': noHardcodedSpacing,
    'prefer-rdna-components': preferRdnaComponents,
    'no-raw-radius': noRawRadius,
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
    'rdna/no-removed-aliases': 'warn',
    'rdna/no-hardcoded-spacing': 'warn',
    'rdna/prefer-rdna-components': 'warn',
    'rdna/no-raw-radius': 'warn',
  },
};

plugin.configs.internals = {
  plugins: { rdna: plugin },
  rules: {
    'rdna/no-hardcoded-colors': 'warn',
    'rdna/no-hardcoded-typography': 'warn',
    'rdna/no-removed-aliases': 'warn',
    'rdna/no-hardcoded-spacing': 'warn',
    'rdna/prefer-rdna-components': 'off',
    'rdna/no-raw-radius': 'warn',
  },
};

// Strict configs — flip after warn-mode migration is complete
plugin.configs['recommended-strict'] = {
  plugins: { rdna: plugin },
  rules: {
    'rdna/no-hardcoded-colors': 'error',
    'rdna/no-hardcoded-typography': 'error',
    'rdna/no-removed-aliases': 'error',
    'rdna/no-hardcoded-spacing': 'error',
    'rdna/prefer-rdna-components': 'error',
    'rdna/no-raw-radius': 'error',
  },
};

export default plugin;
