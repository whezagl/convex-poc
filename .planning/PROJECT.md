# AI Agents POC

## What This Is

A multi-agent autonomous coding system using Claude Agent SDK integrated with Convex, now with an Electron Kanban UI for visual task management. The system combines specialized CRUD agents (BE/FE/UI) with general-purpose agents (Planner→Coder→Reviewer) to scaffold full-stack applications from DDL, featuring parallel sub-task execution, real-time progress tracking, and template-based code generation.

## Core Value

**Demonstrate working multi-agent coordination with clean, reusable patterns.**

If everything else fails, the agent orchestration pattern must work and the code must be understandable for future reference.

## Requirements

### Validated

- ✓ Multi-agent orchestration system using Claude Agent SDK — v0.3
- ✓ Self-hosted Convex backend via Docker Compose for development — v0.3
- ✓ Convex backend for agent state storage (sessions, orchestration state, workflow progress) — v0.3
- ✓ Three agent types with distinct responsibilities — v0.3
  - **Planner**: Breaks down tasks into implementation steps
  - **Coder**: Implements code based on the plan with actual file writing
  - **Reviewer**: Validates implementation against requirements by reading actual files
- ✓ Agent-to-agent communication and handoff patterns — v0.3
- ✓ Real-time workflow state sync via Convex — v0.3
- ✓ Filesystem for code artifacts (separate from agent state) — v0.3
- ✓ Clean TypeScript codebase demonstrating reusable patterns — v0.3
- ✓ Simple example task demonstrating end-to-end workflow — v0.3

### Active

## Current Milestone: v1.0 Electron Kanban Board

**Goal:** Add Electron UI with 4-column Kanban board for visual task management and specialized CRUD agents for template-based code generation.

**Target features:**
- Electron Kanban UI with 4 columns (Tasks, In Progress, Sub-tasks, Done)
- 5 Specialized CRUD agents: BE Boilerplate, FE Boilerplate, BE CRUD APIs, FE CRUD Services, UI CRUD Pages
- Keyword-based agent detection (auto-parse task description)
- Parallel sub-task execution with priority-based ordering
- Real-time progress tracking via Convex
- Template system with `.templates/` directory (user-customizable)
- Sample School-ERP DDL with 20+ tables and npm run seeds
- PostgreSQL in Docker for development
- Task limits (max 5 concurrent tasks, 5 sub-tasks per task)
- Logs modal with real-time streaming output
- Archive view for completed tasks
- Dark mode support

### Out of Scope

- **Graphiti memory system** — Convex provides persistent state; no additional memory system needed
- **Git worktree isolation** — Simplified workspace management; focus on agent patterns
- **Python backend** — Architecture decision to use pure TypeScript/Node with Convex
- **MCP integrations** — Focus on Claude SDK agent patterns; external integrations add scope
- **Production-grade security** — Learning environment; security patterns can be added later
- **Complex state machines** — Simple sequential workflow (Planner→Coder→Reviewer) for POC
- **Cloud Convex deployment** — Self-hosted Docker Compose only; cloud deployment adds complexity
- **Production Docker setup** — Development-focused Docker Compose; production orchestration (K8s, etc.) out of scope

## Context

**Current State:** Shipped v0.3 with complete multi-agent workflow (12 phases, 14 plans). All core requirements validated and working end-to-end.

Inspired by the Auto-Claude project (`/Users/wharsojo/dev/Auto-Claude2`), which implements a full-featured multi-agent framework in Python. This POC reimagines the core concepts in TypeScript/Node with Convex to:

1. **Learn** the Claude Agent SDK and multi-agent orchestration patterns
2. **Demonstrate** that agent coordination can work with Convex for state management
3. **Explore** Convex as a real-time backend for agent workflows
4. **Create** reusable patterns for future agent-based projects

The Auto-Claude architecture shows a proven pattern: Planner → Coder → QA Reviewer → QA Fixer. This POC simplifies to Planner → Coder → Reviewer for learning purposes.

**Convex Integration (Implemented):**
- Self-hosted Convex via Docker Compose for local development
- Convex stores agent sessions, orchestration state, and workflow progress
- Claude Agent SDK functions run as Convex actions
- Real-time sync of agent state across CLI instances
- Filesystem for code artifacts (separation of concerns)
- GLM-4.7 model support via environment variables

**Technical Details:**
- ~9,216 lines of TypeScript
- 14 plans completed across 12 phases
- Total execution time: 172 minutes (2h 52m)
- 6 Convex functions deployed (3 mutations, 3 queries)
- End-to-end workflow verified with real API calls

## Constraints

- **Tech Stack**: TypeScript/Node + Convex — No Python backend; aligns with user's existing skills
- **Claude SDK**: Must use @anthropic-ai/claude-agent-sdk — Core dependency for agent sessions
- **Convex**: Self-hosted via Docker Compose — Development environment consistency
- **Docker**: Docker Compose required for local Convex deployment
- **Learning Focus**: Code clarity over optimization — Patterns must be understandable for future reference

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| TypeScript/Node over Python | User's primary stack; simplifies local development; demonstrates cross-platform patterns | ✓ Good — Clean agent patterns, reusable for future projects |
| Self-hosted Convex via Docker | Development environment consistency; no external service dependencies | ✓ Good — Docker Compose setup works smoothly |
| Convex for agent state storage | Real-time sync, persistent sessions, orchestration state without database complexity | ✓ Good — 6 functions deployed, real-time tracking works |
| Filesystem for code artifacts | Separation of concerns: Convex for state, files for code | ✓ Good — File operations implemented end-to-end in v0.3 |
| Claude SDK as Convex actions | Leverage Convex's function execution for agent orchestration | ✓ Good — Actions integrated, sessions tracked |
| Simplified agent pipeline (3 vs 4 agents) | Learning POC - focus on core coordination patterns; QA Fixer can be added later | ✓ Good — Planner→Coder→Reviewer pattern works well |
| CLI-first design | Remove UI complexity; agents are the focus, not the interface | ✓ Good — Example demonstrates full workflow |
| GLM-4.7 integration via env vars | Support alternative LLM provider through existing SDK options | ✓ Good — env option in buildOptions() enables dual provider support |
| No external memory system | Convex provides persistent state; no additional Graphiti/memory system needed | ✓ Good — Convex state storage sufficient for POC |
| No cloud Convex deployment | Self-hosted only for POC; cloud deployment adds complexity | ✓ Good — Local development environment complete |

---
*Last updated: 2026-01-18 after starting v1.0 milestone*
