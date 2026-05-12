# AIL Benchmarks

This directory contains token economy benchmarks for the AIL specification.

## Automated Token Counting

The benchmark script automatically:
1. Scans all AIL samples in `../examples/benchmarks/`
2. Fetches source prompts from the system_prompts_leaks repository
3. Counts tokens using GPT-4 tokenizer (cl100k_base)
4. Calculates savings percentage
5. Generates a markdown table with results

### Prerequisites

**Node.js:**
```bash
cd benchmarks
npm install
npm run benchmark
```

**Python:**
```bash
cd benchmarks
pip install tiktoken
python3 tokenize.py
```

### Output

The script will output:
- AIL token count for each sample
- Source prompt token count (fetched from GitHub)
- Savings percentage
- Markdown table for documentation

### Sample Output

```
Sample: claude-code-style-system-prompt
  File: claude-code-style-system-prompt.task.ail
  Source: https://github.com/asgeirtj/system_prompts_leaks/blob/main/Anthropic/claude-code.md
  AIL tokens: 409
  Source tokens: 11186
  Savings: 96.3%
  Source fetched: Yes
```

## Manual Token Measurement

For samples without source URLs or for verification, use the official tokenizers:

## Benchmark Formula

```text
savings_percent = (source_tokens - ail_tokens) / source_tokens * 100
break_even_uses = conversion_overhead / savings_per_use
```

## Source Collection

Public system prompt leaks: https://github.com/asgeirtj/system_prompts_leaks

**Important:** We do not copy full leaked prompts into this repository. The AIL samples are representative conversions of instruction classes, not verbatim derivatives.

## Adding New Benchmarks

1. Create a new AIL sample in `../examples/benchmarks/`
2. Add source URL as a comment:
   ```text
   # Source converted: https://example.com/prompt.md
   ```
3. Run the benchmark script
4. Update `system-prompt-leaks.md` with measured values
5. Mark the tokenizer used (e.g., "GPT-4", "Claude-3")

## Benchmark Table Format

| Sample | Source URL | AIL file | Source tokens | AIL tokens | Savings | Tokenizer |
| --- | --- | --- | ---: | ---: | ---: | --- |
| Name | URL | path | count | count | % | model |

## Notes

- Token counts vary by model and tokenizer
- Always specify the tokenizer/model used
- Mark estimates clearly until measured with a specific tokenizer
- AIL samples preserve instruction meaning, not exact wording
