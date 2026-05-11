# AIL Specification 0.8 Draft

AIL, Agent Instruction Language, is a compact typed intermediate representation for AI instructions.

Created by [Kakunyn](https://kakunyn.com).

## 1. Purpose

AIL exists to make agent instructions compact, explicit, reusable, validateable, and expandable.

AIL is designed for:

- system prompts
- agent instructions
- project rules
- reusable agent behavior
- compact architecture context
- instruction libraries
- MCP tool instructions

AIL is not a general-purpose programming language.

## 2. Non-goals

AIL does not aim to:

- encode arbitrary human prose
- replace full documentation
- hide meaning through opaque hashes
- optimize for single-character cleverness
- support unlimited syntax styles
- become YAML, TOML, JSON, or Markdown

## 3. File headers

Every AIL file must start with a typed header.

Valid headers:

```text
@task <name> <version>
@lib <name> <version>
@ctx <name> <version>
@dict <name> <version>
```

Examples:

```text
@task go-review 0.8
@lib go 0.8
@ctx architecture 0.8
@dict base 0.8
```

Files without valid headers are invalid.

## 4. File types

### 4.1 `@task`

A task file defines operational instructions for an agent.

Allowed opcodes:

```text
R G F M B P A C T O W X H N
```

### 4.2 `@lib`

A library file defines reusable agent behavior.

Allowed opcodes:

```text
M B P A C T O W X H N
```

Disallowed:

```text
R G
```

Role and goal belong to concrete tasks, not reusable libraries.

### 4.3 `@ctx`

A context file defines factual project context.

Allowed opcodes:

```text
N H
```

Context files must not command agents.

Disallowed:

```text
R G F M B P A C T O W X
```

### 4.4 `@dict`

A dictionary file defines aliases.

Format:

```text
alias = expansion
```

Example:

```text
ctx = context
perf = performance
pub = public
```

Dictionary files must not contain opcodes.

## 5. Opcodes

| Opcode | Meaning | Description |
| --- | --- | --- |
| `R` | role | Defines the agent role |
| `G` | goal | Defines high-level objective |
| `F` | focus | Defines focus areas |
| `M` | must | Mandatory behavior |
| `B` | ban | Forbidden behavior |
| `P` | prefer | Preferred behavior |
| `A` | avoid | Discouraged behavior |
| `C` | check | Inspection or analysis point |
| `T` | task | Work item or phase |
| `O` | output | Required output |
| `W` | when | Conditional rule |
| `X` | command | Shell or tool command |
| `H` | hypothesis | Unconfirmed assumption |
| `N` | note | Factual note |

Opcodes are reserved. Projects must not redefine opcodes.

## 6. Imports

Imports use `@use`.

Syntax:

```text
@use <type> <alias> <path>
```

Examples:

```text
@use dict base ./dicts/base.dict.ail
@use lib go ./libs/go.lib.ail
@use ctx arch ./docs/architecture.ctx.ail
```

Valid import types:

```text
dict
lib
ctx
```

Task files must not import task files.

## 7. Import precedence

Resolution order:

1. specification
2. dictionaries
3. libraries
4. context
5. current task

Conflict rules:

- duplicate dictionary aliases are invalid
- circular imports are invalid
- missing imports are invalid
- invalid imported file types are invalid
- task rules have highest priority
- context never overrides task or library rules

## 8. Aliases

Alias rules:

- ASCII only
- lowercase only
- 2 to 16 characters
- no whitespace
- must not be an opcode
- must not redefine another alias
- must not be ambiguous within the active dictionary set

Recommended aliases:

```text
ctx = context
arch = architecture
perf = performance
maint = maintenance
deps = dependencies
pub = public
obs = observable
io = input output
err = errors
compat = compatibility
cfg = configuration
impl = implementation
repo = repository
```

## 9. Line format

Instruction line:

```text
<OPCODE> <content>
```

Examples:

```text
M preserve pub api obs behavior
B deps without strong reason
P small reversible changes
C alloc loops locks ctx leaks
O summary files tests
```

Empty lines are allowed.

Comments are allowed using `#`.

```text
# This is a comment
```

## 10. Compression rules

AIL compresses repeated operational structure, not rare domain meaning.

Good:

```text
M preserve pub api
B deps without reason
P small reversible changes
```

Bad:

```text
M prv p a
B d wr
P sm rv ch
```

Meaning must remain recoverable.

## 11. Expansion

A valid AIL document should be expandable into natural language.

Example:

```text
M preserve pub api
```

Expands to:

```text
The agent must preserve the public API.
```

Roundtrip quality is a core requirement.

## 12. Validation

A validator must check:

- valid header
- valid file type
- valid opcodes for file type
- valid imports
- missing imports
- circular imports
- duplicate aliases
- reserved opcode misuse
- context files with command opcodes
- malformed dictionary lines
- unknown file versions

## 13. Token economy

AIL token savings must be measured against a target tokenizer.

Character count is not enough.

Estimated savings are allowed in documentation, but exact claims require tokenizer-backed benchmarks.

## 14. Break-even

AIL has a conversion cost and a reuse benefit.

```text
break_even_uses = conversion_overhead / savings_per_use
```

AIL is most valuable for reusable prompts, system prompts, project instructions, and architecture context.

## 15. Versioning

AIL uses semantic specification versions.

Before 1.0, breaking changes are allowed.

After 1.0, breaking changes require a major version change.
