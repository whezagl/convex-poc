# Roadmap: AI Agents POC

## Overview

Building a desktop-based multi-agent task management system with Electron, React, Convex, and specialized CRUD agents. The journey from mono-repo foundation to polished Kanban UI enables autonomous code generation with real-time workflow visualization.

## Milestones

- ✅ **v0.3 Multi-Agent Workflow** — Phases 1-12 (shipped 2026-01-18)
- 🚧 **v1.0 Electron Kanban Board** — Phases 13-18 (in progress)

---

## Phases

**Phase Numbering:**
- Integer phases (13, 14, 15): Planned v1.0 milestone work
- Decimal phases (13.1, 13.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

<details>
<summary>✅ v0.3 Multi-Agent Workflow (Phases 1-12) - SHIPPED 2026-01-18</summary>

**Milestone Goal:** Demonstrate working multi-agent coordination with clean, reusable patterns.

v0.3 delivered complete multi-agent orchestration with Planner, Coder, and Reviewer agents, Convex state storage, and end-to-end workflow execution. All 12 phases complete with 14 plans delivered in 172 minutes.

**Key Deliverables:**
- Multi-agent orchestration system (Planner → Coder → Reviewer)
- Self-hosted Convex backend via Docker Compose
- GLM-4.7 model support via environment variables
- End-to-end file operations (write to workspace, read for review)
- Pattern documentation (PATTERNS.md)

See MILESTONES.md for full milestone details.

</details>

### 🚧 v1.0 Electron Kanban Board (In Progress)

**Milestone Goal:** Add Electron UI with 4-column Kanban board for visual task management and specialized CRUD agents for template-based code generation.

- ✅ **Phase 13: Foundation** - Mono-repo structure, Convex backend, shared types (completed 2026-01-18)
- 🚧 **Phase 14: Template System** - Handlebars engine, DDL parser, code templates (gap closure)
- [ ] **Phase 15: Agent Orchestration** - CRUD agents, keyword routing, parallel execution
- [ ] **Phase 16: Electron Main Process** - IPC handlers, security, agent coordination
- [ ] **Phase 17: Kanban UI** - 4-column board, real-time sync, drag-and-drop
- [ ] **Phase 18: Polish** - Two-pause states, WIP limits, keyboard shortcuts

### Phase 13: Foundation
**Goal**: Establish mono-repo structure with Convex backend and type-safe shared packages
**Depends on**: v0.3 complete
**Requirements**: MONO-01, MONO-02, MONO-03, MONO-04, MONO-05, MONO-06
**Success Criteria** (what must be TRUE):
  1. Developer can run `pnpm install` and all workspace dependencies resolve correctly
  2. Developer can run `docker-compose up` and Convex + PostgreSQL containers start successfully
  3. TypeScript types from @convex-poc/shared-types are importable across workspace packages
  4. Convex backend accepts connections and stores task/subtask/log documents
  5. @convex-poc/convex-client provides type-safe queries and mutations to backend

**Plans**: 5 plans in 4 waves

Plans:
- [x] 13-01-PLAN.md — Set up pnpm workspace with apps/desktop and packages/ structure (Wave 1)
- [x] 13-02-PLAN.md — Create @convex-poc/shared-types package with TypeScript types and Zod schemas (Wave 2)
- [x] 13-03-PLAN.md — Deploy Convex schema for tasks, subtasks, and logs (Wave 3)
- [x] 13-04-PLAN.md — Build @convex-poc/convex-client with type-safe queries/mutations (Wave 4)
- [x] 13-05-PLAN.md — Configure Docker Compose with Convex and PostgreSQL 17 (Wave 1)

### Phase 14: Template System
**Goal**: Build robust template engine with DDL parser for code generation
**Depends on**: Phase 13
**Requirements**: TMPL-01, TMPL-02, TMPL-03, TMPL-04, TMPL-05, TMPL-06, TMPL-07, TMPL-08, TMPL-09, TMPL-10, SCHL-01, SCHL-02, SCHL-03, SCHL-04, SCHL-05, SCHL-06, SCHL-07, SCHL-08
**Success Criteria** (what must be TRUE):
  1. Developer can place `.handlebars` files in `.templates/` directory and they load automatically
  2. DDL parser extracts table definitions from PostgreSQL 17 syntax without using regex
  3. Template engine renders templates with variables and proper HTML/SQL escaping
  4. School ERP DDL (24 tables) parses completely and generates seed data via npm run seeds
  5. Template changes hot-reload without restarting the application
**Plans**: 11 plans in 1 wave (9 original + 2 gap closure)

Plans:
- [x] 14-01-PLAN.md — Build @repo/template-engine with Handlebars integration
- [x] 14-02-PLAN.md — Implement DDL parser using pgsql-parser for PostgreSQL 17
- [x] 14-03-PLAN.md — Create BE boilerplate templates (project structure files)
- [x] 14-04-PLAN.md — Create FE boilerplate templates (project structure files)
- [x] 14-05-PLAN.md — Create BE CRUD templates (index.ts, sql.ts, types.ts, README.md, index.http)
- [x] 14-06-PLAN.md — Create FE CRUD templates (index.ts, types.ts, api.ts, hooks.ts, README.md)
- [x] 14-07-PLAN.md — Create UI CRUD templates (Page.tsx, schema.ts, form.tsx, table.tsx, hooks.ts, README.md)
- [x] 14-08-PLAN.md — Build School ERP DDL with 24 tables for Indonesian schools
- [x] 14-09-PLAN.md — Implement npm run seeds with @faker-js/faker (Indonesian locale)
- [ ] 14-10-PLAN.md — Implement template auto-loading with file system integration (Gap Closure)
- [ ] 14-11-PLAN.md — Wire up hot-reload with development server (Gap Closure)

### Phase 15: Agent Orchestration
**Goal**: Implement specialized CRUD agents with parallel execution and keyword routing
**Depends on**: Phase 14
**Requirements**: AGENT-01, AGENT-02, AGENT-03, AGENT-04, AGENT-05, AGENT-06, AGENT-07, AGENT-08, TASK-05, TASK-06, TASK-07
**Success Criteria** (what must be TRUE):
  1. User creates task with "BE setup" keyword and BE Boilerplate agent spawns 1 sub-task
  2. User creates task with "BE CRUD APIs" keyword and agent spawns N sub-tasks (one per table)
  3. Task queue executes by priority while respecting max 5 concurrent tasks limit
  4. Sub-tasks execute in parallel up to 5 per task with proper file locking
  5. Agent progress updates Convex with current agent type and step number
**Plans**: TBD

Plans:
- [ ] 15-01: Refactor existing SequentialOrchestrator to @repo/agent-orchestrator package
- [ ] 15-02: Implement BE Boilerplate agent (spawns 1 sub-task for project setup)
- [ ] 15-03: Implement FE Boilerplate agent (spawns 1 sub-task for project setup)
- [ ] 15-04: Implement BE CRUD APIs agent (spawns N sub-tasks, one per table)
- [ ] 15-05: Implement FE CRUD Services agent (spawns N sub-tasks, one per table)
- [ ] 15-06: Implement UI CRUD Pages agent (spawns N sub-tasks, one per table)
- [ ] 15-07: Build AgentDispatcher with keyword-based routing
- [ ] 15-08: Implement TaskQueue with priority scheduling and concurrency limits
- [ ] 15-09: Add file locking with proper-lockfile for parallel operations

### Phase 16: Electron Main Process
**Goal**: Create secure Electron app with IPC handlers coordinating agents and templates
**Depends on**: Phase 15
**Requirements**: ELEC-01, ELEC-02, ELEC-03, ELEC-04, ELEC-05, ELEC-06, TASK-01, TASK-02, TASK-03, TASK-04
**Success Criteria** (what must be TRUE):
  1. Electron app launches with main process, preload script, and renderer process
  2. Renderer process cannot access Node.js APIs directly (contextIsolation enabled)
  3. Preload script exposes taskManager, agentDispatcher, and templateManager APIs via contextBridge
  4. IPC handlers create tasks with description, file uploads, and workspace path
  5. Electron Forge produces distributable packages for target platforms
**Plans**: TBD

Plans:
- [ ] 16-01: Configure Electron 33 + Vite 6 + TypeScript in apps/desktop
- [ ] 16-02: Implement main process with IPC handlers for task/agent/template operations
- [ ] 16-03: Build preload script with contextBridge exposing secure APIs
- [ ] 16-04: Set up renderer process with React 19 + TypeScript
- [ ] 16-05: Configure Electron Forge packaging for distribution
- [ ] 16-06: Implement security settings (contextIsolation, CSP, disable nodeIntegration)

### Phase 17: Kanban UI
**Goal**: Build 4-column Kanban board with real-time Convex sync and drag-and-drop
**Depends on**: Phase 16
**Requirements**: KANB-01, KANB-02, KANB-03, KANB-04, KANB-05, KANB-06, POLI-01, POLI-02, POLI-03, POLI-04, POLI-05, POLI-06, POLI-07, POLI-08
**Success Criteria** (what must be TRUE):
  1. User sees 4-column Kanban board (Tasks, In Progress, Sub-tasks, Done) with drag-and-drop
  2. Task cards display state colors (pending=gray, running=blue, done=green) meeting WCAG AA contrast
  3. Task state updates in real-time across multiple browser windows via Convex useQuery
  4. User clicks task to open details modal with full task info and logs
  5. User switches to dark mode and all colors maintain 4.5:1 contrast ratio
  6. Convex subscriptions clean up explicitly when windows close to prevent memory leaks
**Plans**: TBD

Plans:
- [ ] 17-01: Build 4-column Kanban layout with React
- [ ] 17-02: Implement drag-and-drop using @dnd-kit
- [ ] 17-03: Add task state indicators with WCAG AA compliant color coding
- [ ] 17-04: Integrate Convex useQuery hooks for real-time task updates
- [ ] 17-05: Implement in-progress spinners on active tasks
- [ ] 17-06: Build task details modal showing full task info
- [ ] 17-07: Create logs modal with real-time streaming, color-coded levels, and timestamps
- [ ] 17-08: Add copy logs to clipboard functionality
- [ ] 17-09: Build archive view with search by task name
- [ ] 17-10: Implement archive restore and delete permanently actions
- [ ] 17-11: Add dark mode toggle with WCAG compliance
- [ ] 17-12: Implement explicit Convex subscription cleanup in useEffect

### Phase 18: Polish
**Goal**: Add differentiating features for agent workflow visualization and usability
**Depends on**: Phase 17
**Requirements**: POLI-09, POLI-10, POLI-11, POLI-12
**Success Criteria** (what must be TRUE):
  1. User sees distinct colors for auto-paused (orange) vs user-paused (purple) task states
  2. Kanban board shows visual warning when 5 concurrent tasks running (WIP limit indicator)
  3. User can expand parent task cards to view parallel sub-task execution
  4. User can copy logs to clipboard with single button click
  5. User can navigate Kanban board using keyboard shortcuts (optional)
**Plans**: TBD

Plans:
- [ ] 18-01: Implement two-pause state distinction with different colors
- [ ] 18-02: Add WIP limit indicators with visual warnings
- [ ] 18-03: Build parallel sub-task visualization with expandable parent cards
- [ ] 18-04: Implement keyboard shortcuts for common actions

## Progress

**Execution Order:**
Phases execute in numeric order: 13 → 14 → 15 → 16 → 17 → 18

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 13. Foundation | v1.0 | 5/5 | ✓ Complete | 2026-01-18 |
| 14. Template System | v1.0 | 9/11 | Gap Closure | In progress |
| 15. Agent Orchestration | v1.0 | 0/9 | Not started | - |
| 16. Electron Main Process | v1.0 | 0/6 | Not started | - |
| 17. Kanban UI | v1.0 | 0/12 | Not started | - |
| 18. Polish | v1.0 | 0/4 | Not started | - |

**v1.0 Progress: 14/47 plans (30%)**
**Overall Progress: 28/61 plans (46%)**
