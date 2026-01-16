/**
 * RadFlow Next.js Config Wrapper
 *
 * Provides the withRadflow() higher-order function that wraps a Next.js config
 * to inject the RadFlow bridge in development mode.
 *
 * Usage in next.config.js:
 * ```javascript
 * const { withRadflow } = require('@radflow/bridge/next');
 *
 * module.exports = withRadflow({
 *   // existing Next.js config
 * });
 * ```
 */

import type { NextConfig } from 'next';

export interface WithRadflowOptions {
  /**
   * Enable verbose logging during build
   * @default false
   */
  verbose?: boolean;
}

// Known client entry names in Next.js (varies by version)
const CLIENT_ENTRY_NAMES = ['main-app', 'main', 'webpack'];

/**
 * Wraps a Next.js config to inject the RadFlow bridge in development mode.
 *
 * @param nextConfig - The existing Next.js configuration
 * @param options - Optional configuration for the wrapper
 * @returns Modified Next.js configuration with RadFlow bridge injection
 */
export function withRadflow(
  nextConfig: NextConfig = {},
  options: WithRadflowOptions = {}
): NextConfig {
  const { verbose = false } = options;

  const originalWebpack = nextConfig.webpack;

  return {
    ...nextConfig,

    webpack(config, context) {
      const { dev, isServer } = context;

      // Only inject in development mode for client builds
      if (dev && !isServer) {
        const originalEntry = config.entry;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        config.entry = async (): Promise<any> => {
          // Get the original entries
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let entries: any;

          if (typeof originalEntry === 'function') {
            entries = await originalEntry();
          } else {
            entries = originalEntry ?? {};
          }

          let injected = false;

          // Try each known client entry name
          for (const entryName of CLIENT_ENTRY_NAMES) {
            const entry = entries[entryName];

            if (entry) {
              // Handle different entry formats
              if (Array.isArray(entry)) {
                // Array format: ['./src/index.js']
                entries[entryName] = ['@radflow/bridge', ...entry];
                injected = true;
              } else if (typeof entry === 'object' && entry !== null && 'import' in entry) {
                // Object format: { import: ['./src/index.js'] }
                const importValue = entry.import;
                const importArray = Array.isArray(importValue)
                  ? importValue
                  : [importValue];
                entries[entryName] = {
                  ...entry,
                  import: ['@radflow/bridge', ...importArray],
                };
                injected = true;
              } else if (typeof entry === 'string') {
                // String format: './src/index.js'
                entries[entryName] = ['@radflow/bridge', entry];
                injected = true;
              }

              if (injected) {
                console.log(`[RadFlow] Injected into: ${entryName}`);
                break;
              }
            }
          }

          // Log warning if injection failed
          if (!injected) {
            const availableEntries = Object.keys(entries);
            console.warn(
              '[RadFlow] Could not find known client entry. Available entries:',
              availableEntries
            );
            console.warn(
              '[RadFlow] Bridge NOT injected. Target project may not work with RadFlow.'
            );

            if (verbose) {
              console.warn('[RadFlow] Entry details:', entries);
            }
          }

          return entries;
        };

        if (verbose) {
          console.log('[RadFlow] Webpack config modified for bridge injection');
        }
      } else if (verbose) {
        if (!dev) {
          console.log('[RadFlow] Skipping injection (production build)');
        } else if (isServer) {
          console.log('[RadFlow] Skipping injection (server build)');
        }
      }

      // Call the original webpack function if it exists
      if (typeof originalWebpack === 'function') {
        return originalWebpack(config, context);
      }

      return config;
    },
  };
}

export default withRadflow;
