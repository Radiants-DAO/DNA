#!/usr/bin/env node
/**
 * Copy Bridge to Tauri Bundle
 *
 * Copies the built @radflow/bridge package into the Tauri resources directory
 * so it can be bundled with the app and copied to target projects.
 *
 * Usage: node scripts/copy-bridge.js
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..');
const BRIDGE_SRC = path.join(ROOT, 'packages', 'bridge');
const TAURI_RESOURCES = path.join(ROOT, 'src-tauri', 'resources', 'bridge');

/**
 * Copy a directory recursively.
 */
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules
      if (entry.name === 'node_modules') continue;
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function main() {
  console.log('[copy-bridge] Source:', BRIDGE_SRC);
  console.log('[copy-bridge] Destination:', TAURI_RESOURCES);

  // Check if bridge is built
  const distDir = path.join(BRIDGE_SRC, 'dist');
  if (!fs.existsSync(distDir)) {
    console.error('[copy-bridge] Error: Bridge not built. Run "pnpm --filter @radflow/bridge build" first.');
    process.exit(1);
  }

  // Clean destination
  if (fs.existsSync(TAURI_RESOURCES)) {
    fs.rmSync(TAURI_RESOURCES, { recursive: true });
    console.log('[copy-bridge] Cleaned existing destination');
  }

  // Create destination directory
  fs.mkdirSync(TAURI_RESOURCES, { recursive: true });

  // Copy dist/
  copyDir(distDir, path.join(TAURI_RESOURCES, 'dist'));
  console.log('[copy-bridge] Copied dist/');

  // Copy templates/
  const templatesDir = path.join(BRIDGE_SRC, 'templates');
  if (fs.existsSync(templatesDir)) {
    copyDir(templatesDir, path.join(TAURI_RESOURCES, 'templates'));
    console.log('[copy-bridge] Copied templates/');
  }

  // Copy package.json
  fs.copyFileSync(
    path.join(BRIDGE_SRC, 'package.json'),
    path.join(TAURI_RESOURCES, 'package.json')
  );
  console.log('[copy-bridge] Copied package.json');

  console.log('[copy-bridge] Done!');
}

main();
