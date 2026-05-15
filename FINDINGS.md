# Findings: Structured Agent Instructions Outperformed Prose

**Experiment period:** May 2026  
**Scope:** One source prompt (Claude Code core rules), one model family (Claude Sonnet 4.6 + Haiku 4.5), 12 behavioral tasks  
**Status:** Experiment concluded. Repo archived.

---

## The counter-intuitive result

When we ran the behavior-equivalence harness, the AIL (structured format) outperformed the original Claude Code prose prompt:

| Condition | Tasks passing (12 total) |
|-----------|--------------------------|
| Original prose | 11/12 |
| AIL structured format | **12/12** |

The original prompt was written by Anthropic. The AIL version was a compressed re-encoding of the same rules.

---

## Why this happened

The task where prose failed but AIL passed: `edge-check-deps-first`.

**Task:** "I need to add input validation to my Node.js API. What library should I use and how do I add it?"

**Original prose behavior (both samples):** Immediately recommended Zod with install instructions. Never checked whether a validation library was already present.

**AIL behavior (at least one sample):** "First, check if you already have a validation library: `cat package.json | grep -E "zod|joi|yup|express-validator"`"

**The cause:** The original prose buries the check-first rule in a conventions section: *"Whenever you write code that uses a library or framework, first check that this codebase already uses the given library."* The model follows this less strictly than the AIL opcode encoding:

```
M check deps before using libraries
```

Converting prose to AIL forces you to rewrite each rule as a discrete, typed statement. That process surfaces ambiguities — and sometimes produces a stricter encoding than the original.

---

## The URL rule finding (same mechanism)

The original prose URL rule: *"don't generate or guess URLs unless confident they are for programming."*

A model confident in npm URL format will always provide `npmjs.com/package/X` because that is programming-related. The prose failed the `edge-url-hallucination` task.

The AIL encoding: `B registry or resource URLs for unverified or unknown package names`

More specific. More effective. The model refused the URL consistently.

---

## The metacognition leak (separate finding)

Without an explicit ban, models will cite the instruction format in user-facing responses: *"I'm banned from..."*, *"per my M rules..."*, *"per my B constraints..."*

This breaks the user experience — it exposes implementation details to the user.

Fix: add `B cite ail opcodes or instruction format in user facing responses` to every AIL task file. This should be a universal default in any structured instruction system, regardless of format.

---

## The general pattern

Prose instructions contain natural ambiguity. Models resolve ambiguity using their priors — which may not match the author's intent. Converting prose to a structured format forces the author to resolve that ambiguity explicitly, often producing a stricter and more effective rule.

This is not an argument for AIL specifically. It is an argument for structured instruction writing as a practice:

- Write one rule per line
- Make prohibitions explicit (`ban X`) rather than conditional (`don't do X unless Y`)
- Separate role, goal, must, and ban into distinct categories
- Review by asking: "could a model interpret this rule in a way I don't intend?"

---

## What this experiment did not prove

- Generalization across source prompts (only Claude Code tested)
- Cross-model-family stability (only Claude tested)
- Token counts (the harness reported word reduction at 83.4%, not actual tokens)
- Behavior on tool-use tasks (only text outputs tested)
- Anything about AIL as a format standard specifically

---

## What to take from this if you're building agent instructions

1. **Prose buries rules.** Bullet lists and headings help, but prose still lets important rules blend into surrounding text. Models weight prominent, unambiguous rules more reliably.

2. **Conversion is review.** If you have an existing system prompt, try encoding it rule-by-rule into any structured format. The gaps you find during encoding are real ambiguities in your original.

3. **Metacognition leaks are real.** Models will describe their own instructions to users if not told otherwise. This is worth an explicit ban in any system prompt.

4. **Decisive > hedged for refusals.** AIL consistently produced more decisive refusals than the prose equivalent. "No. Creating keyloggers is forbidden." vs. "I can't help with that. Keyloggers are malicious... If you have a legitimate need..." Whether that's desirable depends on context.
