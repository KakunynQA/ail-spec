/**
 * AIL behavior-equivalence harness — v0
 *
 * Runs each task against:
 *   A) Original prose system prompt (core rules section only)
 *   B) AIL system prompt (with minimal spec header)
 *
 * Scores Tier 1 mechanical assertions and writes results/latest.json plus a
 * timestamped result file.
 */

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { resolveAilWithMetadata } from './ail-resolve.mjs';
import { scoreAssertions, taskPasses, wordCount } from './assertions.mjs';

const __dir = dirname(fileURLToPath(import.meta.url));

// Load .env if present (simple parser, no extra dep)
const envPath = join(__dir, '.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)\s*=\s*(.+)$/);
    if (m) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY not set.\nCreate harness/.env with: ANTHROPIC_API_KEY=sk-ant-...');
  process.exit(1);
}

// ---------- config ----------
// Use MODEL env var to override: MODEL=claude-haiku-4-5-20251001 node runner.mjs
const MODEL = process.env.MODEL || 'claude-sonnet-4-6';
const SAMPLES = parseInt(process.env.SAMPLES || '2', 10);
const TEMPERATURE = 0.3;
const CALL_DELAY = parseInt(process.env.CALL_DELAY || '3000', 10); // ms between calls
const RETRY_DELAYS = [10000, 30000, 60000]; // ms — backoff on rate limit

// ---------- load prompts ----------
// Use the extracted core system prompt (behavioral rules only, ~2100 words)
// The full transcript at claude-code-original.txt is the source; core was extracted via setup.
const corePath = join(__dir, 'prompts/claude-code-core.txt');
const origPath = join(__dir, 'prompts/claude-code-original.txt');
const promptPath = existsSync(corePath) ? corePath : origPath;

if (!existsSync(promptPath)) {
  console.error('Original prompt not found. Run: node setup.mjs');
  process.exit(1);
}
const originalPrompt = readFileSync(promptPath, 'utf8');

const ailPath = resolve(__dir, '../examples/benchmarks/claude-code-style-system-prompt.task.ail');
const resolvedAil = resolveAilWithMetadata(ailPath);

// Minimal AIL interpretation header (~40 tokens, cacheable across all projects)
const AIL_HEADER = `You are an AI agent. Your instructions below are in AIL (Agent Instruction Language).
AIL opcodes: R=role  G=goal  F=focus  M=must(mandatory)  B=ban(forbidden)  P=prefer  A=avoid  C=check  O=output
Follow every M and B line strictly. Treat P/A as strong guidance.

`;
const ailPrompt = AIL_HEADER + resolvedAil.resolved;

// ---------- load tasks ----------
const tasks = JSON.parse(readFileSync(join(__dir, 'tasks/claude-code.json'), 'utf8'));

// ---------- API with retry ----------
const client = new Anthropic();

async function callModel(systemPrompt, userInput, attempt = 0) {
  try {
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 512,
      temperature: TEMPERATURE,
      system: systemPrompt,
      messages: [{ role: 'user', content: userInput }],
    });
    return msg.content[0].text;
  } catch (err) {
    if (err.status === 429 && attempt < RETRY_DELAYS.length) {
      const delay = RETRY_DELAYS[attempt];
      process.stdout.write(`[rate-limit, retry in ${delay / 1000}s]`);
      await new Promise(r => setTimeout(r, delay));
      return callModel(systemPrompt, userInput, attempt + 1);
    }
    throw err;
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Sequential only — no parallel calls to respect TPM limits
async function runSamples(systemPrompt, input, n) {
  const outputs = [];
  for (let i = 0; i < n; i++) {
    if (i > 0) await sleep(CALL_DELAY);
    const out = await callModel(systemPrompt, input);
    outputs.push(out);
    process.stdout.write('.');
  }
  return outputs;
}

// ---------- main ----------
const promptLabel = existsSync(corePath) ? 'core rules (~2100 words)' : 'full transcript';
console.log(`AIL Behavior Harness v0`);
console.log(`Model: ${MODEL} | Samples/condition: ${SAMPLES} | Original: ${promptLabel}`);
console.log(`Tasks: ${tasks.length}\n`);

const runResults = {
  schema_version: '0.2.0',
  meta: {
    model: MODEL,
    sample_count: SAMPLES,
    samples: SAMPLES,
    temperature: TEMPERATURE,
    date: new Date().toISOString(),
    source_prompt_label: promptLabel,
    original_prompt: promptLabel,
    ail_prompt_composition: {
      raw_ail_path: ailPath,
      resolved_imports: resolvedAil.resolved_imports,
      uses_runtime_header: true,
      runtime_header_words: wordCount(AIL_HEADER),
      raw_ail_words: wordCount(resolvedAil.raw),
      runtime_ail_words: wordCount(ailPrompt),
    },
  },
  counts: {
    original_words: wordCount(originalPrompt),
    ail_words: wordCount(ailPrompt),
    original_tokens: null,
    ail_tokens: null,
    compression_words_percent: null,
    compression_tokens_percent: null,
  },
  tasks: {},
};

runResults.counts.compression_words_percent =
  Number(((1 - runResults.counts.ail_words / runResults.counts.original_words) * 100).toFixed(1));

for (const task of tasks) {
  process.stdout.write(`\n[${task.id}] (${task.type})\n  orig: `);
  const origOutputs = await runSamples(originalPrompt, task.input, SAMPLES);

  process.stdout.write('\n   ail: ');
  const ailOutputs = await runSamples(ailPrompt, task.input, SAMPLES);

  const origScores = scoreAssertions(origOutputs, task.assertions);
  const ailScores  = scoreAssertions(ailOutputs, task.assertions);
  const origPass   = taskPasses(origScores);
  const ailPass    = taskPasses(ailScores);
  const match      = origPass === ailPass ? '✓ equiv' : '✗ diff';

  process.stdout.write(`\n  orig=${origPass ? 'PASS' : 'FAIL'}  ail=${ailPass ? 'PASS' : 'FAIL'}  ${match}\n`);

  if (!ailPass) {
    console.log(`  ↳ ORIG[0]: ${origOutputs[0].slice(0, 220).replace(/\n/g, ' ')}`);
    console.log(`  ↳  AIL[0]: ${ailOutputs[0].slice(0, 220).replace(/\n/g, ' ')}`);
    for (const s of ailScores.filter(s => s.pass_rate < 0.5)) {
      console.log(`  ✗ AIL failed: ${s.id || s.label} (pass_rate=${s.pass_rate})`);
    }
  }

  runResults.tasks[task.id] = {
    description: task.description,
    type: task.type,
    input: task.input,
    original: { outputs: origOutputs, scores: origScores, pass: origPass },
    ail:      { outputs: ailOutputs,  scores: ailScores,  pass: ailPass  },
  };
}

// ---------- summary ----------
const ids          = Object.keys(runResults.tasks);
const origPass     = ids.filter(id => runResults.tasks[id].original.pass).length;
const ailPass      = ids.filter(id => runResults.tasks[id].ail.pass).length;
const equiv        = ids.filter(id => runResults.tasks[id].original.pass === runResults.tasks[id].ail.pass).length;

console.log('\n═══════════════════════════════════════');
console.log(`Original:    ${origPass}/${ids.length} tasks pass`);
console.log(`AIL:         ${ailPass}/${ids.length} tasks pass`);
console.log(`Equivalent:  ${equiv}/${ids.length} same result`);
console.log(`Words:       original=${runResults.counts.original_words}  ail=${runResults.counts.ail_words}  compression=${runResults.counts.compression_words_percent}%`);

runResults.summary = { orig_pass: origPass, ail_pass: ailPass, equiv, total: ids.length };

mkdirSync(join(__dir, 'results'), { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const outFile = `results/${MODEL.replace(/[^a-z0-9]/g, '-')}-${stamp}.json`;
const outPath = join(__dir, outFile);
writeFileSync(outPath, JSON.stringify(runResults, null, 2));
// also keep a stable latest pointer
writeFileSync(join(__dir, 'results/latest.json'), JSON.stringify(runResults, null, 2));
console.log(`\nFull results → harness/${outFile}`);
