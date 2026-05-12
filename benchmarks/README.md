# AIL Benchmarks

This directory contains token economy benchmarks for the AIL specification.

## Automated Token Counting

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

The scripts will:
1. Scan all AIL samples in `../examples/benchmarks/`
2. Count tokens using GPT-4 tokenizer (cl100k_base)
3. Extract source URLs from comments
4. Generate a markdown table with results

## Manual Token Measurement

For accurate source prompt token counts, use the official tokenizers:

### GPT / OpenAI Models

Visit: https://platform.openai.com/tokenizer

1. Paste the source prompt text
2. Note the token count
3. Record the model used (e.g., GPT-4, GPT-3.5)

### Claude Models

Visit: https://token-calculator.net/token-calculator

1. Paste the source prompt text
2. Select the Claude model
3. Note the token count

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
