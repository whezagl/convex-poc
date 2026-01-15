# Phase 1: Project Setup - Research

**Researched:** 2026-01-16
**Domain:** Claude Agent SDK with TypeScript/Node
**Confidence:** HIGH

## Summary

Researched the Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`) ecosystem and TypeScript project setup patterns for building autonomous agent systems. The SDK provides a complete agent harness with built-in tool support (Read, Write, Edit, Bash, etc.), session management, and subagent orchestration. It's designed as "giving Claude a computer" - the same tools programmers use daily.

Key finding: The Agent SDK is NOT just an API wrapper - it's a full agentic loop with context gathering (file system, web search), action execution (tools, bash), and verification (linting, testing). For multi-agent systems, use the SDK's built-in `agents` option for subagent definitions rather than building custom orchestration from scratch.

**Primary recommendation:** Use `@anthropic-ai/claude-agent-sdk` (NOT `@anthropic-ai/sdk` - that's the low-level Messages API) with tsx for development and tsup for building. Structure as a single-package TypeScript project (not monorepo) for this learning POC.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @anthropic-ai/claude-agent-sdk | Latest (0.x in 2025) | Agent SDK with built-in tools | Official SDK, provides complete agent harness |
| @anthropic-ai/sdk | Latest | Low-level Messages API (dep of above) | Required dependency, types for Message API |
| typescript | ^5.0 | Type safety | Standard for Node projects in 2025 |
| node | ^20 LTS | Runtime | Minimum supported version |

### Development
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tsx | Latest | TypeScript execution (dev/test) | Run TS files directly without build step |
| tsup | Latest | Production bundler | Fast esbuild-based bundler for ESM/CJS output |

### Tooling
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | Latest | Schema validation (tool inputs) | SDK's `tool()` helper uses Zod schemas |
| prettier | Latest | Code formatting | Consistent code style |
| eslint | Latest | Linting | Catch errors early (types: @typescript-eslint) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| tsup | unbuild, rollup | tsup is zero-config, esbuild-based (faster) |
| tsx | ts-node | tsx uses esbuild (much faster) |
| Single package | Monorepo (Nx, Turborepo) | Monorepo overkill for learning POC |

**Installation:**
```bash
npm install @anthropic-ai/claude-agent-sdk zod
npm install -D tsx tsup typescript @types/node prettier eslint
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── agents/          # Agent definitions (Planner, Coder, Reviewer)
├── tools/           # Custom tool definitions (if needed)
├── orchestrator/    # Workflow coordination
│   └── workflow.ts  # Main orchestration logic
├── types/           # Shared TypeScript types
└── index.ts         # Main entry point
package.json
tsconfig.json
tsup.config.ts       # Build configuration
```

### Pattern 1: Basic Agent SDK Query
**What:** Use `query()` function to start an agent session
**When to use:** Any agent interaction with Claude
**Example:**
```typescript
// Source: Official Agent SDK docs
import { query } from '@anthropic-ai/claude-agent-sdk'

const result = await query({
  prompt: 'Analyze this code',
  options: {
    model: 'claude-sonnet-4-5',
    cwd: process.cwd(),
    tools: ['Read', 'Write', 'Edit', 'Bash', 'Grep', 'Glob'],
    permissionMode: 'bypassPermissions', // For CLI tools
  }
})

for await (const message of result) {
  if (message.type === 'result') {
    console.log(message.result)
  }
}
```

### Pattern 2: Subagent Definition
**What:** Define specialized agents using the `agents` option
**When to use:** Multi-agent systems (Planner, Coder, Reviewer)
**Example:**
```typescript
// Source: Agent SDK reference docs
import { query } from '@anthropic-ai/claude-agent-sdk'

const plannerAgent = await query({
  prompt: 'Break down this task into steps',
  options: {
    agents: {
      planner: {
        description: 'Decomposes tasks into implementation steps',
        prompt: 'You are a planning agent. Break tasks into clear steps.',
        model: 'sonnet'
      }
    }
  }
})
```

### Pattern 3: Custom Tool with Zod
**What:** Define type-safe tools using the SDK's `tool()` helper
**When to use:** Custom capabilities beyond built-in tools
**Example:**
```typescript
// Source: Agent SDK docs
import { tool } from '@anthropic-ai/claude-agent-sdk'
import { z } from 'zod'

const myTool = tool(
  'my_tool_name',
  'Description of what this tool does',
  {
    inputParam: z.string().describe('Parameter description'),
  },
  async (args, extra) => {
    return { content: [{ type: 'text', text: 'Result' }] }
  }
)
```

### Anti-Patterns to Avoid
- **Using @anthropic-ai/sdk directly**: The Agent SDK abstracts away session management, tool orchestration, and message handling. Use the Agent SDK unless you need low-level control.
- **Custom tool execution loops**: The SDK handles tool calling automatically. Don't build manual `while` loops for tool use.
- **Ignoring permission modes**: For CLI tools, use `permissionMode: 'bypassPermissions'`. For production, implement proper `canUseTool` handlers.
- **Not using subagents for specialization**: The SDK has built-in subagent support. Don't manually coordinate multiple client instances.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tool calling loop | Custom `while` loop with manual tool execution | `query()` async generator | SDK handles tool use, streaming, and error recovery |
| Session management | Custom session storage and resume logic | `resume` option in `query()` | SDK manages session persistence automatically |
| Message parsing | Custom message type handling | SDK message types (`SDKMessage`, `SDKResultMessage`) | Standardized types with proper streaming support |
| Tool definitions | Custom tool schemas and validation | SDK's `tool()` helper with Zod | Type-safe, integrates with MCP, standard format |
| File operations | Custom fs-based file tools | Built-in tools (Read, Write, Edit) | Battle-tested, handle edge cases, permission-aware |
| Agent handoff | Custom agent orchestration | `agents` option in `query()` | Built-in subagent support with proper isolation |

**Key insight:** The Claude Agent SDK is a complete agent harness, not just an API client. Building custom tool loops, session management, or agent orchestration reinvents 6+ months of production hardening. The SDK's abstractions are designed specifically for multi-agent coordination.

## Common Pitfalls

### Pitfall 1: Wrong SDK Package
**What goes wrong:** Using `@anthropic-ai/sdk` instead of `@anthropic-ai/claude-agent-sdk`
**Why it happens:** Both packages are from Anthropic, and naming is similar
**How to avoid:** Always install `@anthropic-ai/claude-agent-sdk` for agent systems. The base SDK is only for low-level Messages API access.
**Warning signs:** You're implementing your own tool loop, session management, or message parsing

### Pitfall 2: Session Management Errors
**What goes wrong:** Process exits with "session not found" errors when resuming
**Why it happens:** Invalid session IDs, session expiration, or incorrect `resume` usage
**How to avoid:** Use the `session_id` from `SDKResultMessage`, handle session errors gracefully, don't assume sessions persist indefinitely
**Warning signs:** GitHub issues mention process exits with code 1, especially on WSL2

### Pitfall 3: Permission Configuration Issues
**What goes wrong:** Tools are blocked or require confirmation for every action
**Why it happens:** Default `permissionMode: 'default'` requires approval for tool use
**How to avoid:** For CLI tools, use `permissionMode: 'bypassPermissions'`. For production, implement `canUseTool` handler with proper authorization logic
**Warning signs:** Agent hangs or asks for approval repeatedly

### Pitfall 4: Monorepo Over-Engineering
**What goes wrong:** Complex Nx/Turborepo setup for a simple learning POC
**Why it happens:** Following "best practices" without considering project scope
**How to avoid:** Start with single-package TypeScript project. Monorepo adds complexity (workspace config, build orchestration) without benefit for small projects
**Warning signs:** Build takes >30 seconds, complex package.json configs

### Pitfall 5: Ignoring Built-in Tools
**What goes wrong:** Building custom file tools when Read/Write/Edit exist
**Why it happens:** Not exploring SDK capabilities before building custom solutions
**How to avoid:** Review available tools in docs first. Built-in tools handle permissions, streaming, and edge cases
**Warning signs:** Writing custom fs.readFile/fn.writeFile wrappers

## Code Examples

### Basic Agent Setup
```typescript
// Source: Agent SDK quickstart docs
import { query } from '@anthropic-ai/claude-agent-sdk'

async function runAgent() {
  const result = query({
    prompt: 'Hello, Claude',
    options: {
      model: 'claude-sonnet-4-5',
      permissionMode: 'bypassPermissions',
    }
  })

  for await (const message of result) {
    console.log(JSON.stringify(message, null, 2))
  }
}
```

### Multi-Agent Orchestration
```typescript
// Source: Agent SDK reference + engineering blog
import { query } from '@anthropic-ai/claude-agent-sdk'

async function orchestrateAgents(task: string) {
  // Step 1: Plan
  const planResult = await query({
    prompt: `Create a plan for: ${task}`,
    options: {
      agents: {
        planner: {
          description: 'Creates implementation plans',
          prompt: 'You are a planning agent. Break down tasks into clear steps.',
        }
      }
    }
  })

  // Step 2: Execute (using the plan)
  // ... implementation details depend on workflow
}
```

### Custom Tool Definition
```typescript
// Source: Agent SDK tool helper docs
import { tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk'
import { z } from 'zod'

const calculateTool = tool(
  'calculate',
  'Performs mathematical calculations',
  {
    expression: z.string().describe('Math expression to evaluate'),
  },
  async (args) => {
    try {
      // WARNING: eval is dangerous - use a proper math library
      const result = eval(args.expression)
      return {
        content: [{ type: 'text', text: String(result) }]
      }
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${error}` }],
        isError: true
      }
    }
  }
)

const server = createSdkMcpServer({
  name: 'my-tools',
  tools: [calculateTool]
})
```

## State of the Art (2024-2025)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual tool loops | Agent SDK `query()` generator | 2025 | Don't build custom orchestration |
| Custom session storage | Built-in `resume` option | 2025 | SDK manages persistence |
| Multiple SDK instances | Single `query()` with `agents` option | Sept 2025 | Subagents now first-class |
| Slow builds (tsc) | Fast bundlers (tsup/esbuild) | 2024+ | Build times <5 seconds |

**New tools/patterns to consider:**
- **V2 SDK interface (preview):** New `send()` and `receive()` patterns for simpler multi-turn conversations
- **Programmatic tool calling:** Claude can orchestrate tools through code (not just responses)
- **MCP (Model Context Protocol):** Standardized integrations to external services (Slack, GitHub, etc.)

**Deprecated/outdated:**
- **claude-code-sdk package:** Renamed to `claude-agent-sdk` to reflect broader purpose
- **Manual agent spawning:** Use `agents` option instead of spawning multiple SDK instances
- **Custom tool schemas without Zod:** SDK's `tool()` helper requires Zod schemas

## Open Questions

1. **Session persistence strategy for multi-agent workflows**
   - What we know: SDK supports `resume` option with session IDs
   - What's unclear: How to pass session state between Planner → Coder → Reviewer agents cleanly
   - Recommendation: Start with sequential `query()` calls sharing session context via `resume`. Explore `forkSession` option for parallel subagents.

2. **Tool output passing between agents**
   - What we know: Each agent has isolated context, only sends final result back
   - What's unclear: Best pattern for sharing intermediate artifacts (plans, code changes, review results) between agents
   - Recommendation: Use filesystem as shared state (write plan to file, Coder reads it). File system is the "context engineering" pattern mentioned in docs.

## Sources

### Primary (HIGH confidence)
- [Agent SDK reference - TypeScript](https://platform.claude.com/docs/en/agent-sdk/typescript) - Complete API reference (all functions, types, interfaces)
- [Building agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk) - Official engineering blog (Sept 2025)
- [anthropics/anthropic-sdk-typescript](https://github.com/anthropics/anthropic-sdk-typescript) - GitHub repository for base SDK

### Secondary (MEDIUM confidence)
- [egoist/tsup](https://github.com/egoist/tsup) - Official tsup repository (zero-config TypeScript bundler)
- [Recommended Folder Structure for Node(TS) 2025](https://dev.to/pramod_boda/recommended-folder-structure-for-nodets-2025-39jl) - Community best practices (Jan 2025)
- [Building a TypeScript Library in 2025](https://dev.to/arshadyaseen/building-a-typescript-library-in-2025-2h0i) - Modern build tooling guide (July 2025)
- [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) - Multi-session patterns (Nov 2025)

### Tertiary (LOW confidence - needs validation)
- [Process exits if session isn't found #47](https://github.com/anthropics/claude-agent-sdk-typescript/issues/47) - Known issue with session management (verify if resolved in current version)
- Various community blog posts - Verified patterns against official docs where possible

## Metadata

**Research scope:**
- Core technology: @anthropic-ai/claude-agent-sdk
- Ecosystem: tsx, tsup, zod, TypeScript project structure
- Patterns: Agent query, subagent definition, tool creation
- Pitfalls: Wrong package, session errors, permissions, over-engineering

**Confidence breakdown:**
- Standard stack: HIGH - verified with official docs and GitHub repositories
- Architecture: HIGH - from official Agent SDK documentation and engineering blog
- Pitfalls: MEDIUM - GitHub issues indicate session problems, but may be version-specific
- Code examples: HIGH - verified against official documentation sources

**Research date:** 2026-01-16
**Valid until:** 2026-02-15 (30 days - Agent SDK is actively developed)

---

*Phase: 01-project-setup*
*Research completed: 2026-01-16*
*Ready for planning: yes*
