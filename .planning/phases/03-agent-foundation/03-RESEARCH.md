# Phase 2: Agent Foundation - Research

**Researched:** 2026-01-16
**Domain:** Claude Agent SDK session patterns and agent lifecycle management
**Confidence:** HIGH

## Summary

Researched the Claude Agent SDK's session management, agent lifecycle, and client factory patterns. The SDK provides automatic session creation, resumption with context preservation, and forking for branching conversations. Sessions are the foundation for building stateful agents that maintain conversation history across multiple interactions.

Key finding: The SDK handles session lifecycle automatically - creating sessions on first query, returning session IDs in system init messages, and supporting resumption via the `resume` option. Forking sessions enables parallel exploration without modifying the original. The `agents` option in `query()` is the standard pattern for defining subagents with specialized prompts, tools, and model preferences.

**Primary recommendation:** Don't build custom session management or agent lifecycle code. Use the SDK's built-in session handling with `resume` and `forkSession` options. Define base agent classes that wrap `query()` with common configuration (model, tools, permissions), and create specialized agents by extending with custom prompts.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @anthropic-ai/claude-agent-sdk | Latest (0.x in 2025) | Session management, query execution | Built-in session lifecycle, resumption, forking |
| @anthropic-ai/sdk | Latest | Types for Message API | Required dependency, type definitions |

### Development
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | Latest | Input schema validation | For custom tool definitions (if needed) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| SDK sessions | Custom session storage | SDK handles persistence, context limits, compaction automatically |
| agents option | Manual client spawning | SDK provides proper isolation, context management, coordination |

**Installation:**
```bash
npm install @anthropic-ai/claude-agent-sdk zod
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── agents/
│   ├── base/
│   │   └── Agent.ts          # Base agent class with common config
│   ├── planner/              # Planner agent implementation
│   ├── coder/                # Coder agent implementation
│   └── reviewer/             # Reviewer agent implementation
├── types/
│   └── agent.ts              # Agent-related TypeScript types
└── index.ts
```

### Pattern 1: Base Agent Class
**What:** Wrapper around `query()` with shared configuration
**When to use:** Foundation for all specialized agents
**Example:**
```typescript
// Source: SDK session management docs
import { query } from '@anthropic-ai/claude-agent-sdk'

interface AgentConfig {
  model?: string
  tools?: string[]
  permissionMode?: 'default' | 'bypassPermissions'
}

abstract class BaseAgent {
  protected config: AgentConfig

  constructor(config: AgentConfig) {
    this.config = {
      model: 'claude-sonnet-4-5',
      tools: ['Read', 'Write', 'Edit', 'Grep', 'Glob'],
      permissionMode: 'bypassPermissions',
      ...config
    }
  }

  protected async execute(prompt: string, options = {}) {
    return query({
      prompt,
      options: { ...this.config, ...options }
    })
  }

  abstract executeTask(input: string): Promise<string>
}
```

### Pattern 2: Session Creation and Capture
**What:** Extract session ID from system init message
**When to use:** Any agent that needs session persistence
**Example:**
```typescript
// Source: Session management docs
import { query } from '@anthropic-ai/claude-agent-sdk'

async function createSession() {
  const response = query({
    prompt: 'Help me build a web application',
    options: { model: 'claude-sonnet-4-5' }
  })

  let sessionId: string | undefined

  for await (const message of response) {
    if (message.type === 'system' && message.subtype === 'init') {
      sessionId = message.session_id
      console.log(`Session started: ${sessionId}`)
    }
  }

  return sessionId
}
```

### Pattern 3: Session Resumption
**What:** Continue a previous session with full context
**When to use:** Multi-turn conversations, stateful workflows
**Example:**
```typescript
// Source: Session management docs
async function resumeSession(sessionId: string) {
  const response = query({
    prompt: 'Continue where we left off',
    options: {
      resume: sessionId,
      model: 'claude-sonnet-4-5'
    }
  })

  for await (const message of response) {
    console.log(message)
  }
}
```

### Pattern 4: Forking Sessions
**What:** Create a new branch from an existing session
**When to use:** Exploring alternatives, testing without modifying original
**Example:**
```typescript
// Source: Session management docs
async function forkSession(originalSessionId: string) {
  const forkedResponse = query({
    prompt: 'Try a different approach',
    options: {
      resume: originalSessionId,
      forkSession: true,  // Creates new session ID
      model: 'claude-sonnet-4-5'
    }
  })

  // Original session remains unchanged
  const originalContinued = query({
    prompt: 'Continue original work',
    options: {
      resume: originalSessionId,
      forkSession: false,  // Continues original
      model: 'claude-sonnet-4-5'
    }
  })
}
```

### Pattern 5: Specialized Agent Definition
**What:** Extend base agent with custom prompt and configuration
**When to use:** Planner, Coder, Reviewer agents
**Example:**
```typescript
// Source: Agent SDK docs + engineering blog
class PlannerAgent extends BaseAgent {
  constructor() {
    super({
      model: 'claude-sonnet-4-5',
      tools: ['Read', 'Grep', 'Glob'],  // Read-only for planning
    })
  }

  async executeTask(task: string): Promise<string> {
    const response = await this.execute(
      `Break down this task into implementation steps: ${task}`,
      {
        agents: {
          planner: {
            description: 'Creates detailed implementation plans',
            prompt: `You are a planning agent.
            - Break tasks into clear, sequential steps
            - Identify dependencies between steps
            - Estimate complexity for each step
            - Return a structured plan`,
          }
        }
      }
    )

    let result = ''
    for await (const message of response) {
      if (message.type === 'result') {
        result = message.result
      }
    }
    return result
  }
}
```

### Anti-Patterns to Avoid
- **Custom session storage**: SDK handles persistence, resumption, and context limits
- **Manual agent spawning**: Use `agents` option instead of multiple client instances
- **Ignoring session IDs**: Can't resume without capturing session_id from init message
- **Not using base classes**: Duplication across agent implementations
- **Synchronous for loops**: Always use `for await` with the async generator

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session persistence | Custom DB/filesystem storage | `resume` option with session_id | SDK handles context limits, compaction, state management |
| Context window management | Manual truncation/summarization | Built-in compaction | SDK automatically compresses when approaching limits |
| Agent isolation | Separate client instances | `agents` option in query() | Proper context separation, standardized handoff |
| Session branching | Copy-paste session data | `forkSession: true` | Clean branching without modifying original |
| Message streaming | Custom async handling | `for await` of query() generator | Handles all message types, errors, completion |

**Key insight:** The Claude Agent SDK's session management is production-hardened. Custom implementations struggle with context limits, state consistency, error recovery, and compaction. The SDK's sessions handle automatic context compression, resumption from any point, and proper state serialization.

## Common Pitfalls

### Pitfall 1: Not Capturing Session ID
**What goes wrong:** Can't resume sessions because session_id wasn't saved
**Why it happens:** Session ID is only in the first `system:init` message
**How to avoid:** Always extract and save `message.session_id` from the init message
**Warning signs:** No session persistence, can't continue conversations

### Pitfall 2: Confusing Resume vs Fork
**What goes wrong:** Original session gets modified when trying to experiment
**Why it happens:** Default `forkSession: false` continues the original session
**How to avoid:** Use `forkSession: true` when you want to preserve the original
**Warning signs:** Can't get back to previous conversation state

### Pitfall 3: Ignoring Context Limits
**What goes wrong:** Long conversations truncate, losing important context
**Why it happens:** Context window fills up (200K tokens with compression)
**How to avoid:** Rely on SDK's automatic compaction, store important data externally
**Warning signs:** Agent "forgets" earlier parts of long conversations

### Pitfall 4: Synchronous Processing
**What goes wrong:** Agent hangs, never completes
**Why it happens:** Using `forEach` or other sync patterns instead of `for await`
**How to avoid:** Always iterate with `for await (const message of response)`
**Warning signs:** Code completes immediately without results

### Pitfall 5: Not Handling Errors
**What goes wrong:** Unhandled rejections crash the process
**Why it happens:** `query()` generator can throw (network, API, session errors)
**How to avoid:** Wrap in try-catch, handle `type: 'result'` with `is_error: true`
**Warning signs:** Process exits with code 1 on session errors

## Code Examples

### Complete Agent Lifecycle
```typescript
// Source: Session docs + SDK patterns
import { query } from '@anthropic-ai/claude-agent-sdk'

class Agent {
  private sessionId?: string

  async start(prompt: string) {
    const response = query({
      prompt,
      options: { model: 'claude-sonnet-4-5' }
    })

    for await (const message of response) {
      // Capture session ID
      if (message.type === 'system' && message.subtype === 'init') {
        this.sessionId = message.session_id
      }

      // Handle completion
      if (message.type === 'result') {
        if (message.is_error) {
          throw new Error(`Agent failed: ${message.result}`)
        }
        return message.result
      }
    }
  }

  async continue(prompt: string) {
    if (!this.sessionId) {
      throw new Error('No active session. Call start() first.')
    }

    const response = query({
      prompt,
      options: {
        resume: this.sessionId,
        model: 'claude-sonnet-4-5'
      }
    })

    for await (const message of response) {
      if (message.type === 'result') {
        return message.result
      }
    }
  }
}
```

### Client Factory Pattern
```typescript
// Source: Common factory pattern for SDK clients
class AgentFactory {
  private static defaultConfig = {
    model: 'claude-sonnet-4-5',
    permissionMode: 'bypassPermissions' as const,
    tools: ['Read', 'Write', 'Edit', 'Grep', 'Glob']
  }

  static createPlanner() {
    return query({
      prompt: '',
      options: {
        ...this.defaultConfig,
        tools: ['Read', 'Grep', 'Glob'],  // Read-only
        agents: {
          planner: {
            description: 'Creates implementation plans',
            prompt: 'Break tasks into clear steps...'
          }
        }
      }
    })
  }

  static createCoder() {
    return query({
      prompt: '',
      options: {
        ...this.defaultConfig,
        agents: {
          coder: {
            description: 'Implements code based on plans',
            prompt: 'Write clean, tested code...'
          }
        }
      }
    })
  }
}
```

## State of the Art (2024-2025)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual session storage | SDK `resume` option | 2025 | Don't build custom persistence |
| Context window truncation | Automatic compaction | 2025 | Long conversations handled automatically |
| Separate client instances | `agents` option | Sept 2025 | Subagents now first-class |
| No session branching | `forkSession` option | 2025 | Experiment without modifying originals |

**New tools/patterns to consider:**
- **V2 SDK interface (preview):** `send()` and `receive()` patterns for simpler multi-turn
- **File checkpointing:** Track and revert file changes across sessions
- **Structured outputs:** Define JSON schemas for agent responses

**Deprecated/outdated:**
- **Manual context management:** SDK handles compression automatically
- **Custom session serialization:** Use built-in session_id and resume

## Open Questions

1. **Long-running agent state persistence**
   - What we know: SDK handles sessions, compaction, resumption
   - What's unclear: Best pattern for persisting agent-specific state (not just conversation) across process restarts
   - Recommendation: Use filesystem as shared state for long-running workflows. Store artifacts (plans, code) in files, pass paths between agents.

2. **Error recovery patterns**
   - What we know: SDK throws on errors, session can become invalid
   - What's unclear: How to gracefully recover from session errors without losing context
   - Recommendation: Wrap all `query()` calls in try-catch, implement retry logic with exponential backoff, capture session state before errors.

## Sources

### Primary (HIGH confidence)
- [Session Management - Claude Docs](https://platform.claude.com/docs/en/agent-sdk/sessions) - Official session management documentation
- [Agent SDK reference - TypeScript](https://platform.claude.com/docs/en/agent-sdk/typescript) - Complete API reference
- [Building agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk) - Engineering best practices (Sept 2025)

### Secondary (MEDIUM confidence)
- [The Complete Guide to Building Agents](https://nader.substack.com/p/the-complete-guide-to-building-agents) - Community guide (updated 2025)
- [How to Use Claude Agent SDK: Step-by-Step](https://skywork.ai/blog/how-to-use-claude-agent-sdk-step-by-step-ai-agent-tutorial/) - Tutorial with examples
- [Claude Agent Skills: First Principles Deep Dive](https://leehanchung.github.io/blogs/2025/10/26/claude-skills-deep-dive/) - Lifecycle walkthrough (Oct 2025)

### Tertiary (LOW confidence - needs validation)
- [Session lifecycle discussion #7750](https://github.com/anthropics/claude-code/issues/7750) - GitHub issue (Sept 2025, may be resolved)
- Various community blog posts - Verified patterns against official docs where possible

## Metadata

**Research scope:**
- Core technology: @anthropic-ai/claude-agent-sdk session management
- Ecosystem: Base agent patterns, client factory, lifecycle management
- Patterns: Session creation, resumption, forking, specialized agents
- Pitfalls: Session ID handling, context limits, error handling

**Confidence breakdown:**
- Standard stack: HIGH - verified with official documentation
- Architecture: HIGH - from official SDK docs and engineering blog
- Pitfalls: HIGH - documented in official docs and GitHub issues
- Code examples: HIGH - verified against official documentation

**Research date:** 2026-01-16
**Valid until:** 2026-02-15 (30 days - SDK is actively developed)

---

*Phase: 02-agent-foundation*
*Research completed: 2026-01-16*
*Ready for planning: yes*
