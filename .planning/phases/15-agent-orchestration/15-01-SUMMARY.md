---
phase: 15-agent-orchestration
plan: 01
subsystem: orchestration
tags: p-queue, proper-lockfile, task-queue, file-locking, concurrency-control

# Dependency graph
requires:
  - phase: 13
    provides: Mono-repo structure with pnpm workspace, @convex-poc/shared-types package
  - phase: 14
    provides: Template engine for code generation agents
provides:
  - TaskQueue class with p-queue for priority-based task scheduling
  - FileLockManager class with proper-lockfile for parallel file write protection
  - Queue type definitions (TaskOptions, QueueOptions, FileLockOptions, QueueStats)
affects: 15-02, 15-03, 15-04, 15-05

# Tech tracking
tech-stack:
  added: [p-queue@8.0.1, proper-lockfile@4.1.2]
  patterns: [priority queue, concurrency limiting, file locking, graceful cleanup]

key-files:
  created: [packages/agent-orchestrator/src/types/queue.ts, packages/agent-orchestrator/src/queue/TaskQueue.ts, packages/agent-orchestrator/src/queue/FileLockManager.ts, packages/agent-orchestrator/src/queue/index.ts, packages/agent-orchestrator/src/types/index.ts, packages/agent-orchestrator/tsconfig.json]
  modified: [packages/agent-orchestrator/package.json]

key-decisions:
  - "QueueOptions.concurrency made optional (not required) for flexible instantiation"
  - "TaskOptions.taskId uses string type instead of non-existent Id type"
  - "TaskQueue.add() uses type assertion for p-queue return type compatibility"
  - "FileLockManager.withLock() ensures file exists before acquiring lock"

patterns-established:
  - "Pattern: Event logging for queue monitoring (active, next, idle events)"
  - "Pattern: Graceful cleanup with try-finally for lock release"
  - "Pattern: Type assertions for external library compatibility"
  - "Pattern: Package exports via package.json exports field"

# Metrics
duration: 4min
completed: 2026-01-18
---

# Phase 15 Plan 1: Build TaskQueue and FileLockManager Summary

**Priority queue with concurrency control (max 5) and file locking for parallel agent execution using p-queue and proper-lockfile**

## Performance

- **Duration:** 4 min (225 seconds)
- **Started:** 2026-01-18T08:09:00Z
- **Completed:** 2026-01-18T08:12:45Z
- **Tasks:** 5
- **Files modified:** 6

## Accomplishments
- TaskQueue class with priority-based scheduling (1-10), 5 max concurrency, 5-minute timeout
- FileLockManager with acquireLock, releaseLock, withLock, releaseAll, getLockCount methods
- Queue type definitions (TaskOptions, QueueOptions, FileLockOptions, QueueStats)
- Package exports for @convex-poc/agent-orchestrator/queue and ./types/queue
- tsconfig.json for isolated compilation with project references

## Task Commits

Each task was committed atomically:

1. **Task 1: Install queue and locking dependencies** - `92eb569` (chore)
2. **Task 2: Create queue type definitions** - `f12ad28` (feat)
3. **Task 3: Implement FileLockManager** - `28324c4` (feat)
4. **Task 4: Implement TaskQueue** - (already existed)
5. **Type fixes and tsconfig** - `748e35e` (fix)

**Plan metadata:** (pending final commit)

## Files Created/Modified
- `packages/agent-orchestrator/package.json` - Added p-queue and proper-lockfile dependencies
- `packages/agent-orchestrator/src/types/queue.ts` - Type definitions for queue operations
- `packages/agent-orchestrator/src/types/index.ts` - Type exports barrel file
- `packages/agent-orchestrator/src/queue/TaskQueue.ts` - Priority queue with p-queue integration
- `packages/agent-orchestrator/src/queue/FileLockManager.ts` - File locking with proper-lockfile
- `packages/agent-orchestrator/src/queue/index.ts` - Queue exports barrel file
- `packages/agent-orchestrator/tsconfig.json` - Package-specific TypeScript config

## Decisions Made

- **QueueOptions.concurrency optional**: Changed from required to optional per default parameter pattern - allows `new TaskQueue()` without parameters
- **taskId as string**: Used `string` instead of non-existent `Id` type from shared-types
- **Type assertion for add()**: Used `as Promise<T>` for p-queue return type compatibility (library returns `Promise<T | void>`)
- **File existence check**: FileLockManager creates empty file if it doesn't exist before locking
- **Event logging**: TaskQueue logs active, next, and idle events for monitoring

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed QueueOptions.concurrency type**
- **Found during:** Task 5 (build verification)
- **Issue:** Plan specified `concurrency: number` (required) but constructor uses default value, causing type error
- **Fix:** Changed to `concurrency?: number` (optional) to match default parameter pattern
- **Files modified:** packages/agent-orchestrator/src/types/queue.ts
- **Verification:** TypeScript compilation passes with `new TaskQueue()` without parameters
- **Committed in:** 748e35e (type fixes commit)

**2. [Rule 1 - Bug] Fixed TaskOptions.taskId import type**
- **Found during:** Task 5 (build verification)
- **Issue:** Plan imported `Id` type from `@convex-poc/shared-types/task` but that type doesn't exist (schema uses `_id: z.string()`)
- **Fix:** Changed `taskId: Id` to `taskId: string` to match actual Convex ID type
- **Files modified:** packages/agent-orchestrator/src/types/queue.ts
- **Verification:** TypeScript compilation passes, matches Convex string IDs
- **Committed in:** 748e35e (type fixes commit)

**3. [Rule 1 - Bug] Fixed TaskQueue.add() return type**
- **Found during:** Task 5 (build verification)
- **Issue:** p-queue's `add()` returns `Promise<void | T>` but our signature requires `Promise<T>`, causing type mismatch
- **Fix:** Added type assertion `as Promise<T>` since p-queue always returns result when task completes
- **Files modified:** packages/agent-orchestrator/src/queue/TaskQueue.ts
- **Verification:** TypeScript compilation passes
- **Committed in:** 748e35e (type fixes commit)

**4. [Rule 3 - Blocking] Added tsconfig.json for agent-orchestrator**
- **Found during:** Task 5 (build verification)
- **Issue:** Package lacked tsconfig.json, causing module resolution issues with workspace dependencies
- **Fix:** Created tsconfig.json with composite: true and project reference to shared-types
- **Files modified:** packages/agent-orchestrator/tsconfig.json (created)
- **Verification:** TypeScript compilation with skipLibCheck passes for queue files
- **Committed in:** 748e35e (type fixes commit)

---

**Total deviations:** 4 auto-fixed (3 bugs, 1 blocking)
**Impact on plan:** All auto-fixes necessary for correct TypeScript compilation and type safety. No scope creep.

## Issues Encountered

- **p-queue type definition errors**: Library's type definitions use private identifiers that require ES2015+ target, but these are library issues (not our code) and are skipped with skipLibCheck
- **Module resolution**: Required package-level tsconfig.json with project references to resolve workspace dependencies

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **Queue infrastructure complete**: TaskQueue and FileLockManager ready for agent orchestration
- **Type safety established**: All queue operations properly typed
- **Dependencies installed**: p-queue and proper-lockfile available for next phase
- **Exports configured**: @convex-poc/agent-orchestrator/queue imports work

**Blockers:** None

**Concerns:**
- Priority queue deadlock detection noted in STATE.md as Phase 15 gap to validate
- File lock cleanup on process exit needs testing in actual parallel execution

---
*Phase: 15-agent-orchestration*
*Completed: 2026-01-18*
