# AIL Specification - Remaining Issues Implementation Plan

## Overview

This plan outlines the implementation strategy for the remaining open issues in the AIL specification project:
- Issue #2: Create AIL benchmark samples
- Issue #3: Build reference validator and formatter
- Issue #5: Create MCP server for AIL context management

---

## Issue #2: Create AIL Benchmark Samples

### Goal
Expand `examples/benchmarks/` with representative AIL samples for each major prompt family from the system_prompts_leaks collection.

### Scope

Create AIL samples for the following prompt families:

#### High Priority (Have clear single sources)
1. **Claude Desktop Code** (`Anthropic/claude-desktop-code.md`)
2. **Claude Design** (`Anthropic/claude-design.md`)
3. **Claude in Chrome** (`Anthropic/claude-in-chrome.md`)
4. **Gemini Workspace** (`Google/gemini-workspace.md`)
5. **Gemini 3 Pro** (`Google/gemini-3-pro.md`)
6. **Codex GPT-5.1** (`OpenAI/codex/gpt-5.1.md`)
7. **Codex GPT-5.2** (`OpenAI/codex/gpt-5.2.md`)
8. **Codex Plan Mode** (`OpenAI/codex/plan_mode.md`)
9. **GPT-4.1** (`OpenAI/GPT-4.1.md`)
10. **o3** (`OpenAI/o3.md`)
11. **o4-mini** (`OpenAI/o4-mini.md`)

#### Medium Priority (Multiple sources)
12. **Grok personas** (`xAI/grok-personas.md`)
13. **Grok 4.1 beta** (`xAI/grok-4.1-beta.md`)
14. **Grok 4.3 beta** (`xAI/grok-4.3-beta.md`)

#### Lower Priority (Misc assistants)
15. **Amp Code** (`Misc/amp-code.md`)
16. **OpenCode** (`Misc/opencode.md`)
17. **T3 Code** (`Misc/t3-code.md`)
18. **Meta AI** (`Misc/meta-ai.md`)
19. **Notion AI** (`Misc/notion-ai.md`)
20. **Proton Lumo AI** (`Misc/proton-lumo-ai.md`)

### Implementation Steps

For each sample:
1. Fetch source prompt from system_prompts_leaks repository
2. Analyze prompt structure and identify key instruction classes
3. Convert to AIL format preserving meaning
4. Add source URL as comment: `# Source converted: https://...`
5. Add representative sample disclaimer
6. Include proper `@use` directives for base dictionary
7. Validate against AIL 0.8 specification
8. Run benchmark script to measure token savings
9. Update `benchmarks/system-prompt-leaks.md` table

### File Naming Convention

```
examples/benchmarks/<prompt-family>-style-system-prompt.task.ail
```

Examples:
- `claude-desktop-code-style-system-prompt.task.ail`
- `claude-design-style-system-prompt.task.ail`
- `gemini-workspace-style-system-prompt.task.ail`

### Validation Checklist

- [ ] Valid `@task` header with name and version 0.8
- [ ] Source URL comment included
- [ ] Proper `@use` directive for base dictionary
- [ ] Correct opcodes for task file (R, G, F, M, B, P, A, C, T, O, W, X, H, N)
- [ ] ASCII-only content
- [ ] Meaning preserved from source
- [ ] No invented requirements
- [ ] No removed constraints
- [ ] Benchmark script runs successfully

### Estimated Output

- 20 new AIL sample files
- Updated benchmark table with measured savings
- Expected savings: 85-98% based on current measurements

---

## Issue #3: Build Reference Validator and Formatter

### Goal
Create the first reference tooling for AIL 0.8 with CLI commands for validation, formatting, and analysis.

### Architecture

```
ail-cli/
├── package.json
├── src/
│   ├── cli.ts           # Main CLI entry point
│   ├── commands/
│   │   ├── validate.ts  # Validation command
│   │   ├── format.ts    # Format command
│   │   ├── resolve.ts   # Import resolution
│   │   ├── expand.ts    # Natural language expansion
│   │   └── stats.ts     # Token statistics
│   ├── parser/
│   │   ├── lexer.ts     # AIL lexer
│   │   ├── parser.ts    # AIL parser
│   │   └── ast.ts       # AST definitions
│   ├── validator/
│   │   ├── schema.ts    # Validation rules
│   │   ├── opcodes.ts   # Opcode validation
│   │   └── imports.ts   # Import validation
│   ├── formatter/
│   │   ├── index.ts     # Format logic
│   │   └── rules.ts     # Formatting rules
│   └── utils/
│       ├── token-counter.ts
│       └── file-utils.ts
├── dist/                # Compiled output
└── bin/
    └── ail.js           # Executable
```

### CLI Commands

#### 1. `ail validate <file>`

**Purpose:** Validate AIL file against specification

**Features:**
- Check valid header format
- Verify file type matches allowed opcodes
- Validate opcode syntax
- Check import syntax and resolution
- Detect circular imports
- Validate dictionary alias uniqueness
- Check for reserved opcode misuse
- Verify context files don't use command opcodes
- Validate dictionary entry format

**Exit codes:**
- 0: Valid
- 1: Invalid
- 2: Error (file not found, parse error, etc.)

**Output:**
```
✓ Valid header: @task example 0.8
✓ Valid opcodes for task file
✓ Imports resolved: 3/3
✓ No circular imports detected
✓ Dictionary aliases unique
✓ No reserved opcode misuse

File is valid.
```

#### 2. `ail format <file>`

**Purpose:** Format AIL file according to style guide

**Features:**
- Standardize spacing around opcodes
- Sort imports by type (dict, lib, ctx)
- Alphabetize imports within each type
- Normalize comment formatting
- Trim trailing whitespace
- Ensure consistent line endings
- Preserve blank lines between sections

**Options:**
- `--write`: Write changes to file
- `--check`: Check if formatting needed
- `--stdout`: Print formatted output to stdout

#### 3. `ail resolve <file>`

**Purpose:** Resolve and display all imports

**Features:**
- Fetch remote imports via HTTPS
- Read local imports
- Detect circular dependencies
- Display resolved file tree
- Show import order
- Validate import types match file headers

**Output:**
```
example.task.ail
├── @use dict base ./dicts/base.dict.ail
├── @use lib go ./libs/go.lib.ail
└── @use ctx arch ./docs/architecture.ctx.ail
    └── @use dict base ../dicts/base.dict.ail (already loaded)

Resolution order: spec → dicts → libs → ctx → task
```

#### 4. `ail expand <file>`

**Purpose:** Expand AIL to natural language

**Features:**
- Convert opcodes to full English
- Expand dictionary aliases
- Preserve structure and meaning
- Generate readable prose
- Show confidence level for ambiguous expansions

**Output:**
```
# Role: Senior Go engineer
# Focus: Performance, architecture, maintainability
# Goal: Review repository and improve quality without behavior change

## Must
- Preserve public API and observable behavior
- Use evidence from tests, benchmarks, profiling
...
```

#### 5. `ail stats <source> <ail>`

**Purpose:** Compare token statistics

**Features:**
- Count tokens in source and AIL files
- Calculate savings percentage
- Show compression ratio
- Display character counts
- Support multiple tokenizers (GPT-4, Claude)

**Output:**
```
Source: source.md
AIL: example.ail
Tokenizer: GPT-4 (cl100k_base)

Source tokens: 11,186
AIL tokens: 409
Savings: 96.3%
Compression: 27.4x

Characters:
  Source: 45,234
  AIL: 2,845
  Savings: 93.7%
```

### Implementation Steps

#### Phase 1: Parser and Validator
1. Design AST structure for AIL files
2. Implement lexer for AIL syntax
3. Implement parser for AIL grammar
4. Create validation rules engine
5. Implement `validate` command

#### Phase 2: Import Resolution
1. Implement local file resolution
2. Implement HTTPS fetch for remote imports
3. Add circular import detection
4. Implement `resolve` command

#### Phase 3: Formatter
1. Define formatting rules
2. Implement formatter logic
3. Add write/check modes
4. Implement `format` command

#### Phase 4: Expansion
1. Create opcode-to-English mappings
2. Implement alias expansion
3. Add sentence generation
4. Implement `expand` command

#### Phase 5: Statistics
1. Integrate token counting libraries
2. Implement comparison logic
3. Add multiple tokenizer support
4. Implement `stats` command

### Technology Stack

- **Language:** TypeScript
- **Runtime:** Node.js 18+
- **Parser:** Custom recursive descent parser
- **CLI:** Commander.js
- **Tokenizers:** gpt-tokenizer, tiktoken
- **Testing:** Vitest
- **Packaging:** pkg (for standalone binaries)

### Distribution

- NPM package: `ail-cli`
- Standalone binaries for Windows, macOS, Linux
- Installation: `npm install -g ail-cli`

---

## Issue #5: Create MCP Server for AIL Context Management

### Goal
Create an MCP server that enables agents to use AIL as a first-class context and instruction format.

### Architecture

```
ail-mcp-server/
├── package.json
├── src/
│   ├── index.ts          # MCP server entry point
│   ├── server.ts         # Server configuration
│   ├── tools/
│   │   ├── validate.ts   # ail_validate tool
│   │   ├── resolve.ts    # ail_resolve tool
│   │   ├── expand.ts     # ail_expand tool
│   │   ├── convert.ts    # ail_convert tool
│   │   ├── save.ts       # ail_save tool
│   │   └── stats.ts      # ail_stats tool
│   ├── parser/           # Shared with ail-cli
│   ├── validator/        # Shared with ail-cli
│   └── utils/
├── dist/
└── README.md
```

### MCP Tools

#### 1. `ail_validate`

**Input:**
```json
{
  "file": "path/to/file.ail"
}
```

**Output:**
```json
{
  "valid": true,
  "errors": [],
  "warnings": [],
  "info": {
    "header": "@task example 0.8",
    "fileType": "task",
    "opcodeCount": 15,
    "importCount": 3
  }
}
```

#### 2. `ail_resolve`

**Input:**
```json
{
  "file": "path/to/file.ail",
  "includeContent": false
}
```

**Output:**
```json
{
  "imports": [
    {
      "type": "dict",
      "alias": "base",
      "uri": "./dicts/base.dict.ail",
      "resolved": true,
      "header": "@dict base 0.8"
    }
  ],
  "resolutionOrder": ["spec", "dicts", "libs", "ctx", "task"],
  "circularImports": []
}
```

#### 3. `ail_expand`

**Input:**
```json
{
  "file": "path/to/file.ail",
  "format": "markdown"
}
```

**Output:**
```json
{
  "expanded": "# Role\nSenior Go engineer\n\n## Focus\n...",
  "confidence": 0.95,
  "warnings": []
}
```

#### 4. `ail_convert`

**Input:**
```json
{
  "prompt": "Natural language prompt...",
  "name": "example",
  "version": "0.8"
}
```

**Output:**
```json
{
  "ail": "@task example 0.8\n...",
  "confidence": 0.87,
  "assumptions": [
    "Assumed 'qa' means quality assurance"
  ],
  "unmappedLines": [],
  "compressionEstimate": 0.65
}
```

**Rules:**
- Conversion must not be silent
- Return confidence score
- List assumptions made
- Show unmapped lines
- Provide compression estimate
- Support raw HTTPS references
- Never copy full third-party prompts

#### 5. `ail_save`

**Input:**
```json
{
  "content": "@task example 0.8\n...",
  "path": "examples/example.task.ail"
}
```

**Output:**
```json
{
  "saved": true,
  "path": "examples/example.task.ail",
  "validated": true,
  "errors": []
}
```

#### 6. `ail_stats`

**Input:**
```json
{
  "source": "Natural language prompt...",
  "ail": "@task example 0.8\n...",
  "tokenizer": "gpt-4"
}
```

**Output:**
```json
{
  "source": {
    "tokens": 11500,
    "characters": 45000
  },
  "ail": {
    "tokens": 409,
    "characters": 2800
  },
  "savings": {
    "tokens": 11091,
    "percentage": 96.4
  },
  "tokenizer": "gpt-4"
}
```

### Server Configuration

**Package:** `ail-mcp-server`

**Installation:**
```bash
npm install -g ail-mcp-server
```

**MCP Configuration:**
```json
{
  "mcpServers": {
    "ail": {
      "command": "ail-mcp-server",
      "args": []
    }
  }
}
```

### Implementation Steps

#### Phase 1: Core Server
1. Set up MCP server framework
2. Implement tool registration
3. Add error handling
4. Create documentation

#### Phase 2: Validation Tools
1. Port validator from ail-cli
2. Implement `ail_validate` tool
3. Add detailed error reporting

#### Phase 3: Resolution Tools
1. Port resolver from ail-cli
2. Implement `ail_resolve` tool
3. Add content fetching

#### Phase 4: Conversion Tools
1. Implement conversion logic
2. Add confidence scoring
3. Implement `ail_convert` tool

#### Phase 5: Remaining Tools
1. Implement `ail_expand` tool
2. Implement `ail_save` tool
3. Implement `ail_stats` tool

### Integration Examples

#### Claude Desktop

```json
{
  "mcpServers": {
    "ail": {
      "command": "ail-mcp-server",
      "args": []
    }
  }
}
```

#### Custom Agent

```javascript
const ail = await mcp.useTool('ail_validate', {
  file: './AGENTS.ail'
});
```

### Documentation

- README with installation instructions
- MCP tool reference documentation
- Example integrations
- Troubleshooting guide

---

## Implementation Priority

### Phase 1: Foundation (Week 1-2)
- Complete Issue #2 (Benchmark samples)
- Create 10-15 high-priority AIL samples
- Update benchmark documentation

### Phase 2: Core Tooling (Week 3-5)
- Start Issue #3 (Validator/Formatter)
- Implement parser and validator
- Release `validate` command
- Release `format` command

### Phase 3: Advanced Tooling (Week 6-8)
- Complete remaining Issue #3 commands
- Implement `resolve`, `expand`, `stats`
- Release ail-cli v1.0.0

### Phase 4: MCP Integration (Week 9-11)
- Start Issue #5 (MCP Server)
- Implement core MCP tools
- Release ail-mcp-server v1.0.0

### Phase 5: Polish (Week 12)
- Complete remaining benchmark samples
- Update documentation
- Fix bugs and refine features

---

## Success Criteria

### Issue #2
- [ ] 20+ new AIL benchmark samples created
- [ ] All samples include source URLs
- [ ] Benchmark table updated with measured savings
- [ ] Average savings > 90%

### Issue #3
- [ ] All 5 CLI commands implemented
- [ ] NPM package published
- [ ] Standalone binaries available
- [ ] Test coverage > 80%
- [ ] Documentation complete

### Issue #5
- [ ] All 6 MCP tools implemented
- [ ] NPM package published
- [ ] Integration examples provided
- [ ] Claude Desktop compatible
- [ ] Documentation complete

---

## Risks and Mitigations

### Risk: Parser Complexity
**Mitigation:** Start with simple parser, iterate based on real-world AIL files

### Risk: MCP Server Adoption
**Mitigation:** Provide clear examples and integration guides

### Risk: Tokenizer Accuracy
**Mitigation:** Support multiple tokenizers, document which is used

### Risk: Breaking Changes
**Mitigation:** Version carefully, follow semver, document migrations

---

## Dependencies

### External
- Node.js 18+
- TypeScript 5+
- MCP SDK
- gpt-tokenizer
- tiktoken

### Internal
- AIL 0.8 specification (stable)
- EBNF grammar (complete)
- Base dictionary (stable)
- Conversion library (stable)
