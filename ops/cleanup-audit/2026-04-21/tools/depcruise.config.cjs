/**
 * Ephemeral dependency-cruiser config for the 2026-04-21 cleanup audit.
 * Strict defaults: cycles, orphans, cross-package deep imports, dev-dep leakage.
 * Audit-only; not wired into CI.
 */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Circular dependency detected',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-orphans',
      severity: 'warn',
      comment: 'Orphan module (no importers; likely dead or misplaced)',
      from: {
        orphan: true,
        pathNot: [
          '(^|/)\\.[^/]+\\.(js|cjs|mjs|ts|json)$',
          '\\.d\\.ts$',
          '(^|/)tsconfig\\.json$',
          '(^|/)(babel|metro|jest|karma|webpack|rollup|vite|playwright|knip|eslint|postcss|tailwind|prettier|next|turbo)\\.config\\.(js|cjs|mjs|ts)$',
          '\\.(test|spec)\\.(js|mjs|cjs|ts|tsx)$',
          '(^|/)__tests__/',
          '(^|/)(stories|__stories__)/',
          '\\.(stories|story)\\.(js|ts|jsx|tsx)$',
          '(^|/)scripts/',
          '(^|/)generated/',
          '(^|/)icons/manifest\\.ts$',
          '(^|/)\\.meta\\.ts$',
          '(^|/)(app|pages)/.*page\\.(ts|tsx)$',
          '(^|/)(app|pages)/.*layout\\.(ts|tsx)$',
          '(^|/)(app|pages)/.*route\\.(ts|tsx)$',
        ],
      },
      to: {},
    },
    {
      name: 'no-deprecated-core',
      severity: 'warn',
      comment: 'Deprecated Node core (punycode, sys, etc.)',
      from: {},
      to: {
        dependencyTypes: ['core'],
        path: ['^(v8/tools/codemap)$', '^(v8/tools/consarray)$', '^(v8/tools/csvparser)$', '^(v8/tools/logreader)$', '^(v8/tools/profile_view)$', '^(v8/tools/profile)$', '^(v8/tools/SourceMap)$', '^(v8/tools/splaytree)$', '^(v8/tools/tickprocessor-driver)$', '^(v8/tools/tickprocessor)$', '^(node-inspect/lib/_inspect)$', '^(node-inspect/lib/internal/inspect_client)$', '^(node-inspect/lib/internal/inspect_repl)$', '^(async_hooks)$', '^(punycode)$', '^(domain)$', '^(constants)$', '^(sys)$', '^(_linklist)$', '^(_stream_wrap)$'],
      },
    },
    {
      name: 'not-to-dev-dep',
      severity: 'error',
      comment: 'Production code depends on devDependencies',
      from: { path: '^(apps|packages)', pathNot: '\\.(spec|test)\\.(js|mjs|cjs|ts|tsx)$|^(apps|packages)/[^/]+/(scripts|tests|__tests__|__mocks__|fixtures)/' },
      to: { dependencyTypes: ['npm-dev'] },
    },
    {
      name: 'no-duplicate-dep-types',
      severity: 'warn',
      comment: 'Same dep listed in multiple package.json types',
      from: {},
      to: { moreThanOneDependencyType: true, dependencyTypesNot: ['type-only'] },
    },
    {
      name: 'not-to-unresolvable',
      severity: 'error',
      comment: 'Import cannot be resolved',
      from: {},
      to: { couldNotResolve: true },
    },
    {
      name: 'not-to-test',
      severity: 'error',
      comment: 'Production code importing a test/spec file',
      from: { pathNot: '\\.(spec|test)\\.(js|mjs|cjs|ts|tsx)$' },
      to: { path: '\\.(spec|test)\\.(js|mjs|cjs|ts|tsx)$' },
    },
    {
      name: 'deep-import-into-package',
      severity: 'warn',
      comment: 'Cross-package deep import (bypasses entry point)',
      from: { path: '^(apps|packages)/([^/]+)' },
      to: {
        path: '^(apps|packages)/([^/]+)/(src|lib|components|controls|registry|generated|icons)/',
        pathNot: '^(apps|packages)/$1/',
      },
    },
  ],
  options: {
    tsPreCompilationDeps: true,
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '(^|/)(node_modules|archive|\\.next|\\.turbo|dist|build|coverage|\\.code-review-graph|\\.playwright-mcp|\\.agents|\\.claude|\\.codex|\\.github|\\.githooks|references|fonts|docs|ideas|ops|templates/rados-app-prototype)/' },
    tsPreCompilationDeps: false,
    combinedDependencies: true,
    externalModuleResolutionStrategy: 'node_modules',
    moduleSystems: ['es6', 'cjs'],
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      mainFields: ['module', 'main', 'types', 'typings'],
    },
    reporterOptions: {
      text: { highlightFocused: true },
      dot: { collapsePattern: 'node_modules/[^/]+|(^|/)(src|lib|components|registry|scripts|generated)/' },
    },
  },
};
