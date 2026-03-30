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
import noRawShadow from './rules/no-raw-shadow.mjs';
import noHardcodedMotion from './rules/no-hardcoded-motion.mjs';
import noViewportBreakpointsInWindowLayout from './rules/no-viewport-breakpoints-in-window-layout.mjs';
import requireExceptionMetadata from './rules/require-exception-metadata.mjs';
import noMixedStyleAuthority from './rules/no-mixed-style-authority.mjs';
import noBroadRdnaDisables from './rules/no-broad-rdna-disables.mjs';
import noClippedShadow from './rules/no-clipped-shadow.mjs';
import noPixelBorder from './rules/no-pixel-border.mjs';
import noRawLineHeight from './rules/no-raw-line-height.mjs';
import noRawFontFamily from './rules/no-raw-font-family.mjs';
import noPatternColorOverride from './rules/no-pattern-color-override.mjs';

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
    'no-raw-shadow': noRawShadow,
    'no-hardcoded-motion': noHardcodedMotion,
    'no-viewport-breakpoints-in-window-layout': noViewportBreakpointsInWindowLayout,
    'require-exception-metadata': requireExceptionMetadata,
    'no-mixed-style-authority': noMixedStyleAuthority,
    'no-broad-rdna-disables': noBroadRdnaDisables,
    'no-clipped-shadow': noClippedShadow,
    'no-pixel-border': noPixelBorder,
    'no-raw-line-height': noRawLineHeight,
    'no-raw-font-family': noRawFontFamily,
    'no-pattern-color-override': noPatternColorOverride,
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
    'rdna/no-raw-shadow': 'warn',
    'rdna/no-hardcoded-motion': 'warn',
    'rdna/no-clipped-shadow': 'warn',
    'rdna/no-pixel-border': 'warn',
    'rdna/no-raw-line-height': 'warn',
    'rdna/no-raw-font-family': 'warn',
    'rdna/no-pattern-color-override': 'warn',
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
    'rdna/no-raw-shadow': 'warn',
    'rdna/no-hardcoded-motion': 'warn',
    'rdna/no-clipped-shadow': 'warn',
    'rdna/no-pixel-border': 'warn',
    'rdna/no-raw-line-height': 'warn',
    'rdna/no-raw-font-family': 'warn',
    'rdna/no-pattern-color-override': 'warn',
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
    'rdna/no-raw-shadow': 'error',
    'rdna/no-hardcoded-motion': 'error',
    'rdna/no-clipped-shadow': 'error',
    'rdna/no-pixel-border': 'error',
    'rdna/no-raw-line-height': 'error',
    'rdna/no-raw-font-family': 'error',
    'rdna/no-pattern-color-override': 'error',
    // no-viewport-breakpoints-in-window-layout is intentionally excluded —
    // it is RadOS-specific and must be scoped via eslint.rdna.config.mjs
  },
};

export default plugin;
