# Phase 15: Agent Orchestration - Context

**Gathered:** 2026-01-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement specialized CRUD agents that automatically spawn sub-tasks for code generation, with keyword-based routing and parallel execution. Agents handle BE/FE boilerplate and CRUD operations, with smart scheduling and concurrency limits.

</domain>

<decisions>
## Implementation Decisions

### Keyword detection
- Dispatcher uses LLM classifier to analyze task descriptions and route to appropriate agent
- Hybrid approach: keyword extraction first, then LLM classification for ambiguous cases
- Keywords as fallback: try keyword matching first, use LLM if no match
- Store both extracted keywords and LLM classification result in Convex for debugging/transparency
- Claude (discretion): exact keyword phrases and synonyms for the 5 CRUD agents

### Sub-task granularity
- One sub-task per table for CRUD operations (all files for one table in one sub-task)
- Sub-task naming: "BE CRUD APIs: students" (agent type + table name)
- Parent task shows aggregate status (e.g., "3/5 sub-tasks complete")
- Parent-child relationships stored bidirectionally: subTaskIds array on parent, taskId on each sub-task
- Claude (discretion): exact Convex document structure for parent-child linking

### Concurrency behavior
- Queue tracks pending tasks but doesn't block new tasks from being created
- Smart scheduler considers task type, estimated duration, and dependencies (not just priority)
- Queue state stored in Convex with scheduling metadata (queue position, priority, estimate)
- Claude (discretion): smart scheduling algorithm specifics

### Agent progress reporting
- Agents report step number + detailed message (e.g., "Step 3: Parsing DDL for students table")
- Real-time streaming: progress updates sent to Convex immediately as agent executes
- Logs embedded in task document (not separate log documents)
- Each log entry has level (DEBUG, INFO, WARN, ERROR) + timestamp

</decisions>

<specifics>
## Specific Ideas

- Phase 15 success criteria specify max 5 concurrent tasks and 5 sub-tasks per task — this is the WIP limit
- Keyword phrases from roadmap: "BE setup", "BE CRUD APIs", "FE setup", "FE CRUD services", "UI CRUD pages"
- Agent progress updates should be visible in Kanban board (Phase 17)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 15-agent-orchestration*
*Context gathered: 2026-01-18*
