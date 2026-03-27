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
  it('builds per-file component artifacts and thin barrels', async () => {
    const root = mkdtempSync(join(tmpdir(), 'rdna-icons-'));
    const icons16Dir = join(root, 'assets', 'icons', '16px');
    const icons24Dir = join(root, 'assets', 'icons', '24px');

    writeSvg(
      icons16Dir,
      'grid-3x3',
      '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><g id="grid-3x3"><path fill="#000000" d="M1 1H7V7H1z"/></g></svg>',
    );
    writeSvg(
      icons16Dir,
      'settings-cog',
      '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path fill="#000" d="M2 2H14V14H2z"/></svg>',
    );
    writeSvg(
      icons24Dir,
      'interface-essential-search-1',
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path fill="black" d="M1 1H23V23H1z"/></svg>',
    );

    const { buildIconArtifacts } = await import('../scripts/generate-icons.ts');
    const artifacts = await buildIconArtifacts({
      icons16Dir,
      icons24Dir,
    });

    expect(artifacts.files['generated/16/grid-3x3.tsx']).toContain(
      'export const Grid3X3',
    );
    expect(artifacts.files['generated/16/grid-3x3.tsx']).toContain(
      'fill="currentColor"',
    );
    expect(artifacts.files['generated/16/grid-3x3.tsx']).not.toContain('<g id=');

    expect(artifacts.files['generated.tsx']).toContain(
      "export { Grid3X3 } from './generated/16/grid-3x3';",
    );
    expect(artifacts.files['generated.tsx']).toContain('export const ICON_BY_NAME');
    expect(artifacts.files['generated.tsx']).not.toContain('<svg');

    expect(artifacts.files['generated-24.tsx']).toContain(
      "export { InterfaceEssentialSearch1 } from './generated/24/interface-essential-search-1';",
    );
    expect(artifacts.files['generated-24.tsx']).toContain(
      'export const ICON_24_BY_NAME',
    );
    expect(artifacts.files['generated-24.tsx']).not.toContain('<svg');
  });

  it('emits alias and importer registries for the runtime Icon wrapper', async () => {
    const root = mkdtempSync(join(tmpdir(), 'rdna-icons-'));
    const icons16Dir = join(root, 'assets', 'icons', '16px');
    const icons24Dir = join(root, 'assets', 'icons', '24px');

    writeSvg(
      icons16Dir,
      'settings-cog',
      '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path fill="#000" d="M2 2H14V14H2z"/></svg>',
    );
    writeSvg(
      icons16Dir,
      'search',
      '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path fill="#000" d="M2 2H14V14H2z"/></svg>',
    );
    writeSvg(
      icons24Dir,
      'interface-essential-search-1',
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path fill="#000" d="M1 1H23V23H1z"/></svg>',
    );

    const { buildIconArtifacts } = await import('../scripts/generate-icons.ts');
    const artifacts = await buildIconArtifacts({
      icons16Dir,
      icons24Dir,
    });

    expect(artifacts.files['generated-aliases.ts']).toContain(
      "settings: 'settings-cog'",
    );
    expect(artifacts.files['generated-importers.ts']).toContain(
      "search: () => import('./generated/16/search')",
    );
    expect(artifacts.files['generated-importers.ts']).toContain(
      "'interface-essential-search-1': () => import('./generated/24/interface-essential-search-1')",
    );
  });

  it('prunes stale generated per-file modules when source SVGs are removed', async () => {
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
