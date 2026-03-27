import { describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { scaffoldProject } from '../scaffold';

describe('scaffoldProject', () => {
  it('writes a standalone app with local Radiants dependency during workspace simulation', async () => {
    const outDir = mkdtempSync(join(tmpdir(), 'rdna-create-'));

    await scaffoldProject({
      appName: 'motion-lab',
      outDir,
      radiantsSource: 'workspace',
      radiantsPath: '/Users/rivermassey/Desktop/dev/DNA-app-template/packages/radiants'
    });

    expect(existsSync(resolve(outDir, 'components/AppWindow.tsx'))).toBe(true);
    expect(existsSync(resolve(outDir, 'lib/controlSurface.ts'))).toBe(true);
    expect(existsSync(resolve(outDir, 'tsconfig.tsbuildinfo'))).toBe(false);

    const pkg = readFileSync(resolve(outDir, 'package.json'), 'utf8');
    expect(pkg).toContain('"name": "motion-lab"');
    expect(pkg).toContain(
      '"@rdna/radiants": "file:/Users/rivermassey/Desktop/dev/DNA-app-template/packages/radiants"'
    );
  });
});
