# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-18)

**Core value:** Demonstrate working multi-agent coordination with clean, reusable patterns.
**Current focus:** Phase 15 - Agent Orchestration

## Current Position

Phase: 15 of 18 (Agent Orchestration)
Plan: 02 of 11 in current phase (Create BaseCRUDAgent abstract class)
Status: In progress
Last activity: 2026-01-18 — Completed Plan 15-02 (Create BaseCRUDAgent abstract class)

Progress: [██░░░░░░░░░] 38% (18/47 plans in v1.0)

## Performance Metrics

**Velocity:**
- Total plans completed: 32 (14 from v0.3 + 18 from v1.0)
- Average duration: 7.6 min
- Total execution time: 234 minutes (3h 54m)

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| v0.3 (Phases 1-12) | 14 | 172m | 12.3m |
| v1.0 Phase 13 | 5 | 22m | 4.4m |
| v1.0 Phase 14-01 | 1 | 2m | 2.0m |
| v1.0 Phase 14-02 | 1 | 3m | 3.0m |
| v1.0 Phase 14-05 | 1 | 2m | 2.0m |
| v1.0 Phase 14-06 | 1 | 2m | 2.0m |
| v1.0 Phase 14-07 | 1 | 3m | 3.0m |
| v1.0 Phase 14-08 | 1 | 2m | 2.0m |
| v1.0 Phase 14-09 | 1 | 12m | 12.0m |
| v1.0 Phase 14-10 | 1 | 1m | 1.0m |
| v1.0 Phase 14-11 | 1 | 7m | 7.0m |
| v1.0 Phase 15-01 | 1 | 4m | 4.0m |
| v1.0 Phase 15-02 | 1 | 3m | 3.0m |

**Recent Trend:**
- Last 5 plans: [12m, 1m, 7m, 4m, 3m]
- Latest (15-02): 3m
- Trend: Stable

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- v0.3: TypeScript/Node over Python for codebase clarity
- v0.3: Self-hosted Convex via Docker Compose for development
- v0.3: Simplified agent pipeline (Planner→Coder→Reviewer) for learning
- v1.0: Mono-repo structure with pnpm workspace for type safety
- v1.0: 6-phase roadmap following research recommendations
- v1.0: Turborepo 2.x uses "tasks" field instead of "pipeline"
- v1.0: Internal dependencies use workspace:* protocol, external use version ranges
- v1.0: package.json exports field for type sharing instead of barrel files
- v1.0: All packages use @convex-poc/* naming convention
- v1.0: Use union types (literals) not enums for better serialization
- v1.0: Define Zod schemas alongside TypeScript types for runtime validation
- v1.0: Each package has its own tsconfig.json for isolated compilation
- v1.0: Embedded logs in task/subtask documents for simpler streaming
- v1.0: Convex indexes on status, priority for efficient Kanban queries
- v1.0: Bidirectional task-subtask linking via taskId and subTaskIds array
- v1.0: Singleton pattern for Convex client initialization
- v1.0: Type-safe wrapper functions matching backend function names exactly
- v1.0: Optional client injection parameter for testing flexibility
- v1.0: PostgreSQL 17 on port 5433 to avoid conflicts with local installations
- v1.0 Phase 14-01: Handlebars template engine with custom helpers for code generation
- v1.0 Phase 14-01: Biome formatter with singleton pattern for WASM efficiency
- v1.0 Phase 14-01: Chokidar hot-reload with 100ms stability threshold
- v1.0 Phase 14-01: Security utilities for SQL identifier and template variable escaping
- v1.0 Phase 14-01: HTML escaping ON by default (use {{{var}}} for trusted content)
- v1.0 Phase 14-02: PostgreSQL DDL parser using sql-parser-cst AST (not regex) for code generation
- v1.0 Phase 14-02: Continue-on-error pattern collects all parsing errors and reports at end
- v1.0 Phase 14-02: Indonesian national ID validators with basic digit-count validation (NISN=10, NIP=18, NUPTK=16)
- v1.0 Phase 14-02: PostgreSQL to TypeScript type mapping for common types (integer, varchar, jsonb, uuid, etc.)
- v1.0 Phase 14-03: Backend boilerplate templates with Express 5.0.0, Zod 4.0.0, pg 8.13.0
- v1.0 Phase 14-03: TypeScript ES2022 target for Node.js 20+ compatibility in backend templates
- v1.0 Phase 14-03: Biome formatter with 2-space indent, 80 char line width for backend code style
- v1.0 Phase 14-03: Auto-generated warnings (DO NOT EDIT - Auto-generated on [date]) in backend templates
- v1.0 Phase 14-08: Indonesian national IDs validated with regex (NPSN: 8, NISN: 10, NIP: 18, NUPTK: 16 digits)
- v1.0 Phase 14-08: Kurikulum Merdeka P5 projects use 8 themes with descriptive assessment (sangat_baik, baik, cukup, perlu_bimbingan)
- v1.0 Phase 14-08: All tables use identity columns with GENERATED ALWAYS AS IDENTITY for PostgreSQL 17
- v1.0 Phase 14-08: JSONB metadata columns on all tables for flexible schema evolution
- v1.0 Phase 14-08: Automatic updated_at triggers on all 24 tables for change tracking
- v1.0 Phase 14-08: Foreign keys use CASCADE for dependents, SET NULL for optional references
- v1.0 Phase 14-04: Frontend boilerplate templates with Vite + React 19 + TypeScript stack
- v1.0 Phase 14-04: TanStack Query for frontend state management with React Router 7
- v1.0 Phase 14-04: Auto-generated code warnings (DO NOT EDIT - Auto-generated on [date]) in all templates
- v1.0 Phase 14-05: Backend CRUD templates with repository pattern (findMany, findById, create, update, delete, count)
- v1.0 Phase 14-05: Parameterized queries ($1, $2) for all SQL to prevent injection attacks
- v1.0 Phase 14-05: Handlebars helpers (add, filterColumns, findColumn, takeColumns) for template column manipulation
- v1.0 Phase 14-06: Frontend CRUD templates with TanStack Query integration (useQuery, useMutation)
- v1.0 Phase 14-06: Query key factory pattern for hierarchical cache structure (all, lists, list, details, detail)
- v1.0 Phase 14-06: Mutations invalidate both detail and list queries for data consistency
- v1.0 Phase 14-06: Fetch API for HTTP requests with VITE_API_URL configuration
- v1.0 Phase 14-06: Auto-generated README documentation with usage examples for all hooks
- v1.0 Phase 14-07: UI CRUD templates with React Hook Form and Zod validation for form handling
- v1.0 Phase 14-07: HTML input type mapping from PostgreSQL types (text, number, checkbox, datetime-local, textarea)
- v1.0 Phase 14-07: Table component displays first 6 columns with format helpers for Date, boolean, and text types
- v1.0 Phase 14-07: Page component provides complete CRUD workflow with list, create, and edit views
- v1.0 Phase 14-07: Hooks re-export from FE CRUD layer to maintain single source of truth
- v1.0 Phase 14-07: Tailwind CSS utility classes for responsive layout and styling
- v1.0 Phase 14-08: School ERP DDL with 24 tables for Indonesian school management
- v1.0 Phase 14-08: Kurikulum Merdeka P5 projects with 8 themes and descriptive assessment scale
- v1.0 Phase 14-09: npm run seeds script with @faker-js/faker v10.2.0 for Indonesian locale data generation
- v1.0 Phase 14-09: Seed data generator with national ID validation (NISN=10, NIP=18, NUPTK=16, NPSN=8, NIK=16)
- v1.0 Phase 14-09: SQL INSERT generation from JavaScript objects with proper array handling
- v1.0 Phase 14-09: Indonesian locale (id_ID) for realistic names, addresses, phone numbers
- v1.0 Phase 14-10: TemplateEngine.load() method with file system integration and caching
- v1.0 Phase 14-10: Synchronous file reading (readFileSync) for simpler template loading API
- v1.0 Phase 14-10: Cache key uses absolute file path to avoid duplicates
- v1.0 Phase 14-10: invalidateCache() method for hot-reload integration (supports single-path and full clearing)
- v1.0 Phase 14-11: Hot-reload development server with chokidar directory watching (not glob patterns)
- v1.0 Phase 14-11: Watch directory directly and filter by .hbs extension in event handlers for cross-platform compatibility
- v1.0 Phase 14-11: Graceful shutdown with SIGINT handler and proper cleanup
- v1.0 Phase 14-11: Chokidar moved to dependencies (runtime requirement for watcher module)
- v1.0 Phase 15-01: TaskQueue with p-queue for priority-based task scheduling (concurrency: 5, timeout: 5min)
- v1.0 Phase 15-01: FileLockManager with proper-lockfile for parallel file write protection
- v1.0 Phase 15-01: QueueOptions.concurrency optional (not required) for flexible instantiation
- v1.0 Phase 15-01: TaskOptions.taskId uses string type (Id type doesn't exist in shared-types)
- v1.0 Phase 15-01: Package-level tsconfig.json with project references for workspace module resolution
- v1.0 Phase 15-02: BaseCRUDAgent abstract class with template engine integration for all CRUD agents
- v1.0 Phase 15-02: Re-export TableDefinition from template-engine for type compatibility (avoid duplicate definitions)
- v1.0 Phase 15-02: Template Method Pattern with abstract methods (selectTemplate, prepareTemplateVariables, getOutputPath)
- v1.0 Phase 15-02: Fire-and-forget pattern for Convex progress updates (non-blocking to avoid delaying agent execution)
- v1.0 Phase 15-02: File locking pattern with withLock() for exclusive access during parallel writes
- v1.0 Phase 15-02: CRUDAgentConfig.subTaskId uses string type (matches Convex ID format)
- v1.0 Phase 15-02: Check parseResult.errors.length for parser errors (continue-on-error pattern from Phase 14-02)
- v1.0 Phase 15-05: AgentDispatcher with hybrid keyword/LLM routing for task classification
- v1.0 Phase 15-05: Keyword extraction first (90% confidence threshold) before LLM fallback for performance
- v1.0 Phase 15-05: Claude Haiku (claude-3-haiku-20240307) for LLM classification (faster/cheaper than Opus)
- v1.0 Phase 15-05: Fire-and-forget pattern for Convex classification storage to avoid blocking routing
- v1.0 Phase 15-05: Configurable keyword patterns via DispatcherConfig for customization

### Pending Todos

None yet.

### Blockers/Concerns

**From research - Gaps to validate:**
- **Phase 15:** Priority queue deadlock detection in concurrent agent execution
- **Phase 16:** Electron packaging with workspace dependencies (workspace:*) may fail
- **Phase 17:** Convex + Electron integration lacks official examples
- **Phase 17:** Subscription pooling strategy for memory leak prevention
- **Phase 13-04:** Type assertions (as any) for Convex function identifiers pending codegen setup

**Resolved (Phase 13):**
- ~~pnpm workspace dependency hoisting conflicts may arise~~ — No issues found, all dependencies resolved correctly

**Resolved (Phase 14-01):**
- ~~@types/handlebars version compatibility~~ — Used 4.1.0 (latest available)
- ~~HandlebarsTemplateDelegate type export~~ — Used ReturnType<typeof Handlebars.compile> workaround
- ~~Biome API usage~~ — Updated to Biome.create() factory with singleton pattern
- ~~Chokidar error type casting~~ — Added type guards for unknown → Error conversion

**Resolved (Phase 14-02):**
- ~~sql-parser-cst version compatibility~~ — Used correct version 0.38.2 (not 1.6.0)
- ~~sql-parser-cst AST structure understanding~~ — Studied type definitions to understand Program.statements and CreateTableStmt
- ~~TypeScript type exports for module consumers~~ — Added explicit `export type` statements

**Resolved (Phase 14-08):**
- ~~DDL parser edge cases for PostgreSQL 17 features (arrays, JSONB, enums)~~ — DDL created successfully with all features, ready for parser testing

**Resolved (Phase 14-09):**
- ~~Seed data generation must respect national ID validation rules~~ — Implemented with faker.string.numeric() for exact digit counts
- ~~P5 project seed data must use valid themes and descriptive assessments~~ — Used all 8 official P5 themes with descriptive grading scale
- ~~@faker-js/faker v10 API compatibility~~ — Fixed date.future() → date.soon(), userName → displayName for v10 compatibility

**Resolved (Phase 14-11):**
- ~~Chokidar glob pattern doesn't detect file changes on macOS~~ — Fixed by watching directory directly and filtering by extension
- ~~Chokidar listed as devDependency but needed at runtime~~ — Moved to dependencies in package.json
- ~~Workspace packages not symlinked for import resolution~~ — Used relative imports to dist/ directory

## Session Continuity

Last session: 2026-01-18
Stopped at: Completed Plan 15-02 (Create BaseCRUDAgent abstract class)
Resume file: None

**Completed Phase 13:** Mono-repo foundation with pnpm workspace, Turborepo, @convex-poc/shared-types, Convex backend with tasks/subtasks, @convex-poc/convex-client wrapper, Docker Compose with PostgreSQL 17.

**Completed Plan 14-01:** Handlebars template engine with 8 custom helpers (pascalCase, camelCase, isRequired, typescriptType, formatDate, eq, ne, gt, lt), Biome formatter integration with singleton pattern, hot-reload template watcher with chokidar, security utilities for SQL identifier and template variable escaping.

**Completed Plan 14-02:** PostgreSQL DDL parser using sql-parser-cst AST library (not regex), handles PostgreSQL 17 features (arrays, timestamp with timezone, identity columns), extracts table definitions with columns, foreign keys, indexes, and constraints. Indonesian national ID validators: NISN (10 digits), NIP (18 digits), NUPTK (16 digits) with basic digit-count validation. PostgreSQL to TypeScript type mapping for common types. Parser module exported via @convex-poc/template-engine/parser.

**Completed Plan 14-05:** Backend CRUD templates (types.ts.hbs, sql.ts.hbs, index.ts.hbs, README.md.hbs, index.http.hbs) for generating database access code from DDL parser output. Repository pattern with findMany, findById, create, update, delete, count methods. Parameterized queries ($1, $2) for SQL injection prevention. JSDoc comments from column descriptions. Additional Handlebars helpers: add, filterColumns, findColumn, takeColumns.

**Completed Plan 14-06:** Frontend CRUD templates (types.ts.hbs, api.ts.hbs, hooks.ts.hbs, index.ts.hbs, README.md.hbs) for generating React code from DDL parser output. TanStack Query integration with query key factory pattern for efficient cache management. API client using fetch with proper error handling and query parameter support. Comprehensive README documentation with usage examples for all hooks.

**Completed Plan 14-07:** UI CRUD templates (Page.tsx.hbs, schema.ts.hbs, form.tsx.hbs, table.tsx.hbs, hooks.ts.hbs, README.md.hbs) for generating React UI components from DDL parser output. React Hook Form integration with Zod validation for type-safe form handling. HTML input type mapping from PostgreSQL types. Table component with edit/delete actions and format helpers for display. Page component provides complete CRUD workflow with list, create, and edit views. Hooks re-export from FE CRUD layer for consistency. Tailwind CSS styling. Added capitalize and inputType helpers to template engine.

**Completed Plan 14-08:** School ERP DDL with 24 tables for Indonesian school management. Kurikulum Merdeka P5 projects with 8 themes and descriptive assessment scale. Indonesian national ID validation with regex check constraints. PostgreSQL 17 features: identity columns, JSONB metadata, arrays, 19 custom enums. 87 indexes and 24 triggers for updated_at timestamps.

**Completed Plan 14-09:** npm run seeds script with @faker-js/faker v10.2.0 for Indonesian locale data generation. Seed data generator with national ID validation (NISN=10, NIP=18, NUPTK=16, NPSN=8, NIK=16). SQL INSERT generation from JavaScript objects with proper array handling. Generates 200K+ INSERT statements across 24 tables with foreign key relationships. README with usage examples and Indonesian domain specifics.

**Completed Plan 14-10:** TemplateEngine.load() method with file system integration, caching, and cache invalidation support. Synchronous file reading for simpler API. Cache key uses absolute file path. invalidateCache() method enables hot-reload integration. Templates can be loaded from .templates/ directory with automatic caching. Clear error messages when template files don't exist.

**Completed Plan 14-11:** Hot-reload development server with working template watching and cache invalidation. Fixed chokidar glob pattern issue by watching directory directly and filtering by .hbs extension. Moved chokidar to dependencies for runtime availability. npm run dev:templates script for convenient development. Graceful shutdown with SIGINT handler. Automatic cache invalidation on template changes, additions, and deletions.

**Completed Plan 15-01:** TaskQueue with p-queue for priority-based task scheduling (concurrency: 5, timeout: 5min). FileLockManager with proper-lockfile for parallel file write protection. Queue type definitions (TaskOptions, QueueOptions, FileLockOptions, QueueStats). Package exports for @convex-poc/agent-orchestrator/queue and ./types/queue. Fixed QueueOptions.concurrency to optional, TaskOptions.taskId to string type, added type assertion for TaskQueue.add() return type, created package-level tsconfig.json with project references.

**Completed Plan 15-02:** BaseCRUDAgent abstract class with template engine integration for all CRUD agents (BE/FE boilerplate, CRUD APIs, services, UI pages). Template Method Pattern with abstract methods (selectTemplate, prepareTemplateVariables, getOutputPath) and concrete execute() workflow (parse, load, prepare, generate, write). Integrated with convex-client for real-time progress tracking (updateSubTaskProgress, updateSubTaskStatus). File locking pattern with withLock() for exclusive access during parallel writes. Fixed type compatibility by re-exporting TableDefinition from template-engine parser. Fixed proper-lockfile import (named instead of default) and Anthropic SDK import (default instead of named). Agents barrel export created with BaseCRUDAgent and types.

**Completed Plan 15-05:** AgentDispatcher with hybrid keyword/LLM routing for task classification to 5 CRUD agent types (BE/FE boilerplate, CRUD APIs, services, UI pages). Keyword extraction with 90% confidence threshold skips LLM for fast-path routing. Claude Haiku for LLM classification fallback. Console logging stub until updateClassification mutation is available in plan 15-06. Fire-and-forget Convex updates to avoid blocking. Configurable keyword patterns via DispatcherConfig.
