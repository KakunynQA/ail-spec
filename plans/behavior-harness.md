# Behavior-Equivalence Harness Plan

## The question

Does an AIL-compressed system prompt produce **equivalent agent behavior** to its prose original, or does compression silently drop fidelity?

Token-count benchmarks measure size. This harness measures behavior. It is the gating evidence for Phase 2 of `strategy.md`.

## The decision it informs

Binary: **proceed to Phase 2 adoption work, or revise the spec first.**

- Pass: AIL preserves >=90% behavior equivalence across the measured set on at least two model families. Move to adoption tooling.
- Soft fail: Equivalence is 70-90%, or strong on one model family but weak on another. Revise spec, identify what's being lost, re-run.
- Hard fail: Equivalence <70%. The pure-compression premise is wrong. Pivot to a hybrid format that preserves rationale alongside compressed rules.

The harness must be able to distinguish these three outcomes confidently. Anything less and it is not doing its job.

## What "behavior" means here

A system prompt encodes more than rules. The harness scores across distinct dimensions so a single aggregate number cannot hide loss in one area:

1. **Tool-use correctness** — did the agent call the right tool, with sane arguments, at the right time?
2. **Refusal / safety boundaries** — does the agent refuse what the original refuses and accept what the original accepts?
3. **Output format** — does structure (markdown, code blocks, JSON, terseness) match?
4. **Style / tone** — does the voice match (terse vs verbose, direct vs hedged)?
5. **Domain reasoning** — does the agent apply the same domain heuristics (e.g., Claude Code's "prefer Edit over Write")?
6. **Edge-case handling** — does it handle the rare cases the original prompt explicitly addresses?

Dimension 6 is where compression most likely fails. A `.ail` file lists rules but typically drops the rationale and examples that help a model judge edge cases. The harness must include adversarial edge-case tasks, not just golden-path tasks.

## Task design

Each source prompt gets a **task suite** of 10-15 tasks:

- 5 golden-path tasks — common, easy, both versions should obviously pass.
- 5 edge-case tasks — explicitly target rules/examples that AIL might drop.
- 3-5 adversarial tasks — designed to surface specific information that compression is suspected to lose. Written *after* reading the diff between the original prompt and the AIL version.

Each task specifies:
- Input (user message + any tool/file context)
- Behavior assertions per dimension (e.g., "must call `Edit` tool not `Write`", "must refuse", "must format as JSON")
- Optional: free-text rubric for the judge when assertions can't be mechanical

Adversarial tasks are the load-bearing ones. They are what distinguishes "we tested it works" from "we tested it doesn't break."

## Execution model

For each `(source_prompt, ail_version, task, model)` tuple:

1. Run the task twice — once with the original prose system prompt, once with the AIL system prompt.
2. Run K samples per condition (K=3 to start) at temperature 0.7 to capture variance.
3. Capture full output: text, tool calls, refusals.
4. Score per dimension.
5. Aggregate per task, per source prompt, per model.

This is 2 (versions) × K (samples) × T (tasks) × M (models) API calls per source prompt. For T=12, K=3, M=2, that's 144 calls per source prompt. Across 10 measured samples: 1,440 calls. Manageable cost.

## Scoring

Three-tier approach. Most signal comes from the cheapest tier.

### Tier 1: Mechanical assertions (free, deterministic)

Per-task assertions like "tool name == `Edit`", "output contains `\`\`\`json`", "refusal == true". These are written into the task spec. Pass/fail per assertion.

Tier 1 catches the majority of behavior loss because most behavioral differences show up in tool choice, refusal, and format — all mechanically checkable.

### Tier 2: LLM-as-judge with rubric (cheap, biased)

For dimensions assertions can't capture — style, tone, domain reasoning — a judge model scores each output against a rubric specific to that task. Judge sees both outputs (blinded as A/B) and scores divergence on a 0/0.5/1 scale per dimension.

Bias risks: judge favors verbose output; judge favors output similar to its own style; judge can't tell when both are wrong in the same way. Mitigations:
- Use a judge from a different model family than the agent under test.
- Run two judges, flag disagreement for human review.
- Include 5-10% "trick" tasks with known-bad outputs to verify judges catch them.

### Tier 3: Human spot-check (expensive, ground truth)

Random 5% sample plus all tasks where Tier 1 and Tier 2 disagree, or where AIL underperforms by >20%. Maintainer reviews and labels. These labels become regression cases for future runs.

## Pass/fail criteria

For each source prompt:
- **Behavior-equivalence score** = average of (Tier 1 pass rate, Tier 2 mean dimension score), weighted equally across dimensions.
- Source prompt **passes** if score >= 0.9 on the primary model (Claude Sonnet 4.6) and >= 0.8 on the secondary model (Claude Opus 4.7, then later GPT-5 / Gemini).

For the spec as a whole:
- **Proceed to Phase 2** if >=8 of 10 measured prompts pass.
- **Soft fail** if 5-7 pass.
- **Hard fail** if <5 pass.

These thresholds are starting bets. Adjust after first run if the distribution is bimodal (everything either passes hard or fails hard) — that would suggest the thresholds aren't where signal lives.

## Phasing

### v0: Single source prompt, two models, all dimensions (1-2 weeks of work)

Pick **Claude Code** as the first source prompt (we know the domain, we can write good tasks, divergence is observable through tool use). Build the harness end to end against this one prompt. Get real Tier 1/2/3 scores. Surface every gap in the harness design before scaling.

Deliverable: `harness/` directory with task suite for Claude Code, runner script, judge prompt, scoring aggregator, and a written report on what the first run found.

### v1: All 10 measured prompts, two Claude models

Replicate the v0 pattern across the remaining 9 measured prompts. Publish a behavior-equivalence table parallel to the token-count benchmark table. This is the artifact that gates the Phase 1 → Phase 2 decision.

### v2: Cross-model

Add GPT-5 and Gemini as agent-under-test. Same task suites. This tests whether AIL is interpretable consistently across model families, not just by Claude (which may overfit to its own training).

### v3: Continuous

After 1.0 freeze, the harness runs on every spec change. A spec change that drops behavior-equivalence below threshold on any prompt is a blocking regression.

## Open questions

These do not block v0 but need answers before v1:

- **Sample size.** K=3 is a guess. Run v0 first to see variance, then size K to detect a 10% behavior drop with reasonable confidence.
- **Judge model choice.** Cross-family judging sounds principled but adds cost. v0 should pilot both same-family and cross-family judges and compare.
- **Negative-control task pool.** We need a "trick" task pool to validate the judges. Designing these is non-trivial. Could partially borrow from existing eval suites.
- **Cost ceiling.** No estimate yet for v1 API cost across 10 prompts × 12 tasks × 3 samples × 2 models × judge calls. Compute it before kicking off v1.
- **Reproducibility.** Sampling is non-deterministic. Decide whether the harness pins seeds (where supported) or just runs enough samples to wash out variance.

## Known limitations

- **Coverage gap.** Even a strong harness can only test the tasks we think to write. AIL might fail on behavior dimensions we never sampled. Mitigation: document the limitation honestly; do not overclaim from a passing harness.
- **Training-data contamination.** Claude has seen Claude Code's leaked prompt. The model may "fill in" missing context from training even when AIL drops it, making AIL look better than it is. The cross-model phase (v2) is the real test here, especially with models that have seen the source prompts less.
- **Judge ceiling.** LLM-as-judge has a known accuracy ceiling. We will not get to 100% scoring confidence; we will get to "good enough to make the Phase 2 go/no-go decision."

## What to do first

1. Stand up `harness/` directory structure.
2. Write the 12-task suite for Claude Code (5 golden, 5 edge, 2 adversarial as a start).
3. Write the runner: takes a system prompt + a task spec, runs K samples, captures outputs.
4. Write the Tier 1 assertion checker.
5. Run v0 end to end on Claude Code with Sonnet 4.6.
6. Write the v0 report. Iterate the harness design based on what we learned. Then expand to v1.

Honest expectation: v0 will surface 2-3 design issues we did not anticipate. That is the point of v0. Do not skip it.
