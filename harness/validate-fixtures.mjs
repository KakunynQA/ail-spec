/**
 * Validates assertion fixtures without calling a model.
 *
 * Fixtures prove that the mechanical assertions can pass known-good outputs and
 * fail known-bad outputs. This is a small negative control for the v0 harness.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { scoreAssertions, taskPasses } from './assertions.mjs';

const __dir = dirname(fileURLToPath(import.meta.url));
const tasks = JSON.parse(readFileSync(join(__dir, 'tasks/claude-code.json'), 'utf8'));
const fixtures = JSON.parse(readFileSync(join(__dir, 'fixtures/claude-code.json'), 'utf8'));

const taskById = new Map(tasks.map(task => [task.id, task]));
let failures = 0;

for (const fixture of fixtures) {
  const task = taskById.get(fixture.task_id);
  if (!task) {
    console.log(`FAIL ${fixture.task_id}/${fixture.case}: missing task`);
    failures++;
    continue;
  }

  const scores = scoreAssertions([fixture.output], task.assertions);
  const actual = taskPasses(scores);
  const expected = fixture.expected_pass;
  const status = actual === expected ? 'PASS' : 'FAIL';
  console.log(`${status} ${fixture.task_id}/${fixture.case}: expected=${expected} actual=${actual}`);

  if (actual !== expected) {
    failures++;
    for (const score of scores) {
      console.log(`  ${score.id}: pass_rate=${score.pass_rate}`);
    }
  }
}

if (failures > 0) {
  console.error(`\nFixture validation failed: ${failures}/${fixtures.length}`);
  process.exit(1);
}

console.log(`\nFixture validation passed: ${fixtures.length}/${fixtures.length}`);
