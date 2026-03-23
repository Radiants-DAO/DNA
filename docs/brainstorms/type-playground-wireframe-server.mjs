#!/usr/bin/env node
/**
 * Tiny server for the type playground wireframe.
 * Serves the HTML file and persists comments to a sidecar JSON file.
 *
 * Usage:  node type-playground-wireframe-server.mjs
 * Opens:  http://localhost:3099
 */
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HTML_PATH = join(__dirname, 'type-playground-wireframe.html');
const COMMENTS_PATH = join(__dirname, 'type-playground-wireframe-comments.json');
const PORT = 3099;

function readComments() {
  if (!existsSync(COMMENTS_PATH)) return [];
  try { return JSON.parse(readFileSync(COMMENTS_PATH, 'utf-8')); }
  catch { return []; }
}

function writeComments(data) {
  writeFileSync(COMMENTS_PATH, JSON.stringify(data, null, 2));
}

const server = createServer((req, res) => {
  // CORS headers for local dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // Serve HTML
  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(readFileSync(HTML_PATH, 'utf-8'));
    return;
  }

  // GET comments
  if (req.url === '/api/comments' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(readComments()));
    return;
  }

  // POST comments
  if (req.url === '/api/comments' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        writeComments(data);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, count: data.length }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`\n  Type Playground Wireframe`);
  console.log(`  http://localhost:${PORT}\n`);
  console.log(`  Comments persist to: ${COMMENTS_PATH}\n`);
});
