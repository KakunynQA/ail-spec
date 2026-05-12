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

| Source prompt | Source path | AIL sample | Source tokens | AIL tokens | Measured savings |
| --- | --- | --- | ---: | ---: | ---: |
| Claude Code | `Anthropic/claude-code.md` | `examples/benchmarks/claude-code-style-system-prompt.task.ail` | 11,186 | 409 | 96.3% |
| Codex GPT-5 | `OpenAI/codex/gpt-5.md` | `examples/benchmarks/codex-style-system-prompt.task.ail` | 4,434 | 289 | 93.5% |
| Gemini CLI | `Google/gemini-cli.md` | `examples/benchmarks/gemini-cli-style-system-prompt.task.ail` | 5,772 | 216 | 96.3% |
| Copilot CLI | `Misc/copilot-cli.md` | `examples/benchmarks/copilot-cli-style-system-prompt.task.ail` | 15,036 | 229 | 98.5% |
| Perplexity Comet | `Perplexity/comet-browser-assistant.md` | `examples/benchmarks/perplexity-comet-browser-assistant.task.ail` | 5,077 | 226 | 95.5% |
| Browser Assistant Family | N/A | `examples/benchmarks/browser-assistant-family.task.ail` | N/A | 209 | N/A |
| Coding CLI Agent Family | N/A | `examples/benchmarks/coding-cli-agent-family.task.ail` | N/A | 243 | N/A |
| General Assistant Style | N/A | `examples/benchmarks/general-assistant-style-system-prompt.task.ail` | N/A | 236 | N/A |

### Planned samples

| Source prompt | Source path | Status |
| --- | --- | --- |
| Claude Desktop Code | `Anthropic/claude-desktop-code.md` | planned |
| Claude Design | `Anthropic/claude-design.md` | planned |
| Claude in Chrome | `Anthropic/claude-in-chrome.md` | planned |
| Claude Sonnet raw | `Anthropic/raw/claude-sonnet-4.6-raw.md` | planned |
| Gemini Workspace | `Google/gemini-workspace.md` | planned |
| Gemini 3 Pro | `Google/gemini-3-pro.md` | planned |
| Codex GPT-5.1 | `OpenAI/codex/gpt-5.1.md` | planned |
| Codex GPT-5.2 | `OpenAI/codex/gpt-5.2.md` | planned |
| Codex Plan Mode | `OpenAI/codex/plan_mode.md` | planned |
| GPT-4.1 | `OpenAI/GPT-4.1.md` | planned |
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
