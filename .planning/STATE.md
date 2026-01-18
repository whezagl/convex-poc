# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-18)

**Core value:** Demonstrate working multi-agent coordination with clean, reusable patterns.
**Current focus:** Phase 14 - Template System

## Current Position

Phase: 14 of 18 (Template System)
Plan: 3 of 9 in current phase (Backend Boilerplate Templates)
Status: In progress
Last activity: 2026-01-18 — Completed Plan 14-03 (Backend Boilerplate Templates)

Progress: [██░░░░░░░░░] 13% (6/45 plans in v1.0)

## Performance Metrics

**Velocity:**
- Total plans completed: 20 (14 from v0.3 + 6 from v1.0)
- Average duration: 9.5 min
- Total execution time: 190 minutes (3h 10m)

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| v0.3 (Phases 1-12) | 14 | 172m | 12.3m |
| v1.0 Phase 13 | 5 | 22m | 4.4m |
| v1.0 Phase 14 | 1 | 2m | 2.0m |
| v1.0 Phase 14-03 | 1 | 3m | 3.0m |

**Recent Trend:**
- Last 5 plans: [3m, 2m, 4m, 2m, 3m]
- Latest (14-03): 3m
- Trend: Accelerating

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

### Pending Todos

None yet.

### Blockers/Concerns

**From research - Gaps to validate:**
- **Phase 14-09:** DDL parser must handle Indonesian language values in enums and check constraints
- **Phase 14-09:** Array columns (phone_numbers[], attachments[], affected_classes[]) need proper parsing
- **Phase 14-09:** Trigger function definitions and view definitions may need separate handling from table definitions
- **Phase 14-10:** Seed data generation must respect national ID validation rules (10-digit NISN, 18-digit NIP, etc.)
- **Phase 14-10:** P5 project seed data must use valid themes and descriptive assessments
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

**Resolved (Phase 14-08):**
- ~~DDL parser edge cases for PostgreSQL 17 features (arrays, JSONB, enums)~~ — DDL created successfully with all features, ready for parser testing

## Session Continuity

Last session: 2026-01-18
Stopped at: Completed Plan 14-03 (Backend Boilerplate Templates), ready for Plan 14-04 (Frontend Boilerplate Templates)
Resume file: None

**Completed Phase 13:** Mono-repo foundation with pnpm workspace, Turborepo, @convex-poc/shared-types, Convex backend with tasks/subtasks, @convex-poc/convex-client wrapper, Docker Compose with PostgreSQL 17.

**Completed Plan 14-01:** Handlebars template engine with 8 custom helpers (pascalCase, camelCase, isRequired, typescriptType, formatDate, eq, ne, gt, lt), Biome formatter integration with singleton pattern, hot-reload template watcher with chokidar, security utilities for SQL identifier and template variable escaping.

**Completed Plan 14-03:** Backend boilerplate templates with 6 Handlebars templates for Node.js backend projects, including package.json, tsconfig.json, biome.json, README.md, .gitignore, and src/index.ts templates. All templates use Handlebars helpers (pascalCase, camelCase, formatDate) and include auto-generated warning headers. Templates configured for Express 5.0.0, Zod 4.0.0, pg 8.13.0 with TypeScript ES2022 target.
