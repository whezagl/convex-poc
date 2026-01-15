# Phase 6: Orchestration - Research

**Researched:** 2026-01-16
**Domain:** Multi-agent coordination patterns, workflow design, handoff protocols
**Confidence:** HIGH

## Summary

Researched multi-agent orchestration patterns including handoff protocols, workflow state management, and production reliability practices. The industry has converged on the **orchestrator-worker pattern** where a lead agent coordinates specialized subagents that work in parallel. Key patterns include conditional handoffs, state sharing between agents, and error propagation across multi-agent workflows.

Anthropic's Research system demonstrates the production approach: a lead researcher agent plans and spawns specialized subagents that work in parallel, then synthesizes results. Critical challenges include **result coordination** (combining subagent outputs), **state consistency** (maintaining context across agents), and **error propagation** (handling failures in parallel workflows).

Key finding: For sequential handoffs (Planner → Coder → Reviewer), use simple state-passing via filesystem. Each agent reads the previous agent's output, processes it, and writes its own output. For parallel workflows, use the SDK's `agents` option which handles subagent spawning and result collection automatically.

**Primary recommendation:** Implement sequential orchestration with filesystem-based state passing for this POC. Use files as the "shared memory" between agents: Planner writes plan.md, Coder reads plan.md and writes code, Reviewer reads both and writes review.md. This pattern is simple, debuggable, and matches how the SDK's subagents work internally.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @anthropic-ai/claude-agent-sdk | Latest (0.x in 2025) | Subagent coordination, `agents` option | Built-in subagent spawning, parallel execution |
| @anthropic-ai/sdk | Latest | Types for Message API | Required dependency |

### Workflow (Optional for POC)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None required | - | Filesystem state passing | POC uses files for state sharing |
| LangGraph | Latest | Complex graph workflows | Production multi-agent systems (NOT for POC) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Filesystem state | In-memory state objects | Files are simpler, debuggable, persistent |
| SDK agents option | LangGraph/manual orchestration | SDK is built-in, LangGraph is external dependency |
| Sequential handoffs | Parallel subagents | Sequential is simpler for Planner→Coder→Reviewer |

**Installation:**
```bash
npm install @anthropic-ai/claude-agent-sdk
# LangGraph is OPTIONAL - only needed for complex workflows
# npm install @langchain/langgraph
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── agents/          # Agent implementations
├── orchestrator/
│   ├── sequential.ts    # Sequential workflow (Planner→Coder→Reviewer)
│   ├── state.ts         # State management (filesystem-based)
│   └── workflow.ts      # Workflow coordination logic
└── types/
    └── workflow.ts      # Workflow-related types
```

### Pattern 1: Orchestrator-Worker (Anthropic's Approach)
**What:** Lead agent coordinates specialized subagents
**When to use:** Complex tasks requiring parallel exploration
**Example:**
```typescript
// Source: Anthropic multi-agent research system
async function orchestrateResearch(query: string) {
  // Lead agent creates plan
  const leadAgent = await query({
    prompt: `Create a research plan for: ${query}`,
    options: {
      model: 'claude-sonnet-4-5',
      agents: {
        lead: {
          description: 'Plans research and delegates to subagents',
          prompt: `You are a research lead agent.
          - Analyze the query
          - Decompose into subtasks
          - Spawn 3-5 specialized subagents
          - Synthesize their findings`
        }
      }
    }
  })

  // Lead agent spawns subagents via Task tool
  // (SDK handles this automatically with agents option)
}
```

### Pattern 2: Sequential Handoff (Filesystem State)
**What:** Each agent reads previous output, processes, writes next output
**When to use:** Linear workflows (Planner → Coder → Reviewer)
**Example:**
```typescript
// Source: Common sequential pattern, verified with SDK docs
import { writeFile, readFile } from 'fs/promises'

async function sequentialWorkflow(task: string) {
  // Step 1: Planner creates plan
  const plan = await plannerAgent.execute(task)
  await writeFile('/workspace/plan.md', plan)

  // Step 2: Coder reads plan, implements code
  const planContent = await readFile('/workspace/plan.md', 'utf-8')
  const code = await coderAgent.execute(planContent)
  await writeFile('/workspace/code.ts', code)

  // Step 3: Reviewer reads both, validates
  const [reviewedPlan, reviewedCode] = await Promise.all([
    readFile('/workspace/plan.md', 'utf-8'),
    readFile('/workspace/code.ts', 'utf-8')
  ])
  const review = await reviewerAgent.execute(`${reviewedPlan}\n\n${reviewedCode}`)
  await writeFile('/workspace/review.md', review)
}
```

### Pattern 3: SDK Subagents (Built-in Orchestration)
**What:** Use `agents` option for parallel subagent execution
**When to use:** Tasks that benefit from parallel exploration
**Example:**
```typescript
// Source: Agent SDK documentation
import { query } from '@anthropic-ai/claude-agent-sdk'

const result = await query({
  prompt: 'Research AI agent frameworks in 2025',
  options: {
    model: 'claude-sonnet-4-5',
    agents: {
      researcher1: {
        description: 'Searches for recent framework releases',
        prompt: 'Focus on official releases and documentation',
        tools: ['WebSearch', 'WebFetch']
      },
      researcher2: {
        description: 'Finds community discussions and comparisons',
        prompt: 'Focus on Reddit, HN, and technical blogs',
        tools: ['WebSearch', 'WebFetch']
      }
    }
  }
})

// SDK automatically spawns both agents in parallel
// and synthesizes their results
```

### Pattern 4: State Management for Workflows
**What:** Track workflow progress, errors, and artifacts
**When to use:** Long-running workflows with multiple agents
**Example:**
```typescript
// Source: Production patterns from Anthropic's blog
interface WorkflowState {
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  currentAgent: string
  steps: {
    name: string
    agent: string
    status: string
    startTime: Date
    endTime?: Date
    output?: string
    error?: string
  }[]
  artifacts: {
    type: 'plan' | 'code' | 'review'
    path: string
  }[]
}

async function runWorkflow(state: WorkflowState) {
  for (const step of state.steps) {
    step.status = 'in_progress'
    step.startTime = new Date()

    try {
      const agent = getAgent(step.agent)
      const output = await agent.execute(state)
      step.output = output
      step.status = 'completed'
      step.endTime = new Date()
    } catch (error) {
      step.error = String(error)
      step.status = 'failed'
      throw error  // Or continue based on error strategy
    }
  }
}
```

### Pattern 5: Error Handling Across Agents
**What:** Graceful degradation when agents fail
**When to use:** Production systems requiring reliability
**Example:**
```typescript
// Source: Production reliability patterns
interface AgentResult {
  success: boolean
  output?: string
  error?: string
  retryable: boolean
}

async function executeAgentWithErrorHandling(
  agent: Agent,
  input: string,
  maxRetries = 3
): Promise<AgentResult> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const output = await agent.execute(input)
      return { success: true, output }
    } catch (error) {
      const isRetryable = isRetryableError(error)
      if (!isRetryable || attempt === maxRetries - 1) {
        return {
          success: false,
          error: String(error),
          retryable: isRetryable
        }
      }
      // Exponential backoff
      await sleep(2 ** attempt * 1000)
    }
  }
  return { success: false, error: 'Max retries exceeded', retryable: true }
}
```

### Anti-Patterns to Avoid
- **Tight coupling between agents**: Agents shouldn't know about each other's internals
- **Shared mutable state**: Use immutable state passing or filesystem artifacts
- **Synchronous agent execution**: Always use `await` with async agent operations
- **No error boundaries**: One agent failure shouldn't crash the entire workflow
- **Over-engineering for POC**: Don't add LangGraph or complex orchestration for simple sequential flows

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Subagent spawning | Custom parallel execution logic | SDK `agents` option | Handles isolation, context, result collection |
| Agent handoff | Custom routing logic | Filesystem state or SDK agents | Simpler, debuggable, standard pattern |
| Workflow state | Custom state machine | Simple state object + files | POC doesn't need complex state management |
| Error recovery | Custom retry logic | Try-catch with exponential backoff | Standard pattern, sufficient for POC |
| Result synthesis | Custom result merging | Sequential processing or lead agent | Let agents process each other's outputs |

**Key insight:** Multi-agent orchestration is fundamentally about **state management** and **error propagation**. The SDK's `agents` option handles parallel execution and result collection. For sequential workflows, the filesystem is a simple, effective "shared memory" that makes workflows debuggable and persistent.

## Common Pitfalls

### Pitfall 1: Tight Coupling Between Agents
**What goes wrong:** Agents reference each other directly, can't test independently
**Why it happens:** Passing agent instances instead of data
**How to avoid:** Pass data (file paths, artifacts) between agents, not agent references
**Warning signs:** Importing agent classes in other agent files

### Pitfall 2: No Error Boundaries
**What goes wrong:** One agent failure crashes entire workflow
**Why it happens:** Not wrapping agent execution in try-catch
**How to avoid:** Wrap each agent call in error handling, implement retry logic
**Warning signs:** Workflow stops midway with no partial results

### Pitfall 3: Losing Context Between Agents
**What goes wrong:** Later agents don't have enough context from earlier agents
**Why it happens:** Only passing final output, not intermediate artifacts
**How to avoid:** Pass all relevant artifacts (plan, code, files) to each agent
**Warning signs:** Reviewer asks "What was the original task?"

### Pitfall 4: Over-Parallelization
**What goes wrong:** Too many subagents spawned, diminishing returns
**Why it happens:** Not scaling agent count to task complexity
**How to avoid:** Simple tasks = 1-2 agents, complex = 3-5 agents (from Anthropic's blog)
**Warning signs:** More than 5 subagents for a simple query

### Pitfall 5: Ignoring Production Realities
**What goes wrong:** POC patterns don't scale to production
**Why it happens:** Not considering reliability, observability, deployment
**How to avoid:** Design with production in mind: logging, checkpoints, error recovery
**Warning signs:** No way to track workflow progress or debug failures

### Pitfall 6: Synchronous Bottlenecks
**What goes wrong:** Lead agent waits for each subagent sequentially
**Why it happens:** Not using parallel execution
**How to avoid:** Use SDK's `agents` option (parallel by default)
**Warning signs:** Workflow takes N× longer than it should

## Code Examples

### Sequential Workflow (Planner → Coder → Reviewer)
```typescript
// Source: POC pattern, verified with SDK docs
import { writeFile, readFile } from 'fs/promises'
import { join } from 'path'

interface WorkflowContext {
  task: string
  workspace: string
}

async function runSequentialWorkflow(context: WorkflowContext) {
  const { task, workspace } = context

  // Step 1: Planner
  console.log('Step 1: Planning...')
  const planner = new PlannerAgent()
  const plan = await planner.execute(`Create a plan for: ${task}`)
  const planPath = join(workspace, 'plan.md')
  await writeFile(planPath, plan)
  console.log(`Plan written to ${planPath}`)

  // Step 2: Coder
  console.log('Step 2: Coding...')
  const planContent = await readFile(planPath, 'utf-8')
  const coder = new CoderAgent()
  const code = await coder.execute(`Implement this plan:\n\n${planContent}`)
  const codePath = join(workspace, 'code.ts')
  await writeFile(codePath, code)
  console.log(`Code written to ${codePath}`)

  // Step 3: Reviewer
  console.log('Step 3: Reviewing...')
  const reviewInput = `
Task: ${task}

Plan:
${planContent}

Code:
${code}
  `
  const reviewer = new ReviewerAgent()
  const review = await reviewer.execute(reviewInput)
  const reviewPath = join(workspace, 'review.md')
  await writeFile(reviewPath, review)
  console.log(`Review written to ${reviewPath}`)

  return {
    plan: planPath,
    code: codePath,
    review: reviewPath
  }
}
```

### Parallel Subagents (SDK Option)
```typescript
// Source: SDK documentation
import { query } from '@anthropic-ai/claude-agent-sdk'

async function parallelResearch(query: string) {
  const result = query({
    prompt: `Research this topic thoroughly: ${query}`,
    options: {
      model: 'claude-sonnet-4-5',
      agents: {
        webResearcher: {
          description: 'Searches the web for recent information',
          prompt: 'Find latest articles, blog posts, and documentation',
          tools: ['WebSearch', 'WebFetch']
        },
        codeResearcher: {
          description: 'Searches code repositories for examples',
          prompt: 'Find GitHub repos, code examples, implementations',
          tools: ['WebSearch', 'WebFetch']
        },
        expertAnalyst: {
          description: 'Analyzes findings and synthesizes insights',
          prompt: 'Review all findings and provide expert analysis',
          tools: []  // No tools needed, just analysis
        }
      }
    }
  })

  let finalResult = ''
  for await (const message of result) {
    if (message.type === 'result') {
      finalResult = message.result
    }
  }

  return finalResult
}
```

### Error-Aware Workflow
```typescript
// Source: Production patterns
interface StepResult {
  step: string
  success: boolean
  output?: string
  error?: string
}

async function runWorkflowWithErrorHandling(task: string) {
  const results: StepResult[] = []

  // Planner
  try {
    const plan = await plannerAgent.execute(task)
    results.push({ step: 'planner', success: true, output: plan })
  } catch (error) {
    results.push({ step: 'planner', success: false, error: String(error) })
    console.error('Planner failed:', error)
    return results  // Stop if planning fails
  }

  // Coder (can continue if planner succeeded)
  try {
    const plan = results[0].output!
    const code = await coderAgent.execute(plan)
    results.push({ step: 'coder', success: true, output: code })
  } catch (error) {
    results.push({ step: 'coder', success: false, error: String(error) })
    console.error('Coder failed:', error)
    // Can still proceed to reviewer with partial results
  }

  // Reviewer (reviews whatever was produced)
  try {
    const context = results
      .filter(r => r.success)
      .map(r => r.output!)
      .join('\n\n')
    const review = await reviewerAgent.execute(context)
    results.push({ step: 'reviewer', success: true, output: review })
  } catch (error) {
    results.push({ step: 'reviewer', success: false, error: String(error) })
  }

  return results
}
```

## State of the Art (2024-2025)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual agent spawning | SDK `agents` option | Sept 2025 | Built-in parallel execution |
| Complex orchestration frameworks | Simple filesystem state | 2025 | POCs don't need LangGraph complexity |
| Tight coupling | Loose coupling via artifacts | 2025 | Agents are independent, testable |
| No error handling | Comprehensive error patterns | 2025 | Production reliability requires error boundaries |

**New tools/patterns to consider:**
- **LangGraph:** For complex graph-based workflows (NOT needed for simple POC)
- **MCP (Model Context Protocol):** For external tool integrations
- **File checkpointing:** Track and revert file changes across sessions

**Deprecated/outdated:**
- **Manual agent spawning:** Use SDK's `agents` option
- **Tightly coupled agents:** Pass artifacts, not references
- **In-memory state only:** Use filesystem for persistence and debugging

## Open Questions

1. **Workflow state persistence**
   - What we know: Filesystem works for artifacts, SDK handles sessions
   - What's unclear: Best pattern for persisting workflow state across process restarts
   - Recommendation: Write workflow state to a JSON file after each step. On restart, read the state and continue from the last completed step.

2. **Parallel vs Sequential Decision**
   - What we know: SDK supports both, sequential is simpler
   - What's unclear: When to use parallel vs sequential for this POC
   - Recommendation: Start with sequential (Planner→Coder→Reviewer). Add parallel subagents only if specific tasks benefit from parallel exploration (e.g., multiple research directions).

## Sources

### Primary (HIGH confidence)
- [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) - Anthropic's production multi-agent architecture (Jun 2025)
- [Building agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk) - SDK orchestration patterns (Sept 2025)
- [AI Agent Orchestration Patterns - Azure Architecture Center](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns) - Fundamental orchestration patterns (Jul 2025)

### Secondary (MEDIUM confidence)
- [How Agent Handoffs Work in Multi-Agent Systems](https://towardsdatascience.com/how-agent-handoffs-work-in-multi-agent-systems/) - Handoff technical details (Dec 2025)
- [Design Patterns for AI Agents: Orchestration & Handoffs](https://skywork.ai/blog/ai-agent-orchestration-best-practices-handoffs/) - Field-tested best practices
- [Multi-agent Patterns](https://strandsagents.com/latest/documentation/docs/user-guide/concepts/multi-agent/multi-agent-patterns/) - Graph, Swarm, and Workflow patterns

### Tertiary (LOW confidence - needs validation)
- [7 Ways Multi-Agent AI Fails in Production](https://www.techaheadcorp.com/blog/ways-multi-agent-ai-fails-in-production/) - Production failure modes (2 days ago)
- [Ensuring AI Agent Reliability in Production](https://www.getmaxim.ai/articles/ensuring-ai-agent-reliability-in-production-environments-strategies-and-solutions/) - Reliability strategies (Nov 2025)
- Various community blog posts - Verified patterns against official docs where possible

## Metadata

**Research scope:**
- Core technology: Multi-agent orchestration with Claude Agent SDK
- Ecosystem: Handoff patterns, workflow state, error handling
- Patterns: Orchestrator-worker, sequential workflows, parallel subagents
- Pitfalls: Coupling, error boundaries, context loss, over-parallelization

**Confidence breakdown:**
- Standard stack: HIGH - verified with official Anthropic documentation
- Architecture: HIGH - from Anthropic's production system blog post
- Pitfalls: MEDIUM - some from community sources, verified against official docs
- Code examples: HIGH - based on verified SDK patterns and official docs

**Research date:** 2026-01-16
**Valid until:** 2026-02-15 (30 days - multi-agent patterns evolving rapidly)

---

*Phase: 06-orchestration*
*Research completed: 2026-01-16*
*Ready for planning: yes*
