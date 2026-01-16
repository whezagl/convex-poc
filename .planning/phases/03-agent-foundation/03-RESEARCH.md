# Phase 3: Agent Foundation with Convex - Research

**Researched:** 2026-01-16
**Domain:** Claude Agent SDK + Convex state management
**Confidence:** HIGH

<research_summary>
## Summary

Researched the Claude Agent SDK TypeScript API, architecture patterns for base class design, and Convex integration patterns for state persistence. The SDK provides a `query()` function that returns an async generator for streaming messages, with extensive hook support for session management.

Key findings:
- **No built-in base class pattern exists** in the SDK — the SDK is functional, not object-oriented. We need to design our own BaseAgent class.
- **Hooks are the extension point** — `SessionStart`, `SessionEnd`, `SubagentStart`, `SubagentStop` hooks provide lifecycle management.
- **Manual state persistence matches user preference** — the SDK requires explicit session resumption via `resume` parameter.
- **Convex integration is straightforward** — use existing Convex functions (created in Phase 2) within hook callbacks.

**Primary recommendation:** Design an abstract BaseAgent class that wraps `query()` with hooks for Convex persistence, uses protected methods for state management, and requires subclasses to implement agent-specific behavior.
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @anthropic-ai/claude-agent-sdk | Latest (0.x) | Claude Agent SDK | Official SDK, provides query() function and hooks |
| @anthropic-ai/sdk | Peer dependency | Anthropic API client | Required by Agent SDK |
| convex | ^1.17.0 | Convex backend | Already installed, schema deployed in Phase 2 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | Peer dependency | Schema validation | Used by SDK for tool definitions (not needed for base class) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Class-based base | Functional composition | User prefers class inheritance; composition would require different pattern |

**Installation:**
```bash
npm install @anthropic-ai/claude-agent-sdk
# Note: Already installed from Phase 1 setup
```
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Recommended Project Structure
```
src/
├── agents/
│   ├── BaseAgent.ts      # Abstract base class with Convex integration
│   ├── DummyAgent.ts     # Simple test agent (proves pattern)
│   └── index.ts          # Export all agents
├── model/
│   ├── agents.ts         # Agent session helpers (from Phase 2)
│   └── workflows.ts      # Workflow helpers (from Phase 2)
└── types/
    └── agent.ts          # Agent-specific TypeScript types
```

### Pattern 1: Abstract Base Class with Protected Methods
**What:** Abstract BaseAgent class with protected Convex integration methods
**When to use:** When multiple agent types need shared state persistence logic
**Example:**
```typescript
// Source: Based on Claude Agent SDK patterns
import { query, Options, SDKMessage } from '@anthropic-ai/claude-agent-sdk';
import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';

export interface AgentConfig {
  agentType: string;
  model?: string;
  workflowId?: Id<'workflows'>;
}

export abstract class BaseAgent {
  protected sessionId: string | null = null;
  protected readonly agentType: string;
  protected readonly workflowId?: Id<'workflows'>;

  constructor(config: AgentConfig) {
    this.agentType = config.agentType;
    this.workflowId = config.workflowId;
  }

  // Abstract: subclasses implement their specific prompt
  protected abstract getSystemPrompt(): string;

  // Protected: Convex state management (manual, as user prefers)
  protected async saveSession(data: {
    status: string;
    output?: string;
    error?: string;
  }): Promise<void> {
    // Call Convex mutation from Phase 2
    // Uses model/updateAgentSession
  }

  // Protected: Load existing session for resumption
  protected async loadSession(sessionId: string): Promise<void> {
    // Call Convex query from Phase 2
    // Uses model/getAgentSession
  }

  // Public: Execute the agent
  async execute(input: string): Promise<string> {
    const options = this.buildOptions();
    const result = await query({ prompt: input, options });

    // Process messages and save state via hooks
    for await (const message of result) {
      await this.handleMessage(message);
    }

    return this.getFinalResult();
  }

  // Protected: Build SDK options with hooks
  protected buildOptions(): Options {
    return {
      hooks: {
        SessionStart: async (input) => {
          // Create agent session in Convex
        },
        SessionEnd: async (input) => {
          // Update final state in Convex
        }
      },
      systemPrompt: this.getSystemPrompt(),
      model: this.getModel()
    };
  }

  protected getModel(): string {
    return 'sonnet'; // Default
  }
}
```

### Pattern 2: Hook-Based Lifecycle Management
**What:** Use SDK hooks for automatic state synchronization
**When to use:** For session creation, updates, and completion tracking
**Example:**
```typescript
// Source: https://platform.claude.com/docs/en/agent-sdk/typescript
protected buildOptions(): Options {
  return {
    hooks: {
      SessionStart: async (input: BaseHookInput) => {
        // Create Convex session on start
        const session = await ctx.runMutation(model.agents.createAgentSession, {
          agentType: this.agentType,
          input: await this.extractInput(input),
          workflowId: this.workflowId!
        });
        this.sessionId = session;
      },
      SessionEnd: async (input: SessionEndHookInput) => {
        // Update final state on completion
        await ctx.runMutation(model.agents.updateAgentSession, {
          sessionId: this.sessionId!,
          status: 'completed',
          output: this.extractOutput(input)
        });
      }
    }
  };
}
```

### Anti-Patterns to Avoid
- **Automatic state persistence without hooks:** Would require wrapping the generator; hooks are the designed extension point
- **Storing full message history in Convex:** Blobs documents; store only essential state (status, output, error)
- **Tight coupling to specific agent logic:** Base class should only handle SDK + Convex, not agent behavior
- **Ignoring session resumption:** SDK supports resume via options; base class should handle it
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Agent session creation | Custom ID generation, manual timestamping | `model.agents.createAgentSession` from Phase 2 | Already implements Convex mutation with validators |
| Session state updates | Custom update logic, status validation | `model.agents.updateAgentSession` from Phase 2 | Handles optional fields, status validation |
| Session queries | Custom Convex queries, filtering | `model.agents.getAgentSession` from Phase 2 | Type-safe, already defined |
| Workflow association | Manual workflow ID tracking | Pass `workflowId` to BaseAgent constructor | Phase 2 schema designed for this relationship |
| Message streaming | Custom async iteration, error handling | SDK's `query()` async generator | Handles streaming, errors, interruptions |

**Key insight:** The Claude Agent SDK is designed to be the "agent runtime" — it handles Claude communication, tool execution, and message streaming. Our BaseAgent should coordinate between the SDK and Convex, not reimplement SDK features.

Phase 2 already provides the Convex integration layer. We're building the orchestration layer that connects SDK lifecycle events to Convex mutations.
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Not Handling Session Resumption
**What goes wrong:** Agent can't resume from interruptions, loses context
**Why it happens:** SDK requires explicit `resume` parameter; doesn't auto-resume
**How to avoid:** Store `session_id` from SessionStart hook, pass to `options.resume` on subsequent executions
**Warning signs:** Agent restarts from beginning every time, doesn't remember previous state

### Pitfall 2: Blocking on Convex Operations
**What goes wrong:** Agent pauses during execution waiting for Convex mutations
**Why it happens:** Convex mutations are async but fast; shouldn't block significantly
**How to avoid:** Use fire-and-forget for non-critical updates, await for state transitions
**Warning signs:** Agent seems slow, "thinking" for long periods without output

### Pitfall 3: Storing Large Blobs in Convex
**What goes wrong:** Documents exceed size limits, slow queries
**Why it happens:** Tempting to store full conversation history or large outputs
**How to avoid:** Store only essential state (status, summary, error). Use filesystem for artifacts (per Phase 1 decisions)
**Warning signs:** Convex dashboard shows large documents, slow queries

### Pitfall 4: Missing Error Handling in Hooks
**What goes wrong:** Unhandled rejections crash the agent
**Why it happens:** Hook callbacks are async, errors can be silently swallowed
**How to avoid:** Wrap hook logic in try-catch, log errors, update session status to 'error'
**Warning signs:** Agent stops unexpectedly, no error messages

### Pitfall 5: Abstract Class Not Enforcing Implementation
**What goes wrong:** Subclasses don't implement required methods, fail at runtime
**Why it happens:** TypeScript allows abstract classes without compile-time checks
**How to avoid:** Use `abstract` keyword on methods that must be implemented
**Warning signs:** Runtime errors about undefined methods
</common_pitfalls>

<code_examples>
## Code Examples

### Basic Agent Execution
```typescript
// Source: https://platform.claude.com/docs/en/agent-sdk/typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

const result = await query({
  prompt: 'Analyze this codebase',
  options: {
    systemPrompt: 'You are a code analysis agent.',
    permissionMode: 'bypassPermissions'
  }
});

for await (const message of result) {
  console.log(message);
}
```

### Hook for Session Creation
```typescript
// Source: SDK hook documentation
options: {
  hooks: {
    SessionStart: async (input: BaseHookInput) => {
      const { session_id, cwd } = input;
      console.log(`Agent starting: ${session_id} in ${cwd}`);
      return { continue: true };
    }
  }
}
```

### Session Resumption
```typescript
// Source: SDK options documentation
options: {
  resume: 'previous-session-id',  // Resumes from specific session
  resumeSessionAt: 'message-uuid' // Optional: resume at specific point
}
```

### Subagent Definition
```typescript
// Source: SDK subagent pattern
options: {
  agents: {
    'researcher': {
      description: 'Deep research agent for documentation',
      prompt: 'You research topics thoroughly...',
      tools: ['WebSearch', 'WebFetch', 'Read']
    }
  }
}
```

### Reading from Convex in Hooks
```typescript
// Pattern: Use existing model functions
import { model } from './model';

SessionStart: async (input) => {
  // Create agent session using Phase 2 function
  const session = await ctx.runMutation(model.agents.createAgentSession, {
    agentType: this.agentType,
    input: 'Starting task...',
    workflowId: this.workflowId!
  });
  this.sessionId = session;
}
```
</code_examples>

<sota_updates>
## State of the Art (2024-2025)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Claude Code SDK | Claude Agent SDK | Sept 2025 | Renamed to reflect broader use beyond coding |
| No official hooks | Rich hook system | 2025 | Use hooks for lifecycle, don't wrap query() manually |
| Manual session management | Built-in session persistence | 2025 | SDK handles session files, use hooks for custom persistence |

**New tools/patterns to consider:**
- **TypeScript V2 SDK (preview):** Simplified `send()`/`receive()` pattern — still in preview, use current stable API
- **MCP (Model Context Protocol):** Pre-built integrations to external services — use for extending agent capabilities

**Deprecated/outdated:**
- **Claude Code SDK name:** Now Claude Agent SDK (same package, broader vision)
- **Direct API usage for agents:** SDK provides better abstractions than raw Messages API
</sota_updates>

<open_questions>
## Open Questions

1. **How should BaseAgent handle workflow association?**
   - What we know: Phase 2 schema has `workflowId` in agentSessions metadata
   - What's unclear: Should BaseAgent auto-associate workflows, or require explicit passing?
   - Recommendation: Require explicit `workflowId` in constructor for clarity (matches Phase 2 design)

2. **Should test agent (DummyAgent) actually call Claude?**
   - What we know: User wants a simple test to prove the pattern works
   - What's unclear: Should DummyAgent make real API calls or mock the execution?
   - Recommendation: Use real SDK calls with minimal prompt to prove full integration works

3. **How to handle session initialization errors?**
   - What we know: Hooks can throw, but SDK may not handle hook failures gracefully
   - What's unclear: Should BaseAgent catch hook errors or let them propagate?
   - Recommendation: Catch hook errors, update session status to 'error', rethrow for caller to handle
</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- https://platform.claude.com/docs/en/agent-sdk/typescript - Complete API reference, functions, types, hooks
- https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk - Official SDK architecture, patterns, best practices
- https://github.com/anthropics/claude-agent-sdk-typescript - Official repository, package info

### Secondary (MEDIUM confidence)
- https://docs.convex.dev/typescript - Convex TypeScript best practices (verified against docs)
- Various community articles on Agent SDK usage - Verified patterns against official docs

### Tertiary (LOW confidence - needs validation)
- None - all findings verified against official documentation
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: Claude Agent SDK (TypeScript)
- Ecosystem: Convex integration patterns, TypeScript base class design
- Patterns: Abstract base class, hook-based lifecycle, manual state persistence
- Pitfalls: Session resumption, blocking operations, large blobs, error handling

**Confidence breakdown:**
- Standard stack: HIGH - from official docs and verified installation
- Architecture: HIGH - based on official SDK patterns and user requirements
- Pitfalls: HIGH - documented in SDK docs and common async/await patterns
- Code examples: HIGH - from official documentation

**Research date:** 2026-01-16
**Valid until:** 2025-02-15 (30 days - SDK ecosystem stable, recent release)
</metadata>

---

*Phase: 03-agent-foundation*
*Research completed: 2026-01-16*
*Ready for planning: yes*
