# Phase 15: Agent Orchestration - Research

**Researched:** 2026-01-18
**Domain:** Multi-agent systems, task queue management, parallel execution, LLM routing
**Confidence:** MEDIUM

## Summary

This phase requires building a specialized agent orchestration system that routes tasks to CRUD-specific agents (BE/FE boilerplate, CRUD APIs, services, UI pages), manages parallel sub-task execution with concurrency limits, and tracks progress in Convex. Research reveals that **proper-lockfile** is the industry standard for file locking in Node.js, **p-queue** provides priority queue management with concurrency control, and LLM-based keyword routing is the current state-of-the-art for task classification in 2025. The existing SequentialOrchestrator provides a foundation but needs significant refactoring to support parallel execution and specialized agent types.

**Primary recommendation:** Use **proper-lockfile** for file locking during parallel operations, **p-queue** for task queue management with priority scheduling, implement a hybrid keyword+LLM classifier for agent routing, and extend the existing BaseAgent pattern to support specialized CRUD agents with Convex progress tracking.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **proper-lockfile** | ^4.1.2 | File locking for parallel operations | Inter-process/machine locking, cross-platform, handles stale locks |
| **p-queue** | ^8.0.1 | Priority queue with concurrency control | Mature, TypeScript-native, priority scheduling, concurrency limits |
| **@anthropic-ai/claude-agent-sdk** | ^0.2.7 | Agent SDK integration | Existing dependency, proven in v0.3, supports Convex hooks |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **chokidar** | ^4.0.0 | File watching (already in Phase 14) | Hot-reload for template changes during development |
| **handlebars** | ^4.7.8 | Template rendering (already in Phase 14) | Code generation from templates |
| **sql-parser-cst** | latest | DDL parsing (already in Phase 14) | Extract table definitions for CRUD operations |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| **proper-lockfile** | lockfile, mkdirp | proper-lockfile handles stale locks, cross-platform, network FS support |
| **p-queue** | async-priority-queue, @datastructures-js/priority-queue | p-queue has better concurrency control, Promise-based API |
| **LLM classifier** | Regex/keyword only | LLM handles ambiguous cases, better UX, future-proof |

**Installation:**
```bash
# Core dependencies
pnpm add proper-lockfile p-queue

# Note: claude-agent-sdk, chokidar, handlebars, sql-parser-cst already installed
```

## Architecture Patterns

### Existing Codebase Patterns to Refactor

The current **SequentialOrchestrator** (`src/orchestrator/SequentialOrchestrator.ts`) provides a foundation but needs enhancement:

**Current pattern:**
- Sequential execution: Planner → Coder → Reviewer
- Filesystem state passing via JSON artifacts
- Convex session tracking per agent
- No parallel execution or sub-task support

**Refactoring needs:**
1. **Parallel execution**: Replace sequential steps with concurrent sub-task execution
2. **Agent specialization**: Add CRUD-specific agents (BE/FE boilerplate, CRUD APIs, services, UI)
3. **Task queue**: Implement priority-based queue with max 5 concurrent tasks
4. **Sub-task management**: Parent-child relationships with aggregate status tracking
5. **Progress streaming**: Real-time Convex updates during agent execution

### Recommended Project Structure

```
packages/agent-orchestrator/
├── src/
│   ├── orchestrator/              # Orchestration logic
│   │   ├── TaskQueue.ts           # Priority queue with p-queue
│   │   ├── AgentDispatcher.ts     # Keyword routing + LLM classifier
│   │   ├── SubTaskManager.ts      # Sub-task spawning and coordination
│   │   ├── FileLockManager.ts     # proper-lockfile wrapper
│   │   └── ParallelOrchestrator.ts # Main orchestrator (refactored)
│   ├── agents/                    # Specialized CRUD agents
│   │   ├── BaseCRUDAgent.ts       # Extend BaseAgent with template integration
│   │   ├── BEBoilerplateAgent.ts  # Backend setup (1 sub-task)
│   │   ├── FEBoilerplateAgent.ts  # Frontend setup (1 sub-task)
│   │   ├── BECRUDAgent.ts         # Backend CRUD APIs (N sub-tasks)
│   │   ├── FECRUDAgent.ts         # Frontend services (N sub-tasks)
│   │   └── UICRUDAgent.ts         # UI CRUD pages (N sub-tasks)
│   ├── types/                     # Type definitions
│   │   ├── task.ts                # Task, SubTask interfaces
│   │   ├── queue.ts               # Queue options, priority types
│   │   └── agent.ts               # Agent routing types
│   └── utils/
│       ├── keywordExtractor.ts    # Keyword matching logic
│       ├── progressTracker.ts     # Convex progress updates
│       └── convexMutations.ts     # Type-safe Convex mutations
└── package.json
```

### Pattern 1: Priority Queue with Concurrency Control

**What:** Use **p-queue** to manage task execution with priority scheduling and max 5 concurrent tasks

**When to use:** All task queue operations

**Example:**
```typescript
// Source: https://github.com/sindresorhus/p-queue
import PQueue from 'p-queue';

interface TaskOptions {
  priority: number; // 1 (low) to 10 (high)
  taskId: string;
}

// Create queue with max 5 concurrent tasks
const taskQueue = new PQueue({
  concurrency: 5,
  autoStart: true,
  timeout: 300000, // 5 min timeout per task
});

// Add task with priority
async function scheduleTask(
  taskFn: () => Promise<void>,
  options: TaskOptions
): Promise<void> {
  return taskQueue.add(taskFn, {
    priority: options.priority,
  });
}

// Queue state tracking
taskQueue.on('active', () => {
  console.log(`Queue size: ${taskQueue.size}, Pending: ${taskQueue.pending}`);
});

taskQueue.on('next', () => {
  console.log(`Task completed. Remaining: ${taskQueue.size}`);
});
```

### Pattern 2: File Locking for Parallel Operations

**What:** Use **proper-lockfile** to prevent race conditions when multiple agents write to the same files

**When to use:** All parallel file write operations

**Example:**
```typescript
// Source: https://github.com/moxystudio/node-proper-lockfile
import lock from 'proper-lockfile';

interface FileLockOptions {
  retries: number;
  stale: number; // ms before lock is considered stale
  update: number; // ms to update lockfile mtime
}

class FileLockManager {
  private locks = new Map<string, () => Promise<void>>();

  async acquireLock(filePath: string): Promise<() => Promise<void>> {
    const release = await lock(filePath, {
      retries: 10,
      stale: 10000, // 10 seconds
      update: 2000, // Update every 2 seconds
    });

    this.locks.set(filePath, release);
    return release;
  }

  async releaseLock(filePath: string): Promise<void> {
    const release = this.locks.get(filePath);
    if (release) {
      await release();
      this.locks.delete(filePath);
    }
  }

  async withLock<T>(
    filePath: string,
    fn: () => Promise<T>
  ): Promise<T> {
    await this.acquireLock(filePath);
    try {
      return await fn();
    } finally {
      await this.releaseLock(filePath);
    }
  }
}
```

### Pattern 3: Keyword Routing with LLM Fallback

**What:** Hybrid approach: try keyword extraction first, use LLM classification if ambiguous

**When to use:** Agent dispatch when new tasks are created

**Example:**
```typescript
// Source: LLM routing research (2025)
// https://medium.com/@vanshkhaneja/llm-as-a-router-how-to-fine-tune-models-for-intent-based-workflows-6d272eab55d1

interface AgentClassification {
  agentType: 'BE Boilerplate' | 'FE Boilerplate' | 'BE CRUD' | 'FE CRUD' | 'UI CRUD';
  confidence: number;
  keywords: string[];
}

class AgentDispatcher {
  private keywordPatterns = {
    'BE Boilerplate': ['be setup', 'backend setup', 'backend boilerplate'],
    'FE Boilerplate': ['fe setup', 'frontend setup', 'frontend boilerplate'],
    'BE CRUD': ['be crud apis', 'backend crud', 'api generation'],
    'FE CRUD': ['fe crud services', 'frontend services', 'service generation'],
    'UI CRUD': ['ui crud pages', 'ui pages', 'page generation'],
  };

  async classifyTask(description: string): Promise<AgentClassification> {
    // Step 1: Try keyword extraction (fast path)
    const keywordMatch = this.extractKeywords(description);
    if (keywordMatch) {
      return {
        agentType: keywordMatch,
        confidence: 0.95,
        keywords: this.extractedKeywords(description),
      };
    }

    // Step 2: Use LLM classifier (fallback for ambiguous cases)
    return await this.llmClassify(description);
  }

  private extractKeywords(description: string): string | null {
    const normalized = description.toLowerCase();

    for (const [agentType, patterns] of Object.entries(this.keywordPatterns)) {
      for (const pattern of patterns) {
        if (normalized.includes(pattern)) {
          return agentType;
        }
      }
    }

    return null;
  }

  private async llmClassify(description: string): Promise<AgentClassification> {
    // Use Claude to classify ambiguous tasks
    const prompt = `
Classify this task into one of these categories:
- BE Boilerplate
- FE Boilerplate
- BE CRUD
- FE CRUD
- UI CRUD

Task: "${description}"

Respond with JSON: {"agentType": "...", "confidence": 0.0-1.0, "reasoning": "..."}
`;

    const response = await this.llm.generate(prompt);
    return JSON.parse(response);
  }
}
```

### Pattern 4: Sub-Task Coordination with Progress Tracking

**What:** Spawn N sub-tasks (one per table), execute in parallel (max 5), track aggregate progress

**When to use:** CRUD agents that generate code for multiple tables

**Example:**
```typescript
// Source: Convex real-time updates research
// https://stack.convex.dev/real-time-database

import PQueue from 'p-queue';
import { convex } from '@convex-poc/convex-client';

interface SubTask {
  subTaskId: string;
  taskId: string;
  title: string;
  agentType: string;
  tableName: string;
}

class SubTaskManager {
  private subTaskQueue = new PQueue({ concurrency: 5 });

  async executeSubTasks(
    taskId: string,
    tables: string[],
    agentType: string,
    agentFn: (table: string) => Promise<void>
  ): Promise<void> {
    // Create sub-tasks in Convex
    const subTasks = await Promise.all(
      tables.map(table => this.createSubTask(taskId, table, agentType))
    );

    // Execute in parallel with progress updates
    await Promise.all(
      subTasks.map(subTask =>
        this.subTaskQueue.add(() =>
          this.executeWithProgress(subTask, agentFn)
        )
      )
    );

    // Update parent task status
    await this.updateParentTaskStatus(taskId);
  }

  private async executeWithProgress(
    subTask: SubTask,
    agentFn: (table: string) => Promise<void>
  ): Promise<void> {
    try {
      // Update sub-task status to running
      await this.updateSubTaskProgress(subTask.subTaskId, {
        status: 'running',
        stepNumber: 1,
        message: `Starting ${subTask.agentType} for ${subTask.tableName}`,
      });

      // Execute agent with progress callbacks
      const totalSteps = 5; // Template engine steps
      for (let step = 1; step <= totalSteps; step++) {
        await this.updateSubTaskProgress(subTask.subTaskId, {
          stepNumber: step,
          message: `Step ${step}: Processing ${subTask.tableName}`,
        });
      }

      await agentFn(subTask.tableName);

      // Mark sub-task complete
      await this.updateSubTaskProgress(subTask.subTaskId, {
        status: 'done',
        stepNumber: totalSteps,
        message: `Completed ${subTask.tableName}`,
      });
    } catch (error) {
      // Mark sub-task failed
      await this.updateSubTaskProgress(subTask.subTaskId, {
        status: 'failed',
        message: `Failed: ${error.message}`,
      });
      throw error;
    }
  }

  private async updateSubTaskProgress(
    subTaskId: string,
    update: { status?: string; stepNumber?: number; message: string }
  ): Promise<void> {
    await convex.mutations.subtasks.updateProgress({
      subTaskId,
      ...update,
      timestamp: Date.now(),
    });
  }
}
```

### Anti-Patterns to Avoid

- **Regex-only keyword routing:** Can't handle ambiguous task descriptions. Use hybrid approach with LLM fallback.
- **Unbounded parallel execution:** Will overwhelm system resources. Use p-queue with concurrency: 5.
- **Manual file locking with mkdir:** Prone to deadlocks and stale locks. Use proper-lockfile.
- **Synchronous Convex updates:** Blocks agent execution. Use non-blocking mutations with fire-and-forget.
- **Monolithic agent classes:** Violates SRP. Split into specialized CRUD agents with shared base class.
- **Missing aggregate status tracking:** Parent tasks don't show sub-task progress. Update parent task on each sub-task completion.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| **Priority queue** | Array with sort() | **p-queue** | Concurrency control, timeout handling, Promise-based |
| **File locking** | mkdir + lockfile cleanup | **proper-lockfile** | Stale lock detection, cross-platform, retries |
| **Worker pool** | Custom thread management | **p-queue** | Already handles concurrency limits properly |
| **Keyword extraction** | Manual string matching | **LLM classifier** fallback | Handles ambiguous cases, better UX |
| **Progress tracking** | Custom EventEmitter | **Convex mutations** | Real-time sync to frontend, persistent state |
| **Agent state** | File-based JSON | **Convex sessions** | Already integrated, type-safe, real-time |

**Key insight:** Concurrency control and file locking are distributed systems problems. Custom implementations introduce deadlocks, race conditions, and resource exhaustion. Use battle-tested libraries with proper error handling.

## Common Pitfalls

### Pitfall 1: Deadlock from Circular Lock Dependencies

**What goes wrong:** Agent A locks file1 then waits for file2, Agent B locks file2 then waits for file1. Both hang forever.

**Why it happens:** Acquiring locks in inconsistent order across agents.

**How to avoid:**
- Always acquire locks in consistent order (e.g., sorted by file path)
- Use timeouts with proper-lockfile's `stale` option
- Implement deadlock detection (timeout after X seconds)

**Warning signs:** Agents hang indefinitely, no error messages, queue stops processing.

### Pitfall 2: Race Conditions in Convex Sub-Task Creation

**What goes wrong:** Multiple agents try to create sub-tasks simultaneously, causing duplicate IDs or inconsistent state.

**Why it happens:** Convex mutations are atomic but sub-task arrays aren't updated atomically.

**How to avoid:**
- Create sub-tasks in a single Convex mutation (array insert)
- Use Convex transactions for parent-child linking
- Validate sub-task uniqueness before insertion

**Warning signs:** Duplicate sub-task IDs, orphaned sub-tasks, inconsistent parent.subTaskIds.

### Pitfall 3: Memory Leaks from Unreleased Locks

**What goes wrong:** File locks accumulate over time, eventually preventing new operations.

**Why it happens:** Locks not released in error paths or when agents crash.

**How to avoid:**
- Always use try-finally for lock release
- Set proper-lockfile `stale` option (10-30 seconds)
- Implement lock cleanup on startup
- Monitor lock count in production

**Warning signs:** "Lock not available" errors increase over time, operations slow down.

### Pitfall 4: LLM Classifier Timeout/Cost

**What goes wrong:** LLM classification takes too long or costs too much per task.

**Why it happens:** Every task goes through LLM, even obvious keyword matches.

**How to avoid:**
- Keyword extraction first (fast path for 80% of tasks)
- LLM classifier only for ambiguous descriptions
- Cache classification results for similar tasks
- Use faster/cheaper model for classification (haiku vs sonnet)

**Warning signs:** Task creation takes >2 seconds, LLM API costs spike.

### Pitfall 5: Sub-Task Queue Exhaustion

**What goes wrong:** All 5 concurrency slots occupied by long-running tasks, queue backs up.

**Why it happens:** No task prioritization, long CRUD operations block short boilerplate tasks.

**How to avoid:**
- Use p-queue priority (1-10 scale)
- Give boilerplate tasks higher priority than CRUD
- Implement task timeout (kill after 5 min)
- Monitor queue depth and alert

**Warning signs:** Queue size grows indefinitely, short tasks take too long.

## Code Examples

Verified patterns from official sources:

### proper-lockfile Basic Usage

```typescript
// Source: https://github.com/moxystudio/node-proper-lockfile
import lock from 'proper-lockfile';

// Acquire lock
const release = await lock('path/to/file', {
  retries: 10,
  stale: 10000,
  update: 2000,
});

try {
  // Write to file safely
  await fs.writeFile('path/to/file', content);
} finally {
  // Always release lock
  await release();
}
```

### p-Queue with Priority

```typescript
// Source: https://github.com/sindresorhus/p-queue
import PQueue from 'p-queue';

const queue = new PQueue({
  concurrency: 5,
  timeout: 300000,
  throwOnTimeout: true,
});

// High priority task (executes first)
queue.add(() => doCriticalWork(), { priority: 10 });

// Low priority task (executes last)
queue.add(() => doCleanupWork(), { priority: 1 });

// Wait for all tasks to complete
await queue.onIdle();
```

### Convex Real-Time Progress Updates

```typescript
// Source: https://stack.convex.dev/real-time-database
import { ConvexClient } from 'convex/browser';

const client = new ConvexClient(CONVEX_URL);

// Update progress (triggers real-time UI updates)
await client.mutation('subtasks:updateProgress', {
  subTaskId: 'abc123',
  status: 'running',
  stepNumber: 3,
  totalSteps: 5,
  message: 'Generating API endpoints for students table',
  timestamp: Date.now(),
});

// Frontend receives update automatically via subscription
```

### Extending BaseAgent for CRUD Operations

```typescript
// Source: Existing BaseAgent pattern in src/agents/BaseAgent.ts
import { BaseAgent } from './BaseAgent.js';
import { parseDDL } from '@convex-poc/template-engine/parser';

abstract class BaseCRUDAgent extends BaseAgent {
  protected async executeForTable(
    table: TableDefinition,
    templateType: TemplateType
  ): Promise<void> {
    // Step 1: Parse DDL to extract table structure
    this.updateProgress(1, 'Parsing table definition');

    // Step 2: Load Handlebars template
    this.updateProgress(2, 'Loading code template');

    // Step 3: Generate code with template
    this.updateProgress(3, 'Generating code');

    // Step 4: Format with Biome
    this.updateProgress(4, 'Formatting code');

    // Step 5: Write to filesystem (with file locking)
    this.updateProgress(5, 'Writing files');

    await this.writeWithLock(table, templateType);
  }

  private updateProgress(step: number, message: string): void {
    // Non-blocking Convex update
    this.convex.mutations.subtasks.updateProgress({
      subTaskId: this.subTaskId,
      stepNumber: step,
      message: `Step ${step}: ${message}`,
    }).catch(err => console.error('Progress update failed:', err));
  }

  private async writeWithLock(
    table: TableDefinition,
    templateType: TemplateType
  ): Promise<void> {
    const filePath = this.getOutputPath(table, templateType);

    const release = await this.lockManager.acquireLock(filePath);
    try {
      const code = await this.generateCode(table, templateType);
      await fs.writeFile(filePath, code);
    } finally {
      await release();
    }
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| **Manual thread pools** | **p-queue** | 2020-2021 | Promise-based, automatic concurrency, priority support |
| **mkdir-based locks** | **proper-lockfile** | 2019-2020 | Stale lock detection, cross-platform, network FS support |
| **Regex-only routing** | **LLM + keyword hybrid** | 2024-2025 | Handles ambiguous cases, better UX, future-proof |
| **Polling for progress** | **Convex real-time** | 2023-2024 | Instant updates via WebSocket, no polling overhead |
| **Sequential execution** | **Parallel with limits** | 2021-2022 | Faster completion, resource control via concurrency limits |

**Deprecated/outdated:**
- **fs.watchFile for file locking:** Unreliable, use proper-lockfile instead
- **Manual array sorting for priority:** p-queue has built-in priority heap
- **Regex-only task classification:** LLM fallback handles edge cases better
- **File-based state passing:** Convex provides real-time sync to frontend

## Open Questions

Things that couldn't be fully resolved:

1. **Convex transaction limits for sub-task batch creation**
   - What we know: Convex supports array operations in mutations
   - What's unclear: Maximum sub-task count per transaction (24 tables = 24 sub-tasks)
   - Recommendation: Start with batch creation, switch to streaming if transactions hit limits

2. **LLM classifier cost optimization**
   - What we know: Claude API charges per token, classification adds latency
   - What's unclear: Actual cost per task at scale (1000+ tasks/day)
   - Recommendation: Implement keyword extraction first (80% fast path), monitor LLM usage, add cache layer

3. **File lock granularity**
   - What we know: proper-lockfile works on file paths
   - What's unclear: Lock per file vs lock per directory vs lock per table
   - Recommendation: Lock per file (granular), upgrade to directory locks if performance issues

4. **Priority queue starvation**
   - What we know: p-queue priority scheduling can cause low-priority task starvation
   - What's unclear: Whether to implement aging (boost priority over time)
   - Recommendation: Monitor queue depth, add priority aging if low-priority tasks wait >5 minutes

## Sources

### Primary (HIGH confidence)

- **proper-lockfile GitHub** - File locking API, stale lock detection
  - https://github.com/moxystudio/node-proper-lockfile
- **p-queue GitHub** - Priority queue, concurrency control
  - https://github.com/sindresorhus/p-queue
- **@anthropic-ai/claude-agent-sdk** - Agent SDK hooks, Convex integration
  - https://platform.claude.com/docs/en/agent-sdk/typescript
- **Convex Real-Time Database** - Real-time updates, mutation patterns
  - https://stack.convex.dev/real-time-database

### Secondary (MEDIUM confidence)

- **LLM as a Router (Medium, 2025)** - Intent-based workflow routing
  - https://medium.com/@vanshkhaneja/llm-as-a-router-how-to-fine-tune-models-for-intent-based-workflows-6d272eab55d1
- **TypeScript Rising in Multi-Agent Systems (2025)** - TypeScript vs Python for agents
  - https://visiononedge.com/typescript-replacing-python-in-multiagent-systems/
- **Piscina Worker Pool (GitHub)** - Worker thread pool patterns
  - https://github.com/piscinajs/piscina
- **NodeSource: Worker Threads Guide (2025)** - Concurrency patterns
  - http://nodesource.com/blog/worker-threads-nodejs-multithreading-in-javascript/

### Tertiary (LOW confidence)

- **Academic papers on LLM routing (2025)** - Taxonomy-guided routing, MoE models
  - Verified patterns exist, but academic papers may not reflect production best practices
- **Priority queue implementation tutorials** - Various blog posts
  - Cross-referenced with official p-queue docs where possible
- **Convex + Axiom integration (2025)** - Real-time observability
  - Good for understanding patterns, but not directly applicable to agent orchestration

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified via official docs/repositories
- Architecture: MEDIUM - Patterns based on existing SequentialOrchestrator + research, but parallel execution untested
- Pitfalls: MEDIUM - Deadlocks and race conditions well-documented, but LLM-specific issues need validation
- LLM routing: LOW - Hybrid approach is sound, but actual performance/cost needs measurement

**Research date:** 2026-01-18
**Valid until:** 2026-02-18 (30 days - LLM routing space evolving rapidly)

**Next research needs:**
1. Load testing p-queue with 100+ concurrent tasks
2. Cost analysis of LLM classifier at scale (measure actual tokens/task)
3. Convex transaction limits for array operations (check official docs)
4. proper-lockfile performance on network file systems (NFS, SMB)
