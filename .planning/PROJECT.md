# AI Agents POC

## What This Is

A learning-focused proof-of-concept for building autonomous coding agents using the Claude Agent SDK integrated with Convex for persistent state management. The project demonstrates multi-agent coordination patterns where specialized agents (Planner, Coder, Reviewer) collaborate to complete coding tasks autonomously, with Convex providing real-time agent state storage and orchestration tracking.

## Core Value

**Demonstrate working multi-agent coordination with clean, reusable patterns.**

If everything else fails, the agent orchestration pattern must work and the code must be understandable for future reference.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Multi-agent orchestration system using Claude Agent SDK
- [ ] Self-hosted Convex backend via Docker Compose for development
- [ ] Convex backend for agent state storage (sessions, orchestration state, workflow progress)
- [ ] Claude Agent SDK functions exposed as Convex actions
- [ ] Three agent types with distinct responsibilities:
  - **Planner**: Breaks down tasks into implementation steps
  - **Coder**: Implements code based on the plan
  - **Reviewer**: Validates implementation against requirements
- [ ] Agent-to-agent communication and handoff patterns
- [ ] Real-time workflow state sync via Convex
- [ ] Filesystem for code artifacts (separate from agent state)
- [ ] Clean TypeScript codebase demonstrating reusable patterns
- [ ] Simple example task demonstrating end-to-end workflow

### Out of Scope

- **Graphiti memory system** — Convex provides persistent state; no additional memory system needed
- **Git worktree isolation** — Simplified workspace management; focus on agent patterns
- **Electron UI** — CLI-first design; UI is separate concern
- **Python backend** — Architecture decision to use pure TypeScript/Node with Convex
- **MCP integrations** — Focus on Claude SDK agent patterns; external integrations add scope
- **Production-grade security** — Learning environment; security patterns can be added later
- **Complex state machines** — Simple sequential workflow (Planner→Coder→Reviewer) for POC
- **Cloud Convex deployment** — Self-hosted Docker Compose only; cloud deployment adds complexity
- **Production Docker setup** — Development-focused Docker Compose; production orchestration (K8s, etc.) out of scope

## Context

Inspired by the Auto-Claude project (`/Users/wharsojo/dev/Auto-Claude2`), which implements a full-featured multi-agent framework in Python. This POC reimagines the core concepts in TypeScript/Node with Convex to:

1. **Learn** the Claude Agent SDK and multi-agent orchestration patterns
2. **Demonstrate** that agent coordination can work with Convex for state management
3. **Explore** Convex as a real-time backend for agent workflows
4. **Create** reusable patterns for future agent-based projects

The Auto-Claude architecture shows a proven pattern: Planner → Coder → QA Reviewer → QA Fixer. This POC simplifies to Planner → Coder → Reviewer for learning purposes.

**Convex Integration:**
- Self-hosted Convex via Docker Compose for local development
- Convex stores agent sessions, orchestration state, and workflow progress
- Claude Agent SDK functions run as Convex actions
- Real-time sync of agent state across CLI instances
- Filesystem remains for code artifacts (separation of concerns)
- Docker Compose for reproducible development environment

## Constraints

- **Tech Stack**: TypeScript/Node + Convex — No Python backend; aligns with user's existing skills
- **Claude SDK**: Must use @anthropic-ai/claude-agent-sdk — Core dependency for agent sessions
- **Convex**: Self-hosted via Docker Compose — Development environment consistency
- **Docker**: Docker Compose required for local Convex deployment
- **Learning Focus**: Code clarity over optimization — Patterns must be understandable for future reference

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| TypeScript/Node over Python | User's primary stack; simplifies local development; demonstrates cross-platform patterns | — Pending |
| Self-hosted Convex via Docker | Development environment consistency; no external service dependencies | — Pending |
| Convex for agent state storage | Real-time sync, persistent sessions, orchestration state without database complexity | — Pending |
| Filesystem for code artifacts | Separation of concerns: Convex for state, files for code | — Pending |
| Claude SDK as Convex actions | Leverage Convex's function execution for agent orchestration | — Pending |
| Simplified agent pipeline (3 vs 4 agents) | Learning POC - focus on core coordination patterns; QA Fixer can be added later | — Pending |
| CLI-first design | Remove UI complexity; agents are the focus, not the interface | — Pending |
| No external memory system | Convex provides persistent state; no additional Graphiti/memory system needed | — Pending |
| No cloud Convex deployment | Self-hosted only for POC; cloud deployment adds complexity | — Pending |

---
*Last updated: 2026-01-16 after adding Docker Compose for Convex*
