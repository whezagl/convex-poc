# Phase 2: Convex Schema & State Model - Research

**Researched:** 2026-01-16
**Domain:** Convex data modeling, real-time state synchronization, document schemas for agent systems
**Confidence:** HIGH

## Summary

Researched Convex schema definition patterns, data modeling best practices, and real-time state synchronization for multi-agent systems. Convex uses a code-first schema approach with TypeScript definitions that provide end-to-end type safety and automatic migration. The key finding is that Convex schemas are optional for rapid prototyping but essential for production systems requiring validation and type safety.

For agent orchestration systems, the recommended pattern is to separate **agent sessions** (individual agent state) from **workflows** (orchestration state) and use indexes for efficient querying. Convex's real-time capabilities mean that any state change automatically syncs to all connected clients, making it ideal for monitoring agent progress across multiple CLI instances.

Key patterns include: using `v.union()` for typed document variants, `v.optional()` for nullable fields, `.index()` for query optimization, and separating read queries from write mutations. Best practices emphasize using argument validators for all public functions, avoiding `.filter()` on database queries in favor of indexes, and using helper functions to share logic between queries and mutations.

**Primary recommendation:** Define schemas early for agent sessions and workflows. Use Convex's built-in validation and indexes to ensure data integrity and query performance. Leverage real-time sync for workflow monitoring across multiple agent instances.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| convex | Latest | Reactive backend with schema validation | Code-first schemas, automatic migrations, real-time sync |
| typescript | ^5.0 | Type safety for schemas | End-to-end type generation from Convex schemas |

### Development
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/node | Latest | Node.js types | TypeScript development |
| zod | Latest | Schema validation (already in Phase 1) | Convex's `v` validator is built-in, Zod for external validation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Convex schemas | No schema (rapid prototyping) | Schemas provide type safety and validation, recommended for POC |
| Code-first | Schema-first (Prisma) | Convex is code-first, migrations are automatic |
| Single database | Multiple Convex instances | Single instance is sufficient for POC, multiple adds complexity |

**Installation:**
```bash
# Already installed in Phase 1
npm install convex
```

## Architecture Patterns

### Recommended Data Model Structure
```
convex/
├── schema.ts           # All table definitions
├── agents.ts           # Agent session mutations and queries
├── workflows.ts        # Workflow orchestration functions
├── model/              # Helper functions (best practice)
│   ├── agents.ts       # Agent state helpers
│   └── workflows.ts    # Workflow logic helpers
└── _generated/         # Auto-generated TypeScript types
    ├── dataModel.d.ts  # Document types (Doc<"tableName">)
    ├── api.ts          # Function API types
    └── server.d.ts     # Server-side types
```

### Pattern 1: Schema Definition with Validators
**What:** Define tables with typed fields using `v` validator builder
**When to use:** All data models in Convex
**Example:**
```typescript
// Source: Convex schema documentation
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Agent sessions store individual agent execution state
  agentSessions: defineTable({
    agentType: v.string(),         // "planner" | "coder" | "reviewer"
    status: v.string(),             // "idle" | "running" | "completed" | "failed"
    sessionId: v.optional(v.string()), // Claude SDK session ID
    input: v.string(),              // Task or input prompt
    output: v.optional(v.string()), // Agent's output/result
    error: v.optional(v.string()),  // Error message if failed
    metadata: v.optional(v.object({
      workflowId: v.id("workflows"),
      startedAt: v.number(),
      completedAt: v.optional(v.number()),
    })),
  })
    .index("by_workflow", ["workflowId"])
    .index("by_status", ["status"]),

  // Workflows orchestrate multi-agent execution
  workflows: defineTable({
    task: v.string(),                // Original user task
    status: v.string(),              // "pending" | "in_progress" | "completed" | "failed"
    currentStep: v.string(),         // Current agent in sequence
    artifacts: v.array(v.string()),  // File paths to artifacts
    metadata: v.object({
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  })
    .index("by_status", ["status"]),
});
```

### Pattern 2: Document Variants with Unions
**What:** Use `v.union()` for documents that can have different shapes
**When to use:** Tables storing multiple document types with shared fields
**Example:**
```typescript
// Source: Convex schema patterns
defineTable(
  v.union(
    v.object({
      kind: v.literal("planner_session"),
      agentType: v.literal("planner"),
      plan: v.string(),
    }),
    v.object({
      kind: v.literal("coder_session"),
      agentType: v.literal("coder"),
      code: v.string(),
      language: v.string(),
    }),
    v.object({
      kind: v.literal("reviewer_session"),
      agentType: v.literal("reviewer"),
      review: v.string(),
      approved: v.boolean(),
    })
  )
);
```

### Pattern 3: Separating Public API from Helper Functions
**What:** Write business logic in helper functions, wrap in query/mutation for public API
**When to use:** All non-trivial Convex functions (best practice from docs)
**Example:**
```typescript
// Source: Convex best practices
// convex/model/agents.ts - Helper functions
import { MutationCtx, QueryCtx } from "../_generated/server";

export async function createAgentSession(
  ctx: MutationCtx,
  args: { agentType: string; input: string; workflowId: Id<"workflows"> }
) {
  const sessionId = await ctx.db.insert("agentSessions", {
    agentType: args.agentType,
    status: "running",
    input: args.input,
    metadata: {
      workflowId: args.workflowId,
      startedAt: Date.now(),
    },
  });
  return sessionId;
}

export async function getAgentSession(
  ctx: QueryCtx,
  args: { sessionId: Id<"agentSessions"> }
) {
  return await ctx.db.get(args.sessionId);
}

// convex/agents.ts - Public API
import { mutation, query } from "./_generated/server";
import * as Agents from "./model/agents";

export const createAgentSession = mutation({
  args: {
    agentType: v.string(),
    input: v.string(),
    workflowId: v.id("workflows"),
  },
  handler: async (ctx, args) => {
    return await Agents.createAgentSession(ctx, args);
  },
});

export const getAgentSession = query({
  args: { sessionId: v.id("agentSessions") },
  handler: async (ctx, args) => {
    return await Agents.getAgentSession(ctx, args);
  },
});
```

### Pattern 4: Using Indexes for Efficient Queries
**What:** Define indexes on frequently queried fields
**When to use:** Any query filtering by specific field values
**Example:**
```typescript
// Source: Convex indexing patterns
// Define index in schema
defineTable({
  agentType: v.string(),
  status: v.string(),
  workflowId: v.id("workflows"),
})
  .index("by_workflow", ["workflowId"])
  .index("by_status", ["status"])
  .index("by_workflow_and_status", ["workflowId", "status"]);

// Query using index (efficient)
const runningSessions = await ctx.db
  .query("agentSessions")
  .withIndex("by_status", (q) => q.eq("status", "running"))
  .collect();

// Query using compound index (efficient)
const workflowRunningSessions = await ctx.db
  .query("agentSessions")
  .withIndex("by_workflow_and_status", (q) =>
    q.eq("workflowId", workflowId).eq("status", "running")
  )
  .collect();

// AVOID: Filtering without index (inefficient for large datasets)
const allSessions = await ctx.db.query("agentSessions").collect();
const running = allSessions.filter(s => s.status === "running");
```

### Pattern 5: Real-Time State Synchronization
**What:** Leverage Convex's real-time sync for workflow monitoring
**When to use:** Multiple agent instances or CLI monitoring
**Example:**
```typescript
// Frontend: Subscribe to workflow updates
import { useQuery } from "convex/react";

function WorkflowMonitor({ workflowId }: { workflowId: Id<"workflows"> }) {
  const workflow = useQuery(api.workflows.getWorkflow, { workflowId });
  const agentSessions = useQuery(api.agents.listSessionsByWorkflow, { workflowId });

  // Automatically re-renders when workflow or sessions change
  return (
    <div>
      <h2>Workflow: {workflow?.task}</h2>
      <p>Status: {workflow?.status}</p>
      <h3>Agent Sessions:</h3>
      {agentSessions?.map((session) => (
        <div key={session._id}>
          {session.agentType}: {session.status}
        </div>
      ))}
    </div>
  );
}
```

### Anti-Patterns to Avoid
- **Using `.filter()` on database queries:** Use `.withIndex()` or filter in code instead
- **Calling `.collect()` on unbounded results:** Use `.take()` or pagination for large datasets
- **Missing argument validators:** All public functions should validate inputs with `v` schemas
- **Mixing `api` and `internal` function calls:** Use `internal` functions for `ctx.runQuery`/`ctx.runMutation`
- **Ignoring access control:** Even for POC, validate permissions in public functions

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Schema validation | Custom runtime validation | Convex schema with `v` validators | Automatic type generation, runtime validation |
| Database migrations | Manual migration scripts | Automatic schema deployment | `npx convex deploy` handles migrations |
| Real-time sync | WebSocket + polling | Convex subscriptions | Automatic real-time updates |
| TypeScript types | Manual type definitions | Auto-generated from schema | `dataModel.d.ts` generated automatically |
| Query optimization | Custom caching logic | Convex indexes | Built-in query optimization |
| State synchronization | Custom sync logic | Convex real-time engine | Automatic sync to all clients |

**Key insight:** Convex's schema-first approach with automatic type generation and real-time sync eliminates the need for custom validation, migrations, or synchronization logic. The combination of schema definitions, indexes, and helper functions provides a complete data modeling solution for agent state management.

## Common Pitfalls

### Pitfall 1: Using `.filter()` on Database Queries
**What goes wrong:** Poor performance on large datasets, unnecessary database bandwidth
**Why it happens:** Not defining indexes for common query patterns
**How to avoid:** Define indexes in schema, use `.withIndex()` for queries, or filter in code after `.collect()` for small datasets
**Warning signs:** Slow queries when dataset grows, high database bandwidth usage

### Pitfall 2: Calling `.collect()` on Unbounded Results
**What goes wrong:** Loading entire table into memory, poor performance
**Why it happens:** Not considering result set size
**How to avoid:** Use `.take(n)` for limits, `.paginate()` for pagination, or denormalize data
**Warning signs:** Functions timeout on large tables, memory issues

### Pitfall 3: Missing Argument Validators
**What goes wrong:** Public functions accept invalid data, security vulnerabilities
**Why it happens:** Skipping `args` definition in query/mutation
**How to avoid:** Always define `args` with `v` validators for public functions
**Warning signs:** TypeScript errors, runtime "invalid arguments" errors

### Pitfall 4: Circular References in Schema
**What goes wrong:** Can't create documents due to circular ID dependencies
**Why it happens:** Table A references Table B, Table B references Table A
**How to avoid:** Make one reference nullable using `v.union(v.id("A"), v.null())`, create documents in sequence
**Warning signs:** "Validation failed" errors when inserting documents

### Pitfall 5: Not Using Helper Functions
**What goes wrong:** Code duplication between queries and mutations, can't share logic
**Why it happens:** Writing all logic directly in query/mutation handlers
**How to avoid:** Create helper functions in `convex/model/`, call from public API functions
**Warning signs:** Similar code in multiple functions, can't test business logic independently

### Pitfall 6: Ignoring Real-Time Capabilities
**What goes wrong:** Manual polling for state changes, unnecessary API calls
**Why it happens:** Not leveraging Convex's real-time subscriptions
**How to avoid:** Use `useQuery` (React) or subscription APIs for real-time updates
**Warning signs:** `setInterval` polling for state changes, redundant API calls

## Code Examples

### Basic Schema and Mutations
```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  agentSessions: defineTable({
    agentType: v.string(),
    status: v.string(),
    input: v.string(),
    output: v.optional(v.string()),
    metadata: v.object({
      createdAt: v.number(),
    }),
  }),
});

// convex/agents.ts
import { mutation, query } from "./_generated/server";

export const createSession = mutation({
  args: {
    agentType: v.string(),
    input: v.string(),
  },
  handler: async (ctx, args) => {
    const sessionId = await ctx.db.insert("agentSessions", {
      agentType: args.agentType,
      status: "idle",
      input: args.input,
      metadata: { createdAt: Date.now() },
    });
    return sessionId;
  },
});

export const getSession = query({
  args: { sessionId: v.id("agentSessions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sessionId);
  },
});
```

### Workflow State Management
```typescript
// convex/model/workflows.ts - Helper functions
import { MutationCtx, QueryCtx } from "../_generated/server";
import { Doc } from "../_generated/dataModel";

export async function createWorkflow(
  ctx: MutationCtx,
  task: string
): Promise<Id<"workflows">> {
  return await ctx.db.insert("workflows", {
    task,
    status: "pending",
    currentStep: "planner",
    artifacts: [],
    metadata: {
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  });
}

export async function updateWorkflowStatus(
  ctx: MutationCtx,
  workflowId: Id<"workflows">,
  status: string,
  currentStep?: string
) {
  await ctx.db.patch(workflowId, {
    status,
    ...(currentStep && { currentStep }),
    metadata: { updatedAt: Date.now() },
  });
}

export async function getWorkflow(
  ctx: QueryCtx,
  workflowId: Id<"workflows">
): Promise<Doc<"workflows"> | null> {
  return await ctx.db.get(workflowId);
}

// convex/workflows.ts - Public API
import { mutation, query } from "./_generated/server";
import * as Workflows from "./model/workflows";

export const createWorkflow = mutation({
  args: { task: v.string() },
  handler: async (ctx, args) => {
    return await Workflows.createWorkflow(ctx, args.task);
  },
});

export const getWorkflow = query({
  args: { workflowId: v.id("workflows") },
  handler: async (ctx, args) => {
    return await Workflows.getWorkflow(ctx, args.workflowId);
  },
});

export const updateWorkflowStatus = mutation({
  args: {
    workflowId: v.id("workflows"),
    status: v.string(),
    currentStep: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await Workflows.updateWorkflowStatus(ctx, args.workflowId, args.status, args.currentStep);
  },
});
```

### Efficient Queries with Indexes
```typescript
// Schema with indexes
defineTable({
  workflowId: v.id("workflows"),
  status: v.string(),
  agentType: v.string(),
})
  .index("by_workflow", ["workflowId"])
  .index("by_status", ["status"])
  .index("by_workflow_and_status", ["workflowId", "status"]);

// Query using single index
const runningSessions = await ctx.db
  .query("agentSessions")
  .withIndex("by_status", (q) => q.eq("status", "running"))
  .collect();

// Query using compound index
const workflowRunningSessions = await ctx.db
  .query("agentSessions")
  .withIndex("by_workflow_and_status", (q) =>
    q.eq("workflowId", workflowId).eq("status", "running")
  )
  .collect();

// Pagination for large result sets
const paginatedSessions = await ctx.db
  .query("agentSessions")
  .withIndex("by_workflow", (q) => q.eq("workflowId", workflowId))
  .paginate({ numItems: 20 });
```

## State of the Art (2024-2025)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Schemaless databases | Code-first schemas with validation | 2024+ | Convex provides both flexibility and type safety |
| Manual type definitions | Auto-generated from schema | 2024+ | `dataModel.d.ts` generated automatically |
| Manual migrations | Automatic deployment migrations | 2024+ | Schema changes applied on `npx convex deploy` |
| Custom real-time sync | Built-in subscriptions | 2024+ | Automatic real-time updates to all clients |
| Manual query optimization | Index-based queries | 2024+ | `.withIndex()` for efficient queries |

**New tools/patterns to consider:**
- **Helper functions pattern:** Separate business logic from Convex API wrappers (best practice)
- **Internal functions:** Use `internalMutation`/`internalQuery` for functions only called within Convex
- **Access control:** Implement `ctx.auth.getUserIdentity()` checks in all public functions
- **Component patterns:** Use Convex components for reusable backend logic

**Deprecated/outdated:**
- **Schemaless development:** Schemas are recommended even for rapid prototyping
- **`.filter()` on queries:** Use `.withIndex()` or filter in code instead
- **Manual real-time implementations:** Use Convex's built-in real-time subscriptions

## Open Questions

1. **Schema versioning and migrations**
   - What we know: Convex applies schema changes automatically on deploy
   - What's unclear: How to handle breaking schema changes in production (data loss risk)
   - Recommendation: For POC, use `schemaValidation: true` and be prepared to export/import data if needed. Production requires careful migration planning.

2. **Optimal indexing strategy for agent workflows**
   - What we know: Indexes improve query performance, compound indexes for multi-field queries
   - What's unclear: Which index combinations are most effective for agent session lookups
   - Recommendation: Start with `by_workflow` and `by_status` indexes. Add compound indexes if queries are slow.

3. **Real-time subscription limits**
   - What we know: Convex supports real-time subscriptions to queries
   - What's unclear: Practical limits on number of concurrent subscriptions per workflow
   - Recommendation: Monitor subscription count during development. For POC, this shouldn't be an issue.

## Sources

### Primary (HIGH confidence)
- [Convex Schemas Documentation](https://docs.convex.dev/database/schemas) - Complete schema definition guide, validators, and TypeScript types
- [Convex Best Practices](https://docs.convex.dev/understanding/best-practices/) - Official best practices and anti-patterns
- [Convex Schema Philosophy](https://docs.convex.dev/database/advanced/schema-philosophy) - Why Convex uses code-first schemas

### Secondary (MEDIUM confidence)
- [Relationship Structures: Schemas](https://stack.convex.dev/relationship-structures-let-s-talk-about-schemas) - Patterns for structuring relationships
- [Components for your Backend](https://stack.convex.dev/backend-components) - Best practices for Convex components

### Tertiary (LOW confidence - needs validation)
- [A Schema Visualizer for Convex](https://medium.com/@techycolliupdate/a-schema-visualizer-for-convex-why-it-matters-more-than-you-think-6a9abb19df34) - Community tool for schema visualization
- [Beginner Tips and Tricks](https://www.youtube.com/watch?v=dyEWQ9s2ji4) - Video tutorial on Convex patterns

## Metadata

**Research scope:**
- Core technology: Convex schema definition and validation
- Ecosystem: TypeScript type generation, real-time sync
- Patterns: Schema definition, indexing, helper functions, real-time subscriptions
- Pitfalls: Query optimization, validation, circular references, missing validators

**Confidence breakdown:**
- Standard stack: HIGH - verified with official Convex documentation
- Architecture: HIGH - from official Convex best practices guide
- Pitfalls: HIGH - documented in official best practices with examples
- Code examples: HIGH - verified against official Convex documentation

**Research date:** 2026-01-16
**Valid until:** 2026-02-15 (30 days - Convex is actively developed with frequent updates)

---

*Phase: 02-convex-schema*
*Research completed: 2026-01-16*
*Ready for planning: yes*
