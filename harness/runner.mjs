/**
 * AIL behavior-equivalence harness — v0
 *
 * Runs each task against:
 *   A) Original prose system prompt (core rules section only)
 *   B) AIL system prompt (with minimal spec header)
 *
 * Scores Tier 1 mechanical assertions and writes results/v0-run.json.
 */

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { resolveAil } from './ail-resolve.mjs';

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
const MODEL = 'claude-haiku-4-5-20251001'; // haiku: faster + lower token cost for v0
const SAMPLES = 2;
const TEMPERATURE = 0.3;
const RETRY_DELAYS = [5000, 15000, 30000]; // ms — backoff on rate limit

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
const resolvedAil = resolveAil(ailPath);

// Minimal AIL interpretation header (~40 tokens, cacheable across all projects)
const AIL_HEADER = `You are an AI agent. Your instructions below are in AIL (Agent Instruction Language).
AIL opcodes: R=role  G=goal  F=focus  M=must(mandatory)  B=ban(forbidden)  P=prefer  A=avoid  C=check  O=output
Follow every M and B line strictly. Treat P/A as strong guidance.

`;
const ailPrompt = AIL_HEADER + resolvedAil;

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

// Sequential only — no parallel calls to respect TPM limits
async function runSamples(systemPrompt, input, n) {
  const outputs = [];
  for (let i = 0; i < n; i++) {
    const out = await callModel(systemPrompt, input);
    outputs.push(out);
    process.stdout.write('.');
  }
  return outputs;
}

// ---------- scorer ----------
function scoreAssertions(outputs, assertions) {
  return assertions.map(a => {
    const perSample = outputs.map(output => {
      const lower = output.toLowerCase();
      switch (a.type) {
        case 'max_words':
          return output.split(/\s+/).length <= a.value;
        case 'contains_none':
          return !a.patterns.some(p => lower.includes(p.toLowerCase()));
        case 'contains_any':
          return a.patterns.some(p => lower.includes(p.toLowerCase()));
        default:
          return null;
      }
    });
    const passRate = perSample.filter(Boolean).length / perSample.length;
    return { label: a.label, type: a.type, pass_rate: passRate, per_sample: perSample };
  });
}

function taskPasses(scores) {
  return scores.every(s => s.pass_rate >= 0.5);
}

// ---------- main ----------
const promptLabel = existsSync(corePath) ? 'core rules (~2100 words)' : 'full transcript';
console.log(`AIL Behavior Harness v0`);
console.log(`Model: ${MODEL} | Samples/condition: ${SAMPLES} | Original: ${promptLabel}`);
console.log(`Tasks: ${tasks.length}\n`);

const runResults = {
  meta: {
    model: MODEL,
    samples: SAMPLES,
    temperature: TEMPERATURE,
    date: new Date().toISOString(),
    original_prompt: promptLabel,
  },
  word_counts: {
    original: originalPrompt.split(/\s+/).length,
    ail: ailPrompt.split(/\s+/).length,
  },
  tasks: {},
};

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
      console.log(`  ✗ AIL failed: ${s.label} (pass_rate=${s.pass_rate})`);
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
console.log(`Words:       original=${runResults.word_counts.original}  ail=${runResults.word_counts.ail}  compression=${((1 - runResults.word_counts.ail / runResults.word_counts.original) * 100).toFixed(1)}%`);

runResults.summary = { orig_pass: origPass, ail_pass: ailPass, equiv, total: ids.length };

mkdirSync(join(__dir, 'results'), { recursive: true });
const outPath = join(__dir, 'results/v0-run.json');
writeFileSync(outPath, JSON.stringify(runResults, null, 2));
console.log(`\nFull results → harness/results/v0-run.json`);
