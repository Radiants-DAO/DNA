import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';
import rule from '../rules/no-inline-svg-icons.mjs';

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

describe('rdna/no-inline-svg-icons', () => {
  it('passes RuleTester', () => {
    tester.run('no-inline-svg-icons', rule, {
      valid: [
        { code: 'import { Icon } from "@rdna/radiants/icons/runtime"; <Icon name="search" />' },
        { code: '<img src="/logos/rad-mark.png" alt="Radiants" />' },
        {
          code: '<svg viewBox="0 0 16 16"><path d="M0 0h1v1H0z" /></svg>',
          filename: '/repo/packages/radiants/icons/Icon.tsx',
        },
        {
          code: '<svg aria-hidden="true" width="0" height="0"><defs><filter id="tone-map" /></defs></svg>',
          filename: '/repo/apps/rad-os/components/background/MonolithWallpaper.tsx',
        },
      ],
      invalid: [
        {
          code: '<svg viewBox="0 0 16 16"><path d="M0 0h1v1H0z" /></svg>',
          errors: [{ messageId: 'inlineSvg' }],
        },
        {
          code: '<path d="M0 0h1v1H0z" />',
          errors: [{ messageId: 'rawSvgElement' }],
        },
        {
          code: '<img src="data:image/svg+xml,%3Csvg%3E%3C/svg%3E" alt="" />',
          errors: [{ messageId: 'svgDataUri' }],
        },
        {
          code: 'import { Search } from "lucide-react"; <Search />',
          errors: [{ messageId: 'bannedIconImport' }],
        },
        {
          code: 'import icon from "./icon.svg"; <img src={icon} alt="" />',
          errors: [{ messageId: 'svgImport' }],
        },
      ],
    });
  });
});
