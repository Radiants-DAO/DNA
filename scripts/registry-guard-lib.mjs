import { resolve } from "node:path";

export const REGISTRY_RELEVANT_PATHS = [
  "packages/radiants/components/core/",
  "packages/radiants/registry/",
  "packages/radiants/meta/",
  "packages/radiants/schemas/",
  "tools/playground/",
  "apps/rad-os/components/ui/DesignSystemTab.tsx",
];

export function normalizeRepoPath(filePath) {
  return filePath.replace(/\\/g, "/").replace(/^\.\//, "");
}

export function isRegistryRelevantPath(filePath) {
  const normalized = normalizeRepoPath(filePath);
  return REGISTRY_RELEVANT_PATHS.some((candidate) =>
    candidate.endsWith("/")
      ? normalized.startsWith(candidate)
      : normalized === candidate,
  );
}

export function shouldRunRegistryGuard(paths = []) {
  return paths.some(isRegistryRelevantPath);
}

export function shouldSkipPackageGuard(env = process.env) {
  return env.RDNA_REGISTRY_GUARD_SKIP_PACKAGE === "1";
}

export function getRegistryPlan(mode, changedPaths = []) {
  switch (mode) {
    case "pre-commit":
      return shouldRunRegistryGuard(changedPaths)
        ? {
            run: true,
            command: ["pnpm", "registry:check:fast"],
            reason: "staged_registry_changes",
          }
        : {
            run: false,
            command: null,
            reason: "no_registry_changes",
          };
    case "pre-dev":
      return {
        run: true,
        command: ["pnpm", "--filter", "@rdna/playground", "registry:generate"],
        reason: "dev_start",
      };
    case "pre-build":
      return {
        run: true,
        command: ["pnpm", "registry:check:full"],
        reason: "build_start",
      };
    case "pre-push":
      return {
        run: true,
        command: ["pnpm", "registry:check:full"],
        reason: "push_gate",
      };
    case "ci":
      return {
        run: true,
        command: ["pnpm", "registry:check:full"],
        reason: "ci_gate",
      };
    case "post-checkout":
    case "post-merge":
      return shouldRunRegistryGuard(changedPaths)
        ? {
            run: true,
            command: ["pnpm", "registry:generate"],
            reason: "branch_sync",
          }
        : {
            run: false,
            command: null,
            reason: "no_registry_changes",
          };
    default:
      throw new Error(`Unsupported registry guard mode: ${mode}`);
  }
}

export function getRepoRootFromScript(scriptUrl) {
  return resolve(new URL("..", scriptUrl).pathname);
}
