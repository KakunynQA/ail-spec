/**
 * Downloads the Claude Code original system prompt for use as the baseline.
 * Stores it in prompts/claude-code-original.txt (not committed to git).
 */

import { writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));

const SOURCE_URL =
  'https://raw.githubusercontent.com/matthew-lim-matthew-lim/claude-code-system-prompt/refs/heads/main/claudecode.md';

const dest = join(__dir, 'prompts/claude-code-original.txt');

if (existsSync(dest)) {
  console.log('Original prompt already present. Delete prompts/claude-code-original.txt to re-fetch.');
  process.exit(0);
}

console.log(`Fetching original prompt from:\n  ${SOURCE_URL}\n`);

const res = await fetch(SOURCE_URL);
if (!res.ok) {
  console.error(`Fetch failed: ${res.status} ${res.statusText}`);
  process.exit(1);
}

const text = await res.text();
writeFileSync(dest, text, 'utf8');

const words = text.split(/\s+/).length;
console.log(`Saved ${text.length} chars (~${words} words) to prompts/claude-code-original.txt`);
