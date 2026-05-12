# Public System Prompt Benchmark

This benchmark tracks how AIL can compress long-form system prompts into compact typed instruction files.

Source collection:

```text
https://github.com/asgeirtj/system_prompts_leaks
```

AIL does not copy full leaked prompts into this repository. The samples here are representative conversions of instruction classes, not verbatim derivatives.

## Measurement status

**AIL token counts are now measured using GPT-4 tokenizer (cl100k_base).**

Source prompt token counts still require manual measurement using:

- GPT tokenizer: https://platform.openai.com/tokenizer
- Claude token calculator: https://token-calculator.net/token-calculator

Exact values vary by model tokenizer, prompt formatting, hidden tool schemas, and runtime injection.

## Initial benchmark table

**AIL token counts measured with GPT-4 tokenizer (cl100k_base).**
**Source prompt token counts are estimates pending manual measurement.**

| Source prompt | Source path | AIL sample | Measured AIL tokens | Est. original | Est. savings |
| --- | --- | --- | ---: | ---: | ---: |
| Claude Code | `Anthropic/claude-code.md` | `examples/benchmarks/claude-code-style-system-prompt.task.ail` | 409 | 7k-12k | 80%-90% |
| Claude Desktop Code | `Anthropic/claude-desktop-code.md` | planned | - | 6k-10k | 78%-88% |
| Claude Design | `Anthropic/claude-design.md` | planned | - | 3k-7k | 70%-85% |
| Claude in Chrome | `Anthropic/claude-in-chrome.md` | planned | - | 3k-7k | 70%-85% |
| Claude Sonnet raw | `Anthropic/raw/claude-sonnet-4.6-raw.md` | planned | - | 8k-14k | 82%-90% |
| Gemini CLI | `Google/gemini-cli.md` | `examples/benchmarks/gemini-cli-style-system-prompt.task.ail` | 216 | 4k-9k | 75%-88% |
| Gemini Workspace | `Google/gemini-workspace.md` | planned | - | 4k-8k | 75%-87% |
| Gemini 3 Pro | `Google/gemini-3-pro.md` | planned | - | 5k-10k | 76%-88% |
| Codex GPT-5 | `OpenAI/codex/gpt-5.md` | `examples/benchmarks/codex-style-system-prompt.task.ail` | 289 | 5k-10k | 78%-88% |
| Codex GPT-5.1 | `OpenAI/codex/gpt-5.1.md` | planned | - | 5k-10k | 78%-88% |
| Codex GPT-5.2 | `OpenAI/codex/gpt-5.2.md` | planned | - | 5k-10k | 78%-88% |
| Codex Plan Mode | `OpenAI/codex/plan_mode.md` | planned | - | 2k-5k | 65%-86% |
| GPT-4.1 | `OpenAI/GPT-4.1.md` | planned | - | 4k-9k | 75%-88% |
| o3 | `OpenAI/o3.md` | planned | - | 4k-8k | 75%-87% |
| o4-mini | `OpenAI/o4-mini.md` | planned | - | 3k-7k | 70%-85% |
| Grok personas | `xAI/grok-personas.md` | planned | - | 3k-8k | 70%-88% |
| Grok 4.1 beta | `xAI/grok-4.1-beta.md` | planned | - | 4k-8k | 75%-87% |
| Grok 4.3 beta | `xAI/grok-4.3-beta.md` | planned | - | 4k-8k | 75%-87% |
| Copilot CLI | `Misc/copilot-cli.md` | `examples/benchmarks/copilot-cli-style-system-prompt.task.ail` | 229 | 2k-5k | 60%-84% |
| Amp Code | `Misc/amp-code.md` | planned | - | 3k-7k | 70%-85% |
| OpenCode | `Misc/opencode.md` | planned | - | 3k-7k | 70%-85% |
| T3 Code | `Misc/t3-code.md` | planned | - | 2k-5k | 60%-84% |
| Meta AI | `Misc/meta-ai.md` | planned | - | 3k-7k | 70%-85% |
| Notion AI | `Misc/notion-ai.md` | planned | - | 2k-5k | 65%-86% |
| Proton Lumo AI | `Misc/proton-lumo-ai.md` | planned | - | 2k-5k | 65%-86% |
| Perplexity Comet | `Perplexity/comet-browser-assistant.md` | `examples/benchmarks/perplexity-comet-browser-assistant.task.ail` | 226 | 4k-8k | 75%-87% |

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
