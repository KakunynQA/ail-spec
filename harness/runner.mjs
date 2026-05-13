/**
 * AIL behavior-equivalence harness — v0
 *
 * Runs each task against:
 *   A) Original prose system prompt
 *   B) AIL system prompt (with minimal spec header)
 *
 * Scores Tier 1 mechanical assertions and writes results/v0-run.json.
 */

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { resolveAil } from './ail-resolve.mjs';

// Load .env if present (simple parser, no extra dep)
const __dir0 = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dir0, '.env');
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

const __dir = dirname(fileURLToPath(import.meta.url));

// ---------- config ----------
const MODEL = 'claude-sonnet-4-6';
const SAMPLES = 2;       // per condition per task (keep low for v0)
const TEMPERATURE = 0.3; // low but not 0 so we see natural phrasing

// ---------- load prompts ----------
const origPath = join(__dir, 'prompts/claude-code-original.txt');
if (!existsSync(origPath)) {
  console.error('Original prompt not found. Run: node setup.mjs');
  process.exit(1);
}
const originalPrompt = readFileSync(origPath, 'utf8');

const ailPath = resolve(__dir, '../examples/benchmarks/claude-code-style-system-prompt.task.ail');
const resolvedAil = resolveAil(ailPath);

// Minimal AIL interpretation header (~40 tokens, shared/cacheable across all projects)
const AIL_HEADER = `You are an AI agent. Your instructions below are in AIL (Agent Instruction Language).
AIL opcodes: R=role  G=goal  F=focus  M=must(mandatory)  B=ban(forbidden)  P=prefer  A=avoid  C=check  O=output
Follow every M and B line strictly. Treat P/A as strong guidance.

`;

const ailPrompt = AIL_HEADER + resolvedAil;

// ---------- load tasks ----------
const tasks = JSON.parse(readFileSync(join(__dir, 'tasks/claude-code.json'), 'utf8'));

// ---------- API ----------
const client = new Anthropic();

async function callModel(systemPrompt, userInput) {
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    temperature: TEMPERATURE,
    system: systemPrompt,
    messages: [{ role: 'user', content: userInput }],
  });
  return msg.content[0].text;
}

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
console.log(`AIL Behavior Harness v0`);
console.log(`Model: ${MODEL} | Samples/condition: ${SAMPLES}`);
console.log(`Tasks: ${tasks.length}\n`);

const runResults = {
  meta: { model: MODEL, samples: SAMPLES, temperature: TEMPERATURE, date: new Date().toISOString() },
  token_counts: {
    original_words: originalPrompt.split(/\s+/).length,
    ail_words: ailPrompt.split(/\s+/).length,
  },
  tasks: {},
};

for (const task of tasks) {
  process.stdout.write(`[${task.id}] (${task.type}) `);

  const [origOutputs, ailOutputs] = await Promise.all([
    runSamples(originalPrompt, task.input, SAMPLES),
    runSamples(ailPrompt, task.input, SAMPLES),
  ]);
  process.stdout.write(' ');

  const origScores = scoreAssertions(origOutputs, task.assertions);
  const ailScores = scoreAssertions(ailOutputs, task.assertions);

  const origPass = taskPasses(origScores);
  const ailPass = taskPasses(ailScores);

  console.log(`orig=${origPass ? 'PASS' : 'FAIL'}  ail=${ailPass ? 'PASS' : 'FAIL'}`);

  // Print first output of each condition for inspection
  if (!ailPass) {
    console.log(`  ↳ ORIG[0]: ${origOutputs[0].slice(0, 200).replace(/\n/g, ' ')}`);
    console.log(`  ↳  AIL[0]: ${ailOutputs[0].slice(0, 200).replace(/\n/g, ' ')}`);
    // Print which assertions failed
    for (const s of ailScores.filter(s => s.pass_rate < 0.5)) {
      console.log(`  ✗ AIL failed assertion: ${s.label} (pass_rate=${s.pass_rate})`);
    }
  }

  runResults.tasks[task.id] = {
    description: task.description,
    type: task.type,
    input: task.input,
    original: { outputs: origOutputs, scores: origScores, pass: origPass },
    ail: { outputs: ailOutputs, scores: ailScores, pass: ailPass },
  };
}

// ---------- summary ----------
const taskIds = Object.keys(runResults.tasks);
const origPassCount = taskIds.filter(id => runResults.tasks[id].original.pass).length;
const ailPassCount = taskIds.filter(id => runResults.tasks[id].ail.pass).length;
const equivCount = taskIds.filter(
  id => runResults.tasks[id].original.pass === runResults.tasks[id].ail.pass
).length;

console.log('\n─────────────────────────────────');
console.log(`Original:    ${origPassCount}/${taskIds.length} tasks pass`);
console.log(`AIL:         ${ailPassCount}/${taskIds.length} tasks pass`);
console.log(`Equivalent:  ${equivCount}/${taskIds.length} tasks same result`);
console.log(
  `Word count:  original=${runResults.token_counts.original_words}  ail=${runResults.token_counts.ail_words}`
);

runResults.summary = { orig_pass: origPassCount, ail_pass: ailPassCount, equiv: equivCount, total: taskIds.length };

// ---------- save ----------
mkdirSync(join(__dir, 'results'), { recursive: true });
const outPath = join(__dir, 'results/v0-run.json');
writeFileSync(outPath, JSON.stringify(runResults, null, 2));
console.log(`\nFull results → harness/results/v0-run.json`);
