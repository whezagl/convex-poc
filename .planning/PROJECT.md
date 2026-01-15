# AI Agents POC

## What This Is

A learning-focused proof-of-concept for building autonomous coding agents using the Claude Agent SDK in pure TypeScript/Node. The project demonstrates multi-agent coordination patterns where specialized agents (Planner, Coder, Reviewer) collaborate to complete coding tasks autonomously.

## Core Value

**Demonstrate working multi-agent coordination with clean, reusable patterns.**

If everything else fails, the agent orchestration pattern must work and the code must be understandable for future reference.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Multi-agent orchestration system using Claude Agent SDK
- [ ] Three agent types with distinct responsibilities:
  - **Planner**: Breaks down tasks into implementation steps
  - **Coder**: Implements code based on the plan
  - **Reviewer**: Validates implementation against requirements
- [ ] Agent-to-agent communication and handoff patterns
- [ ] Clean TypeScript codebase demonstrating reusable patterns
- [ ] Simple example task demonstrating end-to-end workflow

### Out of Scope

- **Graphiti memory system** — Out of scope for learning POC; adds significant complexity
- **Git worktree isolation** — Simplified workspace management; focus on agent patterns
- **Electron UI** — CLI-first design; UI is separate concern
- **Python backend** — Architecture decision to use pure TypeScript/Node
- **MCP integrations** — Focus on Claude SDK agent patterns; external integrations add scope
- **Production-grade security** — Learning environment; security patterns can be added later

## Context

Inspired by the Auto-Claude project (`/Users/wharsojo/dev/Auto-Claude2`), which implements a full-featured multi-agent framework in Python. This POC reimagines the core concepts in TypeScript/Node to:

1. **Learn** the Claude Agent SDK and multi-agent orchestration patterns
2. **Demonstrate** that agent coordination can work in a pure Node.js environment
3. **Create** reusable patterns for future agent-based projects

The Auto-Claude architecture shows a proven pattern: Planner → Coder → QA Reviewer → QA Fixer. This POC simplifies to Planner → Coder → Reviewer for learning purposes.

## Constraints

- **Tech Stack**: TypeScript/Node only — No Python backend; aligns with user's existing skills and project context
- **Claude SDK**: Must use @anthropic-ai/sdk (Claude Agent SDK) — Core dependency for agent sessions
- **Learning Focus**: Code clarity over optimization — Patterns must be understandable for future reference

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| TypeScript/Node over Python | User's primary stack; simplifies local development; demonstrates cross-platform patterns | — Pending |
| Simplified agent pipeline (3 vs 4 agents) | Learning POC - focus on core coordination patterns; QA Fixer can be added later | — Pending |
| CLI-first design | Remove UI complexity; agents are the focus, not the interface | — Pending |
| No memory system (Graphiti) | Significant complexity; out of scope for learning POC; can add in v2 | — Pending |

---
*Last updated: 2026-01-16 after initialization*
