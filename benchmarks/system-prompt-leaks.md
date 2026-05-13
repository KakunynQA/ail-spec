# Public System Prompt Benchmark

This benchmark tracks how AIL can compress long-form system prompts into compact typed instruction files.

Source collection:

```text
https://github.com/asgeirtj/system_prompts_leaks
```

AIL does not copy full leaked prompts into this repository. The samples here are representative conversions of instruction classes, not verbatim derivatives.

## Measurement status

**Both AIL and source prompt token counts are now measured using GPT-4 tokenizer (cl100k_base).**

The benchmark script automatically fetches source prompts from the system_prompts_leaks repository and measures their tokens.

Run the benchmark:
```bash
cd benchmarks
npm install
npm run benchmark
```

For manual verification, use:
- GPT tokenizer: https://platform.openai.com/tokenizer
- Claude token calculator: https://token-calculator.net/token-calculator

Exact values vary by model tokenizer, prompt formatting, hidden tool schemas, and runtime injection.

## Initial benchmark table

**Both AIL and source prompt token counts are measured using GPT-4 tokenizer (cl100k_base).**
**Source prompts are automatically fetched from the system_prompts_leaks repository.**

### Measured Samples

| Source prompt | Source path | AIL sample | Source tokens | AIL tokens | Measured savings |
| --- | --- | --- | ---: | ---: | ---: |
| Claude Code | `Anthropic/claude-code.md` | `examples/benchmarks/claude-code-style-system-prompt.task.ail` | 11,186 | 409 | 96.3% |
| Claude Desktop Code | `Anthropic/claude-desktop-code.md` | `examples/benchmarks/claude-desktop-code-style-system-prompt.task.ail` | 10,730 | 247 | 97.7% |
| Claude Design | `Anthropic/claude-design.md` | `examples/benchmarks/claude-design-style-system-prompt.task.ail` | 13,988 | 190 | 98.6% |
| Codex GPT-5 | `OpenAI/codex/gpt-5.md` | `examples/benchmarks/codex-style-system-prompt.task.ail` | 4,434 | 289 | 93.5% |
| Codex Plan Mode | `OpenAI/codex/plan_mode.md` | `examples/benchmarks/codex-plan-mode-style-system-prompt.task.ail` | 1,760 | 192 | 89.1% |
| Gemini CLI | `Google/gemini-cli.md` | `examples/benchmarks/gemini-cli-style-system-prompt.task.ail` | 5,772 | 216 | 96.3% |
| Gemini Workspace | `Google/gemini-workspace.md` | `examples/benchmarks/gemini-workspace-style-system-prompt.task.ail` | 4,371 | 181 | 95.9% |
| Copilot CLI | `Misc/copilot-cli.md` | `examples/benchmarks/copilot-cli-style-system-prompt.task.ail` | 15,036 | 229 | 98.5% |
| Perplexity Comet | `Perplexity/comet-browser-assistant.md` | `examples/benchmarks/perplexity-comet-browser-assistant.task.ail` | 5,077 | 226 | 95.5% |
| GPT-4.1 | `OpenAI/GPT-4.1.md` | `examples/benchmarks/gpt-4-1-style-system-prompt.task.ail` | 8,921 | 189 | 97.9% |

### Family Samples (No Single Source)

| Sample | AIL file | AIL tokens | Notes |
| --- | --- | ---: | ---: |
| Browser Assistant Family | `examples/benchmarks/browser-assistant-family.task.ail` | 209 | Aggregates Gemini/Claude in Chrome, Perplexity Comet |
| Coding CLI Agent Family | `examples/benchmarks/coding-cli-agent-family.task.ail` | 243 | Aggregates Claude Code, Codex CLI, Gemini CLI, Copilot CLI |
| General Assistant Style | `examples/benchmarks/general-assistant-style-system-prompt.task.ail` | 236 | Aggregates Meta AI, Notion AI, Grok, GPT-4.1 |

### Planned samples

| Source prompt | Source path | Status |
| --- | --- | --- |
| Claude in Chrome | `Anthropic/claude-in-chrome.md` | planned |
| Claude Sonnet raw | `Anthropic/raw/claude-sonnet-4.6-raw.md` | planned |
| Gemini 3 Pro | `Google/gemini-3-pro.md` | planned |
| Codex GPT-5.1 | `OpenAI/codex/gpt-5.1.md` | planned |
| Codex GPT-5.2 | `OpenAI/codex/gpt-5.2.md` | planned |
| o3 | `OpenAI/o3.md` | planned |
| o4-mini | `OpenAI/o4-mini.md` | planned |
| Grok personas | `xAI/grok-personas.md` | planned |
| Grok 4.1 beta | `xAI/grok-4.1-beta.md` | planned |
| Grok 4.3 beta | `xAI/grok-4.3-beta.md` | planned |
| Amp Code | `Misc/amp-code.md` | planned |
| OpenCode | `Misc/opencode.md` | planned |
| T3 Code | `Misc/t3-code.md` | planned |
| Meta AI | `Misc/meta-ai.md` | planned |
| Notion AI | `Misc/notion-ai.md` | planned |
| Proton Lumo AI | `Misc/proton-lumo-ai.md` | planned |

### Summary Statistics

**Measured samples:** 10
**Average savings:** **95.7%**
**Range:** 89.1% - 98.6%
**Total source tokens:** 81,775
**Total AIL tokens:** 2,459
**Overall compression:** 97.0%

## Benchmark rule

For every benchmarked prompt:

1. Link to the source prompt.
2. Do not copy full prompt text into this repository.
3. Create a representative `@task` AIL file.
4. Add source URL as a comment in the AIL file.
5. Measure source tokens and AIL tokens with a declared tokenizer.
6. Mark estimates clearly until measured.

## Formula

```text
savings_percent = (source_tokens - ail_tokens) / source_tokens * 100
break_even_uses = conversion_overhead / savings_per_use
```
