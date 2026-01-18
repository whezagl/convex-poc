---
phase: 13-foundation
plan: 04
subsystem: client
tags: [convex, typescript, type-safe, singleton-pattern, workspace-exports]

# Dependency graph
requires:
  - phase: 13-foundation
    plan: 02
    provides: shared types with Zod schemas for Task, SubTask, and Log entities
  - phase: 13-foundation
    plan: 03
    provides: Convex backend schema with tasks and subtasks collections and CRUD functions
provides:
  - @convex-poc/convex-client package with type-safe query/mutation wrappers
  - Convex client initialization with singleton pattern and environment configuration
  - Type-safe wrappers for all task CRUD functions (createTask, getTasks, getTasksByStatus, updateTaskStatus, addTaskLog, getTask)
  - Type-safe wrappers for all subtask CRUD functions (createSubTask, getSubTasksByTask, updateSubTaskStatus, updateSubTaskProgress, addSubTaskLog, getSubTask)
  - Integration with @convex-poc/shared-types for type consistency across workspace
affects: [15-orchestration, 16-ui, 17-integration, 18-testing]

# Tech tracking
tech-stack:
  added: [convex browser client]
  patterns: [singleton client pattern, optional client injection, type-safe function wrappers, package.json exports without barrel files]

key-files:
  created: [packages/convex-client/src/client.ts, packages/convex-client/src/tasks.ts, packages/convex-client/src/subtasks.ts, packages/convex-client/tsconfig.json]
  modified: [packages/convex-client/package.json]

key-decisions:
  - "Singleton pattern for Convex client (single connection per app)"
  - "Uses CONVEX_URL environment variable (defaults to local self-hosted)"
  - "Optional ConvexClient parameter for flexibility in testing and multi-instance scenarios"
  - "Type assertions (as any) for function identifiers pending Convex codegen setup"
  - "No auth configuration in Phase 13 (single-user POC)"
  - "closeConvexClient() for subscription cleanup (Phase 17 memory leak prevention)"

patterns-established:
  - "Pattern 13: Singleton pattern for Convex client initialization"
  - "Pattern 14: Optional client injection parameter for testing flexibility"
  - "Pattern 15: Type-safe wrapper functions matching backend function names exactly"
  - "Pattern 16: Export individual modules via package.json exports (no barrel files)"

# Metrics
duration: 2min
completed: 2026-01-18
---

# Phase 13 Plan 04: Convex Client Wrapper Summary

**Type-safe Convex client wrapper package with singleton initialization, task/subtask CRUD functions, and shared-types integration**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-18T03:39:57Z
- **Completed:** 2026-01-18T03:42:26Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Created @convex-poc/convex-client package with type-safe wrappers for all Convex backend functions
- Implemented singleton Convex client initialization with environment configuration
- Created type-safe task wrappers (6 functions: getTasks, getTasksByStatus, createTask, updateTaskStatus, addTaskLog, getTask)
- Created type-safe subtask wrappers (6 functions: getSubTasksByTask, createSubTask, updateSubTaskStatus, updateSubTaskProgress, addSubTaskLog, getSubTask)
- Integrated with @convex-poc/shared-types for type consistency across workspace
- Package builds successfully with Turborepo in dependency order

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Convex client initialization module** - `f93acf1` (feat)
2. **Task 2: Create type-safe task query/mutation wrappers** - `61f47c5` (feat)
3. **Task 3: Create type-safe subtask query/mutation wrappers** - `6ffe6f2` (feat)

**Plan metadata:** Pending (docs: complete plan)

_Note: TDD tasks may have multiple commits (test → feat → refactor)_

## Files Created/Modified

### Created
- `packages/convex-client/src/client.ts` - Convex client initialization with singleton pattern, environment configuration, and cleanup function
- `packages/convex-client/src/tasks.ts` - Type-safe wrappers for all task CRUD operations (6 functions)
- `packages/convex-client/src/subtasks.ts` - Type-safe wrappers for all subtask CRUD operations (6 functions)
- `packages/convex-client/tsconfig.json` - Package-specific TypeScript configuration for isolated compilation

### Modified
- `packages/convex-client/package.json` - Added exports field for client, tasks, subtasks; added shared-types workspace dependency

## Decisions Made

1. **Singleton pattern for Convex client** - Single connection instance per application prevents resource waste and simplifies state management. Includes `closeConvexClient()` for Phase 17 memory leak prevention.

2. **Optional client injection parameter** - Each wrapper function accepts optional `ConvexClient` parameter for flexibility in testing and multi-instance scenarios. Defaults to singleton via `getConvexClient()`.

3. **Type assertions for function identifiers** - Used `as any` for function names (e.g., `"api/tasks:getTasks" as any`) because Convex codegen hasn't been set up yet. Will replace with generated `FunctionReference` types in later phases.

4. **No auth in Phase 13** - Skipped authentication configuration in Convex client initialization. This is a single-user self-hosted POC. Auth will be added if needed for multi-user scenarios.

5. **Environment-based configuration** - Uses `CONVEX_URL` environment variable with default to `http://127.0.0.1:3210` for local self-hosted development. Matches Phase 13 self-hosted approach.

6. **Direct function name strings** - Matched Convex backend function names exactly (e.g., `"api/tasks:createTask"`). No abstraction layer to keep code simple and traceable.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed workspace dependency references in package.json**
- **Found during:** Task 1 (pnpm install)
- **Issue:** Initially used `"@convex-poc/shared-types/task": "workspace:*"` which failed with "no package named @convex-poc/shared-types/task is present in the workspace"
- **Fix:** Changed to `"@convex-poc/shared-types": "workspace:*"` (the package name, not export path). Import paths in source files use the export path (e.g., `from "@convex-poc/shared-types/task"`)
- **Files modified:** packages/convex-client/package.json
- **Verification:** `pnpm install` succeeded, dependencies resolved correctly
- **Committed in:** f93acf1 (Task 1 commit)

**2. [Rule 3 - Blocking] Created tsconfig.json for convex-client package**
- **Found during:** Task 1 (TypeScript compilation)
- **Issue:** No package-specific tsconfig.json existed. Root tsconfig.json includes legacy src/ directory causing potential conflicts.
- **Fix:** Created `packages/convex-client/tsconfig.json` with composite mode, declaration, and isolated include/exclude paths following shared-types pattern from 13-02
- **Files modified:** packages/convex-client/tsconfig.json (created)
- **Verification:** `cd packages/convex-client && pnpm exec tsc --noEmit` succeeds
- **Committed in:** f93acf1 (Task 1 commit)

**3. [Rule 1 - Bug] Fixed ES module import paths to use .js extensions**
- **Found during:** Task 2 (TypeScript compilation)
- **Issue:** TypeScript error "Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'"
- **Fix:** Changed `import { getConvexClient } from "./client"` to `import { getConvexClient } from "./client.js"` in tasks.ts and subtasks.ts
- **Files modified:** packages/convex-client/src/tasks.ts, packages/convex-client/src/subtasks.ts
- **Verification:** `tsc --noEmit` compiles without errors
- **Committed in:** 61f47c5, 6ffe6f2 (Task 2 and Task 3 commits)

**4. [Rule 2 - Missing Critical] Added type assertions for Convex function identifiers**
- **Found during:** Task 2 (TypeScript compilation)
- **Issue:** Convex's `query()` and `mutation()` methods expect `FunctionReference` typed objects, not strings. Without codegen, string literals caused type errors.
- **Fix:** Added `as any` type assertions to function identifiers (e.g., `"api/tasks:getTasks" as any`). Documented in plan as temporary until Convex codegen is set up.
- **Files modified:** packages/convex-client/src/tasks.ts, packages/convex-client/src/subtasks.ts
- **Verification:** `tsc --noEmit` compiles without errors, package builds successfully
- **Committed in:** 61f47c5, 6ffe6f2 (Task 2 and Task 3 commits)

---

**Total deviations:** 4 auto-fixed (1 blocking, 1 bug, 2 missing critical)
**Impact on plan:** All auto-fixes necessary for correct TypeScript compilation and package configuration. No scope creep.

## Issues Encountered

**Workspace dependency naming confusion** - Initially misunderstood that `@convex-poc/shared-types/task` is an export path, not a separate package name. The workspace dependency should reference the package name `@convex-poc/shared-types`, while source imports use the export path. Resolved by checking shared-types/package.json and following the same pattern.

**Convex typing without codegen** - Discovered that Convex's browser client `query()` and `mutation()` methods are strictly typed to accept `FunctionReference` objects, not string literals. Since we haven't set up Convex codegen yet, used `as any` type assertions as documented in the plan note: "Convex's TypeScript generation should provide stricter types, but for Phase 13 we use manual typing until we set up codegen."

## User Setup Required

None - no external service configuration required. The Convex client defaults to local self-hosted backend at `http://127.0.0.1:3210`.

## Next Phase Readiness

- @convex-poc/convex-client package is ready for use in Electron main process and React renderer
- All task and subtask CRUD operations have type-safe wrappers
- Client initialization uses singleton pattern for efficient resource usage
- Integration with shared-types ensures type consistency across workspace
- Package builds successfully with Turborepo in dependency order

**Blockers/Concerns:**
- **Type assertions pending codegen:** Current `as any` type assertions for function identifiers should be replaced with Convex-generated `FunctionReference` types when codegen is set up. This is planned for later phases.
- **No authentication:** Phase 13 is single-user POC with no auth. Multi-user scenarios will require Convex auth configuration.
- **Subscription management:** `closeConvexClient()` is provided but Phase 17 will need to verify subscription pooling strategy for memory leak prevention.

---
*Phase: 13-foundation*
*Completed: 2026-01-18*
