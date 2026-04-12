#!/usr/bin/env node
import { createReadStream, writeFileSync, readFileSync, existsSync, appendFileSync, statSync } from 'fs';
import { createInterface } from 'readline';
import { execSync } from 'child_process';
import { join } from 'path';

const OUT_DIR = '/Users/rivermassey/Desktop/dev/DNA-pixel-art/ops/skills-cleanup';
const REPORT_PATH = join(OUT_DIR, 'usage-report.json');
const PARTIAL_PATH = join(OUT_DIR, 'usage-report.partial.json');
const ERROR_LOG = join(OUT_DIR, 'usage-report.errors.log');
const INVENTORY_PATH = join(OUT_DIR, 'inventory.json');

const inventory = JSON.parse(readFileSync(INVENTORY_PATH, 'utf8'));
const skillIds = new Set(inventory.map(s => s.id));

const stats = {};
for (const id of skillIds) {
  stats[id] = { id, invocations: 0, last_used: null, user_slash_invocations: 0, sessions_touched: 0 };
}

const processedFiles = new Set();
if (existsSync(PARTIAL_PATH)) {
  try {
    const partial = JSON.parse(readFileSync(PARTIAL_PATH, 'utf8'));
    if (partial.processedFiles) {
      for (const f of partial.processedFiles) processedFiles.add(f);
    }
    if (partial.stats) {
      for (const s of partial.stats) {
        if (stats[s.id]) Object.assign(stats[s.id], s);
      }
    }
    console.log(`Resumed from partial: ${processedFiles.size} files already processed`);
  } catch { /* ignore corrupt partial */ }
}

// Clear error log on fresh start
if (processedFiles.size === 0 && existsSync(ERROR_LOG)) writeFileSync(ERROR_LOG, '');

const sessionFiles = execSync(
  `find ${process.env.HOME}/.claude/projects -name '*.jsonl' -mtime -90`,
  { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }
).trim().split('\n').filter(Boolean);

console.log(`Total session files: ${sessionFiles.length}, already processed: ${processedFiles.size}`);

const commandNameRe = /<command-name>([^<]+)<\/command-name>/g;

async function processFile(filePath) {
  const touchedSkills = new Set();
  let fileTimestamp = null;

  try {
    const fstat = statSync(filePath);
    fileTimestamp = fstat.mtime.toISOString();
  } catch { /* ignore */ }

  return new Promise((resolve, reject) => {
    const stream = createReadStream(filePath, { encoding: 'utf8' });
    const rl = createInterface({ input: stream, crlfDelay: Infinity });
    let lineNum = 0;

    rl.on('line', (line) => {
      lineNum++;
      if (!line.trim()) return;
      let obj;
      try {
        obj = JSON.parse(line);
      } catch {
        return; // skip malformed lines silently (only log file-level errors)
      }

      // Check for Skill tool calls in assistant messages
      if (obj.type === 'assistant' && Array.isArray(obj.message?.content)) {
        for (const block of obj.message.content) {
          if (block.type === 'tool_use' && block.name === 'Skill' && block.input?.skill) {
            const sid = block.input.skill;
            if (skillIds.has(sid)) {
              stats[sid].invocations++;
              touchedSkills.add(sid);
              // Use message timestamp or file timestamp
              const ts = obj.timestamp || fileTimestamp;
              if (ts && (!stats[sid].last_used || ts > stats[sid].last_used)) {
                stats[sid].last_used = ts;
              }
            }
          }
        }
      }

      // Check for <command-name> in user messages
      if (obj.type === 'human' && obj.message?.content) {
        const content = typeof obj.message.content === 'string'
          ? obj.message.content
          : Array.isArray(obj.message.content)
            ? obj.message.content.map(b => typeof b === 'string' ? b : b.text || '').join(' ')
            : '';
        let match;
        commandNameRe.lastIndex = 0;
        while ((match = commandNameRe.exec(content)) !== null) {
          const sid = match[1].trim();
          if (skillIds.has(sid)) {
            stats[sid].user_slash_invocations++;
            touchedSkills.add(sid);
          }
        }
      }
    });

    rl.on('close', () => {
      for (const sid of touchedSkills) {
        stats[sid].sessions_touched++;
      }
      resolve();
    });

    rl.on('error', (err) => {
      reject(err);
    });

    stream.on('error', (err) => {
      reject(err);
    });
  });
}

let processed = 0;
const total = sessionFiles.length;

for (const filePath of sessionFiles) {
  if (processedFiles.has(filePath)) {
    processed++;
    continue;
  }

  try {
    await processFile(filePath);
  } catch (err) {
    appendFileSync(ERROR_LOG, `${filePath}: ${err.message}\n`);
  }

  processedFiles.add(filePath);
  processed++;

  if (processed % 100 === 0) {
    console.log(`Progress: ${processed}/${total}`);
    const partial = {
      processedFiles: [...processedFiles],
      stats: Object.values(stats),
    };
    writeFileSync(PARTIAL_PATH, JSON.stringify(partial));
  }
}

// Final output
const results = Object.values(stats).sort((a, b) => b.invocations - a.invocations);
writeFileSync(REPORT_PATH, JSON.stringify(results, null, 2));

// Cleanup partial
if (existsSync(PARTIAL_PATH)) {
  const { unlinkSync } = await import('fs');
  unlinkSync(PARTIAL_PATH);
}

const topSkill = results[0];
const zeroUse = results.filter(s => s.invocations === 0 && s.user_slash_invocations === 0).length;

console.log(`USAGE MINER DONE — ${results.length} skills ranked, top skill: ${topSkill.id} (${topSkill.invocations} invocations), zero-use skills: ${zeroUse}`);
