# Project Research Summary

**Project:** AI Agents POC v1.0 - Multi-Agent Workflow Kanban UI
**Domain:** Electron Desktop Application with Convex Backend
**Researched:** 2026-01-18
**Confidence:** HIGH

## Executive Summary

This project is a desktop-based multi-agent task management system built with Electron, featuring a real-time Kanban board UI for visualizing autonomous agent workflows. The recommended approach combines Electron for cross-platform desktop capabilities, React for the Kanban interface, Convex for real-time backend synchronization, and PostgreSQL for persistent data storage. Research indicates this architecture enables single-user agent orchestration with live progress tracking, making it suitable for developers automating repetitive coding tasks through specialized CRUD agents.

The key differentiator is agent-aware workflow visualization: unlike traditional Kanban boards (Trello, Jira) that track manual task movement, this system autonomously executes tasks via AI agents while providing real-time logs streaming, two-pause state distinction (auto vs user), and parallel sub-task execution visibility. Critical risks include memory leaks from unmanaged Convex subscriptions (mitigated through explicit cleanup), template injection vulnerabilities from DDL parsing (prevented with proper validation), and Electron security misconfigurations (addressed with contextBridge and strict IPC boundaries).

The recommended technical stack leverages pnpm workspace monorepo structure with Turborepo for build orchestration, separating concerns into `apps/desktop` (Electron), `packages/agent-orchestrator` (existing agent logic), `packages/convex-client` (real-time backend), and `packages/template-engine` (code generation). This architecture enables parallel development, type-safe internal packages, and clean separation between UI and agent orchestration.

## Key Findings

### Recommended Stack

**Core technologies:**
- **Electron ^33.0.0 + React ^19.0.0 + Vite ^6.0.0** — Industry standard for cross-platform desktop apps with fastest dev experience
- **Convex ^1.31.4 (self-hosted)** — Real-time backend already integrated; provides automatic sync for task state across windows
- **PostgreSQL ^17.0** — Production-ready RDBMS for School ERP schema; excellent JSON support and ACID compliance
- **pnpm ^9.15.0 + Turborepo** — Fastest package manager with monorepo support; strict dependency management prevents phantom bugs
- **shadcn/ui + Tailwind CSS ^4.0.0 + @dnd-kit ^7.0.0** — Modern, accessible Kanban components with excellent TypeScript support
- **Handlebars ^4.7.8** — Logicless template engine for code generation; forces separation of concerns
- **Docker Compose** — Already in use for Convex; easily extended with PostgreSQL container

**Version compatibility verified:**
- Electron 33 requires Node.js 20.10.0+
- React 19 works with TypeScript 5.0+
- Vite 6 compatible with latest Electron Forge
- Tailwind 4 requires Vite 6+
- pg 8.13 supports PostgreSQL 17 features

### Expected Features

**Must have (table stakes):**
- **4-column Kanban board** — Core visual workflow (Tasks -> In Progress -> Sub-tasks -> Done)
- **Task creation form** — Description + file upload + workspace path fields
- **Task state management** — Six states: pending, running, auto-paused, user-paused, done, cancelled
- **Real-time progress updates** — Live sync via Convex WebSocket subscriptions
- **Task details modal** — View full task info + logs
- **Logs modal with streaming** — Color-coded by level (info/warn/error) with timestamps
- **Archive view** — Soft-delete with search + restore + delete permanently
- **Dark mode** — WCAG compliant (4.5:1 contrast)

**Should have (competitive):**
- **Two-pause state distinction** — Different colors for auto-paused (system) vs user-paused (manual)
- **Parallel sub-task visualization** — Expandable parent card shows concurrent agent execution
- **WIP limit indicators** — Visual warning at 5 concurrent tasks, 5 sub-tasks per task
- **Copy logs to clipboard** — Single entry or bulk export for debugging
- **Keyword-based agent detection** — Auto-parse task description for CRUD agent routing

**Defer (v2+):**
- **Customizable column layouts** — Fixed columns for MVP; customize later if validated
- **Task dependencies visualization** — Sub-tasks already handle parent-child relationships
- **Advanced filtering/search** — Archive search by task name sufficient for POC
- **Multi-user support** — Single-user focused; team features in v2+
- **Mobile app** — Desktop-first; responsive Electron window only

### Architecture Approach

**Recommended mono-repo structure:**

```
convex-poc/
├── apps/
│   └── desktop/              # Electron + React Kanban board
│       ├── main/             # Main process (IPC handlers, agent dispatcher)
│       ├── renderer/         # React UI (Kanban, modals, hooks)
│       └── preload/          # Secure bridge via contextBridge
├── packages/
│   ├── shared-types/         # TypeScript types (tasks, agents, templates)
│   ├── convex-client/        # Convex client wrapper
│   ├── agent-orchestrator/   # Existing Planner, Coder, Reviewer agents
│   └── template-engine/      # Handlebars code generation
├── .templates/               # User-customizable code templates
├── convex/                   # Self-hosted Convex backend
├── pnpm-workspace.yaml
└── turbo.json
```

**Major components:**
1. **Renderer Process (UI)** — React + TypeScript + Tailwind + Zustand for transient state; displays Kanban board, handles user interactions, subscribes to Convex real-time updates
2. **Preload Script** — TypeScript with contextBridge API; exposes limited secure APIs (taskManager, agentDispatcher, templateManager) to renderer
3. **Main Process (IPC)** — Node.js runtime; coordinates agents, manages templates, handles filesystem access, IPC handlers for renderer requests
4. **Agent Dispatcher** — Keyword detection + routing to 5 CRUD agents (BE Boilerplate, FE Boilerplate, BE CRUD, FE CRUD, UI CRUD) or general Planner->Coder->Reviewer
5. **Convex Client** — Real-time sync via useQuery hooks; automatic re-renders on data changes; persistent shared state (tasks, logs, agent status)
6. **Template Manager** — Loads .templates/ files via Handlebars; renders with variables; writes generated code to workspace

**Key architectural patterns:**
- **Context Isolation** — Renderer sandboxed with no Node.js access; preload script exposes limited APIs
- **Two Sources of Truth** — Zustand for transient UI state (modals, filters); Convex for persistent shared state (tasks, logs)
- **Keyword-Based Agent Routing** — Dispatcher analyzes task descriptions for keywords; routes to specialized agents or fallback to general orchestrator
- **Priority-Based Task Queue** — Executes tasks by priority (high/medium/low) while respecting concurrency limits (max 5 concurrent tasks)

### Critical Pitfalls

**Top 5 from research:**

1. **Memory leaks from unmanaged Convex subscriptions** — Windows accumulate subscriptions without cleanup, causing multi-gigabyte memory spikes. Implement explicit cleanup in useEffect return functions; track active subscriptions per-window.

2. **Template injection vulnerabilities via user-provided DDL** — Unescaped DDL content enables SQL/template injection attacks. Validate all identifiers against strict patterns (alphanumeric + underscores only); use proper SQL parser (pgsql-parser) instead of regex.

3. **Race conditions in parallel agent execution** — Multiple agents write to same files/Convex state simultaneously, causing corruption. Implement file-level locks (proper-lockfile); use Convex transactional mutations with optimistic concurrency control.

4. **Electron security misconfiguration** — nodeIntegration:true or contextIsolation:false exposes local system to XSS. Always enable contextIsolation:true, nodeIntegration:false; use preload scripts with contextBridge; strict CSP.

5. **PostgreSQL Docker volume persistence corruption** — Data loss after restarts due to volume mounting issues. Use named Docker volumes with explicit paths; set PGDATA environment variable; fix volume permissions (chown -R 999:999).

## Implications for Roadmap

Based on combined research from STACK, FEATURES, ARCHITECTURE, PITFALLS, and SCHOOL-ERP-DOMAIN, suggested phase structure:

### Phase 1: Foundation (Mono-Repo + Convex + Shared Types)
**Rationale:** Architecture research shows pnpm workspace with Turborepo is optimal for separating concerns. Must establish type-safe foundation before building features. Pitfalls research indicates monorepo structure must be correct early to avoid packaging failures.

**Delivers:**
- pnpm workspace with apps/desktop and packages/ structure
- @repo/shared-types package with TypeScript types (tasks, agents, templates)
- Convex backend with schema (tasks, subtasks, logs tables)
- @repo/convex-client package with type-safe queries/mutations
- Docker Compose with Convex + PostgreSQL containers

**Addresses:**
- Task state management (from FEATURES.md)
- Real-time progress updates (from FEATURES.md)

**Avoids:**
- pnpm workspace dependency hoisting conflicts (Pitfall #7)
- PostgreSQL Docker volume persistence corruption (Pitfall #5)
- Electron security misconfiguration (Pitfall #4) — implement secure defaults from start

### Phase 2: Template System + DDL Parser
**Rationale:** Template-based code generation is 3x faster than agent-only for repetitive patterns (ARCHITECTURE.md). Must build robust DDL parser before implementing CRUD agents. School ERP domain research provides complete DDL reference (24 tables).

**Delivers:**
- @repo/template-engine package with Handlebars rendering
- DDL parser using pgsql-parser (NOT regex-based)
- Input validation and escaping for template variables
- Sample templates in .templates/ (backend-boilerplate, frontend-boilerplate, backend-crud, frontend-crud, ui-crud)
- School ERP DDL seed script (24 tables with Indonesia-specific fields)

**Addresses:**
- Keyword-based agent detection (from FEATURES.md)
- Template-based task hints (from FEATURES.md)

**Avoids:**
- Template injection vulnerabilities (Pitfall #2)
- DDL parser edge cases (Pitfall #6)
- School ERP schema normalization anti-patterns (Pitfall #8)

### Phase 3: Agent Orchestration + CRUD Agents
**Rationale:** Existing SequentialOrchestrator (Planner, Coder, Reviewer) can be moved to shared package. Must add 5 CRUD agents for common patterns. Priority-based queue required for parallel execution.

**Delivers:**
- @repo/agent-orchestrator package (refactored from existing code)
- 5 CRUD agents: BE Boilerplate, FE Boilerplate, BE CRUD API, FE CRUD Service, UI CRUD Page
- AgentDispatcher with keyword-based routing
- TaskQueue with priority scheduling (max 5 concurrent tasks)
- File locking for parallel operations (proper-lockfile)

**Addresses:**
- Parallel sub-task visualization (from FEATURES.md)
- Agent-specific progress tracking (from FEATURES.md)

**Avoids:**
- Race conditions in parallel agent execution (Pitfall #3)

### Phase 4: Electron Main Process + IPC
**Rationale:** Main process coordinates agents and templates. Must implement secure IPC before renderer can communicate. Architecture patterns show contextBridge is mandatory for security.

**Delivers:**
- Electron app in apps/desktop with Vite + TypeScript
- Main process with IPC handlers (tasks, agents, templates)
- Preload script with contextBridge exposing limited APIs
- Integration with @repo/agent-orchestrator and @repo/template-engine
- Electron Forge packaging configuration

**Addresses:**
- Task creation form (from FEATURES.md)
- File upload handling (from FEATURES.md)

**Avoids:**
- Electron security misconfiguration (Pitfall #4)
- Direct Node.js access in renderer (Anti-pattern #1)
- Synchronous IPC blocking renderer (Anti-pattern #3)

### Phase 5: Kanban UI + Real-Time Sync
**Rationale:** Renderer UI is the user-facing layer. Must integrate Convex real-time subscriptions with proper cleanup to avoid memory leaks. Kanban board with 4 columns is core visualization.

**Delivers:**
- React + Vite in renderer process
- 4-column Kanban board (Tasks -> In Progress -> Sub-tasks -> Done)
- Drag-and-drop using @dnd-kit
- Convex useQuery hooks for real-time task updates
- Task details modal, logs modal with streaming
- Archive view with search/restore/delete
- Dark mode with WCAG compliance
- Explicit subscription cleanup in useEffect

**Addresses:**
- 4-column Kanban board (from FEATURES.md)
- Real-time progress updates (from FEATURES.md)
- Task details modal (from FEATURES.md)
- Logs modal with streaming (from FEATURES.md)
- Archive view (from FEATURES.md)
- Dark mode (from FEATURES.md)

**Avoids:**
- Memory leaks from unmanaged subscriptions (Pitfall #1)
- Duplication of state between Zustand and Convex (Anti-pattern #2)

### Phase 6: Polish + Differentiating Features
**Rationale:** After core is working, add competitive differentiators. Two-pause state distinction and WIP limit indicators provide unique value for agent workflows.

**Delivers:**
- Two-pause state distinction (auto-paused vs user-paused with different colors)
- WIP limit indicators (visual warning at 5 concurrent tasks)
- Copy logs to clipboard
- Keyboard shortcuts
- Priority-based sub-task ordering
- Parallel sub-task visualization (expandable parent card)

**Addresses:**
- Two-pause state distinction (from FEATURES.md)
- WIP limit indicators (from FEATURES.md)
- Parallel sub-task visualization (from FEATURES.md)
- Copy logs to clipboard (from FEATURES.md)
- Keyboard shortcuts (from FEATURES.md)

### Phase Ordering Rationale

- **Foundation first** — Mono-repo structure and Convex backend must exist before building features; prevents architectural debt
- **Templates before agents** — CRUD agents depend on template engine; DDL parser is core to template generation
- **Orchestration before UI** — Main process must coordinate agents before renderer can display them; IPC layer required for communication
- **Main before renderer** — Electron security model requires main process to be secure before renderer can connect via IPC
- **Core before polish** — Real-time sync and Kanban board are essential; differentiating features add value after core works
- **Memory leak prevention early** — Subscription cleanup patterns established in Phase 5 prevent technical debt

### Research Flags

**Phases likely needing deeper research during planning:**
- **Phase 2 (Template System):** DDL parser edge cases for PostgreSQL-specific features (arrays, JSONB, enums, custom types). Research provides complete School ERP schema but parser robustness needs validation with diverse DDL samples.
- **Phase 3 (Agent Orchestration):** Priority-based queue deadlock detection and prevention. Research describes priority queue but concurrent execution patterns may need deeper investigation.
- **Phase 5 (Kanban UI):** Convex subscription pooling for shared data across windows. Research warns about unbounded subscription growth but specific pooling patterns require validation.

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Foundation):** pnpm workspace and Turborepo are well-documented; established patterns from official docs
- **Phase 4 (Electron Main Process):** Electron security patterns (contextBridge, IPC) are standard; official documentation is comprehensive
- **Phase 6 (Polish):** Keyboard shortcuts and WIP limits are common UX patterns; no research needed

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Official Electron docs, recent 2025 sources for Vite+React, verified Convex examples |
| Features | HIGH | Kanban board patterns well-documented; multi-agent workflow visualization from 2025 research |
| Architecture | MEDIUM | Mono-repo and Electron patterns verified; Electron+Convex integration lacks official examples (inferred from web patterns) |
| Pitfalls | MEDIUM | Electron security and PostgreSQL issues verified with official sources; template injection and race conditions based on general best practices |
| Domain (School ERP) | HIGH | Indonesian education system verified with official sources; complete DDL with 24 tables; Kurikulum Merdeka requirements documented |

**Overall confidence: HIGH**

Research is based on:
- Official documentation (Electron, Convex, PostgreSQL, pnpm)
- Recent sources (2024-2025) for Kanban UI and multi-agent patterns
- Verified Indonesian education sources for domain requirements
- Multiple production-grade examples for each stack component

### Gaps to Address

**Areas requiring validation during implementation:**

- **Convex + Electron integration:** No official examples of Convex browser SDK running in Electron renderer. During Phase 5, test WebSocket connection through Electron's security context; verify useQuery hooks work correctly.

- **DDL parser for complex PostgreSQL features:** Research provides School ERP schema but parser must handle arrays, JSONB, enums, and custom types. During Phase 2, test parser with production DDL samples; add comprehensive test suite for edge cases.

- **Priority queue deadlock prevention:** Research describes priority-based task queue but concurrent execution patterns may have edge cases. During Phase 3, implement deadlock detection and exponential backoff retry logic.

- **Subscription pooling strategy:** Research warns about unbounded subscription growth but specific pooling patterns for Convex are unclear. During Phase 5, implement subscription limits per window and track active subscription count.

- **Electron packaging with workspace dependencies:** pnpm workspace protocol (workspace:*) may fail in production builds. During Phase 4, test `pnpm build && dist` early; use relative imports or file: protocol if issues persist.

**How to handle during planning/execution:**
- Add explicit validation tasks to roadmap phases for each gap
- Create spikes (research tasks) for uncertain integration points
- Implement monitoring for memory leaks and subscription growth
- Add integration tests for critical path (DDL parsing, file locking, IPC security)

## Sources

### Primary (HIGH confidence)
- [Electron Official Documentation](https://electronjs.org/docs/latest) — Process model, context isolation, IPC patterns
- [Electron Forge - React with TypeScript](https://www.electronforge.io/guides/framework-integration/react-with-typescript) — Official Electron Forge guide
- [Electron Forge - Vite + TypeScript](https://www.electronforge.io/templates/vite-+-typescript) — Official Vite template
- [Convex Official Documentation](https://docs.convex.dev/home) — Best practices, schema philosophy, real-time sync
- [pnpm Workspaces Documentation](https://pnpm.io/workspaces) — Official pnpm workspace guide
- [node-postgres Documentation](https://node-postgres.com/) — Official pg driver for PostgreSQL
- [PostgreSQL 17 Documentation](https://www.postgresql.org/docs/17/) — Official PostgreSQL docs
- [Indonesian Ministry of Education - NISN Portal](https://www.kemendikbudristek.com/nisn.data-sub/) — Official student ID system
- [Kurikulum Merdeka Official Documentation](https://www.kemendikbudristek.com/) — Current Indonesian curriculum (implemented March 2024)

### Secondary (MEDIUM confidence)
- [Build a Kanban Board With Drag-and-Drop in React (Marmelab, Jan 2026)](https://marmelab.com/blog/2026/01/15/building-a-kanban-board-with-shadcn.html) — Latest Kanban tutorial
- [Shadcn Kanban Component](https://www.shadcn.io/components/data/kanban) — Official shadcn Kanban (July 2025)
- [Architectures for Multi-Agent Systems (Galileo AI, Sept 2025)](https://galileo.ai/blog/architectures-for-multi-agent-systems) — Multi-agent patterns
- [Router-Based Agents: The Architecture Pattern That Makes AI Systems Scale (Towards AI, Dec 2025)](https://pub.towardsai.net/router-based-agents-the-architecture-pattern-that-makes-ai-systems-scale-a9cbe3148482) — Agent routing strategies
- [The 2026 Guide to AI Agent Workflows (Vellum, 2026)](https://www.vellum.ai/blog/agentic-workflows-emerging-architectures-and-design-patterns) — Emerging architectures
- [10 Essential Tips for New Convex Developers (Schemets, Nov 2025)](https://schemets.com/blog/10-convex-developer-tips-pitfalls-productivity) — Convex best practices
- [Self-Hosting with Convex (Convex Stack)](https://stack.convex.dev/self-hosted-develop-and-deploy) — Official self-hosting guide
- [Database Design for School Management (Back4App)](https://www.back4app.com/tutorials/how-to-build-a-database-schema-for-school-management-software) — Schema design tutorial
- [How to Build a School Management System (Dev.to, June 2025)](https://dev.to/code_2/how-to-build-a-school-management-system-a-complete-guide-with-code-snippets-1ln6) — Complete MERN stack guide
- [Penetration Testing of Electron-based Applications (Deepstrike, Oct 2025)](https://deepstrike.io/blog/penetration-testing-of-electron-based-applications) — Security patterns

### Tertiary (LOW confidence)
- [Clean Battle-Tested Vite React TypeScript Electron App Build (Plain English, June 2025)](https://python.plainenglish.io/clean-battle-tested-vite-react-typescript-electron-app-build-3e6d4815bd4b) — Modern setup guide
- [Why Electron Projects Recommend Monorepo Architecture (Juejin, Oct 2025)](https://juejin.cn/post/7565204846044102671) — Monorepo patterns
- [buqiyuan/electron-vite-monorepo (GitHub)](https://github.com/buqiyuan/electron-vite-monorepo) — Open source example
- [react-kanban-kit (GitHub)](https://github.com/braiekhazem/react-kanban-kit) — Kanban library reference (Aug 2025)
- [Clay Code Generator (GitHub)](https://github.com/morkeleb/clay) — Template-based codegen reference

---
*Research completed: 2026-01-18*
*Ready for roadmap: yes*
