/**
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

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
} as const;

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

    return NextResponse.json(response, { headers: CORS_HEADERS });
  }

  // Legacy mode: no manifest found
  const projectName = getLegacyProjectName();
  const response: HealthResponse = {
    ok: true,
    version: '0.2.0',
    timestamp: Date.now(),
    project: projectName || 'unknown',
  };

  return NextResponse.json(response, { headers: CORS_HEADERS });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
