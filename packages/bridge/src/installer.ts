/**
 * RadFlow Bridge Installer
 *
 * Utility functions for installing the RadFlow bridge into a Next.js project.
 * Called by the RadFlow First-Run Wizard (fn-5.7) or programmatically.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface InstallResult {
  success: boolean;
  healthEndpointPath: string | null;
  routerType: 'app' | 'pages' | null;
  skipped?: boolean;      // True if already installed and not forced
  backedUp?: string;      // Path to backup if force overwrote existing
  error?: string;
}

export interface InstallOptions {
  /**
   * If true, overwrite existing health endpoint file.
   * If false (default), skip installation if file exists.
   */
  force?: boolean;
}

/**
 * Health endpoint template for App Router.
 * Written to: app/api/radflow/health/route.ts
 */
const HEALTH_ROUTE_APP = `/**
 * RadFlow Health Endpoint - App Router
 *
 * This file is automatically created by RadFlow in the target project at:
 * app/api/radflow/health/route.ts
 *
 * DO NOT EDIT - This file is managed by RadFlow
 *
 * Features:
 * - Theme discovery via radflow.config.json (walks up from cwd)
 * - Legacy fallback for projects without manifest
 * - Reports all apps from manifest for app switcher UI
 */

import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

// Ensure Node.js runtime for filesystem access
export const runtime = 'nodejs';

// Prevent static optimization so we always get fresh data
export const dynamic = 'force-dynamic';

// ============================================================================
// Types (inlined to avoid import issues in target projects)
// ============================================================================

interface RadflowConfig {
  version: '1';
  theme: {
    name: string;
    displayName: string;
  };
  apps: Array<{
    name: string;
    displayName: string;
    path: string;
    port: number;
  }>;
}

interface HealthResponse {
  ok: true;
  version: string;
  timestamp: number;
  theme?: {
    name: string;
    displayName: string;
    root: string;
  };
  app?: {
    name: string;
    displayName: string;
    path: string;
  };
  apps?: Array<{
    name: string;
    displayName: string;
    port: number;
  }>;
  project?: string;
}

// ============================================================================
// Discovery Functions
// ============================================================================

/**
 * Walk up directory tree looking for radflow.config.json
 * Returns config + theme root path, or null if not found
 */
function findRadflowConfig(): { config: RadflowConfig; root: string } | null {
  let current = process.cwd();
  const fsRoot = path.parse(current).root;

  while (current !== fsRoot) {
    const configPath = path.join(current, 'radflow.config.json');
    try {
      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(content) as RadflowConfig;
        // Basic validation
        if (config.version === '1' && config.theme && Array.isArray(config.apps)) {
          return { config, root: current };
        }
      }
    } catch {
      // Continue searching if parse fails
    }
    current = path.dirname(current);
  }
  return null;
}

/**
 * Identify which app we're running in based on cwd
 * Uses path matching that handles monorepo setups
 */
function identifyCurrentApp(
  config: RadflowConfig,
  root: string
): RadflowConfig['apps'][number] | null {
  const cwd = path.resolve(process.cwd());

  for (const app of config.apps) {
    const appPath = path.resolve(root, app.path);
    // Match if cwd is the app path or a subdirectory of it
    if (cwd === appPath || cwd.startsWith(appPath + path.sep)) {
      return app;
    }
  }

  // Fallback: check if cwd is ancestor of any app (monorepo root case)
  // In this case, we can't determine which app, so return null
  return null;
}

/**
 * Get project name from package.json for legacy mode
 */
function getLegacyProjectName(): string | null {
  try {
    const pkgPath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(pkgPath)) {
      const content = fs.readFileSync(pkgPath, 'utf-8');
      const pkg = JSON.parse(content);
      return pkg.name || null;
    }
  } catch {
    // Ignore errors
  }
  return null;
}

// ============================================================================
// Route Handler
// ============================================================================

export async function GET() {
  const result = findRadflowConfig();

  if (result) {
    // Theme mode: radflow.config.json found
    const { config, root } = result;
    const currentApp = identifyCurrentApp(config, root);

    const response: HealthResponse = {
      ok: true,
      version: '0.2.0',
      timestamp: Date.now(),
      theme: {
        name: config.theme.name,
        displayName: config.theme.displayName,
        root,
      },
      apps: config.apps.map((app) => ({
        name: app.name,
        displayName: app.displayName,
        port: app.port,
      })),
    };

    if (currentApp) {
      response.app = {
        name: currentApp.name,
        displayName: currentApp.displayName,
        path: currentApp.path,
      };
    }

    return NextResponse.json(response);
  }

  // Legacy mode: no manifest found
  const projectName = getLegacyProjectName();
  const response: HealthResponse = {
    ok: true,
    version: '0.2.0',
    timestamp: Date.now(),
    project: projectName || 'unknown',
  };

  return NextResponse.json(response);
}
`;

/**
 * Health endpoint template for Pages Router.
 * Written to: pages/api/radflow/health.ts
 */
const HEALTH_ROUTE_PAGES = `/**
 * RadFlow Health Endpoint - Pages Router
 *
 * This file is automatically created by RadFlow in the target project at:
 * pages/api/radflow/health.ts
 *
 * DO NOT EDIT - This file is managed by RadFlow
 *
 * Features:
 * - Theme discovery via radflow.config.json (walks up from cwd)
 * - Legacy fallback for projects without manifest
 * - Reports all apps from manifest for app switcher UI
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Types (inlined to avoid import issues in target projects)
// ============================================================================

interface RadflowConfig {
  version: '1';
  theme: {
    name: string;
    displayName: string;
  };
  apps: Array<{
    name: string;
    displayName: string;
    path: string;
    port: number;
  }>;
}

interface HealthResponse {
  ok: true;
  version: string;
  timestamp: number;
  theme?: {
    name: string;
    displayName: string;
    root: string;
  };
  app?: {
    name: string;
    displayName: string;
    path: string;
  };
  apps?: Array<{
    name: string;
    displayName: string;
    port: number;
  }>;
  project?: string;
}

// ============================================================================
// Discovery Functions
// ============================================================================

/**
 * Walk up directory tree looking for radflow.config.json
 * Returns config + theme root path, or null if not found
 */
function findRadflowConfig(): { config: RadflowConfig; root: string } | null {
  let current = process.cwd();
  const fsRoot = path.parse(current).root;

  while (current !== fsRoot) {
    const configPath = path.join(current, 'radflow.config.json');
    try {
      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(content) as RadflowConfig;
        // Basic validation
        if (config.version === '1' && config.theme && Array.isArray(config.apps)) {
          return { config, root: current };
        }
      }
    } catch {
      // Continue searching if parse fails
    }
    current = path.dirname(current);
  }
  return null;
}

/**
 * Identify which app we're running in based on cwd
 * Uses path matching that handles monorepo setups
 */
function identifyCurrentApp(
  config: RadflowConfig,
  root: string
): RadflowConfig['apps'][number] | null {
  const cwd = path.resolve(process.cwd());

  for (const app of config.apps) {
    const appPath = path.resolve(root, app.path);
    // Match if cwd is the app path or a subdirectory of it
    if (cwd === appPath || cwd.startsWith(appPath + path.sep)) {
      return app;
    }
  }

  // Fallback: check if cwd is ancestor of any app (monorepo root case)
  // In this case, we can't determine which app, so return null
  return null;
}

/**
 * Get project name from package.json for legacy mode
 */
function getLegacyProjectName(): string | null {
  try {
    const pkgPath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(pkgPath)) {
      const content = fs.readFileSync(pkgPath, 'utf-8');
      const pkg = JSON.parse(content);
      return pkg.name || null;
    }
  } catch {
    // Ignore errors
  }
  return null;
}

// ============================================================================
// Route Handler
// ============================================================================

export default function handler(
  _req: NextApiRequest,
  res: NextApiResponse<HealthResponse>
) {
  const result = findRadflowConfig();

  if (result) {
    // Theme mode: radflow.config.json found
    const { config, root } = result;
    const currentApp = identifyCurrentApp(config, root);

    const response: HealthResponse = {
      ok: true,
      version: '0.2.0',
      timestamp: Date.now(),
      theme: {
        name: config.theme.name,
        displayName: config.theme.displayName,
        root,
      },
      apps: config.apps.map((app) => ({
        name: app.name,
        displayName: app.displayName,
        port: app.port,
      })),
    };

    if (currentApp) {
      response.app = {
        name: currentApp.name,
        displayName: currentApp.displayName,
        path: currentApp.path,
      };
    }

    return res.status(200).json(response);
  }

  // Legacy mode: no manifest found
  const projectName = getLegacyProjectName();
  const response: HealthResponse = {
    ok: true,
    version: '0.2.0',
    timestamp: Date.now(),
    project: projectName || 'unknown',
  };

  return res.status(200).json(response);
}
`;

/**
 * Detect which Next.js router type is being used.
 * @param projectRoot - Root directory of the Next.js project
 * @returns 'app' for App Router, 'pages' for Pages Router, null if unknown
 */
export function detectRouterType(projectRoot: string): 'app' | 'pages' | null {
  const appDir = path.join(projectRoot, 'app');
  const srcAppDir = path.join(projectRoot, 'src', 'app');
  const pagesDir = path.join(projectRoot, 'pages');
  const srcPagesDir = path.join(projectRoot, 'src', 'pages');

  // Check for App Router (app/ directory)
  if (fs.existsSync(appDir) || fs.existsSync(srcAppDir)) {
    return 'app';
  }

  // Check for Pages Router (pages/ directory)
  if (fs.existsSync(pagesDir) || fs.existsSync(srcPagesDir)) {
    return 'pages';
  }

  return null;
}

/**
 * Get the app directory path (with or without src/).
 * @param projectRoot - Root directory of the Next.js project
 * @returns Path to the app directory, or null if not found
 */
function getAppDir(projectRoot: string): string | null {
  const srcAppDir = path.join(projectRoot, 'src', 'app');
  const appDir = path.join(projectRoot, 'app');

  if (fs.existsSync(srcAppDir)) {
    return srcAppDir;
  }
  if (fs.existsSync(appDir)) {
    return appDir;
  }
  return null;
}

/**
 * Get the pages directory path (with or without src/).
 * @param projectRoot - Root directory of the Next.js project
 * @returns Path to the pages directory, or null if not found
 */
function getPagesDir(projectRoot: string): string | null {
  const srcPagesDir = path.join(projectRoot, 'src', 'pages');
  const pagesDir = path.join(projectRoot, 'pages');

  if (fs.existsSync(srcPagesDir)) {
    return srcPagesDir;
  }
  if (fs.existsSync(pagesDir)) {
    return pagesDir;
  }
  return null;
}

/**
 * Install the RadFlow health endpoint into a Next.js project.
 * @param projectRoot - Root directory of the Next.js project
 * @param options - Installation options (force overwrite, etc.)
 * @returns Result of the installation
 */
export function installHealthEndpoint(
  projectRoot: string,
  options: InstallOptions = {}
): InstallResult {
  const { force = false } = options;
  const routerType = detectRouterType(projectRoot);

  if (!routerType) {
    return {
      success: false,
      healthEndpointPath: null,
      routerType: null,
      error: 'Could not detect Next.js router type (no app/ or pages/ directory found)',
    };
  }

  // Check if already installed
  if (isHealthEndpointInstalled(projectRoot)) {
    if (!force) {
      const existingPath = getHealthEndpointPath(projectRoot, routerType);
      console.log(`[RadFlow] Health endpoint already exists: ${existingPath}`);
      return {
        success: true,
        healthEndpointPath: existingPath,
        routerType,
        skipped: true,
      };
    }
    // Force mode: will backup and overwrite
  }

  try {
    if (routerType === 'app') {
      const appDir = getAppDir(projectRoot);
      if (!appDir) {
        return {
          success: false,
          healthEndpointPath: null,
          routerType: 'app',
          error: 'App directory not found',
        };
      }

      // Create directory structure: app/api/radflow/health/
      const healthDir = path.join(appDir, 'api', 'radflow', 'health');
      fs.mkdirSync(healthDir, { recursive: true });

      // Write route.ts (backup existing if force)
      const routePath = path.join(healthDir, 'route.ts');
      let backedUp: string | undefined;

      if (force && fs.existsSync(routePath)) {
        backedUp = backupFile(routePath);
      }

      fs.writeFileSync(routePath, HEALTH_ROUTE_APP, 'utf-8');
      console.log(`[RadFlow] Created health endpoint: ${routePath}`);

      return {
        success: true,
        healthEndpointPath: routePath,
        routerType: 'app',
        backedUp,
      };
    } else {
      const pagesDir = getPagesDir(projectRoot);
      if (!pagesDir) {
        return {
          success: false,
          healthEndpointPath: null,
          routerType: 'pages',
          error: 'Pages directory not found',
        };
      }

      // Create directory structure: pages/api/radflow/
      const radflowDir = path.join(pagesDir, 'api', 'radflow');
      fs.mkdirSync(radflowDir, { recursive: true });

      // Write health.ts (backup existing if force)
      const routePath = path.join(radflowDir, 'health.ts');
      let backedUp: string | undefined;

      if (force && fs.existsSync(routePath)) {
        backedUp = backupFile(routePath);
      }

      fs.writeFileSync(routePath, HEALTH_ROUTE_PAGES, 'utf-8');
      console.log(`[RadFlow] Created health endpoint: ${routePath}`);

      return {
        success: true,
        healthEndpointPath: routePath,
        routerType: 'pages',
        backedUp,
      };
    }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      healthEndpointPath: null,
      routerType,
      error: `Failed to create health endpoint: ${error}`,
    };
  }
}

/**
 * Get the path where the health endpoint would be installed.
 */
function getHealthEndpointPath(projectRoot: string, routerType: 'app' | 'pages'): string | null {
  if (routerType === 'app') {
    const appDir = getAppDir(projectRoot);
    if (!appDir) return null;
    return path.join(appDir, 'api', 'radflow', 'health', 'route.ts');
  } else {
    const pagesDir = getPagesDir(projectRoot);
    if (!pagesDir) return null;
    return path.join(pagesDir, 'api', 'radflow', 'health.ts');
  }
}

/**
 * Backup a file before overwriting.
 * @returns Path to the backup file
 */
function backupFile(filePath: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${filePath}.backup-${timestamp}`;
  fs.copyFileSync(filePath, backupPath);
  console.log(`[RadFlow] Backed up existing file to: ${backupPath}`);
  return backupPath;
}

/**
 * Check if the health endpoint is already installed.
 * @param projectRoot - Root directory of the Next.js project
 * @returns true if health endpoint exists
 */
export function isHealthEndpointInstalled(projectRoot: string): boolean {
  const routerType = detectRouterType(projectRoot);

  if (routerType === 'app') {
    const appDir = getAppDir(projectRoot);
    if (!appDir) return false;
    return fs.existsSync(path.join(appDir, 'api', 'radflow', 'health', 'route.ts'));
  } else if (routerType === 'pages') {
    const pagesDir = getPagesDir(projectRoot);
    if (!pagesDir) return false;
    return fs.existsSync(path.join(pagesDir, 'api', 'radflow', 'health.ts'));
  }

  return false;
}

/**
 * Remove the RadFlow health endpoint from a Next.js project.
 * @param projectRoot - Root directory of the Next.js project
 * @returns true if removed successfully
 */
export function removeHealthEndpoint(projectRoot: string): boolean {
  const routerType = detectRouterType(projectRoot);

  try {
    if (routerType === 'app') {
      const appDir = getAppDir(projectRoot);
      if (!appDir) return false;
      const radflowDir = path.join(appDir, 'api', 'radflow');
      if (fs.existsSync(radflowDir)) {
        fs.rmSync(radflowDir, { recursive: true });
        console.log(`[RadFlow] Removed health endpoint directory: ${radflowDir}`);
        return true;
      }
    } else if (routerType === 'pages') {
      const pagesDir = getPagesDir(projectRoot);
      if (!pagesDir) return false;
      const radflowDir = path.join(pagesDir, 'api', 'radflow');
      if (fs.existsSync(radflowDir)) {
        fs.rmSync(radflowDir, { recursive: true });
        console.log(`[RadFlow] Removed health endpoint directory: ${radflowDir}`);
        return true;
      }
    }
  } catch (err) {
    console.error('[RadFlow] Failed to remove health endpoint:', err);
  }

  return false;
}
