# Requirements: AI Agents POC v1.0

**Defined:** 2026-01-18
**Core Value:** Demonstrate working multi-agent coordination with clean, reusable patterns.

## v1 Requirements

Requirements for v1.0 milestone — Electron Kanban UI with specialized CRUD agents.

### Mono-Repo & Foundation

- [x] **MONO-01**: pnpm workspace configured with apps/ and packages/ directories
- [x] **MONO-02**: Turborepo for build orchestration and task running
- [x] **MONO-03**: @repo/shared-types package with TypeScript types (tasks, agents, templates)
- [x] **MONO-04**: Convex backend schema for tasks, subtasks, and logs
- [x] **MONO-05**: Docker Compose with Convex and PostgreSQL 17 containers
- [x] **MONO-06**: @repo/convex-client package with type-safe queries/mutations

### Electron App Structure

- [ ] **ELEC-01**: Electron 33 + Vite 6 + TypeScript configuration
- [ ] **ELEC-02**: Main process with IPC handlers for task/agent/template operations
- [ ] **ELEC-03**: Preload script with contextBridge exposing secure APIs
- [ ] **ELEC-04**: Renderer process with React 19 + TypeScript
- [ ] **ELEC-05**: Electron Forge packaging configuration
- [ ] **ELEC-06**: Security settings (contextIsolation:true, nodeIntegration:false, CSP)

### Kanban Board UI

- [ ] **KANB-01**: 4-column layout (Tasks, In Progress, Sub-tasks, Done)
- [ ] **KANB-02**: Drag-and-drop using @dnd-kit
- [ ] **KANB-03**: Task state indicators (6 states: pending, running, auto-paused, user-paused, done, cancelled)
- [ ] **KANB-04**: State color coding (WCAG AA compliant 4.5:1 contrast)
- [ ] **KANB-05**: Real-time progress updates via Convex useQuery hooks
- [ ] **KANB-06**: In-progress icons (spinners) on active tasks

### Task Management

- [ ] **TASK-01**: Task creation form with description field (required)
- [ ] **TASK-02**: File upload for DDL/context files
- [ ] **TASK-03**: Workspace path picker with validation
- [ ] **TASK-04**: Task details modal showing full task info
- [ ] **TASK-05**: Keyword-based agent detection ("BE setup", "BE CRUD APIs", "FE CRUD Services", "UI CRUD pages")
- [ ] **TASK-06**: Priority-based task queue with max 5 concurrent tasks
- [ ] **TASK-07**: Max 5 sub-tasks per task running concurrently

### Specialized CRUD Agents

- [ ] **AGENT-01**: BE Boilerplate agent (spawns 1 sub-task for project setup)
- [ ] **AGENT-02**: FE Boilerplate agent (spawns 1 sub-task for project setup)
- [ ] **AGENT-03**: BE CRUD APIs agent (spawns N sub-tasks, one per table)
- [ ] **AGENT-04**: FE CRUD Services agent (spawns N sub-tasks, one per table)
- [ ] **AGENT-05**: UI CRUD Pages agent (spawns N sub-tasks, one per table)
- [ ] **AGENT-06**: Keyword routing (task description → appropriate agent)
- [ ] **AGENT-07**: Parallel sub-task execution with priority ordering
- [ ] **AGENT-08**: Agent-specific progress tracking (which agent, current step)

### Template System

- [x] **TMPL-01**: Handlebars template engine integration
- [x] **TMPL-02**: `.templates/` directory at mono-repo root
- [x] **TMPL-03**: BE boilerplate templates (project structure files)
- [x] **TMPL-04**: FE boilerplate templates (project structure files)
- [x] **TMPL-05**: BE CRUD templates (index.ts, sql.ts, types.ts, README.md, index.http)
- [x] **TMPL-06**: FE CRUD templates (index.ts, types.ts, api.ts, hooks.ts, README.md)
- [x] **TMPL-07**: UI CRUD templates (Page.tsx, schema.ts, form.tsx, table.tsx, hooks.ts, README.md)
- [x] **TMPL-08**: DDL parser using pgsql-parser (NOT regex)
- [x] **TMPL-09**: Input validation and escaping for template variables
- [x] **TMPL-10**: Template live reload when files change

### School ERP Domain

- [x] **SCHL-01**: 24-table PostgreSQL DDL for Indonesian schools
- [x] **SCHL-02**: npm run seeds script with mock data generation
- [x] **SCHL-03**: @faker-js/faker with Indonesian locale
- [x] **SCHL-04**: Kurikulum Merdeka support (P5 projects, descriptive grading)
- [x] **SCHL-05**: National ID fields (NISN, NIP, NUPTK) with validation
- [x] **SCHL-06**: Tables: students, teachers, classes, subjects, enrollments, attendance, grades, fees, parents, admins, and more
- [x] **SCHL-07**: Proper indexes and foreign key constraints
- [x] **SCHL-08**: PostgreSQL 17 specific features (JSONB, arrays, enums)

### Debugging & Polish

- [ ] **POLI-01**: Logs modal with real-time streaming output
- [ ] **POLI-02**: Color-coded log levels (info=blue, warn=yellow, error=red)
- [ ] **POLI-03**: Timestamps on each log entry
- [ ] **POLI-04**: Copy logs to clipboard button
- [ ] **POLI-05**: Archive view with search by task name
- [ ] **POLI-06**: Archive restore action (move back to Tasks)
- [ ] **POLI-07**: Archive delete permanently action
- [ ] **POLI-08**: Dark mode toggle with WCAG compliance
- [ ] **POLI-09**: Two-pause state distinction (auto-paused=orange, user-paused=purple)
- [ ] **POLI-10**: WIP limit indicators (visual warning at 5 concurrent)
- [ ] **POLI-11**: Parallel sub-task visualization (expandable parent card)
- [ ] **POLI-12**: Keyboard shortcuts (nice-to-have)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Team Features
- **TEAM-01**: Multi-user support with authentication
- **TEAM-02**: Task assignees and collaboration
- **TEAM-03**: Real-time collaborative editing

### Advanced Features
- **ADV-01**: Customizable column layouts
- **ADV-02**: Task dependencies visualization graph
- **ADV-03**: Advanced filtering and search
- **ADV-04**: Time tracking dashboard
- **ADV-05**: Mobile app (React Native)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Graphiti memory system | Convex provides persistent state; no additional memory system needed |
| Git worktree isolation | Simplified workspace management; focus on agent patterns |
| Python backend | Architecture decision to use pure TypeScript/Node with Convex |
| MCP integrations | Focus on Claude SDK agent patterns; external integrations add scope |
| Production-grade security | Learning environment; security patterns can be added later |
| Cloud Convex deployment | Self-hosted Docker Compose only; cloud deployment adds complexity |
| Real-time collaborative editing | Single-user POC; adds WebSocket complexity |
| Customizable columns | Breaks 4-column assumption; adds state management |
| Task dependencies graph | Complex rendering; sub-tasks already handle relationships |
| Mobile app | Electron = desktop only; mobile adds platform complexity |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| MONO-01 | Phase 13 | Complete |
| MONO-02 | Phase 13 | Complete |
| MONO-03 | Phase 13 | Complete |
| MONO-04 | Phase 13 | Complete |
| MONO-05 | Phase 13 | Complete |
| MONO-06 | Phase 13 | Complete |
| ELEC-01 | Phase 16 | Pending |
| ELEC-02 | Phase 16 | Pending |
| ELEC-03 | Phase 16 | Pending |
| ELEC-04 | Phase 16 | Pending |
| ELEC-05 | Phase 16 | Pending |
| ELEC-06 | Phase 16 | Pending |
| KANB-01 | Phase 17 | Pending |
| KANB-02 | Phase 17 | Pending |
| KANB-03 | Phase 17 | Pending |
| KANB-04 | Phase 17 | Pending |
| KANB-05 | Phase 17 | Pending |
| KANB-06 | Phase 17 | Pending |
| TASK-01 | Phase 16 | Pending |
| TASK-02 | Phase 16 | Pending |
| TASK-03 | Phase 16 | Pending |
| TASK-04 | Phase 16 | Pending |
| TASK-05 | Phase 15 | Pending |
| TASK-06 | Phase 15 | Pending |
| TASK-07 | Phase 15 | Pending |
| AGENT-01 | Phase 15 | Pending |
| AGENT-02 | Phase 15 | Pending |
| AGENT-03 | Phase 15 | Pending |
| AGENT-04 | Phase 15 | Pending |
| AGENT-05 | Phase 15 | Pending |
| AGENT-06 | Phase 15 | Pending |
| AGENT-07 | Phase 15 | Pending |
| AGENT-08 | Phase 15 | Pending |
| TMPL-01 | Phase 14 | Complete |
| TMPL-02 | Phase 14 | Complete |
| TMPL-03 | Phase 14 | Complete |
| TMPL-04 | Phase 14 | Complete |
| TMPL-05 | Phase 14 | Complete |
| TMPL-06 | Phase 14 | Complete |
| TMPL-07 | Phase 14 | Complete |
| TMPL-08 | Phase 14 | Complete |
| TMPL-09 | Phase 14 | Complete |
| TMPL-10 | Phase 14 | Complete |
| SCHL-01 | Phase 14 | Complete |
| SCHL-02 | Phase 14 | Complete |
| SCHL-03 | Phase 14 | Complete |
| SCHL-04 | Phase 14 | Complete |
| SCHL-05 | Phase 14 | Complete |
| SCHL-06 | Phase 14 | Complete |
| SCHL-07 | Phase 14 | Complete |
| SCHL-08 | Phase 14 | Complete |
| POLI-01 | Phase 17 | Pending |
| POLI-02 | Phase 17 | Pending |
| POLI-03 | Phase 17 | Pending |
| POLI-04 | Phase 17 | Pending |
| POLI-05 | Phase 17 | Pending |
| POLI-06 | Phase 17 | Pending |
| POLI-07 | Phase 17 | Pending |
| POLI-08 | Phase 17 | Pending |
| POLI-09 | Phase 18 | Pending |
| POLI-10 | Phase 18 | Pending |
| POLI-11 | Phase 18 | Pending |
| POLI-12 | Phase 18 | Pending |

**Coverage:**
- v1 requirements: 73 total
- Mapped to phases: 73 (100%) ✓
- Unmapped: 0

**Phase Summary:**
- Phase 13 (Foundation): 6 requirements - Mono-repo setup, Convex backend
- Phase 14 (Template System): 18 requirements - Templates, DDL parser, School ERP
- Phase 15 (Agent Orchestration): 11 requirements - CRUD agents, keyword routing, parallel execution
- Phase 16 (Electron Main Process): 10 requirements - Electron app, IPC, security
- Phase 17 (Kanban UI): 14 requirements - Kanban board, real-time sync, modals, dark mode
- Phase 18 (Polish): 4 requirements - Two-pause states, WIP limits, keyboard shortcuts

---
*Requirements defined: 2026-01-18*
*Last updated: 2026-01-18 after roadmap creation*
