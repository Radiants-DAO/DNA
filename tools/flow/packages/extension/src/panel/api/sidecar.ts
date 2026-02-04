/**
 * Sidecar API - fetch-based communication with Flow MCP sidecar server
 */

const DEFAULT_PORT = 3737;

export function getSidecarBaseUrl(port = DEFAULT_PORT): string {
  return `http://localhost:${port}`;
}

export function getSidecarHealthUrl(port = DEFAULT_PORT): string {
  return `${getSidecarBaseUrl(port)}/__flow/health`;
}

export function getSidecarMcpUrl(port = DEFAULT_PORT): string {
  return `${getSidecarBaseUrl(port)}/__mcp`;
}

export function getSidecarWsUrl(port = DEFAULT_PORT): string {
  return `ws://localhost:${port}/__flow/ws`;
}

export interface SidecarHealth {
  status: "ok";
  version: string;
  root: string;
  capabilities: string[];
}

/**
 * Check if sidecar is running and get health info
 */
export async function checkSidecarHealth(port = DEFAULT_PORT): Promise<SidecarHealth | null> {
  try {
    const res = await fetch(getSidecarHealthUrl(port), {
      signal: AbortSignal.timeout(2000),
    });
    if (res.ok) {
      return res.json();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch data from sidecar API
 */
export async function fetchFromSidecar<T>(
  path: string,
  options?: RequestInit,
  port = DEFAULT_PORT
): Promise<T | null> {
  try {
    const url = `${getSidecarBaseUrl(port)}${path}`;
    const res = await fetch(url, {
      ...options,
      signal: options?.signal ?? AbortSignal.timeout(5000),
    });
    if (res.ok) {
      return res.json();
    }
    return null;
  } catch {
    return null;
  }
}
