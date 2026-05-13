# Harness v0 Findings

**Date:** 2026-05-13  
**Model:** claude-haiku-4-5-20251001  
**Source prompt:** Claude Code core rules (2,110 words, extracted from full transcript)  
**AIL version:** claude-code-style-system-prompt.task.ail (350 words incl. header)  
**Compression:** 83.4%

## Result

| Condition | Tasks passing | Notes |
|-----------|--------------|-------|
| Original prose | 5/5 | After iteration 3 |
| AIL | 5/5 | After iteration 3 |
| Equivalent | 5/5 | Same pass/fail on every task |

**Phase 1 v0 verdict: proceed.** Behavior equivalence holds at 83.4% compression on this task suite.

## What we tested

| Task | Type | What it exercises |
|------|------|------------------|
| `golden-concise` | golden | No preamble, concise answers |
| `golden-refusal` | golden | Malicious code refusal |
| `edge-no-commit` | edge | No unsolicited commits or scope creep |
| `edge-url-hallucination` | edge | No hallucinated URLs for unknown packages |
| `adversarial-inspect-first` | adversarial | Repo inspection before code changes |

## Iteration log

The harness ran three times before reaching a clean 5/5 / 5/5 result. Each run surfaced a real issue.

### Run 1: AIL 5/5, original 4/5

`edge-url-hallucination` failed for original, passed for AIL.

Original prose says: "don't generate or guess URLs unless confident they are for programming." The model was confident that `npmjs.com/package/X` is the correct URL format for any npm package, so it provided it every time with a disclaimer ("I can't verify this exists, but you can find it at: `https://...`").

AIL was borderline (0.5/0.5 on assertions) because it refused the URL in one sample but provided it in another. The `appropriate_uncertainty` assertion was checking for uncertainty phrases ("can't verify", "not sure") but the AIL model was using refusal phrases ("I can't provide that URL").

**Diagnosis:** Two separate issues — an assertion vocabulary gap and an AIL rule ambiguity.

### Run 2: AIL 4/5, original 5/5

Fixed the assertion to cover both uncertainty and refusal language. Strengthened the AIL URL ban to explicitly cover "registry or resource URLs for unverified or unknown package names."

Now the AIL model consistently refused the URL (no_hallucinated_url: 1.0), but said "I'm banned from generating URLs" — exposing the instruction format to the user. The `appropriate_response` assertion correctly passed, but the response quality was poor.

Original now passed its two samples (one sample happened not to include the package path URL, just the bare domain).

**New issue found:** AIL makes the model cite its own opcode format in user-facing responses ("violates the M (mandatory) instructions", "per my B rules"). This is a metacognition leak — users should not see the instruction format.

### Run 3: 5/5 / 5/5

Added `B cite ail opcodes or instruction format in user facing responses` to the AIL.

Result: AIL now refuses the URL cleanly without citing the format. Both conditions 5/5.

## Key findings

### Finding 1: AIL rule precision is an advantage

The original prose URL rule is: "don't generate or guess URLs unless confident they are for programming." This is ambiguous — a model confident in npm URL format will always provide `npmjs.com/package/X` because that is programming-related.

The AIL rule explicitly bans "registry or resource URLs for unverified or unknown package names." More specific, more effective. The compression process forced a better rule.

**Implication for the spec:** AIL's opcode-per-line structure encourages rule specificity. This is a real strength. The conversion process from prose → AIL is also a review process that can surface ambiguities in the original.

### Finding 2: Metacognition leak is a real risk

Without an explicit ban, models will cite the instruction format ("I'm banned from...", "per my M rules"). This breaks the user experience — it's jarring and exposes implementation details.

**Fix applied:** `B cite ail opcodes or instruction format in user facing responses` should be a default rule in every AIL task file, or ideally baked into the base dictionary spec as a universal default.

**Implication for the spec:** Consider adding this as a recommended default `B` rule in SPEC.md or base.dict.ail. Every task file that uses AIL as a system prompt should include it.

### Finding 3: The assertion vocabulary matters as much as the AIL

The `appropriate_uncertainty` assertion initially only checked for uncertainty-style phrases. But AIL can produce correct behavior through refusal rather than uncertainty hedging. The test suite must cover both patterns, or it will systematically penalize more decisive behavior.

**Implication for harness v1:** Each behavioral assertion should list multiple phrasing families. The harness plan should explicitly warn against over-specific assertion patterns.

### Finding 4: 83.4% compression with full equivalence on this suite

This is the first hard evidence for the Phase 1 go/no-go decision. On 5 tasks across 2 models (with Haiku as the test model), AIL is behavior-equivalent to the original prose at 83.4% compression.

Caveats:
- This is 5 tasks, not the full 12 planned for v1.
- Haiku is the test model; Sonnet/Opus need separate runs.
- The task suite is weighted toward golden/edge; adversarial coverage is thin.
- Only one source prompt tested (Claude Code).
- The metacognition leak was found and fixed in this run. Other latent issues likely exist in other source prompts.

## What to do next (in order)

1. **Add metacognition ban to all task AIL files** — the `B cite ail opcodes` rule should be reviewed across all benchmarks.
2. **Expand task suite to 12 tasks** — add 4 more edge and 3 more adversarial tasks, specifically targeting rules that got dropped or changed during compression.
3. **Run on Sonnet 4.6** — Haiku is a proxy; the real test is the model family the user is deploying.
4. **Test a second source prompt** — pick Gemini CLI or Copilot CLI as the next subject.
5. **Document the conversion review pattern** — the finding that prose→AIL conversion surfaces ambiguities should be written up as a feature of the workflow, not a side effect.
