import { resolve, relative, isAbsolute, sep } from "node:path";

/**
 * Error thrown when a path traversal attempt is detected.
 */
export class PathTraversalError extends Error {
  constructor(public readonly requestedPath: string, public readonly root: string) {
    super(`Path traversal detected: "${requestedPath}" escapes root "${root}"`);
    this.name = "PathTraversalError";
  }
}

/**
 * Resolves a path within a root directory, ensuring the result stays within root.
 * Prevents path traversal attacks via ../ or absolute paths.
 *
 * @param root - The root directory that paths must stay within
 * @param requestedPath - The path to resolve (relative or absolute)
 * @returns The resolved absolute path if valid
 * @throws PathTraversalError if the resolved path escapes root
 */
export function resolveWithinRoot(root: string, requestedPath: string): string {
  // Normalize root to absolute path
  const normalizedRoot = resolve(root);

  // If path is absolute, check if it's within root
  if (isAbsolute(requestedPath)) {
    const normalizedPath = resolve(requestedPath);
    if (!isWithinRoot(normalizedRoot, normalizedPath)) {
      throw new PathTraversalError(requestedPath, root);
    }
    return normalizedPath;
  }

  // Resolve relative path against root
  const resolvedPath = resolve(normalizedRoot, requestedPath);

  // Check if result is still within root
  if (!isWithinRoot(normalizedRoot, resolvedPath)) {
    throw new PathTraversalError(requestedPath, root);
  }

  return resolvedPath;
}

/**
 * Checks if a path is within a root directory without throwing.
 *
 * @param root - The root directory
 * @param targetPath - The path to check (must be absolute)
 * @returns true if targetPath is within root, false otherwise
 */
export function isWithinRoot(root: string, targetPath: string): boolean {
  const normalizedRoot = resolve(root);
  const normalizedTarget = resolve(targetPath);

  // Ensure root ends with separator for accurate prefix matching
  // Use path.sep for cross-platform compatibility (/ on Unix, \ on Windows)
  const rootWithSep = normalizedRoot.endsWith(sep) ? normalizedRoot : normalizedRoot + sep;

  // Path is within root if:
  // 1. It equals root exactly, or
  // 2. It starts with root + separator
  return normalizedTarget === normalizedRoot || normalizedTarget.startsWith(rootWithSep);
}

/**
 * Validates that a file path (possibly from external input) is safe to use.
 * Returns the path relative to root if valid.
 *
 * @param root - The root directory
 * @param filePath - The file path to validate
 * @returns The relative path from root
 * @throws PathTraversalError if path escapes root
 */
export function validateAndRelativize(root: string, filePath: string): string {
  const resolved = resolveWithinRoot(root, filePath);
  return relative(resolve(root), resolved);
}
