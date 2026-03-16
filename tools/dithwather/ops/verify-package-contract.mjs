import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { execFileSync } from 'node:child_process'

const rootDir = resolve(new URL('..', import.meta.url).pathname)

const packages = [
  { name: '@rdna/dithwather-core', dir: resolve(rootDir, 'packages/core') },
  { name: '@rdna/dithwather-react', dir: resolve(rootDir, 'packages/react') },
]

function fail(message) {
  throw new Error(message)
}

function parseJson(text, label) {
  try {
    return JSON.parse(text)
  } catch (error) {
    fail(`Failed to parse ${label}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

function assertEsmManifest(manifest, label) {
  if (manifest.main !== undefined) fail(`${label} should not define "main"`)
  if (manifest.module !== undefined) fail(`${label} should not define "module"`)

  const rootExport = manifest.exports?.['.']
  if (!rootExport || typeof rootExport !== 'object') {
    fail(`${label} must define exports["."]`)
  }
  if (rootExport.require !== undefined) fail(`${label} should not expose a CommonJS "require" entry`)
  if (rootExport.import !== undefined) fail(`${label} should not expose a separate "import" entry`)
  if (rootExport.default !== './dist/index.js') {
    fail(`${label} should expose "./dist/index.js" as exports["."].default`)
  }
  if (rootExport.types !== './dist/index.d.ts') {
    fail(`${label} should expose "./dist/index.d.ts" as exports["."].types`)
  }
}

function listTarEntries(tarballPath) {
  return execFileSync('tar', ['-tf', tarballPath], { encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean)
}

function readTarManifest(tarballPath) {
  const raw = execFileSync('tar', ['-xOf', tarballPath, 'package/package.json'], {
    encoding: 'utf8',
  })
  return parseJson(raw, `${tarballPath} package.json`)
}

for (const pkg of packages) {
  const sourceManifest = parseJson(
    readFileSync(join(pkg.dir, 'package.json'), 'utf8'),
    `${pkg.name} source package.json`
  )
  assertEsmManifest(sourceManifest, `${pkg.name} source manifest`)

  const tmpPackDir = mkdtempSync(join(tmpdir(), 'dithwather-pack-'))

  try {
    execFileSync('pnpm', ['pack', '--pack-destination', tmpPackDir], {
      cwd: pkg.dir,
      encoding: 'utf8',
      stdio: 'pipe',
    })

    const tarballPath = join(tmpPackDir, `rdna-${pkg.name.split('/')[1].replace(/@/g, '').replace(/\//g, '-')}-${sourceManifest.version}.tgz`)
    const tarEntries = listTarEntries(tarballPath)
    const packedManifest = readTarManifest(tarballPath)

    assertEsmManifest(packedManifest, `${pkg.name} packed manifest`)

    if (!tarEntries.includes('package/dist/index.js')) {
      fail(`${pkg.name} tarball is missing dist/index.js`)
    }
    if (!tarEntries.includes('package/dist/index.d.ts')) {
      fail(`${pkg.name} tarball is missing dist/index.d.ts`)
    }
    if (tarEntries.includes('package/dist/index.cjs')) {
      fail(`${pkg.name} tarball should not include dist/index.cjs`)
    }
    if (tarEntries.includes('package/dist/index.d.cts')) {
      fail(`${pkg.name} tarball should not include dist/index.d.cts`)
    }
  } finally {
    rmSync(tmpPackDir, { recursive: true, force: true })
  }
}

console.log('Package contract OK')
