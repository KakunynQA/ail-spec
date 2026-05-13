/**
 * Pretty-prints the latest v0 run results.
 * Run after: node runner.mjs
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const path = join(__dir, 'results/v0-run.json');

if (!existsSync(path)) {
  console.error('No results found. Run: node runner.mjs');
  process.exit(1);
}

const data = JSON.parse(readFileSync(path, 'utf8'));
const { meta, token_counts, tasks, summary } = data;

console.log(`\nAIL Behavior Harness — v0 Report`);
console.log(`Run: ${meta.date}  Model: ${meta.model}  Samples: ${meta.samples}\n`);

console.log(`Prompt word counts`);
console.log(`  Original prose : ${token_counts.original_words} words`);
console.log(`  AIL + header   : ${token_counts.ail_words} words`);
const saving = ((1 - token_counts.ail_words / token_counts.original_words) * 100).toFixed(1);
console.log(`  Compression    : ${saving}%\n`);

const pad = s => s.padEnd(30);

console.log(`Task Results`);
console.log(`${'Task'.padEnd(30)} ${'Type'.padEnd(12)} Orig  AIL   Match`);
console.log('─'.repeat(62));

for (const [id, t] of Object.entries(tasks)) {
  const orig = t.original.pass ? 'PASS' : 'FAIL';
  const ail = t.ail.pass ? 'PASS' : 'FAIL';
  const match = orig === ail ? '✓' : '✗';
  console.log(`${pad(id)} ${t.type.padEnd(12)} ${orig.padEnd(6)}${ail.padEnd(6)}${match}`);
}

console.log('─'.repeat(62));
console.log(`\nSummary: original ${summary.orig_pass}/${summary.total} | AIL ${summary.ail_pass}/${summary.total} | equiv ${summary.equiv}/${summary.total}`);

// Failure breakdown
const failures = Object.entries(tasks).filter(([, t]) => !t.ail.pass);
if (failures.length > 0) {
  console.log(`\nAIL Failures (need spec or AIL improvement):`);
  for (const [id, t] of failures) {
    console.log(`\n  [${id}] ${t.description}`);
    console.log(`  Input: ${t.input}`);
    for (const s of t.ail.scores.filter(s => s.pass_rate < 0.5)) {
      console.log(`  ✗ ${s.label}: pass_rate=${s.pass_rate}`);
    }
    console.log(`  AIL outputs:`);
    for (const [i, o] of t.ail.outputs.entries()) {
      console.log(`    [${i}] ${o.slice(0, 300).replace(/\n/g, ' ')}`);
    }
  }
}

const improvements = Object.entries(tasks).filter(([, t]) => t.ail.pass && !t.original.pass);
if (improvements.length > 0) {
  console.log(`\nAIL beats original (interesting):`);
  for (const [id] of improvements) console.log(`  [${id}]`);
}
