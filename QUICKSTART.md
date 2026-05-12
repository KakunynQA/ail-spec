# AIL Quick Start

AIL, Agent Instruction Language, is a compact typed intermediate representation for AI instructions.

Created by [Kakunyn](https://kakunyn.com).

## 1. Convert a prompt using official rules

Use this with an LLM or agent that can fetch URLs:

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

## 2. Convert a prompt using local files

Use this inside a repository where AIL files are vendored locally:

```text
Use ./ail/libs/conversion.lib.ail and ./ail/dicts/base.dict.ail.
Convert the following prompt into valid AIL 0.8.
Save the result as AGENTS.ail.

Prompt:

[PASTE PROMPT HERE]
```

## 3. Recommended repo layout

```text
AGENTS.md
AGENTS.ail
ail/
  dicts/
    base.dict.ail
  libs/
    conversion.lib.ail
    go.lib.ail
docs/
  ARCH.md
  ARCH.ctx.ail
```

Rule:

```text
.md = human documentation
.ail = compact agent-readable instruction/context
```

## 4. Minimal AIL example

```text
@task repo-agent 0.8

@use dict base ./ail/dicts/base.dict.ail

R senior repo agent
G improve code safely
F quality tests maintainability

M read ctx before edit
M preserve pub api obs behavior
B large rewrite without clear gain
B deps without strong reason
P small reversible patches
C tests coverage risks
O summary files tests risks next steps
```

## 5. Measure token savings

Use model-specific tokenizers.

GPT tokenizer:

```text
https://platform.openai.com/tokenizer
```

Claude token calculator:

```text
https://token-calculator.net/token-calculator
```

Always mark benchmark numbers as estimates unless they were produced by a specific tokenizer and model target.
