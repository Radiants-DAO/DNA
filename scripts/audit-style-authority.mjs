import fs from 'node:fs';
import path from 'node:path';

const DATA_VARIANT_SELECTOR_RE = /\[data-variant="([a-z0-9-]+)"\]/g;
const DATA_VARIANT_USAGE_RE = /data-variant\s*=\s*["']([a-z0-9-]+)["']/g;
const SEMANTIC_COLOR_UTILITY_RE = /\b(?:!|[a-z-]+:)*?(?:bg|text|border)-(?:surface|content|action|edge|status)-[a-z0-9-]+\b/;
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const IGNORE_SEGMENTS = new Set(['node_modules', '.next', '.turbo', 'dist', 'build', 'coverage']);

function isIgnoredSourceFile(filePath) {
  return (
    filePath.includes(`${path.sep}__tests__${path.sep}`) ||
    /\.test\.[cm]?[jt]sx?$/.test(filePath) ||
    /\.spec\.[cm]?[jt]sx?$/.test(filePath)
  );
}

function isCommentLine(line) {
  const trimmed = line.trim();
  return (
    trimmed.startsWith('//') ||
    trimmed.startsWith('/*') ||
    trimmed.startsWith('*') ||
    trimmed.startsWith('*/')
  );
}

function countNewlines(input, endIndex) {
  let count = 1;
  for (let i = 0; i < endIndex; i += 1) {
    if (input[i] === '\n') count += 1;
  }
  return count;
}

function uniqueEvidence(evidence) {
  const seen = new Set();
  return evidence.filter((entry) => {
    const key = `${entry.kind}:${entry.line}:${entry.detail ?? ''}:${entry.source ?? ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function collectVariantUsage(lines) {
  const usages = new Map();

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const lineNumber = index + 1;
    if (isCommentLine(line)) continue;
    let match;
    while ((match = DATA_VARIANT_USAGE_RE.exec(line)) !== null) {
      const variant = match[1];
      if (!usages.has(variant)) usages.set(variant, []);
      usages.get(variant).push(lineNumber);
    }
  }

  return usages;
}

function collectCvaColorLines(lines) {
  const findings = [];
  let inCva = false;
  let depth = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (!inCva && line.includes('cva(')) {
      inCva = true;
      depth = 0;
    }

    if (inCva) {
      const opens = (line.match(/\(/g) || []).length;
      const closes = (line.match(/\)/g) || []).length;
      depth += opens - closes;

      if (!isCommentLine(line) && SEMANTIC_COLOR_UTILITY_RE.test(line)) {
        findings.push({
          line: index + 1,
          detail: line.trim(),
        });
      }

      if (depth <= 0) {
        inCva = false;
        depth = 0;
      }
    }
  }

  return findings;
}

function collectNearbyColorLines(lines, variantLines) {
  const findings = [];
  const seen = new Set();

  for (const variantLine of variantLines) {
    const start = Math.max(0, variantLine - 11);
    const end = Math.min(lines.length - 1, variantLine + 1);
    for (let index = start; index <= end; index += 1) {
      const line = lines[index];
      if (isCommentLine(line)) continue;
      if (!SEMANTIC_COLOR_UTILITY_RE.test(line)) continue;
      const key = `${index + 1}:${line}`;
      if (seen.has(key)) continue;
      seen.add(key);
      findings.push({
        line: index + 1,
        detail: line.trim(),
      });
    }
  }

  return findings;
}

export function collectCssVariantRules(text, file) {
  const findings = [];
  let match;

  while ((match = DATA_VARIANT_SELECTOR_RE.exec(text)) !== null) {
    findings.push({
      variant: match[1],
      line: countNewlines(text, match.index),
      selector: match[0],
      file,
    });
  }

  return findings;
}

export function findMixedStyleAuthorities(text, file, cssRules) {
  const lines = text.split(/\r?\n/);
  const variantUsages = collectVariantUsage(lines);
  const cvaColorLines = collectCvaColorLines(lines);
  const findings = [];

  for (const [variant, usageLines] of variantUsages.entries()) {
    const matchingCssRules = cssRules.filter((rule) => rule.variant === variant);
    if (matchingCssRules.length === 0) continue;

    const nearbyColorLines = collectNearbyColorLines(lines, usageLines);
    const colorEvidence = [...cvaColorLines, ...nearbyColorLines];
    if (colorEvidence.length === 0) continue;

    findings.push({
      file,
      variant,
      evidence: uniqueEvidence([
        ...usageLines.map((line) => ({ kind: 'component-variant', line, detail: `data-variant="${variant}"` })),
        ...colorEvidence.map((entry) => ({ kind: 'component-color', line: entry.line, detail: entry.detail })),
        ...matchingCssRules.map((rule) => ({
          kind: 'css-variant',
          line: rule.line,
          detail: rule.selector,
          source: rule.file,
        })),
      ]),
    });
  }

  return findings;
}

function walkFiles(rootDir) {
  const files = [];

  function visit(currentPath) {
    const stats = fs.statSync(currentPath);
    if (stats.isDirectory()) {
      const baseName = path.basename(currentPath);
      if (IGNORE_SEGMENTS.has(baseName)) return;
      for (const entry of fs.readdirSync(currentPath)) {
        visit(path.join(currentPath, entry));
      }
      return;
    }

    if (!SOURCE_EXTENSIONS.has(path.extname(currentPath))) return;
    if (isIgnoredSourceFile(currentPath)) return;
    files.push(currentPath);
  }

  visit(rootDir);
  return files;
}

export function runAudit({
  repoRoot = process.cwd(),
  componentRoots = ['packages/radiants/components', 'apps'],
  cssFiles = ['packages/radiants/base.css', 'packages/radiants/dark.css'],
} = {}) {
  const absoluteCssFiles = cssFiles.map((file) => path.resolve(repoRoot, file)).filter((file) => fs.existsSync(file));
  const cssRules = absoluteCssFiles.flatMap((file) => collectCssVariantRules(fs.readFileSync(file, 'utf8'), file));

  const componentFiles = componentRoots
    .map((dir) => path.resolve(repoRoot, dir))
    .filter((dir) => fs.existsSync(dir))
    .flatMap((dir) => walkFiles(dir));

  return componentFiles.flatMap((file) =>
    findMixedStyleAuthorities(fs.readFileSync(file, 'utf8'), file, cssRules)
  );
}

export function formatFindings(findings, repoRoot = process.cwd()) {
  if (findings.length === 0) {
    return 'No mixed style authority findings.';
  }

  const lines = [`Mixed style authority findings: ${findings.length}`];

  for (const finding of findings) {
    lines.push(`- ${path.relative(repoRoot, finding.file)} [variant=${finding.variant}]`);
    for (const evidence of finding.evidence) {
      const sourcePrefix = evidence.source ? `${path.relative(repoRoot, evidence.source)}:` : '';
      lines.push(`  ${evidence.kind}:${sourcePrefix}${evidence.line} ${evidence.detail}`);
    }
  }

  return lines.join('\n');
}

function main() {
  const repoRoot = process.cwd();
  const findings = runAudit({ repoRoot });
  console.log(formatFindings(findings, repoRoot));

  if (findings.length > 0) {
    process.exitCode = 1;
  }
}

const scriptPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
const modulePath = new URL(import.meta.url).pathname;

if (scriptPath === modulePath) {
  main();
}
