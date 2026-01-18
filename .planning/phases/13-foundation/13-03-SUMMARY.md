---
phase: 13-foundation
plan: 03
subsystem: backend
tags: [convex, schema, crud, mutations, queries, indexes, self-hosted]

# Dependency graph
requires:
  - phase: 13-foundation
    plan: 02
    provides: shared types with Zod schemas for Task and SubTask entities
provides:
  - Convex schema with tasks and subtasks collections with embedded logs
  - Task CRUD functions (createTask, getTasks, getTasksByStatus, updateTaskStatus, addTaskLog, getTask)
  - SubTask CRUD functions (createSubTask, getSubTasksByTask, updateSubTaskStatus, updateSubTaskProgress, addSubTaskLog, getSubTask)
  - Indexes on status, priority for efficient Kanban queries
  - Self-hosted Convex backend accepting connections at http://localhost:3210
affects: [15-orchestration, 16-ui, 17-integration, 18-testing]

# Tech tracking
tech-stack:
  added: [convex server]
  patterns: [convex schema definition, mutation/query functions, convex validators, embedded logs pattern]

key-files:
  created: [convex/tasks.ts, convex/subtasks.ts]
  modified: [convex/schema.ts]

key-decisions:
  - "Embedded logs in task/subtask documents for simpler streaming (migrate to separate collection if size limits hit)"
  - "SubTask has taskId reference for 'Sub-tasks' column queries"
  - "Task has subTaskIds array for expandable parent card visualization (Phase 18)"
  - "Indexes on status, priority for efficient Kanban queries"
  - "Preserved existing agentSessions and workflows collections for agent orchestration"

patterns-established:
  - "Pattern 9: Convex schema uses union types (z.literal()) instead of enums for fixed values"
  - "Pattern 10: Convex mutation/query functions use v.union() validators for runtime validation"
  - "Pattern 11: Embedded logs array in documents for streaming (size limit TBD)"
  - "Pattern 12: createSubTask automatically links to parent task via subTaskIds array"

# Metrics
duration: 4min
completed: 2026-01-18
---

# Phase 13 Plan 03: Convex Backend Schema and Functions Summary

**Convex schema with tasks and subtasks collections, embedded logs, CRUD functions, indexes, and self-hosted backend deployment**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-18T03:33:53Z
- **Completed:** 2026-01-18T03:38:32Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Extended Convex schema with tasks and subtasks collections, preserving existing agentSessions and workflows
- Created 6 task CRUD functions (createTask, getTasks, getTasksByStatus, updateTaskStatus, addTaskLog, getTask)
- Created 6 subtask CRUD functions (createSubTask, getSubTasksByTask, updateSubTaskStatus, updateSubTaskProgress, addSubTaskLog, getSubTask)
- Configured indexes on status, priority for efficient Kanban queries
- Deployed schema and functions to self-hosted Convex backend via Docker Compose
- Convex backend accepting connections at http://localhost:3210

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend Convex schema with tasks and subtasks collections** - `552ff9a` (feat)
2. **Task 2: Create Convex functions for task CRUD operations** - `8cd04a2` (feat)
3. **Task 3: Create Convex functions for subtask CRUD operations** - `8cd6258` (feat)

**Plan metadata:** Pending (docs: complete plan)

_Note: TDD tasks may have multiple commits (test → feat → refactor)_

## Files Created/Modified

### Created
- `convex/tasks.ts` - Task CRUD functions with proper Convex validators (createTask, getTasks, getTasksByStatus, updateTaskStatus, addTaskLog, getTask)
- `convex/subtasks.ts` - SubTask CRUD functions with parent-task linking (createSubTask, getSubTasksByTask, updateSubTaskStatus, updateSubTaskProgress, addSubTaskLog, getSubTask)

### Modified
- `convex/schema.ts` - Added tasks and subtasks collections with embedded logs, indexes on status/priority, preserved agentSessions and workflows

## Decisions Made

1. **Embedded logs pattern** - Logs are stored as arrays within task/subtask documents for simpler streaming. If Convex's 1MB document size limit becomes an issue, will migrate to separate logs collection.

2. **Bidirectional task-subtask linking** - SubTask has `taskId` reference for "Sub-tasks" column queries, and Task has `subTaskIds` array for expandable parent card visualization in Phase 18.

3. **Preserved existing collections** - Kept `agentSessions` and `workflows` collections as they serve different purpose (agent orchestration vs Kanban state) from new tasks/subtasks collections.

4. **Union types in schema** - Used `v.union([v.literal(...)])` pattern for fixed values (status, priority, pauseReason, level) matching shared-types package approach from 13-02.

5. **Indexes for Kanban efficiency** - Added indexes on status, priority for efficient column filtering and sorting. Note: Convex automatically appends `_creationTime` to all indexes.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed explicit _creationTime from index definitions**
- **Found during:** Task 1 (Schema deployment)
- **Issue:** Plan included `.index("by_created_at", ["_creationTime"])` which caused Convex error: "IndexFieldsContainCreationTime: _creationTime is automatically added to the end of each index"
- **Fix:** Removed explicit `_creationTime` indexes. Convex automatically appends `_creationTime` to all indexes for free.
- **Files modified:** convex/schema.ts
- **Verification:** `npx convex dev --once` deployed successfully
- **Committed in:** 552ff9a (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Fix required for correct Convex schema deployment. No scope creep.

## Issues Encountered

**Convex backend not running** - Initial `npx convex dev --once` failed with "Unable to start push to http://127.0.0.1:3210" because Docker Compose containers were not started.
- **Resolution:** Started containers with `docker compose up -d`, verified backend running with `curl http://127.0.0.1:3210/`

## User Setup Required

None - Docker Compose configuration and .env file were already in place from previous phases.

## Next Phase Readiness

- Convex schema with tasks and subtasks collections is deployed and ready
- All CRUD functions are deployed and accessible via Convex API
- Self-hosted Convex backend is running and accepting connections at http://localhost:3210
- Dashboard is accessible at http://localhost:6791 for development/testing
- Generated types in `convex/_generated/` include tasks and subtasks modules

**Blockers/Concerns:**
- None - Convex backend is fully functional and ready for Phase 14 (Template System)

---
*Phase: 13-foundation*
*Completed: 2026-01-18*
