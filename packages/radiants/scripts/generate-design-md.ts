import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export type CssToken = {
  name: string;
  value: string;
};

export type EslintRuleRow = {
  name: string;
  description: string;
  recommended: string;
  internals: string;
  strict: string;
};

const scriptDir = dirname(fileURLToPath(import.meta.url));
const radiantsRoot = resolve(scriptDir, '..');
const workspaceRoot = resolve(radiantsRoot, '..', '..');

const BRAND_PALETTE = [
  ['--color-cream', 'Primary warm neutral'],
  ['--color-ink', 'Primary dark tone'],
  ['--color-pure-black', 'Absolute black, reserved for deepest Moon surfaces'],
  ['--color-sun-yellow', 'Brand accent'],
  ['--color-sky-blue', 'Secondary accent and links'],
  ['--color-sunset-fuzz', 'Warm accent'],
  ['--color-sun-red', 'Error and destructive states'],
  ['--color-mint', 'Success states'],
  ['--color-pure-white', 'Warm white, reserved for hard contrast'],
] as const;

const SEMANTIC_SECTIONS = {
  surface: [
    '--color-page',
    '--color-card',
    '--color-tinted',
    '--color-inv',
    '--color-depth',
    '--color-surface-primary',
    '--color-surface-secondary',
    '--color-surface-tertiary',
    '--color-surface-elevated',
    '--color-surface-muted',
  ],
  content: [
    '--color-main',
    '--color-head',
    '--color-sub',
    '--color-mute',
    '--color-flip',
    '--color-link',
    '--color-content-primary',
    '--color-content-heading',
    '--color-content-secondary',
    '--color-content-inverted',
    '--color-content-muted',
    '--color-content-link',
  ],
  edge: [
    '--color-line',
    '--color-rule',
    '--color-line-hover',
    '--color-focus',
    '--color-edge-primary',
    '--color-edge-muted',
    '--color-edge-hover',
    '--color-edge-focus',
  ],
  action: [
    '--color-accent',
    '--color-accent-inv',
    '--color-accent-soft',
    '--color-danger',
    '--color-success',
    '--color-warning',
    '--color-action-primary',
    '--color-action-secondary',
    '--color-action-destructive',
    '--color-action-accent',
  ],
  status: [
    '--color-status-success',
    '--color-status-warning',
    '--color-status-error',
    '--color-status-info',
  ],
  overlay: [
    '--color-hover',
    '--color-active',
    '--color-hover-overlay',
    '--color-active-overlay',
    '--color-surface-overlay-subtle',
    '--color-surface-overlay-medium',
  ],
  windowChrome: ['--color-window-chrome-from', '--color-window-chrome-to'],
} as const;

const MOTION_DURATION_TOKENS = [
  '--duration-instant',
  '--duration-fast',
  '--duration-base',
  '--duration-moderate',
  '--duration-slow',
  '--duration-scalar',
] as const;

const MOTION_EASING_TOKENS = [
  '--easing-default',
  '--easing-out',
  '--easing-in',
  '--easing-spring',
] as const;

export function rewriteMarkerRegion(source: string, id: string, replacement: string): string {
  const begin = `<!-- BEGIN GENERATED:${id} -->`;
  const end = `<!-- END GENERATED:${id} -->`;
  const beginIndex = source.indexOf(begin);
  const endIndex = source.indexOf(end);

  if (beginIndex === -1 || endIndex === -1 || endIndex < beginIndex) {
    throw new Error(`Missing generated marker region: ${id}`);
  }

  const contentStart = beginIndex + begin.length;
  const normalizedReplacement = replacement.trimEnd();

  return [
    source.slice(0, contentStart),
    '\n',
    normalizedReplacement,
    '\n',
    source.slice(endIndex),
  ].join('');
}

export function extractCssTokens(css: string, namePattern: RegExp = /^--/): CssToken[] {
  const tokens: CssToken[] = [];
  const declarationPattern = /(--[a-zA-Z0-9-_]+)\s*:\s*([^;]+);/g;
  let match: RegExpExecArray | null;

  while ((match = declarationPattern.exec(css)) !== null) {
    const [, name, rawValue] = match;
    if (!namePattern.test(name)) {
      continue;
    }

    const value = rawValue
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .join(' ');

    tokens.push({ name, value });
  }

  return tokens;
}

function toMap(tokens: CssToken[]): Map<string, string> {
  const tokenMap = new Map<string, string>();

  for (const token of tokens) {
    if (!tokenMap.has(token.name)) {
      tokenMap.set(token.name, token.value);
    }
  }

  return tokenMap;
}

function escapeMarkdownCell(value: string): string {
  return value.replaceAll('|', '\\|');
}

function tokenValue(tokenMap: Map<string, string>, name: string, fallback: string): string {
  return tokenMap.has(name) ? `\`${escapeMarkdownCell(tokenMap.get(name)!)}\`` : fallback;
}

export function renderBrandPaletteTable(tokens: CssToken[]): string {
  const tokenMap = toMap(tokens);
  const rows = BRAND_PALETTE.map(([name, usage]) => {
    return `| \`${name}\` | ${tokenValue(tokenMap, name, '_(missing)_')} | ${usage} |`;
  });

  return ['| Token | Value | Usage |', '|---|---|---|', ...rows].join('\n');
}

export function renderSemanticTable(
  title: string,
  tokenNames: readonly string[],
  lightTokens: CssToken[],
  darkTokens: CssToken[],
): string {
  const lightMap = toMap(lightTokens);
  const darkMap = toMap(darkTokens);
  const rows = tokenNames
    .filter((name) => lightMap.has(name) || darkMap.has(name))
    .map((name) => {
      const sunValue = tokenValue(lightMap, name, '_(not defined in Sun)_');
      const moonValue = tokenValue(darkMap, name, sunValue);
      return `| \`${name}\` | ${sunValue} | ${moonValue} |`;
    });

  return [`#### ${title}`, '', '| Token | Sun Mode | Moon Mode |', '|---|---|---|', ...rows].join(
    '\n',
  );
}

export function renderTypographyScale(typographyCss: string): string {
  const tokens = extractCssTokens(typographyCss, /^--font-size-/).filter(
    (token) => !token.name.startsWith('--font-size-fluid-'),
  );

  const rows = tokens.map((token) => {
    const remMatch = token.value.match(/^([0-9.]+)rem$/);
    const pxValue = remMatch ? `${Math.round(Number(remMatch[1]) * 16)}px` : 'n/a';
    return `| \`${token.name}\` | \`${token.value}\` | ${pxValue} |`;
  });

  return ['| Token | Value | At 16px Root |', '|---|---|---|', ...rows].join('\n');
}

function renderTokenListTable(title: string, tokenNames: readonly string[], tokens: CssToken[]): string {
  const tokenMap = toMap(tokens);
  const rows = tokenNames
    .filter((name) => tokenMap.has(name))
    .map((name) => `| \`${name}\` | ${tokenValue(tokenMap, name, '_(missing)_')} |`);

  return [`#### ${title}`, '', '| Token | Value |', '|---|---|', ...rows].join('\n');
}

export function renderMotionTables(tokensCss: string): string {
  const tokens = extractCssTokens(tokensCss, /^--(?:duration|easing)-/);

  return [
    renderTokenListTable('Durations', MOTION_DURATION_TOKENS, tokens),
    '',
    renderTokenListTable('Easings', MOTION_EASING_TOKENS, tokens),
  ].join('\n');
}

function configSeverity(plugin: any, configName: string, ruleName: string): string {
  const config = plugin.configs?.[configName];
  const severity = config?.rules?.[`rdna/${ruleName}`];

  if (Array.isArray(severity)) {
    return String(severity[0]);
  }

  return severity ? String(severity) : '—';
}

export function extractEslintRules(plugin: any): EslintRuleRow[] {
  return Object.entries(plugin.rules ?? {})
    .map(([name, rule]) => {
      const typedRule = rule as { meta?: { docs?: { description?: string } } };
      return {
        name: `rdna/${name}`,
        description: typedRule.meta?.docs?.description ?? 'No description provided.',
        recommended: configSeverity(plugin, 'recommended', name),
        internals: configSeverity(plugin, 'internals', name),
        strict: configSeverity(plugin, 'recommended-strict', name),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function renderEslintRulesTable(rules: EslintRuleRow[]): string {
  const rows = rules.map((rule) => {
    return [
      `\`${rule.name}\``,
      escapeMarkdownCell(rule.description),
      rule.recommended,
      rule.internals,
      rule.strict,
    ].join(' | ');
  });

  return [
    '| Rule | Enforces | recommended | internals | recommended-strict |',
    '|---|---|---|---|---|',
    ...rows.map((row) => `| ${row} |`),
  ].join('\n');
}

export async function regenerate(source: string, repoRoot = workspaceRoot): Promise<string> {
  const packageRoot = resolve(repoRoot, 'packages/radiants');
  const tokensCss = readFileSync(resolve(packageRoot, 'tokens.css'), 'utf8');
  const darkCss = readFileSync(resolve(packageRoot, 'dark.css'), 'utf8');
  const typographyCss = readFileSync(
    resolve(packageRoot, 'generated/typography-tokens.css'),
    'utf8',
  );
  const eslintPluginUrl = pathToFileURL(resolve(packageRoot, 'eslint/index.mjs'));
  eslintPluginUrl.search = `t=${Date.now()}`;
  const pluginModule = await import(eslintPluginUrl.href);
  const plugin = pluginModule.default;

  const lightTokens = extractCssTokens(tokensCss, /^--color-/);
  const darkTokens = extractCssTokens(darkCss, /^--color-/);

  let next = source;
  next = rewriteMarkerRegion(next, 'color-brand-palette', renderBrandPaletteTable(lightTokens));
  next = rewriteMarkerRegion(
    next,
    'color-surface',
    renderSemanticTable('Surface Tokens', SEMANTIC_SECTIONS.surface, lightTokens, darkTokens),
  );
  next = rewriteMarkerRegion(
    next,
    'color-content',
    renderSemanticTable('Content Tokens', SEMANTIC_SECTIONS.content, lightTokens, darkTokens),
  );
  next = rewriteMarkerRegion(
    next,
    'color-edge',
    renderSemanticTable('Edge Tokens', SEMANTIC_SECTIONS.edge, lightTokens, darkTokens),
  );
  next = rewriteMarkerRegion(
    next,
    'color-action',
    renderSemanticTable('Action Tokens', SEMANTIC_SECTIONS.action, lightTokens, darkTokens),
  );
  next = rewriteMarkerRegion(
    next,
    'color-status',
    renderSemanticTable('Status Tokens', SEMANTIC_SECTIONS.status, lightTokens, darkTokens),
  );
  next = rewriteMarkerRegion(
    next,
    'color-overlay',
    renderSemanticTable('Overlay Tokens', SEMANTIC_SECTIONS.overlay, lightTokens, darkTokens),
  );
  next = rewriteMarkerRegion(
    next,
    'color-window-chrome',
    renderSemanticTable(
      'Window Chrome Tokens',
      SEMANTIC_SECTIONS.windowChrome,
      lightTokens,
      darkTokens,
    ),
  );
  next = rewriteMarkerRegion(next, 'typography-scale', renderTypographyScale(typographyCss));
  next = rewriteMarkerRegion(next, 'motion-tokens', renderMotionTables(tokensCss));
  next = rewriteMarkerRegion(
    next,
    'eslint-rules',
    renderEslintRulesTable(extractEslintRules(plugin)),
  );

  return next;
}

export async function writeDesignMd(): Promise<void> {
  const designPath = resolve(radiantsRoot, 'DESIGN.md');
  const source = readFileSync(designPath, 'utf8');
  writeFileSync(designPath, await regenerate(source), 'utf8');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  await writeDesignMd();
}
