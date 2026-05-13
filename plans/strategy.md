# AIL Strategy: From Spec to Standard

## What success looks like

AIL is considered "done" when major agent platforms — Claude, Codex, Gemini, Grok, Cursor, Copilot — natively recognize `.ail` files as a first-class instruction format, the way they currently recognize `CLAUDE.md` / `AGENTS.md`. At that point this repository's job is finished: the spec exists, the ecosystem uses it, and maintenance moves into a standards-body or community-governance mode.

This is a several-year goal, not a quarter goal. The strategy below is built around what would actually need to be true for it to happen.

## Why this could work

- **The pain is real and growing.** Context windows are big, but instruction files are read on every session and grow with every project. Token cost is felt by both vendors (inference cost) and users (latency, cache churn, $).
- **The benchmark data is striking.** Measured 89-98% compression across 10 leaked system prompts (95.7% average). Even if half the savings are illusory once we test behavior equivalence, the remaining half is still significant.
- **No incumbent.** There is no compact-instruction standard. CLAUDE.md, AGENTS.md, .cursorrules, .windsurfrules are all prose. The slot is open.
- **Vendor incentive is aligned.** Vendors pay for tokens they generate, but caching plus longer sessions still leave cold-start and cache-write costs. A format that cuts those by 90% is interesting to them too, not just to users.

## Why it could fail

These are the things that kill this project. Each one needs an answer.

1. **Behavior loss.** 95% compression that drops 5% of behavior fidelity is worse than no compression. The benchmarks measure tokens, not behavior. **This is the load-bearing risk.**
2. **Model interpretation drift.** AIL is not in any model's training data uniformly. Models infer meaning from context. Different models may interpret the same `.ail` file differently. Without a way to test this, the format is fragile.
3. **Adoption flywheel never starts.** A standard with no users is just a document. If no real project uses `.ail` for CLAUDE.md, vendors have no reason to look at it.
4. **Spec churn.** If the spec keeps changing, no one will commit to it. Pre-1.0 is fine; post-1.0 the spec must stabilize aggressively.
5. **Anthropic / OpenAI / Google ship their own.** A vendor could publish a competing format in a weekend and win by distribution alone. The defense is being first, being neutral, and being demonstrably better.

## Strategy: the three flywheels

Adoption needs three flywheels turning. Each one supports the others.

### Flywheel 1: Evidence

Vendors do not adopt formats based on token-count tables. They adopt based on behavior equivalence under load. This flywheel produces that evidence.

- **Behavior-equivalence harness.** Pick N tasks per source prompt. Run them against the original prompt and the AIL version with the same model. Score divergence. Publish results alongside token counts.
- **Multi-model verification.** Same AIL file, multiple models (Claude, GPT, Gemini, open-weight). Score how consistently each model interprets it. This is the "is it actually portable" test.
- **Cache-aware cost model.** Token savings under prompt caching are smaller than naive math suggests. Publish honest numbers: cold-start savings, cache-write savings, steady-state savings.

If the evidence holds, the spec sells itself. If it doesn't, we learn what to fix before pushing further.

### Flywheel 2: Adoption surface

The format has to be trivial to use in real projects before anyone will use it.

- **Convention: CLAUDE.md + CLAUDE.ail.** CLAUDE.md stays human-readable (intro + pointer). CLAUDE.ail holds the compressed instructions. Document this in the spec as the canonical pattern.
- **SessionStart hook.** A reference hook that auto-loads `CLAUDE.ail` (or `AGENTS.ail`) into Claude Code sessions on every project. One config in user settings, works everywhere.
- **`/ail-init` skill.** A skill that converts an existing CLAUDE.md into CLAUDE.ail using the spec. No CLI, no MCP — just a skill any Claude Code user can install.
- **Reference parsers.** Small, dependency-free AIL parsers in TypeScript, Python, and Go. Not a CLI suite — just enough that anyone can integrate AIL into any tooling.

The bar is: a developer who has never heard of AIL should be able to adopt it in their project in under five minutes.

### Flywheel 3: Visibility

Standards die in the dark. This is the part most spec projects neglect.

- **Public benchmark dashboard.** A web page that shows live token-and-behavior savings across all measured prompts. Updated whenever new samples are added. The link that gets shared in every conversation about AI instruction files.
- **Case studies.** Real projects that converted CLAUDE.md to CLAUDE.ail, with measured before/after on real workloads (latency, cost, behavior). Two or three credible ones are worth more than fifty toy examples.
- **Show up where the conversation happens.** Hacker News, the Claude Code subreddit, the relevant Discords. Not for marketing — for honest engagement. "Here's the data, here's the spec, here's what we got wrong."

## Phased roadmap

Phase durations are placeholders; the gating is on milestones, not calendar.

### Phase 1: Honest evidence (now → spec freeze candidate)

Goal: prove or disprove that AIL preserves behavior, not just compresses tokens.

- Build the behavior-equivalence harness (task suite + scorer).
- Run it against the 10 measured samples on Claude (Opus + Sonnet).
- Run a subset on GPT-5 / Gemini to test cross-model interpretation.
- Publish results, including any negative findings.
- If results are strong: declare spec freeze candidate v0.9 and move to Phase 2. If weak: revise spec, repeat.

**Exit criteria:** Behavior-equivalence score >= 90% on the measured set, across at least two model families.

### Phase 2: Frictionless adoption (spec v0.9 → 1.0)

Goal: any developer can use AIL in their project in five minutes.

- Ship the SessionStart hook (reference implementation).
- Ship the `/ail-init` skill.
- Ship TypeScript + Python parsers.
- Document the CLAUDE.md / CLAUDE.ail convention in SPEC.md.
- Get 10 real projects (not toy repos) using AIL for their CLAUDE.md.

**Exit criteria:** 10 external adopters, parser libraries published, zero open spec ambiguities raised in the last month.

### Phase 3: 1.0 freeze and visibility push (1.0 → external recognition)

Goal: make the spec impossible for major vendors to ignore.

- Tag SPEC.md v1.0. Commit to no breaking changes without a major bump.
- Launch the public benchmark dashboard.
- Publish 2-3 case studies with hard numbers.
- Submit conference / blog talks. Engage vendors directly with the data.
- Open a governance discussion: who owns the spec long-term?

**Exit criteria:** At least one vendor publicly references AIL (positively or as competition — both count as recognition).

### Phase 4: Standards path

Goal: hand the spec off to a neutral home so vendors can adopt without political risk.

- Move governance to a neutral org (foundation, working group, RFC process — TBD).
- Establish a versioning and deprecation policy.
- This repository becomes the reference implementation, not the source of truth.

**Exit criteria:** Independent governance is functioning. This repo's purpose is complete.

## What to do next (concretely)

1. Archive `plans/mcp-vs-cli-analysis.md` — done.
2. Decide: is Phase 1 (behavior harness) the next phase to start, or do we want Phase 2 adoption work to happen in parallel? My read: Phase 1 first. Without the evidence, Phase 2 is building on sand.
3. Draft the behavior-equivalence harness design as the next planning doc (`plans/behavior-harness.md`).
4. Pick the first three tasks per sample prompt — concrete, scorable, not subjective.

## Honest caveat

This is a credible path but not a guaranteed one. The single biggest unknown is Phase 1: whether AIL actually preserves behavior at the compression ratios the benchmarks claim. Every other phase assumes it does. If Phase 1 finds significant behavior loss, the whole plan resets around a hybrid format (compressed rules + preserved rationale) rather than pure AIL.

The strategy is built to surface that answer early, before investing in adoption tooling that would be wasted if the core premise is wrong.
