import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('README points to archived conversion guide paths', () => {
  const readme = read('README.md');

  assert.match(readme, /docs\/archive\/dna-conversion\.md/);
  assert.doesNotMatch(readme, /docs\/dna-conversion\.md/);
});

test('active docs do not point to deleted in-repo cleanup artifacts', () => {
  const files = [
    'docs/solutions/integration-issues/base-ui-overlay-portal-migration.md',
    'docs/solutions/tooling/visual-regression-workflow-component-migration.md',
    'tools/flow/docs/brainstorms/2026-02-02-flow-2-phase-3-brainstorm.md',
    'tools/flow/docs/brainstorms/2026-02-06-flow-phase1-visbug-port-brainstorm.md',
    'tools/flow/docs/plans/2026-02-06-flow-phase1-visbug-port.md',
  ];

  for (const file of files) {
    const contents = read(file);
    assert.doesNotMatch(
      contents,
      /docs\/plans\/2026-03-05-radiants-base-ui-internal-primitive-swap\.md|reference\/ProjectVisBug-main\/|tools\/flow\/reference\/ProjectVisBug-main/
    );
  }
});

test('LandFinder auction property dataset exists and has usable records', () => {
  const filePath = path.join(
    repoRoot,
    'apps/rad-os/lib/mockData/auction-properties.json'
  );

  assert.equal(fs.existsSync(filePath), true);

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  assert.ok(Array.isArray(data));
  assert.ok(data.length >= 3);

  for (const property of data) {
    assert.equal(typeof property.id, 'string');
    assert.equal(typeof property.apn, 'string');
    assert.equal(typeof property.address, 'string');
    assert.equal(typeof property.city, 'string');
    assert.equal(typeof property.openingBid, 'number');
    assert.ok(
      ['improved', 'unimproved', 'timeshare', 'unknown'].includes(property.auctionType)
    );
  }
});

test('rad-os package does not keep xlsx after removing auction parsing tooling', () => {
  const packageJson = JSON.parse(read('apps/rad-os/package.json'));
  assert.equal('xlsx' in (packageJson.dependencies ?? {}), false);
});
