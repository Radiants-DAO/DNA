import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import plugin from '../index.mjs';

const rulesDir = path.resolve(import.meta.dirname, '../rules');

describe('eslint-plugin-rdna plugin shape', () => {
  const ruleFiles = fs.readdirSync(rulesDir)
    .filter(f => f.endsWith('.mjs') && !f.startsWith('_'))
    .map(f => f.replace('.mjs', ''));

  const exportedRuleNames = Object.keys(plugin.rules);

  it('exports every rule file', () => {
    for (const file of ruleFiles) {
      expect(exportedRuleNames, `Rule file "${file}.mjs" is not exported from plugin.rules`).toContain(file);
    }
  });

  it('does not export phantom rules without a file', () => {
    for (const name of exportedRuleNames) {
      expect(ruleFiles, `Exported rule "${name}" has no matching file`).toContain(name);
    }
  });

  // Rules that should be in recommended (consumer apps)
  const recommendedRules = [
    'no-hardcoded-colors',
    'no-hardcoded-typography',
    'no-removed-aliases',
    'no-hardcoded-spacing',
    'prefer-rdna-components',
    'no-raw-radius',
    'no-raw-shadow',
    'no-hardcoded-motion',
  ];

  it('recommended config includes all expected rules', () => {
    const configRules = Object.keys(plugin.configs.recommended.rules);
    for (const rule of recommendedRules) {
      expect(configRules, `Missing "rdna/${rule}" in recommended config`).toContain(`rdna/${rule}`);
    }
  });

  it('recommended config does not include scope-specific rules', () => {
    const configRules = Object.keys(plugin.configs.recommended.rules);
    expect(configRules).not.toContain('rdna/no-viewport-breakpoints-in-window-layout');
    expect(configRules).not.toContain('rdna/no-mixed-style-authority');
    expect(configRules).not.toContain('rdna/require-exception-metadata');
  });

  // Rules in internals (core component authoring)
  it('internals config has prefer-rdna-components off', () => {
    expect(plugin.configs.internals.rules['rdna/prefer-rdna-components']).toBe('off');
  });

  it('internals config includes token rules', () => {
    const configRules = Object.keys(plugin.configs.internals.rules);
    expect(configRules).toContain('rdna/no-hardcoded-colors');
    expect(configRules).toContain('rdna/no-raw-radius');
    expect(configRules).toContain('rdna/no-raw-shadow');
    expect(configRules).toContain('rdna/no-hardcoded-motion');
    expect(configRules).not.toContain('rdna/require-exception-metadata');
  });

  it('recommended-strict mirrors recommended at error severity', () => {
    const strictRules = plugin.configs['recommended-strict'].rules;
    for (const rule of recommendedRules) {
      const key = `rdna/${rule}`;
      expect(strictRules[key], `${key} should be "error" in recommended-strict`).toBe('error');
    }
  });

  it('all configs reference the plugin itself', () => {
    for (const [name, config] of Object.entries(plugin.configs)) {
      expect(config.plugins.rdna, `Config "${name}" should reference the plugin`).toBe(plugin);
    }
  });
});
