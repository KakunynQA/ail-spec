#!/usr/bin/env node

/**
 * AIL Token Benchmark Script
 * 
 * Measures source prompt tokens vs AIL sample tokens.
 * 
 * Requirements:
 * - Node.js 18+
 * - npm install tiktoken
 * 
 * Usage:
 *   node benchmarks/tokenize.js
 * 
 * Source: https://github.com/asgeirtj/system_prompts_leaks
 */

import { Tiktoken } from 'tiktoken';
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// GPT-4 tokenizer (cl100k_base)
const encoding = new Tiktoken('cl100k_base');

/**
 * Count tokens in text using GPT tokenizer
 */
function countTokens(text) {
  return encoding.encode(text).length;
}

/**
 * Read file content
 */
function readFile(path) {
  try {
    return readFileSync(path, 'utf-8');
  } catch (error) {
    console.error(`Error reading ${path}:`, error.message);
    return null;
  }
}

/**
 * Get all AIL benchmark samples
 */
function getAilSamples() {
  const examplesDir = join(__dirname, '..', 'examples', 'benchmarks');
  const files = readdirSync(examplesDir).filter(f => f.endsWith('.task.ail'));
  
  return files.map(file => {
    const content = readFile(join(examplesDir, file));
    const name = file.replace('.task.ail', '');
    return { name, file, content };
  }).filter(sample => sample.content);
}

/**
 * Parse source URL from AIL file
 */
function parseSourceUrl(content) {
  const match = content.match(/# Source converted: (https:\/\/[^\n]+)/);
  return match ? match[1] : null;
}

/**
 * Main benchmark function
 */
function runBenchmark() {
  console.log('AIL Token Benchmark\n');
  console.log('Tokenizer: GPT-4 (cl100k_base)');
  console.log('========================\n');

  const samples = getAilSamples();
  const results = [];

  for (const sample of samples) {
    const sourceUrl = parseSourceUrl(sample.content);
    const ailTokens = countTokens(sample.content);
    
    console.log(`Sample: ${sample.name}`);
    console.log(`  File: ${sample.file}`);
    console.log(`  Source: ${sourceUrl || 'Unknown'}`);
    console.log(`  AIL tokens: ${ailTokens}`);
    console.log(`  Source tokens: N/A (requires manual measurement or fetch)`);
    console.log(`  Savings: N/A`);
    console.log();
    
    results.push({
      name: sample.name,
      file: sample.file,
      sourceUrl,
      ailTokens,
      sourceTokens: null, // Would need to fetch and measure
      savingsPercent: null
    });
  }

  // Generate markdown table
  console.log('Markdown Table:\n');
  console.log('| Sample | AIL tokens | Source tokens | Savings |');
  console.log('| --- | ---: | ---: | ---: |');
  
  for (const result of results) {
    const sourceTokens = result.sourceTokens || 'N/A';
    const savings = result.savingsPercent !== null 
      ? `${result.savingsPercent.toFixed(1)}%` 
      : 'N/A';
    console.log(`| ${result.name} | ${result.ailTokens} | ${sourceTokens} | ${savings} |`);
  }

  console.log('\nNote: Source tokens require manual measurement using:');
  console.log('  - GPT tokenizer: https://platform.openai.com/tokenizer');
  console.log('  - Claude calculator: https://token-calculator.net/token-calculator');
  
  encoding.free();
}

// Run benchmark
runBenchmark();
