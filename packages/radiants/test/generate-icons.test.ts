import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

function writeSvg(dir: string, name: string, svg: string) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${name}.svg`), svg);
}

describe('generate-icons', () => {
  it('builds one prepared manifest with aliases, set availability, importer keys, and preferred names', async () => {
    const root = mkdtempSync(join(tmpdir(), 'rdna-icons-'));
    const icons16Dir = join(root, 'assets', 'icons', '16px');
    const icons24Dir = join(root, 'assets', 'icons', '24px');

    writeSvg(
      icons16Dir,
      'search',
      '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path fill="#000" d="M2 2H14V14H2z"/></svg>',
    );
    writeSvg(
      icons16Dir,
      'settings-cog',
      '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path fill="#000" d="M3 3H13V13H3z"/></svg>',
    );
    writeSvg(
      icons16Dir,
      'chevron-left',
      '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path fill="#000" d="M1 8L9 1V15z"/></svg>',
    );
    writeSvg(
      icons24Dir,
      'interface-essential-search-1',
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path fill="#000" d="M1 1H23V23H1z"/></svg>',
    );
    writeSvg(
      icons24Dir,
      'interface-essential-setting-cog',
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path fill="#000" d="M2 2H22V22H2z"/></svg>',
    );
    writeSvg(
      icons24Dir,
      'interface-essential-eraser',
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path fill="#000" d="M4 4H20V20H4z"/></svg>',
    );

    const { buildIconArtifacts } = await import('../scripts/generate-icons.ts');
    const artifacts = await buildIconArtifacts({
      icons16Dir,
      icons24Dir,
    });
    const manifest = artifacts.files['manifest.ts'];

    expect(manifest).toContain(
      'export const SVG_ICON_MANIFEST: readonly PreparedSvgIcon[] = [',
    );
    expect(manifest).toContain("name: 'search'");
    expect(manifest).toContain("aliases: ['interface-essential-search-1']");
    expect(manifest).toContain('availableSets: [16, 24]');
    expect(manifest).toContain('importerKeys: { 16: \'16px/search\', 24: \'24px/interface-essential-search-1\' }');
    expect(manifest).toContain("preferredSmallName: 'search'");
    expect(manifest).toContain(
      "preferredLargeName: 'interface-essential-search-1'",
    );
    expect(manifest).toContain("name: 'chevron-left'");
    expect(manifest).toContain("importerKeys: { 16: '16px/chevron-left' }");
    expect(manifest).toContain("name: 'interface-essential-eraser'");
    expect(manifest).toContain('availableSets: [24]');
    expect(manifest).toContain(
      "importerKeys: { 24: '24px/interface-essential-eraser' }",
    );
    expect(manifest).toContain("'settings': 'settings-cog'");
    expect(artifacts.files['generated-aliases.ts']).toContain(
      "export { ICON_ALIASES } from './manifest';",
    );
    expect(artifacts.files['generated-importers.ts']).toContain(
      "'16px/search': () => Promise.resolve({ default: createSvgIcon(",
    );
    expect(artifacts.files['generated-importers.ts']).toContain(
      "'24px/interface-essential-search-1': () => Promise.resolve({ default: createSvgIcon(",
    );
  });

  it('prunes stale generated modules when source SVGs are removed', async () => {
    const root = mkdtempSync(join(tmpdir(), 'rdna-icons-'));
    const icons16Dir = join(root, 'assets', 'icons', '16px');
    const icons24Dir = join(root, 'assets', 'icons', '24px');
    const outputDir = join(root, 'icons');
    const staleFile = join(outputDir, 'generated', '16', 'stale-icon.tsx');

    writeSvg(
      icons16Dir,
      'search',
      '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path fill="#000" d="M2 2H14V14H2z"/></svg>',
    );
    mkdirSync(join(outputDir, 'generated', '16'), { recursive: true });
    writeFileSync(staleFile, 'stale');

    const { writeIconArtifacts } = await import('../scripts/generate-icons.ts');
    const result = await writeIconArtifacts(outputDir, {
      icons16Dir,
      icons24Dir,
    });

    expect(result.removed).toContain('generated/16/stale-icon.tsx');
    expect(existsSync(staleFile)).toBe(false);
  });
});
