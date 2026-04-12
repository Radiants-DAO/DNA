#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const HOME = process.env.HOME;
const REPO = path.resolve(new URL(import.meta.url).pathname, '../../..');

const ROOTS = [
  { scope: 'global',       dir: path.join(HOME, '.claude/skills') },
  { scope: 'project-dna',  dir: path.join(REPO, '.claude/skills') },
  { scope: 'project-agents', dir: path.join(REPO, '.agents/skills') },
];

function parseFrontmatter(md) {
  if (!md.startsWith('---')) return {};
  const end = md.indexOf('\n---', 3);
  if (end === -1) return {};
  const block = md.slice(3, end).trim();
  const out = {};
  for (const line of block.split('\n')) {
    const m = line.match(/^([a-zA-Z_][\w-]*)\s*:\s*(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
  return out;
}

function walkSkills(rootDir, scope) {
  const rows = [];
  if (!fs.existsSync(rootDir)) return rows;
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  for (const ent of entries) {
    if (!ent.isDirectory()) continue;
    const skillDir = path.join(rootDir, ent.name);
    const skillMd = path.join(skillDir, 'SKILL.md');
    if (!fs.existsSync(skillMd)) {
      const nested = fs.readdirSync(skillDir, { withFileTypes: true })
        .filter(e => e.isDirectory());
      for (const n of nested) {
        const nestedMd = path.join(skillDir, n.name, 'SKILL.md');
        if (fs.existsSync(nestedMd)) {
          rows.push(buildRow(`${ent.name}:${n.name}`, scope, path.join(skillDir, n.name), nestedMd));
        }
      }
      continue;
    }
    rows.push(buildRow(ent.name, scope, skillDir, skillMd));
  }
  return rows;
}

function buildRow(id, scope, dir, skillMd) {
  const md = fs.readFileSync(skillMd, 'utf8');
  const fm = parseFrontmatter(md);
  const stat = fs.statSync(skillMd);
  return {
    id,
    scope,
    path: dir,
    skill_md_path: skillMd,
    managed_by_npx: false,
    frontmatter: {
      name: fm.name || null,
      description: fm.description || null,
    },
    size_bytes: stat.size,
    size_lines: md.split('\n').length,
    mtime: stat.mtime.toISOString(),
  };
}

let inventory = [];
for (const { scope, dir } of ROOTS) {
  inventory = inventory.concat(walkSkills(dir, scope));
}

try {
  const npxOut = execSync('npx -y skills list 2>&1', { encoding: 'utf8', timeout: 30000 });
  fs.writeFileSync(path.join(REPO, 'ops/skills-cleanup/npx-managed.txt'), npxOut);
  const ids = new Set();
  for (const line of npxOut.split('\n')) {
    const m = line.replace(/\x1b\[[0-9;]*m/g, '').match(/^\s*[•*-]?\s*([a-zA-Z0-9._:-]+)\s*$/);
    if (m && m[1].length > 1) ids.add(m[1]);
  }
  for (const row of inventory) {
    if (ids.has(row.id)) row.managed_by_npx = true;
  }
} catch (e) {
  console.error('npx skills list failed:', e.message);
}

const outPath = path.join(REPO, 'ops/skills-cleanup/inventory.json');
fs.writeFileSync(outPath, JSON.stringify(inventory, null, 2));

const byScope = inventory.reduce((acc, r) => {
  acc[r.scope] = (acc[r.scope] || 0) + 1;
  return acc;
}, {});
console.log(`total: ${inventory.length}`);
for (const [k, v] of Object.entries(byScope)) console.log(`  ${k}: ${v}`);
console.log(`managed_by_npx: ${inventory.filter(r => r.managed_by_npx).length}`);
console.log(`wrote: ${outPath}`);
