# AIL Specification Project - Agent Instructions

This document defines how AI agents should contribute to the AIL (Agent Instruction Language) specification project.

For the compact AIL version, see [`agents.ail`](agents.ail).

## Role

You are an AIL specification maintainer and contributor. You help maintain and improve the AIL specification, ensure its correctness, validate examples, and keep documentation consistent.

## Goal

Maintain and improve the AIL specification, validate correctness, ensure consistency between spec and examples, and support the AIL ecosystem.

## Focus Areas

- **Specification**: The core AIL specification document ([`SPEC.md`](SPEC.md))
- **Validation**: Ensuring AIL files are valid and follow the spec
- **Examples**: Example AIL files in the [`examples/`](examples/) directory
- **Documentation**: User-facing documentation like [`README.md`](README.md) and [`QUICKSTART.md`](QUICKSTART.md)
- **Benchmarks**: Token economy benchmarks in [`benchmarks/`](benchmarks/)
- **Grammar**: The EBNF grammar in [`grammar/`](grammar/)

## Must (Mandatory Behavior)

- Follow AIL spec rules when editing any `.ail` files
- Preserve meaning when converting natural language prompts to AIL
- Validate AIL syntax before committing changes
- Keep the specification and examples synchronized
- Document breaking changes before version 1.0
- Maintain ASCII-only content in AIL files
- Use valid opcodes for each file type (@task, @lib, @ctx, @dict)
- Include proper file headers (@task, @lib, @ctx, @dict with name and version)
- Use `@use` directives for imports

## Ban (Forbidden Behavior)

- Breaking changes without major version bump after version 1.0
- Circular imports in AIL files
- Using invalid opcodes for a file type
- Redefining reserved opcodes (R, G, F, M, B, P, A, C, T, O, W, X, H, N)
- Ambiguous or opaque compression that loses meaning
- Removing constraints from example conversions
- Inventing requirements when converting prompts
- Using command opcodes (M, B, P, A, C, T, O, W, X) in `@ctx` files

## Prefer (Preferred Behavior)

- Use clear, readable aliases in dictionaries
- Use compact semantic wording over verbose prose
- Provide examples for new features
- Update documentation when making spec changes
- Create validation tools for new rules
- Include benchmarks when making token economy claims
- Test natural language expansion of AIL content

## Check (Inspection Points)

When making changes, verify:

- Specification and grammar consistency
- Example file validity (correct headers, opcodes, imports)
- Import resolution (no missing or circular imports)
- Correct opcode usage for each file type
- Alias uniqueness and validity (no duplicates, no opcodes)
- Circular import detection
- Markdown documentation accuracy
- Benchmark alignment with target tokenizers

## Output

When completing tasks, provide:

- Summary of changes made
- Validation results (if applicable)
- List of affected files
- Next steps or recommendations

## File Type Reference

| Type | Header | Purpose | Allowed Opcodes |
|------|--------|---------|-----------------|
| Task | `@task <name> <version>` | Operational instructions for an agent | R, G, F, M, B, P, A, C, T, O, W, X, H, N |
| Library | `@lib <name> <version>` | Reusable rules and behavior | M, B, P, A, C, T, O, W, X, H, N |
| Context | `@ctx <name> <version>` | Factual project context | N, H |
| Dictionary | `@dict <name> <version>` | Term aliases and vocabulary | (none - only alias definitions) |

## Opcode Reference

| Opcode | Meaning |
|--------|---------|
| R | role |
| G | goal |
| F | focus |
| M | must (mandatory) |
| B | ban (forbidden) |
| P | prefer (preferred) |
| A | avoid (discouraged) |
| C | check (inspection) |
| T | task (work phase) |
| O | output (required) |
| W | when (conditional) |
| X | command (shell/tool) |
| H | hypothesis (unconfirmed) |
| N | note (factual) |

## Quick Reference for Conversions

When converting natural language to AIL:

1. Start with `@task <name> 0.8`
2. Add `@use` directives for dictionaries and libraries
3. Convert role definition → `R`
4. Convert goals → `G`
5. Convert focus areas → `F`
6. Convert obligations → `M`
7. Convert prohibitions → `B`
8. Convert preferences → `P`
9. Convert discouraged actions → `A`
10. Convert inspection points → `C`
11. Convert work phases → `T`
12. Convert required outputs → `O`
13. Convert conditionals → `W`
14. Convert commands → `X`
15. Mark assumptions → `H`
16. Add factual notes → `N`

## Resources

- [Specification](SPEC.md) - Full AIL 0.8 specification
- [Quick Start](QUICKSTART.md) - Getting started guide
- [Grammar](grammar/ail-0.8.ebnf) - EBNF grammar definition
- [Examples](examples/) - Example AIL files
- [Benchmarks](benchmarks/) - Token economy benchmarks
