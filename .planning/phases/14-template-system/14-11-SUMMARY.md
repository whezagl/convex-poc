---
phase: 14-template-system
plan: 11
subsystem: code-generation
tags: [chokidar, hot-reload, template-watcher, dev-server]

# Dependency graph
requires:
  - phase: 14-01
    provides: Handlebars template engine, chokidar watcher infrastructure
provides:
  - Working hot-reload development server with automatic cache invalidation
  - Fixed chokidar glob pattern issue for cross-platform file watching
  - npm run dev:templates script for convenient development
affects: [14-12, 15-migration]

# Tech tracking
tech-stack:
  added: []
  patterns: [directory watching with extension filtering, graceful shutdown with SIGINT handler]

key-files:
  created: [scripts/dev/template-dev-server.ts]
  modified: [packages/template-engine/src/engine/handlebars.ts, packages/template-engine/src/watcher/template-watcher.ts, packages/template-engine/package.json, package.json]

key-decisions:
  - "Watch directory directly instead of using glob patterns for cross-platform chokidar compatibility"
  - "Move chokidar from devDependencies to dependencies (runtime requirement)"
  - "Filter by .hbs extension in event handlers instead of glob pattern"

patterns-established:
  - "Pattern 13: Hot-reload file watching with directory-based watching and extension filtering"
  - "Pattern 14: Graceful shutdown with SIGINT handler and process cleanup"

# Metrics
duration: 7min
completed: 2026-01-18
---

# Phase 14 Plan 11: Hot-Reload Development Server Summary

**Working hot-reload development server with automatic cache invalidation and cross-platform chokidar file watching**

## Performance

- **Duration:** 7 min
- **Started:** 2026-01-18T06:24:12Z
- **Completed:** 2026-01-18T06:31:09Z
- **Tasks:** 4
- **Files modified:** 4

## Accomplishments

- Created template development server with hot-reload functionality
- Added invalidateCache() method to TemplateEngine interface
- Fixed chokidar glob pattern issue for cross-platform compatibility
- Added npm run dev:templates script for convenient development

## Task Commits

Each task was committed atomically:

1. **Task 1: Create template development server** - `a5e5be2` (feat)
2. **Task 2: Expose cache invalidation from TemplateEngine** - `e0358d3` (feat)
3. **Task 4: Add npm script for template dev server** - `b1a13d3` (feat)
4. **Task 2+3: Fix chokidar glob pattern and move to dependencies** - `27b5b1a` (fix)

**Plan metadata:** Pending (docs: complete plan)

_Note: Tasks 2 and 3 were combined with the bug fix commit_

## Files Created/Modified

### Created

- `scripts/dev/template-dev-server.ts` - Template development server with hot-reload, cache invalidation, and graceful shutdown

### Modified

- `packages/template-engine/src/engine/handlebars.ts` - Added invalidateCache(templatePath?: string) method to TemplateEngine interface
- `packages/template-engine/src/watcher/template-watcher.ts` - Fixed glob pattern to watch directory directly, filter by .hbs extension in handlers
- `packages/template-engine/package.json` - Moved chokidar to dependencies, updated exports to use dist/
- `package.json` - Added dev:templates script

## Decisions Made

1. **Watch directory directly instead of using glob patterns** - The glob pattern `**/*.hbs` doesn't work reliably with chokidar on all platforms (especially macOS). Solution: Watch the directory directly and filter by file extension in event handlers.

2. **Move chokidar from devDependencies to dependencies** - Chokidar is imported in the watcher module which is used at runtime by the dev server, not just during development. This was causing runtime module resolution errors.

3. **Update package.json exports to use dist/ directory** - The exports field was pointing to src/ files but TypeScript compiles to dist/. Updated to use the correct built files.

4. **Use relative imports in dev server** - Workspace packages aren't symlinked in node_modules by pnpm in this configuration. Used relative imports to the package dist/ directory.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed chokidar glob pattern not detecting file changes**
- **Found during:** Task 1 (Testing hot-reload functionality)
- **Issue:** Glob pattern `**/*.hbs` doesn't work reliably with chokidar on macOS. Files were not being detected when modified.
- **Fix:** Changed to watch directory directly and filter by `.endsWith('.hbs')` in event handlers
- **Files modified:** packages/template-engine/src/watcher/template-watcher.ts
- **Verification:** Modified .hbs files now trigger hot-reload events correctly
- **Committed in:** 27b5b1a (fix commit)

**2. [Rule 2 - Missing Critical] Moved chokidar from devDependencies to dependencies**
- **Found during:** Task 1 (Runtime module resolution)
- **Issue:** Chokidar was listed as devDependency but imported in watcher module used at runtime. This caused ERR_MODULE_NOT_FOUND errors.
- **Fix:** Moved chokidar to dependencies in package.json
- **Files modified:** packages/template-engine/package.json
- **Verification:** Dev server starts without module resolution errors
- **Committed in:** 27b5b1a (fix commit)

**3. [Rule 2 - Missing Critical] Fixed package.json exports to use dist/ directory**
- **Found during:** Task 1 (Module resolution)
- **Issue:** Exports field pointed to `./src/engine/index.js` but TypeScript compiles to `./dist/engine/index.js`
- **Fix:** Updated all export paths to use dist/ directory
- **Files modified:** packages/template-engine/package.json
- **Verification:** Module imports resolve correctly
- **Committed in:** e0358d3 (task 2 commit)

**4. [Rule 3 - Blocking] Used relative imports instead of workspace package imports**
- **Found during:** Task 1 (Testing dev server)
- **Issue:** pnpm workspace packages aren't symlinked in root node_modules. Import `@convex-poc/template-engine/watcher` failed with ERR_MODULE_NOT_FOUND.
- **Fix:** Used relative imports from scripts/dev/ to packages/template-engine/dist/
- **Files modified:** scripts/dev/template-dev-server.ts
- **Verification:** Dev server starts and imports modules correctly
- **Committed in:** a5e5be2 (task 1 commit)

---

**Total deviations:** 4 auto-fixed (1 bug, 2 missing critical, 1 blocking)
**Impact on plan:** All auto-fixes necessary for hot-reload to work correctly. No scope creep.

## Issues Encountered

1. **Chokidar glob pattern not working on macOS** - The glob pattern `**/*.hbs` failed to detect file changes on macOS. Resolved by watching the directory directly and filtering by extension in event handlers.

2. **Workspace package not available at runtime** - The pnpm workspace package wasn't accessible via import syntax. Resolved by using relative file paths to the built dist/ directory.

3. **Chokidar listed as devDependency** - Runtime import failed because chokidar wasn't available at runtime. Moved to dependencies.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Template hot-reload development server is fully functional
- Developers can run `npm run dev:templates` to start the watcher
- Modifying .hbs files triggers automatic cache invalidation and re-loading
- Graceful shutdown works with Ctrl+C

**Blockers/Concerns:**
- None - hot-reload functionality is working as intended

**Verification Completed:**
- Dev server starts: `npm run dev:templates` works correctly
- Hot-reload on change: Modifying .hbs files triggers console logs
- Hot-reload on add: Adding new .hbs files triggers console logs
- Hot-reload on delete: Deleting .hbs files triggers console logs
- Graceful shutdown: Ctrl+C triggers shutdown sequence
- Cache invalidation: invalidateCache() method works correctly

---
*Phase: 14-template-system*
*Completed: 2026-01-18*
