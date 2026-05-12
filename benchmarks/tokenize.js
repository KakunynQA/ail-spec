#!/usr/bin/env node

/**
 * AIL Token Benchmark Script
 * 
 * Measures source prompt tokens vs AIL sample tokens.
 * Fetches source prompts from system_prompts_leaks repository.
 * 
 * Requirements:
 * - Node.js 18+
 * - npm install gpt-tokenizer
 * 
 * Usage:
 *   node benchmarks/tokenize.js
 * 
 * Source: https://github.com/asgeirtj/system_prompts_leaks
 */

import { encode } from 'gpt-tokenizer';
import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Count tokens in text using GPT tokenizer
 */
function countTokens(text) {
  return encode(text).length;
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
 * Fetch raw content from GitHub URL
 */
async function fetchGitHubUrl(url) {
  try {
    // Convert GitHub blob URL to raw URL
    const rawUrl = url
      .replace('github.com', 'raw.githubusercontent.com')
      .replace('/blob/', '/');
    
    const response = await fetch(rawUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error.message);
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
 * Extract prompt content from markdown
 * Removes markdown formatting and extracts the actual prompt
 */
function extractPromptContent(markdown) {
  if (!markdown) return null;
  
  // Remove code blocks if present
  let content = markdown.replace(/```[\s\S]*?```/g, '');
  
  // Remove markdown headers but keep content
  content = content.replace(/^#+\s+/gm, '');
  
  // Remove bold/italic markers
  content = content.replace(/\*\*/g, '').replace(/\*/g, '').replace(/__/g, '').replace(/_/g, '');
  
  // Remove links but keep text
  content = content.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  
  // Clean up extra whitespace
  content = content.replace(/\n{3,}/g, '\n\n').trim();
  
  return content;
}

/**
 * Main benchmark function
 */
async function runBenchmark() {
  console.log('AIL Token Benchmark\n');
  console.log('Tokenizer: GPT-4 (cl100k_base)');
  console.log('========================\n');

  const samples = getAilSamples();
  const results = [];

  for (const sample of samples) {
    const sourceUrl = parseSourceUrl(sample.content);
    const ailTokens = countTokens(sample.content);
    
    let sourceTokens = null;
    let savingsPercent = null;
    let sourceFetched = false;
    
    if (sourceUrl) {
      console.log(`Fetching source: ${sourceUrl}`);
      const sourceContent = await fetchGitHubUrl(sourceUrl);
      
      if (sourceContent) {
        sourceFetched = true;
        const promptContent = extractPromptContent(sourceContent);
        sourceTokens = countTokens(promptContent || sourceContent);
        savingsPercent = ((sourceTokens - ailTokens) / sourceTokens) * 100;
      }
    }
    
    console.log(`\nSample: ${sample.name}`);
    console.log(`  File: ${sample.file}`);
    console.log(`  Source: ${sourceUrl || 'Unknown'}`);
    console.log(`  AIL tokens: ${ailTokens}`);
    console.log(`  Source tokens: ${sourceTokens || 'N/A (fetch failed or no URL)'}`);
    console.log(`  Savings: ${savingsPercent !== null ? savingsPercent.toFixed(1) + '%' : 'N/A'}`);
    console.log(`  Source fetched: ${sourceFetched ? 'Yes' : 'No'}`);
    
    results.push({
      name: sample.name,
      file: sample.file,
      sourceUrl,
      ailTokens,
      sourceTokens,
      savingsPercent,
      sourceFetched
    });
  }

  // Generate markdown table
  console.log('\n\nMarkdown Table:\n');
  console.log('| Sample | AIL tokens | Source tokens | Savings | Source fetched |');
  console.log('| --- | ---: | ---: | ---: | ---: |');
  
  for (const result of results) {
    const sourceTokens = result.sourceTokens || 'N/A';
    const savings = result.savingsPercent !== null 
      ? `${result.savingsPercent.toFixed(1)}%` 
      : 'N/A';
    const fetched = result.sourceFetched ? '✓' : '✗';
    console.log(`| ${result.name} | ${result.ailTokens} | ${sourceTokens} | ${savings} | ${fetched} |`);
  }

  console.log('\n\nNote: Samples without source URLs cannot be fetched automatically.');
  console.log('Manual measurement required for those samples.');
}

// Run benchmark
runBenchmark().catch(console.error);
