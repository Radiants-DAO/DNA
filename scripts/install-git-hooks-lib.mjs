import { isAbsolute, resolve } from "node:path";

export function getDesiredHooksPath(repoRoot) {
  return resolve(repoRoot, ".githooks");
}

function normalizeHooksPath(repoRoot, hooksPath) {
  if (!hooksPath) return null;
  return isAbsolute(hooksPath) ? hooksPath : resolve(repoRoot, hooksPath);
}

export function getHookInstallPlan({
  repoRoot,
  isGitRepo,
  currentHooksPath,
}) {
  const desiredHooksPath = getDesiredHooksPath(repoRoot);

  if (!isGitRepo) {
    return {
      shouldConfigure: false,
      desiredHooksPath,
      reason: "not_git_repo",
    };
  }

  if (normalizeHooksPath(repoRoot, currentHooksPath) === desiredHooksPath) {
    return {
      shouldConfigure: false,
      desiredHooksPath,
      reason: "already_configured",
    };
  }

  return {
    shouldConfigure: true,
    desiredHooksPath,
    reason: "configure_hooks_path",
  };
}
