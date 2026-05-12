# AIL

<p align="center">
  <img alt="Spec" src="https://img.shields.io/badge/Spec-AIL%200.8%20Draft-7c3aed?style=for-the-badge">
  <img alt="Created by Kakunyn" src="https://img.shields.io/badge/Created%20by-Kakunyn-111827?style=for-the-badge">
  <a href="LICENSE"><img alt="Code License" src="https://img.shields.io/badge/Code-MIT-2ea44f?style=for-the-badge"></a>
  <a href="LICENSE-SPEC"><img alt="Spec License" src="https://img.shields.io/badge/Spec-CC%20BY%204.0-0ea5e9?style=for-the-badge"></a>
</p>

<p align="center">
  <strong>Agent Instruction Language</strong><br>
  A compact, typed intermediate representation for AI instructions.
</p>

<p align="center">
  <a href="https://kakunyn.com">Kakunyn</a>
  ·
  <a href="QUICKSTART.md">Quick Start</a>
  ·
  <a href="SPEC.md">Specification</a>
  ·
  <a href="examples">Examples</a>
  ·
  <a href="benchmarks/system-prompt-leaks.md">Benchmarks</a>
</p>

---

## Why AIL

AI agents are increasingly controlled by large natural-language prompts, system prompts, `AGENTS.md` files, coding rules, architecture docs, and operational playbooks.

These instructions often become:

- too verbose
- expensive to send repeatedly as context
- hard to validate
- hard to compose
- hard to diff
- ambiguous for agents
- inconsistent across tools and teams

**AIL** solves this by defining a compact typed format for agent instructions.

AIL was created by [Kakunyn](https://kakunyn.com).

---

## Core idea

Natural language:

```text
You are a senior Go engineer reviewing this repository.

Focus on performance, architecture, and maintainability.
Do not change code initially.
Preserve public APIs and observable behavior.
Prefer small, reversible changes.
Check allocations, loops, locks, context usage, and goroutine leaks.
Return a summary, risks, findings, action plan, recommended patches, and validation commands.
```

AIL:

```text
@task go-review 0.8

@use dict base ./dicts/base.dict.ail
@use lib go ./libs/go.lib.ail

R senior go engineer
F perf arch maint
G review repo improve quality without behavior change

B initial edit
M preserve pub api obs behavior
P small reversible changes
C alloc loops locks ctx goroutine leaks
O summary risks findings action plan patches validation commands
```

---

## Quick start

Use AIL with an LLM that can fetch URLs:

```text
Use the AIL conversion rules from:

https://raw.githubusercontent.com/KakunynQA/ail-spec/main/libs/conversion.lib.ail

Also use the base dictionary:

https://raw.githubusercontent.com/KakunynQA/ail-spec/main/dicts/base.dict.ail

Convert the following prompt into valid AIL 0.8.

Rules:
- Preserve meaning.
- Do not invent requirements.
- Do not remove constraints.
- Return only AIL.

Prompt:

[PASTE PROMPT HERE]
```

See the full guide in [`QUICKSTART.md`](QUICKSTART.md).

---

## Referencing other rules

AIL references reusable rules, dictionaries, and context with `@use`.

```text
@use dict base ./dicts/base.dict.ail
@use lib go ./libs/go.lib.ail
@use ctx arch ./docs/architecture.ctx.ail
```

Remote raw HTTPS references are valid:

```text
@use lib conversion https://raw.githubusercontent.com/KakunynQA/ail-spec/main/libs/conversion.lib.ail
```

Use raw URLs, not HTML GitHub pages.

Recommended:

```text
https://raw.githubusercontent.com/KakunynQA/ail-spec/main/libs/conversion.lib.ail
```

Not recommended:

```text
https://github.com/KakunynQA/ail-spec/blob/main/libs/conversion.lib.ail
```

---

## Design principles

1. Compact, but not opaque.
2. Human-readable and agent-readable.
3. ASCII-first.
4. Typed files over mixed-purpose documents.
5. Instructions are separate from context.
6. Reusable libraries are separate from project facts.
7. Dictionaries are separate from rules.
8. Validateable by tools.
9. Expandable back into natural language.
10. Meaning preservation beats maximum compression.

---

## File types

| Type | Purpose |
| --- | --- |
| `@task` | Operational instructions for an agent |
| `@lib` | Reusable rules and behavior |
| `@ctx` | Factual project context |
| `@dict` | Term aliases and vocabulary |

Rules:

- `@task` can instruct.
- `@lib` can instruct.
- `@ctx` can only inform.
- `@dict` can only define aliases.

---

## Core opcodes

| Opcode | Meaning |
| --- | --- |
| `R` | role |
| `G` | goal |
| `F` | focus |
| `M` | must |
| `B` | ban |
| `P` | prefer |
| `A` | avoid |
| `C` | check |
| `T` | task |
| `O` | output |
| `W` | when |
| `X` | command |
| `H` | hypothesis |
| `N` | note |

Opcodes are fixed by the specification. Projects must not redefine them.

---

## Token economy

AIL reduces repeated instruction overhead by removing natural-language ceremony while preserving operational meaning.

| Input type | Natural language | AIL | Estimated savings |
| --- | ---: | ---: | ---: |
| Small prompt | 300-700 tokens | 180-450 tokens | 20%-45% |
| Medium `AGENTS.md` | 1,500-4,000 tokens | 600-1,800 tokens | 40%-65% |
| Large system prompt | 5,000-12,000 tokens | 1,800-5,000 tokens | 45%-70% |
| Architecture/playbook context | 10,000+ tokens | 3,000-6,000 tokens | 40%-70% |

Exact savings depend on the tokenizer and model. AIL should be benchmarked against the target model before exact claims.

Manual measurement tools:

| Target | Tool |
| --- | --- |
| GPT / OpenAI models | https://platform.openai.com/tokenizer |
| Claude-style estimates | https://token-calculator.net/token-calculator |

### Break-even model

AIL is most valuable when instructions are reused.

```text
break_even_uses = conversion_overhead / savings_per_use
```

Example:

```text
conversion overhead: 2,000 tokens
natural prompt: 4,000 tokens
AIL prompt: 1,600 tokens
savings per use: 2,400 tokens

break_even_uses = 2,000 / 2,400
break_even_uses = 0.83
```

In this case, AIL pays for itself in the first reuse.

---

## Public prompt benchmark

AIL includes representative benchmark samples based on public long-form system prompt collections, including [`asgeirtj/system_prompts_leaks`](https://github.com/asgeirtj/system_prompts_leaks).

The benchmark files do **not** copy full leaked prompts into this repository. They compress the same instruction classes into AIL: role, safety boundaries, style, task workflow, tool policy, code conventions, validation rules, and output requirements.

See:

```text
benchmarks/system-prompt-leaks.md
examples/benchmarks/
```

Initial representative results:

| Prompt family | Source style | Estimated original | AIL sample | Estimated savings |
| --- | --- | ---: | ---: | ---: |
| Claude Code-style agent | long coding CLI system prompt | 7k-12k | 700-1.2k | 80%-90% |
| Codex-style coding agent | repo editing and validation prompt | 5k-10k | 650-1.1k | 78%-88% |
| Gemini CLI-style agent | CLI workflow prompt | 4k-9k | 600-1k | 75%-88% |
| Copilot CLI-style agent | command assistant prompt | 2k-5k | 400-800 | 60%-84% |
| Grok-style assistant | general assistant prompt | 3k-8k | 500-900 | 70%-88% |

These are estimates until the reference tokenizer benchmark is implemented.

---

## Local fallback

Use this when the agent has access to repository files.

```text
Use ./ail/libs/conversion.lib.ail and ./ail/dicts/base.dict.ail.
Convert the following prompt into valid AIL 0.8.
Save the result as AGENTS.ail.

Prompt:

[PASTE PROMPT HERE]
```

---

## Copy-paste fallback

Use this when the LLM cannot fetch URLs or read local files.

```text
Use AIL 0.8.

AIL means Agent Instruction Language.

Convert the prompt below into AIL.

Rules:
- Start with `@task <name> 0.8`.
- Use only these opcodes:
  R role
  G goal
  F focus
  M must
  B ban
  P prefer
  A avoid
  C check
  T task
  O output
  W when
  X command
  H hypothesis
  N note
- Preserve meaning.
- Do not invent requirements.
- Do not remove constraints.
- Convert obligations to M.
- Convert prohibitions to B.
- Convert preferences to P.
- Convert checks to C.
- Convert outputs to O.
- Use short English terms.
- Use ASCII only.
- Return only AIL.

Prompt:

[PASTE HERE]
```

---

## Reference policy

AIL files may reference external AIL resources using raw HTTPS URLs.

For long-lived production prompts, pin a commit SHA or version tag instead of using `main`.

```text
https://raw.githubusercontent.com/KakunynQA/ail-spec/<commit-sha>/libs/conversion.lib.ail
```

| Reference | Use case | Stability |
| --- | --- | --- |
| `main` raw URL | quick adoption, latest rules | moving |
| version tag raw URL | stable AIL version | stable |
| commit SHA raw URL | reproducible prompts | strict |
| local vendored file | repo-controlled agents | strict |

---

## Recommended repository convention

```text
AGENTS.md
AGENTS.ail
ail/
  dicts/
  libs/
docs/
  ARCH.md
  ARCH.ctx.ail
```

Rule:

```text
.md = human documentation
.ail = compact agent-readable instruction/context
```

---

## What AIL is for

AIL is designed for:

- system prompts
- agent instructions
- `AGENTS.ail`
- project context
- architecture summaries
- coding rules
- QA playbooks
- prompt libraries
- MCP tool instructions
- reusable agent behavior

## What AIL is not for

AIL is not ideal for:

- prose documentation
- marketing copy
- legal contracts
- user-facing explanations
- arbitrary datasets
- tables better represented by CSV, JSON, or TOON-like formats

---

## Status

AIL 0.8 is a draft.

The current priority is specification correctness, strict boundaries, and validation rules.

Breaking changes are expected before 1.0.

---

## License

Specification and documentation: CC BY 4.0  
Code, examples, and tooling: MIT
