# Phase 13: Foundation - Context

**Gathered:** 2026-01-18
**Status:** Ready for planning

## Phase Boundary

Establish mono-repo structure with pnpm workspace, configure Convex backend schema for tasks/subtasks/logs, and create shared TypeScript types package. This phase delivers the foundational infrastructure that all other phases depend on.

## Implementation Decisions

### Workspace Organization
- **Package naming**: Use `@convex-poc/*` prefix (e.g., `@convex-poc/shared-types`, `@convex-poc/convex-client`)
- **Directory structure**: `apps/` + `packages/` split
  - `apps/desktop/` — Electron app
  - `packages/shared-types/` — TypeScript types
  - `packages/convex-client/` — Convex client wrapper
  - `packages/agent-orchestrator/` — Agent logic (restructured from existing `src/`)
  - `packages/template-engine/` — Code generation
- **Existing code**: Restructure current `src/` agents into new mono-repo structure
- **Workspace references**: Strict `workspace:*` protocol for all internal packages

### Type Organization
- **File structure**: Entity-based files (one interface per file)
  - `Task.ts`, `SubTask.ts`, `Log.ts`, `Agent.ts`, `Template.ts`
- **Exports**: Barrel exports via `index.ts` for cleaner imports
- **Fixed values**: Use union types (string literals) not enums — e.g., `type TaskStatus = 'pending' | 'running' | 'paused' | 'done'`
- **Validation**: Include Zod schemas alongside TypeScript types for runtime validation

### Convex Schema Design
- **Collections**: Two separate collections (tasks and subtasks) with references
  - Enables independent queries for Sub-tasks column
  - Real-time sub-task updates without re-fetching parent
- **Logs**: Embedded in task/subtask documents (simpler streaming)
- **Document structure**: Flat field organization (minimal nesting)
- **Indexes**: `status`, `priority`, `createdAt` for efficient Kanban queries

### Docker & Environment Setup
- **Docker Compose**: Split files
  - `docker-compose.yml` — Convex (existing)
  - `docker-compose.dev.yml` — PostgreSQL override
- **PostgreSQL**: Custom port 5433 (avoids conflicts with local PostgreSQL)
- **Environment variables**: `.env` file with `.env.example` template
- **Data persistence**: Bind mounts (`./data/convex`, `./data/pg`)

### Claude's Discretion
- **Type exports**: Use barrel exports (index.ts) for cleaner imports
- **Fixed values**: Use union types over enums for better serialization
- **Task storage**: Two collections (tasks + subtasks) for scalability
- **Log storage**: Embedded in documents with size limits (to be determined during implementation)
- **Document structure**: Flat over nested for simpler queries
- **Indexes**: Standard indexes on status, priority, createdAt
- **Environment**: .env with .env.example template
- **Data volumes**: Bind mounts for visibility

## Specific Ideas

No specific requirements — open to standard mono-repo and Convex patterns.

## Deferred Ideas

None — discussion stayed within phase scope.

---

*Phase: 13-foundation*
*Context gathered: 2026-01-18*
