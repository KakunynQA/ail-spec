/**
 * Pretty-prints the latest v0 run results.
 * Run after: node runner.mjs
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const requestedPath = process.argv[2]
  ? join(__dir, process.argv[2])
  : join(__dir, 'results/latest.json');
const fallbackPath = join(__dir, 'results/v0-run.json');
const path = existsSync(requestedPath) ? requestedPath : fallbackPath;

if (!existsSync(path)) {
  console.error('No results found. Run: node runner.mjs');
  process.exit(1);
}

const data = JSON.parse(readFileSync(path, 'utf8'));
const { meta, tasks, summary } = data;
const counts = data.counts || {
  original_words: data.token_counts?.original_words || data.word_counts?.original,
  ail_words: data.token_counts?.ail_words || data.word_counts?.ail,
  original_tokens: data.token_counts?.original_tokens || null,
  ail_tokens: data.token_counts?.ail_tokens || null,
  compression_words_percent: data.token_counts?.compression_words_percent || null,
  compression_tokens_percent: data.token_counts?.compression_tokens_percent || null,
};

if (counts.compression_words_percent === null && counts.original_words && counts.ail_words) {
  counts.compression_words_percent =
    Number(((1 - counts.ail_words / counts.original_words) * 100).toFixed(1));
}

if (counts.compression_tokens_percent === null && counts.original_tokens && counts.ail_tokens) {
  counts.compression_tokens_percent =
    Number(((1 - counts.ail_tokens / counts.original_tokens) * 100).toFixed(1));
}

console.log(`\nAIL Behavior Harness - v0 Report`);
console.log(`Result file: ${relative(__dir, path)}`);
console.log(`Schema: ${data.schema_version || 'legacy'}  Run: ${meta.date}  Model: ${meta.model}  Samples: ${meta.sample_count || meta.samples}\n`);

console.log(`Prompt word counts`);
console.log(`  Original prose : ${counts.original_words} words`);
console.log(`  AIL runtime    : ${counts.ail_words} words`);
console.log(`  Word reduction : ${counts.compression_words_percent}%`);
if (counts.original_tokens && counts.ail_tokens) {
  console.log(`  Original tokens: ${counts.original_tokens}`);
  console.log(`  AIL tokens     : ${counts.ail_tokens}`);
  console.log(`  Token reduction: ${counts.compression_tokens_percent}%`);
} else {
  console.log(`  Token reduction: not measured by this harness run`);
}

if (meta.ail_prompt_composition) {
  const c = meta.ail_prompt_composition;
  console.log(`\nAIL prompt composition`);
  console.log(`  Raw AIL path        : ${c.raw_ail_path}`);
  console.log(`  Runtime header      : ${c.uses_runtime_header ? 'yes' : 'no'} (${c.runtime_header_words} words)`);
  console.log(`  Raw AIL             : ${c.raw_ail_words} words`);
  console.log(`  Runtime AIL prompt  : ${c.runtime_ail_words} words`);
  console.log(`  Resolved imports    : ${c.resolved_imports?.length || 0}`);
}
console.log('');

const pad = s => s.padEnd(30);

console.log(`Task Results`);
console.log(`${'Task'.padEnd(30)} ${'Type'.padEnd(12)} Orig  AIL   Match`);
console.log('-'.repeat(62));

for (const [id, t] of Object.entries(tasks)) {
  const orig = t.original.pass ? 'PASS' : 'FAIL';
  const ail = t.ail.pass ? 'PASS' : 'FAIL';
  const match = orig === ail ? 'yes' : 'no';
  console.log(`${pad(id)} ${t.type.padEnd(12)} ${orig.padEnd(6)}${ail.padEnd(6)}${match}`);
}

console.log('-'.repeat(62));
console.log(`\nSummary: original ${summary.orig_pass}/${summary.total} | AIL ${summary.ail_pass}/${summary.total} | equiv ${summary.equiv}/${summary.total}`);

const failures = Object.entries(tasks).filter(([, t]) => !t.ail.pass);
if (failures.length > 0) {
  console.log(`\nAIL Failures (need spec or AIL improvement):`);
  for (const [id, t] of failures) {
    console.log(`\n  [${id}] ${t.description}`);
    console.log(`  Input: ${t.input}`);
    for (const s of t.ail.scores.filter(score => score.pass_rate < 0.5)) {
      console.log(`  FAIL ${s.id || s.label}: pass_rate=${s.pass_rate}`);
    }
    console.log(`  AIL outputs:`);
    for (const [i, output] of t.ail.outputs.entries()) {
      console.log(`    [${i}] ${output.slice(0, 300).replace(/\n/g, ' ')}`);
    }
  }
}

const improvements = Object.entries(tasks).filter(([, t]) => t.ail.pass && !t.original.pass);
if (improvements.length > 0) {
  console.log(`\nAIL beats original (interesting):`);
  for (const [id] of improvements) console.log(`  [${id}]`);
}
