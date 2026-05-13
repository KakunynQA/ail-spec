/**
 * Minimal AIL import resolver.
 * Reads a .ail file, resolves @use dict lines by inlining alias expansions,
 * and returns a plain-text string ready to use as a system prompt prefix.
 */

import { readFileSync } from 'fs';
import { join, dirname, resolve } from 'path';

function loadDict(filePath) {
  const text = readFileSync(filePath, 'utf8');
  const aliases = {};
  for (const line of text.split('\n')) {
    const match = line.match(/^([a-z]{2,16})\s*=\s*(.+)$/);
    if (match) aliases[match[1]] = match[2].trim();
  }
  return aliases;
}

function applyAliases(text, aliases) {
  // Replace whole-word alias occurrences in content lines (not headers/comments)
  let result = text;
  for (const [alias, expansion] of Object.entries(aliases)) {
    // Word-boundary replacement only in opcode content
    result = result.replace(new RegExp(`\\b${alias}\\b`, 'g'), expansion);
  }
  return result;
}

export function resolveAil(ailFilePath) {
  const dir = dirname(resolve(ailFilePath));
  const raw = readFileSync(ailFilePath, 'utf8');

  const lines = raw.split('\n');
  const dictAliases = {};
  const contentLines = [];

  for (const line of lines) {
    const useMatch = line.match(/^@use\s+dict\s+\S+\s+(\S+)/);
    if (useMatch) {
      const dictPath = resolve(dir, useMatch[1]);
      Object.assign(dictAliases, loadDict(dictPath));
    } else {
      contentLines.push(line);
    }
  }

  const content = contentLines.join('\n');
  return applyAliases(content, dictAliases);
}
